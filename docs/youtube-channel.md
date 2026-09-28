# deph — YouTube channel: positioning and standing copy

Channel-wide material used by every publish pack (`media/<name>/<name>.youtube.md`, built by the
`youtube-publish` skill). Written once here so each video reuses the same voice. Items marked
`TODO(user)` are facts or decisions only the user can supply — nothing here has been published yet.

## What we are building (and what we are looking for with it)

**deph** ("deep phase") publishes generative ambient pieces where sound and image are made from the same
idea: music written as code (Strudel) and a fractal visual (Remotion) that follows the piece — its arc,
its energy, and each bell as it sounds. Every piece is a slow, spacious, beat-less journey meant for
meditation, focus, or quiet listening.

What we are aiming for:
- **A recognizable identity**, found gradually: the same calm, spacious sound (see the `deph-style`
  skill), a shared visual palette ("Deep Decay"), a consistent title pattern and footer.
- **An audience that stays.** Retention over clicks: honest titles, a real hook in the first 30 seconds,
  no promise the video does not keep.
- **A body of work, not one-offs.** Each piece is a distinct composition with its own key, arc and
  fractal, released as a series so viewers know what to expect.
- **Technical honesty as a differentiator.** Tuning (A = 432 Hz), binaural layers and generative
  methods are stated as facts, with no health claims — see `youtube-publish` for the rules.

## Audience and search intent (initial hypothesis, to be tested with real analytics)

People who search for ambient/meditation music to meditate, study or work, or to wind down; people curious
about generative music and code-made art; listeners who follow 432 Hz and binaural-beat content.
Primary phrases: "ambient meditation music", "432 Hz music", "binaural beats", "generative ambient",
"música para meditar". Language: English for reach, Spanish as a translation (see decisions below).

## Channel description (draft)

**EN**
> deph — deep phase. Generative ambient music and fractal visuals for meditation, focus and quiet moments.
> Every piece is composed as code and rendered as sound and image together: no drums, no fixed beat, slow
> arcs built from loops that keep recombining. Tuned to A = 432 Hz; some pieces include a subtle binaural layer (best
> with headphones). This is music, not medical advice. New pieces are released as a series.

**ES**
> deph — deep phase. Música ambient generativa y visuales fractales para meditar, concentrarte y
> disfrutar del silencio. Cada pieza se compone como código y se renderiza como sonido e imagen a la vez:
> sin batería, sin pulso fijo, con arcos lentos hechos de bucles que se recombinan constantemente. Afinada a A = 432 Hz;
> algunas piezas incluyen una capa binaural sutil (mejor con auriculares). Es música, no consejo médico.
> Las nuevas piezas se publican como serie.

## Standard description footer (paste at the end of every description, before hashtags)

**EN**
> This is music, not medical advice or treatment. Binaural layers work only with headphones.
> deph — generative ambient music and fractal visuals. New pieces in the series: TODO(user: playlist link)
> Channel: https://www.youtube.com/channel/UC1cFX0dl77im5F5V-RRi6hA

**ES**
> Esto es música, no consejo ni tratamiento médico. Las capas binaurales solo funcionan con auriculares.
> deph — música ambient generativa y visuales fractales. Más piezas de la serie: TODO(user: enlace a la lista)
> Canal: https://www.youtube.com/channel/UC1cFX0dl77im5F5V-RRi6hA

## Recurring hashtags and title pattern

- Core set (pick 3 to 6 per video): `#ambientmusic` `#meditationmusic` `#432hz` `#binauralbeats`
  `#generativemusic` `#fractal`. Add a Spanish one (`#meditar`) only if the primary audience is Spanish.
- Title pattern: `<Piece> — <Ambient meditation music> | <432 Hz + Binaural Beats> | <Fractal Visual>`
  (about 80-90 characters; drop the binaural part on pieces without that layer).
- Series/playlist name: "deph — generative ambient".

## Upload defaults (per video)

Category **Music**; **not** made for kids; standard license; comments on; language of the video: none
(instrumental) or English for metadata; "altered or synthetic content" question: **No** (abstract,
non-realistic — see `youtube-publish`); add the second language as a title/description translation; add
the video to the series playlist; end screen in the last 20 seconds.

## Channel facts

