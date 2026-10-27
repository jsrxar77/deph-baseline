#!/usr/bin/env node
/**
 * tools/shorts/render.mjs
 * Renders a HyperFrames short (HTML/CSS/GSAP) over a base video + audio stem.
 * Captures transparent overlay frames via headless Chromium at target fps,
 * then muxes with ffmpeg into the final MP4 (1080x1920).
 *
 * Usage:
 *   node tools/shorts/render.mjs <short.html> --video <base.mp4> --audio <audio.m4a> --out <short.mp4> [--fps 30]
 */
import { chromium } from "playwright";
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const flags = { fps: 30 };
  let file;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const k = argv[i].slice(2);
      flags[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    } else if (!file) {
      file = argv[i];
    }
  }
  return { file, flags };
}

const { file, flags } = parseArgs(process.argv.slice(2));
if (!file || !flags.video || !flags.audio || !flags.out) {
  console.error("Usage: node tools/shorts/render.mjs <short.html> --video <bg.mp4> --audio <audio.m4a> --out <output.mp4> [--fps 30]");
  process.exit(1);
}

const fps = Number(flags.fps) || 30;
const duration = 46.0;
const totalFrames = Math.round(duration * fps);

const executablePath = process.env.CHROMIUM_PATH ||
  "/Users/javier/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell";

const tmpFramesDir = `/tmp/short-render-${Date.now()}`;
fs.mkdirSync(tmpFramesDir, { recursive: true });

console.log(`Starting render for ${file}`);
console.log(`Duration: ${duration}s, FPS: ${fps}, Total frames: ${totalFrames}`);

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`file://${path.resolve(file)}`);

const startT = Date.now();
for (let i = 0; i < totalFrames; i++) {
  const t = i / fps;
  await page.evaluate((time) => {
    const timelines = window.__timelines || {};
    const first = Object.values(timelines)[0];
    if (first && typeof first.seek === "function") first.seek(time);
  }, t);

  const framePath = path.join(tmpFramesDir, `frame_${String(i).padStart(5, "0")}.png`);
  await page.screenshot({ path: framePath, omitBackground: true });

  if (i % 150 === 0 || i === totalFrames - 1) {
    const pct = ((i / (totalFrames - 1)) * 100).toFixed(0);
    const elapsed = ((Date.now() - startT) / 1000).toFixed(1);
    console.log(`  [${pct}%] Frame ${i}/${totalFrames} (t=${t.toFixed(2)}s, elapsed: ${elapsed}s)`);
  }
}

await browser.close();
console.log(`Captured ${totalFrames} frames in ${((Date.now() - startT) / 1000).toFixed(1)}s`);

console.log(`Muxing with ffmpeg into ${flags.out}...`);
const ffmpegCmd = [
  "ffmpeg -y -loglevel error",
  `-i "${path.resolve(flags.video)}"`,
  `-framerate ${fps} -i "${tmpFramesDir}/frame_%05d.png"`,
  `-i "${path.resolve(flags.audio)}"`,
  `-filter_complex "[0:v][1:v]overlay=0:0[vout]"`,
  `-map "[vout]" -map 2:a`,
  `-c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p`,
  `-c:a copy -shortest`,
  `"${path.resolve(flags.out)}"`
].join(" ");

execSync(ffmpegCmd);

// Cleanup frames
fs.rmSync(tmpFramesDir, { recursive: true, force: true });
console.log(`✓ Finished rendering ${flags.out}`);
