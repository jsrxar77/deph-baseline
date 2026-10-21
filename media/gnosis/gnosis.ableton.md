# Gnosis en Ableton Live: Guía Paso a Paso (Nivel Cero)

Esta guía lleva la pieza **Gnosis** (24:00 exactos, 720 compases a 120 BPM) desde Strudel hacia **Ableton Live 12 Suite** para producirla con tus sintetizadores e instrumentos reales instalados en tu Mac (Surge XT, Serum 2, etc.), respetando la calibración a **432 Hz**.

---

## 🧭 Resumen de la Estructura en Ableton

* **Tempo**: `120.00 BPM` (en compás `4/4`). 1 compás en Ableton = 1 ciclo de Strudel = 2 segundos.
* **Duración total**: `720 compases` = 24 minutos y 00 segundos exactos.
* **Archivos listos en `media/gnosis/daw/`**:
  * `gnosis.mid` (el archivo MIDI maestro con todos los canales)
  * `tracks/01-primordial-drone.mid` (Canal 1 - Primordial Drone / Surge XT)
  * `tracks/02-grounding-sub.mid` (Canal 2 - Sub-Bass / Surge XT)
  * `tracks/03-sophia-motif.mid` (Canal 3 - Motivo de Sophía / Serum 2)
  * `tracks/04-pleroma-pad.mid` (Canal 4 - Pleroma Pad / Serum 2)
  * `tracks/05-tintinnabuli.mid` (Canal 5 - Tintinnabuli / Surge XT)
  * `tracks/06-astral-textures.mid` (Canal 6 - Texturas Cósmicas / Serum 2)
  * `tracks/08-solo-lead.mid` (Canal 8 - Melodía de la Revelación / Serum 2)
  * `tracks.json` (Parámetros y faders sugeridos)

---

## 🛠️ Configuración Inicial en Ableton Live (Una Sola Vez)

1. Abre **Ableton Live 12 Suite**.
2. Ve a **Settings...** (`Cmd+,`):
   * En **Plug-Ins**: Asegúrate de tener activado **Use Audio Units v2** y **Use VST3 Plug-In System Folders**.
   * En **Record, Warp & Launch**: **Desactiva "Auto-Warp Long Samples"** para que ninguna pista de audio sufra estiramientos de tiempo no deseados.
3. En la esquina superior izquierda de Live, verifica que el tempo esté fijado en **`120.00`** y el compás en **`4/4`**.
4. Pulsa **`Tab`** para pasar a la **Arrangement View** (la vista de línea de tiempo horizontal con compases 1, 2, 3...).

---

## 🎹 Asignación de Pistas, Plugins y Presets Reales

Si abres tu plantilla estándar de 8 canales (`Strudel Temaplte.als`) o creas las pistas MIDI manualmente, carga los siguientes plugins y presets literales verificados en tu sistema:

### Pista 1: Primordial Drone (`tracks/01-primordial-drone.mid`)
* **Rol**: Drone armónico continuo y nota pedal flotante sobre Re (D2) que sostiene el viaje meditativo sin desconcentrar con percusión.
* **Instrumento**: **Surge XT**.
* **Preset sugerido**: `/Library/Application Support/Surge XT/patches_factory/Basses/` → **`Eighties Drone.fxp`** (o en `Pads/` → **`MKS-70 Warm Pad.fxp`**).
* **Ajuste clave**: Filtro Low Pass cálido (200–300 Hz) con ataque lento (4–6s) y release largo (10–14s) para un colchón etéreo y envolvente.
* **Fader sugerido**: `-3.5 dB`.

### Pista 2: Varilla de Anclaje / Grounding Sub-Bass (`tracks/02-grounding-sub.mid`)
* **Rol**: El electrodo de puesta a tierra. Frecuencias fundamentales de 36 a 55 Hz.
* **Instrumento**: **Surge XT**.
* **Preset sugerido**: `/Library/Application Support/Surge XT/patches_factory/Basses/` → **`Sub 1.fxp`** (o `Deep End.fxp`).
* **Ajuste clave**: En Surge XT, verifica que **Vel > Gain** esté en **−40 dB** para que los crescendos dinámicos del MIDI se traduzcan con precisión analógica.
* **Fader sugerido**: `0.0 dB`.

### Pista 3: Motivo de Sophía / Campana Arpegiada (`tracks/03-sophia-motif.mid`)
* **Rol**: La chispa divina de Sophía descendiendo en arpegios cristalinos.
* **Instrumento**: **Serum 2** (VST3 / AU).
* **Preset sugerido**: En el Browser de Serum 2 → `Factory/Bell/` → **`BL - Zenatrope 02.SerumPreset`** (o `BL - Ambient Ice Cave Bell Pad.SerumPreset`).
* **Efectos recomendados**: Delay ping-pong suave a compás no métrico (ej. 300-450 ms) y Reverb espaciosa (Decay 6-8s).
* **Fader sugerido**: `-9.3 dB`.

### Pista 4: Pleroma Pad (`tracks/04-pleroma-pad.mid`)
* **Rol**: La luz infinita y cálida del Pleroma que abraza toda la composición.
* **Instrumento**: **Serum 2**.
* **Preset sugerido**: En Serum 2 → `Factory/Pad/` → **`PD - Analog Soft Cotton.SerumPreset`** (o `PD - Amazon Souls.SerumPreset`).
* **Ajuste clave**: Ataque suave (2 a 3 segundos) y filtro con resonancia muy baja para permitir que respire.
* **Fader sugerido**: `-1.2 dB`.

