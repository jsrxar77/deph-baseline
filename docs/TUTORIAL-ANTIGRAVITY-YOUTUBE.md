# Tutorial Completo: Automatización de YouTube, Shorts y Videos Educativos en `deph` (Antigravity & CLI)

Este documento explica **dónde vive cada archivo nuevo** dentro de `/Users/javier/Projects/deph-baseline`, **cómo usar los Skills directamente desde el chat de Antigravity**, y **qué comandos ejecutar** para subir obras completas, generar Shorts promocionales y crear videos educativos.

---

## 1. Mapa de Todo lo que se Creó y Configuró

Todo está integrado siguiendo la arquitectura *composition-first* de `deph`:

### A. Descubrimiento Automático para Antigravity (Raíz del proyecto)
Cuando abras la carpeta `/Users/javier/Projects/deph-baseline` como tu Workspace en **Antigravity** (`File > Open Folder...`), el agente cargará automáticamente:
* **`GEMINI.md` y `AGENTS.md`** $\rightarrow$ Enlazados a [`CLAUDE.md`](../CLAUDE.md) (reglas globales del proyecto).
* **`.agents/skills/`** $\rightarrow$ Enlazados a todos los skills de `.claude/skills/`:
  1. `deph-compose` — Crear o reestructurar una composición nueva (`media/<name>/`).
  2. `strudel-compose` — Componer la parte sonora en `.strudel`.
  3. `strudel-sync` — Renderizar audio WAV, master (`-16 LUFS` / `-14 LUFS`) y `frames.json`.
  4. `ableton-bridge` — Puente opcional con Ableton Live.
  5. `visuals-compose` — Crear el visual 4K60 en Remotion (`tools/visuals/src/compositions/<name>/`).
  6. **`youtube-publish`** *(Actualizado)* — Armar el pack `<name>.youtube.md`, la portada `.jpg` y **subir el video automáticamente a YouTube** con título/descripción en inglés, traducción en español, capítulos, tags, portada, playlist y comentario.
  7. **`shorts-compose`** *(Nuevo)* — Armar el pack `<name>.shorts.md`, extraer y renderizar Shorts verticales `9:16` (`1080x1920` a 60 fps) en modo FFmpeg rápido o Remotion nativo, y subirlos a YouTube Shorts.
  8. **`edu-compose`** *(Nuevo)* — Diseñar y renderizar videos educativos ("Visual Essays" en `9:16` o `16:9` 4K) sobre la física acústica, matemática y código de cada obra (`<name>.edu.md`).
  9. `deph-style` — Memoria de estilo, decisiones creativas y lecciones medidas.

### B. Herramientas de Automatización de YouTube (`tools/youtube/`)
* [`tools/youtube/SETUP-OAUTH-ES.md`](../tools/youtube/SETUP-OAUTH-ES.md) — Guía paso a paso (nivel cero) para descargar tu `client_secret.json` gratuito de Google Cloud.
* [`tools/youtube/auth.mjs`](../tools/youtube/auth.mjs) — Abre el navegador y conecta tu canal de YouTube (`UC1cFX0dl77im5F5V-RRi6hA`), guardando el token en `tools/youtube/.credentials/` (ignorado por Git).
* [`tools/youtube/parse-pack.mjs`](../tools/youtube/parse-pack.mjs) — Lector y validador de reglas de YouTube para `<name>.youtube.md` y `<name>.yaml`.
* [`tools/youtube/publish.mjs`](../tools/youtube/publish.mjs) — Subida automática de videos largos (video 4K reanudable + idioma EN + traducción ES + miniatura + playlist `PLX0Afm4O4W30` + comentario de enganche).
* [`tools/youtube/short.mjs`](../tools/youtube/short.mjs) — Generador dual (FFmpeg 4K crop / Remotion 9:16) y publicador de Shorts promocionales.
* [`tools/youtube/edu.mjs`](../tools/youtube/edu.mjs) — Renderizador y publicador de videos educativos.

