#!/usr/bin/env node
/**
 * tools/shorts/render-shorts.mjs
 * Renders YouTube Shorts (1080x1920, 30fps) with:
 * - Real in-browser glassmorphism (backdrop-filter over video)
 * - Strict YouTube Shorts Safe Zone compliance
 * - Streaming frames directly to FFmpeg pipe
 *
 * Usage:
 *   node tools/shorts/render-shorts.mjs --lang es
 *   node tools/shorts/render-shorts.mjs --lang en
 *   node tools/shorts/render-shorts.mjs --all
 */

import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

function parseArgs(argv) {
  const flags = { fps: 30, duration: 46.0 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const k = argv[i].slice(2);
      flags[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    }
  }
  return flags;
}

const flags = parseArgs(process.argv.slice(2));

function cardHtml(card) {
  if (!card.highlight) return card.text;
  const i = card.text.indexOf(card.highlight);
  if (i < 0) return card.text;
  return card.text.slice(0, i) +
    '<span class="hl">' + card.text.slice(i, i + card.highlight.length) + '</span>' +
    card.text.slice(i + card.highlight.length);
}

function buildHtml(config) {
  const adjustedCards = config.captions.map(c => ({
    textHtml: cardHtml(c),
    start: Number((c.start + config.audioDelay).toFixed(3)),
    end: Number((c.end + config.audioDelay).toFixed(3))
  }));

  return `<!DOCTYPE html>
<html lang="${config.lang}">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body, html {
    width: 1080px; height: 1920px;
    background: #000;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Outfit", "Inter", "Avenir Next", "Helvetica Neue", sans-serif;
  }
  #root {
    position: relative;
    width: 1080px;
    height: 1920px;
  }
  #bg {
    position: absolute;
    inset: 0;
    width: 1080px;
    height: 1920px;
    object-fit: cover;
  }
  #subscribe {
    position: absolute;
    top: 240px;
    left: 75px;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: #e60000;
    color: #fff;
    font-weight: 700;
    font-size: 24px;
    letter-spacing: 0.04em;
    padding: 13px 26px;
    border-radius: 9999px;
    text-transform: uppercase;
    box-shadow: 0 4px 20px rgba(230, 0, 0, 0.55);
    z-index: 10;
  }
  #subscribe .play {
    width: 0; height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-left: 13px solid #fff;
  }

  /* YouTube Shorts Safe Zone compliant cards:
     - Centered horizontally, max-width 780px (leaves >150px clear of right-side action buttons)
     - Vertically constrained between y=220px and y=1400px (leaves bottom 520px clear of channel info)
     - Authentic glassmorphism: blur(24px) saturate(160%)
  */
  .glass-card {
    position: absolute;
    background: rgba(20, 16, 45, 0.65);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border: 1.5px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 14px 44px rgba(0, 0, 0, 0.5);
    border-radius: 28px;
    opacity: 0;
    text-align: center;
    z-index: 5;
  }

  #opening-card {
    top: 480px;
    left: 50%;
    transform: translateX(-50%);
    width: 780px;
    padding: 40px 48px;
  }
  .card-label {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #a594fd;
    margin-bottom: 12px;
  }
  .card-title {
    font-size: 44px;
    font-weight: 800;
    line-height: 1.22;
    text-transform: uppercase;
    color: #ffffff;
    letter-spacing: 0.02em;
  }
  .card-sub {
    font-size: 28px;
    font-weight: 500;
    color: #b4c5e7;
    margin-top: 14px;
    line-height: 1.3;
  }

  #caption-card {
    top: 1060px;
    left: 50%;
    transform: translateX(-50%);
    max-width: 760px;
    width: fit-content;
    padding: 26px 40px;
    font-size: 40px;
    font-weight: 700;
    line-height: 1.32;
    color: #f4f2ff;
  }
  .hl {
    color: #d68bff;
    font-weight: 800;
    text-shadow: 0 0 22px rgba(214, 139, 255, 0.65);
  }

  #closing-card {
    top: 740px;
    left: 50%;
    transform: translateX(-50%);
    width: 780px;
    padding: 42px 48px;
  }
</style>
</head>
<body>
  <div id="root">
    <video id="bg" src="/video.mp4" muted playsinline></video>
    <div id="subscribe"><span class="play"></span>${config.subscribeText}</div>
    
    <div id="opening-card" class="glass-card">
      <div class="card-label">${config.openingLabel}</div>
      <div class="card-title">${config.openingTitle}</div>
      <div class="card-sub">${config.openingSub}</div>
    </div>

    <div id="caption-card" class="glass-card"></div>

    <div id="closing-card" class="glass-card">
      <div class="card-label">${config.closingLabel}</div>
      <div class="card-title">${config.closingTitle}</div>
      <div class="card-sub">${config.closingSub}</div>
    </div>
  </div>

  <script>
    const opening = document.getElementById('opening-card');
    const caption = document.getElementById('caption-card');
    const closing = document.getElementById('closing-card');
    const bg = document.getElementById('bg');

    const cardsData = ${JSON.stringify(adjustedCards)};

    function updateState(t) {
      // Opening card
      if (t >= ${config.openingStart} && t <= ${config.openingEnd}) {
        let op = 1;
        if (t < ${config.openingStart} + 0.3) op = (t - ${config.openingStart}) / 0.3;
        else if (t > ${config.openingEnd} - 0.3) op = (${config.openingEnd} - t) / 0.3;
        opening.style.opacity = Math.max(0, Math.min(1, op));
      } else {
        opening.style.opacity = 0;
      }

      // Closing card
      if (t >= ${config.closingStart} && t <= ${config.closingEnd}) {
        let op = 1;
        if (t < ${config.closingStart} + 0.3) op = (t - ${config.closingStart}) / 0.3;
        else if (t > ${config.closingEnd} - 0.3) op = (${config.closingEnd} - t) / 0.3;
        closing.style.opacity = Math.max(0, Math.min(1, op));
      } else {
        closing.style.opacity = 0;
      }

      // Dynamic captions
      const active = cardsData.find(c => t >= c.start && t < c.end);
      if (active) {
        if (caption.innerHTML !== active.textHtml) {
          caption.innerHTML = active.textHtml;
        }
        let op = 1;
        if (t < active.start + 0.18) op = (t - active.start) / 0.18;
        else if (t > active.end - 0.18) op = (active.end - t) / 0.18;
        caption.style.opacity = Math.max(0, Math.min(1, op));
      } else {
        caption.style.opacity = 0;
      }
    }

    window.updateFrame = async function(t) {
      bg.currentTime = t;
      await new Promise(r => {
        bg.onseeked = () => { updateState(t); r(); };
        setTimeout(() => { updateState(t); r(); }, 400);
      });
    };
  </script>
</body>
</html>`;
}

