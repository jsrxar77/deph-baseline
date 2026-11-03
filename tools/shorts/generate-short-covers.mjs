#!/usr/bin/env node
// tools/shorts/generate-short-covers.mjs
//
// Generalized version of what was first built one-off as generate-hyperframes-covers.mjs (Gnosis-only,
// kept as-is). Renders the native 1080x1920 vertical cover for a Short, per the shorts-cover skill's
// spec: top brand pill (DEPH · series), center glass card (topic badge, hook title, divider, subtitle),
// bottom headphones pill — and, per that skill's golden rule, NEVER a subscribe button (the cover is a
// static editorial poster, not a video frame with interactive UI).
//
// Usage:
//   node tools/shorts/generate-short-covers.mjs --name <piece> --series <NN> [--at <seconds>] [--lang es|en|all]
//   node tools/shorts/generate-short-covers.mjs --name slow-drift --series 01
//
// Reads media/<name>/shorts/<name>-short.json for each language's openingLabel/openingTitle/openingSub/
// coverTopic, and media/<name>/shorts/<name>-short-bg.mp4 for the background frame.
// Writes media/<name>/shorts/thumbnails/<name>-short-cover-<lang>.jpg
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const k = argv[i].slice(2);
      flags[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    }
  }
  return flags;
}

const args = parseArgs(process.argv.slice(2));
if (!args.name || !args.series) {
  console.error("Usage: node generate-short-covers.mjs --name <piece> --series <NN> [--at <seconds>] [--lang es|en|all]");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "../..");
const shortsDir = path.join(root, "media", args.name, "shorts");
const outDir = path.join(shortsDir, "thumbnails");
fs.mkdirSync(outDir, { recursive: true });

const config = JSON.parse(fs.readFileSync(path.join(shortsDir, `${args.name}-short.json`), "utf8"));
const bgVideo = path.join(shortsDir, `${args.name}-short-bg.mp4`);
const atSeconds = Number(args.at ?? 20);
const bgFramePath = path.join(outDir, "_temp_clean_bg.png");

execFileSync("ffmpeg", ["-y", "-ss", String(atSeconds), "-i", bgVideo, "-frames:v", "1", "-pix_fmt", "rgb24", bgFramePath]);

// Layout copied exactly from tools/shorts/generate-hyperframes-covers.mjs (Gnosis's actual shipped
// cover, not the shorts-cover skill's separate coordinate spec) — the user asked explicitly not to
// drift from what Gnosis already established: same top-pill position (Y:350), same hook-card position
// and size (Y:480, width 860), same type sizes, no bottom pill (Gnosis's cover doesn't have one).
function makeHtml({ series, badge, title, subtitle }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1080px; height: 1920px; overflow: hidden; background-color: #050508;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Avenir Next", "Segoe UI", Roboto, sans-serif;
    color: #FDFBFA; -webkit-font-smoothing: antialiased;
  }
  #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; }
  .bg-img { position: absolute; inset: 0; width: 1080px; height: 1920px; object-fit: cover; }
  .top-pill {
    position: absolute; top: 350px; left: 50%; transform: translateX(-50%);
    display: inline-flex; align-items: center; gap: 14px;
    background: rgba(11, 14, 26, 0.65); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-radius: 999px; padding: 12px 28px; z-index: 20; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  .ring-icon { width: 32px; height: 32px; }
  .top-pill-text { font-size: 24px; font-weight: 700; letter-spacing: 0.16em; color: #FDFBFA; text-transform: uppercase; white-space: nowrap; }
  .top-pill-num { color: #7FD4F5; }
  .hook-card {
    position: absolute; top: 480px; left: 50%; transform: translateX(-50%);
    width: 860px; display: flex; flex-direction: column; align-items: center; text-align: center;
    background: rgba(11, 14, 26, 0.45); backdrop-filter: blur(28px) saturate(180%); -webkit-backdrop-filter: blur(28px) saturate(180%);
    border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 24px; padding: 40px 48px; gap: 16px;
    z-index: 20; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 32px rgba(168, 85, 247, 0.10);
  }
  .hook-badge { font-size: 22px; font-weight: 700; letter-spacing: 0.16em; color: #C084FC; text-transform: uppercase; }
  .hook-heading {
    font-weight: 900; font-size: 54px; line-height: 1.15; letter-spacing: 0.02em; color: #FDFBFA;
    text-transform: uppercase; text-shadow: 0 4px 24px rgba(0, 0, 0, 0.90);
  }
  .hook-divider { width: 120px; height: 3px; background: linear-gradient(90deg, #38BDF8, #C084FC); border-radius: 2px; margin: 4px 0; }
  .hook-subtext { font-weight: 700; font-size: 24px; line-height: 1.25; letter-spacing: 0.12em; color: #38BDF8; text-transform: uppercase; }
</style>
</head>
<body>
  <div id="root">
    <img class="bg-img" src="file://${bgFramePath}" alt="bg">
    <div class="top-pill">
      <svg class="ring-icon" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="6" stroke="#7FD4F5" stroke-width="2"/>
        <circle cx="24" cy="24" r="12" stroke="#7FD4F5" stroke-opacity="0.8" stroke-width="2"/>
        <circle cx="24" cy="24" r="18" stroke="#7FD4F5" stroke-opacity="0.6" stroke-width="2"/>
        <circle cx="24" cy="24" r="23" stroke="#7FD4F5" stroke-opacity="0.4" stroke-width="2"/>
      </svg>
      <span class="top-pill-text">DEPH <span style="color:#7FD4F5">·</span> <span class="top-pill-num">${series}</span></span>
    </div>
    <div class="hook-card">
      <div class="hook-badge">• ${badge}</div>
      <div class="hook-heading">${title}</div>
      <div class="hook-divider"></div>
      <div class="hook-subtext">${subtitle}</div>
    </div>
  </div>
</body>
</html>`;
}

const chromeBin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const langs = args.lang && args.lang !== "all" ? [args.lang] : ["es", "en"];

for (const lang of langs) {
  const c = config[lang];
  const html = makeHtml({
    series: args.series,
    badge: `${c.coverTopic} · 432 HZ`,
    title: c.openingTitle,
    subtitle: c.openingSub,
  });

  const name = `${args.name}-short-cover-${lang}`;
  const tempHtml = path.join(outDir, `${name}.html`);
  const tempPng = path.join(outDir, `${name}.png`);
  const finalJpg = path.join(outDir, `${name}.jpg`);

  fs.writeFileSync(tempHtml, html, "utf8");
  execFileSync(chromeBin, ["--headless", "--disable-gpu=false", "--virtual-time-budget=2000", "--window-size=1080,1920", `--screenshot=${tempPng}`, `file://${tempHtml}`]);
  execFileSync("ffmpeg", ["-y", "-i", tempPng, "-q:v", "2", finalJpg]);
  fs.unlinkSync(tempHtml);
  fs.unlinkSync(tempPng);
  console.log(`✓ ${path.relative(root, finalJpg)}`);
}

fs.unlinkSync(bgFramePath);
