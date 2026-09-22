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
`media/<name>/<name>.deph.yaml` for those values rather than asking again. If no composition folder
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
flipping `domains.sound.status` to `done`. Re-read `media/<name>/<name>.deph.yaml` and check every field
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
