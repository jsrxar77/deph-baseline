# Bridging pieces to visuals

This project pairs each composition's `media/<name>/sounds/*.strudel` piece with generated video.
`tools/visuals/` is the Remotion engine, and — a correction to the original plan, found while building
the first one — each composition's actual video code lives inside that engine's own tree, at
`tools/visuals/src/compositions/<name>/`, not under `/media`; see the `visuals-compose` skill for why.
See `docs/sync-pipeline.md` for the audio-rendering pipeline (what's confirmed to work, the phases, and
the exact `media/<name>/sync/` output format); this document is the why, plus what changed once a real
visual existed.

## Why Strudel and Remotion pair well

Both are deterministic, declarative systems that describe *what happens at a given position in time*
rather than reacting to a live signal: a Strudel pattern is a pure function of a cycle range
(`pattern.queryArc(from, to)`), and a Remotion composition is a pure function of a frame number. Neither
needs the other running live to know what it produces at a given moment — which is exactly what makes
precomputed, frame-accurate visuals from a fixed piece practical, instead of needing real-time
audio-reactive analysis.

## What's already in place: the event data

`node tools/sounds/inspect.mjs media/<name>/sounds/<name>.strudel --json --cycles <total>` already gives exact, structured event
data per voice: `begin`, `end`, `layer`, and the full value (`note`, `gain`, `s`, effect params...) for
every event in the piece. That's close to being the keyframe manifest Remotion would read — e.g. a
shape's size driven by a drone attack's `gain`, or a color shift on the bells layer's onsets.

## What's missing: an actual audio file, and frame-converted keyframes

The VS Code extension (`cmillsdev.strudelvs`) only plays a piece live in its own webview; it doesn't
export audio, and the event data above is in cycles, not frames. `docs/sync-pipeline.md` covers both:
how a piece gets rendered to real audio (done), and how its events become frame-numbered keyframes
(`frames.json`/`manifest.json`, not built yet) — landing in `media/<name>/sync/` for the Remotion engine
in `tools/visuals/` to read directly, without needing to know anything about Strudel.

## Correction: the first visual didn't need `frames.json` at all

"Slow Drift" 's first composition (`slow-drift`, a WebGL Julia-set visualizer) turned out not to
need the precomputed event data described above. It reacts to the rendered `audio.wav` directly, at
render time, via `@remotion/media-utils`' `useWindowedAudioData`/`visualizeAudio` (real FFT analysis of
the actual waveform) — the "instead of needing real-time audio-reactive analysis" framing above was the
original assumption, not a tested conclusion, and it turned out backwards for this style of visual: FFT
analysis was simpler to wire up than building `frames.json` generation first would have been, and
produced a visual genuinely reactive to the audio, not just to section boundaries. `frames.json` still
has a place for a *different* style of visual — one keyed to specific notes/onsets rather than general
audio energy (e.g. a literal piano roll) — but it is not a prerequisite for every visual, as originally
assumed. See the `visuals-compose` skill for how the audio-reactive approach works.
