#!/usr/bin/env node
// Headless Strudel renderer: evaluates a .strudel file in Node and renders it to a real WAV file
// via the real Strudel audio engine (superdough) against node-web-audio-api's OfflineAudioContext.
// No browser, no live audio device. Synth-only for now (Phase 2 of docs/sync-pipeline.md) — sample
// playback (s("bd") etc.) is Phase 3, not yet supported here.
//
// Usage (run from the project root):
//   node tools/sounds/render.mjs <file.strudel> --cycles N --out <output.wav> [--tail S] [--sample-rate N] [--only L]
//
// --cycles is required: the total number of cycles to render (the whole piece, not a preview
// window — unlike the inspector, there's no sensible default here). --tail adds silent seconds
// after the last event so release/reverb tails finish rendering instead of being cut off abruptly
// (default 3s). --only renders just the listed `$:` layers (comma-separated keys as the inspector shows them,
// e.g. --only '$4'): a stem of one voice for a DAW, same length and start as the full render so it lines up
// at bar 1 (see docs/daw-bridge.md).

import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
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

// superdough frees each note's nodes from an `onended` callback (releaseAudioNode -> disconnect()).
// In a real-time context that reclaims memory; in an offline render — which runs as fast as the CPU
// allows — those callbacks fire on the JS thread while the audio thread is mid-render, and the
// concurrent graph edits intermittently lock the engine up (output stuck repeating one 128-sample
// block, heard as a steady tone to the end of the file). Nothing needs freeing in a render that ends
// soon anyway, so disconnect() becomes a no-op *only while the main render is running*.
let renderInProgress = false;
const realDisconnect = AudioNode.prototype.disconnect;
AudioNode.prototype.disconnect = function (...a) {
  if (renderInProgress) return undefined;
  return realDisconnect.apply(this, a);
};

// Seconds of audio between progress checkpoints (see the progress note in main()).
const PROGRESS_EVERY = 30;

