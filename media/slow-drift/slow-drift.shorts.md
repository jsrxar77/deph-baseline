# Slow Drift — YouTube Short (in progress)

Status: **audio pipeline done (both languages), waiting on the full 4K render to crop the background** ·
2026-11-03

Narrated Short, same proven pipeline as Gnosis's (`media/gnosis/gnosis.shorts.md`), now fully generalized —
see the `deph-shorts` skill's "The full narrated-Short pipeline" section and `tools/shorts/` (the four
generalized scripts: `build-short-hyperframes.mjs`, `mix-short-audio.mjs`, `transcribe.py`,
`master-short-audio.py`).

## A real bug found and fixed along the way (2026-11-03)

`tools/visuals/public/slow-drift-{audio,master}.wav` — the exact files the main Remotion composition reads
— were **completely silent** (confirmed with `ffmpeg -af volumedetect`, -91 dB across the whole file, not
just a quiet passage). This wasn't visible from file size or duration (both looked normal, 368s). The main
4K render had been running ~50% of the way through on this silent file when found; killed it, regenerated
real audio from the Strudel source (`tools/sounds/render.mjs` --tail 8 → `master.mjs` → `frames.mjs`),
copied the real files into `sync/` and `tools/visuals/public/`, and restarted the render. **Always spot-check
a "rendered" audio file's actual level before building anything on top of it** — a file existing, with a
plausible duration, is not evidence it has real content.

## Progress

- Both narrations generated (`tools/narration/elevenlabs.mjs`): EN with the recommended voice (George);
  **ES could not be generated via the API** — the ElevenLabs account's current plan blocks API access to
  "library" voices, and every Spanish voice in the catalog (Melody, Carlos Pro, etc.) is one (checked by
  listing all 32 voices — every `language:en` entry is `premade`, every `language:es` one is
  `professional`). The user generated the ES narration by hand in the ElevenLabs web UI instead (voice:
  Lionel — Natural and Versatile Narrator) and dropped it in `~/Downloads`; moved into the project at
  `media/slow-drift/shorts/slow-drift-short-narration-es.mp3`.
- Both narrations transcribed for karaoke timing (`transcribe.py`, in a dedicated venv —
  `tools/shorts/.venv/`, see the `deph-shorts` skill for why the system Python couldn't build
  `faster-whisper`). Word counts match the script exactly: 108 (ES), 106 (EN).
- Both audio mixes built with the new `mix-short-audio.mjs` (crop the 71-117s climax window from the real
  `audio-master.wav`, duck the narration in with ffmpeg `sidechaincompress`) and mastered to -14 LUFS /
  -1.0 dBTP (`master-short-audio.py`): ES measured -14.2 LUFS / -1.6 dBTP, EN -14.2 LUFS / -1.7 dBTP.
- HyperFrames compositions built (`build-short-hyperframes.mjs --all`) — `hyperframes-es/index.html` and
  `hyperframes-en/index.html` exist with the karaoke captions auto-grouped from the Whisper timings and the
  mastered `audio.mp3` already in place. Still pointing at a dangling `bg.mp4` symlink until the crop below
  happens.
- Background video: downloaded the already-**published** main piece from YouTube (`yt-dlp`, 1080p — the
  best available there, not a re-render) instead of waiting on a local Remotion render (which was running
  on silent audio anyway — see the bug above — and was killed once the download made it unnecessary).
  Cropped to `slow-drift-short-bg.mp4` (71-117s, 1080x1920).
- Audio duck corrected twice more after the bug fix above: first pass (sidechaincompress) was never
  actually inaudible-proof — relative-to-music ducking isn't deep enough against a loud passage. Replaced
  with a fixed-gain duck over the narration's real Whisper-timed window (deterministic, not level-triggered).
  Then corrected again per the user: the music is not accompaniment, it's part of the piece — duck relaxed
  from -23dB to -9dB so the music stays present. Verified with envelope correlation (mix vs. original voice
  during speech): 0.987-0.998.
- Covers generated (`tools/shorts/generate-short-covers.mjs`, built 2026-11-03, see the `deph-shorts` skill's
  "Short Covers & Thumbnails Standard"): `media/slow-drift/shorts/thumbnails/slow-drift-short-cover-es.jpg`
  and `-en.jpg`, matching Gnosis's actual cover layout exactly (not the skill's older coordinate table,
  which never matched what Gnosis really shipped) — no subscribe button, title + "FRACTAL · 432 HZ" badge.
