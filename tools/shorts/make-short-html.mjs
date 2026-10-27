#!/usr/bin/env node
// tools/shorts/make-short-html.mjs
// Builds a deph-shorts HyperFrames composition (1080x1920) matching The Field's reference:
// - Persistent red subscribe pill button (top-left)
// - Opening card (label, title question, subtitle)
// - Karaoke caption phrase cards (lower center, highlighted key word)
// - Closing CTA card (full piece link + channel ask)
//
// Registered on window.__timelines[<composition-id>].
import fs from "node:fs";

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

const f = parseArgs(process.argv.slice(2));
if (!f.captions || !f.out || !f.id) {
  console.error("Usage: node make-short-html.mjs --captions <captions.json> --id <id> --out <name.html> [options]");
  process.exit(1);
}

const cards = JSON.parse(fs.readFileSync(f.captions, "utf8"));
const delay = Number(f.audioDelay || 0.9); // narration delay offset in seconds

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cardHtml(card) {
  if (!card.highlight) return esc(card.text);
  const i = card.text.indexOf(card.highlight);
  if (i < 0) return esc(card.text);
  return esc(card.text.slice(0, i)) +
    `<span class="hl">${esc(card.text.slice(i, i + card.highlight.length))}</span>` +
    esc(card.text.slice(i + card.highlight.length));
}

// Adjust cards with delay offset
const adjustedCards = cards.map(c => ({
  textHtml: cardHtml(c),
  start: Number((c.start + delay).toFixed(3)),
  end: Number((c.end + delay).toFixed(3))
}));

// Opening card settings
const openingLabel = f.openingLabel || "GNOSIS";
const openingTitle = f.openingTitle || (f.lang === "es" ? "¿LIBRE O ATRAPADO?" : "FREE OR TRAPPED?");
const openingSub = f.openingSub || (f.lang === "es" ? "Dos Caras de la Misma Energía" : "Two Faces of the Same Energy");
const openingStart = 0.4;
const openingEnd = 4.2;

// Closing card settings
const closingLabel = f.closingLabel || (f.lang === "es" ? "EXPERIMENTÁ GNOSIS" : "EXPERIENCE GNOSIS");
const closingTitle = f.closingTitle || (f.lang === "es" ? "OBRA COMPLETA DE 12 MINUTOS EN EL CANAL" : "FULL 12-MINUTE PIECE ON CHANNEL");
const closingSub = f.closingSub || (f.lang === "es" ? "Y si esto te movió algo, dejá tu comentario y suscribite." : "And if this moved something in you, leave a comment and subscribe.");
const closingStart = adjustedCards.length ? Math.max(openingEnd + 0.5, adjustedCards[adjustedCards.length - 1].end - 0.2) : 36.5;
const closingEnd = 45.3;

const subscribeText = f.subscribe || (f.lang === "es" ? "SUSCRIBIRSE" : "SUBSCRIBE");
const bgVideo = f.video || "gnosis-short-bg.mp4";

