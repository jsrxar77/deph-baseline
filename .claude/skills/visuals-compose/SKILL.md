---
name: visuals-compose
description: Use when building the actual Remotion video composition for a piece, once a composition folder (media/<name>/) exists — covers where the component code actually has to live (not media/<name>/visuals/, despite that folder's name — the Remotion bundler can't resolve node_modules for files outside tools/visuals/), wiring real audio into the composition, the ANGLE GL renderer fix for WebGL/canvas visuals, audio-reactive parameter mapping, and applying deph's shared "creation torus" visual signature (tools/visuals/src/signature/phaseRings.ts, confirmed as the project's standing brand mark) that every composition should include as a background layer. For scaffolding a brand-new composition, see deph-compose first; for composing the sound itself, see strudel-compose.
---

# Building a composition's video side

Everything here was found by actually building the first one (`slow-drift`, a WebGL Julia-set
visualizer for "Slow Drift"), hitting real errors rather than assuming the originally-planned
architecture would work. Two things in `CLAUDE.md`'s file-layout section turned out to be wrong in
practice; this skill documents the corrected reality. Update `CLAUDE.md` if this skill and it ever
drift apart.

## Where the code actually goes (correction to the original plan)

**Not in `media/<name>/visuals/`.** That was the original plan (mirroring `media/<name>/sounds/`), but
Remotion's bundler (Rspack/webpack, configured in `tools/visuals/remotion.config.ts`) resolves
`node_modules` from a source file's **real path**, so a file under `media/` can never find
`tools/visuals/node_modules`. Tested twice: importing `remotion` from a file outside `tools/visuals/`
fails with `Module not found` (identical from `tsc` and the bundler); and a symlink from `tools/` into
`media/` (real code in `media/`) resolved `remotion` and `react` but failed on `@remotion/media-utils`.

**Actual location: `tools/visuals/src/compositions/<name>/`** — a subfolder per composition, inside
the engine's own source tree, so normal module resolution works.

**`media/<name>/visuals/` is a symlink to it, in that direction only.** When you create the code folder,
replace the scaffold's empty `media/<name>/visuals/` directory with a relative link:

```
rmdir media/<name>/visuals && ln -s ../../tools/visuals/src/compositions/<name> media/<name>/visuals
```

The bundler never sees the link (it only reads `tools/`), git stores it as a tiny file, and opening the
composition's folder shows its sound, visual, sync and renders side by side. Never put code in the link's
`media/` side or make the link point into `media/`.

The composition's entry file is `tools/visuals/src/compositions/<name>/<name>.tsx`; it exports the `<Composition>` and
`tools/visuals/src/Root.tsx` renders it. Name it as the "Naming" section below says.

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
that piece defines "how solid is my own content here." For `slow-drift`, fast-escaping
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

## Reacting to exact events: frames.json (not the spectrum)

`useAudioBands` only knows energy per frequency band — it cannot tell when a bell starts or which note it is.
For anything tied to a specific sound, read `frames.json` (see `strudel-sync`): every event has its exact
`seconds`/`frame`, plus `note` (MIDI), `pan`, `gain`. Load it once with `delayRender`/`continueRender` +
`fetch(staticFile("<name>-frames.json"))`, and compute the effect as a pure function of `frame`. Slow Drift's
`bellPulses.ts` does this: each bell lifts the fractal's surface where it sounds — x from the bell's own stereo
`pan`, y from its pitch — as a soft swell (a small lens-like bulge of the sampling coordinates) plus a faint
cool glow, ~0.3 s attack and a ~2.6 s fade matching the bell's tail. Up to 6 pulses overlap (`uBells[6]`).
Rules that carry over from the signature: it must never be a visible shape of its own (no ring or disc, only an
effect on the content), and it stays subtle. Filter events by their `$:` layer index (`$3` = bells here, a
coupling to the piece's layer order that `manifest.json`'s per-layer summary lets you check).

## Two audio files: play the master, analyze the raw

