# Uploading to YouTube from the command line

Lets Claude (or the user) upload a finished piece straight to the deph channel instead of doing every
field by hand in Studio — built 2026-10-26 for Gnosis, the first piece uploaded this way. Full workflow
(when to use it, how it fits with `youtube-publish`): the `youtube-upload` skill. This file is the
one-time setup and the technical reference; the skill is the how-to for a new piece.

## One-time setup (already done for this channel; do this again only on a new machine)

1. **A Google Cloud project with the YouTube Data API v3 enabled.** This channel already has one:
   `deph-youtube`, under the channel owner's own Google account (found via `gcloud projects list` after
   confirming `gcloud auth list` was already logged into the right account — it was created by an earlier
   AI-assisted upload tool, not by this project, but it is the user's own project and reusable).
2. **An OAuth 2.0 Client ID on that project**, type "Desktop app" — console.cloud.google.com/apis/credentials,
   pick the project, Create Credentials → OAuth client ID → Desktop app. Copy its `client_id` and
   `client_secret` (visible again later by clicking the credential in Studio, not just at creation time).
3. **Save them** to `~/.config/deph/youtube-credentials.json` (outside the repo — never commit this):
   ```json
   { "project": "deph-youtube", "client_id": "...", "client_secret": "..." }
   ```
4. **Install the two Python dependencies** in a venv — reuse the one already set up at
   `~/.config/deph/youtube-upload/venv`, or make a fresh one:
   ```
   python3 -m venv ~/.config/deph/youtube-upload/venv
   ~/.config/deph/youtube-upload/venv/bin/pip install -r requirements.txt
   ```
5. **Authorize once:** `~/.config/deph/youtube-upload/venv/bin/python3 authorize.py` — opens the browser,
   you sign in with the channel's Google account and approve. YouTube will show "Google hasn't verified
   this app" (the project hasn't passed Google's audit for the upload scope) — click Advanced → Go to
   `gnosis-claude-code` (unsafe) → Allow. This is expected and safe: it's your own app, on your own
   project, uploading to your own channel. Saves the refresh token to `~/.config/deph/youtube-token.json`.

**Known consequence of the unaudited app:** every video this uploads starts **Private**, no matter what
`--privacy` says, until the Cloud project passes Google's audit for the sensitive `youtube.upload` scope
(can take weeks, and isn't something this project controls). This matches the project's own standing rule
anyway ("upload Private first, review, then publish") — just know the privacy flag is currently a formality.

## Per-video usage

```
~/.config/deph/youtube-upload/venv/bin/python3 upload.py media/<name>/renders/<name>.mp4 \
  --title-en "..." --desc-en-file /tmp/<name>-desc-en.txt \
  --title-es "..." --desc-es-file /tmp/<name>-desc-es.txt \
  --thumbnail media/<name>/renders/thumbnails/<name>-thumbnail.jpg \
  --tags "tag1,tag2,tag3"
```

Pulls title/description text from files rather than shell arguments, since descriptions are long and
contain characters shell quoting mangles — write them to scratch files first (the `youtube-publish` pack
already has the exact EN/ES text to copy from).

## What this does and does not do

Does: uploads the video (resumable — safe to resume if interrupted), adds the Spanish title+description
as a **localization on the same video** (never a duplicate upload — this project has been explicit about
that since the first piece), sets the custom thumbnail, leaves it Private.

Does not, because the YouTube Data API v3 has no public write endpoint for any of these (checked
2026-10-26, not a gap in this script): adding the video to the series playlist, setting an end screen,
pinning a comment. These stay manual, in Studio, same as every piece before Gnosis — the `youtube-publish`
pack's checklist still lists them for the user.

## Files

- `authorize.py` — one-time OAuth flow, run manually.
- `upload.py` — the per-video upload, called by the `youtube-upload` skill or directly.
- Credentials and token live outside the repo at `~/.config/deph/` — never in git, never pasted into a
  conversation (the skill always writes them to that file directly, never through chat).
