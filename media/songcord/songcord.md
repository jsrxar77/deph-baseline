# Songcord

Audio-first composition, a **showcase / client piece** (not a deph channel release): the music already exists (supplied by the user as an mp3; per the user it belongs to their client, who created it) and was **not** made with
Strudel, so `sounds/` stays empty and `domains.sound.status` is `not-requested`. The work here is the visual
side, derived from what the audio actually does.

Steps (each waits for the user's OK before the next):

1. The user places the mp3 at `sync/source.mp3`.
2. Convert to `sync/audio.wav`, master to `sync/audio-master.wav` (`tools/sounds/master.mjs`).
3. Analyze the audio (energy, brightness, onsets, sections, pitch/key estimate, stereo) into
   `sync/analysis.json` — a substitute for the `frames.json` Strudel would have produced.
4. Present an audio map and several visual directions; the user picks.
5. Build the Remotion composition (`visuals-compose`), then the YouTube pack (`youtube-publish`).

Arc, key and duration are filled in from the analysis, not guessed.

## Audio analysis (2026-09-26)

Source: `sync/source.mp3`, 3:16 (196.5 s), 44.1 kHz stereo 256 kbps, no artist/title tags. Converted to 48 kHz wav.
Loudness of the raw file: **-8.0 LUFS**, true peak -0.1 dBFS, LRA 11.9 LU (a loud, dense master; the video plays a
copy lowered to -16 LUFS, true peak -8.1 dBFS; see `audio-master.wav`, no compression applied).
Measured by `tools/sounds/analyze-audio.mjs` (`sync/analysis.json`). Everything below is a measurement or a
statistical estimate, not listening:

- Key estimate: **A minor** (r=0.85; A major 0.71, D major 0.50). Sections lean on A, E, F, G — consistent with a
  minor-key progression, but that is a guess.
- Tempo guess: the strongest pulse candidates are 166.5 bpm (equivalently ~83 bpm at half time); high-band hits
  cluster at about 0.36 s spacing, which fits. A guess; the piece may not be metronomic.
- Candidate sections (boundaries from a novelty curve, to be confirmed by ear): 0:00, 0:28, 0:54, 1:17, 1:28, 1:58,
  2:25, 2:35, 2:48, 3:07. Brightest (centroid ~3.2-3.8 kHz) at the very start and from 2:48; darkest and most
  sustained around 0:54-2:35 (centroid ~1.4-1.6 kHz).
- Known limitation: low-band onsets are noisy (sustained/modulated bass), so they are not usable as "kick" triggers
  until confirmed.

## What the piece is (from the user, 2026-09-26)

Instrumental, an epic film-score mood: orchestra, strings, a choir in the background, water; drama at "points of
questioning" and a resolution. The user's purpose is simply to show what can be done with visuals over an existing track for a client
(2026-09-26), so there is no deph YouTube pack, thumbnail or channel positioning for this piece.

Arc reading confirmed by the user (times are the analysis boundaries; roles are the reading): 0:00 opening, the
surface · 0:28 the orchestra grows · 0:54 tension, immersion · 1:17-1:28 the held question (quiet dip, no highs) ·
1:28 rebuilding · 1:58-2:35 drama (peak energy) · 2:35 harmonic turn · 2:48 resolution (bright, airy, choir) ·
3:07 closing. The narrative curve `ARC` in `tools/visuals/src/compositions/songcord/analysis.ts` encodes it as one
number, 0 (light) to 1 (the question).

## Look-development prototypes (2026-09-26)

Five full-length Studio compositions (`SongcordProtoA-Dive`, `-B-Interference`, `-C-Cymatics`, `-D-Ribbons`, `-E-PandoraDeep`), 1920x1080 at 60 fps,
all reading `sync/analysis.json` (a copy is in `tools/visuals/public/songcord-analysis.json`) as pure functions of
the frame, playing `audio-master.wav`. Code: `tools/visuals/src/compositions/songcord/` (`Prototypes.tsx`, one
`shader*.ts` each, `analysis.ts`, `common.ts`, `ShaderCanvas.tsx`).

- **A Dive** — camera height follows the arc: light shafts and caustics at the surface, marine snow, bioluminescent
  motes that take over in the deep; choir/air band brightens the motes.
- **B Interference** — each mid/high attack drops an expanding ripple on dark water; packets cross and interfere.
  Ripples are placed by a hash of the attack time (position is not measured), speed and width depend on band.
- **C Cymatics** — a vibrating plate whose 12 standing-wave modes are weighted by the measured pitch classes; A
  (the estimated tonic) is the simplest mode, so harmonic distance shows up as geometric complexity.
- **Breath rings (added to B and E after the user's review):** B's ripples came only from attacks, so the held question
  (1:17-1:28, no mid/high attacks but strings and choir sounding) left the water almost still and the user said
  something was missing. A slow, very wide ring is now emitted every 2.4 s, stronger the fewer attacks are near, so
  sustained sound also moves the water.
- **D Ribbons** (needs `@remotion/three`, `three`, `@react-three/fiber`, installed in `tools/visuals`) — three slow
  currents of light, each a rope of ~9 twisting ribbons around a shared spine, with comet trails; loudness swells the
  rope, the air band widens the trails, mid/high attacks flash a ribbon, colour goes teal/cyan to violet with the arc,
  the camera moves in with depth. First try (each ribbon on its own Lissajous path) read as a tangle; sharing spines
  and facing ribbons toward the camera fixed it.
- **E Pandora deep** — A is the world and the narrative; B's ripples refract it and catch the light; C's nodal lines
  gather under the water as the arc goes deeper (weight `smoothstep(0.30, 0.90, arc)`), so the question is filled by the
  harmony itself.

All five were checked as stills at 0:10, 0:45, 1:22, 2:10 and 2:55 plus a short clip with audio for B and D; nobody has
watched a continuous playback yet (the user does that in the Studio).

## Where the sound comes from (measured 2026-09-26)

`analysis.json` now carries the stereo position of each band group per frame (`frames.pan.low|mid|high`) and, for
every attack, its stereo `pan` and register `freq`. Findings for this recording:

- **Almost everything sits in the centre.** Mean pan is about 0 for all three groups (low +0.01, mid +0.03, high -0.03);
  the spread over time is small (low 0.22, mid 0.13, high 0.10). Attacks: mid 171 of 172 and high 124 of 126 are within
  +-0.3 of centre. It is a centred, balanced film-score mix, so left/right is a weak cue here.
- **It is wide, not directional.** The side/mid ratio is ~0.55-0.65 throughout: the width comes from decorrelated
  reverb/choir, not from instruments placed left or right.
- **Register is the strong location cue.** Mid attacks centre at 475-1637 Hz and high attacks at 2930-10355 Hz, so height
  (register) separates the layers far better than pan does.
- Not measurable from a stereo mix: which instrument played each note. The pan and register are those of the whole band
  at that instant, a location hint, not an instrument identification.

In the prototypes an attack's screen position uses x = measured pan amplified x3.5 (plus a small deterministic jitter so
simultaneous attacks do not stack) and y = its register on a log scale (200 Hz low, 10 kHz high). D's three currents are
the three registers: height by register, sideways offset by that register's pan, thickness and brightness by that
register's level.

## Pandora palette (2026-09-26)

At the user's request E (and D's world) use the film's colours rather than Deep Decay: deep and electric blues,
bioluminescent teal and green, violet and a magenta-violet, mixed across space and time by `pandoraField()` in
`common.ts` so the layers blend into each other (each layer samples the field with its own offset). Green leans to the
light (start, resolution), violet to the deep (the held question). `uPalette` = 0 keeps Deep Decay for A/B/C.

