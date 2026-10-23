#!/usr/bin/env node
// Scaffolds, renders, and optionally uploads an Instructional / Educational composition ("Visual Essay")
// treated as its own standalone composition directly under `media/<name>/` (never buried inside a musical piece).
//
// Every instructional piece follows the exact same composition template as any deph piece:
//   media/<name>/
//     <name>.yaml          (with `type: educational`)
//     <name>.md            (script, steps, formulas, and acoustic/mathematical documentation)
//     <name>.youtube.md    (EN + ES YouTube publish pack)
//     sounds/              (Strudel code or isolated stems for the lesson)
//     visuals/             (symlink to tools/visuals/src/compositions/<name>)
//     sync/                (rendered audio + frames.json)
//     renders/             (compiled 4K 16:9 video: <name>.mp4)
//     shorts/              (<name>.shorts.md + compiled 9:16 vertical Shorts: <name>-short-01.mp4)
//
// Default language for all on-screen text and primary YouTube metadata is English ("en"),
// with Spanish attached via YouTube `localizations.es`.
//
// Usage:
//   # 1. Scaffold a new standalone instructional piece under media/<name>/:
//   node tools/youtube/edu.mjs --scaffold <name> [--title="Cymatics & Chladni Figures"]
//
//   # 2. Validate / dry-run an instructional piece:
//   node tools/youtube/edu.mjs <name> [--format=16x9|9x16] [--dry-run]
//
//   # 3. Render and/or upload:
//   node tools/youtube/edu.mjs <name> [--format=16x9|9x16] [--upload] [--privacy=private|unlisted|public]

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parsePublishPack, resolvePieceDir } from "./parse-pack.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const getFlag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const positional = args.filter((a) => !a.startsWith("--"));

const scaffoldMode = hasFlag("scaffold");
const targetName = getFlag("scaffold") || positional[0];
const formatArg = getFlag("format") || "16x9"; // "16x9" (renders/<name>.mp4) or "9x16" (shorts/)
const langArg = (getFlag("lang") || "en").toLowerCase(); // Default: English ("en")
const dryRun = hasFlag("dry-run");
const doUpload = hasFlag("upload");
const privacyStatus = getFlag("privacy") || "private";

if (!targetName) {
  console.error(
    "Usage:\n" +
      "  node tools/youtube/edu.mjs --scaffold <topic-kebab-name> [--title=\"Human Title\"]\n" +
      "  node tools/youtube/edu.mjs <topic-kebab-name> [--format=16x9|9x16] [--dry-run] [--upload] [--privacy=private|unlisted|public]"
  );
  process.exit(1);
}

if (scaffoldMode) {
  scaffoldEducationalPiece(targetName, getFlag("title"));
  process.exit(0);
}

const pieceDir = resolvePieceDir(targetName);
const pieceName = path.basename(pieceDir);
const docPath = path.join(pieceDir, `${pieceName}.md`);
const ytPath = path.join(pieceDir, `${pieceName}.youtube.md`);
const shortsMdPath = path.join(pieceDir, "shorts", `${pieceName}.shorts.md`);

console.log(`\n=== deph Instructional Composition · ${pieceName} ===`);
console.log(`Location:    ${pieceDir}`);
console.log(`Format:      ${formatArg === "9x16" ? "9:16 Short (media/" + pieceName + "/shorts/)" : "16:9 4K (media/" + pieceName + "/renders/)"}`);
console.log(`Language:    ${langArg.toUpperCase()} (default EN on-screen & primary metadata + ES localization)`);

if (formatArg === "9x16") {
  // Delegate vertical Short rendering/upload of this instructional piece to short.mjs (reads media/<name>/shorts/<name>.shorts.md)
  const shortArgs = [path.join(__dirname, "short.mjs"), pieceName];
  if (dryRun) shortArgs.push("--dry-run");
  if (doUpload) shortArgs.push("--upload");
  shortArgs.push(`--privacy=${privacyStatus}`);
  shortArgs.push(`--lang=${langArg}`);
  const res = spawnSync("node", shortArgs, { stdio: "inherit" });
  process.exit(res.status ?? 0);
}

// 16:9 4K full instructional composition workflow
const outMp4 = path.join(pieceDir, "renders", `${pieceName}.mp4`);
let stepsProps = null;
if (fs.existsSync(docPath)) {
  const md = fs.readFileSync(docPath, "utf8");
  const match = md.match(/```json\s+edu-steps\n([\s\S]*?)```/);
  if (match) {
    stepsProps = JSON.parse(match[1]);
  }
}