- Rendered: `slow-drift-short-es.mp4` (167.2 MB) and `slow-drift-short-en.mp4` (169.2 MB), both verified
  (1080x1920, 46.0s, audio present, opening/captions/closing checked on real frames).

## YouTube Publish Data for Shorts (drafted, waiting on the user's go-ahead to actually upload)

Two separate Private uploads via `tools/youtube/upload-short.py` (same pattern as Gnosis and The Field),
category 10 (Music), thumbnails uploaded by the user manually in Studio (not via the API this time).

### ES
- **Título**: `Slow Drift · ¿Hace cuánto no mirás algo que no se repite? | 432 Hz #Shorts #fractal` (83 chars)
- **Descripción**: `/tmp/slow-drift-short-desc-es.txt`
- **Tags**: `432 hz, ambient music, fractal, meditacion guiada, musica ambiental, musica para meditar, ondas binaurales, relajacion, shorts, slow drift`
- **Comentario fijado (publicar y fijar a mano en Studio)**: `Con auriculares a 432 Hz. Mirá la pieza completa de 6 minutos en 4K acá: https://youtu.be/QpT1q2BYEf0`

### EN
- **Title**: `Slow Drift · How Long Since Something Never Repeated? | 432 Hz #Shorts #fractal #ambient` (88 chars)
- **Description**: `/tmp/slow-drift-short-desc-en.txt`
- **Tags**: `432 hz, ambient music, binaural beats, fractal, generative art, julia set, meditation music, shorts, slow drift, sound design`
- **Pinned comment (post and pin by hand in Studio)**: `Headphones on at 432 Hz. Watch the full 6-minute piece in 4K here: https://youtu.be/QpT1q2BYEf0`

## Uploaded (Private) — 2026-11-03

The channel's OAuth token had expired (`invalid_grant`); re-authorized via `tools/youtube/authorize.py`
(the browser didn't auto-open from a backgrounded process — ran it unbuffered, `-u`, and handed the user
the printed auth URL directly; new token confirmed against channel "Deph Ambient").

| | ES | EN |
|---|---|---|
| **Video ID** | `P7aB8OPIbJk` | `i0awReAcxB8` |
| **Watch** | https://youtube.com/shorts/P7aB8OPIbJk | https://youtube.com/shorts/i0awReAcxB8 |
| **Studio** | https://studio.youtube.com/video/P7aB8OPIbJk/edit | https://studio.youtube.com/video/i0awReAcxB8/edit |
| **Status** | Private | Private |

## Checklist for the user before going Public
1. Upload each video's custom thumbnail in Studio (the user's own step this time, not via the API) —
   `media/slow-drift/shorts/thumbnails/slow-drift-short-cover-{es,en}.jpg`.
2. Post and pin the pinned comment on each (text above).
3. Add both to the channel's series playlist (no API endpoint for this).
4. Review playback or language/metadata, then switch Private → Public.

## Decisions made with the user (2026-11-03)

1. **Narrated** (ElevenLabs voice + HyperFrames), not music/caption-only — same format as Gnosis.
2. **Angle: `uncomfortable-question`** (`content-angles` skill) — a question in the first 2 seconds built
   on Slow Drift's own real, specific mechanism (nothing in the piece ever repeats — not the four
   coprime-length voice loops, not the continuously drifting Julia-set camera), not a generic
   cymatics/meditation hook reusable for Gnosis or The Field.
3. The main video was already published — https://youtu.be/QpT1q2BYEf0 — before this session; the yaml
   and `slow-drift.youtube.md` were stale saying "draft, no video ID" and have been corrected.

## Moment

