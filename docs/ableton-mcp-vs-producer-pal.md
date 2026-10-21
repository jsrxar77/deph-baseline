# Comparativa de Integración IA en Ableton Live: AbletonMCP vs Producer Pal vs AbletonOSC

Este documento responde a la investigación técnica sobre el control de Ableton Live mediante Inteligencia Artificial, abarcando la inspección de dispositivos, modificación de parámetros nativos, control de macros/parámetros en plugins VST/AU y lanzamiento de clips.

---

## 🎯 Veredicto Ejecutivo (¿Se puede usar para eso?)

**SÍ, SE PUEDE**. Ambas soluciones principales (`ableton-mcp` y `Producer Pal`) permiten a la IA:
1. **Inspeccionar dispositivos cargados** en cualquier pista en tiempo real.
2. **Modificar parámetros de dispositivos nativos** (filtros, frecuencias, ganancias, Q, dry/wet, thresholds, etc.).
3. **Mover Macros en Racks** (controlando indirectamente cualquier VST o cadena de efectos compleja).
4. **Lanzar y detener clips** en la Session View (`fire_clip`, `stop_clip`).
5. **Controlar el transporte global** (`play`, `stop`, `tempo`, `locators`).

### La regla universal del Live Object Model (LOM) sobre VSTs
Ni AbletonOSC, ni AbletonMCP, ni Producer Pal pueden mover los parámetros internos de un plugin VST3/AU (como Surge XT o Serum 2) **si el plugin está suelto y sin mapear**. Ableton Live oculta los parámetros internos de los plugins por razones de rendimiento de la API.

**La solución estándar de producción**:
* Agrupar el VST en un **Instrument Rack** (`Cmd+G`) y mapear los parámetros deseados a los **Macros 1..16**.
* Una vez mapeados a Macros, **tanto AbletonMCP como Producer Pal pueden leerlos y moverlos directamente**.

---

## 📊 Matriz Comparativa Detallada

| Característica | **AbletonMCP** (Actual) | **Producer Pal** | **AbletonOSC** |
| :--- | :--- | :--- | :--- |
| **Tecnología base** | Python MIDI Remote Script | Max for Live Device (`.amxd`) + Node | Python MIDI Remote Script |
| **Capa de transporte** | TCP Socket (`127.0.0.1:9877`) | REST HTTP/WebSocket (`localhost:3350`) | UDP OSC (`localhost:11000`) |
| **Protocolo IA** | MCP directo / Socket JSON | MCP CLI (`producer-pal`) / REST API | No es MCP nativo (requiere bridge) |
| **Instalación requerida** | Carpeta `Remote Scripts/` (hecho) | Instalar `.amxd` y arrastrar a una pista | Carpeta `Remote Scripts/` |
| **Inspección de dispositivos** | ✅ `get_device_parameters` | ✅ `ppal-read-device` | ✅ `/live/device/get/parameters` |
| **Modificar parámetros** | ✅ `set_device_parameter` | ✅ `ppal-update-device` | ✅ `/live/device/set/parameter/value` |
| **Carga de VSTs por browser** | ✅ `load_instrument_or_effect` | ✅ Búsqueda en biblioteca | ⚠️ Limitado |
| **Lanzamiento de clips** | ✅ `fire_clip`, `stop_clip` | ✅ `ppal-actions` | ✅ `/live/clip/fire` |
| **Edición musical de clips** | ✅ Notas MIDI por JSON | ✅ Notación de texto LLM compacta | ✅ Rápido |
| **Gestión de Samples / Drum Racks**| ⚠️ Básico | ✅ Avanzado (Simpler / Drum Racks) | ⚠️ Básico |

---

## 🚀 Cómo Usar el Controlador Activo (`tools/sounds/ableton-controller.mjs`)

Para no depender de herramientas externas complejas, el repositorio dispone de su propia herramienta CLI conectada al socket activo de Ableton:

```bash
# 1. Inspeccionar EQ Eight en la pista 0 (Ch 1)
node tools/sounds/ableton-controller.mjs inspect 0 1

# 2. Modificar un parámetro específico en tiempo real
node tools/sounds/ableton-controller.mjs set 3 1 "2 Gain A" -2.5

# 3. Lanzar un clip de la pista 2 en Session View
node tools/sounds/ableton-controller.mjs fire 2 0

# 4. Detener reproducción
node tools/sounds/ableton-controller.mjs stop
```

---

## ⚙️ Pasos para Instalar y Activar Producer Pal (Opcional)

Si se desea utilizar Producer Pal en conjunto con Ableton 12 Suite:
1. Descargar `Producer_Pal.amxd` desde [producer-pal.org](https://producer-pal.org).
2. Colocarlo en: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/Producer_Pal.amxd`.
3. Arrastrarlo a una pista MIDI en Ableton Live.
4. El dispositivo levantará el servidor REST en `http://localhost:3350`.
5. Ejecutar `npx producer-pal@latest` para vincular las herramientas MCP `ppal-*`.
