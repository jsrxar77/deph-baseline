# The Field

`sounds/the-field.strudel` — 6:09, A lydian, tuned to A4 = 432 Hz, 30 cpm (184.5 cycles of 2 s). Meditative, no pulse.
Binaural layer (headphones). Video: `tools/visuals/src/compositions/the-field/` (composition `the-field`, 4K 60 fps).
Named Morpho-Field until 2026-10-05.

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

- **The field:** sand on an endless vibrating plate, seen by a slow camera under a low grazing light. The sand gathers on
  the nodal lines of a circular-plate mode (m petals, k rings: `cos(m θ)·cos(π k r)` plus a quieter overtone mode); every
  chord is a mode, so the sand migrates to a new figure every 8 s (3.5 s transition). The modes grow more complex with the
  arc and return to the simplest at the end. Each grain is either there or not (its own random threshold against the
  local density), so the edges are granular, not airbrushed.
- **Notes move the sand:** the lead's notes are wide slow waves, the arp's small quick ones, the gong a shock; deph's
  creation torus lifts the sand where its waves cross, never drawn as a shape.
- **Geometry:** three figures of light from Morpho-Genesis's sacred geometry, made parametric in
  `tools/visuals/src/shared/sacredGeometry.ts`, rise from the sand on planes at three heights, one per canon voice: Flower
  of Life (cantus 21, teal), Metatron's Cube (middle 13, amethyst), Seed of Life (high 8, gold). Each grows one element per
  note of its voice and turns 60° per statement (they are six-fold symmetric), so all three line up exactly at 4:16.
  Bells: mirrored glints left/right on the highest plane.
- **The whole (4:16):** the camera has risen during the inhale to look straight down; the figures line up and turn white
  gold, the sand redraws Metatron's Cube right under the light one (scaled for the plane's height so the lines coincide),
  the gong's shock crosses the field. Then the figures turn apart again and fade, and the camera lowers over the field.
- **Look:** HdrCanvas (bloom, ACES, grain), depth of field per plane (sharp filament in focus, aura out of it), distance
  fog to the horizon. Low chromatic aberration (0.0004): stronger values split single-pixel grains into coloured dots.
- **Measured:** one 4K frame renders in about 0.15 s; 120 frames in 18 s plus encoding; output H.264 3840x2160 60 fps,
  yuv420p, BT.709, limited range. Contact sheet checked at 0:06, 0:40, 1:20, 2:00, 2:30, 3:10, 3:50, 4:08, 4:17, 4:30, 5:10, 5:50.
- **Fixed while building it:** the square-plate formula repeated over the field read as a wireframe grid (replaced by
  circular modes); three figures sharing a centre summed to a white blow-out (light halved, out-of-focus aura halved);
  the sand's Metatron and the light's were drawn at different scales and doubled every line (matched).

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
