#!/usr/bin/env node
// Live half of the DAW bridge: plays a Strudel piece in real time to a MIDI port (the macOS IAC bus) so Ableton
// can play it through real VST/AU instruments while you listen — for quickly trying sounds, before exporting
// the final .mid with midi.mjs. Same mapping as the exported file (midi-map.mjs): same channels, velocities
// and tuning bend. See docs/daw-bridge.md.
//
// Why a Node player instead of Strudel's own `.midi()`: the VS Code extension used to play pieces
// (cmillsdev.strudelvs 2.1.0) does not bundle Strudel's MIDI output (checked: no WebMIDI code in its bundle),
// so `.midi()` only works on strudel.cc in Chrome. This keeps the whole loop inside the editor.
//
// Usage (from the project root):
//   node tools/sounds/midi-live.mjs <file.strudel> --cycles N [--from C] [--port IAC] [--names a,b,c]
//                                   [--bend-range 2] [--vel-range 40] [--no-bend a,b] [--watch]
//   node tools/sounds/midi-live.mjs --list            (print the available MIDI output ports)
//
// --cycles: where the piece ends (the yaml's total_cycles). --from: start at this cycle (e.g. a section start).
// --port: substring of the output port name (default "IAC"). --watch: re-evaluate the file every time it is
// saved and carry on from the current position with the new version. Ctrl+C stops and silences every channel.

