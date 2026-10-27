#!/usr/bin/env python3
"""Upload a YouTube Short to the channel as a Private video.

Handles localized shorts (e.g. ES and EN as separate videos), setting:
- title with #Shorts
- description
- tags
- language (e.g. es, en)
- category: 10 (Music)
- privacyStatus: private (mandatory, so user reviews before publishing)
"""
import argparse
import json
import os
import ssl
import sys
import time

import httplib2
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

RETRYABLE = (ssl.SSLError, ConnectionError, BrokenPipeError, TimeoutError, httplib2.HttpLib2Error, OSError)
MAX_RETRIES = 10

HOME = os.path.expanduser("~")
TOKEN_PATH = os.path.join(HOME, ".config/deph/youtube-token.json")


def get_service():
    if not os.path.exists(TOKEN_PATH):
        sys.exit(f"No token at {TOKEN_PATH} — run authorize.py once first.")
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
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("video_path", help="Path to the short mp4")
    p.add_argument("--title", required=True, help="Title of the Short")
    p.add_argument("--desc-file", required=True, help="Path to text file containing the description")
    p.add_argument("--language", default="en", help="Language code (e.g. es, en)")
    p.add_argument("--tags", default="", help="Comma-separated tags")
    p.add_argument("--category", default="10", help="YouTube category ID (10=Music)")
    p.add_argument("--privacy", default="private", choices=["private", "unlisted", "public"])
    args = p.parse_args()

    if not os.path.exists(args.video_path):
        sys.exit(f"Video not found: {args.video_path}")

    yt = get_service()
    description = read_file(args.desc_file)
    tags = [t.strip() for t in args.tags.split(",") if t.strip()]

    body = {
        "snippet": {
            "title": args.title,
            "description": description,
            "tags": tags,
            "categoryId": args.category,
            "defaultLanguage": args.language,
        },
        "status": {
            "privacyStatus": args.privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    size_mb = os.path.getsize(args.video_path) / (1024 * 1024)
    print(f"Uploading {args.video_path} ({size_mb:.1f} MB)...")
    print(f"Title: {args.title}")
    print(f"Language: {args.language} | Privacy: {args.privacy}")

    media = MediaFileUpload(args.video_path, mimetype="video/mp4", resumable=True, chunksize=25 * 1024 * 1024)
    request = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    response = None
    retries = 0

    while response is None:
        try:
            status, response = request.next_chunk()
            retries = 0
        except RETRYABLE as e:
            retries += 1
            if retries > MAX_RETRIES:
                raise
            wait = min(2 ** retries, 60)
            print(f"  transient error ({e.__class__.__name__}: {e}), retrying chunk in {wait}s (attempt {retries}/{MAX_RETRIES})...")
            time.sleep(wait)
            continue
        except HttpError as e:
            if e.resp.status in (500, 502, 503, 504):
                retries += 1
                if retries > MAX_RETRIES:
                    raise
                wait = min(2 ** retries, 60)
                print(f"  server error {e.resp.status}, retrying chunk in {wait}s (attempt {retries}/{MAX_RETRIES})...")
                time.sleep(wait)
                continue
            raise
        if status:
            print(f"  Progress: {int(status.progress() * 100)}%")

    video_id = response["id"]
    print(f"\nUpload complete!")
    print(f"Video ID: {video_id}")
    print(f"Watch URL: https://youtube.com/shorts/{video_id}")
    print(f"Studio URL: https://studio.youtube.com/video/{video_id}/edit")
    print(f"Status: {response.get('status', {}).get('privacyStatus', args.privacy)}")

    return video_id


if __name__ == "__main__":
    main()
