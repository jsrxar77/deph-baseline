import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const shortsDir = path.join(root, "media/gnosis/shorts");

function buildPhrasesFromWords(words) {
  const phrases = [];
  let chunk = [];

  for (let i = 0; i < words.length; i++) {
    const w = { ...words[i], idx: i };
    chunk.push(w);
    const isPunct = /[.?!…]/.test(w.word);
    const isComma = /[,]/.test(w.word);
    const isColon = /[:]/.test(w.word);

    if (isPunct || isColon || (isComma && chunk.length >= 3) || chunk.length >= 6 || i === words.length - 1) {
      if (chunk.length <= 2 && phrases.length > 0 && !isPunct) {
        chunk.forEach(cw => {
          phrases[phrases.length - 1].line2.push(cw);
          phrases[phrases.length - 1].allWords.push(cw);
        });
      } else {
        let mid = Math.ceil(chunk.length / 2);
        const line1 = chunk.slice(0, mid);
        const line2 = chunk.slice(mid);
        phrases.push({ line1, line2, allWords: chunk });
      }
      chunk = [];
    }
  }

  // Ensure every phrase has line2
  for (const p of phrases) {
    if (!p.line2 || p.line2.length === 0) {
      if (p.line1.length > 1) {
        const mid = Math.ceil(p.line1.length / 2);
        p.line2 = p.line1.slice(mid);
        p.line1 = p.line1.slice(0, mid);
      }
    }
  }

  return phrases;
}

