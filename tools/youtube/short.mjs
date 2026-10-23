#!/usr/bin/env node
// Generates and optionally uploads promotional YouTube Shorts (9:16 vertical, 1080x1920 @ 60fps)
// from an existing deph composition (`media/<name>/shorts/<name>.shorts.md`).
// All Short packs and rendered `.mp4` files live inside `media/<name>/shorts/`.
//
// Supports TWO rendering modes (as requested by the user):
//   1. `--mode=ffmpeg` (fast crop from the existing 4K render `media/<name>/renders/<name>.mp4` + Remotion brand overlay,
//      with 1.2s audio/video fade-in and 1.8s fade-out at -14 LUFS)
//   2. `--mode=remotion` (native Remotion render of `<name>-short` using `tools/visuals/render.mjs` with `ShortPromo.tsx`)
//   3. `--mode=auto` (default: uses `ffmpeg` if the 4K `.mp4` is on disk, otherwise falls back to `remotion`)
//
// Also supports `--upload` (or `--dry-run`) to publish the Short directly to YouTube with EN + ES localizations.
//
// Usage:
//   node tools/youtube/short.mjs <piece> [--clip=01|all] [--mode=auto|ffmpeg|remotion] [--dry-run] [--upload] [--privacy=private|unlisted|public]

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { google } from "googleapis";
import { resolvePieceDir, DEFAULT_PLAYLIST_ID } from "./parse-pack.mjs";
import { getAuthorizedClient } from "./auth.mjs";
import { generateVoiceover, DEFAULT_VOICE_ID } from "../voice/tts.mjs";

const args = process.argv.slice(2);
const targetArg = args.find((a) => !a.startsWith("--"));
const hasFlag = (name) => args.includes(`--${name}`);
const getFlag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

if (!targetArg) {
  console.error(
    "Usage: node tools/youtube/short.mjs <piece> [--clip=01|all] [--mode=auto|ffmpeg|remotion] [--dry-run] [--upload] [--privacy=private|unlisted|public]"
  );
  process.exit(1);
}

const clipSelector = getFlag("clip") || "01";
const modeArg = getFlag("mode") || "auto";
const langArg = (getFlag("lang") || "en").toLowerCase(); // Default: English ("en")
const dryRun = hasFlag("dry-run");
const doUpload = hasFlag("upload");
const privacyStatus = getFlag("privacy") || "private";

const pieceDir = resolvePieceDir(targetArg);
const pieceName = path.basename(pieceDir);
const shortsDir = path.join(pieceDir, "shorts");
fs.mkdirSync(shortsDir, { recursive: true });
const shortsMdPath = fs.existsSync(path.join(shortsDir, `${pieceName}.shorts.md`))
  ? path.join(shortsDir, `${pieceName}.shorts.md`)
  : path.join(pieceDir, `${pieceName}.shorts.md`);

if (!fs.existsSync(shortsMdPath)) {
  console.error(`Missing Shorts pack: ${path.join(shortsDir, `${pieceName}.shorts.md`)}. Run the shorts-compose skill first.`);
  process.exit(1);
}

const shortsData = parseShortsPack(shortsMdPath, pieceDir);
const selectedClips =
  clipSelector === "all"
    ? shortsData.clips
    : shortsData.clips.filter((c) => c.id === clipSelector || c.slug === clipSelector || c.id === `0${clipSelector}`);

if (selectedClips.length === 0) {
  console.error(`No clip matching "${clipSelector}" found in ${shortsMdPath}. Available clips: ${shortsData.clips.map((c) => c.id).join(", ")}`);
  process.exit(1);
}

const master4kPath = path.join(pieceDir, "renders", `${pieceName}.mp4`);
const has4kMaster = fs.existsSync(master4kPath);
const effectiveMode = modeArg === "auto" ? (has4kMaster ? "ffmpeg" : "remotion") : modeArg;

