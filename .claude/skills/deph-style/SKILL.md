---
name: deph-style
description: Use before proposing or changing any creative direction (sound or visual) for a deph composition, and after every user-guided creative decision. It is the accumulating record of deph's evolving style and product identity — what the user liked, what they rejected and why, measured findings, the way the user likes to work, and what is still untried. Append to it whenever the user steers a creative choice; read it first so the next piece starts from what is already known instead of re-deriving it.
---

# deph style — the accumulating notes

deph makes generative ambient pieces (Strudel audio + Remotion video) meant to be meditative and to be
published (YouTube). The style is being **found gradually**, piece by piece, by the user reacting to what
Claude builds. Claude cannot hear or watch playback: the user is the ear and the eye, and every claim here
about "how it sounds" is either the user's reaction or a measurement, never Claude's own listening.

How to use this file:
- **Read it before** proposing a new sound/visual direction or starting a new composition.
- **Append to it** (newest entry last in the log, and update the distilled sections) whenever a creative
  decision is made with the user — especially reactions ("me gusta", "no me convence"), corrections, and
  measurements that explained a problem. Record the *why* and the evidence, not only the value chosen.
- Keep composition-specific mechanics in `media/<name>/<name>.md`; keep reusable technique in
  `strudel-compose` / `visuals-compose`. This file holds the *taste and the reasons*, and points to those.

## Product identity (what deph is, so far)

- Name: **deph** ("deep phase"). Visual palette family: "Deep Decay".
- Meditative, spacious, unhurried; no beat anywhere. Generative in the Eno tape-loop sense: voices on
  loop lengths with no common factor, so the texture never repeats exactly.
- Arc-shaped: intro, development, climax, deceleration, outro. Slow Drift is 6:00 (12/24/72/48/24 cycles
  at 30 cpm), rebalanced once so it reaches full texture sooner (viewers leave early on YouTube).
- The published copy lives in `docs/youtube-channel.md` and each `<name>.youtube.md`.
- Promotion angles chosen so far: tuned to A=432 Hz, binaural layer "best with headphones". Keep claims
  factual: no good evidence that 432 Hz or binaural beats improve mood or health, so never promise effects
  (YouTube also restricts health claims). The user agreed with stating them as technical facts.

## Sound style — distilled

- **Sparse and spacious beats dense and busy.** For meditation the user asked for fewer bells, more
  space, more reverb/delay. Fill silence with tail (reverb `size` 9 s, non-metric delay 1.13 s, feedback
  0.55), not with more notes.
- **Bells are an accent layer, never a fifth voice.** The user asked for them lower twice. Gains 0.055-0.08.
- **Vary by weight, not by gaps.** Humanize with ghost notes, legato and ≤10 ms drift; dropped notes read as stops.
- **Organic journey, no jolts.** Voices hand over through crossfades, never drop to zero mid-piece, and every layer
  (Shepard included) plays chord tones at the piece's own pace. Calm density (8ths, not 16ths) for travelling.
- **With a pulse: one motif, one shared progression.** Every voice derives from one cell and follows the same chord
  changes on the same 8-bar phrases; independent loops only for beatless textures (Musica Universalis, rejected collage).
- **Pedal, not melody.** Rejected: a wide ascending arpeggio (0 4 7 9 12 14) and a C-E-G-E triad
  arpeggio (lullaby-like). Chosen: a pedal on G, G A G E, steps of at most a third.
- **Warm harmonic bell timbre.** Rejected: metallic FM bell (fmh 1.4 / 2.4) — its partials sat only ~20 dB
  under the note at non-scale pitches (0.4x, 2.4x, 3.4x). Chosen: integer `fmh` (2 and 3), a glass /
  singing-bowl tone. "Something isn't right" in a diatonic piece can be the timbre, not the notes.
- **Everything in one key and one tuning.** C major, A=432 via a single `tune()` helper on every pitched
  voice; every voice derives its scale from `ROOT`/`KEY_SUFFIX`.
- **No clicks, no snaps.** Every voice sets `decay` explicitly whenever `sustain` is below the peak (the
  0.05 s default makes a "clap"); no `fmattack(0)`; envelope *shape* matters as much as tail length
  (attack 0.05 -> decay 0.6 -> sustain 0.35 reads as a pedal; the earlier steep drop read as dry/cutting).
- **Binaural layer:** sine hard-left and hard-right around C4 (256.87 Hz), beat 10/8/6/5/4 Hz across the
  arc (alpha to theta), dry, ~17 dB under the peak, one long note per section. Headphones only.
- **Retention:** a short cold-open bell teaser and an early, very quiet pad entry, so the first seconds
  hold a first-time listener without diluting the climax's arrival. Never more than ~15 s without a new event near the
  start; the core texture (pulse, if any) within the first minute. Rejected twice for a slow runway (Slow Drift 2:08,
  Musica Universalis 1:52).

## Visual style — distilled

- **One fractal (Julia set), edge to edge — no empty margins.** Growth is a one-way function of the arc
  (compact/far to closer), never a repeating zoom cycle (rejected: it felt mechanical and disconnected
  from the music). Camera zoom 1.05 -> 0.5 with an auto-framing path that keeps the frame on structure.
- **Fill smooth regions with real dynamics** (exterior escape-count bands, interior convergence depth and
  direction), not with decoration. Concentric rings that look like "fractal" in a big flat basin are
  usually the signature rings showing through — check before trusting them.
- **Palette "Deep Decay":** obsidian #050508, night-blue #121829, cosmic violet #2d1b4e, oxidized teal
  #1fa396, electric cyan #38bdf8, plus a deliberate rose/ember flash #cb3860 as a passing event.
- **Audio reactivity is gentle and heavily smoothed.** Rejected: bass-driven camera shake (uncomfortable,
  "too strong for our minds and vision"). Only iteration depth and slow drift respond to audio.
- **The "creation torus" signature (3/6/9/12 rings, 30 s cycle, 3+6+9+12=30):** the user's design mark,
  saved as a standing layer. Rules learned the hard way: it must be **invisible as a shape** — only its
  effect on the fractal shows (a ripple/lift/shading on a fractal "on a water surface"); the fractal, not
  the torus, is the star and is never hidden; never visible rings in empty space; no straight
  "Hollywood searchlight" bands; no centre funnel. **Currently switched off** (`SIGNATURE_ENABLED = false`
  in `FractalVisualizer.tsx`) at the user's request, to judge the fractal alone.

## How the user likes to work with Claude

- For anything with real creative judgment (visual/audio design, layout, reorganizing work): **explain the
  understanding and a concrete plan, and wait for an OK** — then execute. Mechanical follow-through on an
  agreed plan needs no re-confirmation. When the user says "do the one you think is best first", do it and
  offer the alternative afterwards.
- **Measure, don't guess.** Claude cannot hear: back every claim with the inspector, a render, an FFT, or a
  frame check, and say plainly what was and wasn't verified. Several "it sounds wrong" reports were traced
  to measurable causes (missing decay, reverb `size` in seconds, shared reverb, non-scale FM partials,
  render-engine lockup) rather than taste.
- **Re-render, master and re-sync after every sound change** (`sync/audio.wav`, `sync/audio-master.wav`,
  and both copies in `tools/visuals/public/`), and keep the docs (`media/<name>/<name>.md`, the skills) current in the same turn.
- The user prefers to see results: stills/contact sheets across the whole piece, the Studio at
  `localhost:3100`, and a compiled mp4 in `~/Movies/` (not the Desktop; a file there vanished once).
- Be honest about trade-offs and side effects (e.g. "the C anchor got weaker", "less metallic, more glass").
- Spanish in conversation; docs and code comments in English. Guides the user follows by hand (e.g.
  `<name>.ableton.md`) are in Spanish.
- **Ableton**: the user is at level zero. Every Ableton guide says exactly which plugin, preset, knob value,
  effect and menu. For choices with several valid options (e.g. how to carry 432 Hz), the user prefers the
  simplest one for them.

## Rejected ideas (and why) — don't re-propose without a new reason

- Straight sweeping light bands; a 3-blob layout with cyclic self-similar zoom; bass-driven camera shake;
  visible rings in open space; making the fractal fade in/out with the wave; a plain sine bell; metallic
  FM bell ratios; wide arpeggio and triad-arpeggio bell phrases; dense bell rhythm for a meditation piece;
  the default (unset) `decay`; reverb shared by voices of different `size`.

## Open questions and untried candidates


- Bell phrases measured to have 0 semitone clashes but not yet rendered: `D G A G`, `G E D E`; the
  untried "C and G only" phrase; `0 2 0 1` if C should return as the anchor.
- Bell timbre "shimmer" variant (`fmh` 2.01 / 3.005) if the glass tone proves too plain.
- Keep the creation-torus signature off, bring it back as-is, or bring it back much subtler?
- The full compiled video has not yet been reviewed by the user end to end (with bell pulses, master, color fix).
- Bell pulse strength/shape (glow 0.32, bulge 0.018, 2.6 s fade) is a first guess; extend the same idea to the pad
  or drone entrances only if the user asks.