`public/<name>-master.wav` (loudness-mastered, see `strudel-sync`) is what `<Audio>` plays;
`public/<name>-audio.wav` (raw render) is what `useAudioBands`/`calculateMetadata` read. The reactive
mapping was tuned against the raw levels, and the master is a constant gain (Slow Drift: +7.6 dB, about 2.4x
in amplitude) that would silently change how strongly the picture reacts. Both files have the identical
length, so the timeline stays aligned. Both are git-ignored (`tools/visuals/public/*.wav`).

## Where the compiled video goes: `media/<name>/renders/`

Render final videos from `tools/visuals/` straight into the composition's own folder:

```
npx remotion render <CompositionId> ../../media/<name>/renders/<name>.mp4
```

`renders/` is git-ignored (`media/*/renders/*.mp4|mov|webm`): a 6-minute 1080p60 file is 2-3 GB. Not
`sync/` (that is the audio/video bridge data), and not `~/Movies` or the Desktop, which are outside the
project — a file left on the Desktop vanished once, and a render can fail with `ENOSPC` when the disk fills
(clear intermediates first; renders need a few GB of temp space plus the output). Only one render should run
at a time: two writing the same output file corrupt each other, and `pkill -f` on the command string can miss
the node child — list with `ps -eo pid,lstart,command | grep "[.]bin/remotion render"` and kill by PID.

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

## HDR-look bloom pipeline (Songcord J)

`tools/visuals/src/shared/HdrCanvas.tsx` is a small raw-WebGL2 pipeline reusable by other pieces: the
scene fragment shader writes LINEAR, unclamped light to a half-float texture (`EXT_color_buffer_float` works in
Remotion's headless ANGLE), a 5-level bloom pyramid is built from what exceeds a threshold, and a final pass adds bloom,
ACES tone mapping, vignette and grain and writes normal 8-bit BT.709 output. It is an "HDR look", not an HDR export.
Rules learned tuning it: scale the world down and give it a black level (deep darks are what make the lights read as
HDR); accumulate overlapping light sources with `max` when their density depends on speed, never a sum; keep attack
pulses soft and capped (photosensitivity, and deph's no-strobe rule). A 1080p frame took about 70 ms to render.

## Naming, and the consistency check to run every time

Names follow the `deph-compose` skill's "Naming" rule: the Remotion composition id is exactly the composition's name
(`musica-universalis`), only 4K, no 1080p twin, no Final/Flow/Proto/4K in any name; the entry file is
`compositions/<name>/<name>.tsx`; code used by more than one piece lives in `tools/visuals/src/shared/` (today
`HdrCanvas.tsx`). Alternatives compared side by side are deleted (id and code) as soon as one is chosen.

Every piece's `media/<name>/visuals` must be the symlink to its code — Songcord was once left as an empty directory
after its code was built, and the user caught it. Before calling any visual work done, run from the project root and
fix anything that isn't `symlink OK`, then check the Studio list shows only piece names and `deph-*` brand items:

```
for d in media/*/; do n=$(basename "$d"); printf "%s: " "$n"; if [ -L "$d/visuals" ] && [ -d "$d/visuals/" ]; then echo "symlink OK"; else echo "FIX: not a working symlink"; fi; done
(cd tools/visuals && npx remotion compositions)
```

## Before finishing: reconcile the whole yaml

Update `media/<name>/<name>.yaml`'s `domains.visual` — `status` (`in-progress` for a first working
pass, `done` once it's considered finished) and `entry` (point it at the real
`tools/visuals/src/compositions/<name>/` location, not the folder the original scaffold implied). See
`deph-compose`'s "Hand off" section for why every domain skill does this, not just this one.


## Lissajous/harmonograph motion: constant speed and a GLSL smoothstep gotcha (Musica Universalis)

Two concrete, reusable technical findings from building a moving-light-with-trail visual (the comet technique,
see the deph-style log for the creative back-and-forth that led here):

- **`smoothstep(edge0, edge1, x)` is UNDEFINED per the GLSL ES spec when `edge0 >= edge1`.** Writing a "fade out"
  as `smoothstep(1.0, 0.82, u)` (descending edges, meant as "1 near u=0.82, ramping to 0 by u=1") compiled and ran,
  but wasn't clamped the way a naive read of the formula suggests — it produced an unclamped hot spot instead of a
  soft taper, seen as "un punto redondo... círculo con una estela" instead of a uniform ray. Always keep edges
  ascending and invert the RESULT instead: `1.0 - smoothstep(0.82, 1.0, u)`.
- **A sine-based path (Lissajous, harmonograph, any `sin(a*t)`) moves at wildly uneven speed** — nearly stalled at
  its amplitude peaks, fastest through its zero-crossings. Sampling its trail at fixed TIME steps puts samples far
  apart exactly where it's moving fast (reads as a sudden frantic jump) and bunched where it's slow (reads as
  calm) — inconsistently, within the same trail, at different moments of the piece: "de repente tienen movimientos
  suaves y de repente comienza uno frenético" (the user's words). Fix: walk backward in TIME with an adaptively
  rescaled step (a few refinement iterations per point, checking the actual screen distance moved and rescaling
  the step to hit a target distance) so consecutive trail points are spaced by roughly equal SCREEN DISTANCE, not
  equal time — cheap (a couple of position evaluations per trail point, done once per frame on the CPU) and fixes
  the unevenness by construction, everywhere, rather than by tuning rates per-piece.

## `<Audio>`'s `from` prop delays playback, it does not trim the source

Found while checking Musica Universalis's audio/video alignment: `tools/visuals/src/shared/HdrCanvas.tsx` (used by
both Songcord and Musica Universalis) had `<Audio src={...} from={237} />`. In `@remotion/media`, `<Audio>`'s `from`
comes from `InteractiveBaseProps` (`Pick<SequenceProps, 'from' | ...>`) — it behaves like wrapping the audio in
`<Sequence from={237}>`: the track starts playing 237 frames (≈3.95 s) into the COMPOSITION timeline, not 237 frames
into the audio file. The prop for trimming the source itself is `trimBefore`/`trimAfter`. With `from={237}` left in,
both pieces played about 4 s of video before any sound — the opposite of "the video starts with the music, not
before". Removed (verified with `ffprobe -show_entries stream=start_time` on both compositions: video and audio
streams both start at 0.000000 now). Check this whenever `<Audio>` is added to a shared canvas component — a stray
`from` is easy to leave in from a one-off scrubbing test.

