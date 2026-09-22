---
name: deph-compose
description: Use when starting any new deph composition (a piece that may have a sound side, a visual side, or both), or substantially reworking one's overall structure — covers deciding which domains it needs, asking arc/duration/key up front, and scaffolding the media/<name>/ folder with its .deph.yaml manifest and doc before handing off to strudel-compose, visuals-compose, or strudel-sync for the actual domain work.
---

# Starting a deph composition

deph's root unit is the **composition**, not "a sound" or "a visual" — every piece, even one that's
audio-only today, gets a `media/<name>/` folder with a yaml manifest tying its domains together. This
skill is the entry point: it never writes `.strudel` or Remotion code itself, only the scaffold that the
domain skills then fill in.

## Before creating anything

Ask the user:

1. **Which domains does this composition need** — sound only, visual only, or both? Don't default to
   both just because the project eventually supports video, and don't skip asking because most pieces so
   far have been sound-only.
2. **Which arc sections** — intro, development, climax, deceleration, outro. Not necessarily all five,
   not necessarily in that order. Don't default silently.
3. **Duration** — overall, or per section.
4. Confirm or pick a **key/scale** (e.g. "C major", "C dorian") — this seeds the yaml and drives every
   `scale()` call the sound domain will use, whether or not video is part of this composition.
5. **A name** for the composition (kebab-case, becomes the folder name and filename stem — e.g.
   `slow-drift`).

## Scaffold

Create, in this order:

```
media/<name>/
  <name>.deph.yaml
  <name>.md            (a short stub — the domain skill that does the real work fills this in)
  sounds/
  visuals/
  sync/
```

Always create all three subfolders together, even if only one domain was requested — an audio-only piece
today may get a visual later, and `strudel-sync` expects `sync/` to already exist rather than creating
top-level structure itself (it only writes files, not folders). `visuals/` is created too for
consistency, but stays empty in practice — see the `visuals-compose` skill for where the actual Remotion
code goes instead (`tools/visuals/src/compositions/<name>/`, not here; found by testing, not planned).

The yaml — see `media/slow-drift/slow-drift.deph.yaml` for a filled-in example:

```yaml
name: <name>
title: <Human Readable Title>
created: <today's date>
key: <key from step 4>
tempo:
  cpm: null # filled in once the sound domain sets setcpm() — leave null, don't guess
arc:
  - { name: intro, cycles: null } # cycle counts filled in once the sound domain is written;
  - { name: development, cycles: null } # leave null rather than guessing a number here
  # ...one entry per section from step 2
total_cycles: null
domains:
  sound:
    status: planned # or "not-requested" if the user said visual-only
    file: sounds/<name>.strudel
  visual:
    status: planned # or "not-requested" if the user said sound-only
    entry: tools/visuals/src/compositions/<name>/ # not visuals/ — see the visuals-compose skill for why
  sync:
    status: not-built
    output: sync/
doc: <name>.md
```

Leave numeric fields (`tempo.cpm`, each section's `cycles`, `total_cycles`) as `null` here — they get
filled in by `strudel-compose` once the actual piece exists with a real `setcpm()` and `arrange()` call.
This skill fixes the *decisions* (key, arc section names, domains needed); it doesn't fabricate numbers
that belong to the sound domain's implementation.

## Hand off

- Sound domain requested → invoke `strudel-compose` to write `sounds/<name>.strudel` and `<name>.md`.
- Visual domain requested → invoke `visuals-compose` to build the actual Remotion composition.
- Once the sound domain is `done` and real audio is wanted for the visual → invoke `strudel-sync` to
  render the bridge into `sync/` (this can happen before the visual domain is `done` — `visuals-compose`
  needs a real `audio.wav` to wire in, not a finished video, in order to start).

**Every domain skill reconciles the whole yaml before finishing, not just its own `domains.<domain>.status`
entry.** Writing the actual sound or visual content is what discovers the real numbers this skill left as
`null` (`tempo.cpm`, each `arc[].cycles`, `total_cycles`) — the skill that does that work is responsible
for filling them in and for double-checking `key` still matches what it actually built, not just for
flipping its own status flag. A composition's yaml is the single cross-domain source of truth *because*
every skill that touches it keeps all of it current, not because each skill owns one isolated field. This
skill itself only ever sets statuses to `planned`/`not-requested` at scaffold time, never `done` — it
fixes the decisions, the domain skills fix the resulting facts.

## File layout

See `CLAUDE.md`'s "File layout" section for the full project-wide rule this skill implements.
