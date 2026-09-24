# Slow Drift — YouTube publish pack

Status: **draft, needs the user's decisions** (see the end) · last updated 2026-09-23
Source video: `media/slow-drift/renders/slow-drift.mp4` — 6:08 (368 s), 1920x1080 at 60 fps, H.264 / AAC,
audio mastered to -16 LUFS · Channel material: `docs/youtube-channel.md` · Rules: `youtube-publish` skill.
Chapter times are computed from the composition yaml (arc 12/24/72/48/24 cycles at 30 cpm); re-check them if
the arc or the render changes.

## Titles (character counts computed)

| # | EN | chars |
|---|---|---|
| **1 (recommended)** | Slow Drift — Ambient Meditation Music \| 432 Hz + Binaural Beats \| Fractal Visual | 80 |
| 2 | Slow Drift — Generative Ambient for Meditation & Focus (432 Hz, Binaural, Headphones) | 85 |

| # | ES | chars |
|---|---|---|
| **1 (recommended)** | Slow Drift — Música Ambiental para Meditar \| 432 Hz + Sonidos Binaurales \| Fractal | 82 |
| 2 | Slow Drift — Ambient Generativo para Meditar y Concentrarte (432 Hz, Binaural, Auriculares) | 91 |

Why: piece name first, then the phrase people search ("ambient meditation music" / "música para meditar"),
then the two facts that set it apart. The searchable phrase sits inside the roughly 60 characters mobile
shows. It states the real length only in the description (6-minute piece: never imply a longer video).

## Description — EN

```
Slow Drift is a 6-minute generative ambient piece for meditation, focus and quiet moments — tuned to A = 432 Hz, with a subtle binaural layer. Best with headphones.

A low drone rises from silence, a soft pad and sub-bass join it, a few sparse bells ring out with long echoes, and everything slowly thins back to nothing. No drums, no beat. The picture is a fractal (a Julia set) that grows with the music and lifts gently where each bell sounds.

WHAT YOU'LL HEAR
• Key: C major, tuned to A = 432 Hz (instead of the standard 440 Hz)
• Four voices — drone, sub-bass, pad and sparse bells — each built from loops of different lengths, so they keep recombining
• A quiet binaural layer around C4: a 10 Hz beat easing down to 4 Hz across the piece. It only works with headphones; on speakers it is just a slow pulse
• Everything is synthesized — no samples

CHAPTERS
0:00 Intro — a low drone rises
0:24 Development — pad and sub-bass enter
1:12 Climax — full texture, bells over the pad
3:36 Deceleration — the layers thin out
5:12 Outro — fade to silence

ABOUT THE MAKING
Written as code with Strudel, rendered to audio, and paired with a fractal visual made with Remotion. The slow, looping harmony is inspired by Brian Eno's tape-loop pieces.

This is music, not medical advice or treatment. Binaural layers work only with headphones.
deph — generative ambient music and fractal visuals. New pieces in the series: TODO(user: playlist link)
Channel: https://www.youtube.com/channel/UC1cFX0dl77im5F5V-RRi6hA

#ambientmusic #meditationmusic #432hz #binauralbeats #generativemusic #fractal
```

## Description — ES (add as a title + description translation in YouTube Studio)

```
Slow Drift es una pieza de ambient generativo de 6 minutos para meditar, concentrarte o disfrutar del silencio — afinada a A = 432 Hz, con una capa binaural sutil. Mejor con auriculares.

Un drone grave emerge del silencio, se suman un pad suave y un sub-bajo, suenan unas pocas campanas espaciadas con ecos largos, y todo se va desvaneciendo hasta la nada. Sin batería, sin pulso. La imagen es un fractal (un conjunto de Julia) que crece con la música y se levanta suavemente donde suena cada campana.

QUÉ VAS A ESCUCHAR
• Tonalidad: Do mayor, afinada a A = 432 Hz (en lugar del estándar de 440 Hz)
• Cuatro voces — drone, sub-bajo, pad y campanas espaciadas — cada una construida con bucles de distinta duración, de modo que se recombinan constantemente
• Una capa binaural tenue en torno a Do4: un pulso de 10 Hz que baja hasta 4 Hz a lo largo de la pieza. Solo funciona con auriculares; con parlantes es apenas un pulso lento
• Todo es sintetizado — sin samples

CAPÍTULOS
0:00 Intro — emerge un drone grave
0:24 Desarrollo — entran el pad y el sub-bajo
1:12 Clímax — textura completa, campanas sobre el pad
3:36 Desaceleración — las capas se aligeran
5:12 Final — se desvanece en silencio

SOBRE LA CREACIÓN
Escrita como código con Strudel, renderizada a audio y acompañada de un visual fractal hecho con Remotion. La armonía lenta y en bucle se inspira en las piezas de bucles de cinta de Brian Eno.

Esto es música, no consejo ni tratamiento médico. Las capas binaurales solo funcionan con auriculares.
deph — música ambient generativa y visuales fractales. Más piezas de la serie: TODO(user: enlace a la lista)
Canal: https://www.youtube.com/channel/UC1cFX0dl77im5F5V-RRi6hA

#ambientmusic #meditationmusic #432hz #binauralbeats #generativemusic #fractal
```

