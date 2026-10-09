# The Field

`sounds/the-field.strudel` — 6:09, A lydian, tuned to A4 = 432 Hz, 30 cpm (184.5 cycles of 2 s). Meditative, no pulse.
Binaural layer (headphones). Video: `tools/visuals/src/compositions/the-field/` (composition `the-field`, 4K 60 fps).
Named Morpho-Field until 2026-10-05.
▶ **Watch on YouTube:** [The Field (4K · 432 Hz · Binaural)](https://youtu.be/8QGj_FvP5Xo)

## The story

**The field vibrates, its vibrations become frequencies, the frequencies organise into geometry, and the geometry
manifests the whole.** (The user's narrative; it follows the reference image: vibration → frequency → geometry.)

- **The field vibrates.** From the first second, a seven-note motif over a slow cycle of chords. On screen: an endless
  field of sand on a vibrating plate; the sand gathers on the nodal lines of the plate's vibration (a Chladni pattern),
  and every chord is a new pattern.
- **Vibration becomes frequency.** The field sings its own overtones, an arpeggio built from the real harmonic series of
  each chord's root. The patterns in the sand grow finer as higher modes are excited.
- **Frequencies organise into geometry.** Three voices take up the motif at three speeds in Fibonacci proportion (21, 13
  and 8 cycles per statement); they enter one after another and drift like grains of sand that have not found their
  place yet. Three figures of light rise from the sand, one per voice (Flower of Life, Metatron's Cube, Seed of Life),
  each spinning at its voice's speed.
- **The geometry manifests the whole (4:16).** All three voices reach the motif's first note at the same instant: the
  motif in three octaves, the harmony open, a deep gong. On screen the three figures line up exactly, the camera looks
  straight down, and the sand itself redraws Metatron's Cube.
- **Return.** The voices drift apart and go back into the field, which comes to rest on the A it began on.

## Arc

| Part | Cycles | Time | What happens |
| :--- | :---: | :---: | :--- |
| Vibration | 0–32 | 0:00 – 1:04 | Motif and pad from the first second; sub at 0:08; tintinnabuli voice at 0:16; motif an octave up at 0:32; its answer (inverted) at 0:48. |
| Frequency | 32–88 | 1:04 – 2:56 | Harmonic-series arpeggio, breathing against the pad. The motif "resonates" (each note answered by its octave). Canon voice 21 enters at 2:10, voice 13 at 2:32. |
| Geometry | 88–152 | 2:56 – 5:04 | Canon voice 8 at 2:56; mirrored bells on Fibonacci gaps from 3:12. Inhale at 4:00 (arp out, pad filter closes, sub leaves). **The whole at 4:16.** |
| Return | 152–184.5 | 5:04 – 6:09 | The voices drift apart and leave; the motif once more, alone (5:36); the field rests on A. |

## Visual (composition `the-field`, 4K 60 fps — code in `visuals/`, the symlink to tools/visuals/src/compositions/the-field)

Art direction agreed with the user (2026-10-05), after a first version made of stacked neon layers was rejected:

- **One material:** about 524,000 motes of quartz dust (`grains.ts`), the same ones and the same number from the first frame
  to the last — the geometry is built from the sand that leaves the table, nothing appears from nowhere.
- **One palette, "Nácar":** sea glass, periwinkle, lavender, rose quartz, dawn peach, champagne over the night's indigo
  (#0B0E1A, #1A1F3A). One colour field for everything: a gradient by distance from the centre, the same on the table and in
  the air; scattered dust follows a slowly flowing version of it (rejected: random hue per grain, "una caja de M&M").
- **One light:** low moonlight that rises and warms into dawn at the whole, then returns. **deph's HDR look** (bloom on
  light above 1, then HdrCanvas's grade: ACES, saturation, gamma 2.25, vignette, grain) in SDR, as in Songcord/Musica Universalis.
- **One continuous shot**, moves only in 3D (crane, orbit, descent; never a sideways pan), on a spline that flows through its
  keys without stopping; it orbits the flower itself while it floats.

The story on screen:

| Time | What the dust does |
| :--- | :--- |
| 0:00 | Macro: scattered motes in a flowing nacre stain, depth of field; every note lifts the dust softly, evenly. |
| 0:24 – 1:04 | The dust finds the nodal lines: the first Chladni figures. |
| 1:04 – 2:56 | A new figure at each melodic note (at least 3.5 s apart, 3 s glide), the camera rising away. |
| 2:56 – 4:00 | Mitosis: the centre circle rises from the table first, then its six, then the twelve; each grain slides under its place, rises straight up, and its circle buds off its parent. The canon turns the three groups. |
| 4:16 | The three groups line up: the Flower of Life, complete, floating over the emptied table. |
| 5:00 – 5:30 | The fall (approved as is): grains drop straight down, then slide into the figure on the table. |
| 5:50 – 6:09 | The dust scatters to where it began; the camera descends to the grains. |

**The figures are real Chladni figures**, chosen by the music: on a square plate a mode (n, m) resonates at a frequency
proportional to n² + m²; each melodic note sets the figure for the two modes nearest its frequency, weighted by how near
each is (a driven plate between two resonances), with the degenerate halves mixed by c away from ±1 (c = ±1 gives
straight-line grids, rejected by the user as "tic-tac-toe"). The arc pushes the plate into higher overtones as it builds.
A figure never repeats any of the last ten, and the two families of figures alternate: 89 changes, 38 distinct figures.

Rejected and fixed along the way (so they are not tried again): neon line figures over the sand; separate colours per layer;
the square-plate formula as straight grids; grains as shaded spheres (now soft motes); random hue per grain; motes drawn
full-pixel when smaller than a pixel (a white haze); a 20 s fall per grain (a curtain in front of the camera); the flower's
cast shadow (did not read); a 2x2 slab whose corners showed black when the camera turned; two figures visible at once
during a change (now every grain moves almost together).

Measured: 120 frames of 4K in about 12 s plus 17 s of encoding (about an hour for the piece); H.264 3840x2160, 60 fps,
yuv420p, BT.709.

## Material (every voice derives from it)

- **Motif:** E D# C# D# E A G# (degrees 4 3 2 3 4 7 6). Stepwise, leaning on the lydian D#. Answer: its inversion around
  E (E F# G# F# E B C#). Seven notes that come back all piece long while the textures around them change (the idea of
  Floating Points' *Promises*).
- **Tintinnabuli voice** (Arvo Pärt): for each motif note, the first tone of A major (A C# E) above it. The two lines sound
  as one.
- **Chord cycle** (Steve Reich's *Music for 18 Musicians*: a chord cycle as the form): A^9 – B/A – C#m7 – F#m11 – E6/9 –
  G#m7 – B/A – A^9, one chord per 8 s, 64 s per turn. Voiced by Strudel's voicing engine with an anchor, so the pad moves
  by the smallest steps (automatic voice leading).
- **Proportional canon** (Eno's incommensurable loops, made exact): the motif at 21, 13 and 8 cycles per statement.
  Entering at cycles 65, 76 and 88, each voice completes 3, 4 and 5 statements and all three reach cycle 128 together.
- **Harmonic-series arpeggio:** the real overtones (x2, x3, x4, x6, x8: roots and pure 3:2 fifths) of each chord's root, in
  Hz from the same A4 = 432, free rhythm (uneven lengths), ghost notes, and now and then a leap to the next octave.

## Voices and orbits

| Layer | Voice | Register | Orbit / reverb |
| :--- | :--- | :--- | :--- |
| $0 | Pad: two sawtooth layers 7 cents apart (the slow beating is the plate's vibration) | to B4; from 2:08 at or below C#4 | 1 / 8 s |
| $1 | Sub: chord roots, sine, lpf 220 | A1–G#2 | dry |
| $2 | Arpeggio: harmonic series, triangle, non-metric delay 1.13 s | E3–B6 | 3 / 3 s |
| $3 | Lead: the motif in glass (FM ratios 2 and 3) + tintinnabuli sine | A4–A6 | 2 / 9 s |
| $4 | Canon 21, the cantus: sine + triangle, slow vibrato | C#4–A4 | 4 / 7 s |
| $5 | Canon 13: soft triangle | C#5–A5 | 5 / 6 s |
| $6 | Canon 8: glass | C#6–A6 | 2 / 9 s (the lead is silent while it sings) |
| $7 | Bells: FM ratios 1.4 and 2.4 at a low index, mirrored with `jux(rev)` | B6–A7 | 6 / 6 s |
| $8 | Gong at the convergence: A1 + E2 in the bell timbre | A1–E2 | 6 / 6 s |
| $9 | Binaural: 216 Hz carrier, 7 → 6 → 5 → 4 Hz, dry | — | dry |

## Strudel techniques used (all tested in the installed Strudel 1.2.6 first)

- `chord().dict('ireal').anchor().mode('below').voicing()` — automatic voice leading for the pad.
- `echoWith` — the octave answer of the resonating motif, as real events (they reach `frames.json` for the video).
- `sometimesBy` — the arpeggio's occasional octave leap (deterministic randomness).
- `jux(rev)` — the bells' bilateral symmetry: forward in one ear, backward in the other.
- `perlin`, `rand`, `sine` signals for filter breathing, velocity and pan; `arrange()` per voice; the harmony voices run
  continuously for 160 cycles with only their level and filter arranged, so the chord cycle never restarts mid-turn.

## Validation (measured, not heard)

- Inspector: 10 layers, 1584 events over 184.5 cycles, no errors, no warnings. Every pitch is in A lydian (the key estimate
  says E major, r = 0.846 — same notes, a statistical guess).
- **Semitone clashes** (notes 0.5–1.5 semitones apart sounding together in different voices): about 470 in the first
  draft, **44 now**. The first draft put the canon inside the pad's register and the bells on the high canon's notes; the
  fix was register separation from cycle 64. The remaining 44 involve the arpeggio's short notes, plus one 2-cycle overlap
  of the lead and canon 13's entry (2:32).
- **Retention:** motif, pad and binaural at 0:00; something new at least every 8 s through the first minute (every chord
  change is 8 s). The only stretch over 10 s without a melodic onset is 5:20–5:30, inside Rest, with the pad and the cantus
  still sounding.
- Not checked: how it sounds. Claude cannot hear. No render yet (by the user's request); the bells' FM partials should be
  checked with an FFT once there is one.

## Decisions

- Bells: FM synthesis, not samples (samples play in the VS Code extension but the render does not support them yet,
  `docs/sync-pipeline.md` phase 3). The user chose real-bell ratios (1.4 / 2.4) at a low index.
- Meditative (no pulse) and 6:09, both the user's choice.
- The first two drafts (two sustained tones; then a five-part version with a 48 s single-note opening) were rejected as
  empty and slow to start. This version was composed from scratch after research.