import { readFileSync, watch } from 'node:fs';
import { basename, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { evalStrudel } from './eval-strudel.mjs';
import { buildTracks, bpmFromCps } from './midi-map.mjs';

const { Output } = createRequire(import.meta.url)('@julusian/midi');

function parseArgs(argv) {
  const a = { file: undefined, cycles: undefined, from: 0, port: 'IAC', names: [], bendRange: 2, velRange: 40, noBend: [], watch: false, list: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--cycles') a.cycles = Number(argv[++i]);
    else if (argv[i] === '--from') a.from = Number(argv[++i]);
    else if (argv[i] === '--port') a.port = argv[++i];
    else if (argv[i] === '--names') a.names = argv[++i].split(',');
    else if (argv[i] === '--bend-range') a.bendRange = Number(argv[++i]);
    else if (argv[i] === '--vel-range') a.velRange = Number(argv[++i]);
    else if (argv[i] === '--no-bend') a.noBend = argv[++i].split(',');
    else if (argv[i] === '--watch') a.watch = true;
    else if (argv[i] === '--list') a.list = true;
    else if (!a.file) a.file = argv[i];
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
const out = new Output();
const ports = Array.from({ length: out.getPortCount() }, (_, i) => out.getPortName(i));

if (args.list) {
  console.log(ports.length ? ports.join('\n') : '(no MIDI outputs — enable the IAC Driver in Audio MIDI Setup)');
  process.exit(0);
}
if (!args.file || !args.cycles) {
  console.error('usage: node tools/sounds/midi-live.mjs <file.strudel> --cycles N [--from C] [--port IAC] [--names a,b,c] [--bend-range 2] [--vel-range 40] [--no-bend a,b] [--watch]');
  process.exit(2);
}
const portIndex = ports.findIndex((p) => p.toLowerCase().includes(args.port.toLowerCase()));
if (portIndex < 0) {
  console.error(`no MIDI output matching "${args.port}". Available: ${ports.join(', ') || 'none'} (enable the IAC Driver in Audio MIDI Setup)`);
  process.exit(1);
}
out.openPort(portIndex);

const allOff = () => {
  for (let ch = 0; ch < 16; ch++) out.sendMessage([0xb0 | ch, 123, 0]); // All Notes Off
};

// Evaluates the file into a time-sorted list of MIDI messages, in cycles.
async function load() {
  const { pattern, cps, core } = await evalStrudel(readFileSync(args.file, 'utf8'));
  const haps = pattern.queryArc(0, args.cycles).filter((h) => h.hasOnset());
  const { tracks, audioOnly, warnings } = buildTracks(haps, { noteToMidi: core.noteToMidi, bendRange: args.bendRange, velRange: args.velRange, noBend: args.noBend, names: args.names });
  const msgs = [];
  for (const t of tracks) {
    for (const n of t.notes) {
      msgs.push({ at: n.begin, end: n.end, order: 1, bytes: [0x90 | t.channel, n.pitch, n.velocity] });
      msgs.push({ at: n.end, order: 0, bytes: [0x80 | t.channel, n.pitch, 64] });
    }
  }
  msgs.sort((a, b) => a.at - b.at || a.order - b.order);
  return { cps, tracks, audioOnly, warnings, msgs };
}

// Sends every track's tuning bend, then the notes already sounding at `cycle` (a drone that began earlier
// must still be heard when starting mid-piece), and returns the index of the first message still to come.
function startAt(piece, cycle) {
  allOff();
  for (const t of piece.tracks) {
    const bend = t.bend ?? 8192;
    out.sendMessage([0xe0 | t.channel, bend & 0x7f, bend >> 7]);
  }
  let i = 0;
  while (i < piece.msgs.length && piece.msgs[i].at < cycle) {
    const m = piece.msgs[i];
    if (m.order === 1 && m.end > cycle) out.sendMessage(m.bytes);
    i++;
  }
  return i;
}

const describe = (piece) => {
  console.error(`${args.file} -> "${ports[portIndex]}" at ${bpmFromCps(piece.cps)} BPM (set Ableton to this tempo)`);
  for (const t of piece.tracks) console.error(`  MIDI channel ${t.channel + 1}: ${t.name} (${t.notes.length} notes)`);
  for (const a of piece.audioOnly) console.error(`  not sent (no notes): ${a.layer} — use its stem instead`);
  for (const w of piece.warnings) console.error(`WARNING: ${w}`);
};

let piece;
try {
  piece = await load();
} catch (err) {
  console.error(`ERROR evaluating ${args.file}: ${err.message}`);
  process.exit(1);
}
describe(piece);

let t0 = performance.now() - (args.from / piece.cps) * 1000; // wall-clock time of cycle 0
const nowCycle = () => ((performance.now() - t0) / 1000) * piece.cps;
let next = startAt(piece, args.from);
let lastShown = -1;

const timer = setInterval(() => {
  const c = nowCycle();
  while (next < piece.msgs.length && piece.msgs[next].at <= c) out.sendMessage(piece.msgs[next++].bytes);
  const whole = Math.floor(c);
  if (whole !== lastShown) {
    lastShown = whole;
    const s = Math.floor(c / piece.cps);
    process.stderr.write(`\r  cycle ${whole}/${args.cycles}  (${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')})   `);
  }
  if (c >= args.cycles) stop(0); // the synths' own release rings out after All Notes Off
}, 2);

function stop(code) {
  clearInterval(timer);
  allOff();
  out.closePort();
  process.stderr.write('\n');
  process.exit(code);
}
process.on('SIGINT', () => stop(0));

if (args.watch) {
  let pending;
  // Watch the folder, not the file: editors that save by replacing the file (write a temp file, rename it
  // over the original) leave a file watcher attached to the old, deleted copy.
  watch(dirname(args.file), (_, name) => {
    if (name !== basename(args.file)) return;
    clearTimeout(pending); // editors often fire several events per save
    pending = setTimeout(async () => {
      try {
        const c = nowCycle();
        const fresh = await load();
        t0 = performance.now() - (c / fresh.cps) * 1000; // keep the position in cycles even if the tempo changed
        piece = fresh;
        next = startAt(piece, c);
        process.stderr.write(`\n  reloaded at cycle ${c.toFixed(1)}\n`);
      } catch (err) {
        process.stderr.write(`\n  ERROR in the edit, still playing the previous version: ${err.message}\n`);
      }
    }, 150);
  });
}