## D final (2026-09-26)

What D was missing, as judged from the user's screenshot and the stills: a world (it floated on a flat backdrop; the
Studio also showed a transparency checkerboard because that backdrop was semi-transparent), the film palette, motion
tied to energy (an energy clock now sets the flow speed), structure (ribbons thin out in quiet passages and fill in the
drama), and a link to where the sound is (registers, pan). D is now the Dive's world (Pandora palette) with the three
ribbon currents on top.

## J "Luminous" (2026-09-26)

`SongcordProtoJ-Luminous`: E rendered as linear HDR light with bloom, more saturated Pandora colours, and D's ribbons
reduced to ONE being of light (the user's choices: a single being, a trail of ~4 s, an "HDR look" in a standard video,
not an HDR export yet).

- **Pipeline** (`HdrCanvas.tsx`, raw WebGL2, no extra dependency): the scene shader writes unclamped linear light into a
  half-float texture; the bright parts feed a 5-level bloom pyramid; a final pass adds the bloom, applies an ACES filmic
  curve (highlights roll to white, colour stays saturated), a black level, a slightly steeper gamma (2.0, not 2.2) for
  deeper darks, a vignette and fine grain. Output is the usual 8-bit BT.709 yuv420p (checked with ffprobe).
- **The being** (`being.ts`, `shaderJ.ts`): a white-hot core with teal / violet halo and a twisting two-strand trail
  (`TRAIL_SECONDS = 4`) that fades from white through teal and blue to violet. Its path is a wide wander over the whole
  frame driven by a musical clock: slow and soft when the music is soft, quick in the drama, almost still (a small orbit
  near the middle) in the held question, riding higher toward the light at the start and in the resolution. It swells
  with loudness and pulses softly (capped, never a flash) on mid/high attacks. Structure near it (motes, glints, cymatic
  lines) brightens as it passes.
