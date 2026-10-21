# AGENTS.md — deph (deep phase) Guidelines for AI Collaborators

Generative ambient pieces built with Strudel (audio) and Remotion (video).
The root unit of this project is the **composition** (`media/<name>/`), tying together sound, visuals, sync, and publish packs via a YAML manifest (`<name>.yaml`).

---

## ⚠️ Standing Rule: Independence from Claude
- **NEVER touch or modify Claude files or configurations** (`CLAUDE.md`, `.claude/`, etc.). They must remain intact and dedicated to Claude.
- All agent-specific configurations, skills, and rules live under `.agents/` and in this `AGENTS.md`.
- Both AIs collaborate on the same repository without overriding each other's configuration spaces.

---

## File Layout & Architecture (Standing Rule)

Organization is **composition-first**: everything belonging to one piece lives in its own folder under `media/<name>/`.

- **`media/<name>/`** — One subfolder per piece:
  - **`<name>.yaml`**: Composition manifest (`key`, `tempo`, `arc`, `total_cycles`, `domains` map). Single source of truth.
  - **`<name>.md`**: Piece documentation (arc/duration table, voices, design decisions, findings).
  - **`<name>.youtube.md`**: YouTube publish pack (titles EN/ES, description, chapters, tags, thumbnail brief). Managed by `youtube-publish`.
  - **`<name>.ableton.md`**: (Optional) Step-by-step Spanish guide for the user if refined in Ableton.
  - **`sounds/`**: Strudel code: `<name>.strudel`. Replaced versions go to `sounds/backup/`.
  - **`visuals/`**: Relative symlink (`../../tools/visuals/src/compositions/<name>`) pointing to the real Remotion code.
  - **`sync/`**: Audio & video bridge data: `audio.wav` (raw), `audio-master.wav` (loudness master), `frames.json`, `manifest.json`.
  - **`daw/`**: (Optional) Ableton MIDI (`<name>.mid`), `tracks.json`, `stems/`, Live Set.
  - **`renders/`**: Compiled final videos (`<name>.mp4`, 4K 60fps). Git-ignored.
- **`docs/`**: Cross-cutting specifications (`composition-workflow.md`, `sync-pipeline.md`, `daw-bridge.md`, `visuals-bridge.md`, `youtube-channel.md`).
- **`tools/`**: Domain tooling:
  - **`tools/sounds/`**: Node-based Strudel audio engine, inspector, renderer, master, keyframe exporter.
  - **`tools/visuals/`**: Remotion project (4K, WebGL shaders, signature torus, video render API).

### Naming Conventions
- Everything belonging to a piece carries exactly its **kebab-case** name (`slow-drift`, `the-field`).
- **Suffix only when needed to distinguish purpose**: `<name>.yaml`, `<name>.md`, `<name>.youtube.md`, `<name>.strudel`, `<name>.mid`, `<name>-master.wav`.
- **Never include extraneous words**: no brand (`deph`), no technique (`Fractal`, `Flow`), no stage (`Final`, `Proto`, `v2`), no resolution (`4K`).

---

## Skills & Workflows

Workspace skills are located in `.agents/skills/` (and declared in `.agents/skills.json`):

1. **`deph-compose`**: Entry point for scaffolding any new composition or major restructure. Questions to ask: domains needed, arc sections, duration, key/scale, kebab-case name.
2. **`strudel-compose`**: Composing the `.strudel` piece.
   - One `arrange()` per voice.
   - Use single quotes for helper constants (`ROOT = 'C'`, `KEY_SUFFIX = ':major'`).
   - FM synthesis for inharmonic bells (`fmh` integer ratios like 2 and 3 for warm meditative bells; `fmattack > 0`).
   - Always set `decay` explicitly when `sustain < peak` (avoids 0.05s default clap bug).
   - Reverb `size` is in **seconds** (4–8s), not a 0–1 knob. Assign distinct `.orbit(n)` per reverb size.
   - No round metric delay times for beatless ambient pieces.
   - Listener retention checklist: hook at 0:00, no static gap > 15s near start, core texture < 1:00, motif & progression, climax prepared by subtraction.
3. **`strudel-sync`**: Rendering audio and video keyframes.
   - `node tools/sounds/render.mjs media/<name>/sounds/<name>.strudel --cycles N --out media/<name>/sync/audio.wav --tail S`
   - `node tools/sounds/master.mjs media/<name>/sync/audio.wav --out media/<name>/sync/audio-master.wav` (-16 LUFS, -1 dBTP ceiling)
   - `node tools/sounds/frames.mjs media/<name>/sounds/<name>.strudel --cycles N --out-dir media/<name>/sync --audio media/<name>/sync/audio.wav`
   - Copy sync files to `tools/visuals/public/`.
### Visual Technologies (Standing Rule: Remotion vs. HyperFrames)
- **Mandatory Decision Question**: Before starting visuals on any composition, always ask the user whether the visual domain will be built with:
  - **Remotion**: Complex WebGL shaders, procedural fractals (Julia/Chladni), dynamic camera navigation, and FFT frequency-band audio reactivity.
  - **HyperFrames**: Clean HTML5 + CSS + GSAP vector animations, sacred geometry, typography, and symbol layout with frame-by-frame timeline control.
