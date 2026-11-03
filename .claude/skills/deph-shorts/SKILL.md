---
name: deph-shorts
description: Use when building a short-form vertical clip (YouTube Shorts, Instagram Reels, TikTok) from an already-finished deph composition, using HyperFrames (HTML/CSS/GSAP) rather than Remotion. This is the ONLY place HyperFrames is used in deph — Remotion stays the tool for full-length pieces on the main channel (see visuals-compose). Covers the 1080x1920 canvas convention, where short files live, and how they render to MP4.
---

# deph-shorts

HyperFrames (HTML5 + CSS + GSAP) is scoped in this project to one job only: short, vertical, highlight-length
clips cut from an already-finished piece, for YouTube Shorts / Instagram Reels / TikTok. Full-length pieces on
the deph YouTube channel are Remotion's job (`visuals-compose`) — that pipeline is unrelated to this one and
stays untouched.

## When to build a short

After a full composition is finished and published (sound done, Remotion video rendered and uploaded per
`youtube-publish`). A short is a teaser/highlight, not a first draft of the piece's visual identity.

## Pick a hook angle before writing a word of script — standing rule

A short is not a summary of the piece's concept — it needs a real hook, something that makes a scrolling
viewer stop, or it's just information dumped on screen. Found 2026-10-25 writing Gnosis's first narrated
short: a first draft that opened by just describing the visual ("watch what happens when...") read as flat
("no esta dando jugo", the user's words) — it had no actual hook, just a promise.

**Run the `content-angles` skill before drafting any narrated short's script** — it picks the one angle
the hook is built from (imported 2026-10-26 after this exact gap showed up here). For deph specifically,
`belief-break` is the strongest default (challenge an everyday assumption about sound/meditation/geometry,
then reveal the reframe the piece genuinely demonstrates — see that skill for why and for the other angles
that fit a non-commercial piece).

- Write the hook line(s) first, from the chosen angle, before any of the descriptive/conceptual content —
  the hook is what earns the next 3 seconds, the rest of the script is what earns the full watch and the
  click to the full video.
- End with a subscribe call-to-action tied to the emotional payoff ("if this moved something in you,
  subscribe"), not a bare command — added 2026-10-26 at the user's request, going forward on every
  narrated short.

## Picking the moment

Pick a 15-60 second window from the piece's arc — usually its climax or the single most visually striking
moment (a convergence point, like The Field's Flower of Life at 4:16, or a section transition). Read the
piece's `<name>.md` arc table and `<name>.yaml`'s `arc:` list to find it; don't guess from scrubbing the full
render if the doc already names the moment.

## Canvas and safe zone

- **1080x1920 (9:16), vertical.** Not a crop of the 16:9/4K Remotion canvas — build the composition natively at
  this resolution, since a cropped 4K frame loses the framing a vertical composition needs on its own.
- **Safe zone**, deph's own (not any other project's numbers): top 10% (~192px) clear of UI chrome in the
  Shorts/Reels player, bottom 20% (~384px) reserved for the platform's caption/engagement UI, sides 5% (~54px)
  each. Keep deph's own on-screen branding (if any) inside this zone, consistent with how `tools/visuals/src/brand/`
  keeps channel branding inside a readable, unobstructed area for the main channel.
- Audio: use the piece's existing mastered stem for the chosen window (`sync/audio-master.wav`), trimmed —
  don't re-render or re-master a short window separately.

## Where files live

```
media/<name>/shorts/<name>-short.html     the HyperFrames composition for this short (HTML + CSS + GSAP)
media/<name>/shorts/<name>-short.mp4      the rendered short (git-ignored, regenerable)
```

One short per piece to start; if a piece gets more than one cut, suffix with what makes it distinct
(`<name>-short-climax.html`), never a version number.

## Narrated shorts (ElevenLabs)

A short can carry a spoken voiceover instead of (or alongside) on-screen text — first done for Gnosis,
2026-10-26. `tools/narration/elevenlabs.mjs` (adapted from a working tool in `brandforge-os`, standalone
here) does the text-to-speech: `list` to browse the account's voices, `tts --text "..." --voice "<name>" --out
<path.mp3>`. Needs `ELEVENLABS_API_KEY` in `~/.env` (shared with brandforge-os — already configured with
full account access as of 2026-10-26). The account's voice catalog, with picks that fit deph's calm,
narrative tone, is cached in `tools/narration/voices.md` — read that before calling `list` again.

**Write the script per piece, with the user, before anything else** — see `media/gnosis/gnosis.shorts.md`
for the real back-and-forth that produced one: start generic (no character names/pronouns a 46s clip can't
explain), build toward one grounding technical fact (432 Hz), and never lean on the piece's own internal
vocabulary (e.g. "gold, never white") without re-deriving it in plain language — a new viewer has no other
context. Mix the narration under/over the piece's own mastered audio (ducked while a line plays, up between
lines), never replacing the music outright.

Two of the channel's Shorts exist already (The Field, published via Antigravity from a `brandforge-os`
copy of this project, not this skill), **with full narration and a caption-card system** (a title card, a
karaoke-highlighted phrase caption synced to the voice, a closing CTA card, and a persistent subscribe pill
— corrected 2026-10-26 after actually checking the video frames; an earlier pass of this skill wrongly said
"music only" from reading the YouTube description alone). See `media/the-field/the-field.shorts.md` for the
exact card layout and the published text; there is no source/script to import from that project, only the
finished videos (downloaded locally there as reference, git-ignored) — reverse-engineer the look from the
reference frames if building a caption system for a new Short.

## Structure contract (so the render tool can drive it)

- `#root` with `data-composition-id="<name>-short"`.
- A single GSAP timeline, paused, registered on `window.__timelines[<composition-id>]` — the render tool seeks
  this timeline directly rather than relying on real-time playback, so a render is frame-deterministic.
- No CSS `transform` on anything GSAP also animates (GSAP overwrites the whole `transform` string on every
  tick) — center with flexbox/grid, not `transform: translate(-50%, -50%)`, on any element a tween touches.

## The full narrated-Short pipeline (proven end to end on Gnosis, 2026-10-27 — reusable, not piece-specific)

**Correction (2026-11-03):** an earlier pass of this section said the MP4-muxing step wasn't built yet and
told Claude not to reach for the `hyperframes` CLI. Both were wrong by the time Gnosis's Short actually
shipped: `npx hyperframes render` **is** installed and working in this repo (it fetches on first use, same
as any npx package) and **is** the real rendering engine — it does real hardware-accelerated capture
(`backdrop-filter` glassmorphism, GPU) that a hand-rolled Playwright screenshot loop can't match. The scripts
below were first built hardcoded to Gnosis and have since been **generalized to take `--name <piece>`**, so
building the next Short is a parameter change, not new code — do the same generalization to any future
one-off script found still hardcoded to a single piece's name.

1. **Pick the moment and write the script** — angle from `content-angles`, moment from the piece's own
   `<name>.md` arc table, following the constraints under "Narrated shorts" above. Record the final script,
   angle, and moment in `media/<name>/<name>.shorts.md` (see `media/gnosis/gnosis.shorts.md` for the format).
2. **Crop the background clip**: from the full render, the chosen window, to
   `media/<name>/shorts/<name>-short-bg.mp4` (1080x1920 — crop natively, see "Canvas and safe zone" above).
3. **Narrate**: `node tools/narration/elevenlabs.mjs tts --text "..." --voice "<name>" --out
   media/<name>/shorts/<name>-short-narration-<lang>.mp3` for EN and ES (voice picks in
   `tools/narration/voices.md`).
4. **Mix narration under the piece's own music** for the chosen window: `node tools/shorts/mix-short-audio.mjs
   --name <name> --lang <es|en> --start <sec> --duration <sec>` — crops that window from
   `media/<name>/sync/audio-master.wav` and ducks the narration into it with ffmpeg `sidechaincompress`
   (gain driven by the voice's own level, not a hand-timed envelope — the music ducks under each line and
   recovers in the gaps and after the narration ends, automatically). First built by hand for Gnosis and
   again for Slow Drift before this script existed — always use the script now. Output:
   `media/<name>/shorts/<name>-short-audio-<lang>.wav`.
5. **Master to -14 LUFS / -1.0 dBTP** (YouTube Shorts' own target, not the main pieces' -16 LUFS):
   `python3 tools/shorts/master-short-audio.py media/<name>/shorts/<name>-short-audio-<lang>.wav
   media/<name>/shorts/<name>-short-audio-<lang>-master.m4a
   media/<name>/shorts/hyperframes-<lang>/audio.mp3` (the `.wav` from step 4; `mkdir -p
   media/<name>/shorts/hyperframes-<lang>` first if step 7 hasn't created it yet).
6. **Transcribe the narration for word-level karaoke timing**: `tools/shorts/.venv/bin/python
   tools/shorts/transcribe.py media/<name>/shorts/<name>-short-narration-<lang>.mp3
   media/<name>/shorts/<name>-whisper-words-<lang>.json --lang <es|en>` (same language as the narration, not
   assumed from the filename). Needs `faster-whisper`, in its own venv at `tools/shorts/.venv/` — the
   system's default `python3` (Homebrew's latest, 3.15 as of 2026-11-03) fails building `faster-whisper`'s
   `av` dependency from source; create the venv with an older interpreter instead:
   `/opt/homebrew/bin/python3.11 -m venv tools/shorts/.venv && tools/shorts/.venv/bin/pip install
   faster-whisper` (needs `brew install pkg-config` first if that's also missing). Verify the transcript's
   word count matches the script's (`<script>.trim().split(/\s+/).length`) before building the HyperFrames
   composition — a mismatch misaligns every karaoke highlight after the first gap (step 7's schema note).
7. **Build the HyperFrames composition**: write `media/<name>/shorts/<name>-short.json` (schema below), then
   `node tools/shorts/build-short-hyperframes.mjs --name <name> --all` — writes
   `media/<name>/shorts/hyperframes-<lang>/index.html`, auto-grouping the script's words into 2-line karaoke
   caption cards from the Whisper timings (no hand-authored line-break indices needed, unlike the first,
   Gnosis-only version of this script).
8. **Render**: `npx hyperframes render media/<name>/shorts/hyperframes-<lang>/ --fps 30 --quality delivery
   --output media/<name>/shorts/<name>-short-<lang>.mp4` for each language. **This consumes HyperFrames
   render credits — confirm with the user before running it**, same caution as any paid API call.
9. **Cover**: `tools/shorts/generate-hyperframes-covers.mjs` (see the "Short Covers & Thumbnails Standard"
   section below and the `shorts-cover` skill for the exact spec).

`<name>-short.json` schema (per-lang strings the build script reads):
```json
{
  "durationSeconds": 46,
  "es": { "script": "...", "openingLabel": "...", "openingTitle": "...", "openingSub": "...",
          "closingLabel": "...", "closingTitle": "...", "closingSub": "...", "subscribeText": "SUSCRIBIRSE" },
  "en": { "script": "...", "openingLabel": "...", "openingTitle": "...", "openingSub": "...",
          "closingLabel": "...", "closingTitle": "...", "closingSub": "...", "subscribeText": "SUBSCRIBE" }
}
```
`script` must be the exact words spoken, in order, matching the Whisper transcript 1:1 in word count — a
mismatch silently misaligns every karaoke highlight after the first gap.

The original, Gnosis-hardcoded scripts (`build-gnosis-hyperframes.mjs`, `transcribe-es.py`,
`master-shorts-audio.py`) are left in `tools/shorts/` as the historical record of what was actually run for
Gnosis — don't extend them further; extend the generalized `build-short-hyperframes.mjs` /
`transcribe.py` / `master-short-audio.py` instead. `render-shorts.mjs` and `capture-frame.mjs` (an earlier,
simpler Playwright-screenshot render path, superseded by `npx hyperframes render`) are likewise historical.

## Verification

Before calling a short done: capture 2-3 frames across its duration and look at them (logo/branding not
clipped, safe zone respected, text legible), the same way `visuals-compose` verifies a full render. Check the
final MP4's resolution is exactly 1080x1920 and its audio matches the chosen window (no drift at the cut
points).

## Short Covers & Thumbnails Standard (The Field Template)

YouTube Shorts thumbnails require a standard 16:9 canvas (1280x720) for desktop search, playlists, and external embeds, while mobile feeds crop to the central 9:16 vertical pillar.

### Anatomy of the Short Cover:
1. **Canvas (1280x720)**: Background is the clean 9:16 video frame scaled up to 1280x2275, centered, cropped to 1280x720, with Gaussian blur (`radius: 35px`) and 40% brightness to create the lateral wings.
2. **Center Pillar (405x720)**: High-resolution crisp 9:16 vertical crop of the piece's peak sacred geometry / visual moment (`gnosis-short-bg.mp4`), centered horizontally (`x: 437.5 to 842.5`).
3. **Brand Pill (Top)**:
   - Capsule at `y ≈ 180`, height 32px, `background: rgba(11, 14, 26, 0.75)`, border `1px solid rgba(127, 212, 245, 0.40)`.
   - Ring icon (4 concentric circles in cyan `#7FD4F5`).
   - Text: `DEPH · {NN}` in uppercase bold sans.
4. **Editorial Glass Card (Center)**:
   - Rounded rectangle (`border-radius: 18px`, width 330px, height 145px) at `y ≈ 230`.
   - Glassmorphism: `background: rgba(11, 14, 26, 0.65)`, border `1.5px solid rgba(168, 85, 247, 0.35)`, inner top bevel highlight.
   - **Category Badge**: `• {TOPIC} · 432 HZ` in cyan `#7FD4F5`, uppercase, letter-spacing `0.15em`.
   - **Hook Title**: Editorial question/title in bold white `#FFFFFF`, uppercase, 2 lines max, tracking `0.02em`.
   - **Divider Line**: 34px wide, 2px high, `#7FD4F5`.
   - **Subtitle**: Sub-topic in lilac `#A5B4FC`, uppercase, letter-spacing `0.12em`.
5. **CRITICAL GOLDEN RULE**: Never include spoken dialogue subtitles, transcriptions, or karaoke highlight cards on the cover image. The cover is an editorial brand poster, not a dialogue frame.

### Generator Script: `generate-short-covers.mjs` — the one real layout, same on every piece's cover

`tools/shorts/generate-short-covers.mjs --name <piece> --series <NN> [--at <seconds>] [--lang es|en|all]`
produces `media/<name>/shorts/thumbnails/<name>-short-cover-<lang>.jpg`. Generalized 2026-11-03 from what
was first hardcoded as `generate-hyperframes-covers.mjs` for Gnosis — **its exact layout (not the
coordinate table above, which this section originally described as the standard but the real shipped
Gnosis cover never actually matched)**: top brand pill at Y:350 (not Y:220), hook card at Y:480 width
860px (not Y:740 width 920px), **no bottom headphones pill at all**. The user corrected this directly
(2026-11-03, building Slow Drift's cover): every piece's cover must look like the same channel, so a new
cover copies Gnosis's actual coordinates byte-for-byte rather than re-deriving a design from the
coordinate table above — **treat `generate-short-covers.mjs`'s own CSS as the one source of truth going
forward**, and if it ever needs to change, change it there once, not per piece.

Reads `media/<name>/shorts/<name>-short.json` for each language's `openingTitle` (the card's headline),
`openingSub` (the card's subtitle) and a `coverTopic` field (e.g. `"FRACTAL"` — the one-word badge
category; add this field to the short's config json, it's not inferred), and the short's own
`<name>-short-bg.mp4` for the background frame (`--at` picks which second, default 20s in). No subscribe
button — a cover is a static editorial poster, never a video frame with interactive UI (the golden rule
from the coordinate spec above still holds, even though its exact pixel numbers were superseded).

