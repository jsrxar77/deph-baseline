# Musica Universalis

The "music of the spheres" (*musica universalis*, Boethius's name for the Pythagorean idea): the cosmos understood as
one harmonic composition, to be tuned into and flowed with rather than fought. A psybient journey: a soft rolling
pulse, one Pythagorean motif that every voice shares, a mid-piece "flight" and a return. Cross-domain facts (key,
tuning, arc, per-domain status) live in `musica-universalis.yaml`; this doc holds the design and what was found
while building.

## Decisions (2026-09-27, with the user)

- **Name**: Musica Universalis. **Domains**: sound and video (first video idea to try: Kepler orbits / harmonograph
  figures drawn from the piece's intervals).
- **Key**: D dorian. **Tuning**: A4 = 432 Hz, and a binaural layer: the channel signature.
- **Character**: "muy volador, muy psy, que te lleve a un lugar". The user chose **psybient with a soft pulse** (the
  first deph piece with rhythm; no kick).
- **Tuning, hybrid**: the drone in exact Pythagorean ratios (Surge XT with a tuning file in Ableton), every other voice
  in equal temperament at 432.
- **Instruments in Ableton**: Surge XT and Serum 2. Composed Ableton-first: every voice but the binaural is MIDI notes.

## Version 2: rewritten for coherence

The first version (planned "tetractys" arc 1:2:4:3) was rejected on first listen, for two reasons:

- **Too slow a start for YouTube.** Almost one note (the monochord) until the pulse at 1:52.
- **Incoherent.** "Tiene que ser algo más coherente": each voice ran on its own planetary loop length (pad 8, arp 3,
  bass 25, bells 13/8) with its own material (drone, an unrelated arp, Kepler's planet songs, a Shepard scale). Without
  a beat that floats (Slow Drift); over a pulse it reads as a collage, because the ear expects bass, chords and arp to
  change together.

Version 2 is built on two shared things:

- **One motif**: the Pythagorean cell **D-A-G-D** (unison, fifth, fourth, octave: the tetractys consonances 1, 3:2,
  4:3, 2:1). The arp plays it in 16ths on each bar's root. The lead sings it one note per 2 bars. The bass rolls on
  the roots. The drone holds D and its pure fifth.
- **One progression**, in 8-bar phrases that every voice follows: **Dm6 (2) – Gsus4 (2) – Csus4 (2) – Dm6 (2)**.
  Harmony of fourths and fifths, as in the Pythagorean tradition, where thirds were the dissonances. Dm6 (D F A B)
  keeps the dorian colour note, B.

The planets and the tetractys ratios no longer drive the structure.

## Tempo, duration, key, tuning

- `setcpm(30)`: 1 cycle = 2 s = one 4/4 bar at **120 BPM** (Ableton's tempo). 240 bars = **8:00**.
- D dorian from `ROOT`/`KEY_SUFFIX`. Measured on the evaluated events: 0 notes outside the mode. The inspector's key
  estimate says "D minor (r = 0.81)" because it only has major/minor profiles.
- A4 = 432 on every voice via `tune()` (−31.77 cents).
- The drone alone goes through `pythagorean()`: every pitch is a chain of pure 3:2 fifths from D. D dorian is exactly
  F C G D A E B, symmetric around D in the chain of fifths, which is why it is the Pythagorean mode. D2/D3 sit at
  −31.767 cents from their 12-TET keys (the 432 shift) and A2 at −29.812 (+1.955), so D–A = 701.955 cents = 3:2
  exactly (checked on the events in version 1; the same helper is used in version 2).

## Arc

Shortened from 8:00 to **6:00** after listening: the user found 8 minutes too long for something this repetitive, and
the Shepard scale arrived too late (3:28). Development, climax, return and outro were trimmed; the flight was kept
whole and now starts at 2:24, the middle of the piece. Every section still starts on the 8-bar phrase (Dm6); the
development is exactly 2 breaths of the arp/pad interlace and the return exactly 4.

| Section | Bars | Time | What happens |
|---|---|---|---|
| Intro (hook) | 1–8 | 0:00 | Drone, pad and the motif in the arp (filtered, quiet), all from the first second. |
| Development | 9–32 | 0:16 | The rolling bass (the groove) arrives; arp and pad start breathing against each other; the lead sings the motif from bar 21. |
| Climax | 33–72 | 1:04 | Everything; the drone adds its octave; arp and pad keep interlacing. |
| Flight (break) | 73–104 | 2:24 | Bass out. Over 12 bars the arp fades and darkens while the Shepard scale rises in; 12 bars of Shepard; over the last 8 the arp returns opening while the Shepard begins to recede. |
| Return | 105–152 | 3:28 | The groove back at its brightest; the Shepard fades out over the first 16 bars; arp and pad interlace again. |
| Outro | 153–180 | 5:04 | The bass leaves first, then the lead and the arp; the drone ends alone, fading. |

Measured crossfade in the flight (peak level per bar): arp −16 dB at 2:20 → silent by 2:48 (filter 2.4 kHz → 500 Hz)
while the Shepard rises −33 → −20 dB; arp back from 3:12 (−29 → −15 dB) while the Shepard recedes to silence by about
4:00. The Shepard is one continuous 48-bar segment: its notes keep climbing across the flight/return boundary (a
restart there would break the endless-rise illusion).

## Arp and pad interlace ("subiendo uno, bajando otro")

The user's idea: in development, climax and return the arp and the pad breathe in opposite phase. One rises in presence
(+5 dB, filter ×1.35) as the other falls back (−5 dB, ×0.75), then they cross. The cycle is 12 bars (twelve fifths close
the Pythagorean circle), which against the 8-bar phrase is 12:8 = 3:2, a pure fifth: 3 breaths per 2 phrases, realigning
every 24 bars. Measured in the climax: arp −16 dB / 1.9 kHz while the pad is −26 dB / 1.3 kHz, reversed 6 bars later.
The pad's own 16-bar filter sweep is replaced by the breath in those sections, because with both it opened when it
should be falling back. The arp was also made darker and ~3 dB louder (resonance 7 → 3, filter ranges ~35% lower) after
the user found it "muy agudo, mucho brillo" and quiet. The Shepard was made more present (sawtooth instead of triangle,
filter 3.5 kHz, peak gain 0.07 → 0.10) because it was getting lost.

## Voices (one `$:` layer = one MIDI track)

| Layer | Voice | Material | Sound in Strudel |
|---|---|---|---|
| `$0` | drone | D2 + pure A2 (+ D3 from the climax on), retriggered every 4 bars | triangle, attack 3 s / release 5 s, lpf 800 |
| `$1` | pad | the progression, one voicing per chord | sawtooth, lpf breathing 900 Hz up to 1.4–2.8 kHz by section |
| `$2` | arp | `0 4 3 7 ×3, 11 7 4 3` on each bar's root, in 16ths | resonant saw plucks, filter envelope, alternating pan, dotted-8th delay |
| `$3` | bass | offbeat roll `[~ x x x]` per beat on D1, G1, C2 | saw pluck, lpf 280 with envelope |
| `$4` | lead | `<0 ~ 4 ~ 3 ~ 7 ~>`: D, A, G, D' over the phrase | glass bells (integer FM 2 and 3), 1.13 s non-metric echo, reverb 9 s |
| `$5` | shepard | 5 voices an octave apart, climbing one degree per half bar, level `sin²` of their place in a 5-octave window | triangle; the level lives in `velocity` |
| `$6` | binaural | D3 at 432 (144.16 Hz), L/R split by 10 / 8 / 6 / 8 / 4 Hz by section, retriggered every 4 bars | dry sines |

Harmony, measured on every note against the bar's chord: bass 2112/2112 chord roots; pad 840/840; arp 2912 chord tones
+ 416 passing (G over Dm6, a whole tone), **0 a semitone from a chord tone**; lead 146 chord tones + 50 (A over Gsus4,
its 9th), 0 semitone clashes. A first draft of version 2 used G major and C major triads: the motif's fourth (C over G,
F over C) then sat a semitone from the chord's third on 416 arp notes; the sus4 voicings removed all of them.

## Making it organic (after listening, same day)

The user: "todo debería ser más orgánico… una melodía entrelazada que lleve a la persona a un viaje, no a sobresaltos".
Measured causes and fixes:

- **The arp vanished**: silent for 12 bars in the flight, and −5 dB breath dips on top of a low level. Now it never
  stops: in the flight it steps back to about −32 dB (dark), the breath is ±3 dB, and the flight starts from the level
  and brightness where the climax leaves it (−17.9 → −18.4 dB, 2148 → 2100 Hz across the boundary).
- **The Shepard sounded detached** ("agarrado de los pelos, en otro tiempo"): it stepped through every scale degree
  every half bar regardless of the chord. It is now built from the progression itself. Dm6 → Gsus4 → Csus4 → Dm6 climbs
  by fourths, and voice-led upward each phrase ends exactly an octave higher, so the chords form the endless rise: one
  octave per phrase, one chord per 2 bars, legato, triangle. All 420 of its notes are chord tones of the bar.
- **The arp is calmer and draws an arc**: eighths instead of 16ths (8-step line `0 4 3 7 11 7 4 3`, a small
  rise-and-fall per bar), dotted-quarter ping-pong delay, rounder pluck. Its register climbs by Pythagorean steps
  (base, +fifth halfway through the development, +octave in climax and return, back down through the flight and
  outro): intro D3–G5, climax and return D4–G6, outro down to D3.
- **Section edges**: the bass fades over 4 bars out of the climax and back into the return instead of cutting.

## Variation: organic arp (`sounds/backup/musica-universalis-organic.strudel`)

The user wanted the arp "less mathematical, less glued to the beat… with probability… not so Kraftwerk", keeping its
notes. Everything else is identical to the approved version.

- **First try: drop notes by probability** (`?p` steps, about 6.3 of 8 notes a bar, 0–24 ms timing drift). The user:
  "muy cortada… tiene que ser un viaje, orgánico pero sin frenadas". Every missing note was a small stop.
- **Now: ghost notes instead of gaps.** Every note plays. Per step, `[1|0.45]` picks each bar between a full note and a
  ghost note at 45% (the downbeat root and the octave are always full), so the accent moves while the flow never stops.
  Notes are more legato (decay 0.35–0.55 s, release 0.35), timing drift is at most 10 ms (24 felt like stumbling),
  and there's a perlin phrase swell on velocity. Measured: 8 notes in every bar, longest gap between notes 259 ms (an
  eighth is 250), 39% ghost notes. Strudel's `nudge` control was not usable: nothing in superdough or the web-audio
  output applies it.

## Main version: meditative, no pulse (`sounds/musica-universalis.strudel`)

Chosen by the user for the render and the video; the pulse and organic versions moved to `sounds/backup/`. The arp
was then moved up an octave (D4–G7, `ARP_OCTAVE = 7`), tried and kept.


Built on the organic variation; the user wanted it "más meditativa, tal vez sin pulso". Same harmony, motif, arp/pad
breath, Shepard, lead, tuning and binaural. What made the pulse is gone:
- **Bass** → one held sine per chord on its root (D1, G1, C2): a floor that doesn't beat.
- **Arp** → a free rhythm. The same 8 notes with uneven lengths, 3-2-3-4-2-3-4-3 sixths of a bar (500/333/500/667/333/
  500/667/500 ms) over 2 bars, like breathing, plus 0–40 ms per note. It is soft (triangle, no resonance or filter
  envelope), with long bell-like tails and a non-metric 1.13 s echo. Measured: an even grid with random jitter (sd 39 ms)
  or a smooth perlin rubato (sd 22–43 ms) still left notes every ~500 ms, steady quarters at 120 BPM, heard as a pulse.
  The free rhythm spreads the gaps evenly over 300–700 ms (sd 118).
- **Pad** → each chord held its full 2 bars.
- **Register arc by octaves only** (2:1). The "+fifth" step of the other versions puts an E against the Dm6's F (a
  semitone). The fast arp hides it, but these long tails held it (33 notes). Now 0 semitone clashes in every voice.
  The approved and organic versions still have that rub (66 quick notes, in the development's second half, the flight
  and the outro).
- **Arp presence** (user: "un poco más de presencia… más llevadera y no tan uniforme"): +4 dB, filter opened ×1.4 (the
  triangle is much darker than the saw the ranges were set for), wider phrase swell (velocity 0.45–1, was 0.6–1).
  Measured medians: climax arp −22.2 / pad −21.4 dB, return −21.8 / −20.9 dB (the arp sat about 4 dB under before), about
  15 dB between its softest and loudest notes.

## Issues found while building

- **Long notes keep sounding after Strudel is stopped.** superdough schedules each note whole when it starts, so
  Cmd+. doesn't cut it. Version 1's drone and binaural had notes up to 96 bars (3:12), which the user heard as
  "something stuck, still sounding when I switch the audio engine on". Version 2: no note longer than 4 bars.
  (Slow Drift has notes up to 72 bars, 144 s: the same effect, not fixed yet.)
- **`g * 0.5` with a fade pattern is NaN, and superdough plays NaN gain as 1 (full volume).** The lead's second FM
  operator did this in the outro (`"NaN" is not a number, falling back to 1` in the render log). Fixed with
  `.velocity(0.5)`, and `midi-map.mjs` now warns about any note with a non-numeric level.
- **`phaser` doesn't render headlessly** (an AudioWorklet not registered in Node): the pad's phaser is in Ableton.
- **`scale()` yields note names** ("D3"): `tune()`/`pythagorean()` convert with `noteToMidi` before adding cents.
- **Backtick strings are mini-notation too**: chords are built with mini-notation `[a,b,c]` literals, not templates.
- **`velocity` multiplies `gain` in superdough** (linear): the Shepard's bell curve is carried in `velocity`, and
  `midi-map.mjs` uses `gain × velocity` as a note's level.
- **Rendering is slow for dense pieces** (the render never frees audio nodes, to avoid the engine lockup): one full
  render of version 1 ran over 25 minutes. Each layer is rendered with `--only` in parallel and the layers are summed.
  This is equivalent, because every voice has its own orbit.

## Ableton

Exported with `--names drone,pad,arp,bass,lead,shepard --no-bend drone`. The drone's tuning comes from
`daw/tuning/musica-universalis-pythagorean.scl/.kbm` (textbook Pythagorean ratios 256/243 … 243/128, D4 = 288.325 Hz),
generated by `tools/sounds/scl.mjs` and loaded in Surge XT. The other five tracks carry the −31.77-cent bend. First
notes in the `.mid`: drone, pad and arp in bar 1, bass in bar 9 (second 16th), lead in bar 25, Shepard in bar 105.
Guide: `musica-universalis.ableton.md`.

## Visual (in progress, 2026-09-27)

Composition `musica-universalis` (4K), code in `tools/visuals/src/compositions/musica-universalis/` (linked from `visuals/`).
Built like Songcord, as one scene rather than stacked layers:

- **World:** a dark nebula and star dust at four depths (far: tiny and sharp; near: large and out of focus), drifting at
  different speeds (parallax without any camera move). More dust as the arc opens, less as it resolves (`shader.ts`).
- **Water:** Songcord's slow refraction swell, and **stones** (`stones.ts`, sharing `tools/visuals/src/shared/ripples.ts`
  with Songcord): every arp note drops a tight, quick ripple, every lead bell a wide slow one, and sustained passages breathe
  a very wide ring every 2.4 s. A stone leans toward its note's pan and pitch and is otherwise spread over the frame. The
  water is never drawn: it bends the dust behind it and catches light (glints), brightest where ripples cross.
- **Beings of light** (`beings.ts`, drawn with Songcord's beam and head): one alone at the start, up to six at the top of the
  arc, one again at the end. Each is wide and white at the head, with a flare stretched along its travel, tapering through
  teal and blue to violet over a 4 s trail, and lights the world, dust and glints around it. They move through 3D on large
  orbits in perspective (nearer = larger and brighter); each orbit's plane precesses about the line of sight, and at chord
  changes a being may change sphere along its tangent (same point, direction and speed; 48 changes in the piece). Speed
  follows the arc through a music clock (an integral, never rate x t). Measured: worst speed swing inside a trail 1.8x, worst
  direction turn at a sphere change 0.43 degrees per frame, 86% of the time on screen. The world is scaled down and given a
  black level before the lights, as in Songcord. A lead bell makes one being swell (capped).

Tried and deleted (see `deph-style`): a swarm of 26 thin rays ("bacterias"; replaced by Songcord-style beings), a static harmonograph, Lissajous comets (frantic, "espermatozoide"), a Multibrot
mandala ("un escudo"), and a first water that ported Songcord's *wake* layer (V-wakes drawn as lines) instead of its
*ripples* — the user meant "como cuando tirás una piedra".
