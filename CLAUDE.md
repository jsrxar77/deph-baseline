# deph (deep phase)

Generative ambient pieces built with Strudel (audio) and, eventually, Remotion (video). The root unit of
this project is the **composition**, not "a sound" or "a visual" — a composition is a folder that can
carry a sound side, a visual side, or both, tied together by a small YAML manifest. The user hears the
audio side with the VS Code extension `cmillsdev.strudelvs` (Cmd+Enter plays the file, Cmd+Shift+Enter
the selection, Cmd+. stops), which loads the sample banks itself. Claude cannot hear audio and cannot
drive that extension, so it edits the file and reads the result with the headless inspector instead.

## File layout (standing rule — keep this and reality in sync)

Organization is composition-first: everything belonging to one piece lives together, split by domain
inside that piece's own folder, rather than grouped by media type across the whole project.

- **`/media`** — one subfolder per composition: `media/<name>/`. Nothing else goes directly under
  `/media` — no shared/ungrouped content, no tooling.
  - **`media/<name>/<name>.deph.yaml`** — the composition's manifest: `key`, `tempo`, `arc` (section
    names + cycle counts), `total_cycles`, and a `domains` map (`sound`/`visual`/`sync`, each with a
    `status` — `planned`/`in-progress`/`done`/`not-built` — and the path to that domain's content). This
    is the *only* place cross-domain info lives; a fact that belongs to one domain (e.g. voice design
    notes) stays in that domain's own files, not duplicated into the yaml. See
    `media/slow-drift/slow-drift.deph.yaml` for the format.
  - **`media/<name>/<name>.md`** — the composition's doc: arc/duration table, voices, key, design
    decisions and issues found while building it. One file, not a `pieces/` subfolder — a composition
    folder already scopes everything to a single piece.
  - **`media/<name>/<name>.youtube.md`** — the composition's YouTube publish pack (titles, description,
    chapters, hashtags, tags, thumbnail brief, upload checklist), tracked in git. Built and kept current by
    the `youtube-publish` skill; its status is tracked in the yaml under `publish`. The channel-wide copy
    (positioning, channel description, standard footer, open decisions) is in `docs/youtube-channel.md`.
  - **`media/<name>/sounds/`** — the Strudel side: `<name>.strudel` plus any variant files (e.g. an
    unarranged comparison version). This is where `strudel-compose` writes.
  - **`media/<name>/visuals/`** — a **symlink** to the real Remotion code,
    `../../tools/visuals/src/compositions/<name>` (relative), so opening the composition's folder shows its
    whole visual side. The code itself cannot live here: Remotion's bundler resolves `node_modules` from a
    file's real path, and a file under `media/` cannot find `tools/visuals/node_modules` (tested with a
    symlink from `tools/` into `media/`: `remotion` and `react` resolved, but `@remotion/media-utils` failed
    with `Module not found`). The link points the other way, into `tools/`, which the bundler never sees.
    Until a visual exists the folder is just an empty directory; `visuals-compose` replaces it with the
    link when it creates the code folder. See that skill for the other corrections found alongside it
    (audio wiring, WebGL renderer config, YouTube color format).
  - **`media/<name>/sync/`** — rendered bridge output for this piece: `audio.wav` (raw render),
    `audio-master.wav` (loudness master), `frames.json` (every event with its exact frame number) and
    `manifest.json`. See `docs/sync-pipeline.md`. This is where `strudel-sync` writes. The `.wav` files are
    git-ignored; the two small JSON files are tracked.
  - **`media/<name>/renders/`** — the piece's compiled final videos (`.mp4`), rendered with
    `npx remotion render <CompositionId> ../../media/<name>/renders/<name>.mp4` from `tools/visuals/`.
    Git-ignored (several GB each, regenerable). Not `sync/`, which is the audio/video bridge data, and not
    `~/Movies` or the Desktop, which sit outside the project (a file left on the Desktop vanished once).
- **`/docs`** — cross-cutting documentation only: the composing workflow (`composition-workflow.md`), the
  audio/video sync pipeline spec (`sync-pipeline.md`), the visuals-bridge overview
  (`visuals-bridge.md`), and the YouTube channel positioning and standing copy (`youtube-channel.md`, with its brand images in `docs/youtube-channel/`, e.g. `banner.jpg`, rendered from the `DephBanner` composition in `tools/visuals/src/brand/`). Never a specific composition's doc — that's `media/<name>/<name>.md`.
