# The Field — YouTube Shorts (reference pack)

Two Shorts, already published, found live on the channel 2026-10-26 while checking YouTube API access for
Gnosis — they were **not** made through this project's own `deph-shorts` skill/`tools/shorts/` pipeline
(that pipeline is built and tested against a trivial fixture only, never against a real composition). They
were made separately, inside **Antigravity** (a different agentic IDE, not Claude Code), working from a
copy of this project in `brandforge-os`. Searched that whole project for the source, the script, or any
shorts-specific skill: **none exists.** No HTML/CSS/GSAP source, no render script, no skill doc — Antigravity
produced the final video and uploaded it directly, with nothing left behind to reuse. This file, and the two
downloaded video files beside it, are the only record that now exists anywhere of how these were shaped.

**Correction (2026-10-26, same day):** an earlier pass of this file wrongly said these had no narration —
that was based only on the YouTube description text, never on actually looking at the video frames. They
DO have a full narrated voiceover and a complete on-screen caption system (see below) — likely the output
of a third-party short-form captioning tool (a plain red "SUBSCRIBE" pill with a generic play-triangle icon
is a common default in that category of tool, not something built in deph's own brand palette), not a
custom HyperFrames build either way. No source/template file exists for it anywhere searched.

**Use this as the reference for the next deph Short** (so the format the user already approved on the
channel — length, structure, two-language split, caption style — doesn't have to be reverse-engineered from
scratch again), not as a pipeline to re-invoke; there is no pipeline.

## The two videos

| | ES | EN |
|---|---|---|
| **Video ID** | `1ERj4BEWkvg` | `joDFMXec1Io` |
| **Watch** | https://youtu.be/1ERj4BEWkvg | https://youtu.be/joDFMXec1Io |
| **Published** | 2026-10-23 20:55:03 UTC | 2026-10-23 20:55:08 UTC (5 s later — two separate uploads, not
  one video with a translation like the main pieces) |
| **Duration** | 46 s | 46 s |
| **Resolution** | 1080x1920 (9:16) | 1080x1920 (9:16) |
| **Local copy** | `media/the-field/shorts/the-field-short-es.mp4` | `media/the-field/shorts/the-field-short-en.mp4` |

Downloaded from the live, already-public videos with `yt-dlp` (best available quality, video+audio merged)
purely as a visual/structural reference — both files are git-ignored (`media/*/shorts/*.mp4`), same as every
other rendered video in this project.

## Exact text as published

### ES (`1ERj4BEWkvg`)

**Title:**
```
The Field · ¿Y si el sonido es solo la consecuencia? | 432 Hz #Shorts #energia #universo
```

**Description:**
```
¿Y si lo que llamamos sonido es solo la consecuencia? Por debajo de lo que escuchás, frecuencias y armónicos se mueven a través del campo. Mirá medio millón de granos de cuarzo soltar su geometría y volver a la quietud.

Afinada a A = 432 Hz con una capa binaural sutil (mejor con auriculares).

Mirá la obra completa en 4K (6 min): https://youtu.be/8QGj_FvP5Xo
Playlist de la serie: https://www.youtube.com/playlist?list=PLX0Afm4O4W30

Esto es música, no consejo ni tratamiento médico.

#Shorts #ambientmusic #432hz #binauralbeats #cimatica #meditacion #thefield
```

**Tags:** 432 hz, cimatica, frecuencias, meditacion guiada, musica ambiental, musica para meditar, ondas
binaurales, relajacion, shorts, the field

### EN (`joDFMXec1Io`)

**Title:**
```
The Field · What if Sound is Only the Surface? | 432 Hz Ambient #Shorts #universe #space #science
```

**Description:**
```
What if what we call sound is only the consequence? Beneath what you hear, frequencies and harmonics move through the field. Watch half a million grains of quartz release their geometry and fall back into stillness.

Tuned to A = 432 Hz with a gentle binaural layer (best with headphones).

Watch the full 6-minute 4K piece: https://youtu.be/8QGj_FvP5Xo
Series playlist: https://www.youtube.com/playlist?list=PLX0Afm4O4W30

This is music, not medical advice or treatment.

#Shorts #ambientmusic #432hz #binauralbeats #cymatics #thefield
```

**Tags:** 432 hz, ambient music, binaural beats, chladni, cymatics, frequency, generative art, meditation
music, shorts, sound design, the field

## On-screen caption system (found 2026-10-26 by actually extracting frames, not just reading the description)

Three card types, consistent across both languages:

1. **Opening card** (first ~2-3s): a small label above the title (the piece name — "THE FIELD" / "EL
   CAMPO"), the hook question in bold white as the main title, a lighter subtitle line below. Rounded dark
   semi-transparent rectangle, centered, over the moving background.
2. **Caption cards** (synced to the narration, one short phrase at a time): same rounded dark card style,
   bold white text, with exactly one word per card highlighted in a purple/pink accent color — karaoke-style,
   timed to when that word is actually spoken.
3. **Closing/CTA card** (near the end): same structure as the opening card — a small label ("EXPERIENCE THE
   FIELD"), a bold title ("FULL 6-MINUTE PIECE ON CHANNEL"), a subtitle restating the subscribe ask tied to
   the piece ("And if this resonates with you, subscribe to explore the field.").
4. **A persistent "SUBSCRIBE"/"SUSCRIBIRSE" pill button**, top-left, red background, white text, a small
   play-triangle icon — present in every frame checked, both languages, never covering the center content.

No source for this (HTML, template, tool config) was found anywhere — see the correction above.

## What to copy for the next piece's Short(s)

Observed pattern, worth keeping even without a reusable script:
- **46 seconds**, well inside the Shorts window (under 60s, before YouTube's longer-Shorts allowance).
- **One clip, two separate uploads** (ES and EN as two distinct videos, each with its own `#Shorts` title and
  localized tags) — not a translation on one video, unlike the long-form pieces. Decide per-piece whether to
  keep doing it this way or switch to the single-video-with-localization pattern once there's a real pipeline
  to drive it either way.
- **Title pattern:** `<Piece> · <hook question, native to the language> | 432 Hz [Ambient] #Shorts <2-3 topic
  hashtags>` — a question, not a statement, as the hook.
- **Description pattern:** the hook restated as 2-3 sentences, the tuning fact, a link to the full piece and
  the series playlist, the standing medical-disclaimer line, then `#Shorts` + the channel's core hashtags.
  Same footer/disclaimer discipline as the long-form pack (`youtube-publish` skill), just shorter.
- Both reuse the full piece's **own fractal visual and master audio** — a cut/highlight, not a new rendering
  system (consistent with the already-written `deph-shorts` skill's own stated purpose, even though the
  mechanism that built these two wasn't it).

## Open question for the user

Whether to invest in actually finishing `tools/shorts/` + `deph-shorts` against a real composition (so the
next Short is built and versioned inside this project, the way everything else is), or keep making Shorts
ad hoc and only documenting the result here afterward, as with these two.
