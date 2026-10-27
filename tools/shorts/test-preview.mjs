import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const videoPath = path.resolve('../../media/gnosis/shorts/gnosis-short-bg.mp4');
const captions = JSON.parse(fs.readFileSync('../../media/gnosis/shorts/gnosis-captions-es.json', 'utf8'));
const delay = 0.9;

function cardHtml(card) {
  if (!card.highlight) return card.text;
  const i = card.text.indexOf(card.highlight);
  if (i < 0) return card.text;
  return card.text.slice(0, i) +
    '<span class="hl">' + card.text.slice(i, i + card.highlight.length) + '</span>' +
    card.text.slice(i + card.highlight.length);
}

const adjustedCards = captions.map(c => ({
  textHtml: cardHtml(c),
  start: Number((c.start + delay).toFixed(3)),
  end: Number((c.end + delay).toFixed(3))
}));

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<script src="gsap.min.js"></script>
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

  /* Safe zone container: centered, max-width 780px to clear right rail buttons */
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

    const cardsData = ${JSON.stringify(adjustedCards)};

    function updateState(t) {
      if (t >= 0.4 && t <= 4.2) {
        let op = 1;
        if (t < 0.7) op = (t - 0.4) / 0.3;
        else if (t > 3.9) op = (4.2 - t) / 0.3;
        opening.style.opacity = Math.max(0, Math.min(1, op));
      } else {
        opening.style.opacity = 0;
      }

      if (t >= 36.4 && t <= 45.3) {
        let op = 1;
        if (t < 36.7) op = (t - 36.4) / 0.3;
        else if (t > 45.0) op = (45.3 - t) / 0.3;
        closing.style.opacity = Math.max(0, Math.min(1, op));
      } else {
        closing.style.opacity = 0;
      }

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
        bg.onseeked = () => {
          updateState(t);
          r();
        };
        setTimeout(() => { updateState(t); r(); }, 500);
      });
    };
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/video.mp4') {
    const stat = fs.statSync(videoPath);
    res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'video/mp4' });
    fs.createReadStream(videoPath).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
});

server.listen(8999, async () => {
  const browser = await chromium.launch({
    executablePath: '/Users/javier/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell'
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('http://localhost:8999');

  // Wait for video metadata to load
  await page.evaluate(async () => {
    const v = document.getElementById('bg');
    if (v.readyState < 2) {
      await new Promise(r => { v.onloadeddata = r; setTimeout(r, 1000); });
    }
  });

  // Capture t=2s
  await page.evaluate(() => window.updateFrame(2.0));
  await page.screenshot({ path: '/Users/javier/.gemini/antigravity-ide/brain/11caef8f-cb27-445a-ad2d-3dbe3c44b7b8/scratch/gnosis-safezone-2s.png' });
  console.log('✓ Captured 2s');

  // Capture t=15s
  await page.evaluate(() => window.updateFrame(15.0));
  await page.screenshot({ path: '/Users/javier/.gemini/antigravity-ide/brain/11caef8f-cb27-445a-ad2d-3dbe3c44b7b8/scratch/gnosis-safezone-15s.png' });
  console.log('✓ Captured 15s');

  // Capture t=40s
  await page.evaluate(() => window.updateFrame(40.0));
  await page.screenshot({ path: '/Users/javier/.gemini/antigravity-ide/brain/11caef8f-cb27-445a-ad2d-3dbe3c44b7b8/scratch/gnosis-safezone-40s.png' });
  console.log('✓ Captured 40s');

  await browser.close();
  server.close();
  console.log('Done preview capture!');
});
