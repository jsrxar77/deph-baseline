# Sync pipeline: rendering pieces to audio + video keyframes

The concrete plan for turning a `media/<name>/sounds/<name>.strudel` piece into a real audio file and
Remotion-ready keyframes, landing in `media/<name>/sync/` for the Remotion engine in `tools/visuals/` to
read. See
`docs/visuals-bridge.md` for why this pairing makes sense at all. **Status: Phases 1 and 2 (below) are
done — `tools/sounds/render.mjs` renders a synth-only piece to a real `audio.wav`, verified end-to-end on
"Slow Drift" — and `tools/sounds/frames.mjs` now generates `frames.json`/`manifest.json` (the video-keyframe
half of the bridge), verified against the rendered audio (bell onsets within 0-10 ms). `tools/sounds/master.mjs`
adds a loudness master. Real sample playback (Phase 3) is not built yet.**

## Rendering strategy: the real Strudel engine, in Node, no browser

Three approaches were considered:

- **A — the real Strudel audio engine (`@strudel/webaudio`/`superdough`) running in Node**, via
  `node-web-audio-api` (a native Web Audio API implementation for Node, no browser). Chosen approach.
- **B — the third-party MCP `live-coding-music-mcp`**, which drives a real headless browser via
  Playwright and captures its output. Fallback if A turns out not to work end-to-end.
- **C — recording the user's system audio** while they play a piece for real in the VS Code extension.
  Perfect fidelity, but manual, real-time, and needs a virtual audio device (e.g. BlackHole on macOS).

A was chosen and de-risked with real tests (not just reading docs):

- `OfflineAudioContext` renders real audio in Node on this machine (arm64 macOS) — tested with a plain
  oscillator, confirmed non-zero, correctly-shaped output.
- `ctx.decodeAudioData()` correctly decodes a real sample file — tested by fetching an actual sample
  (`bd/BT0A0A7.wav`) from the authoritative `tidalcycles/Dirt-Samples` GitHub repo (not a guessed URL —
  the first two guesses at the sample manifest location were wrong and had to be tracked down by reading
  `@strudel/webaudio`'s actual source, not by assuming a plausible-looking repo layout) and rendering it;
  peak amplitude ≈ 1.0, a real drum hit.
- **Confirmed**: `superdough` (the real scheduler + control-mapping layer Strudel uses, not just raw Web
  Audio nodes) works end-to-end against `node-web-audio-api`'s `OfflineAudioContext`, including a
  `.room()`/`.lpf()` reverb+filter chain (not just a bare oscillator) — tested with a throwaway spike
  script, deleted once confirmed. Peak/RMS were measured non-zero in both cases; the WAV written from the
  rendered buffer was audibly a real tone with reverb tail, not silence or noise.

  What made this work, in order, each one found by hitting the actual error rather than guessed upfront:
  1. Polyfill every class `node-web-audio-api` exports (`AudioContext`, `OfflineAudioContext`,
     `GainNode`, `BaseAudioContext`, etc.) onto `globalThis` — `superdough`'s compiled bundle references
     several of these directly (e.g. `instanceof BaseAudioContext` checks), not just `AudioContext`.
  2. `setAudioContext(offlineCtx)` (exported by `superdough`) before triggering anything, then
     `registerSynthSounds()` — oscillator waveforms (`sine`, `triangle`, ...) are **not** available by
     default; without this, superdough throws `sound sine not found! Is it loaded?`.
  3. `globalThis.window = new EventTarget()` and `globalThis.document = new EventTarget()`. Several
     effects (confirmed: reverb, via `reverbGen.mjs`) do a bare `window.filterNode = ...` debug-inspection
     write, and both `@strudel/core` and `superdough`'s own bundles gate some internal logging/messaging
     on `typeof window < "u"` and then call real `EventTarget` methods (`addEventListener`,
     `dispatchEvent`) on it — a plain `{}` satisfies the property-write but throws on those method calls,
     so `new EventTarget()` (a real, minimal Node built-in) is the smallest fix that survives both. Do
     **not** try to give `@strudel/core` a real browser-like environment beyond this — chasing that
     (`document.dispatchEvent`, then more) was a real dead end during testing; the two `EventTarget`
     stubs were sufficient and nothing else was needed.
  4. `initAudio()` doesn't need to be called at all for offline rendering — it no-ops under
     `typeof window === 'undefined'` internally (skipping worklet loading), and since nothing tested so
     far required an `AudioWorkletNode`-based effect, this was never a blocker. If a future effect throws
     on a missing worklet, that's the next thing to investigate — not yet hit.

  This means approach A is confirmed viable; there's no need to fall back to B (the third-party
  `live-coding-music-mcp` headless-browser approach).

