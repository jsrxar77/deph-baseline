# Composition workflow

How Claude and the user compose Strudel pieces together in this project. This is also written into
[`CLAUDE.md`](../CLAUDE.md) so it's loaded automatically at the start of every session — this document
is the longer version, with the reasoning behind each rule. This document covers step 2 onward, i.e. the
`strudel-compose` skill's part; scaffolding the composition folder and deciding which domains it needs is
the `deph-compose` skill's job, covered there, not repeated here.

## 1. Ask about structure before writing code

Before generating a new piece, or substantially reworking one, ask:

- **Which arc sections** does it need? The usual set is intro, development, climax, deceleration, outro,
  but a piece doesn't have to use all five, or in that order — confirm rather than assume.
- **What duration** — overall, or per section?

This was learned the hard way: the first version of "Slow Drift" was written as a single continuous
4-voice loop with no arc, because duration and structure weren't asked about up front. Reworking it into
a 6-minute arranged piece afterwards worked, but asking first would have skipped a full rewrite. (These
questions now happen once, in `deph-compose`, before the composition folder even exists — recorded here
for context, not as a second place to ask them.)

## 2. Structure sections with `arrange()`

Strudel's `arrange(...)` takes `[cycles, pattern]` pairs and concatenates them in time, each stretched to
fill its cycle count exactly:

```js
arrange(
  [24, introPattern],
  [40, developmentPattern],
)
```

**Use one `arrange()` per voice**, not one `arrange()` that pre-mixes every voice into five combined
sections. If all voices are pre-mixed per section, the piece collapses into one pattern with a single
`$:` label, and the inspector (and the VS Code extension's per-layer view) can no longer tell the voices
apart. Four voices, each arranged independently across the same section boundaries, keeps every
instrument visible as its own layer — see `media/slow-drift/sounds/slow-drift.strudel`.

### A real consequence of how `arrange()` works

Each section is independently time-indexed: a voice that persists across a section boundary (e.g. a
drone present in both "development" and "climax") restarts its own internal cycle-counter at 0 when the
new section begins, rather than continuing mid-phrase. In practice, with attack envelopes of a few
seconds, this reads as a soft re-swell at each boundary rather than a click — and it can even work in the
piece's favor: in "Slow Drift," every voice happens to attack together at the start of the climax,
because all four `arrange()` timelines reset in sync at that same cycle. Worth knowing before assuming a
sudden dynamic change at a boundary is a bug.

### Continuous fades need a non-zero floor

A section-level fade-in built from `saw.slow(N).range(0, target)` starts at literal 0. If the very first
note of that voice lands at the start of the fade, it samples gain ≈ 0 and is effectively inaudible —
not a bug, but easy to mistake for one during a quick test. Give fade-in ranges a small floor (e.g.
`range(0.06, target)`) unless true silence-to-something is actually wanted.

## 3. Pick an explicit key/scale up front

Named constants near the top of the file — usually just one (from the composition's yaml `key` field),
occasionally more if the piece genuinely needs a second scale — that every `scale()` call and chord
reference actually derives from:

```js
const ROOT = 'C';        // single quotes, not double — see the gotcha below
const KEY_SUFFIX = ':major';
const KEY = ROOT + KEY_SUFFIX;                          // "C:major", for reference/logging only
const scaleAt = (octave) => ROOT + octave + KEY_SUFFIX; // e.g. scaleAt(4) => "C4:major"
```

Changing the piece's mood should be a one- or two-line edit, never a search-and-replace across voices.
This also avoids a real mistake made while building "Slow Drift": `scale()` indexes **diatonic scale
degrees** (0=root, 1=second, 2=third...), not semitones. Writing chord tones as if they were semitone
offsets (`0 4 7 11 14`, thinking "root, third, fifth...") silently produces the wrong chord (in a 7-note
scale it lands on root and fifth only) — chord-tone stacking in diatonic degrees is `0 2 4 6 8` (root,
3rd, 5th, 7th, 9th).

**Gotcha, found while retrofitting this rule onto "Slow Drift" itself**: Strudel auto-runs every
*double*-quoted string literal in a `.strudel` file through its mini-notation parser at parse time,
whether or not it's ever used as a pattern. `"C4:major"` happens to also parse as valid mini-notation
(word + sample-index-like suffix), so a hardcoded literal like the original `.scale("C4:major")` never
tripped this. But building that same string from parts — `KEY.split(":")`, or a
`` `${root}:${quality}` `` template literal — produces a bare `":"` token in the source, which isn't
valid mini-notation and throws `[mini] parse error ... but ":" found`. Single-quoted string literals are
never run through that parser, so helper constants like `ROOT`/`KEY_SUFFIX` above must use single quotes;
the actual pattern arguments passed to `n()`, `s()`, `.scale()`, etc. stay double-quoted as elsewhere in
the file.

## 4. File layout

Each composition is a folder, `media/<name>/`, scaffolded by `deph-compose` before this skill runs.
Anything cross-cutting (this file, the sync pipeline spec) belongs in `/docs` instead — never a specific
composition's doc.

- Pieces live in `media/<name>/sounds/<name>.strudel` (e.g.
  `media/slow-drift/sounds/slow-drift.strudel`). `test.strudel` at the project root is a scratch fixture
  for the inspector, not a composition.
- Each piece gets a doc at `media/<name>/<name>.md`: its arc, duration per section, key/scale, the
  voices and what each one does, and any design decisions or issues found while building it (see
  `media/slow-drift/slow-drift.md` for the format). This lived under `docs/pieces/` originally, then flat
  under `/sounds`, then under `media/sounds/pieces/`; it now sits directly inside the composition's own
  folder now that `/media` is organized composition-first rather than by media type.
- Cross-domain facts (key, tempo, arc, which domains exist and their status) live in
  `media/<name>/<name>.deph.yaml` instead of being duplicated into this doc — see `CLAUDE.md`'s "File
  layout" section.

## 5. Validate with the inspector, not by ear

Claude cannot hear audio. After every edit, run:

```
node tools/sounds/inspect.mjs media/<name>/sounds/<name>.strudel --summary --cycles <total cycles of the piece>
```

Use enough cycles to cover the whole piece when it's built with `arrange()` — the inspector's default
windows (4/8/2 cycles) are sized for short loops, not full arranged pieces. Check per-section voice
presence and gain trends with `--json` when a fade or an entrance needs to be confirmed precisely rather
than eyeballed.
