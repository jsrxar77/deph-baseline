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