### Pista 5: Armonía / Tintinnabuli Chords (`tracks/05-tintinnabuli.mid`)
* **Rol**: Movimiento armónico modal en Re dórico que le da dirección y trascendencia al viaje.
* **Instrumento**: **Surge XT**.
* **Preset sugerido**: `/Library/Application Support/Surge XT/patches_factory/Pads/` → **`Gentle Sweep.fxp`** (o `Chords/Major 7 MkI.fxp`).
* **Fader sugerido**: `-5.0 dB`.

### Pista 6: Texturas Cósmicas (`tracks/06-cosmic-textures.mid`)
* **Rol**: Viento astral, partículas estelares y sensación de espacio multidimensional.
* **Instrumento**: **Serum 2**.
* **Preset sugerido**: En Serum 2 → `Factory/Soundscape/` → **`SC - Astral Projection.SerumPreset`** (o `SC - Memories of Etheric Lights.SerumPreset`).
* **Fader sugerido**: `-11.0 dB`.

### Pista 7: Capa Binaural Theta 6 Hz (`tracks/07-binaural.mid` o audio)
* **Rol**: Inducción a ondas cerebrales Theta (6 Hz) para meditación profunda lúcida, calibrada a A4 = 432 Hz ($D_4 = 288.33\text{ Hz}$, $285.33\text{ Hz L} / 291.33\text{ Hz R}$).
* **Instrumento / Dispositivo**: **Utility** (Audio) o generador estéreo dual de senoides sin procesar.
* **Regla de oro**: Mantener **100% SECA** (sin Reverb ni Delay), para preservar la fase y la separación estéreo estricta requerida por el cerebro.
* **Fader sugerido**: `-16.0 dB`.

### Pista 8: Voz Cálida de la Revelación / Contrapunto Modal (`tracks/08-solo-lead.mid`)
* **Rol**: Canto meditativo lírico en registro de violonchelo/barítono (**D2 a A2**, frecuencias fundamentales entre 73 y 110 Hz). Dialoga en contrapunto de llamada y respuesta con las Campanas de Sophía (Pista 3). En Pleroma guarda silencio reverente; despierta a los 5:40 con ataque de 10 segundos y concluye su despedida en el compás 640 (21:20).
* **Instrumento**: **Serum 2** (dentro de Instrument Rack).
* **Preset sugerido**: En Serum 2 → `Factory/Lead/` → **`LD - Analog Glow.SerumPreset`** (o `Factory/Pad/` → **`PD - Warm Cello Pad`**).
* **Ajuste clave**: Filtro Low Pass cerrado por debajo de 500 Hz (en el EQ Eight de la pista, banda 4 High Cut calibrada en 0.60 para eliminar todo brillo metálico o sierra estridente). Modo Poly/Legato con ataque largo (8 a 10s) y release amplio (16 a 20s).
* **Fader sugerido**: `-8.1 dB`.

---

## 🌊 Configuración Vital de los Sintetizadores para Evitar Cortes (Respiración Continua)

Para que el **Primordial Drone (Pista 1)** y el **Pleroma Pad (Pista 4)** "vayan y vengan" en mareas sin cortarse jamás:
1. **Surge XT (Pista 1 y Pista 2)**:
   * **Play Mode** (arriba a la izquierda): Configúralo en **`Poly`** (8 o 16 voces). Esto permite que cada marea de notas solape acústicamente con la siguiente sin cortar la cola de la anterior.
   * **Amp EG**:
     * **Attack**: $\approx 3.0\text{ s}$
     * **Sustain**: $100\%$ (o $0.0\text{ dB}$)
     * **Release**: $\approx 8.0\text{ s}$ a $12.0\text{ s}$
2. **Serum 2 (Pista 4 - Pleroma Pad)**:
   * **ENV 1 (Amp)**:
     * **Attack**: $\approx 3.5\text{ s}$
     * **Sustain**: $100\%$
     * **Release**: $\approx 8.0\text{ s}$
   * **Polyphony**: Asegúrate de que esté en $\ge 4$ voces para crossfade natural.

---

---

## 🎛️ Cadena de Masterización en el Bus Master de Ableton Live (Provisionada)

La cadena de masterización fue **provisionada y calibrada automáticamente** en el canal **Master** mediante `ableton-controller.mjs master-setup`:

1. **EQ Eight (`mt/d0`)**:
   * Banda 1: *High Pass 48 dB/oct* en **25 Hz** (limpieza inaudible sin tocar D1 en 36.7 Hz).
   * Banda 2: *Bell* en **320 Hz** a **-1.2 dB** (Q: 0.8, suprime fango acústico en medios-graves).
   * Banda 4: *High Shelf* en **11.5 kHz** a **+0.8 dB** (aire cósmico sedoso).
2. **Glue Compressor (`mt/d1`)**:
   * Attack: `30 ms` (preserva transientes suaves).
   * Release: `Auto` (pegamento continuo).
   * Ratio: `2:1` (transparente).
   * Makeup: `+0.5 dB`.
3. **Limiter (`mt/d2`)**:
   * Ceiling: **`-1.0 dBTP`** (estándar de streaming con cero distorsión inter-sample).
   * Mode: **`True Peak`**.
   * Lookahead: `6 ms`.
   * Release: `Auto`.

---

## 🚀 Control y Automatización en Tiempo Real (`ableton-controller.mjs`)

Todas las pistas están envueltas en **Instrument Racks** con sus 16 Macros listos. Con el servidor activo:

```bash
# Ver estado global de pistas, racks y master
node tools/sounds/ableton-controller.mjs tracks

# Modificar cualquier Macro en vivo (ej. Cutoff de Serum 2 en Pista 4)
node tools/sounds/ableton-controller.mjs set 3 0 "Filter 1 Freq" 75.0

# Ejecutar comandos de Producer Pal sobre HTTP 3350
node tools/sounds/ableton-controller.mjs ppal ppal-read-live-set '{}'
```
