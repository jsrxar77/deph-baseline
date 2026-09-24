---
name: youtube-publish
description: Use whenever a deph composition has (or is about to have) a finished video, or the user mentions publishing, YouTube, upload, title, description, hashtags, tags, thumbnail or the channel. Builds and maintains the composition's YouTube publish pack (titles, description, chapters, tags, hashtags, thumbnail brief, pinned comment, upload checklist, in the channel's languages) as media/<name>/<name>.youtube.md, with claims that stay honest and inside YouTube's rules. Expert playbook for meditative/ambient music posts.
---

# Publishing a deph piece on YouTube

Every finished composition gets a **publish pack**, kept next to it: `media/<name>/<name>.youtube.md`
(tracked in git). Channel-wide material (positioning, channel description, standard footer, recurring
hashtags, open decisions) lives once in `docs/youtube-channel.md`. Read that file first, and reuse it — do not
re-derive the channel voice per video. Slow Drift's pack, `media/slow-drift/slow-drift.youtube.md`, is the
worked example.

Build the pack **whenever a video is rendered** (and refresh it whenever the video, arc or sound changes):
timestamps, duration and technical facts must match the current render. Track it in the composition's yaml
under `domains.publish` (`status`: `planned` / `in-progress` / `ready` / `published`). The user decides
what to publish and when; Claude never uploads anything.

## What a pack contains (in this order)

1. **Titles** — 2 candidates per language, each with its character count. Lead with the piece name, then the
   primary search phrase ("ambient meditation music"), then the facts that differentiate ("432 Hz + Binaural
   Beats"). About 100 characters is the ceiling; only roughly the first 60 show on mobile, so the phrase
   people search must come early. No clickbait, no ALL CAPS shouting, no emojis needed.
2. **Description** — the first two lines are what shows before "Show more": make them a complete, honest
   pitch (what it is, length, "best with headphones"). Then: what you will hear/see (the arc), the technical
   facts, **chapters**, a headphone note, a short disclaimer, the channel blurb, then hashtags at the end.
3. **Chapters** — computed from the composition yaml's `arc` and `tempo` (never typed by hand). Rules
   (YouTube Help): first timestamp `0:00`, at least three, ascending, each chapter at least 10 seconds.
4. **Hashtags** — 3 to 6, put at the end of the description. YouTube shows up to three next to the title
   (it picks the most engaging of those in the description) and **ignores all hashtags on a video that has
   more than 60**, so more is never better. Prefer the ones people actually browse: genre + purpose +
   technique.
5. **Tags** — few (a dozen), and only real descriptions of the video: variants, common misspellings,
   Spanish equivalents. YouTube says tags matter little for discovery (title, thumbnail and description matter
   more) and that adding *excessive* tags violates its spam policy. Never tag other artists' names or
   unrelated popular topics.
6. **Thumbnail brief** — 1280x720 (16:9, minimum width 640), JPG/PNG/GIF, **under 2 MB**. Use real frames from
   the render (`npx remotion still <Id> --frame=N --scale=0.66667 --output=...jpg` gives exactly 1280x720)
   and list which candidate is recommended and why; the text overlay (piece name, one short fact) is added
   by the user in a design tool, keep it to a few large words.
   **The deph thumbnail template (standard for every piece, decided with the user on 2026-09-24):**
   `tools/visuals/src/brand/VideoThumbnail.tsx`, 1280x720. Fixed on every cover, so the series is recognizable:
   top-left brand chip (the four-ring creation-torus mark + "deph" + series number, e.g. `deph · 01`); the piece
   title in **Avenir Next Bold**, uppercase, one word per line, white, large (170 px); a short cyan rule; one line
   of verifiable facts in cyan (e.g. `432 Hz · BINAURAL`); bottom-left a headphones icon + `HEADPHONES · GENERATIVE
   AMBIENT`; a dark gradient on the left over a frame of the piece's own fractal; the **bottom-right corner left
   empty** (YouTube draws the video-length badge there). What changes per piece: `lines`, `facts`, `series`
   (increment it), and `momentSeconds` (pick a frame with a bold shape and no active bell pulse). Render with
   `npx remotion still DephThumbnailSlowDrift --props='{"lines":["New","Piece"],"facts":"...","series":"02","momentSeconds":120}'
   --output=../../media/<name>/renders/thumbnails/<name>-thumbnail.jpg`. The composition is registered per piece in
   `tools/visuals/src/Root.tsx` and imports that piece's visualizer (today Slow Drift's); when a second piece exists,
   register its own id with its own visualizer rather than reusing this one. Always check the result at about
   168 px wide (sidebar size): title and facts must stay legible (the small bottom line is a secondary layer).
   Do not change the font or layout per piece — consistency is the point; change the template once, for all.
