# Slow Drift

`sounds/slow-drift.strudel` (this composition's folder is `media/slow-drift/`) — an ambient piece in the
style of Brian Eno's tape-loop pieces (*Music for Airports*, *Discreet Music*). No drums, no fixed beat
anywhere. Four independent voices, each built from a loop length that shares no common factor with the
others, so the texture keeps recombining instead of repeating; on top of that, a five-section arc (intro
→ development → climax → deceleration → outro) built with `arrange()`. A short, unarranged version of the
same four voices is kept at `sounds/slow-drift-loop-only.strudel` for comparison. Cross-domain metadata
(key, tempo, arc, per-domain status) lives in the sibling `slow-drift.deph.yaml`, not duplicated here.

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
| Intro | 12 | 24s | drone (fading in from a soft floor, not literal silence) |
| Development | 24 | 48s | drone, sub (entering), pad (entering, fading up from a floor) |
| Climax | 72 | 144s | all four; pad gets a quiet octave-up echo, bells at lower `degradeBy` (denser) |
| Deceleration | 48 | 96s | all four, thinning; pad and sub fading out |
| Outro | 24 | 48s | drone only (fading out) |

Verified with `node tools/sounds/inspect.mjs media/slow-drift/sounds/slow-drift.strudel --json --cycles 180`, counting events per
voice per section — matches this table exactly (drone: 1/2/5/3/2 events; sub: 0/2/4/3/0; pad: 0/6/32/11/0;
bells: 0/0/16/5/0).

## Voices

Each voice is its own `arrange()` timeline (four separate `arrange()` calls, one per `$:` layer) — not
one `arrange()` pre-mixing all four — so each stays visible as its own layer to the inspector.

- **Drone** (`$0`) — root/fifth alternation (`<c2 g2>`), `.slow(17)` (~34s per note). Sine, 6s attack,
  10s release, heavy room. The floor of the piece; the only voice present in every section.
- **Sub** (`$1`) — a single low pulse (`c1`), `.slow(19)` (~38s). Barely audible; anchors the piece
  without ever reading as a beat.
- **Pad** (`$2`) — a sparse major-9 phrase (C E G B D), `.slow(23)` (~46s per pass). Triangle, with
  `lpf`/`pan` modulated by slow `sine` signals. In the climax only, superimposes a quiet octave-up echo
  (`.superimpose(x => x.add(note(12)).gain(0.5))`).
- **Bells** (`$3`) — a sparse high phrase, `.slow(13)` (~26s per pass), thinned with `degradeBy` (lower
  probability = denser). Held back entirely until the climax so its entrance reads as an arrival.

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

`SlowDriftFractal` (`tools/visuals/src/compositions/slow-drift/`) — a single Julia-set fractal in WebGL,
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