- For **Remotion**, use `visuals-compose` (`tools/visuals/src/compositions/<name>/<name>.tsx`).
- For **HyperFrames**, use `hyperframes-video` (`media/<name>/visuals/index.html` or dedicated hyperframes asset).

4. **`visuals-compose`**: Building Remotion visuals in `tools/visuals/src/compositions/<name>/<name>.tsx`.
   - Remotion GL renderer set to `angle`.
   - Duration derived from audio with `getAudioDurationInSeconds(staticFile('<name>-audio.wav'))`.
   - Audio reactivity must be a pure function of `frame`.
   - Play `<name>-master.wav` in `<Audio>`, analyze `<name>-audio.wav` (raw) in `useAudioBands`.
   - Exact sound events driven by `<name>-frames.json`.
   - Background signature layer: "creation torus" (`tools/visuals/src/signature/phaseRings.ts`).
   - Production video render: `node tools/visuals/render.mjs <compositionId> <outputPath>` (writes live `.progress.jsonl`).
4b. **`hyperframes-video`**: Vector, geometric, and typographic animations built with HTML5 + CSS + GSAP timelines.
   - Composition entry: `media/<name>/visuals/index.html`.
   - Timelines registered in `window.__timelines[<composition-id>]` (`gsap.timeline({ paused: true })`).
   - Run layout and motion validation prior to render: `npx hyperframes check` or `node tools/render-hyperframes.mjs`.
5. **`ableton-bridge`**: Refinement in Ableton Live.
   - Export MIDI: `node tools/sounds/midi.mjs ...`
   - Stems: `node tools/sounds/render.mjs ... --only '$N'`
   - Write step-by-step Spanish guide for the user (`<name>.ableton.md`).
   - Bring back mix: convert to 16-bit 48kHz WAV, `align-check.mjs`, master, `frames.mjs`.
6. **`youtube-publish`**: YouTube publish pack (`media/<name>/<name>.youtube.md`).
   - Titles (EN/ES, <100 chars), description, chapters from yaml `arc` & `tempo`, 3-6 hashtags, tags.
   - Honesty: 432 Hz and binaural beats as technical facts, never medical/health claims.
   - Thumbnail: 1280x720, <2MB, rendered via `VideoThumbnail.tsx` in `tools/visuals/src/brand/`.
7. **`deph-style`**: Living taste guide & decision log.
   - Read before proposing creative directions.
   - Append user decisions, reactions, and findings after every creative session.

### Advanced Production & Ableton Skills (from strudel-baseline)
8. **`vst-scanner`**: Discovery of installed VSTs, Audio Units (AU), and presets on macOS without brute-force scans.
   - Catalog: `.agents/catalogs/plugins.json` and `.agents/catalogs/plugins.md`.
   - Scanner script: `node .agents/scripts/scan_plugins.js`.
   - Zero-hallucination rule: Inspect real preset folders before recommending any preset.
9. **`strudel-live-coding`**: Deep TidalCycles mini-notation reference, rhythm manipulation, squishing, and mandatory drum helpers (`drums` & `kit`).
10. **`strudel-producer-suite`**: 4-phase production orchestrator: Composition (Strudel + YAML) → Provisioning (8-Ch Template) → Arrangement (MIDI + Locators) → Mix & Master.
11. **`strudel-ableton-deployer`**: Automated provisioning of YAML compositions into Ableton Live via `ableton-mcp`. Sigue estrictamente el flujo canónico paso a paso documentado en `docs/ableton-provisioning-workflow.md` (Paso 1: conexión -> Paso 2: template -> Paso 3: pista por pista nombre canónico `Ch {N} - {Rol} ({VST} - {Preset})` + VST + verificación estricta de devices -> Paso 4: tempo -> Paso 5: play Strudel en vivo). Prohibido abrir programas sin orden del usuario.
12. **`strudel-yaml-composer`**: Decoupled workflow separating musical logic (`.strudel`) from sound design (`.yaml`).
13. **`strudel-vs-plus`**: Maintenance and architecture standards for the Strudel VS + dual Web Audio & MIDI extension.
14. **`ableton-device-controller`**: Deep inspection, automated instrument rack wrapping (`wrapInRack`), real-time macro modulation, and master chain provisioning (`master-setup`) via dual `ableton-mcp` (TCP 9877) and `Producer Pal` (HTTP 3350). CLI bridge at `tools/sounds/ableton-controller.mjs`.

---

## Working Guidelines with the User
- **Propose and Align**: Explain understanding and concrete plan, wait for confirmation before executing major creative decisions.
- **Measure, Don't Guess**: Validate audio with the inspector (`inspect.mjs --summary`), rendered waveform scans, or FFT; validate video with contact sheets and Remotion Studio.
- **Reconcile Manifests**: Whenever sound or visuals change, update the entire YAML manifest (`<name>.yaml`) and associated docs in the same turn.
- **Languages**: Spanish in chat conversation with the user; English in codebase, commit messages, and docs (except user-facing Ableton guides which are in Spanish).