7. **Pinned comment**, **playlist / series name**, **translations** (add the second language as a title +
   description translation inside the same video in YouTube Studio, not as a duplicate upload).
8. **Upload checklist** and the **open decisions** for the user (see below).

## Honesty rules (these protect the channel, and are also the house style)

- **State 432 Hz and binaural beats as technical facts, never as effects.** "Tuned to A = 432 Hz" and
  "a binaural layer (10 Hz easing down to 4 Hz), best with headphones" are true and checkable. Do **not**
  write that they heal, cure, treat anxiety/insomnia/pain, "raise vibration", balance chakras, or improve
  brain state — the evidence for those claims is not good, and YouTube restricts medical claims. Always
  include a one-line "this is music, not medical advice" disclaimer when the piece is presented for
  meditation or relaxation.
- **Don't promise what the video does not deliver** (misleading titles, descriptions or thumbnails violate
  YouTube's spam / deceptive-practices policy). E.g. do not title a 6-minute piece "1 Hour". State the real
  length. If the piece is generative, say so; if it is synthesized (no samples), it can say so.
- **Influences** (e.g. Brian Eno's tape-loop pieces) may appear once, in the description body, as an
  influence — never in the title or tags, where an artist's name would read as misleading.
- **AI disclosure:** YouTube asks creators to disclose *realistic* altered or synthetic content (a real person
  saying something they did not, altered real footage, a realistic scene that did not happen). Abstract,
  clearly non-realistic content such as a mathematical fractal and synthesized music does not require it, so
  the "altered or synthetic content" question is answered **No** for these pieces. Whether to mention in the
  description that code and tools (Strudel, Remotion, an AI assistant) were used to make it is a
  transparency choice for the user, listed as an open decision — never decided silently.

## Facts to take from the project (never invent)

Key and tuning (`<name>.deph.yaml`, `<name>.md`), arc and section lengths, voices, the binaural beat
schedule, loudness of the master, video length and resolution, visuals description. If a fact is not in the
project, leave a `TODO(user)` rather than guessing (channel URL, social links, publish date).

## Rules verified against YouTube Help on 2026-09-23 (re-verify before relying on them)

- Hashtags: up to 3 shown by the title; more than 60 on a video => all ignored
  (support.google.com/youtube/answer/6390658).
- Chapters: first at 00:00, at least 3 timestamps, ascending, minimum 10 s each
  (support.google.com/youtube/answer/9884579).
- Thumbnails: 1280x720 recommended, min width 640, JPG/GIF/PNG, under 2 MB, 16:9
  (support.google.com/youtube/answer/72431).
- Tags: minor impact on discovery; excessive tags violate the spam policy
  (support.google.com/youtube/answer/146402).
- Altered/synthetic content disclosure: only for realistic content
  (support.google.com/youtube/answer/14328491).
- **Not verified in the help pages** (well known, Studio enforces them, check the fields if unsure): title
  about 100 characters, description about 5,000 characters, tags about 500 characters in total.
Use WebSearch restricted to `support.google.com` to re-check anything else, and update this list.

## Strategy notes for meditative/ambient uploads

- **Retention decides reach.** The first 30 seconds matter most: Slow Drift's early pad entry and cold-open
  bell were added for this. Put the strongest visual moment in the thumbnail, not a generic frame.
- **Length is a positioning choice.** Many meditation viewers search for long videos; a 6-minute piece is a
  different product from a 1-hour one. Don't fake length; if longer versions are wanted, compose or arrange
  them deliberately (an open decision, not a default).
- **Series consistency builds a recognizable channel:** same title pattern ("<Piece> — <what it is> | <facts>"),
  same footer, same palette on thumbnails, consistent hashtag set from `docs/youtube-channel.md`.
- Watch after publishing: average view duration and the retention curve (do listeners drop where the sparse
  bells begin?), click-through rate of the thumbnail, and which search terms bring viewers. Record what is
  learned in `deph-style` so the next piece starts from it.

## The pack file: template

```
# <Piece> — YouTube publish pack   (status: draft | ready | published; last updated YYYY-MM-DD)
Source video: media/<name>/renders/<name>.mp4 (<duration>, <resolution>, <LUFS>) | Verified against: <render date>

## Titles (EN / ES, with character counts)         ## Description (EN, ES)
## Chapters                                          ## Hashtags / Tags
## Thumbnail brief (+ candidate files)               ## Pinned comment / playlist / translations
## Upload checklist                                  ## Open decisions (TODO for the user)
```

## After publishing

Set `domains.publish.status: published`, add the URL and date to the pack and yaml, and add a `deph-style`
log entry with anything learned (what performed, what to change next time).
