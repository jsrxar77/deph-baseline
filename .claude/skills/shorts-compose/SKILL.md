---
name: shorts-compose
description: Use whenever the user asks to create, extract, render, or publish YouTube Shorts (or vertical 9:16 Reels/TikToks) from an existing deph composition. Builds and maintains `media/<name>/shorts/<name>.shorts.md`, selects high-retention moments from the composition's yaml arc and `sync/frames.json`, and renders 1080x1920 @ 60fps vertical videos into `media/<name>/shorts/` using `tools/youtube/short.mjs` (supporting both fast 4K FFmpeg cropping and native Remotion rendering with `ShortPromo.tsx`) before uploading via YouTube Data API v3.
---

# Creating and publishing promotional YouTube Shorts for a deph piece

Every composition has a dedicated **`media/<name>/shorts/`** subfolder (part of the standard `deph-compose` piece template, alongside `sounds/`, `visuals/`, `sync/`, and `renders/`).

### Standard Folder Structure for Shorts (Mandatory & Consistent)

```text
media/<name>/shorts/
├── <name>.shorts.md                  # Master Shorts pack (metadata, titles, descriptions, tags)
├── renders/                          # Clean folder for compiled final videos and covers
│   ├── <name>-short-01-en.mp4        # Short 01 English (1080x1920 @ 30fps)
│   ├── <name>-short-01-es.mp4        # Short 01 Spanish Rioplatense (1080x1920 @ 30fps)
│   └── thumbnails/                   # Official Short covers (16:9 for API/Desktop & 9:16 for Reels/Mobile)
│       ├── <name>-short-01-en-thumbnail.jpg    # 1280x720 (16:9, upload via youtube.thumbnails.set)
│       ├── <name>-short-01-es-thumbnail.jpg    # 1280x720 (16:9, upload via youtube.thumbnails.set)
│       ├── <name>-short-01-en-cover-9x16.jpg   # 1080x1920 (9:16 vertical cover)
│       └── <name>-short-01-es-cover-9x16.jpg   # 1080x1920 (9:16 vertical cover)
└── <id>/                             # Autonomous Short folder (e.g. 01, 02)
    ├── hyperframes-en/               # Autonomous HyperFrames project in English
    │   ├── index.html
    │   ├── bg.mp4
    │   ├── music.mp3
    │   └── voice.mp3
    ├── hyperframes-es/               # Autonomous HyperFrames project in Spanish
    │   ├── index.html
    │   ├── bg.mp4
    │   ├── music.mp3
    │   └── voice.mp3
    ├── voice/                        # Original and processed voiceover audio
    │   ├── voice-en.mp3              # Audio with lead-in (EN)
    │   ├── voice-es.mp3              # Audio with lead-in (ES)
    │   ├── voiceover-en.txt          # Clean script (EN)
    │   └── voiceover-es.txt          # Clean script (ES)
    ├── captions/                     # Timing and synchronization files
    │   ├── captions-en.json          # Word-level timestamps (EN)
    │   └── captions-es.json          # Word-level timestamps (ES)
    └── source/                       # 4K base footage, stills, and production notes
        ├── raw-disassembly-4k.webm
        └── script.md
```

- **DO NOT mix projects or leave orphan drafts:** Each language has its own symmetrical folder (`hyperframes-en` and `hyperframes-es`). Do not create generic unaligned folders like a bare `hyperframes`.
- **NO symlinks or orphan files in `shorts/` root:** Only `<name>.shorts.md`, `renders/`, and numbered Short folders (`01/`, `02/`) must reside in `media/<name>/shorts/`.

## Standing rules (house style for Shorts)

1. **A Short is a window into the piece, not a frantic trailer.** Never speed up the music, never add quick cuts inside a single Short, and never add clickbait text or emojis on the video itself. Pick one coherent 35–50 second moment from the composition's arc (e.g. the `4:16` convergence in *The Field*, the `2:24` Shepard flight in *Musica Universalis*, or the climax bells in *Slow Drift*).
2. **Smooth entry and exit (never a hard cut).** Both rendering modes apply a `1.2 s` fade-in and a `1.8 s` fade-out to picture and audio (`-14 LUFS`), so a meditative excerpt never starts or stops with a jolt.
3. **Bilingual Production by Default (EN & ES Mandatory):**
   - Every Short MUST be produced in both **English (`EN`)** and **Spanish (`ES`)**.
   - YouTube metadata includes primary English titles/descriptions with Spanish attached via dedicated individual uploads or `localizations.es`.
   - **Strict Language Configuration in YouTube Data API:**
     - English video: `defaultLanguage: "en"`, `defaultAudioLanguage: "en"`, title, description, and tags in English.
     - Spanish video: `defaultLanguage: "es"`, `defaultAudioLanguage: "es"`, title, description, and tags in Spanish (Rioplatense).
     - Initial privacy: always `private` so the creator can review the rendered video and link the Related Video (to the 4K piece) in YouTube Studio.

