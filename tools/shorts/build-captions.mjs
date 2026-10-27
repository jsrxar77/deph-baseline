#!/usr/bin/env node
// Turns a narration script + (optional) ElevenLabs character-level alignment into timed caption
// cards for a HyperFrames short: splits the script into cards at major punctuation (. ? :), finds
// each card's exact time window from the alignment, and picks one "key word" per card to highlight
// (longest word outside a small stopword list — a heuristic, not derived from the actual audio stress).
//
// Usage:
//   node tools/shorts/build-captions.mjs <script.txt> --alignment <alignment.json> --out <captions.json>
//   node tools/shorts/build-captions.mjs <script.txt> --duration 35.71 --out <captions.json>   # no
//   alignment available (e.g. a paid library voice generated outside the API) — splits the cards'
//   timing proportionally by character count instead. Less exact; say so wherever these captions are used.
import fs from "node:fs";

function parseArgs(argv) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      flags[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    } else pos.push(a);
  }
  return { pos, flags };
}

const STOPWORDS = new Set([
  // EN
  "the", "and", "for", "that", "this", "with", "your", "you", "are", "was", "were", "being", "just",
  "same", "one", "other", "into", "does", "everything", "something", "more", "like", "about", "what",
  "being", "trapped", "free", "have", "has", "had", "not", "but", "when", "then", "than", "from",
  // ES
  "que", "para", "esta", "este", "esto", "eso", "sus", "una", "uno", "otra", "otro", "más", "todo",
  "algo", "como", "muy", "con", "por", "del", "las", "los", "son", "fue", "era", "sin", "entre",
]);

function pickHighlight(cardText) {
  const words = cardText.match(/[\p{L}\p{M}'’]+/gu) || [];
  let best = "", bestLen = 0;
  for (const w of words) {
    const clean = w.toLowerCase();
    if (STOPWORDS.has(clean) || clean.length < 5) continue;
    if (w.length > bestLen) { best = w; bestLen = w.length; }
  }
  return best || words[0] || "";
}

// Splits `script` into cards at ., ?, : — keeping the punctuation with its card, trimming whitespace.
// Returns [{ text, start, end }] where start/end are CHARACTER indices into `script` (end exclusive).
function splitCards(script) {
  const cards = [];
  let cardStart = 0;
  for (let i = 0; i < script.length; i++) {
    if (".?:".includes(script[i])) {
      const raw = script.slice(cardStart, i + 1);
      const trimmedStart = cardStart + (raw.length - raw.trimStart().length);
      const text = script.slice(trimmedStart, i + 1).trim();
      if (text) cards.push({ text, start: trimmedStart, end: i + 1 });
      cardStart = i + 1;
    }
  }
  const rest = script.slice(cardStart).trim();
  if (rest) cards.push({ text: rest, start: script.length - rest.length, end: script.length });
  return cards;
}

const { pos, flags } = parseArgs(process.argv.slice(2));
const scriptPath = pos[0];
if (!scriptPath || !flags.out) {
  console.error("Usage: node build-captions.mjs <script.txt> (--alignment <alignment.json> | --duration N) --out <captions.json>");
  process.exit(1);
}
const script = fs.readFileSync(scriptPath, "utf8").replace(/\s+/g, " ").trim();
const cardsByChar = splitCards(script);

let cards;
if (flags.alignment) {
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } =
    JSON.parse(fs.readFileSync(flags.alignment, "utf8"));
  // The alignment's own character stream may collapse whitespace differently than our normalized
  // script; map by walking both in lockstep on non-space characters only, which is stable either way.
  const alignedScript = characters.join("");
  if (alignedScript.replace(/\s+/g, " ").trim() !== script) {
    console.error("Warning: alignment text doesn't exactly match the script text — timing may drift.");
  }
  cards = cardsByChar.map(({ text, start, end }) => ({
    text,
    start: Number(starts[Math.min(start, starts.length - 1)].toFixed(3)),
    end: Number(ends[Math.min(end - 1, ends.length - 1)].toFixed(3)),
    highlight: pickHighlight(text),
    timing: "exact",
  }));
} else {
  const totalChars = script.length;
  const duration = Number(flags.duration);
  if (!duration) { console.error("Need --alignment or --duration."); process.exit(1); }
  cards = cardsByChar.map(({ text, start, end }) => ({
    text,
    start: Number(((start / totalChars) * duration).toFixed(3)),
    end: Number(((end / totalChars) * duration).toFixed(3)),
    highlight: pickHighlight(text),
    timing: "estimated (proportional by character count — no API alignment available)",
  }));
}

fs.writeFileSync(flags.out, JSON.stringify(cards, null, 2));
console.log(`Wrote ${cards.length} cards to ${flags.out}`);
for (const c of cards) console.log(`  ${c.start.toFixed(2)}-${c.end.toFixed(2)}  "${c.text}"  [${c.highlight}]`);
