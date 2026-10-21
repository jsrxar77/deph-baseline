---
name: strudel-producer-suite
description: Master orchestrator skill for the complete algorithmic music production lifecycle in Strudel and Ableton Live (Composition -> Provisioning -> Arrangement MIDI -> Mixing & Mastering).
---

# Strudel Producer Suite: Workflow Completo de Producción End-to-End

Este skill es el **Orquestador Maestro** que gobierna todo el ciclo de vida de producción musical algorítmica: desde el diseño conceptual en Strudel hasta la pista terminada y masterizada en la vista Arrangement de Ableton Live.

---

## 🏗️ 1. Arquitectura de las 4 Fases

```
┌────────────────────────┐      ┌────────────────────────┐
│  FASE 1: COMPOSICIÓN   │ ───> │ FASE 2: PROVISIONING   │
│  Strudel + YAML        │      │ Plugins & 8-Ch Template│
└────────────────────────┘      └────────────────────────┘
            │                               │
            ▼                               ▼
┌────────────────────────┐      ┌────────────────────────┐
│ FASE 3: ARRANGEMENT    │ ───> │ FASE 4: MIX & MASTER   │
│ MIDI Timeline + Locators│     │ Gain Staging + Utility │
└────────────────────────┘      └────────────────────────┘
```

---

## 🎼 2. Fase 1: Composición Algorítmica y Manifiesto Desacoplado

### Reglas No Negociables de Composición:
1. **Separación de Lógica y Sonido:**
   - La lógica musical se programa en `media/<tema>/<tema>.strudel`.
   - El diseño sonoro y ruteo a VSTs se declara en `media/<tema>/<tema>.yaml`.
2. **Definición Obligatoria de Batería General MIDI (Drum Rack C1 = 36):**
   ```javascript
   const drums = { kd: 35, bd: 36, kick: 36, rim: 37, rs: 37, sn: 38, sd: 38, cp: 39, clap: 39, sn2: 40, hh: 42, ch: 42, ph: 44, oh: 46, cr: 49, crash: 49, rd: 51, ride: 51, china: 52, rdbell: 53, splash: 55, lt2: 41, lt: 45, mt: 47, ht: 50, tamb: 54, cb: 56, cowbell: 56, sh: 58, shaker: 58, bongo: 60, conga: 63, timb: 65, agogo: 67, perc: 70, clave: 75 };
   const kit = (p) => s(p).fmap((v) => drums[v.s || v] ?? (Number(v.s || v) || 36)).note();
   ```
3. **Estructura Declarativa de 3 Capas:**
   - **Capa 1 (Stems):** Motivos musicales aislados por canal MIDI (`.midichan(1..8)`).
   - **Capa 2 (Escenas / Partes):** Combinaciones de stems usando `stack(...)` (Intro, Build-Up, Drop, Breakdown, Climax, Outro).
   - **Capa 3 (Línea de Tiempo Maestra):** Secuenciador `arrange([compases, escena], ...)` en el stream principal `$:` con compases explícitos.
