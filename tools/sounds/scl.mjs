#!/usr/bin/env node
// Writes a tuning as files that synths load themselves, for voices whose tuning can't (or shouldn't) travel as a MIDI
// pitch bend: Surge XT reads a Scala pair (.scl + .kbm, Menu > Tuning), Serum 2 reads AnaMark .tun ("Load Tuning").
// Needed when Claude builds the Ableton set through the MCP server, which can't write pitch bend (docs/daw-bridge.md),
// and for Pythagorean voices, whose per-note offsets one bend can't carry (midi.mjs --no-bend).
//
// Usage (from the project root):
//   node tools/sounds/scl.mjs --root D --a4 432 --out media/<name>/daw/tuning/<name>-pythagorean
//   node tools/sounds/scl.mjs --root D --a4 432 --equal --out media/<name>/daw/tuning/<name>-432
// writes <out>.scl, <out>.kbm and <out>.tun.
//
// --equal: 12-TET, just moved to the given A4 (every note -31.77 cents at 432). Default: Pythagorean, every degree a
// chain of pure 3:2 fifths from the root; the root sits exactly where 12-TET puts it at the given A4, so it meets every
// equal-tempered voice of the piece on the same frequency and only the other degrees move (a fifth +1.955 cents, a
// fourth -1.955, ...). Fifths per pitch class match FIFTHS_FROM_ROOT in musica-universalis.strudel: -5..+6.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, basename } from 'node:path';

const args = { root: 'D', a4: 432, out: undefined, equal: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--root') args.root = argv[++i];
  else if (argv[i] === '--a4') args.a4 = Number(argv[++i]);
  else if (argv[i] === '--out') args.out = argv[++i];
  else if (argv[i] === '--equal') args.equal = true;
}
const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
if (!args.out || !(args.root in PC)) {
  console.error('usage: node tools/sounds/scl.mjs --root D --a4 432 [--equal] --out <path-without-extension>');
  process.exit(2);
}

// Semitones above the root -> number of pure fifths from the root (negative = fifths down).
const FIFTHS = { 0: 0, 7: 1, 2: 2, 9: 3, 4: 4, 11: 5, 6: 6, 5: -1, 10: -2, 3: -3, 8: -4, 1: -5 };

// k fifths as an exact ratio reduced into one octave [1, 2): 3^k / 2^m, or 2^m / 3^|k|.
function ratio(k) {
  let num = k >= 0 ? 3n ** BigInt(k) : 1n;
  let den = k >= 0 ? 1n : 3n ** BigInt(-k);
  while (num >= 2n * den) den *= 2n;
  while (num < den) num *= 2n;
  return { num, den, cents: 1200 * Math.log2(Number(num) / Number(den)) };
}

const degrees = Array.from({ length: 11 }, (_, i) =>
  args.equal
    ? { semis: i + 1, text: `${(i + 1) * 100}.0`, cents: (i + 1) * 100 }
    : (({ num, den, cents }) => ({ semis: i + 1, text: `${num}/${den}`, cents }))(ratio(FIFTHS[i + 1])),
);
const name = basename(args.out);
const kind = args.equal
  ? `12-tone equal temperament with A4 = ${args.a4} Hz`
  : `Pythagorean 12-tone scale on ${args.root}: every degree a chain of pure 3:2 fifths from the root`;
// Comments only on '!' lines: the Scala format's pitch lines are parsed by some readers as the whole line.
const scl = [
  `! ${name}.scl`,
  ...degrees.map((d) => `! ${d.semis} semitones: ${d.text} = ${d.cents.toFixed(3)} cents (12-TET ${d.semis * 100})`),
  '!',
  `${kind} (tools/sounds/scl.mjs)`,
  ' 12',
  '!',
  ...degrees.map((d) => ` ${d.text}`),
  ' 2/1',
  '',
].join('\n');

// Root key in octave 4 (D4 = MIDI 62) maps to scale degree 0, at its 12-TET frequency for this A4.
const rootKey = 60 + PC[args.root];
const rootHz = args.a4 * 2 ** ((rootKey - 69) / 12);
const kbm = [
  `! ${name}.kbm — maps MIDI ${rootKey} (${args.root}4) to degree 0 of ${name}.scl at ${rootHz.toFixed(4)} Hz (A4 = ${args.a4} in 12-TET)`,
  '! map size',
  '12',
  '! first and last MIDI note',
  '0',
  '127',
  '! middle note (degree 0)',
  String(rootKey),
  '! reference note and its frequency',
  String(rootKey),
  rootHz.toFixed(6),
  '! scale degree of the formal octave',
  '12',
  '! mapping',
  ...Array.from({ length: 12 }, (_, i) => String(i)),
  '',
].join('\n');

// AnaMark .tun: every MIDI note's pitch in cents above BaseFreq (8.1757989156 Hz = MIDI 0 at A4 = 440). The same
// mapping as the .scl/.kbm pair, written out note by note. [Tuning] (format v1) holds integer cents for older readers;
// [Exact Tuning] (v2) holds the exact values.
const BASE_440 = 440 * 2 ** (-69 / 12);
const centsOf = (midi) => {
  const steps = midi - rootKey;
  const octave = Math.floor(steps / 12);
  const degree = ((steps % 12) + 12) % 12;
  const hz = rootHz * 2 ** octave * 2 ** ((degree ? degrees[degree - 1].cents : 0) / 1200);
  return 1200 * Math.log2(hz / BASE_440);
};
const tun = [
  `; ${name}.tun — ${kind} (tools/sounds/scl.mjs)`,
  '[Scale Begin]',
  'Format= "AnaMark-TUN"',
  'FormatVersion= 200',
  'FormatSpecs= "http://www.mark-henning.de/eternity/tuningspecs.html"',
  '[Info]',
  `Name= "${name}"`,
  '[Tuning]',
  ...Array.from({ length: 128 }, (_, n) => `note ${n}= ${Math.round(centsOf(n))}`),
  '[Exact Tuning]',
  `BaseFreq= ${BASE_440.toFixed(10)}`,
  ...Array.from({ length: 128 }, (_, n) => `note ${n}= ${centsOf(n).toFixed(6)}`),
  '[Scale End]',
  '',
].join('\n');

mkdirSync(dirname(args.out), { recursive: true });
writeFileSync(`${args.out}.scl`, scl);
writeFileSync(`${args.out}.kbm`, kbm);
writeFileSync(`${args.out}.tun`, tun);
console.error(`wrote ${args.out}.scl/.kbm/.tun — ${kind}; ${args.root}4 = MIDI ${rootKey} = ${rootHz.toFixed(3)} Hz`);
const hzOf = (m) => BASE_440 * 2 ** (centsOf(m) / 1200);
console.error(`  check: A4 (MIDI 69) = ${hzOf(69).toFixed(3)} Hz, ${args.root}4 = ${hzOf(rootKey).toFixed(3)} Hz, A3 = ${hzOf(57).toFixed(3)} Hz`);