### C. Plantillas Visuales en Remotion (`tools/visuals/src/brand/`)
* [`tools/visuals/src/brand/VideoThumbnail.tsx`](../tools/visuals/src/brand/VideoThumbnail.tsx) — Portadas `1280x720` de la serie.
* [`tools/visuals/src/brand/ShortPromo.tsx`](../tools/visuals/src/brand/ShortPromo.tsx) *(Nuevo)* — Plantilla `1080x1920` (9:16) para Shorts promocionales con fade suave de entrada/salida, chip `deph · 01/02/03`, gancho inicial de 5.5 s y llamado a la acción final.
* [`tools/visuals/src/brand/EduBreakdown.tsx`](../tools/visuals/src/brand/EduBreakdown.tsx) *(Nuevo)* — Plantilla para videos educativos (`9:16` y `16:9` 4K) con tarjetas explicativas paso a paso, fórmulas y diagramas animados en vivo (fase binaural, anillos de Fibonacci, placa de Chladni, proporciones pitagóricas).
* [`tools/visuals/src/Root.tsx`](../tools/visuals/src/Root.tsx) — Registra las composiciones `<name>-short`, `<name>-edu-short` y `<name>-edu-4k`.

### D. Packs Listos en tus Composiciones (`media/<name>/`)
* **The Field (`03`):**
  * [`media/the-field/the-field.youtube.md`](../media/the-field/the-field.youtube.md)
  * [`media/the-field/the-field.shorts.md`](../media/the-field/the-field.shorts.md) *(3 Shorts listos: Convergencia 4:16, Disolución 5:00, Cimática Chladni 1:45)*
  * [`media/the-field/the-field.edu.md`](../media/the-field/the-field.edu.md) *(2 lecciones listas: EN bilingüe y ES en pantalla)*
* **Musica Universalis (`02`):**
  * [`media/musica-universalis/musica-universalis.youtube.md`](../media/musica-universalis/musica-universalis.youtube.md)
  * [`media/musica-universalis/musica-universalis.shorts.md`](../media/musica-universalis/musica-universalis.shorts.md) *(2 Shorts listos: Vuelo Shepard 2:24 y Órbitas sobre agua 4:20)*
  * [`media/musica-universalis/musica-universalis.edu.md`](../media/musica-universalis/musica-universalis.edu.md) *(Lección sobre Armonía Pitagórica + Ilusión de Shepard)*
* **Slow Drift (`01`):**
  * [`media/slow-drift/slow-drift.youtube.md`](../media/slow-drift/slow-drift.youtube.md)
  * [`media/slow-drift/slow-drift.shorts.md`](../media/slow-drift/slow-drift.shorts.md) *(Short del clímax de campanas y fractal de Julia)*
  * [`media/slow-drift/slow-drift.edu.md`](../media/slow-drift/slow-drift.edu.md) *(Lección sobre bucles de Eno + Conjunto de Julia + Binaural)*

---

## 2. Cómo Usar los Skills desde el Chat de Antigravity

Primero, abre `/Users/javier/Projects/deph-baseline` como carpeta principal en Antigravity. A partir de ese momento puedes pedirle en lenguaje natural cualquiera de estos flujos y el agente activará el skill correspondiente:

### Caso 1: Publicar una obra completa en YouTube (`youtube-publish`)
Puedes escribirle en el chat:
> *"Usa el skill `youtube-publish` para verificar y subir `musica-universalis` a YouTube en modo privado (con su portada, traducción al español, playlist y comentario)."*

**¿Qué hará el agente o qué puedes correr tú en terminal?**
```bash
# 1. Verificar que el pack cumple todas las reglas de YouTube (sin subir nada):
node tools/youtube/publish.mjs musica-universalis --dry-run

# 2. Subir el video 4K, título/descripción EN + traducción ES, miniatura y playlist (en Privado por seguridad):
node tools/youtube/publish.mjs musica-universalis

# 3. O subirlo directamente como Público (también publica el comentario de enganche):
node tools/youtube/publish.mjs musica-universalis --privacy=public
```

---

