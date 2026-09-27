#!/usr/bin/env node
// DAW half of the bridge: exports a whole Strudel piece as MIDI for Ableton (or any DAW), so its notes can be
// played by real VST/AU instruments there. See docs/daw-bridge.md for the mapping and the Ableton workflow.
//
// Usage (from the project root):
//   node tools/sounds/midi.mjs <file.strudel> --cycles N --out-dir media/<name>/daw [--names a,b,c] [--bend-range 2] [--vel-range 40] [--no-bend a,b]
//
// Writes into --out-dir:
//   <name>.mid          one multi-track MIDI file: a conductor track (tempo, 4/4) + one track per pitched `$:` layer
//   tracks/NN-<t>.mid   the same tracks one per file, for dragging a single voice onto a single Ableton track
//   tracks.json         per track: layer, channel, pitch bend, peak gain, suggested fader dB, and the Strudel
//                       parameters MIDI does not carry (envelopes, filter, reverb, delay, pan) for recreating
//                       them with plugins; plus the audio-only layers that need a stem (render.mjs --only)
//
// --names labels the pitched layers in order (default: the layer key, e.g. $0). --bend-range must match the
// pitch-bend range of the synth that plays the track (almost every synth defaults to +/-2 semitones). --no-bend lists
// tracks whose tuning the synth itself applies from a tuning file (scl.mjs): no bend, nearest 12-TET keys.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';
import { evalStrudel } from './eval-strudel.mjs';
import { buildTracks, smf, bpmFromCps } from './midi-map.mjs';

function parseArgs(argv) {
  const a = { file: undefined, cycles: undefined, outDir: undefined, names: [], bendRange: 2, velRange: 40, noBend: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--cycles') a.cycles = Number(argv[++i]);
    else if (argv[i] === '--out-dir') a.outDir = argv[++i];
    else if (argv[i] === '--names') a.names = argv[++i].split(',');
    else if (argv[i] === '--bend-range') a.bendRange = Number(argv[++i]);
    else if (argv[i] === '--vel-range') a.velRange = Number(argv[++i]);
    else if (argv[i] === '--no-bend') a.noBend = argv[++i].split(',');
    else if (!a.file) a.file = argv[i];
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
if (!args.file || !args.cycles || !args.outDir) {
  console.error('usage: node tools/sounds/midi.mjs <file.strudel> --cycles N --out-dir <dir> [--names a,b,c] [--bend-range 2] [--vel-range 40] [--no-bend a,b]');
  process.exit(2);
}

let code;
try {
  code = readFileSync(args.file, 'utf8');
} catch (err) {
  console.error(err.code === 'ENOENT' ? `file not found: ${args.file}` : `ERROR reading ${args.file}: ${err.message}`);
  process.exit(2);
}

let pattern, cps, core;
try {
  ({ pattern, cps, core } = await evalStrudel(code));
} catch (err) {
  console.error(`ERROR evaluating ${args.file}: ${err.message}`);
  process.exit(1);
}

const title = basename(args.file, '.strudel');
const haps = pattern.queryArc(0, args.cycles).filter((h) => h.hasOnset());
const { tracks, audioOnly, warnings } = buildTracks(haps, {
  noteToMidi: core.noteToMidi,
  bendRange: args.bendRange,
  velRange: args.velRange,
  noBend: args.noBend,
  names: args.names,
});
const bpm = bpmFromCps(cps);

mkdirSync(args.outDir, { recursive: true });
rmSync(join(args.outDir, 'tracks'), { recursive: true, force: true }); // no stale files from renamed tracks
mkdirSync(join(args.outDir, 'tracks'));
writeFileSync(join(args.outDir, `${title}.mid`), smf(tracks, { bpm, title }));
tracks.forEach((t, i) => {
  const file = `${String(i + 1).padStart(2, '0')}-${t.name.replace(/[^\w-]+/g, '_')}.mid`;
  t.file = `tracks/${file}`;
  writeFileSync(join(args.outDir, t.file), smf([t], { bpm, title: t.name }));
});

const info = {
  source: args.file,
  cps,
  bpm,
  timeSignature: '4/4',
  cyclesPerBar: 1,
  totalCycles: args.cycles,
  durationSeconds: args.cycles / cps,
  bendRange: args.bendRange,
  velRange: args.velRange,
  tracks: tracks.map(({ notes, ...t }) => ({ ...t, noteCount: notes.length })),
  audioOnly,
  warnings,
  generatedAt: new Date().toISOString(),
};
writeFileSync(join(args.outDir, 'tracks.json'), JSON.stringify(info, null, 2) + '\n');

console.error(`${args.file}: ${args.cycles} cycles at ${bpm} BPM (1 cycle = 1 bar of 4/4) -> ${args.outDir}/${title}.mid`);
for (const t of tracks) {
  console.error(
    `  ch ${t.channel + 1}  ${t.name.padEnd(10)} ${String(t.notes.length).padStart(4)} notes  ` +
      `pitch ${t.pitchRange.join('-')}  tuning ${t.cents >= 0 ? '+' : ''}${t.cents} cents` +
      `${t.bend !== null ? ` (bend ${t.bend})` : t.synthTuned ? ' (no bend: tuned by the synth)' : ''}  fader ${t.suggestedFaderDb} dB`,
  );
}
for (const a of audioOnly) console.error(`  audio-only ${a.layer} (${a.events} events, no notes): render it as a stem with render.mjs --only '${a.layer}'`);
for (const w of warnings) console.error(`WARNING: ${w}`);
