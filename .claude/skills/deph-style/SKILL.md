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
  hold a first-time listener without diluting the climax's arrival.

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
- Spanish in conversation; docs and code comments in English.

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
- 2026-09-24 — Channel banner made from the piece itself (`DephBanner`, fractal at 5:00 + `deph` / `GENERATIVE AMBIENT`
  in Avenir Next, inside YouTube's safe area) so the channel image is the same visual language as the videos —
  brand images live in `docs/youtube-channel/` — `docs/youtube-channel.md`.
- 2026-09-24 — Profile picture: keep the user's illustrated portrait and its softened face, and replace its original
  blue/purple torus background with the Slow Drift fractal (portrait cut out with a colour-based mask) — first try
  (defocused, tinted original background) was rejected: "the face is fine, but I want a background more in line with
  what we are doing"; the expression can't be changed without an image generator — `docs/youtube-channel.md`,
  `DephAvatar`, `make-avatar-mask.mjs`.
- 2026-09-24 — Profile picture variant with a plain black background (`avatar-black.jpg`) alongside the fractal one — the
  user asked to try black instead of the fractal; final choice pending — `docs/youtube-channel.md`.
- 2026-09-24 — Video thumbnail made in Remotion (`DephThumbnailSlowDrift`): fractal frame, dark gradient on the left, heavy
  **SLOW DRIFT** + **432 Hz · BINAURAL** — no thumbnail-generation skill exists, so thumbnails follow the same
  code-made approach as the banner and avatar; checked at sidebar size — `slow-drift.youtube.md`, `youtube-publish`.
- 2026-09-24 — Thumbnail template fixed for every piece: the user liked the original typeface (Avenir Next Bold) and asked
  for the extras seen in the six-font comparison (Optima, Didot, Futura, Copperplate, DIN Alternate, Menlo — none chosen):
  brand chip with the ring mark + series number, cyan rule, facts line, headphones cue, empty bottom-right for YouTube's
  duration badge — so all covers look alike with a recognizable touch — `youtube-publish`, `VideoThumbnail.tsx`.

## Entry template

```
- YYYY-MM-DD — <decision> — <what the user said / what was measured> — <file or skill where it lives>
```
Also update the distilled sections above if the decision changes a principle, and move items out of
"Open questions" when they are resolved.
