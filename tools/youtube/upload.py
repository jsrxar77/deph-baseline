#!/usr/bin/env python3
"""Upload a finished deph piece to YouTube: the video (resumable, always starts Private), the Spanish
title+description as a translation on the SAME video (never a duplicate upload), and the custom thumbnail.

What this does NOT do, because the YouTube Data API has no public endpoint for them (confirmed 2026-10-26,
not a choice made lightly — see tools/youtube/README.md): adding the video to the series playlist, setting
an end screen, pinning a comment. Those stay manual steps in Studio, same as every piece before this one.

Credentials: reads ~/.config/deph/youtube-credentials.json (client_id/client_secret, from the deph-youtube
Google Cloud project) and ~/.config/deph/youtube-token.json (the refresh token from the one-time
`python3 authorize.py` run). Both are outside the repo, gitignored by location, never printed.

Usage:
  python3 upload.py <video_path> \
    --title-en "..." --desc-en-file desc_en.txt \
    --title-es "..." --desc-es-file desc_es.txt \
    --thumbnail path/to/thumbnail.jpg \
    --tags "tag1,tag2,tag3" \
    [--privacy private|unlisted|public] [--category 10]

privacy defaults to "private" — always upload private first, exactly like every manual upload before this
one, so the user reviews it in Studio before making it public themselves.
"""
import argparse
import json
import os
import sys

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

HOME = os.path.expanduser("~")
TOKEN_PATH = os.path.join(HOME, ".config/deph/youtube-token.json")


def get_service():
    if not os.path.exists(TOKEN_PATH):
        sys.exit(f"No token at {TOKEN_PATH} — run authorize.py once first (see tools/youtube/README.md).")
    creds = Credentials.from_authorized_user_file(TOKEN_PATH)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_PATH, "w") as f:
            f.write(creds.to_json())
        os.chmod(TOKEN_PATH, 0o600)
    return build("youtube", "v3", credentials=creds)


def read_file(path):
    with open(path, encoding="utf-8") as f:
        return f.read().strip()


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("video_path")
    p.add_argument("--title-en", required=True)
    p.add_argument("--desc-en-file", required=True)
    p.add_argument("--title-es")
    p.add_argument("--desc-es-file")
    p.add_argument("--thumbnail")
    p.add_argument("--tags", default="")
    p.add_argument("--category", default="10")  # 10 = Music
    p.add_argument("--privacy", default="private", choices=["private", "unlisted", "public"])
    args = p.parse_args()

    if not os.path.exists(args.video_path):
        sys.exit(f"Video not found: {args.video_path}")

    yt = get_service()
    description_en = read_file(args.desc_en_file)
    tags = [t.strip() for t in args.tags.split(",") if t.strip()]

    body = {
        "snippet": {
            "title": args.title_en,
            "description": description_en,
            "tags": tags,
            "categoryId": args.category,
            "defaultLanguage": "en",
        },
        "status": {
            "privacyStatus": args.privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    print(f"Uploading {args.video_path} ({os.path.getsize(args.video_path) / 1e9:.2f} GB)...")
    media = MediaFileUpload(args.video_path, mimetype="video/mp4", resumable=True, chunksize=50 * 1024 * 1024)
    request = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"  {int(status.progress() * 100)}%")
    video_id = response["id"]
    print(f"Uploaded. Video ID: {video_id}  https://studio.youtube.com/video/{video_id}/edit")

    if args.title_es and args.desc_es_file:
        description_es = read_file(args.desc_es_file)
        # Localizations live on the SAME video (a translation of title+description), never a second upload —
        # this is the one rule the project has been explicit about since the first piece.
        yt.videos().update(
            part="localizations",
            body={"id": video_id, "localizations": {"es": {"title": args.title_es, "description": description_es}}},
        ).execute()
        print("Added Spanish title/description as a translation.")

    if args.thumbnail:
        if not os.path.exists(args.thumbnail):
            print(f"Warning: thumbnail not found at {args.thumbnail}, skipped.")
        else:
            yt.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(args.thumbnail)).execute()
            print("Thumbnail set.")

    print(json.dumps({"video_id": video_id, "studio_url": f"https://studio.youtube.com/video/{video_id}/edit",
                       "watch_url": f"https://youtu.be/{video_id}"}, indent=2))
    print("\nStill manual, in YouTube Studio: add to the series playlist, end screen, pin the comment, "
          "then switch from Private to Public when ready.")


if __name__ == "__main__":
    main()
