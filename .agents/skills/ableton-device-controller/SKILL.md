---
name: ableton-device-controller
description: Deep inspection and real-time control of devices, native parameters, VST/AU rack macros, and clip launching in Ableton Live via AbletonMCP and Producer Pal.
---

# Ableton Device & Parameter Controller

Control and inspect Ableton Live 12 devices, automate parameters in real time, map VST macros, and launch Session clips from the agent.

---

## 🏛️ Veredicto Técnico: ¿Se puede usar para eso?

**SÍ, 100% AUTOMATIZADO**, combinando las dos herramientas complementarias:

| Capacidad | Herramienta | ¿Cómo se ejecuta? |
| :--- | :--- | :--- |
| **Dispositivos Nativos de Ableton** (EQ Eight, Utility, Compressor, Limiter...) | **AbletonMCP + Producer Pal** | Ableton expone todos sus parámetros nativamente en `device.parameters`. Se leen y cambian por socket o HTTP con precisión decimal. |
| **Envolver VSTs en Racks Automáticamente (`wrapInRack`)** | **Producer Pal** | `node tools/sounds/ableton-controller.mjs wrap <track>` ejecuta `wrapInRack: true`, instanciando un Instrument Rack y moviendo el VST adentro sin requerir clics manuales. |
| **Cadena de Masterización en Master Track (`mt`)** | **Producer Pal** | `node tools/sounds/ableton-controller.mjs master-setup` crea y calibra EQ Eight (25Hz HP), Glue Compressor (2:1 Auto), y Limiter (-1.0 dBTP True Peak). |
| **Macros de Instrument Racks (`Macro 1..16`)** | **Ambos** | Los 16 Macros están expuestos en `device.parameters`. Se modulan en tiempo real para respiración de filtros y dinámicas. |
| **Provisionamiento de Pistas y Carga de VSTs** | **AbletonMCP** | Carga directa por URI (`query:Plugins#VST3:...`) sin latencia vía TCP 9877. |

---

## 🛠️ Herramienta CLI Directa del Repositorio: `ableton-controller.mjs`

El proyecto cuenta con un controlador nativo en Node.js que se conecta al socket TCP de Ableton (`127.0.0.1:9877`):

### 1. Ver el estado de toda la sesión (pistas, racks y master)
```bash
node tools/sounds/ableton-controller.mjs tracks
```

### 2. Envolver cualquier instrumento en un Instrument Rack automáticamente
```bash
node tools/sounds/ableton-controller.mjs wrap <track_index> [rack_name]
```
*Ejemplo:* Envolver el sinte de la pista 0:
```bash
node tools/sounds/ableton-controller.mjs wrap 0 "Primordial Drone Rack"
```

### 3. Configurar la Cadena de Masterización completa
```bash
node tools/sounds/ableton-controller.mjs master-setup
```
Crea en `mt` el EQ Eight (corte 25 Hz), Glue Compressor (2:1 Auto), y Limiter (-1.0 dBTP True Peak).

### 4. Inspeccionar cualquier dispositivo cargado
```bash
node tools/sounds/ableton-controller.mjs inspect <track_index> [device_index]
```
*Ejemplo:* Inspeccionar los Macros del Instrument Rack en la pista 0:
```bash
node tools/sounds/ableton-controller.mjs inspect 0 0
```

### 5. Modificar parámetros y Macros en tiempo real
```bash
node tools/sounds/ableton-controller.mjs set <track_index> <device_index> <param_name_or_index> <value>
```
*Ejemplos:*
* Abrir el Macro 1 de un Rack (Cutoff/Presencia):
  ```bash
  node tools/sounds/ableton-controller.mjs set 0 0 "Macro 1" 64.0
  ```
* Activar y calibrar filtro en EQ Eight:
  ```bash
  node tools/sounds/ableton-controller.mjs set 0 1 "1 Filter On A" 1.0
  node tools/sounds/ableton-controller.mjs set 0 1 "1 Frequency A" 0.15
  ```

### 6. Ejecutar herramientas directas de Producer Pal (HTTP 3350)
```bash
node tools/sounds/ableton-controller.mjs ppal <ppal-tool> '<json_args>'
```
*Ejemplo:* Leer el estado global del Live Set:
```bash
node tools/sounds/ableton-controller.mjs ppal ppal-read-live-set '{}'
```