- Slow Drift's YouTube pack is drafted (`slow-drift.youtube.md`) but waits on the user: primary language, channel/links,
  thumbnail choice and text, AI-tools transparency line, publish date.

## Decision log (append newest at the bottom)

Entry format: `date — decision — reason/evidence — where it lives`.

- 2026-09 (early) — Composition-first layout (`media/<name>/`), project named deph — one folder per piece with a
  yaml manifest — `CLAUDE.md`.
- 2026-09 — Fractal visual with arc-tied one-way growth, single image — cyclic zoom felt mechanical —
  `visuals-compose`, `slow-drift.md`.
- 2026-09 — Creation-torus signature as a shared brand layer, invisible as a shape — user's design mark —
  `tools/visuals/src/signature/phaseRings.ts`.
- 2026-09-22 — Arc rebalanced (24/40/56/36/24 -> 12/24/72/48/24 cycles) plus a cold-open bell teaser and early
  pad — retention on YouTube — `slow-drift.md`.
- 2026-09-22 — Bells as FM synthesis, then reverb `size` understood as seconds, then explicit `decay`, then
  softer envelope + longer delay feedback — each reported as "dry/clangy/clap/cutting", each traced to a
  measurable cause — `strudel-compose`, `slow-drift.md`.
- 2026-09-23 — Renderer hardened against an engine lockup that froze the audio into a steady 375 Hz tone from
  1:41 to the end (shared reverb, async impulse response, concurrent `disconnect`; auto-detect and retry) —
  `tools/sounds/render.mjs`, `CLAUDE.md`.
- 2026-09-23 — Fractal fills the whole frame: absolute-count exterior bands, closer camera, auto-framing path,
  interior dynamics coloring — margins were dead space — `slow-drift.md`, `visuals-compose`.
- 2026-09-23 — Signature rings switched off (kept as a flag) — user wanted to see the fractal alone; the user
  then said they liked it a lot — `FractalVisualizer.tsx`.
- 2026-09-23 — A=432 Hz tuning and a binaural layer (10/8/6/5/4 Hz) — promotion angle; verified with a fine
  FFT (drone at 64.23 Hz, ~70 dB channel separation) — `slow-drift.md`.
- 2026-09-23 — Bells: pedal phrase, then half as many, then a G-A-G-E pedal, then integer FM ratios — "too many
  / not right / maybe the timbre bothers me"; measured a 2-of-21 semitone rub against the pad and non-scale
  partials ~20 dB under the note — user: "me encantó" — `slow-drift.md`, `strudel-compose`.
- 2026-09-23 — Created this `deph-style` notes skill so taste and reasons accumulate across pieces — user request.
- 2026-09-23 — Video encoding aligned with YouTube's recommended format (yuv420p, limited range, BT.709 tags in
  `remotion.config.ts`) — the render was yuvj420p full-range/untagged; existing `slow-drift-v2.mp4` predates the
  fix — `visuals-compose`.
- 2026-09-23 — Compiled videos live in `media/<name>/renders/` (git-ignored), not `~/Movies` — composition-first
  layout: everything of a piece lives in its own folder — `CLAUDE.md`, `visuals-compose`, `deph-compose`.
- 2026-09-23 — `media/<name>/visuals` is a symlink to `tools/visuals/src/compositions/<name>` (never the other way
  round) — tested: real code in `media/` fails to resolve packages like `@remotion/media-utils` — user asked whether
  a symlink could work — `CLAUDE.md`, `visuals-compose`, `deph-compose`.
- 2026-09-23 — Loudness master: constant gain to -16 LUFS / -1 dBTP, no compression (measured -23.6 LUFS, TP -9,
  LRA 15.9 before; -16.0 / -1.4 / 15.9 after); video plays the master, reactivity analyzes the raw — YouTube does
  not raise quiet files, so the piece would have played ~9 dB softer than typical — `tools/sounds/master.mjs`.
- 2026-09-23 — Note-level sync built: `frames.json`/`manifest.json` (tools/sounds/frames.mjs), and bell pulses in the
  video — the user asked for it after learning Remotion has no rhythm detection, only our spectrum bands; pulse
  position from the bell's pan and pitch, soft swell + faint glow, subtle by the earlier lessons (no visible rings,
  no strobe) — onsets verified 0-10 ms against the audio — `bellPulses.ts`, `visuals-compose`.
- 2026-09-23 — YouTube publishing formalized: a `youtube-publish` skill, channel copy in `docs/youtube-channel.md`, and a
  per-piece pack `media/<name>/<name>.youtube.md` (yaml `publish` domain) built whenever a video is rendered — the
  user asked for it to be done for every publication, with EN/ES, hashtags and channel positioning; rules re-verified
  on YouTube Help (hashtags: 3 shown, over 60 ignored; chapters; thumbnails; disclosure only for realistic content) —
  honesty rules kept: 432 Hz and binaural as facts, never health effects — `youtube-publish`.
