---
name: edu-compose
description: Use whenever the user wants to create an instructional or educational video ("Visual Essay" in 16:9 4K or 9:16 Short) explaining a general topic in acoustics, mathematics, music theory, or generative code (e.g. Chladni figures, cymatics, Fibonacci canons, Pythagorean tuning, Shepard tones, A=432 Hz, or binaural phase interference). Every instructional video is treated as its own standalone composition hanging directly from `media/<name>/` (never buried inside a musical piece), using the standard `deph-compose` piece template (`<name>.yaml`, `<name>.md`, `<name>.youtube.md`, `sounds/`, `visuals/`, `sync/`, `renders/`, `shorts/`).
---

# Creating instructional / educational compositions ("Visual Essays") for deph

## Standing architectural rule (composition-first)

Because instructional and educational videos address **general topics** in acoustics, mathematics, harmonic geometry, and generative code (even when they reference or draw examples from a musical piece on the channel), **they are NEVER stored as secondary files inside a musical piece's folder**.

Every instructional video is **its own standalone composition hanging directly from `/media/<name>/`**, created with the exact same template as any piece in `deph` (`deph-compose`):

```text
media/<name>/
  <name>.yaml          (with `type: educational`, `language: en`, arc, and domains)
  <name>.md            (topic documentation + `json edu-steps` timeline for EduBreakdown.tsx)
  <name>.youtube.md    (EN default + ES localization publish pack for 16:9 4K)
  sounds/              (<name>.strudel or isolated stems)
  visuals/             (symlink to tools/visuals/src/compositions/<name>)
  sync/                (rendered audio + frames.json)
  renders/             (compiled 16:9 4K video: <name>.mp4)
  shorts/              (<name>.shorts.md + compiled 9:16 vertical Shorts: <name>-short-01.mp4)
```

## Honesty, language, and tone rules

1. **Default language is English (`EN`).** All on-screen educational cards (`subtitle`, `ctaText`, and every step's `tag`, `heading`, `body`, `formula`) and primary YouTube metadata (`titleEn`, `descriptionEn`, `defaultLanguage: "en"`) MUST be written in **English by default**, while Spanish (`titleEs`, `descriptionEs`) is attached automatically via YouTube `localizations.es`. Only create a Spanish on-screen version if the user explicitly requests it.
2. **Explain the real physics and math clearly.** When explaining binaural beats, state how the left ear receives frequency $f_1$ and the right ear receives $f_2$, producing a perceived amplitude modulation at $|f_2 - f_1|\text{ Hz}$ — and state plainly that it requires headphones and is music/acoustics, not medical treatment.
3. **Keep each card concise (under ~220 characters in `body`).** The viewer is watching the visual simulation or procedural diagram while reading; long paragraphs crowd the screen.
4. **Script, Voiceover & Synchronized Captions (Mandatory):** Every instructional video includes a narrative voiceover script in English explaining the acoustic and mathematical phenomena step by step. Synthesized via ElevenLabs (`tools/voice/tts.mjs`) with word-level timestamps and rendered with animated captions (`Captions.tsx`).

## How the educational engine works (`EduBreakdown.tsx` + `tools/youtube/edu.mjs`)

1. **Scaffolding a new instructional composition (`--scaffold`):**
   ```bash
   node tools/youtube/edu.mjs --scaffold <topic-kebab-name> --title="Human Title"
   ```
   Creates `media/<topic-kebab-name>/` with the complete standard template (`<name>.yaml`, `<name>.md`, `<name>.youtube.md`, `sounds/`, `visuals/`, `sync/`, `renders/`, `shorts/<name>.shorts.md`).
2. **Multi-step timeline (`steps`) + live procedural diagrams (`EduBreakdown.tsx`):**
   Each step displays:
   - `tag` (monospace cyan badge + timestamp)
   - `heading` (*Avenir Next Bold* uppercase)
   - `body` (1–3 clear, rigorous sentences in English)
   - `formula` (optional monospace mathematical/musical callout, e.g. `f ∝ n² + m² · A4 = 432 Hz`)
   - `diagram`: optional procedural animated SVG diagram synchronized to `frame`:
     - `"chladni"` — square plate nodal curves
     - `"fibonacci"` — three concentric canon rings rotating at `1/21`, `1/13`, `1/8` speeds toward alignment
     - `"binaural"` — carrier wave + slow phase-interference envelope (`Δf`)
     - `"pythagorean"` — harmonic ratio bars (`1:1`, `4:3`, `3:2`, `2:1`)
     - `"none"` — no diagram (keeps focus on the visual)

## Commands

```bash
# 1. Scaffold a new standalone instructional composition under media/<name>/:
node tools/youtube/edu.mjs --scaffold cymatics-chladni --title="Cymatics & Chladni Figures"

# 2. Dry-run: validate the instructional composition (16:9 4K or 9:16 Short in media/<name>/shorts/):
node tools/youtube/edu.mjs <name> --format=16x9 --dry-run
node tools/youtube/edu.mjs <name> --format=9x16 --dry-run

# 3. Render & upload the 16:9 4K instructional video (into media/<name>/renders/<name>.mp4):
node tools/youtube/edu.mjs <name> --format=16x9 --upload

# 4. Render & upload its 9:16 Short (into media/<name>/shorts/<name>-short-01.mp4):
node tools/youtube/edu.mjs <name> --format=9x16 --upload
```
