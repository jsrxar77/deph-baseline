---
name: ableton-bridge
description: Use when a deph composition's sound should be refined in Ableton Live with the Mac's VST/AU library (Surge XT, Serum 2, Vital, Kontakt, Ozone…) — exporting the Strudel piece as MIDI + audio stems, playing it live to Ableton over the IAC MIDI bus for quick sound tests, writing the composition's beginner-level Ableton guide (media/<name>/<name>.ableton.md), and bringing the exported mix back into media/<name>/sync/ (alignment check, mastering, keyframes). Not for composing (strudel-compose) or rendering with Strudel's own engine (strudel-sync).
---

# Ableton bridge: Strudel → Ableton → back into the pipeline

Strudel composes; Ableton refines (real instruments, effects, mix, master). Optional per composition. Without it, the
`strudel-sync` pipeline is unchanged. Full spec and the reasoning for every choice: `docs/daw-bridge.md`. This
is the actionable version; keep both in sync.

## The user is new to Ableton

Every guide is written for **zero Ableton experience**, in Spanish (the user's language). Name the exact
plugin, the exact preset (one that exists on this Mac: check the preset folders, don't invent names), where to click,
which knob to set and to what value, which effects in which order. Explain every term the first time (track, clip,
arm, return, Master). Say plainly that preset choices come from names and measured parameters, not from listening.

Preset folders on this Mac (list them, don't guess):
- Surge XT: `/Library/Application Support/Surge XT/patches_factory/<Category>/*.fxp`. The `.fxp` holds readable
  XML, and `LC_ALL=C grep -a` gets `scenemode`, `a_vca_velsense`, `a_env1_attack` (log2 seconds), `pbrange_up`.
- Serum 2: `/Library/Audio/Presets/Xfer Records/Serum 2 Presets/Presets/Factory/<Category>/`
- Vital: `~/Music/Vital/<Pack>/Presets/`

## Steps

1. **Export MIDI** (path A, the final version):
   `node tools/sounds/midi.mjs media/<name>/sounds/<name>.strudel --cycles <total_cycles> --out-dir media/<name>/daw --names a,b,c`
   Names in layer order: check which `$:` is which with `inspect.mjs --summary`. Read the printout and
   `tracks.json`: tuning cents and bend, fader suggestions, `params` per track, audio-only layers, warnings.
2. **Stems for audio-only layers** (no notes, e.g. `freq` in Hz):
   `node tools/sounds/render.mjs <file> --cycles <total_cycles> --only '$N' --out media/<name>/daw/stems/NN-<name>.wav`
3. **Write `media/<name>/<name>.ableton.md`**: follow `media/slow-drift/slow-drift.ableton.md` as the model. It
   covers one-time Ableton setup, tempo, loading each track (plugin, preset, **Vel > Gain −40 dB**, envelope values
   from `params`), effects recreating reverb/delay/pan/filter, the reference track, the Tuner check for the tuning, live
   testing, saving the Live Set, the export settings, and what to tell Claude afterwards.
4. **Live testing** (path B), when the user wants to try sounds quickly:
   `node tools/sounds/midi-live.mjs <file> --cycles <total_cycles> --names a,b,c --watch [--from <cycle>]`
   Start it from Claude's shell only when the user says Ableton is ready (tracks armed and listening to IAC). It is
   long-running (a whole piece plays in real time), so run it in the background and tell the user how to stop it. IAC
   is already enabled on this Mac ("IAC Driver Bus 1"); `--list` shows the ports.
5. **Back into the pipeline** after the user exports (see `docs/daw-bridge.md` for the exact commands):
   - Convert to `sync/audio.wav` with the ffmpeg line from the doc (16-bit, 48 kHz, plain header).
   - Run `align-check.mjs`; if it's NOT ALIGNED, tell the user the offset and how to fix it in Ableton (usually
     the export didn't start at bar 1). Don't shift it silently.
   - Master: in Ableton (Ozone) → `master.mjs --measure`, or in the pipeline → `master.mjs --out`. Ask which,
     per composition; the user left both open.
   - `frames.mjs --audio ...`, copy the sync data into `tools/visuals/public/`, and warn that the video's
     audio-reactivity was tuned against the old mix.
6. **Yaml**: add or update `domains.daw` (`status`, `midi`, `stems`, `guide`, `project`) and set
   `domains.sound.source: ableton` once `sync/audio.wav` comes from Ableton (`strudel` otherwise). Then a
   **YouTube pack refresh** if a video gets re-rendered (`youtube-publish`), and a **deph-style entry** for every sound
   choice the user makes in Ableton (plugins, presets, effects they kept or rejected).

## Driving Live through the Ableton MCP server (the `mcp__ableton__*` tools)

When the `ableton` MCP server is connected (Live open, Control Surface "AbletonMCP"), Claude can build the set itself
instead of the user following the whole guide. Tested and documented in `docs/daw-bridge.md` ("Driving Live directly").
In short:
- Claude can do tempo, tracks, loading Surge XT / Serum 2 and native effects by browser URI, notes with velocity,
  Session clips copied to the Arrangement, native effect parameters, fades as clip automation of a Utility after the
  synth (dB = 35 × value between −0.5 and 0.5), volumes and pans, and recording (real time, at most 5 min per call).
- The user does presets, tuning files (Surge `.scl`/`.kbm`, Serum 2 `.tun`) and anything inside a plugin, because Live
  exposes no plugin parameters to the API without Configure mode. Pitch bend can't be written, so 432 Hz comes from
  the synths' tuning in this path.
- Sustained voices (drones) become one held note per segment in Live: a retriggered long note that cross-fades in
  Strudel re-attacks audibly with a preset's short envelope (found on Musica Universalis's drone).
- Work in a new or backed-up set. If every command times out, ask the user to dismiss a dialog in Live (Enter).

## Facts found while building this (don't re-derive)

- `strudelvs` has no Strudel MIDI output (no WebMIDI in its bundle), so `.midi()` from Cmd+Enter does nothing.
  That's why `midi-live.mjs` exists.
- 1 cycle = 1 bar of 4/4 → BPM = cpm × 4. Ableton's tempo must be set by hand; the guide says so.
- Surge XT factory presets: bend range ±2 (matches the default `--bend-range`). Vel > Gain is usually 0 dB, i.e.
  velocity ignored; it is per scene, so prefer `scenemode 0` (single scene) presets or set it in both scenes.
- The velocity law is Surge's own (dB-linear, from `SurgeVoice.cpp`). Other synths only approximate the fades. A
  note's level is `gain × velocity` (superdough multiplies them). For Serum 2 the guide tells the user to test a fade-in
  and, if it's missing, add Velocity → Main Vol in its mod matrix (unverified by Claude).
- Voices in a non-12-TET tuning with different offsets per note (e.g. Pythagorean): `--no-bend <track>` plus
  `scl.mjs` (.scl/.kbm) loaded in Surge XT. The root key keeps its 12-TET frequency at the piece's A4.
- Dense pieces render slowly (nodes are never freed during a render). Render each layer with `--only` in parallel
  and sum them; they are also useful reference stems. `phaser` is not rendered headlessly: put it in Ableton.
- Pick presets that exist (list the folders) and prefer single-scene Surge presets. Serum 2 folders:
  `Factory/<Category>/` (Bass has subfolders: Acid, Sub, Synth, …).
- `align-check.mjs` needs a layer with sharp attacks (default: the shortest `attack`). Aligned audio reads about
  +15 ms, not 0. Tolerance is 35 ms.
- `frames.mjs --audio` reads the duration from a plain 44-byte WAV header. Always convert Ableton's export with
  the ffmpeg line; don't copy it as-is.