### 7. Lanzar y Detener Clips en Session View
```bash
# Lanzar clip 0 de la pista 1
node tools/sounds/ableton-controller.mjs fire 0 0

# Detener clip de la pista 1
node tools/sounds/ableton-controller.mjs stop 0 0

# Detener reproducción global
node tools/sounds/ableton-controller.mjs stop

# Iniciar reproducción global
node tools/sounds/ableton-controller.mjs play
```

---

## ⚖️ Comparativa: `ableton-mcp` vs `Producer Pal` vs `AbletonOSC`

### 1. `ableton-mcp` (wstierhout/ableton-live-mcp) — *Activo en este proyecto*
* **Tecnología**: Python Remote Script (`~/Music/Ableton/User Library/Remote Scripts/AbletonMCP/`).
* **Protocolo**: TCP Socket en `127.0.0.1:9877`.
* **Ventajas**:
  * Funciona de forma totalmente invisible en segundo plano tan pronto abre Ableton.
  * No ensucia las pistas con dispositivos auxiliares.
  * Soporta carga de VST3 por URI de browser (`query:Plugins#VST3:...`).
  * Cero latencia en llamadas atómicas.
* **Uso ideal**: Provisionamiento automático de pistas, carga de VSTs, despliegue de MIDI en Arrangement, EQ y mezcla.

### 2. `Producer Pal` (Adam Murray / producer-pal.org)
* **Tecnología**: Max for Live device (`Producer_Pal.amxd`) + Servidor Node.js (Node for Max).
* **Protocolo**: Servidor REST HTTP/WebSocket en `http://localhost:3350` + CLI MCP (`npx producer-pal`).
* **Ventajas**:
  * Diseñado específicamente como asistente de IA musical con prompts de lenguaje natural.
  * Notación compacta de clips MIDI optimizada para tokens de LLMs.
  * Soporta reemplazo de samples en *Simpler* y configuración de pads en *Drum Racks*.
  * Incluye la herramienta `ppal-live-api` como escape-hatch para ejecutar código LOM directo.
* **Desventaja / Requisito**:
  * Requiere tener cargado el dispositivo `Producer_Pal.amxd` en una pista MIDI de la sesión activa en Ableton. Si el dispositivo no está en la sesión, el puerto 3350 no responde.

### 3. `AbletonOSC` (ideoforms/AbletonOSC)
* **Tecnología**: Python Remote Script.
* **Protocolo**: UDP Open Sound Control (OSC) en puerto 11000.
* **Uso ideal**: Integración con TouchOSC, StreamDeck (Bitfocus Companion) o entornos de live-coding como SuperCollider. No es un protocolo MCP directo para agentes IA.

---

## 📥 Guía de Instalación de Producer Pal (Paso a Paso)

Si deseas añadir Producer Pal a tu flujo de trabajo en Ableton Live 12 Suite:

1. **Descargar el dispositivo Max for Live**:
   * Descarga `Producer_Pal.amxd` desde [producer-pal.org](https://producer-pal.org).
2. **Ubicar en la User Library**:
   * Cópialo en tu carpeta de efectos Max:
     `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/Producer_Pal.amxd`
3. **Cargar en la Sesión**:
   * Abre Ableton Live 12.
   * Arrastra `Producer_Pal.amxd` a cualquier pista MIDI (o a una pista auxiliar dedicada).
   * La interfaz de la pantalla del dispositivo mostrará que el servidor local está activo en el puerto `3350`.
4. **Conectar el MCP**:
   * Ejecuta: `npx -y producer-pal@latest` o agrégalo a tu configuración MCP.
   * La IA dispondrá de las 21 herramientas `ppal-*` (`ppal-read-device`, `ppal-update-device`, etc.).

---

## 🎹 Protocolo para Automatizar VSTs de Terceros (Surge XT / Serum 2)

Cuando quieras que la IA modifique parámetros internos de un VST:
1. En Ableton Live, selecciona el VST (ej. `Surge XT`).
2. Presiona `Cmd + G` para agruparlo en un **Instrument Rack**.
3. Abre la vista de Macros del Rack (botón con perillas a la izquierda).
4. Haz clic derecho en el knob deseado dentro del VST (o usa el botón "Map" del Rack) y asígnalo a **Macro 1** (ej. *Cutoff*), **Macro 2** (ej. *Release*), etc.
5. Ejecuta:
   ```bash
   node tools/sounds/ableton-controller.mjs set <track_index> 0 "Macro 1" <valor>
   ```
La IA ahora puede modular, calibrar y automatizar ese sinte analógico o digital sin ninguna limitación.