4. **Catálogo de Plugins y Presets Reales (Protocolo Pre-Flight Obligatorio):**
   - **PROHIBIDO ALUCINAR O ADIVINAR**: El agente no puede sugerir ni escribir en el `.yaml` ningún VST o preset sin verificar antes que exista en el sistema.
   - Cruzar el VST con [.agents/catalogs/plugins.json](file:///.agents/catalogs/plugins.json).
   - Inspeccionar las rutas reales de presets en disco (`/Library/Application Support/...`, `~/Library/Audio/Presets/...`, etc.) o el navegador MCP para extraer los nombres literales y categorías reales.

---

## 🔌 3. Fase 2: Aprovisionamiento de Sesión en Ableton Live

1. **Plantilla Estándar de 8 Canales:**
   - Sesión activa basada en `media/template/Strudel Temaplte.als` (pistas 1 a 8 ruteadas 1:1 a canales MIDI 1 a 8 con monitoreo en *In*).
2. **Carga Automática de Instrumentos:**
   - Por cada canal activo en el `.yaml`, llamar a `load_instrument_or_effect` en AbletonMCP (VST3 de terceros o presets nativos).
   - Asignar nombres descriptivos con `set_track_name`.
   - Sincronizar tempo de la sesión con `set_tempo`.
3. **Puerta de Verificación Estricta:**
   - Consultar `get_session_snapshot`.
   - **PROHIBIDO:** No se puede continuar a la siguiente fase si alguna pista activa tiene `devices: []`.

---

## 🚀 4. Fase 3: Despliegue de Arreglo y MIDI a Arrangement

### Herramienta Automatizada:
```bash
npm run deploy:arrangement media/<tema>/<tema>.strudel
```

### Proceso Ejecutado por [scripts/deploy_arrangement.js](file:///scripts/deploy_arrangement.js):
1. **Transpilación y Evaluación:** Analiza el archivo `.strudel` y extrae compases totales (ej. 200 compases = 800 beats) y localizadores de estructura a partir del bloque `arrange(...)`.
2. **Extracción Polifónica de Notas:** Mapea notas con pitch GM para percusión, afinaciones reales para sintetizadores, duraciones precisas y velocidades dinámicas.
3. **Inyección por Socket TCP (puerto 9877):**
   - Crea y limpia clips de sesión de longitud completa.
   - Envía las notas en lotes estables de 400 notas (`add_notes_to_clip`).
   - Duplica los clips a la línea de tiempo de **Arrangement** desde el beat `0.0` (`duplicate_session_clip_to_arrangement`).
   - Nombra los clips en el timeline con el título de la canción y el rol del instrumento.
4. **Localizadores Visuales de Sección:**
   - Inyecta marcadores (`create_locator`) para cada sección (`1. Intro`, `2. Build-Up`, `3. Drop 1`, `4. Breakdown`, `5. Climax`, `6. Outro`, `End`).
5. **Ajuste de Transporte:** Conmuta a la vista Arrangement (`switch_to_arrangement_view`) y sitúa el cabezal en el compás 1.1 (`0.0`).
6. **Respaldo Offline:** Genera archivos `.mid` estándar individuales y consolidado en `media/<tema>/midi_exports/`.

---

## 🎛️ 5. Fase 4: Mezcla, Gain Staging y Masterización

### Herramienta Automatizada:
```bash
npm run master:track media/<tema>/<tema>.strudel
```

### Proceso Ejecutado por [scripts/master_track.js](file:///scripts/master_track.js):
1. **Inserción de Utility por Pista:** Carga el procesador nativo **Utility** (`query:AudioFx#Utility`) en cada pista activa.
2. **Gain Staging y Headroom Protector:**
   - Calibra el trim de salida para garantizar -6 dB de margen dinámico pre-master.
3. **Focalización Mono de Frecuencias Sub (<120 Hz):**
   - Activa `Bass Mono` en pistas de bajo, sub y sintetizadores para evitar cancelaciones de fase en sistemas de club.
4. **Apertura de Campo Estéreo Diferenciada:**
   - Batería: 100% (pegada sólida en el centro).
   - Bajo: 90% (enfoque centrado y controlado).
   - Arpegios / Leads: 120% (apertura binaural atractiva).
   - Pads / Colchones: 135% (amplitud atmosférica inmersiva).
5. **Espacialización y Atmósfera con Reverb:**
   - Carga y calibra automáticamente el procesador nativo **Reverb** (`query:AudioFx#Reverb`):
     - Spiral Arp / Leads: 28% Dry/Wet, Decay Time 2.5s, Room Size 70%.
     - Ethereal Pad: 40% Dry/Wet, Decay Time 4.2s, Room Size 85%.
     - Batería y Bajo: Procesamiento 100% seco (Dry) para mantener pegada y graves limpios.
6. **Cadena de Master Bus (Mastering Chain):**
   - Carga opcional de `EQ Eight` (corte pasa-altos 30 Hz), `Glue Compressor` (1-2 dB pegamento suave), `Saturator` (calidez armónica) y `Limiter` (techo -0.3 dB True Peak).

---

## ⚡ 6. El Comando Maestro Unificado (All-In-One)

Para ejecutar todo el pipeline de principio a fin en una sola orden interactiva:

```bash
npm run produce:all media/<tema>/<tema>.strudel
```

Este comando:
1. Despliega todas las pistas y compases a la vista Arrangement con localizadores.
2. Aplica automáticamente el Gain Staging y balance estéreo con `Utility`.
3. Exporta los archivos MIDI de respaldo en `midi_exports/`.
4. Deja la sesión lista para presionar la **barra espaciadora** y disfrutar la reproducción.

---

## 🏆 6. Fase 5: Exportación de Master, Conversión MP3 y Certificación EBU R128

### Flujo de Lanzamiento:
1. **Render en Ableton Live (Cmd + Shift + R):**
   - Track: `Master` | Start: `1. 1. 1` | Length: `208 Bars` (200 compases de arreglo + 8 compases de cola de Reverb).
   - Formato: WAV 24-bit / 44.1 kHz.
   - Destino: Guardar en `media/<tema>/final/`.
2. **Post-Producción & Certificación Automatizada:**
   ```bash
   npm run finalize media/<tema>
   ```
3. **Proceso Ejecutado por [scripts/finalize_release.js](file:///scripts/finalize_release.js):**
   - Estandariza el nombre oficial del archivo WAV master.
   - Codifica la versión MP3 320 kbps CBR con tags ID3 completos incrustados (Título: *Infinite Consciousness*, Artista: *JR AEON & AGY*, Productor: *JR AEON & AGY*, BPM: 122, Key: D Dorian, Año: 2026).
   - Analiza y certifica la sonoridad con el estándar **EBU R128** (Integrated LUFS, True Peak dBTP, LRA).
   - Genera el reporte oficial de lanzamiento `RELEASE_REPORT.md`.

---

## ⚡ 7. El Comando Maestro Unificado (All-In-One)

Para ejecutar todo el pipeline de principio a fin en una sola orden interactiva:

```bash
npm run produce:all media/<tema>/<tema>.strudel
```

Este comando:
1. Despliega todas las pistas y compases a la vista Arrangement con localizadores.
2. Aplica automáticamente el Gain Staging y balance estéreo con `Utility` y `Reverb`.
3. Exporta los archivos MIDI de respaldo en `midi_exports/`.
4. Deja la sesión lista para presionar la **barra espaciadora** y disfrutar la reproducción.

---

## 📋 8. Matriz de Comandos del Ecosistema

| Comando | Función | Script Subyacente |
| :--- | :--- | :--- |
| `npm run produce:all [tema]` | **Pipeline completo All-in-One** (Arrangement + Mix + MIDI) | [scripts/produce_all.js](file:///scripts/produce_all.js) |
| `npm run deploy:arrangement [tema]` | Inyección directa de notas y localizadores a Arrangement | [scripts/deploy_arrangement.js](file:///scripts/deploy_arrangement.js) |
| `npm run master:track [tema]` | Balance de ganancias, Bass Mono, width y Reverb en Ableton | [scripts/master_track.js](file:///scripts/master_track.js) |
| `npm run finalize [tema]` | Conversión MP3 320k, tags ID3 oficiales y reporte EBU R128 LUFS | [scripts/finalize_release.js](file:///scripts/finalize_release.js) |
| `npm run export:midi [tema]` | Exportación a Standard MIDI Files (.mid) individuales y full | [scripts/export_midi.js](file:///scripts/export_midi.js) |
| `npm run scan:plugins` | Descubrimiento e indexación de VST3s del sistema en catalog | [scripts/scan_plugins.js](file:///scripts/scan_plugins.js) |

---

## 🔗 9. Skills Relacionados y Especializados
- [.agents/skills/strudel-yaml-composer/SKILL.md](file:///.agents/skills/strudel-yaml-composer/SKILL.md): Composición desacoplada y diseño sónico.
- [.agents/skills/strudel-live-coding/SKILL.md](file:///.agents/skills/strudel-live-coding/SKILL.md): Notación de patrones, escalas y polirritmias.
- [.agents/skills/strudel-ableton-deployer/SKILL.md](file:///.agents/skills/strudel-ableton-deployer/SKILL.md): Aprovisionamiento de dispositivos y template.
- [.agents/skills/strudel-vs-plus/SKILL.md](file:///.agents/skills/strudel-vs-plus/SKILL.md): Arquitectura de la extensión de VS Code y SSOT.