- Channel URL: https://www.youtube.com/channel/UC1cFX0dl77im5F5V-RRi6hA
- **Primary language: English**, with Spanish added as a translation (title, description and, when it is
  written, the channel description). Reason: the highest-volume search phrases for this niche ("ambient
meditation music", "432 Hz", "binaural beats") are English, and YouTube shows each viewer the translation
  that matches their language. Decided by Claude on 2026-09-23 at the user's request.

## Channel setup in YouTube Studio (proposal, 2026-09-24 — not applied until the user approves)

Where: Studio > Customization > Profile / Branding / Layout, and Settings. Rules below were checked in YouTube
Help on 2026-09-24 unless marked otherwise.

- **Channel name (proposed): `deph — generative ambient`** (brand first, then what it is, so a new visitor and
  search both understand it; short alternative: `deph`). Changing the name later is limited (2 changes per
  14 days), removes a verification badge, and translations must be deleted before renaming — so choose it once.
- **Handle (proposed): `@deph`**; fallbacks if taken: `@deph_music`, `@deph.ambient`, `@dephambient`. Rules: 3-30
  characters; letters, numbers, `_` `-` `.` (no separator at the start or end); unique; case-insensitive; not
  URL- or phone-like; it becomes `youtube.com/@handle` (2 changes per 14 days).
- **Description:** the EN/ES text above (the "invitation, not a promise" wording), added as a translation for
  Spanish (Studio supports translating the channel name and description). The exact character limit of this
  field is not in the help pages (about 1,000 is remembered, unverified); the draft is about 550.
- **Links** (up to 14 on the Home tab): the series playlist, the first video, and any social profile;
  `TODO(user)`. **Contact email** for business inquiries: `TODO(user)`.
- **Profile picture (made):** `docs/youtube-channel/avatar.jpg`, 800x800. Built from the user's own illustrated
  portrait (`channels4_profile.jpg`, left untouched) as the Remotion composition `deph-avatar`
  (`tools/visuals/src/brand/ChannelAvatar.tsx`). The face is kept (only a light soft focus; the expression is not
  changed — no image generator here) and the **original blue/purple torus background is replaced by the Slow Drift
  fractal** in the Deep Decay palette (slightly defocused, darkened, with a soft dark halo behind the head), so the
  channel image shares the videos' visual language. The head, hair, ears, neck and collar are cut out with
  `tools/visuals/public/deph-avatar-mask.png`, generated from the portrait by
  `tools/visuals/scripts/make-avatar-mask.mjs` (colour-based cutout: the background is bluish, the figure is warm,
  grey or near black; the face area is forced as figure because a bluish rim light on the left ear matches the
  background colour). Source copy for Remotion: `tools/visuals/public/deph-avatar-source.jpg`. Checked inside
  YouTube's circular crop. Re-render: `node scripts/make-avatar-mask.mjs` (only if the portrait changes) then
  `npx remotion still deph-avatar --output=../../docs/youtube-channel/avatar.jpg`, from `tools/visuals/`.
  **Chosen by the user on 2026-09-24: the fractal-background version** (`avatar.jpg`). A plain black background was
  tried as an alternative and not chosen; its file and composition were removed.
- **Profile picture (earlier proposal):** the creation-torus mark — four concentric rings (3/6/9/12) in the Deep Decay palette on
  obsidian `#050508`; simple enough to read at avatar size. **Banner:** a wide fractal frame from a piece with
  "deph — generative ambient" small in the centre safe area. Banner rules (YouTube Help): minimum 2048x1152,
  recommended 2560x1440 (TV), 6 MB or less, text/logos inside the 1235x338 safe area at the minimum size.
  Profile picture size and video watermark size were not confirmed in the help pages: check the hint Studio
  shows when uploading (800x800 and 150x150 are remembered, unverified).
- **Banner file (made):** `docs/youtube-channel/banner.jpg`, 2560x1440, about 0.9 MB. It is the Remotion composition
  `deph-banner` (`tools/visuals/src/brand/ChannelBanner.tsx`): a frame of the Slow Drift fractal at 5:00 (chosen
  because no bell pulse is active there), darkened softly in the middle, with `deph` and `GENERATIVE AMBIENT`
  in Avenir Next inside the safe area. Re-render: `npx remotion still deph-banner --output=../../docs/youtube-channel/banner.jpg`
  from `tools/visuals/`. Upload it in Studio > Customization > Branding.
- **Layout:** channel trailer (shown once to non-subscribers): Slow Drift until a 30-60 s trailer exists;
  featured video for returning subscribers: the latest upload; sections (up to 12; the default has Shorts,
  Uploads, Created playlists, Subscriptions): keep Uploads and the series playlist, drop Shorts if unused.
- **Upload defaults** (Settings > Upload defaults): category Music, not made for kids, standard license, comments
  on, and the standard description footer pasted as the default description (remembered feature, not verified
  here). Phone-verify the account so custom thumbnails and longer uploads are enabled (remembered, not verified).

## Links to show on the channel (recommendation, 2026-09-24)

YouTube allows up to 14 links on the Home tab; fewer, live links look more careful. Start with:
1. **Series playlist** "deph — generative ambient" (title: *All pieces*) — create it in Studio before the first upload.
2. **GitHub repo** `https://github.com/jsrxar77/deph-baseline` (title: *The code (Strudel + Remotion)*) — fits the
   code-made identity; place it after the playlist. The repo is **public** (checked 2026-09-24 through the GitHub API), has
   no description; the commits are pushed. An English `README.md` now exists (2026-09-24, not pushed until the user
   approves). Still to do on GitHub itself (Settings > About, which Claude cannot set without a token): description
   *Generative ambient music and fractal visuals, made as code (Strudel + Remotion)* and website = the channel URL.
Not as links: the contact email (use the profile's contact field); social profiles that will not be kept up; link
shorteners; anything selling health products. Future: Spotify / Apple Music / Bandcamp once a distributor is set up
(the Slow Drift master is ready for it).

## Open decisions for the user

- **Playlist link and other links** (the `TODO(user)` items above); channel name and handle as shown on YouTube.
- **Channel description** (About): in progress, waiting on the user's answers — see the conversation of 2026-09-23.
- **Transparency line: resolved 2026-09-28 — yes, disclose.** Every "ABOUT THE MAKING" / "SOBRE LA CREACIÓN"
  section names the AI assistant (Claude) alongside Strudel and Remotion, e.g. "built in collaboration with an
  AI assistant (Claude)" / "construido en colaboración con un asistente de IA (Claude)". Not required by YouTube
  for this kind of content (see `youtube-publish`'s AI-disclosure rule), but the user chose to state it anyway.
- **Piece length strategy:** keep short pieces (Slow Drift is 6:08), or also deliver longer arrangements.
- **Publishing cadence** and whether to premiere videos.