- **`/tools`** — domain-first, one subfolder per domain, each its own npm project (own `package.json`,
  `package-lock.json`, `node_modules`; there's no project-root `package.json`). `tools/sounds/` holds
  every Strudel/audio tool (the inspector today; the render/sync pipeline once it's built) — it reads and
  writes files under `media/<name>/sounds/` and `media/<name>/sync/` but doesn't live there itself.
  `tools/visuals/` holds the Remotion engine: scaffolded via `create-video`, with the Remotion Agent
  Skills installed under `.agents/skills/` (symlinked from `.claude/skills/` — run `npx remotion skills
  update` from inside `tools/visuals/` to refresh them). Every composition's actual video code also lives
  here, under `tools/visuals/src/compositions/<name>/` (see the `media/<name>/visuals/` bullet above for
  why, and the `visuals-compose` skill for the full detail) — the one place content ended up inside
  `/tools` rather than `/media`, discovered by testing, not planned upfront. `tools/visuals/src/signature/`
  holds deph's shared visual identity (the "creation torus" GLSL layer) — every composition should apply it,
  not reimplement its own version; see the `visuals-compose` skill. A future non-audio, non-video tool
  gets its own `tools/<domain>/` with its own dependencies, not a flat drop into `/tools`.
- **`.claude/skills/`** — one skill per real workflow:
  - `deph-compose` — the entry point for starting *any* new composition (or substantially reworking one):
    asks structure/duration/key and which domains are needed, scaffolds the `media/<name>/` folder and
    yaml, then hands off to the domain skills below.
  - `strudel-compose` — writing the actual `.strudel` file and its doc, once a composition folder exists.
  - `strudel-sync` — rendering a finished piece to audio + frame-numbered keyframes in `sync/`.
  - `visuals-compose` — building the actual Remotion composition (in `tools/visuals/src/compositions/`,
    wiring in the real `audio.wav`).
  - `youtube-publish` — the last step of the pipeline: builds and maintains each composition's YouTube publish
    pack once a video exists (honest claims, verified YouTube rules, EN/ES). **Whenever a video is rendered or
    changes, create or refresh the pack**; Claude never uploads anything.
  - `deph-style` — not a pipeline step: the accumulating record of deph's evolving style (what the user liked
    and rejected and why, measured findings, how they like to work, open questions, a dated decision log).
    Read it before proposing a creative direction; **append to it after every user-guided creative decision.**
  Apart from `deph-style`, no catch-all skill; each covers exactly one step of the pipeline above.
- `test.strudel` at the project root is the inspector's own scratch fixture, not a composition — it
  stays at the root, not under `/media`.

This layout has moved several times already (tool files were flat in `/tools`, piece docs were in
`/docs/pieces`, compositions and the Remotion project were flat under `/media` by media type before
consolidating composition-first) — if a new kind of file doesn't obviously fit one of the folders above,
ask rather than guessing a new convention on the spot.

## Starting a new composition

Invoke the `deph-compose` skill (`.claude/skills/deph-compose/SKILL.md`) for the full workflow. Summary:

1. **Ask which domains** the composition needs — sound only, visual only, or both — and don't assume both
   just because the project eventually supports video.
2. **Ask about structure** — arc sections (intro, development, climax, deceleration, outro; not
   necessarily all five, not necessarily in that order) and duration, overall or per section.
3. **Confirm a key/scale** (e.g. "C major", "C dorian") — this seeds the yaml and drives every `scale()`
   call in the sound domain.
4. **Scaffold** `media/<name>/<name>.deph.yaml`, `media/<name>/<name>.md`, and the subfolders for the
   domains actually needed (always `sounds/`, `visuals/`, `sync/` together, even if some start empty —
   see `deph-compose` for why).
5. **Delegate**: sound content to `strudel-compose`, video content to `visuals-compose` (once it exists),
   the audio+keyframe bridge to `strudel-sync`. Each of those skills updates its own `domains.*.status`
   entry in the yaml as it finishes its part — the yaml is written incrementally, not all at once upfront.

## Composing the sound side of a piece

Once a composition folder exists (see above), writing the `.strudel` file itself follows these rules —
the full version, kept in sync with this summary, is packaged as the `strudel-compose` skill
(`.claude/skills/strudel-compose/SKILL.md`):

1. **Structure sections with `arrange()`.** One `arrange()` timeline per voice/layer (not one `arrange()`
   mixing all voices into pre-combined sections), so each instrument stays visible as its own `$:` layer
   to the inspector. See `media/slow-drift/sounds/slow-drift.strudel` for the pattern.
2. **Every scale in use is a named constant** that every `scale()`/chord call actually derives from —
   usually one (from the yaml's `key`), occasionally more if the piece genuinely needs a second. Declare
   these helper constants with **single quotes**: Strudel auto-parses every double-quoted string literal
   as mini-notation at parse time, and one starting with `:` (e.g. building a scale suffix via
   `KEY.split(":")`) breaks on that — see the `strudel-compose` skill for the tested example.
3. **Write the piece to `media/<name>/sounds/<name>.strudel`**, and document it in `media/<name>/<name>.md`
   (see `docs/composition-workflow.md`).
4. **Before calling it done, reconcile the whole yaml** — `tempo.cpm`, each `arc[].cycles`, and
   `total_cycles` are the real numbers this step discovers (`deph-compose` left them `null`); update them
   along with `domains.sound.status`, not just the status field alone.

## Inspecting a pattern

```
node tools/sounds/inspect.mjs <file.strudel> [--summary] [--roll] [--all] [--cycles N] [--from N] [--res N] [--json]
```

(Run from the project root — the file argument resolves relative to wherever you run it from. There's no
`npm run inspect` from the root: `npm --prefix tools/sounds run ...` changes the script's working
directory, which breaks that relative file argument — tested, not assumed. `npm run inspect --` still
works as a secondary option if you're already `cd`'d into `tools/sounds/`, with paths relative to there.)

It evaluates the file in Node (no browser, no audio). Modes (combine any number; default is the
event list alone):

- **(no flag) event list** (default window: 4 cycles) — every event, per cycle: position, duration,
  the `$:` layer it came from, and its values (`s`, `note`, `gain`, `cutoff`...).
- **`--summary`** (default window: 8 cycles) — tempo, total events, loop length (smallest number of
  cycles after which the pattern repeats exactly), peak simultaneous onsets, an estimated key
  (Krumhansl-Schmuckler over pitched events — a guess, state it as one), and per-layer sounds, pitch
  range, note histogram, onset grid and effect parameter ranges.
- **`--roll`** (default window: 2 cycles) — a text piano roll, one row per pitch or per sound, grouped
  by layer; `--res N` sets steps per cycle (default 16). `#` onset, `=` sustain, `+` off-grid onset.
- **`--all`** — all three.

Errors (unknown functions, syntax errors, missing file) are printed as a short message, not a stack
trace. Run the inspector after every edit to a `.strudel` file, before telling the user the change
works — use `--summary` to sanity-check the result (loop length, key, density) rather than reading
the raw event list by eye. Use `--json` when you need to compute something the summary doesn't
already give (with several modes, it prints one JSON object keyed by mode; the roll's `#`/`=`/`+`
grid is included as a string, not restructured).

Example: `node tools/sounds/inspect.mjs media/slow-drift/sounds/slow-drift.strudel --summary --cycles 180`
(use enough cycles to cover a piece built with `arrange()` — the default windows are sized for short
loops, not full pieces).

## What it cannot tell you

- How anything sounds: timbre, loudness, mix, effect character. Ask the user.
- Whether a sample exists. It only sees sound names like `bd`, not audio.
- Effects appear only as parameter values (`lpf(800)` shows as `cutoff=800`).
- The key estimate is a statistical guess (best correlation against major/minor profiles), not a fact;
  say so, and check `alternative` in `--summary --json` when the margin between `best.r` and it is small.

## Rendering a piece to real audio

```
node tools/sounds/render.mjs <file.strudel> --cycles N --out <output.wav> [--tail S] [--sample-rate N]
```

Renders the *whole* piece (not a preview window — `--cycles` is required, use the composition's
`total_cycles`) through the real Strudel audio engine (`superdough`) via `node-web-audio-api`'s
`OfflineAudioContext`, no browser. Synth-only for now (samples like `s("bd")` aren't supported yet — no
piece composed so far has needed them). `--tail` (default 3s) leaves room for a release/reverb decay
after the last event to finish. The renderer guards against an intermittent engine lockup (output frozen
on one repeating 128-sample block): it waits for reverb impulse responses to finish generating, suppresses
node cleanup during the render, refuses to write a file where that block repeats for 2+ seconds, and
re-runs itself up to 3 times — and it warns if two voices with different reverb `size` share an `orbit`
(give each its own `.orbit(n)`; see `strudel-compose`). Output goes to that composition's `sync/` folder — see the `strudel-sync`
skill and `docs/sync-pipeline.md` for the full pipeline.

## Video keyframes: `frames.json` and `manifest.json`

```
node tools/sounds/frames.mjs <file.strudel> --cycles N --out-dir media/<name>/sync [--fps 60] [--audio media/<name>/sync/audio.wav]
```

Evaluates the piece exactly like `render.mjs` and writes every event with its exact time (`seconds`, and
`frame` as a float at the given fps) plus its raw parameters (`note` as MIDI, `pan`, `gain`, ...), and a
manifest (cps, fps, duration and frames from the real audio length, per-layer summary). The cycles ->
seconds -> frames conversion exists only in this script. Verified for Slow Drift: bell onsets in
`frames.json` match the strongest energy rise in the rendered audio to within 0-10 ms (8 of 8 checked).
The video reads a copy at `tools/visuals/public/<name>-frames.json` (git-ignored). Regenerate it after
every sound change, together with the render and the master. Slow Drift uses it for the bell pulses
(`bellPulses.ts`).


## Mastering a rendered piece (loudness)

```
node tools/sounds/master.mjs media/<name>/sync/audio.wav --out media/<name>/sync/audio-master.wav [--lufs -16] [--ceiling -1]
```

The raw render is quiet (Slow Drift: -23.6 LUFS, true peak -9 dBFS); YouTube normalizes toward about -14 LUFS
and lowers loud files but does not raise quiet ones, so an unmastered piece plays noticeably softer than
others. `master.mjs` (needs ffmpeg) measures integrated loudness and true peak, applies ONE constant gain to
reach the target (default -16 LUFS, a ceiling of -1 dBTP), and verifies the result. No compression or EQ, so
the piece's dynamics are untouched (Slow Drift: LRA 15.9 LU before and after); a transparent limiter engages
only if the gain would push peaks over the ceiling. Keep `audio.wav` (raw) as the source of truth; the master
is derived and regenerated after every sound change. Both are git-ignored. Playback in the video uses the
master; the audio-reactive analysis keeps reading the raw file (see `visuals-compose`).

## Analyzing an existing recording (audio-first pieces, no Strudel source)

```
ffmpeg -i media/<name>/sync/source.mp3 -ar 48000 -c:a pcm_s16le media/<name>/sync/audio.wav
node tools/sounds/master.mjs media/<name>/sync/audio.wav --out media/<name>/sync/audio-master.wav
node tools/sounds/analyze-audio.mjs media/<name>/sync/audio.wav --out media/<name>/sync/analysis.json [--fps 30]
```

For a composition whose music already exists (`domains.sound.status: not-requested`), `analyze-audio.mjs` is the
counterpart of `frames.mjs`: it *measures* the recording instead of reading events from a pattern. It writes, per
video frame, dB-linear loudness, six band levels, spectral centroid, flux, stereo width/balance and the stereo position
of each band group (`pan.low|mid|high`, -1..1), plus onsets in three groups (low/mid/high, each with its stereo `pan`
and register `freq`), candidate section boundaries (self-similarity novelty), a key estimate and a
tempo guess. Section boundaries, key and tempo are estimates, and the low-band onsets are noisy on sustained or
modulated bass (they are not reliable kick detection) — the user's ear confirms. The source recording
(`sync/source.*`) is git-ignored: it may not be ours to publish.

## Inspector internals and portability

- `tools/sounds/inspect.mjs`: the CLI (arg parsing, evaluation, output). `tools/sounds/eval-strudel.mjs`:
  the shared pattern-evaluation core (used by both `inspect.mjs` and `render.mjs` — one implementation of
  the REPL shim, not two). `tools/sounds/analyze.mjs`: pure functions (no Strudel imports) that turn
  events into the summary and the roll — reusable/testable on their own. `tools/sounds/wav.mjs`: the WAV
  writer `render.mjs` uses. `tools/sounds/resolve-hook.mjs`: works around `@kabelsalat/web` shipping a
  browser-only `main` entry that Node cannot import (see the comment in that file).
- To reuse in another project: copy the whole `tools/sounds/` folder (its `package.json` already lists
  the `@strudel/*`, `@strudel/webaudio`, and `node-web-audio-api` dependencies — `npm install` inside it)
  and this file. Requires Node >= 22.15 (`module.registerHooks`).
- `eval-strudel.mjs` re-implements the small part of the browser REPL that `$:` labels, `setcpm`/`setcps`,
  `all` and `_$:` muting need — shared by every script that evaluates a `.strudel` file, so a Strudel
  update that adds REPL-level behavior only needs fixing in this one place.
