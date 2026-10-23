---
name: shorts-compose
description: Use whenever the user asks to create, extract, render, or publish YouTube Shorts (or vertical 9:16 Reels/TikToks) from an existing deph composition. Builds and maintains `media/<name>/shorts/<name>.shorts.md`, selects high-retention moments from the composition's yaml arc and `sync/frames.json`, and renders 1080x1920 @ 60fps vertical videos into `media/<name>/shorts/` using `tools/youtube/short.mjs` (supporting both fast 4K FFmpeg cropping and native Remotion rendering with `ShortPromo.tsx`) before uploading via YouTube Data API v3.
---

# Creating and publishing promotional YouTube Shorts for a deph piece

Every composition has a dedicated **`media/<name>/shorts/`** subfolder (part of the standard `deph-compose` piece template, alongside `sounds/`, `visuals/`, `sync/`, and `renders/`). All metadata, clip definitions, and rendered `.mp4` files for a piece's Shorts live inside **`media/<name>/shorts/`**:
- **`media/<name>/shorts/<name>.shorts.md`** — tracked in git; defines the 2 to 3 Shorts (`1080x1920`, 9:16 vertical, 60 fps, 30–55 seconds each).
- **`media/<name>/shorts/<name>-short-<id>.mp4`** — compiled vertical video files (git-ignored).
- **`domains.shorts`** in `media/<name>/<name>.yaml` — tracks the status (`planned` / `ready` / `published`) and path (`shorts/`).

## Standing rules (house style for Shorts)

1. **A Short is a window into the piece, not a frantic trailer.** Never speed up the music, never add quick cuts inside a single Short, and never add clickbait text or emojis on the video itself. Pick one coherent 35–50 second moment from the composition's arc (e.g. the `4:16` convergence in *The Field*, the `2:24` Shepard flight in *Musica Universalis*, or the climax bells in *Slow Drift*).
2. **Smooth entry and exit (never a hard cut).** Both rendering modes apply a `1.2 s` fade-in and a `1.8 s` fade-out to picture and audio (`-14 LUFS`), so a meditative excerpt never starts or stops with a jolt.
3. **Bilingual Production by Default (EN & ES Mandatory):**
   - Every Short MUST be produced in both **English (`EN`)** and **Spanish (`ES`)**.
   - Each language has its own dedicated files in `media/<name>/shorts/<id>/`:
     - Text files: `voiceover-en.txt` and `voiceover-es.txt`.
     - Audio files: `voice-en.mp3` and `voice-es.mp3` generated via ElevenLabs (`Brian`).
     - Subtitle timestamps: `captions-en.json` and `captions-es.json`.
     - Final renders: `<name>-short-<id>-en.mp4` and `<name>-short-<id>-es.mp4`.
   - YouTube metadata includes primary English titles/descriptions with Spanish attached via `localizations.es`.

