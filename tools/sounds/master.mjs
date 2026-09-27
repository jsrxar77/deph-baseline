#!/usr/bin/env node
// Loudness master for a rendered piece: measures integrated loudness (EBU R128 LUFS) and true peak with
// ffmpeg, applies ONE constant gain to reach the target loudness, and verifies the result. No compression,
// no EQ — the piece's own dynamics (its arc) are kept exactly. If the gain would push the true peak above
// the ceiling, a transparent limiter catches only those peaks and the shortfall is reported.
//
// Usage (from the project root):
//   node tools/sounds/master.mjs <in.wav> --out <out.wav> [--lufs -16] [--ceiling -1]
//   node tools/sounds/master.mjs <in.wav> --measure      (only report loudness/true peak against the targets; for
//                                                         a file already mastered elsewhere, e.g. in Ableton)
//
// Needs ffmpeg on PATH. Length and sample rate are unchanged, so the master stays sample-aligned with the
// raw render (the video's audio-reactive analysis keeps reading the raw file; only playback uses the master).

import { spawnSync } from 'node:child_process';

function parseArgs(argv) {
  const a = { file: undefined, out: undefined, lufs: -16, ceiling: -1, measure: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') a.out = argv[++i];
    else if (argv[i] === '--lufs') a.lufs = Number(argv[++i]);
    else if (argv[i] === '--ceiling') a.ceiling = Number(argv[++i]);
    else if (argv[i] === '--measure') a.measure = true;
    else if (!a.file) a.file = argv[i];
  }
  return a;
}

function measure(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  });
  const text = r.stderr;
  const tail = text.slice(text.lastIndexOf('Summary:'));
  const grab = (re) => {
    const m = tail.match(re);
    if (!m) throw new Error(`could not read loudness measurement for ${file}`);
    return Number(m[1]);
  };
  return {
    lufs: grab(/I:\s+(-?[\d.]+) LUFS/),
    lra: grab(/LRA:\s+(-?[\d.]+) LU/),
    truePeak: grab(/Peak:\s+(-?[\d.]+) dBFS/),
  };
}

const args = parseArgs(process.argv.slice(2));
if (!args.file || (!args.out && !args.measure)) {
  console.error('usage: node tools/sounds/master.mjs <in.wav> (--out <out.wav> | --measure) [--lufs -16] [--ceiling -1]');
  process.exit(2);
}

const before = measure(args.file);
if (args.measure) {
  const m = before;
  console.log(`${args.file}: ${m.lufs.toFixed(1)} LUFS, LRA ${m.lra.toFixed(1)} LU, true peak ${m.truePeak.toFixed(1)} dBFS`);
  const off = [];
  if (Math.abs(m.lufs - args.lufs) > 1) off.push(`loudness is ${(m.lufs - args.lufs).toFixed(1)} LU from the ${args.lufs} LUFS target`);
  if (m.truePeak > args.ceiling) off.push(`true peak is over the ${args.ceiling} dBTP ceiling`);
  console.log(off.length ? `NOT OK: ${off.join('; ')}` : 'OK: within 1 LU of the target and under the ceiling');
  process.exit(off.length ? 1 : 0);
}
const gainDb = args.lufs - before.lufs;
const peakAfter = before.truePeak + gainDb;
const needsLimiter = peakAfter > args.ceiling;
const fmt = (m) => `${m.lufs.toFixed(1)} LUFS, LRA ${m.lra.toFixed(1)} LU, true peak ${m.truePeak.toFixed(1)} dBFS`;
console.error(`input : ${fmt(before)}`);
console.error(
  `gain  : ${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(2)} dB to reach ${args.lufs} LUFS` +
    (needsLimiter ? ` (peaks would reach ${peakAfter.toFixed(1)} dBFS, over the ${args.ceiling} ceiling: limiter engaged)` : ` (peak lands at ${peakAfter.toFixed(1)} dBFS, under the ${args.ceiling} ceiling: no limiter needed)`),
);

const filter = needsLimiter
  ? `volume=${gainDb.toFixed(3)}dB,alimiter=limit=${(10 ** (args.ceiling / 20)).toFixed(4)}:attack=5:release=100:level=disabled`
  : `volume=${gainDb.toFixed(3)}dB`;
const enc = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', args.file, '-af', filter, '-c:a', 'pcm_s16le', args.out], {
  encoding: 'utf8',
});
if (enc.status !== 0) {
  console.error(`ffmpeg failed: ${enc.stderr}`);
  process.exit(1);
}

const after = measure(args.out);
console.error(`output: ${fmt(after)}`);
if (after.truePeak > args.ceiling + 0.05) console.error(`WARNING: true peak ${after.truePeak.toFixed(1)} dBFS is above the ${args.ceiling} ceiling.`);
if (Math.abs(after.lufs - args.lufs) > 0.5) console.error(`WARNING: loudness ${after.lufs.toFixed(1)} LUFS is not within 0.5 of the ${args.lufs} target.`);
console.error(`wrote ${args.out}`);
