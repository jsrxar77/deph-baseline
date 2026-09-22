---
name: strudel-sync
description: Use when rendering a finished composition's Strudel piece (media/<name>/sounds/<name>.strudel) to real audio and Remotion-ready video keyframes for the Remotion engine in tools/visuals/ — covers the rendering approach (the real Strudel audio engine in Node, no browser), the cycles-to-frames time conversion, and the media/<name>/sync/ output format. Not for composing pieces themselves; see the strudel-compose skill for that.
---

# Syncing a piece to audio + video keyframes

Renders a finished `media/<name>/sounds/<name>.strudel` piece into `media/<name>/sync/`: a real audio
file plus frame-numbered keyframe data, for the Remotion engine in `tools/visuals/` to read directly — no
Strudel knowledge needed on that side. Full spec, status, and the reasoning behind each choice:
`docs/sync-pipeline.md`. This skill is the short, actionable version; keep both in sync if either
changes.

**Status: Phases 1 and 2 done — audio rendering is real and working.** `frames.json`/`manifest.json`
generation (the video-keyframe half) and sample playback (Phase 3) aren't built yet. Read
`docs/sync-pipeline.md` for the full detail; this skill is the short, actionable version.

## Rendering audio: use the script, don't re-derive the approach

```
node tools/sounds/render.mjs <file.strudel> --cycles N --out <output.wav> [--tail S] [--sample-rate N]
```

`--cycles` is required (the whole piece's `total_cycles` from its yaml — there's no short-preview default
like the inspector has). `--tail` (default 3s) leaves room for a release/reverb decay after the last
event to finish rendering instead of being cut off. Example, for "Slow Drift" (180 cycles):

```
node tools/sounds/render.mjs media/slow-drift/sounds/slow-drift.strudel --cycles 180 --out media/slow-drift/sync/audio.wav --tail 4
```

This is the real Strudel audio engine (`@strudel/webaudio`/`superdough`) running in Node via the
`node-web-audio-api` polyfill — not a browser, not the third-party `live-coding-music-mcp` (not needed).
Verified end-to-end on "Slow Drift": the rendered WAV's per-section RMS tracks the piece's arc exactly
(quiet intro → loudest at the climax → fading outro), not just "some audio came out." `docs/sync-pipeline.md`
has the exact list of environment shims `render.mjs` relies on (Web Audio class polyfills,
`registerSynthSounds()`, `window`/`document` as `EventTarget` instances) — if a *new* effect or feature
throws an error this list doesn't cover, add to it there by finding the actual cause, the same way this
list was built, rather than guessing a fix.

Sample-based pieces (`s("bd")` etc.) aren't supported by `render.mjs` yet — every piece composed so far is
synth-only, so this hasn't been needed; see `docs/sync-pipeline.md`'s Phase 3 when it is.

When looking up sample URLs or manifests, read `@strudel/webaudio`'s actual installed source for the
real manifest location rather than guessing a plausible-looking GitHub path — a guessed path cost real
time here already (see `docs/sync-pipeline.md` for what the wrong guesses looked like).

## Time conversion: exactly one implementation

```
cycles --(cps, from the piece's setcpm())--> seconds --(fps, 60 for this project)--> frames
```

Write this once, in the script that produces `frames.json`. Never duplicate it (e.g. re-hardcoding the
piece's tempo inside `tools/visuals/`) — that's how audio and video silently drift apart after a tempo
edit. The `.strudel` file's `setcpm()` remains the single source of truth for the number; once computed,
mirror it into `media/<name>/<name>.deph.yaml`'s `tempo.cpm` field so other tools can read tempo without
parsing Strudel — that mirroring doesn't count as a second implementation, since nothing recomputes it
independently there.

## Output format

```
media/<name>/sync/
  audio.wav      — full render, 48kHz by default
  frames.json    — inspector events with begin/end converted to frame numbers
  manifest.json  — fps, cps/cpm, sample rate, duration, total frames, filenames, generated-at timestamp
```

`media/<name>/sync/` is a subfolder of that composition's own folder (not a project-wide `/sync`) — see
`CLAUDE.md`'s file-layout rule.

## Phases

1. Prototype `superdough` against the Node context with a trivial pattern — done.
2. Render a synth-only piece end-to-end to `audio.wav` — done (`tools/sounds/render.mjs`).
3. Extend to real sample playback (fetch + decode, already confirmed feasible), with a local cache — not
   started; no composed piece has needed it yet.
4. `frames.json`/`manifest.json` generation (the video-keyframe half of the output format below) — not
   started.

## Where things go

Rendering/conversion scripts: `tools/sounds/` (domain-first, alongside the inspector — see `CLAUDE.md`).
`eval-strudel.mjs` (pattern evaluation, shared with the inspector), `render.mjs` (the CLI above), `wav.mjs`
(the WAV writer). Update `docs/sync-pipeline.md`'s "confirmed vs not yet" list as each phase actually gets
verified, the same way `media/<name>/<name>.md` records what was found while building a piece.

## Before finishing: reconcile the whole yaml, not just your own status

`domains.sync.status` is `in-progress` once `audio.wav` exists but `frames.json`/`manifest.json` don't
yet (today's state for every rendered piece), and `done` only once all three do — don't jump straight to
`done` just because the audio render succeeded. Also re-read `media/<name>/<name>.deph.yaml` and check
whether the render surfaced anything that should update other fields too — e.g. if `tempo.cpm` was still
`null` there (sound domain finished without reconciling it, or the piece's tempo changed since), fill it
in from the same `setcpm()` reading used for the time conversion, rather than leaving the yaml stale next
to a finished render. See `deph-compose`'s "Hand off" section for this rule stated once, canonically —
every domain skill keeps the *whole* yaml current, not just its own corner.