4. Typography, Safe Zones, and Giant Mobile Text (Reglas de Oro Inviolables):
   - REGLA DE ORO: SUBTÍTULOS SIEMPRE EN EXACTAMENTE 2 LÍNEAS:
     - Cada subtítulo que aparece en pantalla debe estar estructurado estrictamente en 2 LÍNEAS (fila superior y fila inferior con white-space: nowrap).
     - PROHIBIDO TERMINANTEMENTE que un subtítulo quede en 3 líneas (abarrota la pantalla y tapa el video) o en 1 línea solitaria desbalanceada.
     - Ambas líneas deben estar equilibradas armónicamente (2 a 4 palabras por línea).
   - Paleta de Colores de Texto y Acentos por Obra:
     - PROHIBIDO usar colores arbitrarios, dorados chillones o celestes desconectados del metraje.
     - En The Field (Nácar nocturno): la palabra hablada activa se ilumina en VIOLETA INTENSO (#C084FC / #A855F7) o AZUL ÍNDIGO INTENSO (#818CF8 / #6366F1) con aura luminosa acorde, texto inactivo en blanco cuarzo nacarado (#FDFBFA), subtextos en índigo suave (#A5B4FC).
   - Esquinas Moderadas (Puntas No Tan Redondeadas):
     - PROHIBIDO usar píldoras o cápsulas circulares ovaladas gigantes (border-radius: 999px descartado en cards y subtítulos).
     - Usar esquinas refinadas y sobrias de border-radius: 18px a 20px tanto en cards de gancho/CTA como en la cápsula de subtítulos.
   - Glassmorphism Permanente en Todos los Cards y Subtítulos:
     - Fondo de cristal oscuro satinado: background: rgba(11, 14, 26, 0.78); backdrop-filter: blur(28px a 32px) saturate(180%);
     - Borde de 1.5px en el tono de acento (violeta/azul tenue rgba(168, 85, 247, 0.35)).
     - Sombra profunda (box-shadow: 0 16px 40px rgba(0,0,0,0.85)) y bisel con reflejo interior sutil (inset 0 1px 0 rgba(255,255,255,0.12 a 0.15)).
   - Cápsula Dinámica para Subtítulos (Fit-Content):
     - La cápsula de los subtítulos debe ser 100% DINÁMICA (width: fit-content; max-width: 960px).
     - Se ajusta matemáticamente al ancho exacto de las 2 líneas habladas, eliminando cualquier espacio muerto o márgenes vacíos a los lados.
   - Distancia de Seguridad del Botón YouTube Subscribe:
     - Botón oficial en cápsula roja (#ff0000) con play blanco (▶) en zona superior (top: 240px; left: 80px).
     - El card de gancho (Hook card) debe mantener al menos 150px a 180px de distancia libre vertical respecto al botón de Subscribe (ubicándose a partir de top: 470px a 480px) para garantizar total separación y que no se peguen visualmente.
   - Estándares de Tipografía Móvil para 1080x1920:
     - Titulares y Headings: 66px a 85px en negrita (800 o 900 bold, mayúsculas).
     - Subtítulos Cinéticos (2 Líneas): 64px a 72px (peso 900 bold, line-height: 1.15).
     - Textos Secundarios y Subtítulo de CTA: 48px a 54px (piso absoluto: 48px).
     - Badges / Categoría: 22px a 26px bold uppercase (letter-spacing: 0.16em).
   - Safe Zones Móviles:
     - Top safe zone (>240px libre): despejada de subtítulos.
     - Bottom safe zone (>480px libre, de 1440px a 1920px): estrictamente despejada de subtítulos y CTAs.
     - Right safe zone (>140px libre): libre para la columna de interacción.
     - Sweet spot de subtítulos: zona media-baja (Y: 1220px a 1280px), centrado horizontalmente.

5. Narrative Voiceover, Cadence, and Synchronized Captions (Reglas de Oro):
   - PROHIBIDO USAR GUIONES (Regla de Oro Inviolable): Prohibido usar guiones largos o dobles en textos, guiones de voz, subtítulos o comentarios. Los seres humanos no hablan ni redactan con guiones. Usar puntos, comas, dos puntos o puntos suspensivos para separar ideas.
   - Metraje Visual Real (Regla de Oro): Usar siempre el metraje 4K original de la pieza publicado en YouTube. En The Field, usar el momento cumbre donde se desarma la flor de la vida (04:55 a 05:40), donde se aprecia con total claridad la nube tridimensional de 500.000 puntos de cuarzo cayendo en el espacio.
   - Locución Pausada y Meditativa: Para obras de 432 Hz, la locución no puede sonar apresurada. Debe ser serena, profunda y pausada, con silencios intencionales entre frases. Máximo 60 a 70 palabras en 45 segundos (80 a 90 palabras por minuto). Voz oficial: Brian de ElevenLabs. Prohibido usar Adam.
   - Sincronización Estricta 1 a 1: Cero desfase temporal. Las marcas de tiempo de las palabras deben corresponder con exactitud matemática al audio generado.
   - Mezcla de Audio Profesional: La música ambiental 432 Hz debe estar suave de fondo (-18 dB a -22 dB). La voz en off debe sonar al frente, nítida, cálida y protagónica (-1 dBTP).
   - Doble Llamado a la Acción (CTA Obligatorio): Todo Short debe invitar a escuchar la obra completa de 6 minutos en el canal y pedir la suscripción si la experiencia resuena.
   - Flujo de Idiomas y Revisión: Producir y validar primero la versión en inglés. Esperar el OK explícito del usuario. Solo después de la aprobación producir la versión en castellano.

## Two rendering modes (`tools/youtube/short.mjs`)

`node tools/youtube/short.mjs <piece>` supports both workflows:

- **`--mode=remotion` (Native 9:16 Remotion render with brand overlay):**
  Renders the `<name>-short` composition registered in `tools/visuals/src/Root.tsx` (`makeShortPromo(<PieceComponent>)`) via `tools/visuals/render.mjs`, writing live progress to `media/<name>/shorts/<name>-short-<id>.progress.jsonl`.
- **`--mode=ffmpeg` (Instant 9:16 crop from the existing 4K `.mp4`):**
  When `media/<name>/renders/<name>.mp4` (`3840x2160`) is already on disk, crops a `1215x2160` vertical slice from the 4K master (respecting `bgShift`), scales with Lanczos to `1080x1920`, and applies the `1.2 s` / `1.8 s` video + audio fades in a few seconds.
- **`--mode=auto` (Default):**
  Uses `ffmpeg` if `media/<name>/renders/<name>.mp4` exists on disk, otherwise renders natively with `remotion`.

## Commands

```bash
# 1. Dry-run: validate the Shorts pack and inspect props & EN/ES metadata
node tools/youtube/short.mjs the-field --clip=01 --dry-run

# 2. Render clip 01 (or --clip=all) using native Remotion (with brand overlay)
node tools/youtube/short.mjs the-field --clip=01 --mode=remotion

# 3. Render clip 01 using fast FFmpeg crop (when 4K master mp4 is in renders/)
node tools/youtube/short.mjs the-field --clip=01 --mode=ffmpeg

# 4. Render AND upload to YouTube Shorts (private by default; add --privacy=public when ready)
node tools/youtube/short.mjs the-field --clip=01 --mode=remotion --upload
```

## Format of `media/<name>/shorts/<name>.shorts.md`

Each clip is defined as a fenced `json short-clip` block so `tools/youtube/short.mjs` can parse it deterministically:

````markdown
# <Piece>: YouTube Shorts Pack

Source piece: `media/<name>/<name>.yaml` · Full video: <YouTube URL or pending>

**Tags:** <comma-separated literal tags under 500 chars total>

## Clip 01: <Short Label>

```json short-clip
{
  "id": "01",
  "slug": "convergence",
  "label": "The 4:16 Convergence",
  "startSeconds": 236,
  "durationSeconds": 45,
  "hookText": "4:16 · THREE VOICES CONVERGE",
  "subText": "500,000 quartz grains · Fibonacci canon 21 : 13 : 8",
  "titleEn": "The Field (4:16) · Fibonacci Canon & Sacred Geometry | 432 Hz Ambient #Shorts",
  "titleEs": "The Field (4:16) · Canon de Fibonacci y Geometría Sagrada | 432 Hz #Shorts",
  "descriptionEn": "...",
  "descriptionEs": "...",
  "props": {
    "title": "THE FIELD",
    "series": "03",
    "facts": "432 Hz · BINAURAL",
    "startSeconds": 236,
    "durationSeconds": 45,
    "hookText": "4:16 · THREE VOICES CONVERGE",
    "subText": "500,000 quartz grains · Fibonacci canon 21 : 13 : 8",
    "ctaText": "FULL 4K PIECE LINKED BELOW",
    "bgShift": 0
  }
}
```
````

## Registering a new piece's Short composition

When a new piece `<name>` gets its visual in `tools/visuals/src/compositions/<name>/<name>.tsx`, register `<name>-short` in `tools/visuals/src/Root.tsx` using `makeShortPromo(<PieceComponent>)` and `calculateShortMetadata` from `./brand/ShortPromo`.
