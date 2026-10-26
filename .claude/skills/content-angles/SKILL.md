---
name: content-angles
description: Pick one creative angle before writing any hook-driven text — a Short's narration, a social post, a video description's opening line — from a catalog of 31 direct-response angles (unresolved pain, belief-break, social proof, storytime, comparison, etc.). If the request doesn't name an angle, propose 2-3 that fit, pick one, and write the hook from it. Used by deph-shorts for narrated Shorts; imported 2026-10-26 from brandforge-os's own content-angles skill, adapted for a project with no clients/briefs.
---

# content-angles

**Before writing a single line of hook text, pick one angle and say which it is.** The angle decides the
hook, the structure and the close — writing without one is how a script ends up as information dumped on
screen instead of something that earns a viewer's first three seconds (found 2026-10-25, Gnosis's first
narrated short: a fully-written draft that just described the visual, with no real hook, read as flat —
"no está dando jugo", the user's words — until it was rebuilt from `belief-break`).

The full catalog is [references/angles-catalog.md](references/angles-catalog.md): 31 angles in five
groups (classic, emotional, rational, platform-native, behavioral). Each has an `id`, what it needs to be
true to use honestly, and which format it fits best.

## When this runs

Whenever writing: a Short's narration (`deph-shorts`), a video description's opening hook, a social post
for a release. Not for the body of a `youtube-publish` description past its first lines, not for anything
that's pure fact-listing (chapters, technical specs).

## Protocol

1. **Already has an angle?** If the user named one (by id or by describing it — "quiero desafiar la idea
   de que..." = `belief-break`), confirm it in one line and go to step 4.
2. **No evidence this project doesn't have.** deph has no price, no customer count, no testimonials, no
   stock/scarcity, no competitor to contrast against — most of the catalog's commercial angles
   (`social-proof`, `price-stack`, `scarcity`, `roi`, `versus`, `risk-reversal`, `price-objection`...)
   simply don't apply here and shouldn't be forced. The angles that fit a generative-art/meditation piece
   with real but non-commercial "evidence" (the piece itself, honestly described):
   - **`belief-break`** — the strongest default. Challenge an assumption the viewer already holds about
     sound, meditation, geometry, or frequency, then reveal the reframe the piece actually demonstrates.
     The reframe must be something the piece genuinely shows, never a fabricated claim (e.g. "sound
     becomes something you can see" is literally true for a piece whose visual is built from the audio
     data — see `visuals-compose`'s `frames.json` mechanism).
   - **`uncomfortable-question`** — a question in the first 2 seconds designed to create disonance/stop
     the scroll, without needing to prove anything.
   - **`surprising-fact`** — a real, honestly-sourced fact that reframes how the viewer sees the category
     (cymatics, binaural beats, 432 Hz tuning) — never an invented statistic.
   - **`origin-story`** / **`process`** — real and usable when there's an actual story to tell (how a
     piece was composed, why a form or key was chosen) — check `deph-style`'s decision log for real
     material before claiming one.
3. **Propose 2-3, let the user pick.** One line each: the angle, why it fits this piece, and a one-line
   example hook written with THIS piece's real content, not the catalog's generic example. Mark your
   recommendation. If the user says "no sé" or "el que veas", use the recommended one — don't turn this
   into an interview.
4. **Write the hook from that angle first**, before any of the descriptive/conceptual body content. The
   hook earns the next three seconds; everything after it earns the full watch and the click to the full
   piece.
5. **Say which angle was used**, in whatever doc records the final script (e.g. `media/<name>/<name>.shorts.md`),
   so a later session doesn't have to re-derive it.

## One angle per piece

Don't mix two angles into one short or one hook — if `reel-script`/`social-copy`-style variants are
needed, they stay inside the one chosen angle, not a different angle each.