for (const clip of selectedClips) {
  const outMp4 = path.join(shortsDir, `${pieceName}-short-${clip.id}.mp4`);
  console.log(`\n=== deph Short · ${pieceName} [${clip.id}: ${clip.label}] ===`);
  console.log(`Window:     ${formatSec(clip.startSeconds)} -> ${formatSec(clip.startSeconds + clip.durationSeconds)} (${clip.durationSeconds}s)`);
  console.log(`Hook:       "${clip.hookText}"`);
  console.log(`Subtext:    "${clip.subText || ""}"`);
  console.log(`Title (EN): ${clip.titleEn} (${clip.titleEn.length} chars)`);
  console.log(`Title (ES): ${clip.titleEs} (${clip.titleEs.length} chars)`);
  console.log(`Language:   ${langArg.toUpperCase()} (default EN on-screen & primary metadata + ES localization)`);
  console.log(`Mode:       ${effectiveMode} ${modeArg === "auto" ? `(4K master ${has4kMaster ? "present" : "not on disk"})` : ""}`);
  console.log(`Output:     ${outMp4}`);
  if (clip.script) {
    console.log(`Script:     "${clip.script.slice(0, 75)}${clip.script.length > 75 ? "..." : ""}" (${clip.script.length} chars)`);
  }

  // Handle voiceover synthesis & captions if script is present
  if (clip.script) {
    const voiceAudioPath = path.join(shortsDir, `${pieceName}-short-${clip.id}-voice.mp3`);
    const captionsPath = path.join(shortsDir, `${pieceName}-short-${clip.id}-captions.json`);

    if (!dryRun) {
      if (!fs.existsSync(voiceAudioPath) || !fs.existsSync(captionsPath) || hasFlag("regen-voice")) {
        await generateVoiceover({
          text: clip.script,
          voiceId: clip.voice?.voiceId || DEFAULT_VOICE_ID,
          outAudioPath: voiceAudioPath,
          outCaptionsPath: captionsPath,
        });
      }

      const publicDir = path.resolve(pieceDir, "..", "..", "tools", "visuals", "public");
      fs.mkdirSync(publicDir, { recursive: true });
      const publicVoiceFile = `${pieceName}-short-${clip.id}-voice.mp3`;
      fs.copyFileSync(voiceAudioPath, path.join(publicDir, publicVoiceFile));

      const captionsData = JSON.parse(fs.readFileSync(captionsPath, "utf8"));
      clip.props.voiceAudio = publicVoiceFile;
      clip.props.captions = captionsData.words;
    } else {
      clip.props.script = clip.script;
      clip.props.voiceAudio = `${pieceName}-short-${clip.id}-voice.mp3`;
      if (fs.existsSync(captionsPath)) {
        const captionsData = JSON.parse(fs.readFileSync(captionsPath, "utf8"));
        clip.props.captions = captionsData.words;
      }
    }
  }

  if (dryRun) {
    console.log("\n--- DRY RUN: Short Props & YouTube Metadata ---");
    console.log(
      JSON.stringify(
        {
          remotionComposition: `${pieceName}-short`,
          props: clip.props,
          youtube: {
            titleEn: clip.titleEn,
            titleEs: clip.titleEs,
            descriptionEn: clip.descriptionEn,
            descriptionEs: clip.descriptionEs,
            tags: shortsData.tags,
            privacyStatus,
          },
        },
        null,
        2
      )
    );
    continue;
  }

  // Render the Short
  if (effectiveMode === "ffmpeg") {
    if (!has4kMaster) {
      console.error(`✗ --mode=ffmpeg requires ${master4kPath} on disk. Use --mode=remotion or render the 4K master first.`);
      process.exit(1);
    }
    renderShortWithFfmpeg(clip, master4kPath, outMp4);
  } else {
    renderShortWithRemotion(pieceName, clip, outMp4);
  }

  // Optional upload to YouTube
  if (doUpload) {
    await uploadShortToYoutube(clip, shortsData, outMp4, privacyStatus);
  }
}

