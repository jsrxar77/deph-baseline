#!/usr/bin/env node
// tools/shorts/build-short-hyperframes.mjs
//
// Generalized, piece-agnostic version of what was first built one-off for Gnosis
// (build-gnosis-hyperframes.mjs — kept as-is for the record, not reused). Builds the narrated-Short
// HyperFrames composition (karaoke-style word highlighting, opening/closing cards, persistent subscribe
// pill) for ANY deph composition, driven entirely by files under media/<name>/shorts/ instead of
// hardcoded piece text. See the deph-shorts skill for the full pipeline this script is one step of.
//
// Inputs (all under media/<name>/shorts/):
//   <name>-short.json              per-lang strings: script (plain text), opening/closing card text,
//                                   subscribe text — see media/gnosis/shorts/ for the shape once one exists,
//                                   or the deph-shorts skill for the schema.
//   <name>-whisper-words-<lang>.json   word-level timings from transcribe.py, one entry per spoken word,
//                                   in the SAME order as <name>-short.json's script for that language.
//   <name>-short-bg.mp4            the cropped 1080x1920 background clip (silent or with scratch audio).
//
// Output:
//   media/<name>/shorts/hyperframes-<lang>/index.html  (+ bg.mp4 symlink, expects audio.mp3 placed there)
//
// Usage:
//   node tools/shorts/build-short-hyperframes.mjs --name slow-drift --lang es
//   node tools/shorts/build-short-hyperframes.mjs --name slow-drift --lang en
//   node tools/shorts/build-short-hyperframes.mjs --name slow-drift --all

import fs from "node:fs";
import path from "node:path";

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
if (!args.name) {
  console.error("Usage: node build-short-hyperframes.mjs --name <piece> --lang <es|en|all>");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "../..");
const shortsDir = path.join(root, "media", args.name, "shorts");
const audioDelay = Number(args.audioDelay || 0.9);

// Groups a script's words (in reading order) into 2-line phrase cards, matched 1:1 against Whisper
// word timings. Breaks a line after MAX_LINE_WORDS words or MAX_LINE_CHARS characters (whichever first),
// and starts a new phrase card after 2 full lines or a pause (gap to the next word's start) over 0.35s —
// the same two signals used by hand when this was first built for Gnosis, now automatic so a new piece
// needs no hand-authored line-break indices.
const MAX_LINE_WORDS = 4;
const MAX_LINE_CHARS = 26;
const PHRASE_GAP_SECONDS = 0.35;

function groupIntoPhrases(scriptWords, whisperWords) {
  const words = scriptWords.map((w, idx) => {
    const ww = whisperWords[idx] || whisperWords[whisperWords.length - 1];
    return {
      idx,
      word: w,
      startSec: Number((ww.start + audioDelay).toFixed(3)),
      endSec: Number((ww.end + audioDelay).toFixed(3)),
    };
  });

  const phrases = [];
  let lines = [[]];
  let lineChars = 0;

  function closePhrase() {
    lines = lines.filter((l) => l.length);
    if (lines.length) {
      const allWords = lines.flat();
      phrases.push({ pIdx: phrases.length, lines, allWords });
    }
    lines = [[]];
    lineChars = 0;
  }

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const curLine = lines[lines.length - 1];
    const wouldOverflow =
      curLine.length >= MAX_LINE_WORDS || lineChars + w.word.length + 1 > MAX_LINE_CHARS;

    if (wouldOverflow) {
      if (lines.length >= 2) {
        closePhrase();
      } else {
        lines.push([]);
        lineChars = 0;
      }
    }

    lines[lines.length - 1].push(w);
    lineChars += w.word.length + 1;

    const next = words[i + 1];
    const gap = next ? next.startSec - w.endSec : Infinity;
    const lineFull = lines.length >= 2 && lines[lines.length - 1].length >= MAX_LINE_WORDS;
    if (!next || gap > PHRASE_GAP_SECONDS || (lineFull && lines.length >= 2)) {
      closePhrase();
    }
  }
  closePhrase();
  return { words, phrases };
}

