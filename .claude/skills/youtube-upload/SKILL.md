---
name: youtube-upload
description: Use once a piece's youtube-publish pack and final render are ready and the user asks to upload, publish, or actually put the video on YouTube (not just prepare the text/thumbnail). Uploads the video, the Spanish title/description as a translation on the same video, and the thumbnail, straight from the terminal via the YouTube Data API — always Private first, for the user to review before they publish. Built 2026-10-26 for Gnosis, the first piece uploaded this way; everything before it was uploaded by hand in Studio.
---

# Uploading a finished piece to YouTube

This is the last step after `youtube-publish` has built `media/<name>/<name>.youtube.md` and the final
render exists. It automates the parts the YouTube Data API actually supports; the rest stays manual, same
as every piece before Gnosis.

## Before using this: confirm the render is actually clean

**A render built by chunking (`render-chunked.sh`, used when a 12-minute 4K render runs the Mac out of
disk/RAM) can have small defects at the seams between chunks** — found 2026-10-26 on Gnosis: an audible
audio click at each chunk boundary, and ~15 video frames missing from the final concatenated file (43545
instead of 43560), even after redoing the splice. The root cause was never fully isolated; the fix that
actually worked was a full re-encode (`ffmpeg -c:v libx264 -preset veryfast -crf 20 ... -fps_mode cfr`,
muxed with the *original, unsplit* master audio, not any chunk's own encode) from the chunked output —
not another attempt at a lossless splice. `preset veryfast` finishes a 12-minute 4K re-encode in about
25 minutes on this machine; `preset slow` does not finish in any reasonable time (it was still only 4
minutes in after 3 hours and had to be killed — confirmed, not assumed). If a piece was rendered in
chunks, always re-encode the concatenated file once before upload and verify frame count and a few
splice-point timestamps, rather than trusting the stream-copied concat.

## One-time setup

Already done for this channel (`tools/youtube/README.md` has the full detail — project, OAuth client,
venv, the one-time browser authorization). Check `~/.config/deph/youtube-token.json` exists before
assuming it's ready; if not, that README walks through it, and it needs the user's own Google login in a
browser, not something to do silently.

## Running it

1. **Pull the exact EN/ES title and description text from the piece's own `<name>.youtube.md`** — never
   retype or re-derive it; that file is the source of truth the user already reviewed once.
2. **Write the EN and ES descriptions to scratch files** (shell-quoting a multi-paragraph description with
   hashtags and a pinned-comment-style footer is error-prone; files are not):
   ```
   write_file /tmp/<name>-desc-en.txt   # from the pack's EN description, footer and hashtags included
   write_file /tmp/<name>-desc-es.txt   # same, ES
   ```
3. **Run the upload:**
   ```
   ~/.config/deph/youtube-upload/venv/bin/python3 tools/youtube/upload.py media/<name>/renders/<name>.mp4 \
     --title-en "<EN title #1 from the pack>" --desc-en-file /tmp/<name>-desc-en.txt \
     --title-es "<ES title #1 from the pack>" --desc-es-file /tmp/<name>-desc-es.txt \
     --thumbnail media/<name>/renders/thumbnails/<name>-thumbnail.jpg \
     --tags "<comma-separated tags from the pack>"
   ```
   This can take a while for a multi-GB 4K file (resumable — safe to rerun if it drops partway). It
   prints the video ID and the Studio edit URL, and always leaves the video **Private**.
4. **Tell the user the Studio URL and that it's Private**, and that YouTube may show the video as
   "Processing" for a while before 4K playback is available — this is the same "upload Private, let it
   process, then review" pattern every earlier piece followed by hand, just automated up to this point.

## What's still manual, every time, and why

The YouTube Data API v3 has no public write endpoint for these (checked 2026-10-26) — not a choice, a
real API gap:
- **Adding the video to the series playlist** ("deph — generative ambient"). `docs/youtube-channel.md`
  is also explicit that Claude never touches the channel's own structures like this — the user does it in
  Studio.
- **The end screen** (last ~20 s): no API surface for end screen elements at all.
- **Pinning a comment**: posting a comment is possible via the API, but there's no public field to pin it;
  pin it in Studio after the comment is posted (post it yourself, by hand, as every pack already asks).

Leave these as checked-when-done items for the user in the pack's existing "Upload checklist" section —
don't mark them done, and don't attempt to script around the API gap (e.g. browser automation) without
the user asking for that specifically.

## Never upload without the user's go-ahead on the final render

The video stays Private either way (the app isn't Google-audited yet), but "upload" is still a real,
outward action — confirm the render is final and the user has said to proceed before calling `upload.py`,
same as any other irreversible-feeling step in this project.