4. **Mandatory Thumbnails per Short (16:9 and 9:16):**
   - NEVER leave Shorts with auto-selected random video frames.
   - Each Short must have dedicated covers in `media/<name>/shorts/renders/thumbnails/`:
     - **16:9 (`1280x720`, JPG < 2MB):** Required for YouTube Data API (`youtube.thumbnails.set`). Displayed on desktop search, playlists, and channel video tabs.
     - **9:16 (`1080x1920`, JPG):** Required for vertical mobile Shorts feeds, Instagram Reels, and TikTok. Also usable via YouTube Studio's desktop "Change" thumbnail dialog.
   - **Aesthetics matching the piece:** High-resolution 3D particle frame from the climax/dissolution, official brand chip (`deph · <series> #SHORTS`), translucent glassmorphic card with the piece's accent color, pure typography without `-webkit-text-stroke`, and the bottom-right corner left empty for YouTube's duration badge.

5. **Typography, Safe Zones, and Giant Mobile Text (Inviolable Rules):**
   - **GOLDEN RULE: SUBTITLES ALWAYS IN EXACTLY 2 LINES:**
     - Every subtitle appearing on screen must be structured strictly in 2 LINES (top row and bottom row with `white-space: nowrap`).
     - STRICTLY FORBIDDEN: 3 lines (crowds the canvas and obscures the art) or a single isolated unbalanced line.
     - Both lines must be harmoniously balanced (2 to 4 words per line).
   - **NO `-webkit-text-stroke` (Zero Dark Spots / Black Artifacts):**
     - FORBIDDEN to use `-webkit-text-stroke` on typography over dark backgrounds or cards. In Chromium engines, stroke collapses inward into the counters and loops of closed letters (`e`, `a`, `o`, `b`), filling them with black artifacts.
     - Use pure font weight 800 (`font-weight: 800`) with subtle text shadow (`text-shadow: 0 4px 18px rgba(0, 0, 0, 0.90), 0 2px 4px rgba(0, 0, 0, 0.85);`) for pristine, clean legibility.
   - **Text Color Palette and Piece Accents:**
     - In *The Field* (night nacre): active spoken word illuminates in INTENSE VIOLET (`#C084FC` / `#A855F7`) with matching glow (`0 0 28px rgba(168, 85, 247, 0.95)`), inactive text in pearlescent quartz white (`#FDFBFA`), secondary text in soft indigo (`#A5B4FC`).
   - **Moderate Corners:**
     - Refined corner radii of `18px` to `20px` on both cards and subtitle capsules (`border-radius: 999px` is reserved only for pills).
   - **Translucent, Airy Glassmorphism:**
     - Dark translucent glass background: `background: rgba(11, 14, 26, 0.45)` to `0.54`; `backdrop-filter: blur(24px) saturate(190%);`
     - Fine border in accent tone (`rgba(168, 85, 247, 0.35)`).
     - Deep shadow (`box-shadow: 0 16px 40px rgba(0,0,0,0.80)`) and subtle interior reflection (`inset 0 1px 0 rgba(255,255,255,0.15)`).
   - **Dynamic Subtitle Capsule (`fit-content`):**
     - Subtitle capsule must be dynamic (`width: fit-content; max-width: 960px`).
     - Clamps to the exact width of the 2 spoken lines, eliminating dead margins.
   - **YouTube Subscribe Button Clearance:**
     - Official Subscribe badge at `top: 240px; left: 80px`.
     - Hook card maintains at least 150px to 180px vertical clearance below it (placed from `top: 470px` to `480px`).
   - **Mobile Typography Standards (1080x1920):**
     - Headings: 66px to 85px bold uppercase.
     - Kinetic Subtitles (2 Lines): 50px to 64px (line-height: 1.15 to 1.2).
     - Secondary text and CTA Subtitle: 48px to 54px.
   - **Mobile Safe Zones:**
     - Top safe zone (>240px clear): free of text.
     - Bottom safe zone (>480px clear, 1440px to 1920px): strictly clear of subtitles and CTAs (avoids channel title and audio pill).
     - Right safe zone (>140px clear): clear for YouTube vertical engagement buttons (Like, Dislike, Comments).
     - Subtitle placement: centered horizontally, Y between 1120px and 1280px.

6. **Narrative Voiceover, Cadence, and Synchronized Captions:**
   - **NO HYPHENS:** Avoid long dashes or hyphens in voiceover scripts or captions. Use periods, commas, colons, or ellipses.
   - **Real Visual Footage:** Always use real 4K footage from the published piece. In *The Field*, use the flower dissolution climax (04:55 to 05:40) showing 500,000 quartz grains falling in 3D space.
   - **Deliberate, Meditative Cadence:** Calm, deep, unhurried voiceover with intentional pauses. Maximum 60 to 70 words in 45 seconds (80 to 90 wpm).
   - **Strict 1:1 Synchronization:** Word-level timestamps must match generated audio mathematically.
   - **Professional Audio Mix:** 432 Hz ambient music soft in background (-18 dB to -22 dB). Voiceover prominent, warm, and upfront (-1 dBTP).
   - **Double CTA:** Every Short invites the viewer to hear the full 6-minute piece on the channel and subscribe if it resonates.
   - **Language Workflow:** Validate English version first, get user approval, then produce the Spanish version.

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