if (dryRun) {
  const pack = fs.existsSync(ytPath) ? parsePublishPack(pieceName) : null;
  console.log("\n--- DRY RUN: Standalone Instructional Piece ---");
  console.log(
    JSON.stringify(
      {
        pieceName,
        pieceDir,
        remotionCompositionId: pieceName,
        outputMp4: outMp4,
        languageDefault: "en",
        hasYoutubePack: Boolean(pack),
        titleEn: pack?.en?.title || null,
        titleEs: pack?.es?.title || null,
        stepsProps,
      },
      null,
      2
    )
  );
  process.exit(0);
}

const visualsDir = path.join(REPO_ROOT, "tools", "visuals");
const renderArgs = ["render.mjs", pieceName, outMp4];
if (stepsProps) {
  const propsPath = outMp4.replace(/\.mp4$/, ".props.json");
  fs.writeFileSync(propsPath, JSON.stringify(stepsProps, null, 2), "utf8");
  renderArgs.push(`--props=${propsPath}`);
}

console.log(`\nRendering 4K Instructional Piece via Remotion (${pieceName})...`);
const res = spawnSync("node", renderArgs, { cwd: visualsDir, stdio: "inherit" });
if (res.status !== 0) {
  console.error(`✗ Remotion render failed with exit code ${res.status}`);
  process.exit(1);
}
console.log(`✓ Rendered: ${outMp4}`);

if (doUpload) {
  const pubRes = spawnSync(
    "node",
    [path.join(__dirname, "publish.mjs"), pieceName, `--privacy=${privacyStatus}`],
    { stdio: "inherit" }
  );
  process.exit(pubRes.status ?? 0);
}

