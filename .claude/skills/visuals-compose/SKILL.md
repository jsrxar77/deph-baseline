---
name: visuals-compose
description: Use when building the actual Remotion video composition for a piece, once a composition folder (media/<name>/) exists — covers where the component code actually has to live (not media/<name>/visuals/, despite that folder's name — the Remotion bundler can't resolve node_modules for files outside tools/visuals/), wiring real audio into the composition, the ANGLE GL renderer fix for WebGL/canvas visuals, audio-reactive parameter mapping, and applying deph's shared "creation torus" visual signature (tools/visuals/src/signature/phaseRings.ts, confirmed as the project's standing brand mark) that every composition should include as a background layer. For scaffolding a brand-new composition, see deph-compose first; for composing the sound itself, see strudel-compose.
---

# Building a composition's video side

Everything here was found by actually building the first one (`SlowDriftFractal`, a WebGL Julia-set
visualizer for "Slow Drift"), hitting real errors rather than assuming the originally-planned
architecture would work. Two things in `CLAUDE.md`'s file-layout section turned out to be wrong in
practice; this skill documents the corrected reality. Update `CLAUDE.md` if this skill and it ever
drift apart.

## Where the code actually goes (correction to the original plan)

**Not `media/<name>/visuals/`.** That was the original plan (mirroring `media/<name>/sounds/`), but
Remotion's bundler (Rspack/webpack, configured in `tools/visuals/remotion.config.ts`) resolves
`node_modules` by walking up from each source file's own directory — a file outside `tools/visuals/`
entirely can never find `tools/visuals/node_modules`, so `import ... from "remotion"` fails with
`Module not found`, both in `tsc` and in the actual bundler (tested: identical error from both).

**Actual location: `tools/visuals/src/compositions/<name>/`** — a subfolder per composition, inside
the engine's own source tree, so normal module resolution works. `media/<name>/visuals/` still exists
per the composition folder scaffold, but for now stays empty (or holds non-code notes/references,
never the component code itself) — this is a known, deliberate deviation from the folder's original
intent, not an oversight.

Register the composition in `tools/visuals/src/Composition.tsx` (import from
`./compositions/<name>/...`) and make sure `tools/visuals/src/Root.tsx` renders it.

## Wiring in the real audio (also a correction)

