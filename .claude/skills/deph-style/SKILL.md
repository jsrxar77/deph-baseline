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
