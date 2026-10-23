#!/usr/bin/env node
// Uploads a finished deph composition (or Short / Educational video) to YouTube using YouTube Data API v3:
//   1. Parses & validates media/<name>/<name>.youtube.md + <name>.yaml
//   2. Uploads the video via resumable upload with progress logging (<video>.upload.jsonl)
//   3. Sets EN default metadata + ES localization (title & description translation) in a single pass
//   4. Uploads the custom 1280x720 thumbnail (thumbnails.set)
//   5. Adds the video to the "deph — generative ambient" playlist (playlistItems.insert)
//   6. Posts the creator's top-level engagement comment (commentThreads.insert)
//   7. Reconciles media/<name>/<name>.yaml with the published status, URL, and date
//
// Safe by default: uploads as `private` unless `--privacy=unlisted|public` or `--publish-at=<ISO>` is given,
// matching deph's checklist ("Upload as Private first; let processing reach 4K and check audio").
//
// Usage:
//   node tools/youtube/publish.mjs <piece-name-or-dir> [--dry-run] [--privacy=private|unlisted|public]
//        [--publish-at=2026-10-25T18:00:00Z] [--video=path/to/file.mp4] [--skip-playlist] [--skip-comment]

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { google } from "googleapis";
import { parseYoutubePack, resolvePieceDir } from "./parse-pack.mjs";
import { getAuthorizedClient } from "./auth.mjs";

const args = process.argv.slice(2);
const targetArg = args.find((a) => !a.startsWith("--"));
const hasFlag = (name) => args.includes(`--${name}`);
const getFlag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

if (!targetArg) {
  console.error(
    "Usage: node tools/youtube/publish.mjs <piece-name-or-dir> [--dry-run] [--privacy=private|unlisted|public] [--publish-at=ISO_DATE] [--video=path.mp4] [--skip-playlist] [--skip-comment]"
  );
  process.exit(1);
}

const dryRun = hasFlag("dry-run");
const privacyStatus = getFlag("privacy") || "private";
const publishAt = getFlag("publish-at"); // ISO 8601, requires privacyStatus="private"
const videoOverride = getFlag("video");
const skipPlaylist = hasFlag("skip-playlist");
const skipComment = hasFlag("skip-comment");
const commentLang = getFlag("comment-lang") || "en"; // "en", "es", or "both"

const pieceDir = resolvePieceDir(targetArg);
const { payload, validation } = parseYoutubePack(pieceDir);

if (videoOverride) {
  payload.videoPath = path.resolve(process.cwd(), videoOverride);
  validation.videoExists = fs.existsSync(payload.videoPath);
}

console.log(`\n=== deph YouTube Deploy · ${payload.name} ===`);
console.log(`Pack:       ${payload.packPath}`);
console.log(`Video:      ${payload.videoPath} (${validation.videoExists ? "FOUND" : "NOT ON DISK"})`);
console.log(`Thumbnail:  ${payload.thumbnailPath} (${validation.thumbExists ? "FOUND" : "NOT ON DISK"})`);
console.log(`Title (EN): ${payload.en.title} (${validation.stats.titleEnChars} chars)`);
console.log(`Title (ES): ${payload.es.title} (${validation.stats.titleEsChars} chars)`);
console.log(`Desc (EN):  ${validation.stats.descEnChars} chars | Desc (ES): ${validation.stats.descEsChars} chars`);
console.log(`Tags (${validation.stats.tagsCount}):  ${validation.stats.tagsChars}/500 chars`);
console.log(`Playlist:   ${skipPlaylist ? "(skipped)" : payload.playlistId}`);
console.log(`Privacy:    ${publishAt ? `scheduled (${publishAt})` : privacyStatus}`);

if (validation.warnings.length > 0) {
  console.log("\nWarnings:");
  for (const w of validation.warnings) console.log(`  ! ${w}`);
}