## Phases

1. **Prototype — done.** `superdough` producing correct output against the Node-polyfilled context,
   including a reverb+filter chain, confirmed above.
2. **Synth-only render — done.** `tools/sounds/render.mjs`:

   ```
   node tools/sounds/render.mjs <file.strudel> --cycles N --out <output.wav> [--tail S] [--sample-rate N]
   ```

   Evaluates the piece with the same `eval-strudel.mjs` the inspector uses (one evaluation
   implementation, not two), queries every hap over the full `--cycles`, schedules each through
   `superdough` against an `OfflineAudioContext` sized to `cycles/cps + tail` seconds, and writes a
   16-bit PCM WAV via `tools/sounds/wav.mjs`. `--tail` (default 3s) exists so a release/reverb decay
   after the last event isn't cut off. Verified on "Slow Drift" (180 cycles, 30cpm → 364s incl. 4s
   tail): peak 0.372, and per-30s-window RMS tracks the arc exactly as documented (intro 0.022 →
   development 0.055 → climax 0.099 → deceleration 0.066 → outro 0.028) — not just "some audio came
   out", the actual dynamic shape of the piece is there.
3. **Real samples**: extend to `s("bd")`-style sample playback, using the fetch + `decodeAudioData`
   approach already confirmed above, with a local cache (candidate location:
   `tools/sounds/.sample-cache/`, gitignored) so repeated renders don't re-download the same files.
   Not needed for any piece composed so far (all synth-only); build when the first sample-based piece
   needs it.

## Output: `media/<name>/sync/`

```
media/slow-drift/sync/
  audio.wav       — the full render. Default 48kHz (video-standard rate) unless told otherwise.
  frames.json     — every event from the inspector's --json output, with `begin`/`end` converted from
                    cycles to frame numbers (not cycles) — see conversion below.
  manifest.json   — self-describing metadata so `tools/visuals/` never needs to know anything about
                    Strudel: source piece path, cps/cpm, fps, sample rate, total duration (seconds),
                    total frames, audio/frames filenames, generation timestamp.
```

The composition's `media/<name>/<name>.yaml` gets its `domains.sync.status` set to `in-progress` once
`audio.wav` exists but `frames.json`/`manifest.json` don't yet (the current state for "Slow Drift"), and
`done` once all three do — see the `strudel-sync` skill.

`tools/visuals/` reads these plain files directly — no shared skill or extra tooling needed for that;
the manifest is the entire interface between the audio and video sides.

## Time base: cycles → seconds → frames, in exactly one place

```
cycles  --(cps, read from the piece's setcpm())-->  seconds  --(fps, from the user — 60, chosen for this
                                                                    project)-->  frames
```

This conversion is written once, inside whatever script generates `frames.json`, and nowhere else. If
it's duplicated (e.g. the piece's tempo hardcoded again inside `tools/visuals/`), a tempo change in the
piece silently desyncs the video from the audio. The resulting cpm gets mirrored into the composition's
`<name>.yaml` (`tempo.cpm`) for other tools to read without parsing Strudel — a mirror, not a second
computation.

## Where this lives

- Rendering/conversion tooling: `tools/sounds/` (alongside the inspector) — `eval-strudel.mjs` (shared
  pattern evaluation, used by both `inspect.mjs` and `render.mjs`), `render.mjs` (the CLI), `wav.mjs`
  (the WAV writer). `frames.json`/`manifest.json` generation isn't built yet; it'll live here too.
- This spec: here. The workflow that triggers it (when to render, when to re-render after an edit):
  packaged as the `strudel-sync` skill (`.claude/skills/strudel-sync/SKILL.md`).
