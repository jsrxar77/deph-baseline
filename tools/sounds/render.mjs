#!/usr/bin/env node
// Headless Strudel renderer: evaluates a .strudel file in Node and renders it to a real WAV file
// via the real Strudel audio engine (superdough) against node-web-audio-api's OfflineAudioContext.
// No browser, no live audio device. Synth-only for now (Phase 2 of docs/sync-pipeline.md) — sample
// playback (s("bd") etc.) is Phase 3, not yet supported here.
//
// Usage (run from the project root):
//   node tools/sounds/render.mjs <file.strudel> --cycles N --out <output.wav> [--tail S] [--sample-rate N]
//
// --cycles is required: the total number of cycles to render (the whole piece, not a preview
// window — unlike the inspector, there's no sensible default here). --tail adds silent seconds
// after the last event so release/reverb tails finish rendering instead of being cut off abruptly
// (default 3s).

import { readFileSync, writeFileSync } from 'node:fs';
import { evalStrudel } from './eval-strudel.mjs';
import { audioBufferToWavBuffer } from './wav.mjs';

// Every class node-web-audio-api exports must be a global *before* `superdough` is imported — its
// compiled bundle does `instanceof BaseAudioContext` etc. at both import- and call-time. The
// window/document EventTarget stubs are needed too (reverb does a bare `window.x = ...` debug
// write, and both @strudel/core and superdough gate some internal logging on `typeof window`,
// then call real EventTarget methods on it). See docs/sync-pipeline.md for how this list was
// found — each entry came from hitting the actual error, not from guessing upfront. Do not expand
// this list preemptively; add to it only when a new error demands it.
const WA = await import('node-web-audio-api');
for (const [key, val] of Object.entries(WA)) {
  if (key !== 'default' && key !== 'mediaDevices') globalThis[key] = val;
}
try {
  globalThis.navigator.mediaDevices = WA.mediaDevices;
} catch {
  // Node's built-in `navigator` global is getter-only in some versions; harmless to skip —
  // nothing rendered here uses navigator.mediaDevices.
}
globalThis.window = globalThis.window || new EventTarget();
globalThis.document = globalThis.document || new EventTarget();

const { superdough, setAudioContext, registerSynthSounds } = await import('superdough');

function parseArgs(argv) {
  const args = { file: undefined, cycles: undefined, out: undefined, tail: 3, sampleRate: 48000 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--cycles') args.cycles = Number(argv[++i]);
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--tail') args.tail = Number(argv[++i]);
    else if (a === '--sample-rate') args.sampleRate = Number(argv[++i]);
    else if (!args.file) args.file = a;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file || !args.cycles || !args.out) {
    console.error(
      'usage: node tools/sounds/render.mjs <file.strudel> --cycles N --out <output.wav> [--tail S] [--sample-rate N]',
    );
    process.exit(2);
  }

  let code;
  try {
    code = readFileSync(args.file, 'utf8');
  } catch (err) {
    console.error(err.code === 'ENOENT' ? `file not found: ${args.file}` : `ERROR reading ${args.file}: ${err.message}`);
    process.exit(2);
  }

  let pattern, cps;
  try {
    ({ pattern, cps } = await evalStrudel(code));
  } catch (err) {
    console.error(`ERROR evaluating ${args.file}: ${err.message}`);
    process.exit(1);
  }

  const haps = pattern.queryArc(0, args.cycles).filter((h) => h.hasOnset());
  haps.sort((a, b) => a.whole.begin.valueOf() - b.whole.begin.valueOf());
  console.error(
    `${args.file}: ${haps.length} events over ${args.cycles} cycles at ${cps} cps (${+(cps * 60).toFixed(2)} cpm)`,
  );

  const durationSec = args.cycles / cps + args.tail;
  const ctx = new OfflineAudioContext(2, Math.ceil(durationSec * args.sampleRate), args.sampleRate);
  setAudioContext(ctx);
  registerSynthSounds();

  for (const hap of haps) {
    const t = hap.whole.begin.valueOf() / cps;
    const dur = (hap.whole.end.valueOf() - hap.whole.begin.valueOf()) / cps;
    await superdough(hap.value, t, dur, cps);
  }

  console.error('rendering...');
  const buffer = await ctx.startRendering();

  const ch0 = buffer.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < ch0.length; i++) {
    const v = Math.abs(ch0[i]);
    if (v > peak) peak = v;
  }
  if (peak < 1e-4) {
    console.error(`WARNING: rendered audio is silent (peak=${peak}) — check the pattern actually has audible events.`);
  }

  writeFileSync(args.out, audioBufferToWavBuffer(buffer));
  console.error(`wrote ${args.out} (${buffer.duration.toFixed(1)}s, peak=${peak.toFixed(4)})`);
}

main();