The composition's `media/<name>/sync/audio.wav` must be **copied**, not symlinked, into
`tools/visuals/public/<name>-audio.wav`. A symlink pointing outside `tools/visuals/public/` 404s at
both the Studio dev server and in an actual render — tested directly (Remotion's static file serving
doesn't follow symlinks that escape the public root, for the same reason most static file servers
don't: it would otherwise let a served path read arbitrary files elsewhere on disk). Re-copy the file
any time the piece is re-rendered by `strudel-sync`; there's no automation for this yet.

Reference it with `staticFile("<name>-audio.wav")`, never a raw path.

## Sizing duration from the real audio file

Use `calculateMetadata` + `getAudioDurationInSeconds` (`@remotion/media-utils`) to set
`durationInFrames` from the actual `audio.wav`, not a hardcoded guess from the yaml's `total_cycles` —
the rendered file includes `strudel-sync`'s `--tail` seconds, which the yaml doesn't know about:

```tsx
const calculateMetadata: CalculateMetadataFunction<Props> = async () => {
  const durationInSeconds = await getAudioDurationInSeconds(staticFile("<name>-audio.wav"));
  return { durationInFrames: Math.ceil(durationInSeconds * FPS) };
};
```

fps is 60 for this project (matches `docs/sync-pipeline.md`'s time-base convention) — set it as a
constant, don't let it drift from that.

## WebGL/canvas/shader visuals: the ANGLE renderer gotcha

On Remotion 4.x (this project's version, pre-5.0), the local default Chromium GL backend is `null`,
which fails to acquire a WebGL context in headless rendering — confirmed directly: `getContext("webgl")`
returned `null` until this was set. Fix, already applied in `tools/visuals/remotion.config.ts`:

```ts
Config.setChromiumOpenGlRenderer("angle");
```

(Remotion 5.0+ defaults to `angle` already, so this becomes unnecessary after an upgrade — see the
`remotion-upgrade` skill when that happens, and check whether this line is still needed.) If a *new*
error surfaces despite this (e.g. `Failed to acquire WebGL2 context` mentioning a different backend),
consult `remotion-docs` for the current `--gl` options rather than guessing a flag value.

When building a shader-based visual, add a **visible on-page diagnostic** for `getContext()` returning
null or a shader/program compile failure (see `FractalVisualizer.tsx`'s `diagnostic` state) — a blank
black frame with no error text is much harder to debug than one that says why.

## Audio-reactive parameters: frame must be the only input

Remotion may render frames out of order or in parallel across worker threads, so anything derived
from audio data must be a **pure function of `frame`** — no `useRef`/mutable state carried between
renders for smoothing (an exponential moving average keyed on "last frame's value" will silently
produce wrong, order-dependent output during a real multi-threaded render even if it looks fine in
Studio's sequential preview). To smooth a jittery per-frame FFT reading, average a few nearby
frame-samples within the analysis window instead — see `useAudioBands.ts`'s `SMOOTH_RADIUS` loop.

Use `useWindowedAudioData` (not the unwindowed `useAudioData`) for anything longer than a short clip —
it only decodes a rolling window instead of the entire file up front.

Install `@remotion/media-utils` via `npx remotion add @remotion/media-utils` (not plain `npm install`)
so it stays pinned to the exact Remotion version, per `remotion-markup`'s own guidance.

## The deph signature layer: the "creation torus"

Every composition should apply deph's shared visual signature — confirmed by the user as the
project's standing brand mark, not a one-off for "Slow Drift" — `tools/visuals/src/signature/phaseRings.ts`.
It's 4 concentric rings, centered on the frame, breathing outward and inward (one continuous sine
over the cycle, no reset), each on its own time offset (3s/6s/9s/12s) within a fixed 30-second cycle.

**It's a background layer, composited *behind* the piece's own content, not drawn on top of it.**
A first version drew straight sweeping bands directly onto the final color (`color +=
sweepHighlight * ...`) — it read as literal "Hollywood searchlight" beams cutting across the
content, not something behind it. The corrected approach: render `dephCreationTorus(uv, uTime)`
first as a background color, then `mix(background, content, opacity)`, where `opacity` is however
that piece defines "how solid is my own content here." For `SlowDriftFractal`, fast-escaping
exterior pixels (far "open sky" around the fractal) fade toward transparent so the rings show
through there, while the fractal's own boundary and interior stay fully opaque and occlude them —
see `colorAt`'s returned `.a` in `shaders.ts`. A composition with no natural "open" regions (e.g.
one that fills the whole frame solidly) should still define *some* opacity variation, or the layer
will never be visible.

It's a GLSL snippet (`DEPH_PHASE_RINGS_GLSL`), not a DOM/CSS layer, because every deph visual so far
is a raw WebGL shader; concatenate the snippet into the fragment shader source and call
`dephCreationTorus(uv, uTime)` on the *raw screen-space* UV, before applying that piece's own
zoom/transform — this keeps the rings a consistent size/speed on screen regardless of how zoomed
that piece's own content currently is.

Keep the intensity low and organic. The first (straight-band) pass also read as too bright/harsh —
tune ring width and per-ring color intensity down until it's a subtle glow the content sits on top
of, not a special effect competing for attention; verify with real renders at several points across
the cycle, the same way every other tuning pass in this project did, rather than trusting numbers
that look reasonable on paper.

The 3/6/9/12 timing (offsets in seconds, summing to the 30-second cycle length) is a fixed, permanent
part of the signature — don't re-derive a different cycle length per composition, even though a given
piece's own tempo has nothing to do with it (it coincidentally matches "Slow Drift"'s 30cpm, which is
not a rule future pieces need to satisfy).

## Fractal visuals: fill the frame, and keep the camera on interesting ground

Lessons from making the Slow Drift Julia fractal fill the whole screen (details in
`media/slow-drift/slow-drift.md`). Test by rendering stills at ~8 moments across the whole piece and
tiling them into one contact sheet (`ffmpeg ... hstack/vstack`) — a single frame hides the failures.

- **Color the exterior by the absolute escape count**, not `count / maxIter` — dividing squashes the whole
  outside into one flat slice of the palette (the "empty gradient around the shape" look).
- **A drifting parameter needs a moving camera.** Neither the origin nor the repelling fixed point stays
  on rich ground. Use a camera path scored by near-boundary structure, computed **once at module load**
  (deterministic → identical in every parallel render worker; per-frame state is forbidden) and
  hill-climbed with a speed limit. Choosing the argmax independently per frame made the camera jump.
- **Julia sets are point-symmetric (z → -z):** search one side only, or equal candidates on both sides
  average to the dead center.
- **A flat interior lets the signature rings masquerade as fractal structure.** If a huge smooth basin
  shows perfectly concentric rings, check whether they are just `dephRingTouch` on a flat surface. When
  the multiplier is near 1 orbits never converge, so give the interior a continuous dynamical measure
  (-log of the last step, direction of the last step) instead of a threshold-based one.
- Any angle used as a palette phase should span an integer number of palette cycles (`k / (2π)`), or the
  `atan` branch cut leaves a visible seam.

## Encoding for YouTube (codec check)

Checked against YouTube's recommended upload settings (MP4, H.264 High, progressive, 2 B-frames, AAC-LC
stereo at 48 kHz, moov atom at the front, BT.709, yuv420p; about 8 Mbps for 1080p up to 30 fps and 12 Mbps
for 48-60 fps). Remotion's defaults met most of it (H.264 High, AAC-LC 48 kHz stereo, faststart, 60 fps),
but with `Config.setVideoImageFormat("jpeg")` the output was **yuvj420p (full range) with untagged/bt470bg
color** — not what YouTube expects. `remotion.config.ts` now sets `setPixelFormat("yuv420p")` and
`setColorSpace("bt709")`; verified with a short render: `pix_fmt=yuv420p`, `color_range=tv`, all three color
tags `bt709`. Check any new render with `ffprobe -show_entries stream=pix_fmt,color_space,color_range`.
The default bitrate is far above the recommendation (about 41 Mbps average at crf 18-22 because the film
grain is expensive to compress; a 6-minute 1080p60 file was 1.9-2.9 GB). YouTube accepts and re-encodes it,
but the upload is heavy: `--crf=25` or a later ffmpeg re-encode brings it down.

## Before finishing: reconcile the whole yaml

Update `media/<name>/<name>.deph.yaml`'s `domains.visual` — `status` (`in-progress` for a first working
pass, `done` once it's considered finished) and `entry` (point it at the real
`tools/visuals/src/compositions/<name>/` location, not the folder the original scaffold implied). See
`deph-compose`'s "Hand off" section for why every domain skill does this, not just this one.