- **Lessons while tuning:** first pass was blown out to white (linear light plus gamma lifts a normal-looking scene; the
  world had to be scaled down to about a quarter and given a black level so the lights stand above real darks). The trail
  must combine segments with `max`, not a sum: in slow passages the segments pack tightly and a sum blows out the head.
- **Measured:** stills at 0:10, 0:45, 1:22, 2:10, 2:55 and a 3 s clip (180 frames, ~12.5 s to render, so roughly 14 min
  for the whole piece; the Studio preview may play below 60 fps).

## K "Underwater" (2026-09-26)

`SongcordProtoK-Underwater` = J with two changes the user asked for after liking J: (1) the being of light has no
twisting DNA-like tail, only one smooth beam that tapers and fades (with a flare along its direction of travel), and
(2) everything is seen as if through water, so the whole piece "closes" as one underwater world.

- **Water filter** (`shaderK.ts`): one refraction warp (`waterWarp`: a slow large swell + medium ripples + a finer shimmer
  that fades with depth, its strength nudged by loudness and bass, never a shake) displaces the coordinates used by
  every layer: the light shafts and motes (A), the cymatic filigree (C), the ripples (B) and the beam itself. On top:
  caustics (a bounded ridged-noise network, strongest toward the light), water absorbing red toward blue-green, and a
  slight colour dispersion toward the frame edges (`ca` in `HdrCanvas`, applied in the final pass).
- **Lesson:** the first caustic function (a well-known tiling formula) returned very large values in this space and the
  whole frame went white; it was replaced by two multiplied, warped ridged-noise layers, which are bounded by construction.
- J is untouched (its twisting trail stays available for comparison). Checked as stills at five moments and a 3 s clip
  (frames 600-779); the wobble reads clearly, the caustics are subtle. Nobody has watched it continuously yet.

## L "Wake" (2026-09-26)

`SongcordProtoL-Wake` = K with the harmony layer (the cymatic plate, whose nodal lines were straight and grid-like) replaced
by water wakes over the whole frame. The user's clarification: keep the being of light, keep the attack ripples (B), and only
turn the dominant-note lines (C) into a water wake, with the harmony thread kept; wake length 12 s.

