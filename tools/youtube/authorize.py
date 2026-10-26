#!/usr/bin/env python3
"""One-time OAuth authorization for uploading to the deph YouTube channel. Run this once per machine (or
again only if the token is revoked); after it succeeds, upload.py reuses the saved token forever.

Needs ~/.config/deph/youtube-credentials.json first — a Google Cloud OAuth client (Desktop app type) on
a project with the YouTube Data API v3 enabled. See tools/youtube/README.md for exactly how to get this
(the project `deph-youtube`, already created under the channel owner's Google account, already has the
API enabled — this script does not create the Cloud project, only the local refresh token).

  { "project": "deph-youtube", "client_id": "...", "client_secret": "..." }

Writes the refresh token to ~/.config/deph/youtube-token.json (chmod 600). Never prints the client
secret or the token.
"""
import json
import os

from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

HOME = os.path.expanduser("~")
CREDS_PATH = os.path.join(HOME, ".config/deph/youtube-credentials.json")
TOKEN_PATH = os.path.join(HOME, ".config/deph/youtube-token.json")
SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]

if not os.path.exists(CREDS_PATH):
    raise SystemExit(f"No credentials at {CREDS_PATH} — see tools/youtube/README.md.")

with open(CREDS_PATH) as f:
    creds_data = json.load(f)

client_config = {
    "installed": {
        "client_id": creds_data["client_id"],
        "client_secret": creds_data["client_secret"],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost"],
    }
}

flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
print("Opening your browser to authorize — sign in with the channel's Google account.")
creds = flow.run_local_server(port=0, open_browser=True, prompt="consent")

with open(TOKEN_PATH, "w") as f:
    f.write(creds.to_json())
os.chmod(TOKEN_PATH, 0o600)

yt = build("youtube", "v3", credentials=creds)
resp = yt.channels().list(part="snippet", mine=True).execute()
channel = resp["items"][0]["snippet"]["title"] if resp.get("items") else "(no channel found)"
print(f"\nAuthorized for channel: {channel}")
print(f"Token saved to: {TOKEN_PATH}")