function scaffoldEducationalPiece(name, rawTitle) {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  const title =
    rawTitle ||
    cleanName
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  const today = new Date().toISOString().slice(0, 10);
  const dir = path.join(REPO_ROOT, "media", cleanName);

  if (fs.existsSync(dir)) {
    console.error(`✗ Composition folder already exists: ${dir}`);
    process.exit(1);
  }

  for (const sub of ["sounds", "visuals", "sync", "renders", "shorts"]) {
    fs.mkdirSync(path.join(dir, sub), { recursive: true });
  }

  const yamlContent = `name: ${cleanName}
title: ${title}
type: educational # standalone instructional composition hanging directly from media/
language: en # default on-screen & primary metadata in English; ES attached via localizations.es
created: ${today}
key: A:lydian # A4 = 432 Hz
tempo:
  cpm: null
arc:
  - { name: hook, cycles: null }
  - { name: explanation, cycles: null }
  - { name: demonstration, cycles: null }
  - { name: conclusion, cycles: null }
total_cycles: null
domains:
  sound:
    status: planned
    file: sounds/${cleanName}.strudel
  visual:
    status: planned
    entry: tools/visuals/src/compositions/${cleanName}/
  sync:
    status: not-built
    output: sync/
  shorts:
    status: planned
    dir: shorts/
    file: shorts/${cleanName}.shorts.md
publish:
  status: planned
  file: ${cleanName}.youtube.md
doc: ${cleanName}.md
`;

  const mdContent = `# ${title} — Instructional Composition

- **Name:** \`${cleanName}\`
- **Type:** Standalone Instructional / Educational Piece (\`media/${cleanName}/\`)
- **Default Language:** English (\`EN\`) on screen and primary metadata (Spanish via YouTube \`localizations.es\`)

## Visual Essay Steps (\`EduBreakdown.tsx\`)

\`\`\`json edu-steps
{
  "pieceTitle": "${title.toUpperCase()}",
  "series": "EDU",
  "subtitle": "ACOUSTIC PHYSICS & GENERATIVE MATHEMATICS",
  "ctaText": "EXPLORE THE FULL 4K SERIES ON THE CHANNEL · USE HEADPHONES",
  "bgShift": 0,
  "steps": [
    {
      "tag": "01 · CONCEPT",
      "heading": "${title.toUpperCase()}",
      "body": "Clear, rigorous explanation in English of the acoustic physics, mathematics, or generative code.",
      "formula": "A4 = 432 Hz",
      "pieceStartSeconds": 0,
      "durationSeconds": 12,
      "diagram": "chladni"
    }
  ]
}
\`\`\`
`;

  const ytContent = `# ${title} — YouTube Publish Pack

Source piece: \`media/${cleanName}/${cleanName}.yaml\` · Video file: \`media/${cleanName}/renders/${cleanName}.mp4\`

---

## 1. Title

### English (default)

**Recommended:**
\`\`\`
${title} Explained — Acoustic Physics & Resonance in 432 Hz | deph
\`\`\`

### Español (traducción localizada en YouTube)

**Recomendado:**
\`\`\`
${title} Explicado — Física Acústica y Resonancia a 432 Hz | deph
\`\`\`

---

## 2. Description

### English (default)

\`\`\`
Inside the acoustic physics, mathematics, and generative code of ${title}.

0:00 01 · Introduction
0:12 02 · Acoustic Physics & Mathematics
0:24 03 · Demonstration in 432 Hz
0:36 04 · Binaural Phase & Conclusion

Series playlist: https://www.youtube.com/playlist?list=PLX0Afm4O4W30
Channel: https://www.youtube.com/channel/UC1cFX0dl77im5F5V-RRi6hA

This is music and acoustic physics, not medical advice or treatment.

#cymatics #432hz #resonance #binauralbeats #generativemusic
\`\`\`

### Español (traducción localizada en YouTube)

\`\`\`
Dentro de la física acústica, la matemática y el código generativo de ${title}.

0:00 01 · Introducción
0:12 02 · Física Acústica y Matemática
0:24 03 · Demostración a 432 Hz
0:36 04 · Fase Binaural y Conclusión

Playlist de la serie: https://www.youtube.com/playlist?list=PLX0Afm4O4W30
Canal: https://www.youtube.com/channel/UC1cFX0dl77im5F5V-RRi6hA

Esto es música y física acústica, no consejo médico.

#cymatics #432hz #resonance #binauralbeats #generativemusic
\`\`\`

---

## 3. Tags

\`\`\`
cymatics, chladni figures, 432 hz, binaural beats, resonance, fibonacci music, generative music, ambient music
\`\`\`
`;

  const shortsContent = `# ${title} — YouTube Shorts Pack

Source piece: \`media/${cleanName}/${cleanName}.yaml\`
Shorts directory: \`media/${cleanName}/shorts/\` (\`.shorts.md\` tracked in git; rendered \`.mp4\` git-ignored) · Skill: \`shorts-compose\`

**Tags:** cymatics, chladni figures, 432 hz, binaural beats, resonance, generative music, shorts.

---

## Clip 01 — ${title} (Short Breakdown)

\`\`\`json short-clip
{
  "id": "01",
  "slug": "overview",
  "label": "${title} — Short Breakdown",
  "startSeconds": 0,
  "durationSeconds": 45,
  "hookText": "${title.toUpperCase()}",
  "subText": "Acoustic physics & mathematics · Tuned to A = 432 Hz",
  "titleEn": "${title} Explained in 45 Seconds | 432 Hz Acoustics #Shorts",
  "titleEs": "${title} Explicado en 45 Segundos | Acústica a 432 Hz #Shorts",
  "descriptionEn": "How ${title} works in acoustic physics and generative music tuned to A = 432 Hz.\\n\\nSeries playlist: https://www.youtube.com/playlist?list=PLX0Afm4O4W30\\n\\nThis is music and acoustic physics, not medical advice.\\n\\n#Shorts #cymatics #432hz #resonance #generativemusic",
  "descriptionEs": "Cómo funciona ${title} en la física acústica y la música generativa afinada a A = 432 Hz.\\n\\nPlaylist de la serie: https://www.youtube.com/playlist?list=PLX0Afm4O4W30\\n\\nEsto es música y física acústica, no consejo médico.\\n\\n#Shorts #cymatics #432hz #resonance #generativemusic",
  "props": {
    "title": "${title.toUpperCase()}",
    "series": "EDU",
    "facts": "432 Hz · ACOUSTICS",
    "startSeconds": 0,
    "durationSeconds": 45,
    "hookText": "${title.toUpperCase()}",
    "subText": "Acoustic physics & mathematics · Tuned to A = 432 Hz",
    "ctaText": "FULL BREAKDOWN ON THE CHANNEL",
    "bgShift": 0
  }
}
\`\`\`
`;

  fs.writeFileSync(path.join(dir, `${cleanName}.yaml`), yamlContent, "utf8");
  fs.writeFileSync(path.join(dir, `${cleanName}.md`), mdContent, "utf8");
  fs.writeFileSync(path.join(dir, `${cleanName}.youtube.md`), ytContent, "utf8");
  fs.writeFileSync(path.join(dir, "shorts", `${cleanName}.shorts.md`), shortsContent, "utf8");

  console.log(`✓ Scaffolded standalone instructional composition at ${dir}`);
  console.log(`  - ${cleanName}.yaml`);
  console.log(`  - ${cleanName}.md`);
  console.log(`  - ${cleanName}.youtube.md`);
  console.log(`  - sounds/  visuals/  sync/  renders/  shorts/${cleanName}.shorts.md`);
}