- **How** (`wake.ts`, `shaderL.ts`): each of the 12 pitch classes owns an invisible source that wanders slowly across the whole
  frame; while that note sounds (measured chroma, weight at the moment of emission) it drops ring waves that expand and fade over
  `WAKE_SECONDS = 12`. The interference of rings from a moving source is a wake (curved V-shaped arms), drawn as luminous crest
  lines (zero crossings of the summed wave, normalised by the local wave envelope so lines exist only where the water is
  disturbed). The 4 strongest classes over the last 12 s are drawn (24 emission samples each). The tonic (A) has the longest
  wave; the dominant pitch class tints the wake (blue / teal / violet / magenta by class).
- **Measured:** stills at five moments and a 3 s clip; ~12 s to render 180 frames, the same speed as K.
- **Known:** the wake hue follows the dominant note, so it can change within seconds (violet to blue-teal inside a 3 s clip),
  and the frame is busier and hazier than K. Softer hue changes or a smaller tint weight are the obvious knobs.

## Final delivery (2026-09-26)

The user approved L as the final look ("todo perfecto"; the stutter seen in the Studio is only its real-time preview, a compiled
mp4 plays smoothly) and, after weighing an HDR10 delivery, chose to deliver **only a 4K master tuned for YouTube playback** (for the client to use), with a
simulated-HDR look, since most viewers watch on SDR screens. (A real HDR10 deliverable was planned but dropped at the user's request;
the plan is in the conversation history, not built. `HdrCanvas` still renders the HDR look in a standard video.)

- **Composition:** `SongcordFinal4K` (3840x2160, 60 fps; `SongcordFinal` is the 1080p twin for quick stills). It is L with an SDR grade for
  bright screens (`YT_GRADE`, `YT_GAIN` in `Prototypes.tsx`): world gain 0.42 instead of 0.24, exposure 1.05, saturation 1.28, bloom 0.55 with
  threshold 1.2, gamma 2.25 instead of 2.0 (lifted shadows). Measured average luma (limited range, 16-235) at 0:10/0:45/1:22/2:10/2:55:
  L 66/77/101/94/79, final 91/108/132/124/105, i.e. about a third brighter; highlights still reach white (Y max 211-235). A first try with
  bloom 0.8 washed the held-question frame out to a big white area and was reduced.
- **4K is the same shader at 3840x2160** (the look is resolution independent); native 4K instead of an upscale keeps fine detail. YouTube
  encodes 4K uploads at a much higher bitrate than 1080p, which helps the dark gradients of this piece.
- **Encoding:** H.264 High, level 5.2, yuv420p, BT.709 limited range (checked with ffprobe on a test clip), CRF 16, AAC 320 kbps. A test clip
  ran at about 35 Mbps at CRF 18.
- **Audio:** `sync/audio-youtube.wav`, mastered to -14 LUFS / -1 dBTP (source -8.0 LUFS, so -6 dB constant gain, true peak -6.1 dBFS, no
  limiter, LRA 11.9 unchanged). YouTube normalises toward about -14 and does not raise quieter files, so -14 is what plays at full level;
  Slow Drift used -16, this piece deliberately does not. Copy in `tools/visuals/public/songcord-youtube.wav` (git-ignored).
- **Output:** `media/songcord/renders/songcord-youtube-4k.mp4` (git-ignored).

**Render result (2026-09-26):** `media/songcord/renders/songcord-youtube-4k.mp4`, 1.15 GB, 3:16.5 (11,789 frames at 60 fps), 3840x2160 H.264 High
level 5.2, yuv420p, BT.709 limited range, average video bitrate about 46.8 Mbps, AAC 320 kbps, measured loudness -14.0 LUFS (LRA 11.9 LU).
Took about 31 minutes to render plus about 15 minutes to encode. Frames from the file at 0:10, 1:22, 2:10 and 2:55 were extracted and checked.
