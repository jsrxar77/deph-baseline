#!/usr/bin/env node
// Video-keyframe half of the audio/video bridge: turns every event of a Strudel piece into frame-numbered
// data for the Remotion side (see docs/sync-pipeline.md). Writes frames.json and manifest.json.
//
// Usage (from the project root):
//   node tools/sounds/frames.mjs <file.strudel> --cycles N --out-dir <dir> [--fps 60] [--audio <audio.wav>]
//
// The cycles -> seconds -> frames conversion lives HERE and nowhere else: seconds = cycles / cps (cps read
// from the piece's own setcpm), frames = seconds * fps. Events are the same ones render.mjs schedules (same
// evaluation, same onset filter), so an event's `seconds` is exactly when its sound starts in the rendered
// audio. Nothing on the video side needs to know anything about Strudel.
//
// frames.json: [{ layer, cycleBegin, cycleEnd, seconds, endSeconds, frame, endFrame, value }, ...] sorted by
// onset. `value` is the event's raw parameters (note as MIDI number, s, gain, pan, ...). `frame` is a float
// (sub-frame precision); floor it or interpolate as needed.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { evalStrudel } from './eval-strudel.mjs';

function parseArgs(argv) {
  const a = { file: undefined, cycles: undefined, outDir: undefined, fps: 60, audio: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--cycles') a.cycles = Number(argv[++i]);
    else if (argv[i] === '--out-dir') a.outDir = argv[++i];
    else if (argv[i] === '--fps') a.fps = Number(argv[++i]);
    else if (argv[i] === '--audio') a.audio = argv[++i];
    else if (!a.file) a.file = argv[i];
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
if (!args.file || !args.cycles || !args.outDir) {
  console.error('usage: node tools/sounds/frames.mjs <file.strudel> --cycles N --out-dir <dir> [--fps 60] [--audio <audio.wav>]');
  process.exit(2);
}

let code;
try {
  code = readFileSync(args.file, 'utf8');
} catch (err) {
  console.error(err.code === 'ENOENT' ? `file not found: ${args.file}` : `ERROR reading ${args.file}: ${err.message}`);
  process.exit(2);
}

let pattern, cps, layers;
try {
  ({ pattern, cps, layers } = await evalStrudel(code));
} catch (err) {
  console.error(`ERROR evaluating ${args.file}: ${err.message}`);
  process.exit(1);
}

const toSeconds = (cycles) => cycles / cps;
const toFrames = (seconds) => seconds * args.fps;

const haps = pattern.queryArc(0, args.cycles).filter((h) => h.hasOnset());
haps.sort((a, b) => a.whole.begin.valueOf() - b.whole.begin.valueOf());

const events = haps.map((h) => {
  const { layer, ...value } = typeof h.value === 'object' ? h.value : { value: h.value, layer: undefined };
  const cycleBegin = h.whole.begin.valueOf();
  const cycleEnd = h.whole.end.valueOf();
  const seconds = toSeconds(cycleBegin);
  const endSeconds = toSeconds(cycleEnd);
  return {
    layer,
    cycleBegin,
    cycleEnd,
    seconds: +seconds.toFixed(6),
    endSeconds: +endSeconds.toFixed(6),
    frame: +toFrames(seconds).toFixed(4),
    endFrame: +toFrames(endSeconds).toFixed(4),
    value,
  };
});

// Total duration comes from the rendered audio when given (its real length, tail included); otherwise it
// is the piece length only.
let durationSeconds = toSeconds(args.cycles);
let sampleRate = null;
if (args.audio) {
  const wav = readFileSync(args.audio);
  sampleRate = wav.readUInt32LE(24);
  const channels = wav.readUInt16LE(22);
  const bits = wav.readUInt16LE(34);
  durationSeconds = (wav.length - 44) / (sampleRate * channels * (bits / 8));
}

const layerSummary = {};
for (const e of events) {
  const s = (layerSummary[e.layer] ??= { events: 0, sounds: new Set() });
  s.events++;
  if (e.value.s) s.sounds.add(e.value.s);
}
for (const k of Object.keys(layerSummary)) layerSummary[k].sounds = [...layerSummary[k].sounds];

const manifest = {
  source: args.file,
  cps,
  cpm: +(cps * 60).toFixed(4),
  totalCycles: args.cycles,
  fps: args.fps,
  sampleRate,
  durationSeconds: +durationSeconds.toFixed(4),
  totalFrames: Math.ceil(durationSeconds * args.fps),
  frames: 'frames.json',
  audio: args.audio ? basename(args.audio) : null,
  layers: layerSummary,
  generatedAt: new Date().toISOString(),
};

mkdirSync(args.outDir, { recursive: true });
writeFileSync(join(args.outDir, 'frames.json'), JSON.stringify(events));
writeFileSync(join(args.outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.error(
  `${args.file}: ${events.length} events over ${args.cycles} cycles at ${cps} cps -> ${args.fps} fps; ` +
    `${manifest.totalFrames} frames (${manifest.durationSeconds}s). Wrote frames.json + manifest.json to ${args.outDir}`,
);
