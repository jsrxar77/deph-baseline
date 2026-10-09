---
name: strudel-compose
description: Use when writing the .strudel file for a composition's sound domain, once a composition folder (media/<name>/) already exists — covers the intro/development/climax/deceleration/outro workflow, arrange()-per-voice structure, the key/scale convention, file layout (media/<name>/sounds/), and validating with the headless inspector since Claude cannot hear audio. For scaffolding a brand-new composition (deciding domains, arc, key), see the deph-compose skill first.
---

# Composing a Strudel piece

This project pairs Claude with the user to write generative ambient music in Strudel (a JS port of
TidalCycles), in the style established by "Slow Drift" (`media/slow-drift/sounds/slow-drift.strudel`,
`media/slow-drift/slow-drift.md`): independent voices built from loop lengths that share no common
factor, so the texture phases and recombines instead of repeating, arranged into a longer arc.

Claude cannot hear audio and cannot drive the VS Code extension (`cmillsdev.strudelvs`) that plays these
files. Everything here is validated by reading structured event data with
`tools/sounds/inspect.mjs`, never by ear — see `CLAUDE.md` for that tool's full usage and for the
project's file-layout rule (which folder anything new belongs in).

## Before writing any code

This skill assumes `deph-compose` already scaffolded `media/<name>/` with its yaml, doc, and empty
`sounds/`/`visuals/`/`sync/` subfolders — arc, duration, and key were already decided there. Read
`media/<name>/<name>.yaml` for those values rather than asking again. If no composition folder
exists yet, stop and use `deph-compose` first.

## Structure