## Reporting render progress (standing rule): the Node API, never the CLI, for a render worth watching

`npx remotion render` only draws a live progress bar for an interactive terminal. Piped through Bash, backgrounded, or
both (any render long enough to matter), that bar never reaches a readable log — confirmed directly: the captured
output file stayed at 0 bytes through a 40+ minute run. The result was no honest way to answer "how far along is it,"
which is not acceptable for professional work — the user was right to insist on this.

The real fix is `tools/visuals/render.mjs`, which renders through the Node.js API (`bundle()` -> `selectComposition()`
-> `renderMedia()`) instead of the CLI. `renderMedia()`'s `onProgress` reports exact `renderedFrames`, `encodedFrames`
and `progress` (0..1) on every tick; the script writes one JSON line per tick to `<output>.progress.jsonl`, readable at
any moment with `tail -1 <output>.progress.jsonl`, from this or a later session, whether the render is in the
foreground or the background.

```
node render.mjs <compositionId> <outputPath> [--frames=start-end] [--concurrency=N]
```

Always use this for any render worth tracking (i.e. every real one) — never `npx remotion render` piped/backgrounded
for a render whose progress might need checking. The script mirrors every setting from `remotion.config.ts`: that
file's own top comment is the reason ("When using the Node.JS APIs, the config file doesn't apply. Instead, pass
options directly to the APIs") — Rspack, the Tailwind `bundlerOverride`, `chromiumOptions: { gl: "angle" }` (WebGL
needs it, see above), `pixelFormat: "yuv420p"` and `colorSpace: "bt709"` (YouTube's limited-range BT.709, see
"Encoding for YouTube" above). If `remotion.config.ts` ever gains a new setting, mirror it here too, in the
`renderMedia()`/`bundle()` call, or this script silently drifts from what the CLI would have produced.
