# Slow Drift

`sounds/slow-drift.strudel` (this composition's folder is `media/slow-drift/`) — an ambient piece in the
style of Brian Eno's tape-loop pieces (*Music for Airports*, *Discreet Music*). No drums, no fixed beat
anywhere. Four independent voices, each built from a loop length that shares no common factor with the
others (plus a fifth, quiet binaural layer — see "A=432 Hz tuning and a binaural layer" below), so the texture keeps recombining instead of repeating; on top of that, a five-section arc (intro
→ development → climax → deceleration → outro) built with `arrange()`. A short, unarranged version of the
same four voices is kept at `sounds/slow-drift-loop-only.strudel` for comparison. Cross-domain metadata
(key, tempo, arc, per-domain status) lives in the sibling `slow-drift.yaml`, not duplicated here.
Tuned to **A = 432 Hz** (not the standard 440) — see the same section below.

## Tempo, duration, key

- `setcpm(30)` — 1 cycle = 2 seconds.
- 180 cycles total = 360 seconds = 6:00 exactly.
- Key: **C major**, diatonic throughout. Confirmed with the inspector's key estimate
  (`--summary`: C major, r=0.89, 100% of note weight in scale — as strong a confirmation as that estimate
  gives, since the piece was written entirely from C major scale degrees).

## Arc

Rebalanced once, after pairing the piece with an audio-reactive video: the original 24/40/56/36/24 split
put ~2:08 between the start and full 4-voice texture, which read as visually/musically inert for too long.
Intro and development are now half as long; the time went into climax and deceleration instead, so the
piece is still 360s (6:00) but spends much more of it dense.

| Section | Cycles | Duration | Voices active |
|---|---|---|---|
| Intro | 12 | 24s | drone (fading in from a soft floor), pad (entering, very quiet), bells (one brief cold-open teaser, then silent again), binaural (10 Hz) |
| Development | 24 | 48s | drone, sub (entering), pad (continuing to fade up), binaural (8 Hz) |
| Climax | 72 | 144s | all four; pad gets a quiet octave-up echo, bells at lower `degradeBy` (denser); binaural (6 Hz) |
| Deceleration | 48 | 96s | all four, thinning; pad and sub fading out; binaural (5 Hz) |
| Outro | 24 | 48s | drone (fading out), binaural (4 Hz) |

Verified with `node tools/sounds/inspect.mjs media/slow-drift/sounds/slow-drift.strudel --json --cycles 180`, counting events per
voice per section — matches this table exactly (drone: 1/2/5/3/2 events; sub: 0/2/4/3/0; pad: 3/6/32/11/0;
bells: 1/0/16/5/0).

## Voices

Each voice is its own `arrange()` timeline (five separate `arrange()` calls, one per `$:` layer) — not
one `arrange()` pre-mixing all four — so each stays visible as its own layer to the inspector.

- **Drone** (`$0`) — root/fifth alternation (`<c2 g2>`), `.slow(17)` (~34s per note). Sine, 6s attack,
  10s release, heavy room. The floor of the piece; the only voice present in every section.
- **Sub** (`$1`) — a single low pulse (`c1`), `.slow(19)` (~38s). Barely audible; anchors the piece
  without ever reading as a beat.
- **Pad** (`$2`) — a sparse major-9 phrase (C E G B D), `.slow(23)` (~46s per pass). Triangle, with
  `lpf`/`pan` modulated by slow `sine` signals. In the climax only, superimposes a quiet octave-up echo
  (`.superimpose(x => x.add(note(12)).gain(0.5))`). Now enters during the intro too (very quiet,
  `range(0.02, 0.07)`), not just development — see "Retention: cold open and earlier color" below.
- **Bells** (`$3`) — a sparse high *pedal* phrase on G (G A G E, four notes per pass — see "Bells: a pedal phrase instead of an arpeggio" and its follow-ups below), `.slow(13)` (~26s per pass), thinned with `degradeBy` (lower
  probability = denser). Held back until the climax so its full entrance still reads as an arrival, but
  gets one brief early exception — see below. FM-synthesized, not a plain sine — see "Making the bells
  sound like bells" below (and its last follow-up: the FM ratios were later made integer, so the timbre is
  now a warm glass/bowl tone, not a metallic struck bell).
- **Binaural** (`$4`) — a sine hard-left and a sine hard-right around C4, differing by 10/8/6/5/4 Hz
  across the five sections (alpha toward theta). Dry, very quiet, one long note per section. Only works
  through headphones. See "A=432 Hz tuning and a binaural layer" below.

## Making the bells sound like bells (FM synthesis, not sampling)

The bells voice was a bare `s("sine")` — a pure tone, which is exactly what a real struck bell *isn't*:
bells ring with an inharmonic cluster of partials (overtones that aren't simple integer multiples of the
fundamental), not a clean harmonic tone. Requested explicitly: make it sound more bell-like without
switching to sample-based synthesis. Researched via Strudel's own docs and superdough's actual installed
source (`tools/sounds/node_modules/superdough/helpers.mjs`) rather than guessed:

```js
.fm(6).fmh(1.4)
.fmattack(0).fmdecay(0.35).fmsustain(0.06).fmenv('exp')
```

- `fmh` (harmonicity ratio) sets the modulator frequency as a multiple of the carrier. **Whole-number
  ratios sound harmonic/natural; non-integer ratios sound metallic/inharmonic** — that's the whole
  mechanism. `1.4` is the carrier:modulator ratio from Chowning's original 1973 FM synthesis paper, which
  specifically introduced this technique for bell tones; Strudel's own docs demonstrate the same idea
  with `1.61`.
- `fm` (aliased internally to `fmi`, confirmed by reading `@strudel/core`'s actual export list) sets the
  modulation index/depth — how much inharmonic "clang" is mixed in.
- The separate `fm*` envelope (`fmattack`/`fmdecay`/`fmsustain`) matters as much as the ratio: a real
  bell's bright inharmonic clang fades *faster* than its fundamental hum tone rings out. Without that
  separate decay, constant FM depth just sounds like a buzzy drone, not a bell dying away. `release` was
  also extended from `3` to `4.5` seconds to give the tone room to actually ring out.

**Verified two ways, since Claude cannot hear the result and this is a real judgment call for the user's
ear:** the render pipeline (`tools/sounds/render.mjs`) completed without error — the first time FM
synthesis specifically was exercised through it, not just plain oscillators — and a zero-crossing-rate
check on the rendered audio showed the first bell hit's waveform crossing zero ~17% more often than a
pure tone at that pitch would, confirming real added high-frequency content (not a no-op parameter).
Neither check says whether it actually *sounds* like a good bell — that's for the user to judge by ear.

### Follow-up: too clangy, and "very dry" despite room(0.95)

First listen: the FM clang clashed against the pure diatonic drone/pad rather than reading as "bell" (not
an out-of-scale problem — checked: every voice's notes are diatonic, confirmed via `--json`, including the
pad's climax octave-echo which the inspector reports as raw MIDI numbers rather than note letters), and
the reverb felt dry despite `room(0.95)`. Two real fixes, not guesses:

- **`fm(6)` → `fm(2.5)`, `lpf(4000)` → `lpf(2800)`**: less inharmonic depth and a touch less brightness,
  so it sits under the diatonic voices instead of clashing with them.
- **The dry reverb was a real bug in understanding the parameter, not a taste issue**: read
  `superdough`'s actual reverb implementation (`reverbGen.mjs`, called from `reverb.mjs`) and confirmed
  `size`/`roomsize` is the reverb impulse response's **decay time in seconds**, not an abstract 0-1
  "spaciousness" knob. `size(0.95)` was under a one-second tail — `room(0.95)` (95% wet) into a
  sub-second reverb still reads as small/dry, no matter how wet the send is. Fixed to `size(6)` — a real
  multi-second ring-out. Verified on an isolated single-note render (silence around one hit, so the decay
  curve isn't contaminated by other voices): RMS energy present and smoothly decaying from t=0 out to
  ~t=7s, versus dropping to near-silence within ~1s before the fix.
- Added a long, quiet, non-metric `delay` (`delaytime(0.68)`, not a round musical fraction, low feedback)
  for extra space on top of the reverb, without implying a beat — this piece deliberately has none.

**This `size` finding likely affects the whole piece, not just bells** — drone (`size(0.95)`) and pad
(`size(0.9)`) both have the same sub-one-second reverb tail despite being described as "heavy room"/
"ethereal". Not changed yet pending the user's confirmation (see the corresponding session decision)
before touching voices that weren't the ones reported as sounding wrong.

### Second follow-up: a real glitch on every hit, and still too prominent

Reported as an actual glitch on every bell hit (not just an aesthetic complaint), plus still too loud
relative to the other three voices. Checked the rendered waveform directly for a literal digital
artifact first, rather than guessing: no clipping and no anomalously large sample-to-sample jump on any
of the 22 bell hits in the piece (a legitimate fast bright transient naturally has bigger jumps than a
slow drone — the values found were consistent with that, not with a dropout or a hard click).

The likely real cause instead: **`fmattack(0)`** — the FM modulation index jumping from 0 to full in a
single sample is a genuine discontinuity in a discretely-sampled signal (a "zip" artifact — energy
smeared across frequencies from the instantaneous step), a known FM synthesis gotcha that shows up as a
harsh, glitchy-sounding transient without necessarily producing a large *amplitude*-domain jump — which
is exactly why the waveform check above didn't flag anything: the artifact is closer to a frequency-domain
one. Fixed with `fmattack(0.012)` (12ms) — costs nothing perceptually (no struck object's transient is
mathematically instantaneous either) and removes the literal step discontinuity.

Used the opportunity to also make the bells sound less like a single "buzz": **two FM operators layered**,
not one — `fm(2.5).fmh(1.4)` (Chowning's ratio, as before) plus a second, quieter layer at
`fm(1.2).fmh(2.4)`, built from one shared `notes` pattern (`degradeBy` applied once, not once per layer)
so both layers always trigger on exactly the same events — real bell-like sounds have more than a single
inharmonic partial pair; classic FM bell patches (DX7 included) stack more than one operator for a denser
spectrum. Gains also lowered across every section (0.16→0.10 teaser, 0.2→0.13 climax, 0.14→0.09
deceleration) — this is meant to read as a subtle accent layer, not a fifth voice competing with the
other three.

Re-verified after this pass: inspector confirms both FM layers fire on identical events (same `begin`,
same `note`, different `fmi`/`fmh`/`gain`); the full piece re-rendered without error; the same
waveform-jump check across all 22 hits still shows zero clipping and jump magnitudes in the same range as
before (consistent with a smoother, not larger, transient). None of this proves the perceptual "glitch" is
gone — only that the specific mechanism identified as the likely cause has been removed and nothing else
came up. That's for the user to confirm by ear.

### Third follow-up: glitch persisted ("sometimes at the start, sometimes at the end"), still too loud

The inconsistent timing (not the same point on every hit) ruled out a per-note envelope-math explanation
(that would misbehave identically every time, not sometimes-here-sometimes-there) — pointed toward
something timing/overlap-dependent instead, so this got a properly systematic two-part investigation
rather than another parameter guess:

1. **Full-duration scan of one isolated note** (silence around it, 12s render): every sample-to-sample
   jump above a strict threshold was found, not just a spot-check near the onset. Result: 113 jumps, but
   **all of them fell strictly within the 0-0.05s attack window** — none later, none at the release/tail.
2. **A real overlapping-notes scenario** (the actual 13-cycle bell phrase rendered in isolation, several
   notes with long tails genuinely overlapping, matching what happens for real in the piece): scanned for
   the specific pattern reported — level declining, then suddenly jumping back up. Found exactly 4 such
   jumps in 36 seconds — and **all 4 landed at the exact scheduled onset time of the next real note in the
   phrase** (3.25s, 8.1s, 16.25s, 21.1s, matching the pattern's own step timing precisely). That's not a
   glitch; that's the next bell starting while the previous one's tail is still quietly ringing, which is
   correct, intended behavior.

**Conclusion: two independent, systematic checks found no digital defect anywhere** — not in isolation,
not under real overlap. The most likely remaining explanation is the envelope *shape* itself, not a
rendering bug: `decay` was never set explicitly, so it defaulted to superdough's own `0.05s` (confirmed by
reading `registerSynthSounds`' default ADSR array in `synth.mjs`) — meaning gain went attack(0.05s)→peak→
decay(0.05s)→sustain(0.15) as two fast, back-to-back stages. That's a sharp "snap" shape, not a swell, and
combined with the FM clang peaking in that exact same narrow window, it plausibly *sounds* like a
click/clap even on a technically clean signal. Fixed with an explicit `.decay(0.3)` — the peak-to-sustain
transition now has real time to be a transition. Gains lowered a second time (0.10→0.06 teaser,
0.13→0.08 climax, 0.09→0.055 decel) since the first reduction still wasn't enough.

Re-verified: full-file scan (all 368 seconds, not just near bell hits) shows max sample jump down from
`0.033` to `0.023` and zero clipping anywhere. Consistent with a softer, not sharper, transient — still
not proof the perceptual click is gone, since that's not something either of these checks can fully
confirm. If it's still there after this, the next thing to try is not another parameter nudge on the same
design, but recording/inspecting a spectrogram of an isolated hit (visualizing frequency content over
time) to see the attack transient directly, rather than continuing to infer it from time-domain amplitude
checks alone.

## The same "clap" bug found in the pad too

The missing-`decay` finding above turned out to be a piece-wide issue, not bells-specific — reported
directly on `pad` as well. Checked all four voices' `sustain` levels to see which are actually affected:
drone and sub both use `sustain(1)` (equal to their own peak), so a missing decay is harmless there —
there's no level *change* to snap through if decay's start and end values are the same. Pad uses
`sustain(0.4)` with a slow 3-second attack and no explicit decay — meaning gain went attack(3s, a gentle
rise)→peak→**decay(0.05s)**→sustain(0.4), a hard near-instant drop immediately after a slow build. That
contrast (gentle for 3 whole seconds, then a snap) is arguably a more noticeable "clap" shape than bells'
version of the same bug. Fixed the same way: `.decay(1.5)` — proportional to pad's own slower timescale,
not bells' `0.3`, so the settle itself still feels unhurried rather than rushed.

Re-verified: full-file scan still shows zero clipping; the max sample jump (`0.031`, at the timestamp of
a real bell hit, not near any pad note) is consistent with previously-characterized normal bell-transient
behavior, not a new artifact from this change.

### Fourth follow-up: no glitch left, but still "seco"/"cortante" — needed a "pedal" feel, not a fix

With the clap gone, the bells were reported as still unconvincing: dry, cutting, lacking the sense of a
sustain pedal (notes ringing into and blending with each other) even after asking specifically about
delay. This time there was no defect to find — the cause was the envelope's *shape*. `attack(0.05)` rising
to a peak and then `decay(0.3)` dropping hard down to `sustain(0.15)` is itself a percussive "pluck"
contour, independent of how long the `release(4.5)` tail afterward runs — a fast rise followed by a sharp
drop reads as a strike no matter what happens later. Longer release alone can't fix a shape problem in the
attack/decay portion.

Two changes, addressing two different halves of "pedal": `sustain(0.15 → 0.35)` and `decay(0.3 → 0.6)`
soften the post-strike drop so the tone doesn't fall away right after impact; `delayfeedback(0.25 → 0.45)`
makes the echoes actually overlap and accumulate into a wash instead of thinning out quickly — that
overlap between successive echoes (and between one note's tail and the next note's onset) is the literal
mechanism of a real sustain pedal (strings ringing together), not just "more delay". `delay` (wet level)
nudged `0.25 → 0.3` alongside it so the now-more-numerous echoes are actually audible in the mix.

Re-verified on a full render: no clipping (peak `0.2416`, well under 1.0). Max per-channel sample jump rose
to `0.079`/`0.054` (up from `0.026`/`0.022` pre-change) — checked against the event timeline and it lands
inside the climax section (72–216s), i.e. a genuinely louder bell strike from the higher sustain, not a new
digital artifact. Also checked for delay-feedback runaway (unbounded energy growth) by scanning RMS in
1-second windows across the whole file: 7 consecutive seconds of rising RMS at most, which lines up with
the climax's own dynamic build, not unbounded resonance — and the file's overall peak (`0.2416`) has
plenty of headroom before clipping would even become possible.

## A steady tone from ~1:41 to the end: a render-engine lockup, not the music

Reported directly: from around 1:30 a constant high-ish tone started and never stopped. Confirmed in the
WAV — from t=101.011s to the end, every 128-sample block was byte-identical to the previous one (a
perfect 375 Hz periodic wave, identical to the decibel in every spectral window for 4+ minutes). Music
never does that; the audio engine had locked up and kept emitting its last render block. None of the
earlier waveform checks (clipping, sample-to-sample jumps, RMS growth) could catch this, because a stuck
block is perfectly well-behaved by those measures.

It was **intermittent** (the same source rendered clean on some runs and frozen on others, at different
timestamps: 101s, 136s, 193s) and it was **not** the bells or the new delay — a render without bells
froze too, and no single voice ever froze alone, only mixes. Three causes were found in the render path
(`tools/sounds/render.mjs`) and fixed there:

1. **All voices shared one reverb with different `size` values.** superdough keeps one reverb per
   `orbit` and regenerates its impulse response whenever an event arrives with a different size —
   drone (0.95), pad (0.9) and bells (6) all sat on the default orbit. Each voice now has its own
   (`.orbit(1)` drone, `.orbit(2)` pad, `.orbit(3)` bells). This also matters for live playback in the
   editor extension: the shared reverb was being swapped under sounds still ringing, a plausible
   contributor to the earlier "clap"/level-jump reports.
2. **The reverb impulse response is built asynchronously** and could be assigned to the convolver *after*
   the main render had started. The renderer now waits until every reverb has its impulse response.
3. **superdough cleans up every note's nodes from an `onended` callback (`disconnect()`)**, which in an
   offline render fires on the JS thread while the audio thread is mid-render — hundreds of concurrent
   graph edits. `disconnect()` is now a no-op while the main render runs (nothing needs freeing in a
   render that ends soon anyway).

A residual lockup remained (about 1 in 30 under deliberately extreme load: 30 renders at once on 10
cores). Rather than ship a corrupt file, the renderer now **detects** a repeating 128-sample block
lasting 2+ seconds and **re-runs itself in a fresh process** (up to 3 attempts) before writing anything.
Verified: 30 parallel renders, all 30 produced a clean file (one was caught and retried automatically),
and an independent check of all 30 outputs found no frozen block. The delivered WAV's spectrum now
evolves with the arc (bells' high-frequency energy rises in the climax and falls to the noise floor in
the outro) instead of sitting at a constant level from 1:41.

## Retention: cold open and earlier color

Added after real feedback that the piece took too long to "hook" a first-time listener — a fair concern
for something meant to also carry a YouTube video, where the first several seconds decide whether someone
stays. This didn't touch the arc timing (intro/development/climax/deceleration/outro durations are
unchanged) — it only adds content within the existing intro/development window:

- **Bells get a 2-cycle (4s) cold-open teaser** at the very start (`bells(0.16, 0.3)` for cycles 0-2,
  landing an audible hit around 1.6s in), then go silent again until the climax as before. This gives an
  immediate "something is happening" cue without diluting the climax's own bell arrival — over a minute
  of silence still separates the teaser from the real thing.
- **Pad now enters during the intro**, not just development — very quiet (`range(0.02, 0.07)`, versus
  development's `range(0.07, 0.2)` which it fades into) — so there's more harmonic color audible from
  the first cycle, not just the bare drone. Deliberately kept faint here: the goal was more color, not a
  second main voice competing with the drone this early.

Loop lengths 17/19/23/13 cycles share no common factor, so within any section long enough to contain
more than one pass, the voices phase against each other rather than repeating in lockstep.

## Design notes and issues found along the way

- **Diatonic degrees, not semitones.** `scale()` indexes scale steps (0=root, 1=second, 2=third...), not
  semitones. The pad's chord was first written as degrees `0 4 7 11 14` (thinking root/3rd/5th/7th/9th
  as semitone-style offsets), which in a 7-note scale actually lands on root and fifth only — confirmed
  by the inspector showing only C and G in the note histogram, no E or B. Fixed to `0 2 4 6 8`.
- **Section boundaries re-trigger persisting voices.** `arrange()` re-indexes each section's time from 0,
  so a voice present on both sides of a boundary (the drone, the pad) gets a fresh note-attack there
  rather than continuing a held note. With 3-6s attacks this reads as a soft swell, not a click, and
  produces a nice side effect here: all four voices happen to attack together at the start of the climax
  (cycle 36, after the arc rebalance below), since every `arrange()` timeline resets in sync at the same
  boundary.
- **A fade-in from literal 0 can make the very first note inaudible.** The intro's drone fade originally
  started at literal 0 (`saw.slow(T.intro).range(0, 0.22)`), and the first drone note landed exactly
  there — so it sampled gain ≈ 0 and was effectively silent. Confirmed with `--json` at the time: first
  event gain `0`, second (34s later) `0.156`. Fixed by giving both the drone's intro fade-in and the
  pad's development fade-in a small non-zero floor (`range(0.08, 0.22)` and `range(0.07, 0.2)`
  respectively) — not purely to fix inaudibility, but because it read as dead silence for too long once
  paired with an audio-reactive video (see "Arc" above for the fuller rebalance this was part of).
- **Live highlighting in the VS Code extension didn't show at first**, on both this piece and the
  unarranged version — turned out to be a stale webview state, not a code issue: re-evaluating (or
  reconnecting audio) made both playback and highlighting work normally. If this recurs, check the
  Strudel output panel (`View → Output → Strudel`, `strudel.consoleLogLevel: "highlight"`) for an actual
  error before assuming the code is at fault.

## Visuals

`slow-drift` (`tools/visuals/src/compositions/slow-drift/`) — a single Julia-set fractal in WebGL,
filling the frame, reacting to this piece's real rendered `audio.wav` (`media/slow-drift/sync/audio.wav`)
rather than to Strudel's event data. "deph / Deep Decay" palette: obsidian background (`#050508`) through
night-blue (`#121829`), cosmic violet (`#2d1b4e`), oxidized teal (`#1fa396`) and electric cyan (`#38bdf8`),
plus a deliberately disruptive rose/ember accent (`#cb3860`) that appears as a brief flash rather than a
permanent fifth hue.

**Growth follows the arc, not a cycle.** The view is compact and dark during the intro, expands through
development into the climax (richest spiral/filament detail, roughly 1:12–3:36), and eases back slightly
for the outro — a one-way function of elapsed time (0–364s), not a repeating loop. An earlier version drove
the camera with a repeating self-similar zoom-in/zoom-out cycle instead; it looked mechanical and
disconnected from the music, so it was dropped in favor of this arc-linked, one-way growth.

**The Julia constant `c` drifts continuously** around a fixed seed `(-0.7269, 0.1889)` — chosen for rich,
"alive" filament detail rather than a static blob. Drift amplitude is deliberately small (`0.022`, plus a
small `uMid`-driven nudge): past a certain distance from the seed, `c` crosses out of the Mandelbrot set's
connected locus and the Julia set shatters into scattered disconnected fragments ("dust") instead of one
connected shape — confirmed by rendering across the full piece, not assumed from the math. A larger
amplitude tried earlier produced exactly this after ~2 minutes.

**The interior of the set is never flat black.** It's colored by an "orbit trap" (how close each point's
orbit came to the origin), banded so there's always visible ring structure — otherwise a calm basin with a
large trap value renders as a flat, boring silhouette regardless of iteration depth, which is what made the
climax visually "go black" at one point during tuning.

**Audio reactivity is heavily smoothed and weakly coupled, on purpose.** `useAudioBands.ts` averages FFT
reads across a ~1.5s window (not a single per-frame read) before mapping to bass/mid/high; the shader's own
coupling of those values to zoom/pan was removed entirely after real user feedback that a bass-driven
camera shake felt uncomfortable to watch, not lively. Only iteration depth (via `uHigh`) and the slow `c`
drift (via `uMid`) still respond to audio now.

**Signature layer: the "creation torus."** Confirmed by the user as deph's standing brand mark — every
composition should include `tools/visuals/src/signature/phaseRings.ts`: 4 concentric rings, centered on
the frame, breathing outward and inward (one continuous pulse per cycle, no reset), time-offset by
3s/6s/9s/12s within a fixed 30-second cycle (3+6+9+12=30 is the design mark, not a coincidence; for this
piece specifically it also happens to equal its 30cpm tempo). Composited as a **background layer** — drawn
first, then the fractal's own content sits on top and occludes it wherever the fractal is solid, letting
the rings show through only in the open space around it. Went through two corrections to get here: a first
version used straight sweeping bands drawn on top of the final image, which read as literal "Hollywood
searchlight" beams; the fix was both a shape change (bands → breathing concentric rings, far more organic)
and a compositing change (overlay → background layer the content occludes, real depth instead of a flat
effect drawn over everything).

**Filling the whole frame (edge to edge).** The fractal used to be a bounded shape floating in a smooth
gradient, with dead margins, and at some moments the frame landed inside a huge smooth region. Four
changes fixed that, each found by rendering stills across the whole piece rather than at one moment:

1. **Exterior contour bands.** The exterior is colored by the *absolute* escape count (bands hugging the
   set at every distance) instead of the count divided by the iteration limit, which squashed everything
   outside the set into one tiny slice of the palette — the flat gradient.
2. **Closer camera.** Zoom now runs 1.05 → 0.5 with the arc (was 2.4 → 1.25), so the frame is full of
   boundary detail rather than showing the whole silhouette. The compact-to-expanded growth still follows
   the arc, one way, not a cycle. Vignette softened so corners stay filled.
3. **Auto-framing (`framing.ts`).** No fixed camera position stays on interesting ground as `c` drifts
   (tried the origin, then the repelling fixed point beta: each left half the frame empty at some
   moments). The camera now follows a precomputed continuous path chosen by scoring candidate centers by
   how much near-boundary structure they'd put in frame; speed-limited (≤ 0.13 units/s), smoothed, and
   computed once at module load so it is deterministic across Remotion's parallel workers.
4. **Interior structure from the dynamics.** When `c` sits deep inside the Mandelbrot set the basin is
   huge and its orbits converge too slowly to ever stop (multiplier ≈ 1), so the interior was one flat
   color. The **concentric rings seen there were not the fractal — they were the creation-torus signature
   rings showing through the flat area** (worth remembering when a "ring" pattern appears). The interior
   is now colored by how far the orbit still is from settling (`-log` of its last step) plus the
   direction of that last step, both smooth across the basin, which draws spiral arms tied to the
   dynamics.

Known residue: faint rounded seams where the interior's convergence threshold trips; visible only as very
soft arcs. Checked at eight moments spread over the piece (10 s → 6:00): all frames filled edge to edge.

## A=432 Hz tuning and a binaural layer

Added for promotion ("tuned to 432 Hz", "headphones recommended"). Both verified numerically on the
rendered WAV with a high-resolution spectrum (2^18-point FFT, ~0.18 Hz bins, parabolic peak
interpolation), not assumed from the code.

**Tuning.** Strudel converts note names to Hz with A4 = 440 baked in, so the whole piece is shifted by
`12 * log2(432/440) = -0.3177` semitones (about -31.8 cents) through one helper, `tune()`, wrapped around
every pitched voice's note pattern (drone, sub, pad, bells). Verified: the drone's C2 measures 64.23 Hz
(A=432 predicts 64.22; A=440 would give 65.41) and its G2 measures 96.3 Hz (96.22 vs 98.00). The
inspector's key estimate is unchanged (C major) — a 32-cent shift is far below its resolution. For
promotion: state it as a technical fact ("tuned to A=432 Hz"). There is no good evidence that 432 is
more relaxing or "healing" than 440, so avoid claiming effects.

**Binaural layer (voice E, `$4`).** A sine hard-left and a sine hard-right whose frequencies differ by
the beat: carrier is C4 in this tuning (256.87 Hz, on the pad's root), split +/- half the beat. Beat
follows the arc, alpha to theta: 10 Hz (intro), 8 (development), 6 (climax), 5 (deceleration), 4 (outro).
Gains 0.03-0.05, roughly 17 dB under the mix's peak, so it reads as a texture and not as a fifth main
voice. It is deliberately **dry**: the reverb sums both channels, which would smear exactly the
left/right separation the effect depends on. One long note per section (`.slow(cycles)`) with a 4s attack
and 6s release, so sections crossfade and nothing retriggers.
Verified per channel: at 80 s the left channel holds 253.86 Hz at -49.7 dB and only -120 dB at the
right tone's frequency (259.87 Hz), and vice versa — about 70 dB of separation — and the beats measured
at 6, 5 and 4 Hz in the later sections match the plan.

Caveats worth keeping in any description of the piece: the effect only exists through headphones (on
speakers it collapses to an ordinary slow amplitude beat), and evidence that binaural beats change mood
or brain state is limited and mixed — "designed for headphones" is accurate, health claims are not.

**Creation-torus signature is currently switched off.** Judged by the user after seeing the frame-filling
fractal, the 3/6/9/12 concentric rings were removed to see the fractal on its own. It is one constant,
`SIGNATURE_ENABLED` in `FractalVisualizer.tsx` (feeds a `uSignature` uniform that multiplies the ripple
to zero) — `true` restores the brand layer exactly as it was. Nothing was deleted.

## Bells: a pedal phrase instead of an arpeggio

The bells' notes did not convince: the phrase (`0 4 7 9 12 14`, C up to D two octaves higher) climbed in
wide arpeggio leaps, which read as a melody going up and down. Requested: more "pedal", more
transcendental, without so much rise and fall. Replaced by `0 ~ 0 ~ 2 ~ 0 ~ 1 ~ 2 ~ 4 ~ 2 ~` (same 16
steps, same `.slow(13)`, so the loop length and its coprime relationship to the other voices are
unchanged): C keeps returning as the anchor (3 of 8 notes), and every step moves by at most a third
(0,0,2,0,1,2,4,2, wrapping back to 0), staying within C-G (degrees 0-4). Inspector confirms the range is
C5-G5 using only C, D, E and G. There are more hits per pass than before (8 vs 6 of 16 steps), so the
render was re-checked: no clipping (peak 0.396, up from 0.34 because more tails overlap), no frozen block,
max sample jump 0.032, and the spectrum still follows the arc.

This is the first of two candidates. The second, not yet tried, is even more static: only C and G
alternating (the most "temple bell", the least melodic). Judge the first by ear before trying it.

### Follow-up: too many bells for a meditation piece

Reported after the pedal phrase: "many bells; for meditating there should be fewer, more spaced, with more
reverb or delay". Notes per pass cut from 8 to 4 (`0 ~ ~ ~ 2 ~ ~ ~ 4 ~ ~ ~ 2 ~ ~ ~`, one hit every 4
steps, ~6.5 s, before `degradeBy` thins it further): the render now has 21 bell hits over the whole piece
instead of 43. The silence between hits is filled by space instead: reverb tail `size` 6 -> 9 s, `release`
4.5 -> 6 s, delay wet 0.3 -> 0.4, `delaytime` 0.68 -> 1.13 s (still not a musical fraction, so no beat),
`delayfeedback` 0.45 -> 0.55. Re-verified: no clipping (peak 0.375), no frozen block, spectrum follows the
arc, total length unchanged at 368 s (rendered with `--tail 8`; a longer tail would change the video's
duration, which is derived from the audio file).

Honest side effect: with this phrase C appears in only about 4 of the 21 hits (E about 13, G about 6),
so "C as the anchor" from the previous version is weaker. If the pedal feel needs to come back, the
options are `0 ~ ~ ~ 2 ~ ~ ~ 0 ~ ~ ~ 1 ~ ~ ~` (C on half the hits, range C-E, no G) or the still-untried
C-and-G-only phrase.

### Follow-up: "something isn't right with those notes" — checked against the pad, changed to a G pedal

Question asked directly: are `0 2 4 2` in scale? Yes — degrees 0, 2, 4 of C major are C, E, G (diatonic, and
carrying the same 432 tuning as every other voice; the inspector shows only those three pitch names). So
the "wrongness" was something else, and it was measured instead of guessed. Against the pad (C E G B D, plus
an octave-up copy in the climax; each pad note keeps ringing through its 6 s release) the phrase put **2 of
21 bell hits a semitone away from a sounding pad note** (bell C against pad B) — a real rub — and, as a
contour, C-E-G-E is a major-triad arpeggio going up and down, which reads as a lullaby rather than as
suspended. (The bell's FM partials at ratios 1.4/2.4 are inharmonic by design and not "in scale"; that is
the bell timbre, and was not changed.)

New phrase `4 ~ ~ ~ 5 ~ ~ ~ 4 ~ ~ ~ 2 ~ ~ ~` = **G A G E**: a pedal on G, which is also the drone's own second
note, with A and E as neighbors (never more than a third away, total range E-A). It contains no C and no
triad shape. Measured the same way, **0 of 21 hits fall a semitone from a pad note** (3 land a whole tone
away, which is mild). The semitone-clash counter is worth reusing whenever a new bell phrase is tried:
for each bell hit, list the pad notes sounding at that moment (onset to end plus release) and count any at
0.5-1.5 semitones distance (unison and octaves don't count).
Render re-checked: no frozen block, no clipping (peak 0.327), length still 368 s. Actual counts in the
render: A 8 hits, G 8, E 5 (random `degradeBy` thinning makes G equal to A even though G is written twice
per pass).

Two other candidates were measured and also had 0 semitone clashes: D G A G and G E D E. Not rendered.

### Follow-up: the metallic FM partials were the wrong notes ("maybe that's what bothers me")

The user suspected the metallic timbre itself, which turned out to be right. Measured, on one isolated
dry hit (E5, 2^17-point FFT, peaks above 3% of the maximum, ratios relative to the fundamental):

| Variant | Partials (ratio @ dB re fundamental) | Avg distance from a true harmonic | RMS 0-3 s |
|---|---|---|---|
| **Old** `fm 2.5 fmh 1.4` + `fm 1.2 fmh 2.4` | 0.40 @ -20, 1.00 @ 0, 2.40 @ -19, 3.40 @ -30 | ~260 cents | -27.4 dB |
| **New** `fm 1.0 fmh 2` + `fm 0.5 fmh 3` | 1.00 @ 0, 3.00 @ -26 | ~1 cent | -27.1 dB |
| glass (single `fm 0.6 fmh 2`) | 1.00, 3.00 | ~1 cent | -30.6 dB |
| shimmer (`fmh 2.01`, `3.005`) | 1.00, 1.01, 3.01 | ~3 cents | not measured |

The old partials were nowhere near quiet: 0.4x, 2.4x and 3.4x sat only about 20 dB under the note. For an E5
the 0.4x partial is ~259 Hz, a slightly sharp C4, landing right on the pad's C4 and the binaural carrier
(256.87 Hz). So there was a second, out-of-scale pitch under every hit — no phrase of in-scale notes could
have fixed that. Switched to integer ratios (`fmh` 2 and 3): only the note and its twelfth (a B over an E)
remain, all harmonic. Loudness is unchanged (-27.1 vs -27.4 dB), so no gain change was needed.

Trade-off, stated plainly: this is a warm glass / singing-bowl tone, no longer a metallic struck bell. If
it turns out too plain, `fmh 2.01` / `3.005` (variant "shimmer", ~3 cents from harmonic) adds a slow
beating shimmer without out-of-scale pitches. Not rendered in the full piece.
Full render re-checked: no frozen block, no clipping (peak 0.354), 368 s.

**Bell pulses from exact event data.** Remotion has no rhythm detection: a frame is a pure function of its
number, the audio just plays on the same timeline, and the only thing our code derived from the sound was
smoothed energy per frequency band. To react to a specific bell, `tools/sounds/frames.mjs` now writes
`sync/frames.json` (every event with its exact frame) and `sync/manifest.json`, checked against the rendered
audio (the first 8 bell onsets land within 0-10 ms of the strongest energy rise at that note's frequency).
`bellPulses.ts` turns the 21 bell hits into pulses: each lifts the fractal's surface where it sounds (x from
the bell's own stereo pan, y from its pitch) as a soft swell plus a faint cool glow, ~0.3 s rise and ~2.6 s
fade, up to 6 overlapping. Subtle by design, and never a shape of its own. A/B stills of the first bell
(78.5 s) show a soft haze appearing around its position 0.5-1 s later that is absent in the control frame.
Switch: `BELL_PULSES_ENABLED` in `FractalVisualizer.tsx`. Playback uses `sync/audio-master.wav` (-16 LUFS);
the audio-reactive analysis keeps reading the raw `audio.wav`.

## Ableton version (DAW bridge)

The piece is exported to `daw/` for refinement in Ableton Live (see `docs/daw-bridge.md`). `daw/slow-drift.mid` and
`daw/tracks/` hold four MIDI tracks: drone `$0` ch 1, sub `$1` ch 2, pad `$2` ch 3, bells `$3` ch 4. Each carries a
−31.77-cent pitch bend (A4 = 432) and per-note velocity for the section fades. The binaural layer `$4` has no notes
(`freq` in Hz), so it goes as an audio stem, `daw/stems/05-binaural.wav`. The bells' two stacked FM operators
collapse to one MIDI note per hit (42 events → 21 notes). Verified: every onset and pitch in the `.mid`, read back with
an independent parser, matches `sync/frames.json` exactly (95 notes, 0 ms). The user's step-by-step guide (Surge XT
presets, effects recreating the reverb/delay/pan/filter values above, export settings) is `slow-drift.ableton.md`.
`sync/audio.wav` still comes from Strudel (`domains.sound.source: strudel` in the yaml) until an Ableton mix is
brought back.