if (!validation.ok) {
  console.error("\nValidation failed:");
  for (const e of validation.errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

const requestBody = {
  snippet: {
    title: payload.en.title,
    description: payload.en.description,
    tags: payload.tags,
    categoryId: payload.categoryId,
    defaultLanguage: "en",
    defaultAudioLanguage: "en",
  },
  status: {
    privacyStatus: publishAt ? "private" : privacyStatus,
    ...(publishAt ? { publishAt } : {}),
    selfDeclaredMadeForKids: false,
    license: "youtube",
    publicStatsViewable: true,
  },
  ...(payload.es.title && payload.es.description
    ? {
        localizations: {
          es: {
            title: payload.es.title,
            description: payload.es.description,
          },
        },
      }
    : {}),
};

if (dryRun) {
  console.log("\n--- DRY RUN: YouTube Data API v3 Request Body ---");
  console.log(JSON.stringify(requestBody, null, 2));
  console.log("\n--- Post-upload actions that will run in live mode ---");
  console.log(`1. thumbnails.set -> ${payload.thumbnailPath}`);
  if (!skipPlaylist) console.log(`2. playlistItems.insert -> playlistId=${payload.playlistId}`);
  if (!skipComment && payload.en.comment) {
    console.log(`3. commentThreads.insert -> "${payload.en.comment}"`);
  }
  console.log("\n✓ Dry run passed. All YouTube rules verified.");
  process.exit(0);
}

if (!validation.videoExists) {
  console.error(`\n✗ Cannot upload: video file does not exist at ${payload.videoPath}`);
  console.error(`Render it first with: (cd tools/visuals && node render.mjs ${payload.name} ../../media/${payload.name}/renders/${payload.name}.mp4)`);
  process.exit(1);
}

const auth = await getAuthorizedClient();
const youtube = google.youtube({ version: "v3", auth });

const fileSize = fs.statSync(payload.videoPath).size;
const progressPath = payload.videoPath.replace(/\.[^.]+$/, "") + ".upload.jsonl";
fs.writeFileSync(progressPath, "");
const logProgress = (obj) =>
  fs.appendFileSync(progressPath, JSON.stringify({ t: new Date().toISOString(), ...obj }) + "\n");

console.log(`\n1/4 Uploading video (${(fileSize / (1024 * 1024)).toFixed(1)} MB)...`);
console.log(`Progress log: tail -f ${progressPath}`);

const insertRes = await youtube.videos.insert(
  {
    part: ["snippet", "status", "localizations"],
    requestBody,
    media: {
      body: fs.createReadStream(payload.videoPath),
    },
  },
  {
    onUploadProgress: (evt) => {
      const bytes = evt.bytesRead || 0;
      const pct = Math.round((bytes / fileSize) * 1000) / 10;
      logProgress({ stage: "uploading", bytesRead: bytes, fileSize, percent: pct });
      process.stdout.write(`\r  Uploaded: ${(bytes / (1024 * 1024)).toFixed(1)} / ${(fileSize / (1024 * 1024)).toFixed(1)} MB (${pct}%)`);
    },
  }
);

const videoId = insertRes.data.id;
const videoUrl = `https://youtu.be/${videoId}`;
console.log(`\n✓ Video uploaded! ID: ${videoId} -> ${videoUrl}`);
logProgress({ stage: "uploaded", videoId, videoUrl });

// 2. Custom Thumbnail
if (validation.thumbExists) {
  console.log(`2/4 Uploading custom thumbnail (${path.basename(payload.thumbnailPath)})...`);
  try {
    await youtube.thumbnails.set({
      videoId,
      media: {
        body: fs.createReadStream(payload.thumbnailPath),
      },
    });
    console.log("✓ Custom thumbnail set.");
  } catch (err) {
    console.warn(`! Could not set thumbnail via API (${err.message}). Verify phone verification is enabled in YouTube Studio.`);
  }
} else {
  console.log("2/4 Skipping thumbnail (file not found).");
}

// 3. Series Playlist
if (!skipPlaylist && payload.playlistId) {
  console.log(`3/4 Adding video to playlist ${payload.playlistId}...`);
  try {
    await youtube.playlistItems.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          playlistId: payload.playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId,
          },
        },
      },
    });
    console.log("✓ Added to series playlist.");
  } catch (err) {
    console.warn(`! Could not add to playlist (${err.message}).`);
  }
} else {
  console.log("3/4 Skipping playlist insertion.");
}

// 4. Creator Engagement Comment
if (!skipComment && (payload.en.comment || payload.es.comment)) {
  const commentText =
    commentLang === "es"
      ? payload.es.comment
      : commentLang === "both" && payload.en.comment && payload.es.comment
      ? `${payload.en.comment}\n\n—\n\n${payload.es.comment}`
      : payload.en.comment || payload.es.comment;

  console.log(`4/4 Posting creator comment...`);
  try {
    await youtube.commentThreads.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          videoId,
          topLevelComment: {
            snippet: {
              textOriginal: commentText,
            },
          },
        },
      },
    });
    console.log("✓ Comment posted (click 'Pin' in YouTube Studio once public).");
  } catch (err) {
    console.warn(`! Could not post comment yet (note: YouTube API only allows comments on public/unlisted videos; error: ${err.message}).`);
  }
} else {
  console.log("4/4 Skipping comment.");
}

// 5. Update <name>.yaml
if (fs.existsSync(payload.yamlPath)) {
  const doc = YAML.parseDocument(fs.readFileSync(payload.yamlPath, "utf8"));
  const today = new Date().toISOString().slice(0, 10);
  doc.setIn(["publish", "status"], privacyStatus === "public" ? "published" : `uploaded-${privacyStatus}`);
  doc.setIn(["publish", "url"], videoUrl);
  doc.setIn(["publish", "videoId"], videoId);
  doc.setIn(["publish", "published"], today);
  fs.writeFileSync(payload.yamlPath, doc.toString(), "utf8");
  console.log(`✓ Updated ${payload.yamlPath}`);
}

logProgress({ stage: "done", videoId, videoUrl });
console.log(`\nDone! Studio edit link: https://studio.youtube.com/video/${videoId}/edit`);
