# DEPH — Master Project Tracking & Roadmap

Última actualización: **2026-10-27 19:50**  
Estado general: **Gnosis (Obra 04) - Completada, Masterizada y Subida en Privado (Video 4K + 2 Shorts)**.

---

## 1. Estado Consolidado de Composiciones

| # | Pieza | Audio / Strudel | Visuales | Audio Master | Video Final | YouTube (Largo) | YouTube Shorts |
|---|---|---|---|---|---|---|---|
| **01** | `slow-drift` | ✅ Completado | ✅ Remotion | ✅ -16 LUFS | ✅ 4K 60fps | ✅ Público | — |
| **02** | `musica-universalis` | ✅ Completado | ✅ Remotion | ✅ -16 LUFS | ✅ 4K 60fps | ✅ Público | — |
| **03** | `the-field` | ✅ Completado | ✅ Remotion | ✅ -16 LUFS | ✅ 4K 60fps | ✅ Público (`8QGj_FvP5Xo`) | ✅ 2 Publicados (`1ERj4BEWkvg` ES, `joDFMXec1Io` EN) |
| **04** | **`gnosis`** | ✅ Completado | ✅ Remotion | ✅ -16 LUFS | ✅ 4K 60fps | ✅ **Privado (`i3NcqCaEsB8`)** | ✅ **2 Privados (`fJEEjPmf4Ss` ES, `nMDWT0B-fSU` EN)** |

---

## 2. Gnosis — Detalle Exhaustivo de Entregables (Obra 04)

### A. Obra Principal Larga (4K 60fps, 12 min)
* **Archivo de video**: `media/gnosis/renders/gnosis-fixed.mp4` (H.264, 3840x2160, 43560 frames, 726.0s).
* **Audio Master**: -16.0 LUFS, -1.0 dBTP ceiling.
* **YouTube Video ID**: [`i3NcqCaEsB8`](https://youtu.be/i3NcqCaEsB8) (Estado: **Privado**).
* **Edición en Studio**: [https://studio.youtube.com/video/i3NcqCaEsB8/edit](https://studio.youtube.com/video/i3NcqCaEsB8/edit).
* **Portada 16:9 Oficial**: `media/gnosis/renders/thumbnails/gnosis-thumbnail.jpg` (Octaedro violeta en minuto 5:00 con marca `deph · 04`).

---

### B. YouTube Short — Español (46s, 1080x1920)
* **Archivo Renderizado**: `media/gnosis/shorts/gnosis-short-es.mp4` (395 MB).
* **Audio Master**: **`-15.1 LUFS`**, True Peak **`-1.0 dBTP`**, LRA 2.9 LU (procesado con `tools/shorts/master-shorts-audio.py`).
* **Sincronización Subtítulos**: Marcas temporales milimétricas extraídas con `faster-whisper` (`gnosis-whisper-words-es.json`), bloques estrictos de 2 líneas, ocultación en pausas (>0.35s) y resaltado palabra por palabra (`#C084FC`).
* **YouTube Video ID**: [`fJEEjPmf4Ss`](https://youtube.com/shorts/fJEEjPmf4Ss) (Estado: **Privado**).
* **Edición en Studio**: [https://studio.youtube.com/video/fJEEjPmf4Ss/edit](https://studio.youtube.com/video/fJEEjPmf4Ss/edit).
* **Descripción**: Publicada en YouTube con la estructura idéntica de 5 bloques de *The Field*.
* **Portada Oficial (Estilo *The Field*)**: `media/gnosis/shorts/thumbnails/gnosis-short-thumb-es.jpg` (1280x720, pastilla `DEPH · 04`, tarjeta glassmorphism con categoría `• GEOMETRÍA SAGRADA · 432 HZ`, título y subtítulo, cero diálogo).
* **Comentario Fijado Pendiente**:
  ```text
  Con auriculares a 432 Hz. Mirá la integración geométrica completa de 12 minutos en 4K acá: https://youtu.be/i3NcqCaEsB8
  ```

---

### C. YouTube Short — Inglés (46s, 1080x1920)
* **Archivo Renderizado**: `media/gnosis/shorts/gnosis-short-en.mp4` (403 MB).
* **Audio Master**: **`-14.9 LUFS`**, True Peak **`-1.0 dBTP`**, LRA 1.9 LU.
* **Sincronización Subtítulos**: Marcas acústicas Whisper (`gnosis-whisper-words-en.json`), bloques de 2 líneas sincronizados al milisegundo.
* **YouTube Video ID**: [`nMDWT0B-fSU`](https://youtube.com/shorts/nMDWT0B-fSU) (Estado: **Privado**).
* **Edición en Studio**: [https://studio.youtube.com/video/nMDWT0B-fSU/edit](https://studio.youtube.com/video/nMDWT0B-fSU/edit).
* **Descripción**: Publicada en YouTube con la estructura idéntica de 5 bloques de *The Field*.
* **Portada Oficial (Estilo *The Field*)**: `media/gnosis/shorts/thumbnails/gnosis-short-thumb-en.jpg` (1280x720, pastilla `DEPH · 04`, tarjeta glassmorphism con categoría `• SACRED GEOMETRY · 432 HZ`, título y subtítulo, cero diálogo).
* **Comentario Fijado Pendiente**:
  ```text
  Headphones on at 432 Hz. Watch the full 12-minute geometric integration in 4K here: https://youtu.be/i3NcqCaEsB8
  ```

---

## 3. Tooling y Automatizaciones Creadas y Persistidas

1. **`tools/shorts/master-shorts-audio.py`**:
   Script de masterización en 2 pasadas EBU R128 (`loudnorm`) a -14.0 LUFS (-1.0 dBTP ceiling) para Shorts de audio.
2. **`tools/shorts/build-gnosis-hyperframes.mjs`**:
   Generador automatizado del paquete HyperFrames (HTML/CSS/GSAP) con detección inteligente de pausas de voz y render nativo acelerado por GPU.
3. **`tools/youtube/upload-short.py`**:
   Script de subida de Shorts a YouTube por API con metadatos específicos de idioma y garantía de estado Privado.
4. **`tools/shorts/generate-editorial-covers.py`**:
   Generador de portadas de YouTube Shorts 16:9 con fondo blurred wings, pastilla de marca `DEPH · {NN}` y tarjeta glassmorphism editorial (cero diálogo).
5. **`.agents/skills/deph-shorts/SKILL.md`**:
   Skill oficial del repositorio actualizado con el estándar de portadas de Shorts.

---

## 4. Tareas Pendientes Inmediatas (Checklist del Creador)

- [ ] **Aplicar portadas de Shorts en YouTube Studio**:
  - ES: Subir `media/gnosis/shorts/thumbnails/gnosis-short-thumb-es.jpg` en [Studio ES](https://studio.youtube.com/video/fJEEjPmf4Ss/edit).
  - EN: Subir `media/gnosis/shorts/thumbnails/gnosis-short-thumb-en.jpg` en [Studio EN](https://studio.youtube.com/video/nMDWT0B-fSU/edit).
- [ ] **Comentarios fijados**:
  - Pegar y fijar (Pin) el comentario en cada Short.
- [ ] **Publicación**:
  - Cambiar estado de **Privado** a **Público** cuando desees el lanzamiento oficial.
