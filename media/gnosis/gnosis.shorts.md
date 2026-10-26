# Gnosis — YouTube Short (in progress)

Status: **script final, EN + ES audio generated** · last updated 2026-10-26

First deph Short with a narrated voiceover (The Field's two Shorts had none — see
`media/the-field/the-field.shorts.md`). Built with `tools/narration/elevenlabs.mjs`; voice options in
`tools/narration/voices.md`.

## Plan (approved by the user, not yet executed past the script + EN narration)

1. 1080x1920 vertical clip, ~46s, cropped from `media/gnosis/renders/gnosis-fixed.mp4` around the gold
   integration (about 8:20-9:10 — the strongest visual moment, same criterion as the thumbnail).
2. Narration in EN and ES (scripts below), generated with ElevenLabs, mixed under/over the piece's own
   music (ducked while narrating, up in the gaps between lines) — never replacing the music entirely.
3. Two separate uploads (ES, EN), matching The Field's pattern, each with its own localized title/tags.
4. User reviews the finished short before anything is uploaded (same rule as the main video).

## Script constraints (every one the user gave, kept here so none gets dropped again — the user had to
repeat "no cites los cinco sólidos" twice in one session because this list didn't exist yet: "PASA QUE NO
TOMAS NOTAS DE LO QUE SE TE DICE". Check every future draft against ALL of these before presenting it.)

1. No gendered pronouns ("she/he") — use "one / the other" instead.
2. No "gold, never white" — internal project jargon a new viewer can't parse.
3. **Never name the five Platonic solids explicitly** (no "tetrahedron, cube, octahedron..." list) — keep
   the caged-in-a-changing-shape idea general/poetic, not a technical list.
4. Must open with a real hook from a named `content-angles` angle, not description/information.
5. Must carry a real technical anchor, but NOT the solid names — 432 Hz and "every note moves this image
   in real time" are the two currently used.
6. No em dashes ("--") — unnatural when read aloud.
7. Must close with a subscribe CTA tied to the emotional payoff, not a bare command.
8. EN and ES must say the same thing, line for line — no drift between languages.
9. Must not be generic/reusable for another piece (reject anything that reads like a cymatics-documentary
   voiceover that could just as well describe The Field).
10. **No "voice" as the central metaphor** — too restrictive, ties it literally to the vocal layer. Use
    "energy" instead.
11. **The closing payoff line must describe something concrete and visible on screen**, not an abstract
    metaphor the viewer can't picture — "they become the same light" drew a direct "what would that even
    be?" from the user. "They meet; everything becomes one single shape, glowing" is concrete: it's
    literally what the chosen clip shows (two clouds merging into one glowing form).
12. **Use "integrate/integrarse" explicitly** — it's the piece's real central word (not internal jargon
    like "gold, never white"; any viewer understands it), and two euphemisms in a row ("the one it can
    finally rest in", "they become the same light" / "they meet") danced around it instead of just saying
    it. Caught by the user: "te olvidaste de una palabra clave en toda la obra... integrarse".

## Script (closed 2026-10-26, after several revisions — see the conversation for the discarded drafts:
versions with "she/he" pronouns, with "gold, never white" as the closing line, with "five ancient
geometries", a first fully-written draft that opened by just describing the visual instead of hooking
— "no está dando jugo", the user's words — and a `belief-break` draft about "vibration becoming points"
that the user correctly rejected as generic enough to be any of the pieces, The Field included, with
nothing specific to Gnosis in it)

**Angle: `uncomfortable-question`** (`content-angles` skill, `references/angles-catalog.md`) — not
`belief-break` (that's the discarded draft above). A hypothetical question built to create disonance in
the first two seconds, needing no evidence at all — written from Gnosis's own actual drama (free vs.
caged in a changing form) instead of generic science-documentary imagery, so it can't be mistaken for a
hook that would work for any other piece.

**Final, written by the user directly (ES original; EN translated to match, not re-derived) — ES:**
> ¿Y si ser libre y estar atrapado fueran solo dos caras de la misma energía?
> Una es flujo perpetuo: indomable, sin contornos que la detengan.
> La otra es forma contenida: reconstruyéndose una y otra vez en el intento de integrarse.
> El sonido guía a la forma. Cada pulso a 432 Hz transforma esta imagen en tiempo real.
> Y, por un instante, el conflicto desaparece. ¿Acaso todo converge en una única luz?
> Terminá de crear esta experiencia en tu mente. Si te movió algo, dejá tu comentario y suscribite para más
> piezas como esta.

**EN:**
> What if being free and being trapped were just two faces of the same energy?
> One is perpetual flow: untamed, with no edges to hold it back.
> The other is contained form: rebuilding itself again and again, trying to integrate.
> Sound guides the shape. Every pulse at 432 Hz transforms this image in real time.
> And, for one instant, the conflict disappears. Does everything converge into a single light?
> Finish creating this experience in your mind. If this moved something in you, leave a comment and
> subscribe for more pieces like this.

Why this shape: the user's own final pass — tighter, more literary register ("flujo perpetuo", "forma
contenida"), closes on an open question instead of a flat statement (lets the viewer finish the thought —
"terminá de crear esta experiencia en tu mente"), and the CTA now asks for a comment too, not just a
subscribe.

## Open, blocking the next step

- Both narrations done, matching the user's final script:
  - EN: George (`JBFqnCBsd6RMkjVDRZzb`), `eleven_v4` — `media/gnosis/shorts/gnosis-short-narration-en.mp3` (39.76s)
  - ES: Lionel (`MjtZn5tagxL1RO6w9ER5`), `eleven_v4`, generated manually by the user (Lionel is a paid
    library voice, blocked on the free API tier; see `tools/narration/voices.md`) —
    `media/gnosis/shorts/gnosis-short-narration-es.mp3` (35.71s)
- Next: cut the 1080x1920 clip from `gnosis-fixed.mp4` around the gold integration, mix each narration
  under/over the piece's own music, then show the user both finished shorts before anything uploads.
- Whether The Field's two Shorts actually had narration (the user believed so; nothing found supports
  it — see `the-field.shorts.md`). Doesn't block Gnosis's own short, just an open question.
