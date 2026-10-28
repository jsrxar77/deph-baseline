import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const outDir = path.join(projectRoot, "media/gnosis/shorts/thumbnails");
fs.mkdirSync(outDir, { recursive: true });

// 1. Extract pure 4K/Short clean background at 20.0s
const bgPath = path.join(outDir, "temp_clean_bg.png");
execSync(`ffmpeg -ss 00:00:20.000 -i "${path.join(projectRoot, "media/gnosis/shorts/gnosis-short-bg.mp4")}" -frames:v 1 -pix_fmt rgb24 "${bgPath}" -y`, { stdio: "ignore" });

function makeHtml({ badge, title, subtitle, series = "04" }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
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
  }
  .bg-img {
    position: absolute;
    inset: 0;
    width: 1080px;
    height: 1920px;
    object-fit: cover;
  }

  /* Top Pill: DEPH · 04 (Safe Zone top: 350px) */
  .top-pill {
    position: absolute;
    top: 350px;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 14px;
    background: rgba(11, 14, 26, 0.65);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 999px;
    padding: 12px 28px;
    z-index: 20;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  .ring-icon {
    width: 32px;
    height: 32px;
  }
  .top-pill-text {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.16em;
    color: #FDFBFA;
    text-transform: uppercase;
  }
  .top-pill-num {
    color: #7FD4F5;
  }

  /* Hook Card from HyperFrames (Top: 480px, Width: 860px) */
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
    background: rgba(11, 14, 26, 0.45);
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    border: 1px solid rgba(168, 85, 247, 0.25);
    border-radius: 24px;
    padding: 40px 48px;
    gap: 16px;
    z-index: 20;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 32px rgba(168, 85, 247, 0.10);
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
    font-size: 54px;
    line-height: 1.15;
    letter-spacing: 0.02em;
    color: #FDFBFA;
    text-transform: uppercase;
    text-shadow: 0 4px 24px rgba(0, 0, 0, 0.90);
  }
  .hook-divider {
    width: 120px;
    height: 3px;
    background: linear-gradient(90deg, #38BDF8, #C084FC);
    border-radius: 2px;
    margin: 4px 0;
  }
  .hook-subtext {
    font-weight: 700;
    font-size: 24px;
    line-height: 1.25;
    letter-spacing: 0.12em;
    color: #38BDF8;
    text-transform: uppercase;
  }
</style>
</head>
<body>
  <div id="root">
    <img class="bg-img" src="file://${bgPath}" alt="bg">
    
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

const covers = [
  {
    name: "gnosis-short-cover-es",
    badge: "GEOMETRÍA SAGRADA · 432 HZ",
    title: "¿Y SI SER LIBRE Y ESTAR<br>ATRAPADO FUERAN LO MISMO?",
    subtitle: "INTEGRACIÓN · 432 HZ",
  },
  {
    name: "gnosis-short-cover-en",
    badge: "SACRED GEOMETRY · 432 HZ",
    title: "WHAT IF BEING FREE AND<br>TRAPPED WERE THE SAME?",
    subtitle: "INTEGRATION · 432 HZ",
  }
];

for (const c of covers) {
  const htmlContent = makeHtml(c);
  const tempHtml = path.join(outDir, `${c.name}.html`);
  const tempPng = path.join(outDir, `${c.name}.png`);
  const finalJpg = path.join(outDir, `${c.name}.jpg`);

  fs.writeFileSync(tempHtml, htmlContent, "utf8");

  // Render high-res screenshot directly with native Chrome
  execSync(`"${chromeBin}" --headless --disable-gpu=false --virtual-time-budget=2000 --window-size=1080,1920 --screenshot="${tempPng}" "file://${tempHtml}"`, { stdio: "ignore" });

  // Convert to high-quality JPEG
  execSync(`ffmpeg -i "${tempPng}" -q:v 2 "${finalJpg}" -y`, { stdio: "ignore" });

  // Clean temp files
  fs.unlinkSync(tempHtml);
  fs.unlinkSync(tempPng);

  console.log(`✓ Generated canonical HyperFrames cover: ${finalJpg} (1080x1920)`);
}

// Clean bg
if (fs.existsSync(bgPath)) fs.unlinkSync(bgPath);
console.log("Both covers rendered flawlessly.");