## Hashtags and tags

- **Hashtags (6):** `#ambientmusic #meditationmusic #432hz #binauralbeats #generativemusic #fractal`.
  YouTube shows up to three by the title; more than 60 would disable all of them, so six is plenty.
- **Tags (222 characters, well under the limit):** slow drift, ambient music, meditation music, 432 hz,
  432hz music, binaural beats, generative music, generative ambient, fractal visualizer, julia set fractal,
  música para meditar, música ambiental, sonidos binaurales, música generativa.
  Deliberately few and literal (YouTube says tags matter little and excessive tags are a spam violation).
  No artist names.

## Thumbnail (1280x720 JPG, all under 2 MB — files in `media/slow-drift/renders/thumbnails/`)

| File | Frame | Notes |
|---|---|---|
| **`slow-drift-thumb-250s.jpg` (recommended)** | 4:10 | Bold rose/violet swirl on cyan; reads well at small size; a large flat cyan area at the top right leaves room for text |
| `slow-drift-thumb-100s.jpg` | 1:40 | Symmetric spiral as a clear focal point; more detail, busier at small size |
| `slow-drift-thumb-300s.jpg` | 5:00 | Busy pattern, no focal point — weakest |

**Finished thumbnail (made): `slow-drift-thumbnail.jpg`** — 1280x720, 155 KB, the deph thumbnail template (see
`youtube-publish`): brand chip `deph · 01` with the ring mark, **SLOW DRIFT** in Avenir Next Bold, a cyan rule,
**432 Hz · BINAURAL**, and `HEADPHONES · GENERATIVE AMBIENT` on the 4:10 fractal frame, bottom-right corner empty for
YouTube's duration badge. Checked at 168 px wide: title and facts legible. Composition `DephThumbnailSlowDrift`
(`tools/visuals/src/brand/VideoThumbnail.tsx`); re-render:
`npx remotion still DephThumbnailSlowDrift --output=../../media/slow-drift/renders/thumbnails/slow-drift-thumbnail.jpg`.

The three candidate files above carry no text on purpose (raw frames); the finished thumbnail is the one to upload.

## Pinned comment (post right after publishing)

EN: `Headphones on for the binaural layer. Which moment of the piece stayed with you — the drone at the start, the bells in the middle, or the slow fade at the end?`
ES: `Con auriculares se nota la capa binaural. ¿Qué momento de la pieza te quedó más — el drone del comienzo, las campanas del medio o el desvanecer final?`

## Playlist / series

"deph — generative ambient". Add this video to it and link it from the description footer once it exists.

## Cards and end screen

- **Info cards** (up to 5 per video; types: video, playlist, channel, external link — the link type needs the YouTube
  Partner Program; not available on videos made for kids; verified in YouTube Help 2026-09-24): **none for now** — the
  channel has one video and a card interrupting a meditation piece distracts. Once the series playlist and more pieces
  exist: a single playlist card at the start of the outro (5:12), where the music is nearly gone.
- **End screen:** last 20 seconds (5:48-6:08): subscribe button plus the next video or the series playlist.

## Upload checklist

- [ ] Upload `media/slow-drift/renders/slow-drift.mp4` as **Private** first; let processing reach HD and check
      audio in the player (headphones for the binaural layer).
- [ ] Title (EN #1), description (EN), chapters recognized (they appear as segments on the timeline).
- [ ] Add the ES title + description as a **translation** (Studio > Subtitles / Translate metadata).
- [ ] Thumbnail: text added, exported JPG/PNG under 2 MB, 1280x720.
- [ ] Category **Music**; audience **not made for kids**; comments on; standard license.
- [ ] "Altered or synthetic content": **No** (abstract fractal and synthesized music, nothing realistic).
- [ ] Add to the series playlist; end screen in the last 20 s (5:48-6:08); pin the comment after publishing.
- [ ] Schedule or publish; then note the URL in this file and in the yaml (`domains.publish`).

## Open decisions for the user

- Playlist link and other links (`TODO(user)` items above). Language is settled: English primary, Spanish as a
  translation. Channel URL is filled in.
- Transparency line about the tools used (Strudel, Remotion, an AI assistant): included as a neutral
  "ABOUT THE MAKING" mention of Strudel and Remotion only; add or leave out any mention of AI assistance.
- Which thumbnail to use (recommended: the 4:10 one). Its text is decided (above).
- Publish date, and whether to premiere it.
- Whether the "Brian Eno" influence line stays (it is in the description body only, never title or tags).
