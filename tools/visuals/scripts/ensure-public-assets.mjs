#!/usr/bin/env node
// Every composition's public/*.wav and public/*-frames.json / *-analysis.json are git-ignored (large/regenerable
// audio; JSON copies of what's already tracked in media/<name>/sync/ — see CLAUDE.md), so any fresh checkout, or
// any session where a piece's real render/copy hasn't landed in public/ yet, hits the same failure in Remotion
// Studio: a 404 on `getAudioDurationInSeconds()`, or a blank/black composition because a `fetch(staticFile(...))`
// for its frames/analysis JSON 404s and the promise never resolves. This recurred four times in one session
// (2026-10-25, renamed from the audio-only ensure-public-audio.mjs once the same problem showed up for JSON too)
// before it got fixed at the root instead of per-file — see the `visuals-compose` skill's "Before opening Studio"
// section. This script finds every quoted `.wav`/`.json` filename any composition's code actually references, and
// for each one missing from public/:
//   - a `.json` is always copied straight from that piece's own sync/ (these are small, tracked, and either exist
//     or the render genuinely hasn't been done yet — never placeholder-synthesized, since fabricated event data
//     would silently misrepresent the piece);
//   - a `.wav` is copied from sync/ if the real render exists there, or — if it doesn't — synthesized as a silent
//     placeholder of the right duration so Studio can at least preview the picture, with a clear WARNING so a
//     placeholder is never mistaken for the real thing.
//
// Run before every `remotion studio` (wired into `npm run dev` as a pre-step) — never a manual, easy-to-forget step.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const VISUALS_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PROJECT_ROOT = dirname(dirname(VISUALS_ROOT));
const PUBLIC_DIR = join(VISUALS_ROOT, "public");
const MEDIA_DIR = join(PROJECT_ROOT, "media");

function collectReferences() {
  const names = new Set();
  // Any quoted .wav/.json literal, not just inside a direct staticFile(...) call — some pieces pass the filename
  // as a prop (audioSrc="songcord-youtube.wav") to a shared component that calls staticFile() on the variable,
  // which a staticFile-only regex can't resolve. Broader but simpler, and still correct: a quoted .wav/.json
  // string anywhere in this codebase names a real public asset.
  const re = /["'`]([\w.-]+\.(?:wav|json))["'`]/g;
  const roots = [join(MEDIA_DIR), join(VISUALS_ROOT, "src")];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "public" || entry.name.startsWith(".")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        const text = readFileSync(full, "utf8");
        for (const m of text.matchAll(re)) names.add(m[1]);
      }
    }
  };
  for (const root of roots) walk(root);
  return [...names].sort();
}

// `<name>-whatever.ext` -> `<name>`, matching this project's one-piece-one-name-stem convention.
const pieceOf = (filename) => {
  const base = filename.replace(/\.(wav|json)$/, "");
  const parts = base.split("-");
  // Composition names are themselves hyphenated (musica-universalis, slow-drift, the-field), so find the longest
  // prefix that is an actual media/<name>/ folder rather than assuming "one word before the last hyphen".
  for (let i = parts.length - 1; i >= 1; i--) {
    const candidate = parts.slice(0, i).join("-");
    if (existsSync(join(MEDIA_DIR, candidate))) return candidate;
  }
  return null;
};

function realAudioSourceFor(piece) {
  const syncDir = join(MEDIA_DIR, piece, "sync");
  for (const candidate of ["audio-master.wav", "audio.wav"]) {
    const p = join(syncDir, candidate);
    if (existsSync(p)) return p;
  }
  return null;
}

// `slow-drift-frames.json` -> media/slow-drift/sync/frames.json (the public copy's own suffix, stripped of the
// piece's name, is exactly the sync/ filename — see CLAUDE.md's "Video keyframes" section).
function realJsonSourceFor(piece, filename) {
  const suffix = filename.slice(piece.length + 1); // drop "<piece>-"
  const p = join(MEDIA_DIR, piece, "sync", suffix);
  return existsSync(p) ? p : null;
}

function durationSecondsFor(piece) {
  const manifestPath = join(MEDIA_DIR, piece, "sync", "manifest.json");
  if (existsSync(manifestPath)) {
    try {
      const m = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (typeof m.durationSeconds === "number") return m.durationSeconds;
    } catch {}
  }
  const analysisPath = join(MEDIA_DIR, piece, "sync", "analysis.json");
  if (existsSync(analysisPath)) {
    try {
      const a = JSON.parse(readFileSync(analysisPath, "utf8"));
      if (typeof a?.meta?.duration_s === "number") return a.meta.duration_s;
    } catch {}
  }
  const yamlPath = join(MEDIA_DIR, piece, `${piece}.yaml`);
  if (existsSync(yamlPath)) {
    const text = readFileSync(yamlPath, "utf8");
    const cpm = text.match(/cpm:\s*(\d+(?:\.\d+)?)/);
    const total = text.match(/total_cycles:\s*(\d+)/);
    if (cpm && total) return (Number(total[1]) * 60) / Number(cpm[1]) + 6; // +6s: render.mjs's default --tail
  }
  return null;
}

function makeSilence(outPath, seconds) {
  mkdirSync(dirname(outPath), { recursive: true });
  execFileSync("ffmpeg", [
    "-y", "-f", "lavfi", "-i", `anullsrc=channel_layout=stereo:sample_rate=48000`,
    "-t", String(seconds), "-c:a", "pcm_s16le", outPath,
  ], { stdio: ["ignore", "ignore", "ignore"] });
}

function main() {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  const needed = collectReferences();
  let placeholders = 0;
  let copied = 0;
  let missing = 0;
  for (const filename of needed) {
    const dest = join(PUBLIC_DIR, filename);
    if (existsSync(dest)) continue;
    const piece = pieceOf(filename);
    if (!piece) {
      console.warn(`[ensure-public-assets] WARNING: can't tell which composition "${filename}" belongs to — skipped.`);
      continue;
    }
    if (filename.endsWith(".json")) {
      const real = realJsonSourceFor(piece, filename);
      if (real) {
        execFileSync("cp", [real, dest]);
        console.log(`[ensure-public-assets] copied: ${filename} <- ${real.replace(PROJECT_ROOT + "/", "")}`);
        copied++;
      } else {
        console.warn(`[ensure-public-assets] WARNING: ${filename} has no source at media/${piece}/sync/ — ` +
          `that piece's render/keyframes haven't been generated yet. Not fabricated.`);
        missing++;
      }
      continue;
    }
    const real = realAudioSourceFor(piece);
    if (real) {
      execFileSync("cp", [real, dest]);
      console.log(`[ensure-public-assets] copied real render: ${filename} <- ${real.replace(PROJECT_ROOT + "/", "")}`);
      copied++;
      continue;
    }
    const seconds = durationSecondsFor(piece) ?? 180;
    makeSilence(dest, seconds);
    console.warn(`[ensure-public-assets] WARNING: ${filename} is a SILENT PLACEHOLDER (${seconds.toFixed(0)}s) — ` +
      `no real render found at media/${piece}/sync/. Studio will preview the picture with no sound.`);
    placeholders++;
  }
  if (copied === 0 && placeholders === 0 && missing === 0) {
    console.log("[ensure-public-assets] all composition assets already present in public/ — nothing to do.");
  } else {
    console.log(`[ensure-public-assets] done: ${copied} copied, ${placeholders} placeholder(s), ${missing} missing (no source yet).`);
  }
}

main();