**Climax arrival: 71s–117s of the full piece** (46s window). Climax starts at exactly t=72s (cycle 36,
`12+24` cycles in at 2s/cycle) — the point where all four voices attack together (a side effect of every
`arrange()` timeline resetting in sync at the same boundary, see `slow-drift.md`'s "Section boundaries
re-trigger persisting voices") and the fractal expands to its richest filament detail. Verified against
`sync/frames.json`: the first four climax bell hits land at 78.5s / 85s / 91.5s / 98s — i.e. local
7.5s / 14s / 20.5s / 27s inside the 46s window, giving the narration natural beats to land the "every bell
lifts exactly the point where it rang" line against an actual visible bell pulse. Crop source:
`media/slow-drift/renders/slow-drift.mp4` (once it exists in this environment — see Prerequisites).

## Script (closed 2026-11-03)

Written directly from this piece's own real, verified facts (`slow-drift.md`): loop lengths 17/19/23/13
cycles share no common factor; the Julia constant drifts continuously, never resetting, confirmed not to
shatter into disconnected "dust" across the piece; bell pulses are driven by exact per-event frame data
(`frames.json`), not generic audio reactivity; A=432 Hz tuning and the 10→4 Hz alpha-to-theta binaural
descent are both numerically verified on the rendered audio. No internal jargon, no claim not already
confirmed in the piece's own doc.

**ES:**
> ¿Hace cuánto no mirás algo que no se repite ni una sola vez?
> Esta figura es un fractal real, no una animación en loop. Cuatro sonidos giran en ciclos que nunca
> coinciden, y la forma sigue desviándose, cuadro a cuadro, durante seis minutos.
> Cada campana que escuchás levanta exactamente el punto donde sonó, en el instante en que sonó.
> Afinada a 432 Hz, con una capa binaural que baja de alfa a theta mientras la pieza avanza.
> La forma exacta que ves en este segundo no vuelve a aparecer en los próximos seis minutos.
> Si eso te detuvo un segundo, mirá la pieza completa y suscribite para más.

**EN:**
> How long since you watched something that never repeats, not even once?
> This shape is a real fractal, not a looping animation. Four sounds spin in cycles that never align, and
> the shape keeps drifting, frame by frame, for six minutes straight.
> Every bell you hear lifts exactly the point where it rang, at the instant it rang.
> Tuned to 432 Hz, with a binaural layer easing from alpha to theta as the piece unfolds.
> The exact shape you're seeing right now will not appear again in the next six minutes.
> If that stopped you for a second, watch the full piece, and subscribe for more.

Saved as the build input: `media/slow-drift/shorts/slow-drift-short.json` (schema in the `deph-shorts`
skill) — also carries the opening/closing card text and subscribe labels.

## Prerequisites missing in this environment (checked 2026-11-03)

- `media/slow-drift/renders/slow-drift.mp4` — not present (only `renders/thumbnails/` is). Needed to crop
  the 71-117s background window.
- `media/slow-drift/sync/audio.wav` / `audio-master.wav` — not present either (git-ignored, so may exist
  on another machine). Not required for the Short itself (the narration gets mixed against a fresh ffmpeg
  extract of the full render's own audio for this window), but worth regenerating if they're gone for good
  (`tools/sounds/render.mjs` + `master.mjs`, both deterministic from `sounds/slow-drift.strudel`).

## Remaining steps (in order — see `deph-shorts` skill for the general version of each)

Done already (2026-11-03): narration (EN via API, ES by hand — see "Progress" above), transcription, audio
mix + mastering, HyperFrames composition build. What's left:

1. Crop the background clip once the re-render of `slow-drift.mp4` finishes:
   `ffmpeg -i media/slow-drift/renders/slow-drift.mp4 -ss 71 -t 46 media/slow-drift/shorts/slow-drift-short-bg.mp4`
   — resolves the dangling `bg.mp4` symlink already sitting in both `hyperframes-<lang>/` folders.
2. **Render — consumes HyperFrames credits, confirmed with the user already:**
   `npx hyperframes render media/slow-drift/shorts/hyperframes-es/ --fps 30 --quality delivery --output media/slow-drift/shorts/slow-drift-short-es.mp4`
   (same for `en`).
3. Covers: `node tools/shorts/generate-hyperframes-covers.mjs` adapted per the `shorts-cover` skill spec.
4. Verify (per `deph-shorts`): capture 2-3 frames, check safe zone, resolution exactly 1080x1920, no audio
   drift at the cut points. User reviews before anything uploads, same rule as the main video.
5. Upload both as **Private** first (two separate videos, ES/EN, matching The Field's and Gnosis's
   pattern) via `youtube-upload`, with a YouTube pack (title/description/tags/pinned comment) written the
   same way as Gnosis's (`gnosis.shorts.md`'s "YouTube Publish Data for Shorts" section is the template).
