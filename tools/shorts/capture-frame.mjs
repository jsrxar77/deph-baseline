#!/usr/bin/env node
/**
 * capture-frame.mjs — Loads a HyperFrames short (HTML/CSS/GSAP, 1080x1920) in headless
 * Chromium and screenshots one frame at a given time. This is a correctness check for
 * the composition's layout at that moment, not the final renderer: it proves the
 * 1080x1920 canvas, GSAP timeline seek, and screenshot pipeline all work, and is the
 * foundation a future full capture-to-MP4 tool would build on (see deph-shorts skill).
 *
 * Usage:
 *   node tools/shorts/capture-frame.mjs <index.html> --seconds 2.5 --out frame.png
 */

import { chromium } from 'playwright';
import { resolve } from 'node:path';

function parseArgs(argv) {
  const a = { file: undefined, seconds: 0, out: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--seconds') a.seconds = Number(argv[++i]);
    else if (argv[i] === '--out') a.out = argv[++i];
    else if (!a.file) a.file = argv[i];
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
if (!args.file || !args.out) {
  console.error('Usage: node tools/shorts/capture-frame.mjs <index.html> --seconds N --out frame.png');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`file://${resolve(args.file)}`);

// A composition's GSAP timeline lives on window.__timelines[compositionId], paused, per
// the deph-shorts skill convention (same contract the stray hyperframes-video skill used).
await page.evaluate((seconds) => {
  const timelines = window.__timelines || {};
  const first = Object.values(timelines)[0];
  if (first && typeof first.seek === 'function') first.seek(seconds);
}, args.seconds);

await page.screenshot({ path: args.out });
await browser.close();
console.log(`Wrote ${args.out} (1080x1920, t=${args.seconds}s)`);
