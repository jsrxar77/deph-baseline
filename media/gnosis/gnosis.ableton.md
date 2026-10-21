# Gnosis en Ableton Live: Guía Paso a Paso (Nivel Cero)

Esta guía lleva la pieza **Gnosis** (21:20 exactos, 640 compases a 120 BPM) desde Strudel hacia **Ableton Live 12 Suite** para producirla con tus sintetizadores e instrumentos reales instalados en tu Mac (Surge XT, Serum 2, etc.), respetando la calibración a **432 Hz**.

---

## 🧭 Resumen de la Estructura en Ableton

* **Tempo**: `120.00 BPM` (en compás `4/4`). 1 compás en Ableton = 1 ciclo de Strudel = 2 segundos.
* **Duración total**: `640 compases` = 21 minutos y 20 segundos exactos.
* **Archivos listos en `media/gnosis/daw/`**:
  * `gnosis.mid` (el archivo MIDI maestro con todos los canales)
  * `tracks/01-earth-pulse.mid` (Canal 1 - Pulso Terrestre / Kick C1)
  * `tracks/02-grounding-sub.mid` (Canal 2 - Sub-Bass / Varilla de Anclaje)
  * `tracks/03-sophia-motif.mid` (Canal 3 - Motivo de Sophía / Campanas Arpegiadas)
  * `tracks/04-pleroma-pad.mid` (Canal 4 - Pleroma Pad)
  * `tracks/05-tintinnabuli.mid` (Canal 5 - Acordes / Armonía)
  * `tracks/06-cosmic-textures.mid` (Canal 6 - Texturas Cósmicas / Viento Astral)
  * `tracks/07-binaural.mid` (Canal 7 - Melodía de la Revelación / Solo Lead)
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

### Pista 7: Voz de la Revelación / Solo Lead (`tracks/07-binaural.mid`)
* **Rol**: Canto lírico en los momentos de mayor elevación y clímax (Fases III y IV).
* **Instrumento**: **Serum 2**.
* **Preset sugerido**: En Serum 2 → `Factory/Lead/` → **`LD - Analog Glow.SerumPreset`**.
* **Ajuste clave**: Modo Legato / Mono activado con Portamento suave (entre 60 y 120 ms).
* **Fader sugerido**: `-6.0 dB`.

---

## 🎧 Capa Binaural Theta (6 Hz @ 432 Hz)

Para la capa de ondas Theta (6 Hz) de inducción meditativa:
1. Crea una pista de audio en Ableton.
2. Puedes importar el stem generado de Strudel (`media/gnosis/sync/binaural-stem.wav`) o generarlo en Ableton con dos osciladores puros (uno a 285.33 Hz en el canal L y otro a 291.33 Hz en el canal R).
3. **Regla de oro**: Mantén esta capa completamente **SECA** (sin Reverb ni Delay), ya que los efectos espaciales mezclan los canales izquierdo y derecho y destruyen el efecto psicoacústico binaural.

---

## 🚀 Provisión Rápida con `strudel-ableton-deployer`

Si tienes abierto Ableton Live 12 con el servidor `ableton-mcp` activo:
* Puedes pedirme directamente: *"Carga y despliega la sesión de Gnosis en Ableton"* y el agente creará las pistas, asignará los nombres y cargará los clips MIDI en la Arrangement View de forma 100% automatizada.