function buildHtmlForLang(lang, config) {
  const isEs = lang === "es";
  const hfDir = path.join(shortsDir, `hyperframes-${lang}`);
  fs.mkdirSync(hfDir, { recursive: true });

  const bgSource = `../${args.name}-short-bg.mp4`;
  const bgTarget = path.join(hfDir, "bg.mp4");
  if (!fs.existsSync(bgTarget)) {
    try {
      fs.symlinkSync(bgSource, bgTarget);
    } catch {
      fs.copyFileSync(path.join(shortsDir, `${args.name}-short-bg.mp4`), bgTarget);
    }
  }

  const scriptText = config[lang].script;
  const scriptWords = scriptText.trim().split(/\s+/);
  const whisperFile = path.join(shortsDir, `${args.name}-whisper-words-${lang}.json`);
  const whisperWords = JSON.parse(fs.readFileSync(whisperFile, "utf8"));

  const { words, phrases } = groupIntoPhrases(scriptWords, whisperWords);

  let phrasesHtml = "";
  phrases.forEach((p) => {
    phrasesHtml += `          <div id="phrase-${p.pIdx}" class="caption-phrase">\n`;
    p.lines.forEach((line) => {
      phrasesHtml += `            <div class="caption-line">\n`;
      line.forEach((w) => {
        phrasesHtml += `              <span id="word-${w.idx}" class="caption-word">${w.word}</span>\n`;
      });
      phrasesHtml += `            </div>\n`;
    });
    phrasesHtml += `          </div>\n`;
  });

  let gsapCaptions = "";
  phrases.forEach((p, pIdx) => {
    const pStart = Math.max(0, p.allWords[0].startSec - 0.04);
    const nextPhrase = phrases[pIdx + 1];
    const phraseEnd = p.allWords[p.allWords.length - 1].endSec;
    let pEnd;
    if (nextPhrase) {
      const gap = nextPhrase.allWords[0].startSec - phraseEnd;
      pEnd =
        gap > PHRASE_GAP_SECONDS
          ? phraseEnd + 0.15
          : Math.max(phraseEnd + 0.02, nextPhrase.allWords[0].startSec - 0.04);
    } else {
      pEnd = phraseEnd + 0.3;
    }

    gsapCaptions += `      tl.fromTo("#phrase-${pIdx}", { opacity: 0, visibility: "hidden" }, { opacity: 1, visibility: "visible", duration: 0.04, ease: "none", overwrite: "auto" }, ${pStart.toFixed(3)});\n`;
    gsapCaptions += `      tl.to("#phrase-${pIdx}", { opacity: 0, visibility: "hidden", duration: 0.04, ease: "none", overwrite: "auto" }, ${pEnd.toFixed(3)});\n`;

    p.allWords.forEach((w) => {
      const wStart = w.startSec;
      const dur = Math.max(0.08, w.endSec - w.startSec);
      gsapCaptions += `      tl.to("#word-${w.idx}", { color: "#C084FC", textShadow: "0 0 24px rgba(168, 85, 247, 0.95), 0 0 38px rgba(147, 51, 234, 0.75), 0 3px 12px rgba(0, 0, 0, 0.90)", duration: 0.03, ease: "none", overwrite: "auto" }, ${wStart.toFixed(3)});\n`;
      gsapCaptions += `      tl.to("#word-${w.idx}", { color: "#FDFBFA", textShadow: "0 3px 12px rgba(0, 0, 0, 0.85)", duration: 0.05, ease: "none", overwrite: "auto" }, ${(wStart + dur).toFixed(3)});\n`;
    });
  });

  const duration = Number(config.durationSeconds || 46);
  const lastWordEnd = words[words.length - 1].endSec;
  const c = config[lang];
  const compositionId = `${args.name}-short-${lang}`;
  const closingStart = Number((lastWordEnd + 0.5).toFixed(2));
  const closingEnd = duration - 0.6;
  const captionsFadeOut = Number((lastWordEnd + 0.1).toFixed(2));

  const html = `<!doctype html>
<!--
  HyperFrames Composition · ${args.name} Short (${lang.toUpperCase()})
  Generated by tools/shorts/build-short-hyperframes.mjs — do not hand-edit; edit
  media/${args.name}/shorts/${args.name}-short.json and re-run instead.
  Aspect: 9:16 Vertical (1080x1920 @ 30fps). Safe zones and card layout: see the deph-shorts skill.
-->
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>${args.name} · YouTube Short</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        width: 1080px; height: 1920px; overflow: hidden; background-color: #050508;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Avenir Next", "Segoe UI", Roboto, sans-serif;
        color: #FDFBFA; -webkit-font-smoothing: antialiased;
      }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; background-color: #050508; }
      .clip { position: absolute; inset: 0; }
      .bg-video { position: absolute; top: 0; left: 0; width: 1080px; height: 1920px; object-fit: cover; }
      .vignette { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(5, 5, 8, 0.02) 40%, rgba(5, 5, 8, 0.60) 100%); pointer-events: none; z-index: 5; }
      .yt-subscribe-btn { position: absolute; top: 240px; left: 80px; display: flex; align-items: center; gap: 12px; background: #ff0000; border-radius: 999px; padding: 14px 28px; z-index: 25; box-shadow: 0 8px 24px rgba(255, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.6); pointer-events: none; }
      .yt-play-icon { width: 0; height: 0; border-top: 8px solid transparent; border-bottom: 8px solid transparent; border-left: 14px solid #ffffff; }
      .yt-subscribe-text { font-weight: 800; font-size: 24px; letter-spacing: 0.08em; color: #ffffff; text-transform: uppercase; }
      .hook-card { position: absolute; top: 480px; left: 50%; transform: translateX(-50%); width: 860px; display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(11, 14, 26, 0.35); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border: 1.5px solid rgba(168, 85, 247, 0.30); border-radius: 20px; padding: 36px 44px; gap: 12px; z-index: 20; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.70), inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 28px rgba(168, 85, 247, 0.12); pointer-events: none; opacity: 0; }
      .hook-badge { font-size: 22px; font-weight: 700; letter-spacing: 0.16em; color: #C084FC; text-transform: uppercase; }
      .hook-heading { font-weight: 900; font-size: 56px; line-height: 1.15; letter-spacing: 0.02em; color: #FDFBFA; text-transform: uppercase; text-shadow: 0 4px 20px rgba(0, 0, 0, 0.90); }
      .hook-subtext { font-weight: 600; font-size: 42px; line-height: 1.25; letter-spacing: 0.03em; color: #A5B4FC; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85); }
      .captions-wrap { position: absolute; left: 0; right: 0; top: 1120px; display: flex; justify-content: center; align-items: center; z-index: 30; pointer-events: none; }
      .caption-phrase { position: absolute; left: 50%; transform: translateX(-50%); width: fit-content; max-width: 860px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: rgba(11, 14, 26, 0.35); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border: 1.5px solid rgba(168, 85, 247, 0.30); border-radius: 20px; padding: 20px 38px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.70), inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 24px rgba(168, 85, 247, 0.12); visibility: hidden; opacity: 0; }
      .caption-line { display: flex; justify-content: center; align-items: center; gap: 12px; white-space: nowrap; max-width: 820px; }
      .caption-word { font-size: 50px; line-height: 1.2; letter-spacing: 0.02em; font-weight: 800; color: #FDFBFA; text-shadow: 0 3px 12px rgba(0, 0, 0, 0.85); display: inline-block; }
      .closing-cta { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 860px; display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(11, 14, 26, 0.38); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border: 1.5px solid rgba(168, 85, 247, 0.30); border-radius: 20px; padding: 40px 44px; gap: 14px; z-index: 35; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.70), inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 28px rgba(168, 85, 247, 0.12); opacity: 0; pointer-events: none; }
      .cta-badge { font-weight: 700; font-size: 22px; letter-spacing: 0.16em; color: #C084FC; text-transform: uppercase; }
      .cta-link { font-weight: 900; font-size: 50px; line-height: 1.15; letter-spacing: 0.02em; color: #FDFBFA; text-transform: uppercase; text-shadow: 0 4px 20px rgba(0, 0, 0, 0.90); }
      .cta-sub { font-weight: 600; font-size: 38px; line-height: 1.25; letter-spacing: 0.03em; color: #A5B4FC; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${compositionId}" data-width="1080" data-height="1920" data-duration="${duration}">
      <div class="clip">
        <video id="bgVideo" class="bg-video" src="bg.mp4" data-start="0s" data-duration="${duration}s" muted playsinline></video>
        <div class="vignette"></div>
        <div class="yt-subscribe-btn"><div class="yt-play-icon"></div><span class="yt-subscribe-text">${c.subscribeText}</span></div>
        <div id="hookCard" class="hook-card">
          <div class="hook-badge">${c.openingLabel}</div>
          <div class="hook-heading">${c.openingTitle}</div>
          <div class="hook-subtext">${c.openingSub}</div>
        </div>
        <div class="captions-wrap" id="captionsWrap" data-layout-allow-overlap="true">
${phrasesHtml}
        </div>
        <div id="closingCta" class="closing-cta">
          <div class="cta-badge">${c.closingLabel}</div>
          <div class="cta-link">${c.closingTitle}</div>
          <div class="cta-sub">${c.closingSub}</div>
        </div>
      </div>
    </div>
    <audio id="masterAudio" src="audio.mp3" data-start="0s" data-duration="${duration}s"></audio>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines = window.__timelines || {};
      window.__timelines["${compositionId}"] = tl;
      tl.fromTo("#hookCard", { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power2.out" }, 0.3);
      tl.to("#hookCard", { opacity: 0, y: -20, scale: 0.97, duration: 0.6, ease: "power2.in" }, 4.3);
${gsapCaptions}
      tl.fromTo("#closingCta", { opacity: 0, scale: 0.92, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: "back.out(1.2)" }, ${closingStart});
      tl.to("#closingCta", { opacity: 0, scale: 0.96, duration: 0.8, ease: "power2.in" }, ${closingEnd});
      tl.to("#captionsWrap", { opacity: 0, visibility: "hidden", duration: 0.3, ease: "power2.in" }, ${captionsFadeOut});
    </script>
  </body>
</html>
`;

  fs.writeFileSync(path.join(hfDir, "index.html"), html, "utf8");
  console.log(`✓ ${path.relative(root, path.join(hfDir, "index.html"))}`);
}

const configPath = path.join(shortsDir, `${args.name}-short.json`);
if (!fs.existsSync(configPath)) {
  console.error(`Missing ${path.relative(root, configPath)} — see the deph-shorts skill for the schema.`);
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const target = args.lang || (args.all ? "all" : null);
if (!target) {
  console.error("Pass --lang es, --lang en, or --all.");
  process.exit(1);
}
if (target === "all") {
  buildHtmlForLang("es", config);
  buildHtmlForLang("en", config);
} else {
  buildHtmlForLang(target, config);
}