- **One `arrange()` timeline per voice**, not a single `arrange()` that pre-mixes every voice into
  combined sections. Each voice's `$:`-labeled pattern gets its own `arrange([cycles, pattern], ...)`
  across the same section boundaries (from the yaml's `arc`). This keeps every instrument visible as its
  own layer to the inspector (and to the VS Code extension's per-layer highlighting) — pre-mixing loses
  that.
- `arrange()` re-indexes each section's time from 0. A voice present on both sides of a boundary
  restarts its own cycle-counter there, retriggering rather than continuing a held note — with a few
  seconds of attack this reads as a soft swell, not a click, and can be used on purpose (e.g. all voices
  attacking together at a climax's start, if their arrange() calls share the same boundaries).
- A fade-in built as `saw.slow(N).range(0, target)` starts at literal 0; if a voice's first note lands
  there, it's audible-value-zero — not a bug, but give it a small floor (`range(0.06, target)`) unless
  true silence-to-something is wanted.

## Key/scale as the single source of truth

Declare every scale the piece actually uses as a named constant near the top of the file — usually just
one (from the yaml's `key` field), but if a piece genuinely needs a second (a real modulation, or one
voice deliberately in a different mode), give it its own clearly named constant too. The rule isn't
"exactly one" — it's "every scale in use is a visible, named constant that every `scale()`/chord call
actually derives from," never a bare hardcoded scale string duplicated across voices, whether that's one
scale or several:

```js
const ROOT = 'C';        // single quotes — see the gotcha below
const KEY_SUFFIX = ':major';
const KEY = ROOT + KEY_SUFFIX;                      // "C:major" — matches the yaml's `key` field
const scaleAt = (octave) => ROOT + octave + KEY_SUFFIX; // e.g. scaleAt(4) => "C4:major"
```

`scale()` indexes **diatonic scale degrees** (0=root, 1=second, 2=third...), not semitones — stacking
thirds for a 9th chord is degrees `0 2 4 6 8`, not `0 4 7 11 14`.

**Gotcha: use single quotes for these helper constants, not double.** Strudel auto-runs every
*double*-quoted string literal in a `.strudel` file through its mini-notation parser at parse time, even
ones never passed to a pattern function — `"C4:major"` happens to also be valid mini-notation (word +
sample-index-like suffix) so it slips through, but a double-quoted literal that starts with `:` (e.g.
`":major"`, or building one via `KEY.split(":")`/a `` `${root}:${quality}` `` template literal, both of
which produce a bare `":"` token in the source) isn't valid mini-notation and throws `[mini] parse error
... but ":" found` — tested directly, not assumed. Single-quoted string literals are never run through
that parser, so plain-JS helper values (as opposed to the actual pattern arguments passed to `n()`,
`s()`, `.scale()`, etc., which should stay double-quoted as elsewhere in the file) should use single
quotes.

## Timbre: FM synthesis for inharmonic/bell-like sounds, not sampling

`s("sine")`/`s("triangle")` etc. are pure or near-pure harmonic tones — fine for drones and pads, wrong
for anything meant to sound like a struck/metallic instrument (bells, gongs, chimes), since those ring
with an *inharmonic* cluster of partials, not simple integer overtones. Don't reach for sample-based
`s()` sounds to fix this — `superdough` (confirmed by reading its actual source,
`tools/sounds/node_modules/superdough/helpers.mjs`) supports full FM synthesis on any oscillator voice:

```js
.fm(2.5).fmh(1.4)
.fmattack(0.012).fmdecay(0.35).fmsustain(0.06).fmenv('exp')
```

- `fmh` (harmonicity ratio) sets the modulator frequency as a multiple of the carrier. **Whole-number
  ratios sound harmonic/natural; non-integer ratios sound metallic/inharmonic** — the mechanism itself,
  not a preset. `1.4` is Chowning's original 1973 FM bell ratio; Strudel's own docs use `1.61` for the
  same effect — either is a reasonable starting point, not a magic number to copy blindly for every sound.
- `fm` (aliased to `fmi` — confirmed via `@strudel/core`'s actual export list) is the modulation
  index/depth: how much inharmonic content is mixed in. Start lower than feels dramatic (`2`-`3`, not
  `6`+) if the voice sits under other harmonic/diatonic material — too much inharmonic depth reads as
  clashing with the rest of the mix, not as "more bell", independent of the ratio chosen.
- The separate `fm*` envelope matters as much as the ratio. A real struck object's bright inharmonic
  clang decays *faster* than its fundamental tone — without a separate, faster-decaying `fmdecay`/
  `fmsustain`, constant FM depth just sounds like a buzzy drone, not something that was struck. Pair with
  a longer `release` on the voice itself so the (now-purer) tail actually has room to ring out.
- **`fmattack` must not be `0`.** An FM modulation index jumping from 0 to full depth in a single sample
  is a real discontinuity (a "zip" artifact — the instantaneous step smears energy across frequencies),
  audible as a harsh click/glitch on every hit. This is a frequency-domain artifact, not an amplitude
  one — it will *not* show up as an unusually large sample-to-sample jump when checking the rendered
  waveform for clipping/clicks (confirmed directly: a piece with this bug showed zero clipping and
  normal jump magnitudes on every affected hit). A small positive value (`0.01`-`0.02`) costs nothing
  perceptually — no real struck transient is mathematically instantaneous either — and removes the
  discontinuity. If a percussive FM voice sounds glitchy and the waveform itself checks out clean, check
  `fmattack` (and any other envelope attack parameter) for a literal `0` before looking elsewhere.
- **One carrier+modulator pair reads as a simple "buzz"; layer two operators at different ratios for a
  denser, more convincing inharmonic spectrum** (real bell patches, DX7 designs included, rarely use
  just one). Build the note pattern once and reuse the same pattern object for both layers rather than
  calling `.degradeBy()` (or any other randomized filter) separately per layer — even though Strudel
  patterns are deterministic pure functions of position, so two identical `degradeBy` calls would
  probably select the same events anyway, sharing one pattern object removes that doubt instead of
  relying on the assumption:

  ```js
  const notes = n("...").scale(...).degradeBy(density); // built once
  const strike = (p) => p.s("sine").attack(...) /* shared envelope/fx */ ;
  stack(
    strike(notes.fm(2.5).fmh(1.4)).gain(g),
    strike(notes.fm(1.2).fmh(2.4)).gain(g * 0.5),
  );
  ```

Claude cannot hear the result — verify structurally (the inspector shows `fmi`/`fmh`/etc. on the right
events, per `--json`, and that layered operators fire on identical `begin`/`note` pairs), verify the
render pipeline doesn't error on it (FM synthesis is a more complex code path than a bare oscillator;
test with `tools/sounds/render.mjs`, not just the inspector), and check the rendered waveform directly
for clipping or anomalous sample-to-sample jumps around every onset of the affected voice (not just one
example hit) if a glitch is reported — this catches amplitude-domain problems, though not the FM-zip
class of artifact above. None of this confirms it sounds *good* — only that it's doing something real
and that no digital artifact was found. The actual timbral judgment is the user's, by ear, same as every
other sound decision in this project.

## An unset `decay` still has a value — check the actual default before ruling it out

`registerSynthSounds` (`synth.mjs`) defaults unset ADSR fields to `[0.001, 0.05, 0.6, 0.01]`
(attack/decay/sustain/release) — if a voice sets `attack`/`sustain`/`release` explicitly but never calls
`.decay(...)`, gain still moves attack→peak→**decay(0.05s)**→sustain as a real, fast stage, not "no
decay". A voice with a fast attack and no explicit decay snaps from peak to sustain in two quick
back-to-back stages — a sharp "snap" shape, easy to mistake for a click/glitch on a technically clean
signal, especially if something else (an FM clang, a transient) peaks in that same narrow window. Set
`decay` explicitly whenever the attack is fast and the sustain level is well below the peak, so the
transition has real time to be a transition. **"Fast attack" isn't even the trigger condition** — a
*slow* 3-second attack followed by the same 0.05s default decay down to a low sustain produced an
arguably more noticeable "clap" (gentle build, then a snap) when this showed up in a second voice in the
same piece. The real trigger condition is `sustain` being well below the envelope's peak (normalized to
1) — if `sustain(1)` (peak == sustain), a missing decay is harmless, since there's no level *change* for
that stage to snap through, regardless of attack speed. When this bug is found in one voice, **check
every other voice's `sustain` value** for the same exposure rather than waiting for it to be reported
again per-voice — it's a piece-wide check, not a one-off fix.

## Diagnosing a reported "click"/"glitch": test the actual failure pattern, not just one hit

If the report is inconsistent ("sometimes at the start, sometimes at the end") that itself is a clue —
a genuine per-note envelope bug misbehaves the *same way* on every hit, so inconsistency points at
something timing- or overlap-dependent instead. Two checks worth doing before touching parameters again:

1. **Scan the *entire* duration of an isolated note** (silence around it, one hit, full expected
   tail length) for anomalous sample-to-sample jumps or clipping — not just a short window near the
   onset. Where in the timeline the anomalies (if any) cluster tells you what's actually happening.
2. **Render the real overlapping scenario**, not just one hit in isolation — the actual pattern's own
   notes overlapping with their own long tails, the way they do in the real piece. Scan for the
   specific pattern reported (e.g. "level drops, then jumps back up") and check whether the timestamps
   match the pattern's own legitimate note-onset times. A "jump" that lands exactly on a real scheduled
   note start is the next note beginning while the previous tail rings on — correct behavior, not a bug.

Both checks were run before making further changes here, found no digital artifact under either
scenario, and pointed at an envelope*-shape* explanation (the decay finding above) instead of a rendering
defect — recorded so the next glitch report doesn't have to re-derive this same diagnostic approach.

## `size`/`roomsize` is reverb decay time in seconds, not a 0-1 knob

A voice with `room(0.95).size(0.95)` (very wet, and — reasonably — "0.95" reads as "almost max size" if
you assume a normalized 0-1 range) still comes out sounding dry. Confirmed by reading superdough's actual
reverb source (`node_modules/superdough/reverb.mjs` calls into `reverbGen.mjs`): `size`/`roomsize` is
passed straight through as `decayTime` in **seconds** to the impulse-response generator. `size(0.95)` is
under a one-second reverb tail — a high `room` (wet send level, genuinely 0-1) into a sub-second tail
still reads as small/dry, no matter how wet. For an ambient "heavy room"/spacious character, `size` needs
to be several seconds (`4`-`8` is a reasonable range to start from), not a value chosen to "feel like"
0-1. Verify by rendering a single isolated note (silence around it, so nothing else contaminates the
measurement) and checking that RMS energy decays smoothly over multiple seconds rather than dropping to
near-silence within about a second.

## Give each voice with its own reverb size its own `.orbit(n)`

superdough keeps **one reverb per orbit** and regenerates its impulse response whenever an event with a
different `size` arrives. Voices with different sizes sharing the default orbit therefore swap the reverb
under each other's still-ringing tails — audible live as level jumps, and in the headless render it
contributed to an engine lockup (output stuck repeating one 128-sample block, a steady tone to the end of
the file). Rule: every voice that uses `room` with a distinct `size` gets its own `.orbit(1)`, `.orbit(2)`,
... (delay is per-orbit too, which is another reason not to share). `render.mjs` prints a WARNING when
it sees two sizes on one orbit. Also: **a clipping/jump/RMS scan cannot detect a frozen render** — after
any render, also confirm the audio evolves (spectrum per ~20s window changes; no block repeats), which
`render.mjs` now checks itself and retries automatically.

## Alternate tuning (e.g. A=432) and binaural layers

- **Tuning:** Strudel maps notes to Hz with A4 = 440 fixed. To retune, add the semitone offset to every
  pitched voice: `const TUNE = 12 * Math.log2(432 / 440)` (-0.3177) and `const tune = (p) => p.add(note(TUNE))`,
  wrapped around each voice's `n(...).scale(...)` pattern (fractional MIDI notes are fine; `add(note())`
  also works on note names). Don't retune the Hz-specified layers twice — define those from the same
  `A4` constant. Verify with a high-resolution FFT (2^18 points) of a sustained low note, not the
  inspector: its key estimate can't see a 32-cent shift.
- **Binaural beats:** two sines, `freq(carrier - beat/2).pan(0)` and `freq(carrier + beat/2).pan(1)`
  (`pan(0)` is fully left, `pan(1)` fully right). Keep the voice **dry** (no `room`/`delay`) since those sum
  L/R and destroy the separation; use one long note per section (`.slow(cycles)`) rather than a
  retriggering pattern; keep it low in the mix. Verify per channel with the fine FFT: each tone should be
  ~70 dB stronger in its own channel. Per-event params (like `gain`) are sampled once at each event's
  onset, so a `saw`/`isaw` ramp on a single long note is NOT a continuous ramp — use one event per
  section with different values and let attack/release crossfade.
- Promotion honesty: "tuned to 432 Hz" is a fact; "healing"/"relaxing" claims for 432 or binaural beats
  aren't supported by good evidence, and beats work only on headphones.

## Check FM partials against the scale: inharmonic ratios put loud non-scale pitches under the note

A non-integer `fmh` (1.4, 2.4, ...) is inharmonic on purpose, but the partials it makes are not quiet
decoration: measured on the real bell, sidebands at 0.4x, 2.4x and 3.4x the note's frequency sat only ~20 dB
below the note itself. Those are not scale tones — an E5 bell's 0.4x partial (~259 Hz) is a slightly sharp
C4, which clashes with a pad or carrier on C4. In a piece where the other voices are diatonic and tuned
precisely, the result reads as "something isn't right with the bells" even when every written note is in
scale — so the notes get blamed when the timbre is the cause. Diagnose by rendering ONE dry hit (no
reverb/delay), FFT it at 2^17 points, list peaks above ~3% of the maximum as ratios to the fundamental and
compute their average distance in cents from the nearest integer harmonic (about 260 cents for the old
bell, about 1 for integer `fmh`). For a calm/meditative piece use integer `fmh` (2 and 3: the note and its
twelfth) and keep the metallic ratios for pieces where a clashing struck-metal color is the goal. Compare
RMS before and after so the mix balance doesn't change.

Also for phrase choice: count, for each bell hit, the sounding pad notes (onset to end plus release) at
0.5-1.5 semitones distance — unison/octaves are fine, semitones rub. Use the same count when trying new phrases.

## Non-metric delay, for a piece with no fixed beat

`delay`/`delaytime`/`delayfeedback` add real echoes, which is useful for space — but `delaytime` set to a
round musical fraction (e.g. a clean 1/4 or 1/8 of the cycle) introduces an audible, regular pulse, which
directly fights a piece built specifically to have no fixed beat (see "Structure" above). Use a
`delaytime` that isn't a round fraction of the tempo, and keep `delayfeedback` low, so the echo reads as
added space/depth rather than a rhythmic repeat.

## A percussive "pluck" is the attack→decay *shape*, not the release length — and "pedal" is overlap

After fixing a missing-`decay` snap (see above), a struck voice can still be reported as "dry"/"cutting"
with no defect present — this is a different problem, not a residual bug. `attack(0.05)` rising fast to a
peak then `decay(0.3)` dropping to a much lower `sustain` is itself a percussive "pluck" contour; a long
`release` afterward doesn't change that first impression, since the ear already read the strike from the
rise-then-drop shape before the release tail even starts. If the goal is a "sustain pedal" feel (notes
ringing into and blending with the next one, like piano strings resonating together), the fix has two
independent parts, and both matter: **(1)** raise `sustain` and/or lengthen `decay` so the level doesn't
fall away sharply right after the strike, softening the pluck shape itself; **(2)** raise `delayfeedback`
(and check `delay`'s wet level is still enough to hear the now-more-numerous repeats) so successive echoes
actually overlap and accumulate into a wash instead of thinning out fast — that overlap between one note's
tail and the next note's onset is the literal mechanism of a pedal effect, not just "add more delay". A
longer `release` alone addresses neither.

When making this kind of change, re-verify for two different things than the clap-bug checks above: a
higher `sustain` will legitimately raise the max sample-to-sample jump seen in a jump/clipping scan (louder
signal, not a new artifact) — check the timestamp against the real event timeline to confirm it lands on
an actual note, ideally in a denser section (e.g. the climax) rather than assume; and a higher
`delayfeedback` risks runaway (unbounded energy buildup, eventually clipping) — check by scanning RMS in
short (e.g. 1s) windows across the whole render and confirming energy doesn't grow for an extended,
unbroken stretch disproportionate to the music's own arc (a handful of consecutive rising windows during a
climax build is expected; growth that doesn't plateau or that pushes the file's peak amplitude toward
clipping is not).

## File layout

`media/<name>/` is the composition folder (scaffolded by `deph-compose`) — see `CLAUDE.md`'s "File
layout" section for the full project-wide rule.

- Piece: `media/<name>/sounds/<name>.strudel`, plus any variant files (e.g. an unarranged comparison
  version, see `media/slow-drift/sounds/slow-drift-loop-only.strudel`). `test.strudel` at the project
  root is an inspector fixture, not a piece — don't add real compositions there.
- Doc: `media/<name>/<name>.md` — arc/duration table, voices, key, design decisions and any issues found
  while building it. Use `media/slow-drift/slow-drift.md` as the template.
- Long-form workflow rationale: `docs/composition-workflow.md` (cross-cutting docs live in `/docs`, never
  a specific composition's doc).

## Before finishing: reconcile the whole yaml, not just your own status

Writing the piece is the step that discovers real numbers `deph-compose` left as `null` — don't stop at
flipping `domains.sound.status` to `done`. Re-read `media/<name>/<name>.yaml` and check every field
this work actually affects:

- `tempo.cpm` — set from the piece's real `setcpm()` call.
- `arc[].cycles` and `total_cycles` — set from the real `arrange()` cycle counts, matching the doc's
  arc/duration table.
- `key` — confirm it still matches `ROOT`/`KEY_SUFFIX` (or all scale constants, if more than one); if the
  piece ended up using a different key than originally planned, update the yaml, don't leave it stale.
- `domains.sound.file` and `.status` — the path should already be right from scaffolding; status to
  `done`.

A domain skill that only touches its own status field leaves the yaml half-true (e.g. `tempo.cpm: null`
next to a finished piece that clearly has a tempo) — the yaml is the single cross-domain source of truth
specifically because every skill that touches a composition keeps *all* of it current, not just its own
corner. See `deph-compose`'s "Hand off" section for the same rule stated once, canonically.

## Before handing a piece to the user: the listener checklist (mandatory)

The Field's first two drafts (then named Morpho-Field) were rejected as "two notes for two minutes" and "one note alone for 48 s", although
`deph-style` already said why (its "Retention" rule, learned on Slow Drift and Musica Universalis). The rule exists; this is
the check that makes sure it is applied. Run all of it, with numbers, before telling the user a piece is ready:

1. **Hook at 0:00.** The motif (or the piece's most recognisable element) sounds in the first seconds, with the harmony.
   Never a lone tone or silence as the opening idea — a concept like "one tone alone" is expressed in seconds, not minutes.
2. **Nothing static for more than ~15 s near the start, ~30 s anywhere.** Measure it: list the onsets of the melodic
   layers (`--json`, ignoring events with gain ≈ 0) and report every gap longer than 10 s.
3. **Core texture before 1:00:** pad, bass and the main melodic voice all on.
4. **Material, not just sound.** A motif every voice derives from, a chord progression with voice leading
   (`chord().voicing()` with an `anchor` does it automatically), and a development of the motif (answer, inversion,
   register, canon). Sustained tones alone are not a composition.
5. **A climax that is an event**, prepared by subtraction (an "inhale": a voice out, the filter closing) and arriving on a
   chord-cycle boundary.
6. **Semitone clashes counted** between simultaneous voices (0.5–1.5 semitones apart): report the number. Melodic voices
   that share a register with a sustained pad usually cause most of them; separate the registers.
7. Every layer sums to the piece's total cycles; no note longer than 4 cycles (superdough keeps a long note sounding after
   Strudel is stopped).

## Sources behind the compositional techniques (verify before relying on them again)

Consulted for The Field (then Morpho-Field, 2026-10-05). Each one is cited where its technique is used.

- Reverb Machine, *Music for Airports* (Eno): incommensurable loop lengths and phasing, the source of the Fibonacci canon.
  https://reverbmachine.com/blog/deconstructing-brian-eno-music-for-airports/
- Wikipedia, *Promises* (Floating Points, Pharoah Sanders, LSO): one seven-note motif that never leaves the piece while its
  textures change; a repeated four-chord progression that evolves through revoicing. https://en.wikipedia.org/wiki/Promises_(Floating_Points,_Pharoah_Sanders_and_the_London_Symphony_Orchestra_album)
- Wikipedia, *Tintinnabuli* (Pärt): the M-voice (stepwise) and the T-voice (only the tonic triad's tones). https://en.wikipedia.org/wiki/Tintinnabuli
- Steve Reich, *Music for 18 Musicians*: a cycle of chords as the form, each held for two breaths, phrases sized to the breath.
  https://stevereich.com/composition/music-for-18-musicians/
- Wikipedia, *Music for Psychedelic Therapy* (Jon Hopkins): a beatless single piece that builds slowly toward a resolution.
  https://en.wikipedia.org/wiki/Music_for_Psychedelic_Therapy
- Strudel docs, chord voicings (`chord().dict().anchor().mode().voicing()`, automatic voice leading): https://strudel.cc/understand/voicings/
- Strudel docs, signals (`sine`, `saw`, `perlin`, `rand` as continuous control): https://strudel.cc/learn/signals/

## Validate before saying it works

```
node tools/sounds/inspect.mjs media/<name>/sounds/<name>.strudel --summary --cycles <total cycles of the piece>
```

Use enough cycles to cover the whole arranged piece — the inspector's default windows (4/8/2 cycles) are
sized for short loops. Check per-section voice presence and gain trends with `--json` (group events by
section boundary) before telling the user a fade or an entrance works as intended, rather than reading
the raw event list by eye.

## Looking ahead: pairing pieces with visuals

There's a Remotion engine in `tools/visuals/` for generating video for these pieces, with each
composition's actual video code living in `tools/visuals/src/compositions/<name>/` (not under `/media` —
see the `visuals-compose` skill for why). Once a piece is finished, its audio + video keyframes get
rendered to `media/<name>/sync/` — see the `strudel-sync` skill and `docs/sync-pipeline.md` for that
pipeline; this skill only covers composing the piece itself.
