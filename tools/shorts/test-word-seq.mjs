import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "../..");
const shortsDir = path.join(root, "media/gnosis/shorts");
const videoPath = path.join(shortsDir, "gnosis-short-bg.mp4");
const phrases = JSON.parse(fs.readFileSync(path.join(shortsDir, "gnosis-karaoke-es.json"), "utf8"));
const delay = 0.9;

// Adjust timestamps with audio delay
const adjustedPhrases = phrases.map(p => ({
  start: Number((p.start + delay).toFixed(3)),
  end: Number((p.end + delay).toFixed(3)),
  words: p.words.map(w => ({
    text: w.text,
    start: Number((w.start + delay).toFixed(3)),
    end: Number((w.end + delay).toFixed(3))
  }))
}));

const html = `<!DOCTYPE html>
<html lang="es">
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

  /* Exact The Field Glassmorphism tokens */
  .glass-card {
    position: absolute;
    background: rgba(18, 16, 48, 0.65);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid rgba(160, 140, 255, 0.3);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55), 0 0 24px rgba(130, 90, 255, 0.15);
    border-radius: 24px;
    opacity: 0;
    text-align: center;
    z-index: 5;
  }

  #opening-card {
    top: 480px;
    left: 50%;
    transform: translateX(-50%);
    width: 780px;
    padding: 38px 46px;
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
    font-size: 42px;
    font-weight: 800;
    line-height: 1.22;
    text-transform: uppercase;
    color: #ffffff;
    letter-spacing: 0.02em;
  }
  .card-sub {
    font-size: 26px;
    font-weight: 500;
    color: #b4c5e7;
    margin-top: 14px;
    line-height: 1.3;
  }

  /* Caption card matches The Field exactly */
  #caption-card {
    top: 1060px;
    left: 50%;
    transform: translateX(-50%);
    width: fit-content;
    max-width: 760px;
    min-width: 400px;
    padding: 24px 44px;
    font-size: 38px;
    font-weight: 700;
    line-height: 1.30;
  }

  .w {
    display: inline-block;
    color: #ffffff;
    margin: 0 4px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  }

  .w.active {
    color: #c490ff;
    font-weight: 800;
    text-shadow: 0 0 20px rgba(196, 144, 255, 0.85), 0 2px 8px rgba(0, 0, 0, 0.6);
  }

  #closing-card {
    top: 740px;
    left: 50%;
    transform: translateX(-50%);
    width: 780px;
    padding: 40px 46px;
  }
</style>
</head>
<body>
  <div id="root">
    <video id="bg" src="/video.mp4" muted playsinline></video>
    <div id="subscribe"><span class="play"></span>SUSCRIBIRSE</div>
    
    <div id="opening-card" class="glass-card">
      <div class="card-label">GNOSIS</div>
      <div class="card-title">¿LIBRE O ATRAPADO?</div>
      <div class="card-sub">Dos Caras de la Misma Energía</div>
    </div>

    <div id="caption-card" class="glass-card"></div>

    <div id="closing-card" class="glass-card">
      <div class="card-label">EXPERIMENTÁ GNOSIS</div>
      <div class="card-title">OBRA COMPLETA DE 12 MINUTOS EN EL CANAL</div>
      <div class="card-sub">Y si esto te movió algo, dejá tu comentario y suscribite.</div>
    </div>
  </div>

  <script>
    const opening = document.getElementById('opening-card');
    const caption = document.getElementById('caption-card');
    const closing = document.getElementById('closing-card');
    const bg = document.getElementById('bg');

    const phrasesData = ${JSON.stringify(adjustedPhrases)};
    let curPhraseIndex = -1;

    function updateState(t) {
      // Opening
      if (t >= 0.4 && t <= 4.2) {
        let op = 1;
        if (t < 0.7) op = (t - 0.4) / 0.3;
        else if (t > 3.9) op = (4.2 - t) / 0.3;
        opening.style.opacity = Math.max(0, Math.min(1, op));
      } else {
        opening.style.opacity = 0;
      }

      // Closing
      if (t >= 36.4 && t <= 45.3) {
        let op = 1;
        if (t < 36.7) op = (t - 36.4) / 0.3;
        else if (t > 45.0) op = (45.3 - t) / 0.3;
        closing.style.opacity = Math.max(0, Math.min(1, op));
      } else {
        closing.style.opacity = 0;
      }

      // Captions: word by word
      const pIdx = phrasesData.findIndex(p => t >= p.start && t < p.end);
      if (pIdx >= 0) {
        const p = phrasesData[pIdx];
        if (curPhraseIndex !== pIdx) {
          curPhraseIndex = pIdx;
          caption.innerHTML = p.words.map((w, i) => '<span class="w" id="w_' + i + '">' + w.text + '</span>').join(' ');
        }
        p.words.forEach((w, i) => {
          const el = document.getElementById('w_' + i);
          if (el) {
            if (t >= w.start && t < w.end) {
              el.classList.add('active');
            } else {
              el.classList.remove('active');
            }
          }
        });
        caption.style.opacity = 1;
      } else {
        curPhraseIndex = -1;
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

server.listen(8996, async () => {
  const browser = await chromium.launch({
    executablePath: "/Users/javier/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell"
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto("http://localhost:8996");

  await page.evaluate(async () => {
    const v = document.getElementById("bg");
    if (v.readyState < 2) {
      await new Promise(r => { v.onloadeddata = r; setTimeout(r, 1000); });
    }
  });

  const scratchDir = "/Users/javier/.gemini/antigravity-ide/brain/11caef8f-cb27-445a-ad2d-3dbe3c44b7b8/scratch";

  // Frame 1: t = 1.9s ("libre" active)
  await page.evaluate(() => window.updateFrame(1.9));
  await page.screenshot({ path: path.join(scratchDir, "word-seq-1-libre.png") });
  console.log("✓ Frame 1 captured: 'libre' active");

  // Frame 2: t = 2.4s ("atrapado" active)
  await page.evaluate(() => window.updateFrame(2.4));
  await page.screenshot({ path: path.join(scratchDir, "word-seq-2-atrapado.png") });
  console.log("✓ Frame 2 captured: 'atrapado' active");

  // Frame 3: t = 3.3s ("fueran" active)
  await page.evaluate(() => window.updateFrame(3.3));
  await page.screenshot({ path: path.join(scratchDir, "word-seq-3-fueran.png") });
  console.log("✓ Frame 3 captured: 'fueran' active");

  await browser.close();
  server.close();
  console.log("All sequence frames captured!");
});