### Caso 2: Crear y subir Shorts promocionales (`shorts-compose`)
Puedes escribirle en el chat:
> *"Usa el skill `shorts-compose` para renderizar el Short 01 de `the-field` (la convergencia del 4:16) y súbelo a YouTube."*
>
> O para una pieza nueva:
> *"Crea el pack de Shorts para `morpho-genesis` eligiendo los 3 mejores momentos del arco y renderiza el primero."*

**Comandos directos en terminal:**
```bash
# Ver qué Shorts están definidos y validar sus metadatos EN/ES:
node tools/youtube/short.mjs the-field --clip=all --dry-run

# Renderizar el Short 01 con el diseño de marca de Remotion (1080x1920 @ 60fps):
node tools/youtube/short.mjs the-field --clip=01 --mode=remotion

# O si ya tienes el archivo 4K media/the-field/renders/the-field.mp4 en disco y quieres corte instantáneo con FFmpeg:
node tools/youtube/short.mjs the-field --clip=01 --mode=ffmpeg

# Renderizar y subir directamente a YouTube Shorts:
node tools/youtube/short.mjs the-field --clip=01 --mode=remotion --upload --privacy=private
```
*(El archivo `.mp4` resultante queda guardado en `media/<name>/renders/shorts/<name>-short-01.mp4`).*

---

### Caso 3: Crear Videos Educativos / Visual Essays (`edu-compose`)
*(Por defecto, tanto los **Shorts** como los **Videos Educativos** se crean con textos en pantalla e idioma base en **Inglés (`EN`)** — `Lesson 01` — y adjuntan automáticamente la traducción de título y descripción al español en YouTube `localizations.es`).*

Puedes escribirle en el chat:
> *"Usa el skill `edu-compose` para renderizar la lección 01 (en inglés por defecto) de `the-field` en formato Short vertical (`9x16`)."*
>
> O para crear un tema educativo nuevo:
> *"Usa `edu-compose` para armar una nueva lección en `the-field.edu.md` explicando la técnica tintinnabuli de Arvo Pärt y cómo se combina con el canon de Fibonacci, y muéstrame un still de prueba."*

**Comandos directos en terminal:**
```bash
# 1. Probar la configuración de la lección por defecto (Lesson 01 en Inglés):
node tools/youtube/edu.mjs the-field --dry-run

# 2. Renderizar como Short / Reel educativo vertical en Inglés (1080x1920 @ 60fps):
node tools/youtube/edu.mjs the-field

# 3. Renderizar como Video Educativo Horizontal en 4K en Inglés (3840x2160 @ 60fps):
node tools/youtube/edu.mjs the-field --format=16x9

# 4. Renderizar y subir a YouTube (EN base + ES localizations):
node tools/youtube/edu.mjs the-field --upload
```
*(El archivo `.mp4` queda guardado en `media/<name>/renders/edu/`).*

---

## 3. Previsualizar en Vivo en Remotion Studio

Si quieres ver y ajustar visualmente cualquier Short o Video Educativo en tiempo real antes de renderizarlo completo:

```bash
cd tools/visuals
npx remotion studio
```
En la barra lateral izquierda de Remotion Studio (`http://localhost:3000`) verás ahora:
* **Obras 4K:** `slow-drift`, `musica-universalis`, `the-field`, `morpho-genesis`, `songcord`
* **Branding & Portadas:** `deph-banner`, `deph-avatar`, `slow-drift-thumbnail`, `musica-universalis-thumbnail`, `the-field-thumbnail`
* **Shorts Promocionales (9:16):** `slow-drift-short`, `musica-universalis-short`, `the-field-short`
* **Videos Educativos (9:16 y 4K):** `the-field-edu-short`, `the-field-edu-4k`, `musica-universalis-edu-short`, `slow-drift-edu-short`

---

## 4. Primer Paso Único antes de Subir a YouTube

Cuando quieras activar la subida directa a tu canal, abre [`tools/youtube/SETUP-OAUTH-ES.md`](../tools/youtube/SETUP-OAUTH-ES.md), sigue los 5 pasos para colocar tu `client_secret.json` en `tools/youtube/.credentials/client_secret.json` y ejecuta:

```bash
node tools/youtube/auth.mjs
```
¡A partir de ahí todo el flujo de subida queda 100% automatizado!
