#!/usr/bin/env node
// Checks that an audio file (typically a mix exported from Ableton after the DAW bridge) still lines up with the
// piece's frames.json — i.e. that the video's event keyframes will land on the sound. See docs/daw-bridge.md.
//
// Usage (from the project root; needs ffmpeg):
//   node tools/sounds/align-check.mjs <audio.wav> --frames media/<name>/sync/frames.json [--layer '$3'] [--tolerance 35]
//
// It high-passes the audio at 500 Hz (drones, sub and binaural beats would otherwise dominate the energy),
// takes the rise of its log energy in 5 ms steps, and slides one layer's onsets from frames.json across it:
// the shift (within +/- 1 s) at which those onsets sit on the strongest rises overall is the global offset —
// an export that started at the wrong bar, a plugin with latency, a region moved by hand. It must be within
// --tolerance ms (default 35, about one frame at 30 fps). The rise peaks at the END of an attack, so a perfectly
// aligned file still reads slightly late: Slow Drift's own render reads +15 ms on its bells; a known 250 ms
// delay read +265 and a file cut 100 ms early read -85 (tested). One onset alone is unreliable in a full mix (another voice may rise louder nearby); summing
// every onset of the layer is what makes the peak stand out.
// Default layer: the one whose notes have the shortest attack — slow swells (a 6 s drone) have no clear onset
// to measure, a bell does. It is a check, not a proof: it measures one layer's attacks, not every sound.

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const args = { audio: undefined, frames: undefined, layer: undefined, tolerance: 35 };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--frames') args.frames = argv[++i];
  else if (argv[i] === '--layer') args.layer = argv[++i];
  else if (argv[i] === '--tolerance') args.tolerance = Number(argv[++i]);
  else if (!args.audio) args.audio = argv[i];
}
if (!args.audio || !args.frames) {
  console.error("usage: node tools/sounds/align-check.mjs <audio.wav> --frames <frames.json> [--layer '$3'] [--tolerance 35]");
  process.exit(2);
}

const events = JSON.parse(readFileSync(args.frames, 'utf8'));
if (!args.layer) {
  const attack = new Map();
  for (const e of events) attack.set(e.layer, Math.min(attack.get(e.layer) ?? Infinity, e.value.attack ?? 0.001));
  args.layer = [...attack].sort((a, b) => a[1] - b[1])[0][0];
}
const onsets = [...new Set(events.filter((e) => e.layer === args.layer).map((e) => e.seconds))];
if (!onsets.length) {
  console.error(`no events for layer ${args.layer} in ${args.frames}`);
  process.exit(1);
}

const SR = 8000;
const ff = spawnSync(
  'ffmpeg',
  ['-v', 'error', '-i', args.audio, '-ac', '1', '-af', 'highpass=f=500:poles=2', '-ar', String(SR), '-f', 'f32le', '-'],
  { maxBuffer: 1 << 30 },
);
if (ff.status !== 0) {
  console.error(`ffmpeg could not read ${args.audio}: ${ff.stderr?.toString().trim() || ff.error?.message}`);
  process.exit(1);
}
const pcm = new Float32Array(ff.stdout.buffer, ff.stdout.byteOffset, ff.stdout.byteLength / 4);

// Log energy in 5 ms hops, then its positive slope over 10 ms = onset strength.
const HOP_MS = 5;
const HOP = (SR * HOP_MS) / 1000;
const energy = new Float32Array(Math.floor(pcm.length / HOP));
for (let i = 0; i < energy.length; i++) {
  let s = 0;
  for (let j = i * HOP; j < (i + 1) * HOP; j++) s += pcm[j] * pcm[j];
  energy[i] = 10 * Math.log10(s / HOP + 1e-12);
}
const rise = (i) => (i >= 2 && i < energy.length ? Math.max(0, energy[i] - energy[i - 2]) : 0);

const MAX_LAG = 1000 / HOP_MS;
const centers = onsets.map((t) => Math.round((t * 1000) / HOP_MS));
const scores = [];
for (let lag = -MAX_LAG; lag <= MAX_LAG; lag++) {
  let s = 0;
  for (const c of centers) s += rise(c + lag);
  scores.push({ ms: lag * HOP_MS, score: s / centers.length });
}
const best = scores.reduce((a, b) => (b.score > a.score ? b : a));
const typical = [...scores].sort((a, b) => a.score - b.score)[Math.floor(scores.length / 2)].score;
const contrast = best.score / (typical || 1e-9);
const ok = Math.abs(best.ms) <= args.tolerance && contrast >= 3;
console.log(
  `${args.audio}: layer ${args.layer}, ${onsets.length} onsets; best offset ${best.ms >= 0 ? '+' : ''}${best.ms} ms ` +
    `(peak ${contrast.toFixed(1)}x the typical score) -> ` +
    (contrast < 3
      ? 'INCONCLUSIVE: no clear peak (is this layer audible in the mix? try --layer)'
      : ok
        ? 'ALIGNED'
        : `NOT ALIGNED (tolerance ${args.tolerance} ms): audio is ${best.ms > 0 ? 'late' : 'early'} by ${Math.abs(best.ms)} ms`),
);
process.exit(ok ? 0 : 1);
