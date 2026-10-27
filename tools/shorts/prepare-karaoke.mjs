import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const shortsDir = path.join(root, "media/gnosis/shorts");

// 1. Process EN with exact ElevenLabs alignment
const enAlign = JSON.parse(fs.readFileSync(path.join(shortsDir, "gnosis-en-alignment.json"), "utf8"));
const chars = enAlign.characters;
const starts = enAlign.character_start_times_seconds;
const ends = enAlign.character_end_times_seconds;

const enWords = [];
let curWord = "";
let wStart = null;
let wEnd = null;

for (let i = 0; i < chars.length; i++) {
  const c = chars[i];
  if (/\s/.test(c)) {
    if (curWord) {
      enWords.push({ text: curWord, start: wStart, end: wEnd });
      curWord = "";
      wStart = null;
      wEnd = null;
    }
  } else {
    if (wStart === null) wStart = starts[i];
    wEnd = ends[i];
    curWord += c;
  }
}
if (curWord) enWords.push({ text: curWord, start: wStart, end: wEnd });

// Group EN words into phrases matching gnosis-captions-en.json
const enCaptions = JSON.parse(fs.readFileSync(path.join(shortsDir, "gnosis-captions-en.json"), "utf8"));
let wordIdx = 0;
const enPhrases = enCaptions.map(c => {
  const phraseWords = c.text.split(/\s+/);
  const matchedWords = [];
  for (const pw of phraseWords) {
    if (wordIdx < enWords.length) {
      matchedWords.push({
        text: pw,
        start: enWords[wordIdx].start,
        end: enWords[wordIdx].end
      });
      wordIdx++;
    }
  }
  return {
    start: matchedWords.length ? matchedWords[0].start : c.start,
    end: matchedWords.length ? matchedWords[matchedWords.length - 1].end : c.end,
    words: matchedWords
  };
});

fs.writeFileSync(path.join(shortsDir, "gnosis-karaoke-en.json"), JSON.stringify(enPhrases, null, 2));
console.log(`✓ Generated EN karaoke with ${enPhrases.length} phrases and ${wordIdx} words`);

// 2. Process ES proportionally per phrase based on character weights
const esCaptions = JSON.parse(fs.readFileSync(path.join(shortsDir, "gnosis-captions-es.json"), "utf8"));
const esPhrases = esCaptions.map(c => {
  const wordsRaw = c.text.split(/\s+/);
  const totalChars = wordsRaw.reduce((sum, w) => sum + w.length, 0);
  const pDuration = c.end - c.start;
  let curT = c.start;

  const words = wordsRaw.map((w, idx) => {
    const fraction = w.length / totalChars;
    const wDuration = pDuration * fraction;
    const start = Number(curT.toFixed(3));
    const end = Number((curT + wDuration).toFixed(3));
    curT += wDuration;
    return { text: w, start, end };
  });

  return {
    start: c.start,
    end: c.end,
    words
  };
});

fs.writeFileSync(path.join(shortsDir, "gnosis-karaoke-es.json"), JSON.stringify(esPhrases, null, 2));
console.log(`✓ Generated ES karaoke with ${esPhrases.length} phrases`);
