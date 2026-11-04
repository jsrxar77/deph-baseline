# Musica Universalis — YouTube Short (uploaded, Private)

Status: **uploaded (ES/EN), Private** · 2026-11-04

Narrated Short, same reusable pipeline as Slow Drift's and Gnosis's (`deph-shorts` skill). First Short to
use a per-piece karaoke highlight color (`--highlight-color`, added to `build-short-hyperframes.mjs` for
this piece) instead of the shared purple — cyan `#1AD9DB`, pulled directly from this piece's own shader
(`TURQ` in `visuals/shader.ts`), so the Short still reads as Musica Universalis rather than a reskin of
Gnosis/Slow Drift. Chrome (cards, badges, subscribe pill, cover layout) stays Gnosis's exact positions —
only the word-glow color is piece-specific.

## Decisions made with the user (2026-11-03/04)

1. **Register, explicitly different from Slow Drift/Gnosis**: not a hook that explains a mechanism —
   something that goes to "the last frequency of your cosmology questioning," internal and metaphysical,
   not a fun-fact reveal.
2. **Angle, chosen from three proposed**: the pure existential question, with no mechanism named (the
   Shepard tone in the piece's "flight" section is present in the clip but never explained as a trick —
   it's felt, not described).
3. **Sparser pacing than Slow Drift/Gnosis** — fewer words, more room between lines, letting the music and
   the visual breathe (the narration itself runs ~31-32s inside the 46s window, more trailing silence
   before the closing CTA than any earlier Short).

## Moment

**2:10–2:56 (130s–176s)**: the climax sliding into the "flight" section — where the piece's harmony lifts
without the listener choosing it. Visually the richest point for the beings-of-light visual (most lights
on screen, orbits precessing).

## Script (closed 2026-11-03)

**ES:**
> ¿Cuándo fue la última vez que tu idea del orden de las cosas tuvo que afinarse contra algo más grande
> que vos? Esta pieza no ilustra una idea. La construye: el cosmos como una sola composición, afinada en
> cuartas y quintas, a 432 Hz, la frecuencia que eligió escuchar. Las luces que ves giran en órbitas que
> también giran. Nada vuelve exactamente al mismo lugar. Vos tampoco, mientras escuchás esto. Si algo se
> movió de lugar, quedate con la obra completa. Suscribite para las próximas piezas.

**EN:**
> How long has it been since your idea of the order of things had to tune itself against something larger
> than you? This piece doesn't illustrate an idea. It builds one: the cosmos as a single composition,
> tuned in fourths and fifths, at 432 Hz, the frequency it chose to listen at. The lights you're watching
> turn on orbits that turn. Nothing returns to exactly the same place. Neither do you, while you listen to
> this. If something shifted, stay for the full piece. Subscribe for what comes next.

One technical anchor kept (432 Hz, fourths/fifths) as texture, never explained as a mechanism. Closing
payoff ties directly to what's visible on screen (the precessing orbits), same lesson learned on Gnosis
and Slow Drift. Config: `media/musica-universalis/shorts/musica-universalis-short.json`.

## A real finding: the main piece's own render assets were silent again

Same bug as Slow Drift (2026-11-03): `tools/visuals/public/musica-universalis-{audio,youtube}.wav` were
both completely silent (-91 dB throughout). Regenerated from the Strudel source
(`tools/sounds/render.mjs --tail 8`, ~13.5 minutes — this piece has 1843 events across 7 voices, much
denser than Slow Drift) and remastered both the -16 LUFS (`sync/audio-master.wav`) and -14 LUFS YouTube
copy (`sync/audio-youtube.wav`). **Always spot-check a "rendered" audio file's actual level before
building anything on it** — confirmed twice now, not a one-off.

## Background video: downloaded from YouTube, and only the needed window was rendered locally

The main piece turned out to already be published (`https://youtu.be/OalleY7mVl4`) — `musica-universalis.yaml`
and `.youtube.md` were stale saying "ready, not uploaded" (same staleness pattern as Slow Drift). Before
finding that, a **partial** local Remotion render was used instead of the full 6:08 — `--frames=7800-10560`
(exactly the 46s window needed, 2761 of 22080 frames) rather than rendering six minutes to use 46 seconds
of it. Once the YouTube video was found, the partial render was killed and the published video was
downloaded instead (`yt-dlp`, 3840x2160 — this piece's YouTube upload is real 4K, unlike Slow Drift's
1080p-only), cropped the same way.

## Narration

EN generated via the API (voice: George). **ES still blocked by the ElevenLabs account's plan** (library
voices need a paid plan via API — same issue as Slow Drift, not yet resolved on the account side); the
user generated it by hand again (voice: Lionel — Natural and Versatile Narrator) and dropped it in
Downloads.

## Uploaded (Private) — 2026-11-04

| | ES | EN |
|---|---|---|
| **Video ID** | `dNYkjayHq8A` | `5zapRRFaOBg` |
| **Watch** | https://youtube.com/shorts/dNYkjayHq8A | https://youtube.com/shorts/5zapRRFaOBg |
| **Studio** | https://studio.youtube.com/video/dNYkjayHq8A/edit | https://studio.youtube.com/video/5zapRRFaOBg/edit |

### ES
- **Título**: `Musica Universalis · ¿Cuándo tu orden tuvo que afinarse? | 432 Hz #Shorts #cosmologia` (85 chars)
- **Tags**: `432 hz, ambient music, cosmologia, meditacion guiada, musica ambiental, musica para meditar, musica universalis, ondas binaurales, relajacion, shorts`
- **Comentario fijado (publicar y fijar a mano)**: `Con auriculares a 432 Hz. Mirá la pieza completa de 6 minutos en 4K acá: https://youtu.be/OalleY7mVl4`

### EN
- **Title**: `Musica Universalis · When Did Your Order Have to Tune Itself? | 432 Hz #Shorts #cosmology` (89 chars)
- **Tags**: `432 hz, ambient music, binaural beats, cosmology, generative art, meditation music, musica universalis, pythagorean, shorts, sound design`
- **Pinned comment (post and pin by hand)**: `Headphones on at 432 Hz. Watch the full 6-minute piece in 4K here: https://youtu.be/OalleY7mVl4`

## Checklist for the user before going Public
1. Upload each video's custom thumbnail in Studio —
   `media/musica-universalis/shorts/thumbnails/musica-universalis-short-cover-{es,en}.jpg`.
2. Post and pin the pinned comment on each.
3. Add both to the channel's series playlist.
4. Review, then switch Private → Public.