async function renderPiece(lang) {
  console.log(`\n========================================`);
  console.log(`  Rendering Gnosis Short [${lang.toUpperCase()}]`);
  console.log(`========================================`);

  const rootDir = path.resolve(import.meta.dirname, "../..");
  const shortsDir = path.join(rootDir, "media/gnosis/shorts");
  const videoPath = path.join(shortsDir, "gnosis-short-bg.mp4");
  const audioPath = path.join(shortsDir, `gnosis-short-audio-${lang}.m4a`);
  const captionsPath = path.join(shortsDir, `gnosis-captions-${lang}.json`);
  const outPath = path.join(shortsDir, `gnosis-short-${lang}.mp4`);
  const htmlOutPath = path.join(shortsDir, `gnosis-short-${lang}.html`);

  const captions = JSON.parse(fs.readFileSync(captionsPath, "utf8"));
  const audioDelay = 0.9;

  const config = {
    lang,
    captions,
    audioDelay,
    subscribeText: lang === "es" ? "SUSCRIBIRSE" : "SUBSCRIBE",
    openingLabel: "GNOSIS",
    openingTitle: lang === "es" ? "¿LIBRE O ATRAPADO?" : "FREE OR TRAPPED?",
    openingSub: lang === "es" ? "Dos Caras de la Misma Energía" : "Two Faces of the Same Energy",
    openingStart: 0.4,
    openingEnd: 4.2,
    closingLabel: lang === "es" ? "EXPERIMENTÁ GNOSIS" : "EXPERIENCE GNOSIS",
    closingTitle: lang === "es" ? "OBRA COMPLETA DE 12 MINUTOS EN EL CANAL" : "FULL 12-MINUTE PIECE ON CHANNEL",
    closingSub: lang === "es" ? "Y si esto te movió algo, dejá tu comentario y suscribite." : "And if this moved something in you, leave a comment and subscribe.",
    closingStart: lang === "es" ? 36.4 : 41.0,
    closingEnd: 45.4
  };

  const html = buildHtml(config);
  fs.writeFileSync(htmlOutPath, html);
  console.log(`✓ Generated ${path.relative(rootDir, htmlOutPath)}`);

  const server = http.createServer((req, res) => {
    if (req.url === "/video.mp4") {
      const stat = fs.statSync(videoPath);
      res.writeHead(200, { "Content-Length": stat.size, "Content-Type": "video/mp4" });
      fs.createReadStream(videoPath).pipe(res);
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    }
  });

  const port = lang === "es" ? 8991 : 8992;
  await new Promise(r => server.listen(port, r));

  const executablePath = process.env.CHROMIUM_PATH ||
    "/Users/javier/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell";

  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(`http://localhost:${port}`);

  await page.evaluate(async () => {
    const v = document.getElementById("bg");
    if (v.readyState < 2) {
      await new Promise(r => { v.onloadeddata = r; setTimeout(r, 1000); });
    }
  });

  const fps = flags.fps || 30;
  const duration = flags.duration || 46.0;
  const totalFrames = Math.round(duration * fps);

  console.log(`Starting frame generation: ${totalFrames} frames at ${fps} fps (${duration}s)...`);

  const ffmpeg = spawn("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "image2pipe",
    "-framerate", String(fps),
    "-vcodec", "png",
    "-i", "-",
    "-i", audioPath,
    "-map", "0:v", "-map", "1:a",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-c:a", "copy",
    "-shortest",
    outPath
  ]);

  ffmpeg.stderr.on("data", d => console.error("ffmpeg:", d.toString()));

  const startT = Date.now();
  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    await page.evaluate((time) => window.updateFrame(time), t);
    const buf = await page.screenshot();
    ffmpeg.stdin.write(buf);

    if (i % 150 === 0 || i === totalFrames - 1) {
      const pct = ((i / (totalFrames - 1)) * 100).toFixed(0);
      const elapsed = ((Date.now() - startT) / 1000).toFixed(1);
      const fpsActual = (i / (elapsed || 0.001)).toFixed(1);
      console.log(`  [${pct}%] Frame ${i}/${totalFrames} (t=${t.toFixed(2)}s, speed: ${fpsActual} fps, elapsed: ${elapsed}s)`);
    }
  }

  ffmpeg.stdin.end();
  await new Promise(r => ffmpeg.on("close", r));

  await browser.close();
  server.close();

  const totalTime = ((Date.now() - startT) / 1000).toFixed(1);
  const outStat = fs.statSync(outPath);
  console.log(`✓ Completed ${path.relative(rootDir, outPath)} in ${totalTime}s (${(outStat.size / 1024 / 1024).toFixed(1)} MB)`);
}

async function main() {
  const target = flags.lang || (flags.all ? "all" : "es");
  if (target === "all") {
    await renderPiece("es");
    await renderPiece("en");
  } else {
    await renderPiece(target);
  }
}

main().catch(err => {
  console.error("Render failed:", err);
  process.exit(1);
});
