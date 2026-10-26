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

## Rendering

`tools/shorts/capture-frame.mjs` (Playwright + headless Chromium) loads the HTML at 1080x1920 and seeks the
registered GSAP timeline to screenshot one frame — this is the piece that's actually built and tested (against
a trivial fixture, not a real composition's 4K assets) as of 2026-10-24:

```
node tools/shorts/capture-frame.mjs media/<name>/shorts/<name>-short.html --seconds 2.5 --out frame.png
```

**What's NOT built yet**: full frame-by-frame capture assembled into an MP4 with the audio stem muxed in
(ffmpeg). That's the next step before this pipeline can actually produce `<name>-short.mp4` — don't claim a
short is rendered until that part exists and has been run. Extending `capture-frame.mjs` into a `render.mjs`
that loops over every frame at the short's fps, screenshots each, and muxes with the trimmed audio via ffmpeg
(same approach `tools/sounds/render.mjs`/`frames.mjs` use for the Strudel side, applied to a browser canvas
instead of an audio engine) is the natural next step.

Do not reach for the `hyperframes` CLI mentioned in `.agents/skills/hyperframes-video` — that skill describes a
different project's toolchain (a `clients/<client>/assets/reels/` layout, a `tools/render-hyperframes.mjs` that
doesn't exist here, and a CLI that isn't installed in this repo). This skill and `tools/shorts/` are deph's own,
built from scratch for deph's own layout.

## Verification

Before calling a short done: capture 2-3 frames across its duration and look at them (logo/branding not
clipped, safe zone respected, text legible), the same way `visuals-compose` verifies a full render. Check the
final MP4's resolution is exactly 1080x1920 and its audio matches the chosen window (no drift at the cut
points).