- 2026-09-24 — Channel banner made from the piece itself (`deph-banner`, fractal at 5:00 + `deph` / `GENERATIVE AMBIENT`
  in Avenir Next, inside YouTube's safe area) so the channel image is the same visual language as the videos —
  brand images live in `docs/youtube-channel/` — `docs/youtube-channel.md`.
- 2026-09-24 — Profile picture: keep the user's illustrated portrait and its softened face, and replace its original
  blue/purple torus background with the Slow Drift fractal (portrait cut out with a colour-based mask) — first try
  (defocused, tinted original background) was rejected: "the face is fine, but I want a background more in line with
  what we are doing"; the expression can't be changed without an image generator — `docs/youtube-channel.md`,
  `deph-avatar`, `make-avatar-mask.mjs`.
- 2026-09-24 — Profile picture: the user tried a plain black background and chose the **fractal** one; the black variant was
  removed — `docs/youtube-channel.md`.
- 2026-09-24 — Video thumbnail made in Remotion (`slow-drift-thumbnail`): fractal frame, dark gradient on the left, heavy
  **SLOW DRIFT** + **432 Hz · BINAURAL** — no thumbnail-generation skill exists, so thumbnails follow the same
  code-made approach as the banner and avatar; checked at sidebar size — `slow-drift.youtube.md`, `youtube-publish`.
- 2026-09-24 — Thumbnail template fixed for every piece: the user liked the original typeface (Avenir Next Bold) and asked
  for the extras seen in the six-font comparison (Optima, Didot, Futura, Copperplate, DIN Alternate, Menlo — none chosen):
  brand chip with the ring mark + series number, cyan rule, facts line, headphones cue, empty bottom-right for YouTube's
  duration badge — so all covers look alike with a recognizable touch — `youtube-publish`, `VideoThumbnail.tsx`.
- 2026-09-24 — README.md written for the public repository (what deph is, the pipeline, how to rebuild a piece, the
  432 Hz / binaural note stated as fact). Left out on purpose until the user decides: any mention of AI assistance, and
  the licence ("not chosen yet") — `README.md`.
- 2026-09-26 — Songcord: first **audio-first** piece (a film-score recording supplied by the user, no Strudel): analysed with
  `analyze-audio.mjs` instead of `frames.mjs`; the user confirmed the measured arc as an epic-film narrative (question at
  1:17-1:28, drama 1:58-2:35, resolution 2:48) and asked to explore visual directions beyond the fractal, so three
  prototypes (A Dive, B Interference, C Cymatics) were built for comparison before choosing — explored techniques beyond
  fractals as the user asked — `media/songcord/songcord.md`, `tools/visuals/src/compositions/songcord/`.
- 2026-09-26 — Songcord prototypes reviewed: B's silence at the held question needed something (user: "hace falta algo"), so
  sustained sound now also moves the water (breath rings); the user asked for D (3D ribbons, `@remotion/three` installed) and
  a hybrid E built from B and C on top of A's narrative. D's first version (independent Lissajous ribbons) read as a tangle;
  coherent twisting currents around shared spines worked — `media/songcord/songcord.md`.
- 2026-09-26 — Songcord: the user asked for E's layers in different blending colours in the film's palette (green, blues,
  violets) — the first deliberate departure from Deep Decay, for this piece only (`pandoraField`, `uPalette`); asked whether
  D lacked something (it did: a world, palette, structure, energy-driven motion) and asked where the sound comes from — measured:
  the mix is centred and wide, register (not pan) is the location cue, instruments cannot be identified — `media/songcord/songcord.md`.
- 2026-09-26 — Songcord: the user chose **E** (Dive world + ripples + cymatic filigree, Pandora palette) as the line to follow, and asked
  for a more intense "J" on top of it: HDR-like glow, more saturated Avatar colours, and D's ribbon reduced to a single luminous
  being / halo that wanders the whole frame leaving a trail that fades away. Waiting on the user's OK to the plan before building — `media/songcord/songcord.md`.
- 2026-09-26 — Songcord J "Luminous": user's answers — ONE being of light, trail of about 4 s "then we see", HDR look only for now.
  Built as linear HDR + bloom + ACES with much darker world and a black level (first pass was blown out); the being's trail
  combines with max, not sum. Colours pushed to intense Pandora blues/teals/violets; the world brightens where the being
  passes. Learned: HDR impact comes from deep darks next to very bright lights, not from making everything brighter —
  `media/songcord/songcord.md`, `HdrCanvas.tsx`.
- 2026-09-26 — Songcord: the user liked J a lot and asked for K: the being of light as a smooth beam with no DNA-like twisting trail, and the
  A and C layers (light shafts, cymatic filigree) plus everything else seen "as if through water" so the whole piece reads as one
  underwater world — built as a shared refraction warp + caustics + red absorption + slight dispersion; J left as is — `media/songcord/songcord.md`.
- 2026-09-26 — Songcord: the user likes K ("me gusta") and asked for a next version where C (the cymatic lines) is not so straight but gives
  the effect of the wake that water makes when something passes through it. Understanding proposed to the user; waiting for their OK before building — `media/songcord/songcord.md`.
- 2026-09-26 — Songcord L: the user clarified that the water-wake idea is about waves over the whole frame, not the being's wake: keep the being of
  light and the attack ripples, and turn only the dominant-note lines (C) into a water wake, keeping the harmony thread, with a 12 s wake.
  Built as pitch-class sources wandering the frame whose ring waves interfere into curved wakes; a first pass was a purple haze and was made crisper —
  `media/songcord/songcord.md`, `wake.ts`.
- 2026-09-26 — Songcord: the user approved L as the final look ("esta todo perfecto"; the stutter is only the Studio's real-time preview, a compiled mp4 is smooth) and asked for
  an mp4 with real HDR to hand to a client. Constraint found: only ~5.8 GB free on disk, so no frame sequences; plan proposed to the user (float readback from the shader -> 10-bit
  PQ/BT.2020 -> HEVC through a pipe), waiting for their OK — `media/songcord/songcord.md`.
- 2026-09-26 — Songcord delivery: the user's answers — the recommended format (HDR10 HEVC) for the client, AND a version made for YouTube where most viewers are on SDR screens: as
  bright and punchy as possible on SDR ("HDR simulado"), because that is where it will mostly be seen; both files; 1000-nit cap for the HDR one; output in `media/songcord/renders/`.
  Understanding sent to the user, waiting for their OK before building or rendering — `media/songcord/songcord.md`.
- 2026-09-26 — Songcord is a showcase for a client, over the client's own music: the user said to forget deph, YouTube and rights ("solo quiero mostrar que se puede hacer"). The
  deph YouTube pack, the deph-branded thumbnail and the rights warnings were removed; the deliverable is the 4K master tuned for YouTube playback. Lesson: ask whether new
  audio-first work is a deph release before applying the deph publishing workflow — `media/songcord/songcord.md`.
- 2026-09-27 — Workflow: Strudel stays where pieces are composed; Ableton Live (with the Mac's VST/AU library) becomes an optional
  refinement stage (instruments, effects, mix, master), feeding the existing video pipeline instead of replacing it. The user chose: MIDI over
  the IAC bus for quick sound tests and exported `.mid` for the final version; 432 Hz carried inside the MIDI (a pitch bend, the simplest
  option: nothing to set in Ableton); mastering left open per piece (Ozone in Ableton or `master.mjs`); a detailed beginner guide per piece
  naming plugins, presets, settings and effects — `docs/daw-bridge.md`, `ableton-bridge` skill, `media/slow-drift/slow-drift.ableton.md`.
- 2026-09-27 — New piece Musica Universalis (music of the spheres): the user chose the name, sound + video (try Claude's
  Kepler-orbits / harmonograph idea first), the "tetractys" arc 1:2:4:3 (~8:00, no separate outro), D dorian over C lydian,
  and kept 432 Hz + binaural as the channel signature. New character asked for: "muy volador, muy psy, que te lleve a un
  lugar" (soaring, psychedelic, a journey) — a departure from Slow Drift's still meditation. Instruments: Surge XT and Serum 2
  (not Kontakt orchestras). First piece composed Ableton-first — `media/musica-universalis/musica-universalis.md`.
- 2026-09-27 — Musica Universalis: the user chose (a) psybient WITH a soft pulse — first deph piece with rhythm: no hard kick,
  beatless intro, rolling bass + 16th arps with ping-pong delay from the development, full pulse in the climax, dissolving in the
  deceleration, 120 BPM (1 cycle = 1 bar at 30 cpm); a Shepard-Risset rising glissando as the "flying" element. Tuning: hybrid —
  the monochord drone (2:1, 3:2, 4:3) in exact Pythagorean ratios in Surge XT, everything else equal temperament at 432 Hz —
  `media/musica-universalis/musica-universalis.md`.
- 2026-09-27 — Musica Universalis, first listen: the user found the start monotonous ("un loop que no para"): the intro plus the first
  two thirds of the development kept almost one note (the monochord) until the pulse at 1:52, far too long for YouTube. Lesson, again
  (Slow Drift had the same fix): something new must happen within the first ~10-15 s and the pulse/core texture must arrive early;
  a concept like "one string alone" has to be expressed in seconds, not minutes — `media/musica-universalis/musica-universalis.md`.
- 2026-09-27 — Musica Universalis rewrite, approved by the user ("tiene que ser algo más coherente"): the first version was a collage —
  each voice on its own planetary loop and its own material, fine for beatless Eno but incoherent over a psy pulse. New rule for pieces
  with a pulse: ONE motif (the Pythagorean cell D-A-G-D: unison, fifth, fourth, octave) that every voice derives from, ONE shared chord
  progression (D dorian: Dm-G-C-Dm, 8 bars) that bass, arp, pad and lead all follow, 8-bar phrasing, hook in the first seconds, a
  mid-piece "flight" break (bass out, Shepard + pad) and a return. Concepts (planets, tetractys ratios) become subtle detail, never the
  structure. Also found: notes longer than a few bars keep sounding after Strudel is stopped (superdough schedules each whole note), so
  no note longer than 4 bars — `media/musica-universalis/musica-universalis.md`.
- 2026-09-27 — Musica Universalis v2: the user likes the general idea ("me gusta la idea general, bien!") — one Pythagorean motif
  (D-A-G-D) shared by every voice, one progression (Dm6-Gsus4-Csus4-Dm6, fourths and fifths), 8-bar phrases, hook at 0:00, groove at
  0:16, flight break with the Shepard rise, return — `media/musica-universalis/musica-universalis.md`.
- 2026-09-27 — Musica Universalis v2 in Strudel: the user likes it ("me gusta") but found the arp "muy agudo, mucho brillo" and too
  quiet. Fixed as asked: resonance lpq 7 -> 3, lpenv 2 -> 1.5, filter ranges ~35% lower (return section 2.6-3.2 kHz -> 1.6-2.0 kHz),
  gains x1.4 (~+3 dB). Lesson: a resonant saw pluck in 16ths reads as harsh and thin at the same time; for deph, darker and
  louder rather than bright and quiet. Register kept (D4-G6); an octave down is the next step if it's still too high —
  `media/musica-universalis/sounds/musica-universalis.strudel`.
- 2026-09-27 — After trying the Ableton build (Surge XT / Serum 2 presets, MCP-built set), the user prefers Strudel's own sound for
  Musica Universalis: "sigamos con strudel, tiene más el sonido que busco". Ableton and MIDI are parked for now (the set, the MIDI
  export and the tuning files are kept in media/musica-universalis/daw/). The deph sound, so far, is Strudel's
  synthesis refined in code; a DAW is an option, not the default path.
- 2026-09-27 — Musica Universalis: the user asked for the arp and the pads to interlace, "subiendo uno, bajando otro", in a
  Pythagorean cycle, rising and falling in presence. Built (volume and brightness only, the user's choice; contrary pitch motion
  left as a possible next step): in development, climax and return the two breathe in opposite phase, +/-5 dB and filter x0.75-1.35,
  over 12 bars (twelve fifths close the circle; 12:8 against the harmonic phrase = 3:2, a pure fifth). The pad's own 16-bar filter
  sweep is replaced by the breath there, or it blurred the crossing — `media/musica-universalis/sounds/musica-universalis.strudel`.
- 2026-09-27 — Musica Universalis cut from 8:00 to 6:00 (user: too long and repetitive, "no creo que la gente escuche más de 6
  minutos algo tan repetitivo"; the Shepard arrived only at 3:28). Flight kept whole, now at 2:24, the middle. The Shepard made louder
  and brighter (it was getting lost), and its entry and exit crossfaded "de una manera más orgánica" against the arp: the arp fades and
  darkens over 12 bars as the Shepard rises, and returns opening while the Shepard recedes over 24. Lessons: for deph with a
  pulse, 6:00 is the ceiling; the most distinctive moment should sit near the middle; voices should hand over through crossfades,
  not cuts, and a Shepard scale must never restart mid-flight — `media/musica-universalis/musica-universalis.md`.
- 2026-09-27 — Musica Universalis, "todo más orgánico, un viaje, no sobresaltos": (1) the arp vanished (silent 12 bars in the
  flight; -5 dB breath dips) -> it never disappears now (flight floor about -32 dB, breath +/-3 dB); (2) the Shepard sounded
  "agarrado de los pelos, en otro tiempo" -> it stepped through every scale degree each half bar regardless of the chord; rebuilt from
  the progression itself (Dm6-Gsus4-Csus4-Dm6 climbs by fourths, voice-led upward = +1 octave per phrase), so all 420 notes are chord
  tones and it moves with the harmony, legato, triangle; (3) the arp calmer (16ths -> 8ths) with a register arc toward the climax
  and back by Pythagorean steps (0 -> +fifth -> +octave -> back); (4) section edges crossfaded (bass 4-bar fades, the arp enters the
  flight from where the climax leaves it). Principles: every layer must belong to the harmony and the pulse; hand-overs are
  crossfades; nothing drops to zero mid-piece; density low enough to travel with — `media/musica-universalis/musica-universalis.md`.
- 2026-09-27 — The user approved the organic rework of Musica Universalis ("me parece un excelente trabajo"); committed as the
  reference version before exploring a variation.
- 2026-09-27 — Variation "organic arp" of Musica Universalis (the approved version kept intact): the user wanted the arp "menos
  matemático, menos pegado al beat… con probabilidad… que no sea tan Kraftwerk", same notes. Built with probabilistic steps (anchors
  on the downbeat and the octave always sound; ~6.3 of 8 notes a bar), 0-24 ms human timing, perlin phrase dynamics and varying
  decays. Taste: machine-perfect sequencing reads as cold for deph; prefer human, breathing placement — to be confirmed by ear —
  `media/musica-universalis/sounds/musica-universalis-organic.strudel`.
- 2026-09-27 — Organic arp, second try: dropping notes by probability read as "muy cortada… con frenadas" — the user wants variation
  but a journey without stops. Replaced gaps with moving ghost notes (every note plays, random ones at 45%), more legato, timing drift
  cut to 10 ms. Rule: in deph, organic variation lives in weight, timbre and micro-timing — never in silences that break the flow.
- 2026-09-27 — Variation "meditative, no pulse" of Musica Universalis (on top of the organic one): held sub instead of the rolling bass,
  held pad chords, and an arp in free rhythm (uneven 3-2-3-4-2-3-4-3 lengths) with long soft tails and a non-metric echo. Finding: jitter
  on an even grid does NOT remove the pulse (sd 22-43 ms around 500 ms is still heard as a beat); uneven note lengths do (sd 118 ms).
  Long tails expose harmonic rubs that fast notes hide: the arp's +fifth register (E over Dm6's F) had to go; octave-only arc —
  `media/musica-universalis/sounds/musica-universalis-meditative.strudel`.
- 2026-09-27 — Meditative variation liked ("me gusta… está orgánico como lo que busco"); the arp needed more presence and less
  uniformity: +4 dB, filter x1.4, wider phrase swell -> the arp now sits level with the pad (medians within ~1 dB) with ~15 dB of
  internal dynamics. Taste: a soft timbre still needs presence to carry the journey; "organic" must not become "flat".
- 2026-09-27 — Meditative variation: the arp moved up an octave (D4-G7) as a trial and kept ("está perfecto, kudos!"). This version
  (musica-universalis-meditative.strudel) is the one taken forward to the render and the video. Taste: a floating, pulse-free
  arp sits well high above the pad; low it blurred into it.
- 2026-09-27 — Musica Universalis video: the user chose option A (Pythagorean harmonograph), with the Songcord guidelines (simulated-HDR
  look graded for SDR screens on YouTube, 4K60) and a palette of blues, turquoise, aquamarine and violets; audio for the video at -14 LUFS
  ("sigamos lo recomendado para YouTube"), -16 master kept as the channel standard. The user did not remember the creation-torus
  signature: explain it with a comparison still before deciding.
- 2026-09-27 — Musica Universalis video, first attempt rejected: a literal parametric harmonograph (Lissajous curves computed and
  drawn whole as static polylines every frame) read as "círculos perfectos, espirales… muy básico", nothing like Songcord's quality.
  Diagnosis: Songcord's line work (wake.ts, shader.ts) never draws a whole curve at once — a moving point of light is followed by a
  short fading trail (a comet), and the "shape" is only ever felt through motion and field interference (ring waves from moving
  sources, refraction, caustics), never seen as a frozen diagram. Lesson for any future line/curve visual: render motion + trail +
  field interaction, never the complete analytic curve as a static shape, however period-accurate the math is.
- 2026-09-27 — Musica Universalis video, comet approach refined: the user found it "muy frenético… parece un espermatozoide"
  (the bright head + tapering tail read as a sperm cell) and "siempre 3 rayos que dan vuelta" (exact-integer Lissajous ratios
  close into the same simple shape every cycle). Fixed: removed the head blob entirely, made the ray uniform width/brightness
  along its whole length with soft tapered ends only; halved the angular speed; added a slow incommensurate secondary term to
  each axis (dominant frequency still the true interval ratio, so the meaning holds) so the curve precesses and never closes
  the same way twice. Lesson: a bright core + thin fading tail on a moving point reads as a biological/organic creature shape
  (sperm, worm) whether intended or not — a "ray of light" needs deliberately uniform width and brightness, not comet-style
  head emphasis. The user then asked for parallel proposals for a fully different, fractal-based generation — see the next
  entry once one is chosen.
- 2026-09-27 — Musica Universalis, fractal proposal A1 (Multibrot mandala) tried and rejected: "es muy básico… es un globo".
  Root cause, structural not cosmetic: a Julia/Multibrot set viewed whole (no zoom) always reads as a blob with a wavy edge —
  the recursive, self-similar detail that makes a fractal look like a fractal only appears when the camera hugs the boundary
  (exactly why Slow Drift needed deep zoom + a boundary-seeking camera). A wide, un-zoomed "contained mandala" framing, chosen
  specifically to avoid repeating Slow Drift's full-frame zoomed-landscape look, removed the one thing that makes the fractal
  read as a fractal. Lesson: escape-time fractals need either real zoom into the boundary or a fundamentally different
  (domain-coloring / phase-based) technique to look organic from a wide view — color/palette tuning alone cannot fix it.
- 2026-09-27 — Musica Universalis, mandala rejected on composition, not just color: "tampoco tiene sentido tener algo así
  en el centro que parece un escudo… no es atractivo". A single static shape centered in frame reads as a heraldic badge/logo
  regardless of what it's made of (fractal or otherwise) — the problem is the CENTERED-AND-STILL framing itself, not the
  Multibrot math or its palette. Pattern across all three visual attempts so far: comets were rejected for frantic/mechanical
  motion, static lines/rings for cold geometry, the mandala for being centered and iconic. Common thread the user responds to:
  movement that is asymmetric, distributed and continuously changing — never one thing frozen in the middle, never a repeating
  closed shape. Any next proposal must avoid a single centered static focal point as a first principle, not tune around it.
- 2026-09-27 — Musica Universalis, both prior video attempts explicitly reviewed together and rejected on the same call: "no
  quiero que todo termine en un paneo de camara basico, quiero cosas que vayan construyendo de manera organica, sumando de
  acuerdo a pieza y el sonido.. y restando mientras va finalizando… me gusta más el de rayo de luz, pero lo frenetico cuando hay
  frecuencias agudas no escala… el segundo un escudo es como un diseñador de primer año". Explicit requirements going forward,
  standing for any future visual: (1) never a basic camera pan; (2) the picture must BUILD as the piece does and DISSOLVE as it
  ends — content amount as a direct function of the arc, not a fixed composition the whole piece; (3) keep the ray-of-light
  language, but its franticness on high/acute passages must not scale into disorientation; (4) never a single centered iconic
  shape (the mandala's "shield" problem). Third attempt built: a scattered swarm of many independent light filaments (never one
  object, never a shared centre — each filament's own base position is spread across nearly the whole frame), each a
  closed-form uniform-angular-speed circular orbit (guaranteed constant speed by construction, so "frantic" becomes
  structurally impossible) with slow independent centre-drift/radius-breathing for organic variation, count building with the
  arc and thinning in the outro. Two real bugs found and fixed while verifying this numerically (see `visuals-compose` for the
  technical detail): an orbit whose angular speed was itself modulated by the chord produced growing speed spikes at every
  chord change (measured 16-25x within a 2 s window) — the modulation was moved to radius amplitude instead, which is safe;
  and the arp's water-wave wake (built on one fixed carrier filament) still produced clean "radar" concentric circles because
  that filament barely moved between consecutive arp notes — fixed by having each arp note ride a DIFFERENT filament (picked
  from the note), so rings originate from genuinely separated points. Not yet shown to/approved by the user — stills rendered
  and being presented for reaction before any further work (full render, choosing between the 3 coexisting attempts, deleting
  the others) — `media/musica-universalis/musica-universalis.md` (once written up), `filaments.ts`, `musica-universalis.tsx`.

## Entry template

```
- YYYY-MM-DD — <decision> — <what the user said / what was measured> — <file or skill where it lives>
```
Also update the distilled sections above if the decision changes a principle, and move items out of
"Open questions" when they are resolved.
- 2026-09-27 — Naming made strict (user: "coherencia"): every name of a composition is exactly its kebab-case name
  (`musica-universalis`), a suffix only to name a purpose (`.yaml`, `.youtube.md`), never Final/Flow/Proto/4K/deph; only
  4K; every `media/<name>/visuals` is the symlink. Renamed ids, files, `.deph.yaml` -> `.yaml`, Ableton set into `daw/`,
  shared code into `tools/visuals/src/shared/`; Songcord's prototypes deleted — `deph-compose` "Naming", `visuals-compose`.
- 2026-09-27 — Musica Universalis water: the user asked for Songcord's water and Claude ported the wrong layer (`wake.ts`,
  V-wakes drawn as lines); the user meant the ripples — "como cuando tirás una piedra, ondas redondas que se cruzan con
  otras en otro lugar". Rebuilt with the shared ripples on a textured world (star dust at four depths) so the water shows
  by what it bends and the glints it catches; 3D rays with depth of field over it — `musica-universalis.md`.
- 2026-09-27 — Musica Universalis: the rays as a swarm of 26 thin, short, one-colour streaks still read as "bacterias"; the user
  compared with Songcord and asked for its beings ("como Songcord… quizá menos que ahora"), head included. Rebuilt with Songcord's
  beam and head (wide white head, flare along the travel, teal-blue-violet taper, 4 s trail, lights its surroundings), 1 to 6 beings
  following the arc, on 3D orbits that precess and change sphere at chord changes (the user's idea: "saltar de esfera, otro plano").
  Lesson: a head is fine when it is Songcord's stretched flare on a wide beam moving smoothly; the rejected "espermatozoide" was a
  round blob on a thin wiggling tail. Many small lights read as organisms; few large ones read as beings — `musica-universalis.md`.
- 2026-09-28 — Musica Universalis video approved as final ("quedo perfecto"): beings of light (1 to 6, following the
  arc) on 3D orbits that precess and change sphere at chord changes, over star dust at four depths, seen through
  Songcord's water-ripple technique (arp notes and lead bells as stones, real crossings and glints, no drawn lines).
  4K render verified: 22,080 frames, yuv420p/BT.709/limited range, audio and video both starting at 0.000000 (a stray
  `from={237}` delay found and fixed in the shared HdrCanvas), 432 Hz and the binaural beat schedule (10/8/6/4 Hz)
  confirmed by direct measurement — `media/musica-universalis/renders/musica-universalis.mp4`, `musica-universalis.md`.
- 2026-10-05 — Morpho-Genesis (review): the user keeps the full 24:09 piece on purpose — for meditation, a long piece that
  holds the listener to the end; not cut to 6–8 min. Video standard is 4K at 60 fps always ("el estándar del canal no
  importa, lo que hacemos siempre"). Approved the deph signature (creation torus) as a layer on this piece's content. The
  user asked Claude to decide the YouTube disclosure (Strudel and Remotion named) and the audio levels — `morpho-genesis.youtube.md`
  (when written), `morpho-genesis.md`.
- 2026-10-05 — Morpho-Genesis beacon: the user asked for a louder beacon, a crystalline timbre, and a delay that repeats the
  strike like a real beacon. Done: +6.8 dB level (`BEACON_GAIN`), FM index 0.35 -> 0.12 and fmh 2 -> 4, hpf 750 -> 1400,
  lpf 3200 -> 7000, longer ring (release 1.6 s), delay 0.5 s with feedback 0.62 (about 8 audible repeats) —
  `morpho-genesis.strudel`. Listening check still the user's ear.
- 2026-10-05 — Morpho-Field (new piece, sound first): the user chose the name, a lydian mode in A (A4 = 432), a 6:09 length
  so the whole piece can be heard, and the image as its arc: Vibration, Frequency, Sacred Geometry. Bells should sound like real
  bells, not like crystal: the user chose FM synthesis (rendered), not samples (not yet supported by the render pipeline) —
  `media/the-field/the-field.md`.
- 2026-10-05 — Morpho-Field rewritten after the user called the two-note version empty and repetitive: "quiero una pieza a la
  altura... compleja, profunda, con efecto wow... inventa una historia". Now five parts with a story (void, bloom, field, geometry,
  dissolution), 12 layers, a seed motif with call and answer, and a seventh harmonic as the peak moment. The user will judge it by ear;
  sound status set back to in-progress until then — `media/the-field/the-field.md`.
- 2026-10-05 — Morpho-Field composed from scratch after the user rejected two drafts ("son 2 notas que no dan interés";
  "no puedes dejar una nota sola durante 48 segundos") and asked for research and professional work: complex, deep, a "wow"
  moment, a story. Researched first (Eno's incommensurable loops, Pärt's tintinnabuli, Reich's chord cycle, Floating Points'
  seven-note motif in *Promises*, Hopkins' beatless builds) and reused what the user approved in Musica Universalis (one
  motif, a shared progression, arp/pad breath, free rhythm). The wow is a Fibonacci canon (21:13:8 cycles per statement)
  that converges at 4:16 after an inhale. Meditative, 6:09. Measured: 470 -> 44 semitone clashes after separating registers.
  Lesson: the retention rule was written but not applied; `strudel-compose` now has a mandatory listener checklist —
  `media/the-field/the-field.md`.
- 2026-10-05 — Morpho-Field renamed **The Field** (`the-field`) by the user, with its narrative in their words: "el campo
  vibra, genera frecuencias que se organizan en geometría para poder manifestar el todo" (the field vibrates, its vibrations
  become frequencies, the frequencies organise into geometry, and the geometry manifests the whole). The 4:16 convergence is
  "the whole"; the last part is "return". The user approved the sound ("una obra de arte"). Visual approved as a plan: a Chladni
  sand field (each chord a mode), three figures of light from Morpho-Genesis's sacred geometry rising from it at the canon's
  speeds, lining up at 4:16 while the sand draws Metatron's Cube — `media/the-field/the-field.md`.
- 2026-10-05 — The Field, first visual REJECTED ("no tiene una dirección de arte definida, son capas superpuestas que no dan
  una idea de continuidad... cada capa tiene colores diferentes, formas diferentes... muy pobre"). It mixed two visual
  languages (granular ivory sand + neon line figures), gave each canon voice its own colour (teal, amethyst, gold) and its own
  shape, and stacked them on separate planes that appeared from nowhere. Lesson: one piece = one art direction — one material,
  one palette, one light, one continuous transformation; a voice of the music changes the material, it does not get its own
  overlay. Agree on style frames before building — `media/the-field/the-field.md`.
- 2026-10-05 — The Field visual, second direction, built with the user's corrections step by step: one material (quartz
  dust, the same grains throughout — "todo tiene que ser uno con la misma cantidad de arena, no que aparezca de la nada"),
  one palette (nacre over indigo; gold-and-black and neon both rejected; "colores colores", but "no una caja de M&M": a
  gradient), deph's HDR look in SDR, 3D camera moves only ("no de un lado a otro"), everything organic ("nada brusco").
  Figures must be real and change at every note ("no inventadas", "imágenes diferentes"): Chladni modes chosen by frequency,
  as two-mode responses so they curve (straight grids rejected as "tableros de ta-te-ti"). Finer dust, not spheres; lines with
  dispersion, not perfect. The fall back to the table was approved ("salió perfecto"); the assembly was rebuilt as its mirror,
  as mitosis. The flower's cast shadow was rejected — `media/the-field/the-field.md`.
- 2026-10-05 — The Field approved as final ("es perfecto, kudos... es otra obra de arte"). Final 4K60 render with live progress
  (render.mjs), YouTube pack ready (series 03). Cover: the series template with the complete Flower of Life; a new optional
  `bgShift` in VideoThumbnail.tsx moves (and enlarges) the background so a centred subject clears the title —
  `media/the-field/the-field.youtube.md`.
- 2026-10-05 — The Field cover: the user chose the flower coming apart (5:13, "el momento donde se está desarmando la flor de la
  vida... en ese caos") over the complete flower Claude recommended — the cover shows transformation, not the finished form —
  `media/the-field/the-field.youtube.md`.
- 2026-10-05 — The Field: the user chose to mention the collaboration with AI in the description ("si se menciona colaboración
  con IA"), as Musica Universalis did — `media/the-field/the-field.youtube.md`.
- 2026-10-06 — The Field published on YouTube (https://youtu.be/8QGj_FvP5Xo) as series 03. Social media launch pack created at
  `media/the-field/the-field.social.md` (Facebook, Instagram, X) with warm, nature-centric invitations to relax and subscribe —
  `media/the-field/the-field.social.md`, `the-field.yaml`.
- 2026-10-24 — Gnosis gets a Strudel-only version (`media/gnosis/sounds/gnosis-live.strudel`), the Ableton source left untouched.
  Narrative fixed by the user: the Demiurge (matter) and Sophia (light) talk, the talk intensifies, Sophia's transcendence wins
  at the climax, then peace that is harmless ("inocuo"). Rejected on first listen: a repeated single note for a minute, a
  sparse bell/sine texture ("un loco tocando cuencos tibetanos" — Gnosis needs depth and complexity), an abrupt level jump
  at the climax, harsh/high notes that break the meditation. Chosen: the whole texture from second 0 (phrase, strings, bass,
  arpeggio, binaural, his answer within seconds); a singing line instead of bells; a seeded, never-repeating chord walk on
  semitone-free dorian chords; phrases that pick their transformation to grind least with the chords (676 semitone overlaps
  over 10,730 notes vs 1,765 before); every level an `env` ramp (largest step 10 % of a layer's peak); transcendence as a slow
  crossfade (he ebbs, she rises, the choir opens), not a jump. Technique learned: backtick template literals and runtime
  strings are not mini-notation in Strudel (wrap generated strings in `mini()`); the headless renderer has no `supersaw`
  worklet, so ensembles are built by hand from detuned sawtooths (`ens`). 432 Hz and the 6 Hz binaural layer kept. Open: the
  user's ear on the whole direction; whether matter's heartbeat (`heartbeat`, one `$:` line) fits deph's no-pulse identity.
- 2026-10-24 (later) — Gnosis: the cinematic version (chords, arpeggio, violin line, heartbeat) was rejected on first listen as
  "música para novela de las 3 de la tarde", not meditation: "más experimental, menos notas, acordes". Kept in
  `media/gnosis/sounds/backup/gnosis-live-cinematic.strudel`. Replacement, chosen with the user (timbre-and-register dialogue,
  just intonation): no chords, no arpeggio, no tune; the Demiurge is a cluster of low sawtooths a hair apart beating against
  each other, Sophia is pure partials; they take turns (opposite-phase swells), the beating slows to unison and her overtones
  open upward (dissonance resolves into consonance, without a jump), then pure D and A fading to silence. Tuning: A4 = 432
  makes D2 exactly 72 Hz and D4 exactly 288 Hz, so the harmonic series of D sits on 432 naturally; D dorian in just ratios
  (1, 9/8, 6/5, 4/3, 3/2, 5/3, 7/4). General rule: for deph's meditative pieces, depth comes from spectrum and time, not
  from harmonic or melodic drama — avoid orchestral/cinematic gestures (strings + choir + arpeggio) unless asked.
- 2026-10-24 (later still) — gnosis-live.strudel compressed from 24:00 (720 cycles) to 12:00 (360 cycles): the user found
  24:00 too long to sit through for feedback. Halved every cycle breakpoint in the `env()` ramps and the arc boundaries,
  same proportions (2:00/2:30/3:00/2:30/2:00), same cpm — not a different piece, the same one at half the runtime.
  gnosis.strudel (the Ableton source) stays at 24:00, untouched. General rule: when asked to compress a piece's duration
  without changing its material, scale the arc's cycle breakpoints uniformly rather than cutting sections out.
- 2026-10-24 (gnosis, third pass) — the spectral-only draft (two beating clusters, random tone walk, no motif) was
  rejected too: "muy simplona... repetición constante" — the turn-taking swell was a literal fixed-period LFO
  (`sine.slow(18)`, same 36s cycle forever), measurably repetitive, and with no motif there was nothing to follow.
  Fix, confirmed by the user's explicit instruction to respect `strudel-compose`/deph-style and match `the-field`'s
  level: recovered the REJECTED cinematic draft's actual architecture (a motif with real transformations chosen to
  minimize dissonance against the harmony, a voice-led chord cycle, a canon at Fibonacci offsets [5, 8 cycles], a
  flowing harmonic-series arpeggio — exactly The Field's techniques) but re-orchestrated it with calmer, non-vocal
  timbres (two-operator FM bell for the light voice, filtered saw for the dark one, no choir/vowel formant, no
  vibrato violin, no heartbeat). General rule for this project: "not melodrama" is a TIMBRE instruction (no
  choir/strings/vibrato-lead), never a license to drop structure (motif, harmony, canon, real development) —
  dropping structure to avoid melodrama produces the opposite complaint, generic/boring. Depth and restraint are
  independent axes; both must be served at once.
- 2026-10-24 (tooling) — built `tools/sounds/studio.mjs`: a generic local dev server (not a per-piece generator) that
  auto-discovers every composition, shows an arrangement-view timeline (one lane per voice, loudness as brightness),
  and plays the piece for real via `@strudel/web` (a second instance of Strudel's own browser engine) so clicking a
  point in time actually plays from there. The user was explicit that an earlier version of this (a CLI that
  generated one static HTML file per piece, with the audio baked in at generation time) was wrong — "GENERICO"
  means one tool/server that reads the current file state on demand, modeled after `remotion studio` /
  `hyperframes preview`, not a build step. There is no way to control the VS Code Strudel extension from outside it
  (no API bridge) — the honest alternative is a second, independent playback engine, not a remote control.
- 2026-10-24 (gnosis, confirmed) — the third pass (motif+transformations+voice-led chords+Fibonacci canon+arpeggio,
  re-orchestrated with FM bell/filtered saw instead of choir/strings/violin) was approved: "es perfecta, kudos!
  increible. Capaste todo bien esta vez." Promoted to standing technique, written up in full in `strudel-compose`
  ("Depth and restraint are independent axes", "Choosing a motif's transformation by its harmonic cost", "A
  macro-level trade-off... needs incommensurate periods too") and as new mandatory checklist items (8 and 9) —
  read those sections first for any future piece, not just this log line.
- 2026-10-24 (tooling, follow-up) — renamed strudel-studio to deph-studio (`node deph-studio` at the project root,
  `tools/sounds/deph-studio.mjs`) and branded its page with deph's own avatar (`docs/youtube-channel/avatar.jpg`,
  served at `/avatar.jpg`) in the Deep Decay palette already used for its colors. Also: gave gnosis-live.strudel's
  13 `$:` layers real names (`pad:`, `sophia:`, `demiurge:`, ...) instead of anonymous `$0`/`$1` — any label
  containing a literal `$` gets auto-numbered by Strudel itself (confirmed in the real browser REPL's source, not
  just this project's headless evaluator), so a plain word is what shows up clean in the studio and the inspector.
  New standing rule for future pieces, in `CLAUDE.md`: name layers with plain words unless the piece's Remotion
  code already filters events by the anonymous key (Slow Drift's `bellPulses.ts` does, via `docs/daw-bridge.md`'s
  documented convention) — don't break that silently.
- 2026-10-24 (gnosis, mix balance) — Sofía/Demiurgo's dialogue got lost under the rest of the texture. Measured
  (not guessed): isolated-layer renders of the Density section (`render.mjs --only <layers>`) plus `ffmpeg -af
  astats` RMS showed the two lead voices at -34.9 dBFS against -27.4 dBFS for the accompaniment (pad, arp, bass,
  canon, tint, wind) — 7.5 dB buried. Fixed by raising the leads (`.mul(2.0-2.3)` on their gain envelopes) and
  lowering pad/arp (`.mul(0.65-0.7)`), landing at -27.7 vs -28.1 dBFS (leads now slightly on top, full mix peak
  still only -12 dBFS, no clipping risk). General technique for any future "X is buried in the mix" report: render
  the suspect layer(s) alone and the rest alone over the same window with `--only`, measure RMS with `ffmpeg -af
  astats=metadata=0:reset=0`, and fix the actual measured gap — don't just nudge a number and hope.
- 2026-10-24 (gnosis, rhythm) — reported: notes landing exactly on the beat from the start, "deja de ser volador...
  lo transforma en una marcha". Root cause: the opening statement length (4 cycles / 8 slots) put a note almost
  exactly every 1 second — a perfectly regular grid, confirmed by the inspector reporting "onsets on a whole-cycle
  grid" for the melodic layers. Fixed two ways: (1) lengthened the opening sections' statement duration (12, 15
  cycles instead of 4, 5) so density grows later from more voices/ornaments entering, not from a faster note-rate
  from second 0; (2) added real humanization — a small random onset offset (0-30ms, `late(rand.segment(16).range(0,
  0.015))`, the same technique the-field.strudel's arpeggio uses) to every melodic voice, confirmed by the
  inspector flipping to "onsets on a non-regular grid". General rule: "onsets on a whole-cycle grid" (or any
  regular-grid report) in the inspector's summary is a literal, structural confirmation that a voice will read as
  metric/marching, independent of how it sounds in isolation — check for it on any melodic layer in a piece meant
  to feel beatless or "floating", the same way reverb `size`/shared-orbit bugs get checked, not just by ear.
- 2026-10-24 (gnosis, rhythm — corrected) — the first rhythm fix (lengthening the opening's statement duration to
  12/15 cycles) overcorrected: reported as uneven ("notas muy pegadas, otras muy espaciadas") and as having lost
  the magic of the approved version. Real cause, found on investigation: the ornament mechanism (squeezing two
  notes into half a mini-notation slot) was creating the unevenness, not the statement length itself — notes under
  1s apart next to notes 3s apart, regardless of how long the statement was. Fixed by removing ornamentation
  entirely (motif development still comes from transposition/retrograde/canon, which never depended on it) and
  moving Pleroma to a middle-ground 6 cycles (not the original 4, not the overcorrected 12); Descent reverted to
  its original 5 since the user had already said that part "ya mejoraba". Also added real counterpoint: the bass
  in the Pleroma now moves at positions that don't coincide with Sophia's, so something is always happening when
  she's silent — the user's own diagnosis ("le falta contrapunto") was correct and more useful than guessing at
  more gain/timing tweaks. General rule: when a fix is reported as having gone "to the other extreme" or "lost the
  magic", don't just dial the same knob back partway — find what mechanism is ACTUALLY producing the bad symptom
  (here: the ornament, not the statement length) before changing anything, the same discipline as any other
  reported glitch.
- 2026-10-24 (gnosis, melody and accompaniment) — reported after the rhythm fix: "la melodía es muy básica... repite
  siempre lo mismo... no hay tensión, no hay espera" and "lo que acompaña tampoco, es siempre lo mismo". Real causes:
  (1) the melody only ever transposed or inverted the same 7-note shape — recognisable transformation is not the
  same as development; (2) the bass played one fixed rhythmic figure, note-for-note identical, for an entire
  movement (~30 repeats in Pleroma); (3) the pad's voicing anchor was a single fixed note the whole piece, so its
  top line barely moved. Fixed: melody now sequences a short 3-note cell a third up/down (real forward motion, the
  classical "sequence" device) landing on a held note that's a deliberate dissonant suspension 40% of the time
  (tension that wants resolving — this is what "espera" meant, not just longer silence); the full original phrase
  still returns every third statement as a recognisable anchor. Bass picks a different rhythmic figure per chord
  from a small pool (not one frozen formula). Pad's `.anchor()` is now a drifting pattern of D-dorian tones instead
  of one fixed note. General rule: "repetitive/boring" on a piece that already has real structure (motif, harmony,
  canon) usually means a parameter that's supposed to vary is actually frozen somewhere — find which one (here:
  the transformation pool was too narrow, the bass figure was hardcoded, the anchor was a bare string) rather than
  assuming more structure is needed when the structure is already there.
- 2026-10-24 (deph-studio, performance) — reported as hanging/"se queda colgado cargando" when picking pieces. Real
  cause, found by profiling: `rand.segment(16).late(...)` (the humanize technique used on gnosis-live, The Field,
  and Musica Universalis) is genuinely ~35x slower to query than a plain `rand.range(...)` with no `.segment()` —
  24-28s to evaluate gnosis-live's full 360 cycles, every single load. Fixed: humanize now uses plain continuous
  `rand` (still different per note, just not pre-segmented) — same piece dropped to ~3s. Also cached /api/data
  results server-side per (file, cycles, names, bin, mtime), so switching back to an already-loaded piece is
  instant even for genuinely slow pieces, and added a running "Ns elapsed, up to ~25s for complex pieces" status
  message so a necessarily-slow first load doesn't read as broken. Separately fixed the cycle-count auto-guess:
  it now reads each composition's own `<name>.yaml` `total_cycles` (reliable) instead of scanning the .strudel
  file's comments for the first "N cycles" match (wrong for slow-drift/the-field, and wrongly inherited the
  Ableton-source file's 720 onto gnosis-live's own 360 variant in a first pass of this fix — the yaml value must
  only apply to the exact file `domains.sound.file` names, not every .strudel in that composition's sounds/
  folder). General rule: `rand.segment(N)` combined with `.late()` across an `arrange()`-nested pattern is a known
  expensive combination in this project's Strudel setup — profile before assuming a "stuck" studio load is a
  tooling bug rather than a genuinely slow pattern.
- 2026-10-24 (gnosis, visual proposal — not built) — user asked to analyze the three.js "buffergeometry drawrange"
  official example (two particle clouds connected by lines when close, geometry buffer reused each frame with
  `setDrawRange` instead of rebuilt) and wants it applied to gnosis. Proposed in gnosis.md: two particle clouds
  (Demiurge — dark, low register, heavy; Sophia — luminous, high register, freer movement) connected by lines when
  close, driven by the real frames.json audio data (same pipeline as Slow Drift's bellPulses.ts) rather than a
  separately hand-animated timeline, mapped to the piece's arc (no Demiurge cloud in Pleroma, max connections in
  Density, the Demiurge dissolving and connections snapping one by one in Transcendence). Corrected the visual
  concept's stated technology from HyperFrames (stale — that's reserved for shorts only, per the deph-shorts
  convention established earlier) to Remotion + @react-three/fiber/three, which gnosis already uses. Nothing built
  yet — this is a written proposal awaiting approval before visuals-compose actually builds it.
- 2026-10-24 (gnosis, real fugue) — the sequence+anchor rework was still rejected, hard: "son 2 patrones... no
  genera tensión, no genera espera... es como escuchar 2 repeticiones... entiendes contrapunto, quizá fuga." Real
  diagnosis: Demiurge/canon voices were mirrors or octave-copies of Sophia's own line — never independent material,
  so no amount of varying Sophia alone could produce real counterpoint. Rewritten as an actual fugue: a FIXED
  subject (never regenerated — a real recurring theme), a tonal answer (subject a fifth up), an INDEPENDENT
  countersubject for the Demiurge with complementary rhythm (moves when the subject holds, holds when it moves —
  the actual definition of counterpoint, not parallel motion), modulating entries (the subject re-enters at
  different scale degrees as the piece progresses), episodes built from the subject's own first three notes
  sequenced through a passage (real developmental technique, not new unrelated filler), and stretto (Canon A from
  Density, Canon B from the Density/Transcendence hinge, imitating the subject/answer on a short late() offset —
  genuine overlapping imitation, the real source of climactic density, not more voices playing the same thing).
  Implemented as a block-schedule system (`buildLine(blocks)`): each voice's full 360-cycle part is a list of
  {len, role, deg, oct} blocks (silence when role is omitted) that must sum exactly to the piece's length — this
  made a 20+ event, 4-voice hand-composed timeline tractable and bug-checkable (the inspector either evaluates
  cleanly or doesn't) instead of error-prone manual cycle arithmetic. General rule, the real lesson across all three
  melody rewrites: "repetitive/boring" with real harmonic structure already present almost always means the
  SUPPORTING voices are derived from (not independent of) the lead voice — check that before touching the lead
  voice's own material again.
- 2026-10-24 (deph-studio, cycle guess — the real fix this time) — reported broken a third time: "couldn't guess
  the cycle count" for gnosis-live.strudel. Root cause: the regex scanner was capped at the file's first 4000
  characters (a leftover from before the yaml lookup existed), and the fugue rewrite's longer header comment pushed
  the actual "360 cycles = 12:00 exact" phrase to byte 4133 — just past the cap. Fixed by removing the truncation
  entirely (these files are small; scanning the whole thing costs nothing) and dropping the loose "N cycles"
  fallback regex that used to cause wrong guesses before the yaml lookup existed (now: only the exact "N cycles =
  H:MM exact" phrasing counts, or the field is left blank for the user to fill in — never a confident wrong guess).
  General rule: any string-matching heuristic over a growing file (a header comment, in this case) needs either no
  truncation or a generous, explicitly-justified one — a hardcoded character cap that happened to work once is a
  ticking bug, not a fix, the same class of mistake as a hardcoded array length.
- 2026-10-24 (gnosis, back to pedal — the rule was already written) — the fugue was rejected too: "no puede haber
  muchas notas juntas porque desconcentra... todo tiene que fluir orgánicamente". The subject's wide arch (up to the
  7th and back) and the episodes' ascending/descending note-runs were exactly what "Pedal, not melody" (above, from
  Slow Drift) already forbids — adding density/speed to fix "boring" directly violated an existing rule instead of
  reading it first. Fixed by keeping what was genuinely good (an independent countersubject for the Demiurge, not a
  mirror; modulating entries) while making every line move by step or a third at most, long held notes, no runs —
  and replacing the fugue's stretto (deliberate simultaneous density) with a Shepard tone for Sophia's ascent,
  reusing the proven technique and its lessons from musica-universalis.strudel's "flight" (one chord per 2 cycles,
  never step through degrees quickly — the first attempt there "sonó agarrado de los pelos" at a faster rate). Bass
  and arp now duck out during the flight and return after, giving the accompaniment a real large-scale arc (build,
  peak, release) instead of uniform presence throughout, matching Musica Universalis's own flight-break structure.
  General rule, stated plainly because it had to be repeated: THIS PROJECT'S MEDITATION PIECES NEVER GET MORE
  INTERESTING BY ADDING NOTES, SPEED, OR SIMULTANEOUS DENSITY — interest comes from timbre, register, harmony,
  modulating entries, and slow large-scale devices (Shepard tones, drones, drift) matching "Pedal, not melody" and
  "Sparse and spacious beats dense and busy" above. Read those two lines before any future "boring" fix.
- 2026-10-24 (gnosis, dialogue needed turns and variety, not just fewer notes) — after the pedal/Shepard fix, the
  user's follow-up was sharp and correct: "dónde quedó el contrapunto, dónde quedó el Demiurgo hablando con
  Sofía... se repite todo constantemente... recién al minuto 8 hay un cambio". Simplifying to remove fast notes had
  also (unintentionally) removed real variety and real dialogue: only 2-3 cell shapes recycled by transposition, and
  Sophia/Demiurge often sounded concurrently rather than in legible turns, so the Demiurge read as background
  texture, not a second voice. The fix was never "fewer notes" per se — it was richer casting of the same kind of
  slow, held material. Fixed by giving Sophia five distinct pedal cells and the Demiurge three of his own (narrower,
  lower register — his own character, not her material transposed), and by building ONE shared timeline where the
  two voices take real turns (one is genuinely silent while the other sings), with turns shortening toward Density
  for a livelier exchange without adding notes per turn. Also extended the Shepard from 40 to 70 cycles (user: "el
  Shepard aparece casi al final y se corta") so it fills nearly all of Transcendence and tails into Peace instead of
  stopping at the movement boundary. General rule: "interesting without more notes" has (at least) two independent
  requirements — real material variety (not the same 2-3 shapes recycled) AND legible interaction between voices
  (true turns a listener can follow, not simultaneous independent lines that blur together) — fixing pacing/density
  alone satisfies neither.
- 2026-10-24 (gnosis, Demiurge register) — reported: "el Demiurgo no se termina de entender... está muy grave, se
  pierde en el acompañamiento". Raised his register from octave 2 to 3 (test, per the user's own request) and
  lowered his sub-octave doubling layer (0.6x -> 0.35x) since it was adding extra low-end mass right where the
  bass/sub voices already sit. New range B1-A3, clear of bass's D1-G2 and sub's D1-C2 — the fix is about frequency
  overlap/masking (pitch), not loudness; didn't re-touch his gain multiplier. Awaiting the user's ear on whether
  this alone fixes it or more (gain, timbre) is still needed.
- 2026-10-24 (gnosis, preludio technique) — the user liked the Shepard tone's placement at the climax and asked for
  a second, much quieter and much shorter appearance near the very start — "que entre inconsciente... el que
  escucha queda esperando a que vuelva". A foreshadowing/reprise technique: plant a brief, barely-audible hint of
  the climactic material early so its full return later feels like a fulfillment, not something new. Implemented by
  parameterizing the Shepard generator by cycle count (`shepVoice`/`shepard` now take `cycles` instead of closing
  over a module constant) so one function serves both a 16-cycle preludio (under Sophia's first phrase, ~1/5 the
  loudness, filter mostly closed) and the 70-cycle flight, instead of duplicating the generator. General, reusable
  technique for future pieces: a structural/thematic device meant to feel earned at its main entrance can get a
  quiet, short preview very early — same generator, parameterized by duration/level, not copy-pasted.
- 2026-10-24 (gnosis-live, APPROVED) — after the full iteration (fugue → pedal correction → real dialogue/turns →
  Demiurge register → Shepard preludio), the user confirmed: "esta versión sí está aprobada". Commit 14a577f is the
  approved state of gnosis-live.strudel. The durable lessons from getting here are written up in full in
  strudel-compose (checklist items 8-10: no single-period macro-repetition, depth/restraint are independent axes,
  interest never comes from more notes/speed/density) and in this file's earlier entries — read those before
  starting the next piece, not just this line.
- 2026-10-25 (gnosis, visual direction corrected) — deleted the toroidal-manifold/grounding-rod visual
  (tools/visuals/src/compositions/gnosis/{gnosis.tsx,shaders.ts,timeline.ts}, ~600 lines, 500k-point Clifford torus)
  at the user's explicit request: "lo que está hecho es horrible, borralo". It was built for the old 24:00
  narrative (body as grounding rod), never wired to real audio or registered in the Remotion Root, so deleting it
  broke nothing. The user clarified an earlier ambiguity: when they said "puntos y líneas" they meant the
  drawrange-inspired particle-cloud proposal (two clouds, Demiurge dark/low and Sophia luminous/high, from this
  same session), not the toroidal manifold — don't conflate the two again. Updated the proposal in gnosis.md: since
  gnosis-live.strudel's approved version has the two voices truly alternate (never sound together), the
  connection between clouds is now a travelling pulse timed to each turn, not a static proximity-line (which
  assumed simultaneous sound). The Shepard tone (preludio + flight) gets its own visual device — the deph "creation
  torus" signature, invisible as a shape except during the flight, where an Escher-style endless rotation mirrors
  the audio illusion directly. media/gnosis/visuals/ symlink target recreated as an empty placeholder (with
  .gitkeep) per the project's own convention for an unbuilt visual. Nothing built yet — still a written proposal.
- 2026-10-25 (gnosis, visual proposal — grounded in the real source, not a paraphrase) — "no lees lo que te pedi...
  revisa lo que te había pasado de three.js": the particle-cloud proposal's "connection" mechanism had drifted from
  the real example into a scripted "travelling pulse on cue", which isn't how the real `buffergeometry drawrange`
  example works (re-read directly from source: lines are a pure emergent effect of real per-frame distance between
  freely-moving particles — minDistance threshold, unchanged setDrawRange(0, numConnected*2) — never a scripted
  signal). Corrected: the connection mechanism in the proposal now copies the real distance/drawRange logic
  unmodified; only the particles' velocity is driven by the music (frames.json attracts Sophia's cluster toward the
  Demiurge's during her turns and vice versa), so connections emerge from real proximity the same way the original
  example produces them, instead of being hand-triggered. General rule: when adapting a specific referenced
  technique (an example, a paper, another piece's code), re-read the actual source before finalizing the adaptation
  — a remembered summary drifts, and the drift can replace the technique's actual mechanism with something that
  merely resembles it.
- 2026-10-25 (project-wide, tools vs. pieces — golden rule reversal, not a gnosis-specific fix) — built gnosis's
  first real visual pass (two particle clouds, three.js drawrange connections, Shepard = the integration of the
  two) inside `tools/visuals/src/compositions/gnosis/`, following the then-documented "one exception" in
  `CLAUDE.md`/`visuals-compose` (composition code forced into `tools/` because the bundler couldn't resolve
  `node_modules` from `media/`). The user rejected that exception outright, repeatedly and with no ambiguity:
  "NADA QUEDA EN TOOLS NO HAY EXCEPCION" — `/tools` is the framework, full stop; every piece's own code, Remotion
  included, belongs in `media/<name>/visuals/` as real files. Fixed properly rather than argued with: a single
  `node_modules` symlink at the project root (`ln -s tools/visuals/node_modules node_modules`, git-ignored) lets
  both `tsc` and the Rspack bundler resolve the engine's dependencies via their normal upward directory search
  from anywhere in the repo, including `media/`; `tools/visuals/tsconfig.json` got an explicit `include` covering
  `media/*/visuals/**/*` (it previously had none, which only covered `src/`). Migrated all five existing pieces
  (gnosis, slow-drift, songcord, musica-universalis, the-field) the same day, not just the one being worked on —
  confirmed with `tsc --noEmit` and `npx remotion compositions` after the move, no module-resolution errors.
  Lesson: a "tested, documented exception" from an earlier session is still worth re-opening when the user says
  so — don't defend a past decision just because it was carefully reasoned at the time; the real fix was one
  symlink away and nobody had looked for it since the original test.
