# Gnosis — YouTube Short (in progress)

Status: **script closed, voice EN generated** · last updated 2026-10-26

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

**EN:**
> What if being free and being trapped were just two notes of the same song?
> One is pure light, with nothing to hold it down.
> The other is caged, inside a form that moves through five exact geometries, always changing, still
> looking for the one that finally fits.
> Tuned to 432 Hz, their voices rise together, until, just for a moment, they become the same light.
> If this moved something in you, subscribe. There's more waiting for you.

**ES:**
> ¿Y si ser libre y estar atrapado fueran solo dos notas de la misma canción?
> Una es pura luz, sin nada que la retenga.
> La otra está encerrada, dentro de una forma que atraviesa cinco geometrías exactas, cambiando sin parar,
> todavía buscando la que por fin le quede.
> Afinada a 432 Hz, sus voces se elevan juntas, hasta que, por un instante, se vuelven la misma luz.
> Si esto te movió algo, suscribite. Hay más piezas como esta esperándote.

Why this shape: the hook is Gnosis's actual dramatic premise (one free, one caged in a changing form), not
reusable generic imagery; no em dashes (read as unnatural spoken aloud — replaced with commas/periods
throughout); keeps two technical anchors, not one — "five exact geometries" (the Platonic solids, named
naturally, not as a dry list) and 432 Hz; "become the same light" is the integration payoff without the
"gold, never white" internal jargon a new viewer can't parse; closes with a subscribe CTA tied to the
emotional payoff, not a bare command.

## Open, blocking the next step

- **Spanish narration**: text above, voice Lionel (`MjtZn5tagxL1RO6w9ER5`), model `eleven_v4` — the user
  is generating this manually (Lionel is a paid library voice, blocked on the free API tier; see
  `tools/narration/voices.md`). Save the result to `media/gnosis/shorts/gnosis-short-narration-es.mp3`.
- **English narration**: done, with George (`JBFqnCBsd6RMkjVDRZzb`), `eleven_v4`, matching this final
  script — `media/gnosis/shorts/gnosis-short-narration-en.mp3`.
- Whether The Field's two Shorts actually had narration (the user believed so; nothing found supports
  it — see `the-field.shorts.md`). Doesn't block Gnosis's own short, just an open question.