function parseArgs(argv) {
  const args = { file: undefined, cycles: undefined, out: undefined, tail: 3, sampleRate: 48000, only: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--cycles') args.cycles = Number(argv[++i]);
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--tail') args.tail = Number(argv[++i]);
    else if (a === '--sample-rate') args.sampleRate = Number(argv[++i]);
    else if (a === '--only') args.only = argv[++i].split(',');
    else if (!args.file) args.file = a;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file || !args.cycles || !args.out) {
    console.error(
      'usage: node tools/sounds/render.mjs <file.strudel> --cycles N --out <output.wav> [--tail S] [--sample-rate N] [--only L]',
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
    ({ pattern, cps } = await evalStrudel(code, { only: args.only }));
  } catch (err) {
    console.error(`ERROR evaluating ${args.file}: ${err.message}`);
    process.exit(1);
  }

  const haps = pattern.queryArc(0, args.cycles).filter((h) => h.hasOnset());
  haps.sort((a, b) => a.whole.begin.valueOf() - b.whole.begin.valueOf());
  console.error(
    `${args.file}: ${haps.length} events over ${args.cycles} cycles at ${cps} cps (${+(cps * 60).toFixed(2)} cpm)`,
  );

  // One reverb (ConvolverNode) exists per orbit, and superdough regenerates its impulse response
  // whenever an event with a different `size` arrives on that orbit. That's tolerable live (events
  // arrive just-in-time) but wrong here: every event is scheduled up front, so voices with different
  // sizes sharing an orbit fight over one IR for the whole piece. Flag it rather than render it silently.
  const sizesByOrbit = new Map();
  for (const { value } of haps) {
    if (!(value.room > 0)) continue;
    const orbit = value.orbit ?? 1;
    if (!sizesByOrbit.has(orbit)) sizesByOrbit.set(orbit, new Set());
    sizesByOrbit.get(orbit).add(value.roomsize ?? value.size ?? 'default');
  }
  for (const [orbit, sizes] of sizesByOrbit) {
    if (sizes.size > 1) {
      console.error(
        `WARNING: orbit ${orbit} has reverb sizes ${[...sizes].join(', ')} — voices with different \`size\` must each use their own .orbit(n), or the shared reverb is regenerated mid-piece (wrong tails, and it can freeze the render).`,
      );
    }
  }

  const durationSec = args.cycles / cps + args.tail;
  const ctx = new OfflineAudioContext(2, Math.ceil(durationSec * args.sampleRate), args.sampleRate);
  const convolvers = [];
  const createConvolver = ctx.createConvolver.bind(ctx);
  ctx.createConvolver = (...a) => {
    const c = createConvolver(...a);
    convolvers.push(c);
    return c;
  };
  setAudioContext(ctx);
  registerSynthSounds();

  for (const hap of haps) {
    const t = hap.whole.begin.valueOf() / cps;
    const dur = (hap.whole.end.valueOf() - hap.whole.begin.valueOf()) / cps;
    await superdough(hap.value, t, dur, cps);
  }

  // superdough builds each reverb's impulse response asynchronously (its own OfflineAudioContext,
  // assigned to convolver.buffer in a callback). If the main render starts first, the buffer gets
  // assigned mid-render and the engine can lock up, looping one 128-sample block (a steady tone)
  // for the rest of the file — observed intermittently. Wait until every reverb actually has its IR.
  const irDeadline = Date.now() + 60000;
  while (convolvers.some((c) => c.buffer == null)) {
    if (Date.now() > irDeadline) {
      console.error('ERROR: timed out waiting for reverb impulse responses to generate.');
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 25));
  }

  // Progress: the offline context is suspended every PROGRESS_EVERY seconds of audio and resumed right away, so each
  // checkpoint is a real measured position in the piece. One JSON line per checkpoint goes to <out>.progress.jsonl
  // (same convention as tools/visuals/render.mjs): read it at any time with `tail -1`.
  console.error('rendering...');
  const progressPath = `${args.out}.progress.jsonl`;
  const renderStart = Date.now();
  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(progressPath, '');
  const logProgress = (entry) =>
    appendFileSync(progressPath, JSON.stringify({ t: new Date().toISOString(), ...entry }) + '\n');
  for (let at = PROGRESS_EVERY; at < durationSec; at += PROGRESS_EVERY) {
    ctx.suspend(at).then(async () => {
      logProgress({ stage: 'rendering', progress: +(at / durationSec).toFixed(4), renderedSeconds: at, elapsedMs: Date.now() - renderStart });
      await ctx.resume();
    });
  }
  renderInProgress = true;
  const buffer = await ctx.startRendering();
  renderInProgress = false;
  logProgress({ stage: 'done', progress: 1, renderedSeconds: durationSec, elapsedMs: Date.now() - renderStart });
  console.error(`rendered in ${((Date.now() - renderStart) / 1000).toFixed(0)} s`);

  const ch0 = buffer.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < ch0.length; i++) {
    const v = Math.abs(ch0[i]);
    if (v > peak) peak = v;
  }
  // Detect the engine-lockup failure mode: non-silent audio that repeats one 128-sample render
  // block unchanged for 2+ seconds. Music never does that; refuse to write a corrupt file.
  const BLOCK = 128;
  const minRun = args.sampleRate * 2;
  let run = 0;
  for (let i = 0; i + BLOCK < ch0.length; i++) {
    if (ch0[i] === ch0[i + BLOCK] && Math.abs(ch0[i]) > 1e-4) {
      if (++run >= minRun) {
        const attempt = Number(process.env.DEPH_RENDER_ATTEMPT ?? 1);
        console.error(
          `render is corrupt — a 128-sample block repeats from ~${((i - run) / args.sampleRate).toFixed(1)}s (engine lockup), attempt ${attempt}/3.`,
        );
        if (attempt >= 3) {
          console.error(`ERROR: still corrupt after 3 attempts. Not writing ${args.out}.`);
          process.exit(1);
        }
        // A fresh process gets a clean engine and audio graph; the lockup is intermittent.
        const retry = spawnSync(process.execPath, process.argv.slice(1), {
          stdio: 'inherit',
          env: { ...process.env, DEPH_RENDER_ATTEMPT: String(attempt + 1) },
        });
        process.exit(retry.status ?? 1);
      }
    } else if (ch0[i] !== ch0[i + BLOCK]) {
      run = 0;
    }
  }

  if (peak < 1e-4) {
    console.error(`WARNING: rendered audio is silent (peak=${peak}) — check the pattern actually has audible events.`);
  }

  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, audioBufferToWavBuffer(buffer));
  console.error(`wrote ${args.out} (${buffer.duration.toFixed(1)}s, peak=${peak.toFixed(4)})`);
}

main();