const html = `<!DOCTYPE html>
<html lang="${f.lang || 'es'}">
<head>
<meta charset="UTF-8">
<script src="gsap.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body, html {
    width: 1080px; height: 1920px;
    background: ${f.transparent ? 'transparent' : '#000'};
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Outfit", "Inter", "Avenir Next", "Helvetica Neue", sans-serif;
  }
  #root {
    position: relative;
    width: 1080px;
    height: 1920px;
  }
  ${f.transparent ? '' : `
  #bg {
    position: absolute;
    inset: 0;
    width: 1080px;
    height: 1920px;
    object-fit: cover;
  }`}
  #subscribe {
    position: absolute;
    top: 220px;
    left: 70px;
    display: flex;
    align-items: center;
    gap: 12px;
    background: #e60000;
    color: #fff;
    font-weight: 700;
    font-size: 26px;
    letter-spacing: 0.04em;
    padding: 14px 28px;
    border-radius: 40px;
    text-transform: uppercase;
    box-shadow: 0 4px 20px rgba(230, 0, 0, 0.55);
    z-index: 10;
  }
  #subscribe .play {
    width: 0; height: 0;
    border-top: 9px solid transparent;
    border-bottom: 9px solid transparent;
    border-left: 14px solid #fff;
  }

  .glass-card {
    position: absolute;
    background: linear-gradient(145deg, rgba(22, 16, 52, 0.88), rgba(12, 10, 32, 0.92));
    border: 1px solid rgba(140, 110, 255, 0.28);
    border-radius: 28px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.65), 0 0 40px rgba(120, 80, 255, 0.18);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    opacity: 0;
    text-align: center;
    z-index: 5;
  }

  #opening-card {
    top: 480px;
    left: 120px;
    width: 840px;
    padding: 44px 50px;
  }
  .card-label {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #a594fd;
    margin-bottom: 14px;
  }
  .card-title {
    font-size: 46px;
    font-weight: 800;
    line-height: 1.24;
    text-transform: uppercase;
    color: #ffffff;
    letter-spacing: 0.02em;
  }
  .card-sub {
    font-size: 30px;
    font-weight: 500;
    color: #b4c5e7;
    margin-top: 16px;
    line-height: 1.3;
  }

  #caption-card {
    top: 1060px;
    left: 90px;
    width: 900px;
    padding: 30px 44px;
    font-size: 42px;
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
    left: 120px;
    width: 840px;
    padding: 44px 50px;
  }
</style>
</head>
<body>
  <div id="root" data-composition-id="${f.id}">
    ${f.transparent ? '' : `<video id="bg" src="${bgVideo}" muted playsinline></video>`}
    <div id="subscribe"><span class="play"></span>${esc(subscribeText)}</div>
    
    <div id="opening-card" class="glass-card">
      <div class="card-label">${esc(openingLabel)}</div>
      <div class="card-title">${esc(openingTitle)}</div>
      <div class="card-sub">${esc(openingSub)}</div>
    </div>

    <div id="caption-card" class="glass-card"></div>

    <div id="closing-card" class="glass-card">
      <div class="card-label">${esc(closingLabel)}</div>
      <div class="card-title">${esc(closingTitle)}</div>
      <div class="card-sub">${esc(closingSub)}</div>
    </div>
  </div>

  <script>
    const opening = document.getElementById('opening-card');
    const caption = document.getElementById('caption-card');
    const closing = document.getElementById('closing-card');
    const bg = document.getElementById('bg');

    const cardsData = ${JSON.stringify(adjustedCards)};

    // State render function driven directly by time t
    function updateState(t) {
      if (bg) bg.currentTime = t;

      // 1. Opening Card
      if (t >= ${openingStart} && t <= ${openingEnd}) {
        let op = 1;
        if (t < ${openingStart} + 0.3) op = (t - ${openingStart}) / 0.3;
        else if (t > ${openingEnd} - 0.3) op = (${openingEnd} - t) / 0.3;
        opening.style.opacity = Math.max(0, Math.min(1, op));
      } else {
        opening.style.opacity = 0;
      }

      // 2. Closing Card
      if (t >= ${closingStart} && t <= ${closingEnd}) {
        let op = 1;
        if (t < ${closingStart} + 0.3) op = (t - ${closingStart}) / 0.3;
        else if (t > ${closingEnd} - 0.3) op = (${closingEnd} - t) / 0.3;
        closing.style.opacity = Math.max(0, Math.min(1, op));
      } else {
        closing.style.opacity = 0;
      }

      // 3. Caption Cards
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

    const tl = gsap.timeline({ paused: true, onUpdate: () => updateState(tl.time()) });
    tl.to({}, { duration: 46 });

    const originalSeek = tl.seek.bind(tl);
    tl.seek = (t, suppress) => {
      const res = originalSeek(t, suppress);
      updateState(t);
      return res;
    };

    window.__timelines = { '${f.id}': tl };
    updateState(0);
  </script>
</body>
</html>
`;

fs.writeFileSync(f.out, html);
console.log(`Wrote ${f.out}`);