export function generateShortPackage(lang) {
  const isEs = lang === "es";
  const hfDir = path.join(shortsDir, `hyperframes-${lang}`);
  fs.mkdirSync(hfDir, { recursive: true });

  // Symlink bg.mp4
  const bgTarget = path.join(hfDir, "bg.mp4");
  if (!fs.existsSync(bgTarget)) {
    try {
      fs.symlinkSync("../gnosis-short-bg.mp4", bgTarget);
    } catch {
      fs.copyFileSync(path.join(shortsDir, "gnosis-short-bg.mp4"), bgTarget);
    }
  }

  // Load karaoke word timing data
  const rawData = JSON.parse(fs.readFileSync(path.join(shortsDir, `gnosis-karaoke-${lang}.json`), "utf8"));
  const audioDelay = 0.9;

  // Flatten words with audioDelay
  const rawWords = [];
  rawData.forEach(item => {
    (item.words || []).forEach(w => {
      rawWords.push({
        word: w.text,
        startSec: Number((w.start + audioDelay).toFixed(3)),
        endSec: Number((w.end + audioDelay).toFixed(3))
      });
    });
  });

  const phrases = buildPhrasesFromWords(rawWords);

  // Build HTML for phrases
  let phrasesHtml = "";
  phrases.forEach((p, pIdx) => {
    phrasesHtml += `          <div id="phrase-${pIdx}" class="caption-phrase">\n`;
    phrasesHtml += `            <div class="caption-line">\n`;
    p.line1.forEach(w => {
      phrasesHtml += `              <span id="word-${w.idx}" class="caption-word">${w.word}</span>\n`;
    });
    phrasesHtml += `            </div>\n`;
    phrasesHtml += `            <div class="caption-line">\n`;
    p.line2.forEach(w => {
      phrasesHtml += `              <span id="word-${w.idx}" class="caption-word">${w.word}</span>\n`;
    });
    phrasesHtml += `            </div>\n`;
    phrasesHtml += `          </div>\n`;
  });

  // Build GSAP script for captions
  let gsapCaptions = "";
  phrases.forEach((p, pIdx) => {
    const pStart = Math.max(0, p.allWords[0].startSec - 0.04);
    const nextPhrase = phrases[pIdx + 1];
    const pEnd = nextPhrase
      ? Math.max(p.allWords[p.allWords.length - 1].endSec + 0.02, nextPhrase.allWords[0].startSec - 0.04)
      : p.allWords[p.allWords.length - 1].endSec + 0.35;

    gsapCaptions += `      // Phrase ${pIdx}: "${p.allWords.map(w => w.word).join(" ")}"\n`;
    gsapCaptions += `      tl.fromTo("#phrase-${pIdx}", { opacity: 0, visibility: "hidden" }, { opacity: 1, visibility: "visible", duration: 0.05, ease: "none", overwrite: "auto" }, ${pStart.toFixed(3)});\n`;
    gsapCaptions += `      tl.to("#phrase-${pIdx}", { opacity: 0, visibility: "hidden", duration: 0.05, ease: "none", overwrite: "auto" }, ${pEnd.toFixed(3)});\n`;

    p.allWords.forEach(w => {
      const wStart = w.startSec;
      const dur = Math.max(0.08, w.endSec - w.startSec);
      gsapCaptions += `      tl.to("#word-${w.idx}", { color: "#C084FC", textShadow: "0 0 24px rgba(168, 85, 247, 0.95), 0 0 38px rgba(147, 51, 234, 0.75), 0 3px 12px rgba(0, 0, 0, 0.90)", duration: 0.04, ease: "none", overwrite: "auto" }, ${wStart.toFixed(3)});\n`;
      gsapCaptions += `      tl.to("#word-${w.idx}", { color: "#FDFBFA", textShadow: "0 3px 12px rgba(0, 0, 0, 0.85)", duration: 0.06, ease: "none", overwrite: "auto" }, ${(wStart + dur).toFixed(3)});\n`;
    });
  });

  const config = {
    compositionId: `gnosis-short-${lang}`,
    subscribeText: isEs ? "Suscribirse" : "Subscribe",
    hookBadge: "GNOSIS",
    hookTitle: isEs ? "¿LIBRE O ATRAPADO?" : "FREE OR TRAPPED?",
    hookSub: isEs ? "Dos Caras de la Misma Energía" : "Two Faces of the Same Energy",
    closingBadge: isEs ? "Experimentá Gnosis" : "Experience Gnosis",
    closingTitle: isEs ? "Obra Completa de 12 Minutos en el Canal" : "Full 12-Minute Piece on Channel",
    closingSub: isEs ? "Y si esto te movió algo, dejá tu comentario y suscribite." : "And if this moved something in you, leave a comment and subscribe.",
    closingStart: isEs ? 36.4 : 41.0,
    closingEnd: 45.4,
    captionsFadeOut: isEs ? 35.8 : 40.5
  };

  const html = `<!doctype html>
<!--
  HyperFrames Composition · Gnosis Short (${lang.toUpperCase()})
  Aspect: 9:16 Vertical (1080x1920 @ 30fps)
  Safe Zones: Strict YouTube Shorts top/bottom clearance
  Glassmorphism: Translucent 0.35 opacity with authentic backdrop blur
  Typography: 50px font, STRICTLY 2 lines, word-by-word lilac highlight
-->
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>Gnosis · YouTube Short</title>
    <!-- GSAP 3 -->
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background-color: #050508;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Avenir Next", "Segoe UI", Roboto, sans-serif;
        color: #FDFBFA;
        -webkit-font-smoothing: antialiased;
      }
      #root {
        position: relative;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background-color: #050508;
      }
      .clip {
        position: absolute;
        inset: 0;
      }

      /* Background Video Plate */
      .bg-video {
        position: absolute;
        top: 0;
        left: 0;
        width: 1080px;
        height: 1920px;
        object-fit: cover;
      }

      /* Cinematic Vignette */
      .vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 50% 50%, rgba(5, 5, 8, 0.02) 40%, rgba(5, 5, 8, 0.60) 100%);
        pointer-events: none;
        z-index: 5;
      }

      /* YouTube Red Subscribe Button (Top Safe Area: X: 80px, Y: 240px) */
      .yt-subscribe-btn {
        position: absolute;
        top: 240px;
        left: 80px;
        display: flex;
        align-items: center;
        gap: 12px;
        background: #ff0000;
        border-radius: 999px;
        padding: 14px 28px;
        z-index: 25;
        box-shadow: 0 8px 24px rgba(255, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.6);
        pointer-events: none;
      }
      .yt-play-icon {
        width: 0;
        height: 0;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        border-left: 14px solid #ffffff;
      }
      .yt-subscribe-text {
        font-weight: 800;
        font-size: 24px;
        letter-spacing: 0.08em;
        color: #ffffff;
        text-transform: uppercase;
      }

      /* Hook Card (0.3s -> 4.3s): Y: 480px, Translucent 0.35 */
      .hook-card {
        position: absolute;
        top: 480px;
        left: 50%;
        transform: translateX(-50%);
        width: 860px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        background: rgba(11, 14, 26, 0.35);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1.5px solid rgba(168, 85, 247, 0.30);
        border-radius: 20px;
        padding: 36px 44px;
        gap: 12px;
        z-index: 20;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.70), inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 28px rgba(168, 85, 247, 0.12);
        pointer-events: none;
        opacity: 0;
      }
      .hook-badge {
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 0.16em;
        color: #C084FC;
        text-transform: uppercase;
      }
      .hook-heading {
        font-weight: 900;
        font-size: 56px;
        line-height: 1.15;
        letter-spacing: 0.02em;
        color: #FDFBFA;
        text-transform: uppercase;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.90);
      }
      .hook-subtext {
        font-weight: 600;
        font-size: 42px;
        line-height: 1.25;
        letter-spacing: 0.03em;
        color: #A5B4FC;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85);
      }

      /* Dynamic Kinetic Subtitles (SAFE ZONE: Y: 1120px) */
      /* STRICTLY 2 LINES, Translucent 0.35, ZERO STROKE */
      .captions-wrap {
        position: absolute;
        left: 0;
        right: 0;
        top: 1120px;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 30;
        pointer-events: none;
      }
      .caption-phrase {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: fit-content;
        max-width: 860px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background: rgba(11, 14, 26, 0.35);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1.5px solid rgba(168, 85, 247, 0.30);
        border-radius: 20px;
        padding: 20px 38px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.70), inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 24px rgba(168, 85, 247, 0.12);
        visibility: hidden;
        opacity: 0;
      }
      .caption-line {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        white-space: nowrap;
        max-width: 820px;
      }
      .caption-word {
        font-size: 50px;
        line-height: 1.2;
        letter-spacing: 0.02em;
        font-weight: 800;
        color: #FDFBFA;
        text-shadow: 0 3px 12px rgba(0, 0, 0, 0.85);
        display: inline-block;
      }

      /* Closing CTA: Centered Vertically and Horizontally, Width 860px */
      .closing-cta {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 860px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        background: rgba(11, 14, 26, 0.38);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1.5px solid rgba(168, 85, 247, 0.30);
        border-radius: 20px;
        padding: 40px 44px;
        gap: 14px;
        z-index: 35;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.70), inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 28px rgba(168, 85, 247, 0.12);
        opacity: 0;
        pointer-events: none;
      }
      .cta-badge {
        font-weight: 700;
        font-size: 22px;
        letter-spacing: 0.16em;
        color: #C084FC;
        text-transform: uppercase;
      }
      .cta-link {
        font-weight: 900;
        font-size: 50px;
        line-height: 1.15;
        letter-spacing: 0.02em;
        color: #FDFBFA;
        text-transform: uppercase;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.90);
      }
      .cta-sub {
        font-weight: 600;
        font-size: 38px;
        line-height: 1.25;
        letter-spacing: 0.03em;
        color: #A5B4FC;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85);
      }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${config.compositionId}" data-width="1080" data-height="1920" data-duration="46">
      <div class="clip">
        <!-- 4K Cropped Footage -->
        <video id="bgVideo" class="bg-video" src="bg.mp4" data-start="0s" data-duration="46s" muted playsinline></video>

        <!-- Vignette -->
        <div class="vignette"></div>

        <!-- YouTube Subscribe Pill -->
        <div class="yt-subscribe-btn">
          <div class="yt-play-icon"></div>
          <span class="yt-subscribe-text">${config.subscribeText}</span>
        </div>

        <!-- Hook Card (0.3s -> 4.3s) -->
        <div id="hookCard" class="hook-card">
          <div class="hook-badge">${config.hookBadge}</div>
          <div class="hook-heading">${config.hookTitle}</div>
          <div class="hook-subtext">${config.hookSub}</div>
        </div>

        <!-- Captions Wrap -->
        <div class="captions-wrap" id="captionsWrap" data-layout-allow-overlap="true">
${phrasesHtml}
        </div>

        <!-- Closing CTA -->
        <div id="closingCta" class="closing-cta">
          <div class="cta-badge">${config.closingBadge}</div>
          <div class="cta-link">${config.closingTitle}</div>
          <div class="cta-sub">${config.closingSub}</div>
        </div>
      </div>
    </div>

    <!-- Master Audio -->
    <audio id="masterAudio" src="audio.mp3" data-start="0s" data-duration="46s"></audio>

    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines = window.__timelines || {};
      window.__timelines["${config.compositionId}"] = tl;

      // Hook Card Animation
      tl.fromTo("#hookCard", 
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power2.out" },
        0.3
      );
      tl.to("#hookCard", {
        opacity: 0,
        y: -20,
        scale: 0.97,
        duration: 0.6,
        ease: "power2.in"
      }, 4.3);

      // Captions Timeline
${gsapCaptions}

      // Closing CTA Animation
      tl.fromTo("#closingCta",
        { opacity: 0, scale: 0.92, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: "back.out(1.2)" },
        ${config.closingStart}
      );
      tl.to("#closingCta", {
        opacity: 0,
        scale: 0.96,
        duration: 0.8,
        ease: "power2.in"
      }, ${config.closingEnd});

      // Hide Captions completely when speech concludes
      tl.to("#captionsWrap", { opacity: 0, visibility: "hidden", duration: 0.3, ease: "power2.in" }, ${config.captionsFadeOut});
    </script>
  </body>
</html>
`;

  fs.writeFileSync(path.join(hfDir, "index.html"), html, "utf8");
  console.log(`✓ Successfully generated ${lang.toUpperCase()} HyperFrames composition in ${hfDir}`);
}

const targetLang = process.argv[2] || "all";
if (targetLang === "all") {
  generateShortPackage("es");
  generateShortPackage("en");
} else {
  generateShortPackage(targetLang);
}
