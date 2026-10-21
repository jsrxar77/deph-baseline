# Flujo Canónico de Aprovisionamiento en Ableton Live

Este documento define el protocolo paso a paso estricto y autocontenido para inicializar, aprovisionar y cargar cualquier composición de Strudel en Ableton Live 12 dentro de `deph-baseline`.

---

## 🏛️ Reglas Cardinales

1. **Autocontención Absoluta**: Todo vive dentro de `deph-baseline` (`template/Strudel Temaplte.als`, `tools/sounds/`, `.agents/`). Cero referencias o llamadas a rutas relativas externas (`../`).
2. **Prohibido abrir programas sin orden del usuario**: El agente nunca debe ejecutar comandos para lanzar aplicaciones en el sistema operativo a menos que el usuario lo solicite de forma explícita.
3. **Paso a Paso y Validación Atómica**: Nunca ejecutar múltiples fases juntas. Cada paso se define, se aprueba con el usuario, se ejecuta y se valida antes de continuar.
4. **No Re-crear Pistas**: El template (`template/Strudel Temaplte.als`) ya contiene las pistas MIDI configuradas con `All Ins`, canales 1-16 y `Monitoring: In`. No se crean pistas manualmente; se usan las del template.

---

## 📋 Fases del Flujo Canónico

### PASO 1: Verificación de Conexión (Solo Lectura)
* **Objetivo**: Confirmar que Ableton Live está abierto y respondiendo por el socket TCP `127.0.0.1:9877`.
* **Comando**: `get_session_info`.
* **Verificación**: Conexión exitosa, lectura de `tempo` y `track_count`.

### PASO 2: Carga del Template
* **Objetivo**: Asegurar que la sesión activa es el template base de 8/16 canales.
* **Comando**: Apertura de `template/Strudel Temaplte.als`.
* **Verificación**: `get_session_info` devuelve `track_count: 8` y canales listos.

### PASO 3: Aprovisionamiento Atómico Pista por Pista
Por cada pista requerida por el manifiesto `<name>.yaml` (de la pista 1 a la N), se ejecuta **una a la vez**:
1. **Asignación de Nombre Canónico**: `set_track_name(track_index, "Ch {N} - {Rol} ({VST} - {Preset})")`.
   * Formato estricto: incluye Canal, Rol, VST y Nombre del Preset real.
   * Ejemplos: `Ch 1 - Earth Pulse (Surge XT - Kick Tech 1)`, `Ch 2 - Grounding Sub (Surge XT - Sub 1)`.
2. **Carga Inmediata de Instrumento**: `load_instrument_or_effect(track_index, uri)`.
   * Surge XT: `query:Plugins#VST3:Surge%20Synth%20Team:Surge%20XT`
   * Serum 2: `query:Plugins#VST3:Xfer%20Records:Serum%202`
   * Utility / Efectos nativos: `query:AudioFx#Utility`
3. **Hard Verification Gate Inmediato**: Consultar `get_track_info(track_index)` y verificar que `devices` **no esté vacío**.
4. **Protocolo Obligatorio de Comunicación y Handoff (Agente vs Usuario)**:
   * El agente DEBE reportar explícitamente al usuario:
     1. **Lo que hizo el agente automáticamente**: Pista renombrada y VST instanciado y verificado en `devices`.
     2. **Lo que le queda al usuario manualmente**: Indicar la categoría, el nombre literal del preset verificado en disco y los ajustes finos (ej. *Vel > Gain en −40 dB*) para que el usuario los seleccione en la ventana gráfica del VST en Ableton.
   * El paso NO se da por finalizado hasta que el usuario confirma que seleccionó el preset en el sintetizador.
5. **Control**: Si una pista tiene `devices: []`, está prohibido avanzar a la siguiente pista.

### PASO 4: Sincronización Global de Tempo y Snapshot
* **Objetivo**: Fijar el tempo exacto de la pieza (`set_tempo(bpm)`) y tomar `get_session_snapshot`.
* **Verificación**: Todas las pistas activas deben tener sus nombres y sus instrumentos cargados.

### PASO 5: Audición y Prueba en Vivo (Play Strudel)
* **Objetivo**: Escuchar la música sonar en tiempo real a través de los instrumentos reales en Ableton.
* **Mecanismo**: El código `.strudel` se reproduce emitiendo eventos MIDI multicanal en vivo por el bus `IAC Driver Bus 1` hacia Ableton (cuyas pistas están en `Monitoring: In`).
* **Propósito**: Ajustar presets en los sintetizadores, dinámicas y texturas en caliente antes de consolidar.

### PASO 6: Consolidación en Arrangement (Fase Posterior)
* **Solo cuando la composición en vivo está definida**:
  1. Despliegue de notas en la línea de tiempo de Arrangement (`duplicate_session_clip_to_arrangement`).
  2. Inserción de localizadores de sección (`create_locator`).
  3. Gain staging con `Utility` en cada pista y masterización.