function renderShortWithFfmpeg(clip, inputMp4, outputMp4) {
  // 4K input is 3840x2160. A 9:16 slice at full 2160 height is 1215x2160, scaled cleanly to 1080x1920.
  const shiftPx = Math.round((clip.props.bgShift || 0) * 3840);
  const cropX = Math.max(0, Math.min(3840 - 1215, Math.round((3840 - 1215) / 2 + shiftPx)));
  const dur = clip.durationSeconds;
  const fadeOutStart = Math.max(1, dur - 1.8).toFixed(2);

  const vf = [
    `crop=1215:2160:${cropX}:0`,
    `scale=1080:1920:flags=lanczos`,
    `fade=t=in:st=0:d=1.2`,
    `fade=t=out:st=${fadeOutStart}:d=1.8`,
    `format=yuv420p`,
  ].join(",");

  const af = [`afade=t=in:st=0:d=1.2`, `afade=t=out:st=${fadeOutStart}:d=1.8`].join(",");

  console.log(`\nCutting 9:16 Short via FFmpeg from 4K master...`);
  const res = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-ss",
      String(clip.startSeconds),
      "-t",
      String(dur),
      "-i",
      inputMp4,
      "-vf",
      vf,
      "-af",
      af,
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-colorspace",
      "bt709",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "bt709",
      "-c:a",
      "aac",
      "-b:a",
      "256k",
      "-ar",
      "48000",
      "-movflags",
      "+faststart",
      outputMp4,
    ],
    { stdio: "inherit" }
  );

  if (res.status !== 0) {
    throw new Error(`FFmpeg failed with exit code ${res.status}`);
  }
  console.log(`✓ Short rendered (FFmpeg): ${outputMp4}`);
}

function renderShortWithRemotion(piece, clip, outputMp4) {
  const visualsDir = path.resolve(pieceDir, "..", "..", "tools", "visuals");
  const propsPath = outputMp4.replace(/\.mp4$/, ".props.json");
  fs.writeFileSync(propsPath, JSON.stringify(clip.props, null, 2), "utf8");

  console.log(`\nRendering native 9:16 Short via Remotion (${piece}-short)...`);
  const res = spawnSync(
    "node",
    ["render.mjs", `${piece}-short`, outputMp4, `--props=${propsPath}`],
    { cwd: visualsDir, stdio: "inherit" }
  );
  if (res.status !== 0) {
    throw new Error(`Remotion render failed with exit code ${res.status}`);
  }
  console.log(`✓ Short rendered (Remotion): ${outputMp4}`);
}

async function uploadShortToYoutube(clip, pack, videoFile, privacy) {
  const auth = await getAuthorizedClient();
  const youtube = google.youtube({ version: "v3", auth });
  const fileSize = fs.statSync(videoFile).size;

  const requestBody = {
    snippet: {
      title: clip.titleEn,
      description: clip.descriptionEn,
      tags: pack.tags,
      categoryId: "10",
      defaultLanguage: "en",
      defaultAudioLanguage: "en",
    },
    status: {
      privacyStatus: privacy,
      selfDeclaredMadeForKids: false,
      license: "youtube",
      publicStatsViewable: true,
    },
    ...(clip.titleEs && clip.descriptionEs
      ? {
          localizations: {
            es: {
              title: clip.titleEs,
              description: clip.descriptionEs,
            },
          },
        }
      : {}),
  };

  console.log(`\nUploading Short to YouTube (${(fileSize / (1024 * 1024)).toFixed(1)} MB)...`);
  const res = await youtube.videos.insert(
    {
      part: ["snippet", "status", "localizations"],
      requestBody,
      media: { body: fs.createReadStream(videoFile) },
    },
    {
      onUploadProgress: (evt) => {
        const bytes = evt.bytesRead || 0;
        const pct = Math.round((bytes / fileSize) * 1000) / 10;
        process.stdout.write(`\r  Uploaded: ${(bytes / (1024 * 1024)).toFixed(1)} MB (${pct}%)`);
      },
    }
  );
  const videoId = res.data.id;
  console.log(`\n✓ Short uploaded! https://youtube.com/shorts/${videoId}`);
  console.log(`  Studio link (link Related Video here): https://studio.youtube.com/video/${videoId}/edit`);
}

export function parseShortsPack(mdPath, pieceDir) {
  const md = fs.readFileSync(mdPath, "utf8");
  const jsonBlocks = [...md.matchAll(/```json\s+short-clip\n([\s\S]*?)```/g)];
  const clips = jsonBlocks.map((m) => JSON.parse(m[1]));

  const tagsMatch = md.match(/\*\*Tags:\*\*\s*([^\n]+)/i);
  const tags = tagsMatch
    ? tagsMatch[1]
        .split(",")
        .map((t) => t.trim().replace(/\.$/, ""))
        .filter(Boolean)
    : ["ambient music", "meditation music", "432 hz", "binaural beats", "generative music", "shorts"];

  return { clips, tags, pieceDir };
}

function formatSec(s) {
  const m = Math.floor(s / 60);
  const rem = Math.floor(s % 60);
  return `${m}:${String(rem).padStart(2, "0")}`;
}
