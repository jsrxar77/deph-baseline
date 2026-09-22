#!/usr/bin/env node
// Headless Strudel inspector: evaluates a .strudel file in Node (no browser, no audio)
// and prints the events it would play, as text.
//
// Usage (run from the project root): node tools/sounds/inspect.mjs <file.strudel> [--summary] [--roll]
//                                     [--all] [--cycles N] [--from N] [--res N] [--json]
// (`npm run inspect -- <file.strudel> ...` also works, but only if you're already cd'd into
// tools/sounds/, with the file path relative to there — npm's --prefix flag changes the working
// directory, so it can't be used to run this from the project root.)
//   (no mode)  event list, 4 cycles      --summary  musical summary, 8 cycles
//   --roll     text piano roll, 2 cycles, --res steps per cycle (default 16)
//   --all      list + summary + roll     --cycles/--from override the window of every mode

import { readFileSync } from 'node:fs';
import { evalStrudel } from './eval-strudel.mjs';
import { toEvents, summarize, formatSummary, renderRoll } from './analyze.mjs';

function parseArgs(argv) {
  const args = { file: undefined, cycles: undefined, from: 0, res: 16, json: false, modes: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--cycles') args.cycles = Number(argv[++i]);
    else if (a === '--from') args.from = Number(argv[++i]);
    else if (a === '--res') args.res = Number(argv[++i]);
    else if (a === '--json') args.json = true;
    else if (a === '--summary') args.modes.add('summary');
    else if (a === '--roll') args.modes.add('roll');
    else if (a === '--list') args.modes.add('list');
    else if (a === '--all') ['list', 'summary', 'roll'].forEach((m) => args.modes.add(m));
    else if (!args.file) args.file = a;
  }
  if (!args.modes.size) args.modes.add('list');
  return args;
}

const fmt = (n) => Number(n.valueOf()).toFixed(3).replace(/\.?0+$/, '') || '0';

function describe(hap) {
  const { layer, ...rest } = typeof hap.value === 'object' ? hap.value : { value: hap.value };
  const body = Object.entries(rest).map(([k, v]) => `${k}=${typeof v === 'number' ? +v.toFixed(3) : v}`).join(' ');
  return { layer, body };
}

const DEFAULT_CYCLES = { list: 4, summary: 8, roll: 2 };

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    console.error('usage: node tools/sounds/inspect.mjs <file.strudel> [--summary] [--roll] [--all] [--cycles N] [--from N] [--res N] [--json]');
    process.exit(2);
  }
  let code;
  try {
    code = readFileSync(args.file, 'utf8');
  } catch (err) {
    console.error(err.code === 'ENOENT' ? `file not found: ${args.file}` : `ERROR reading ${args.file}: ${err.message}`);
    process.exit(2);
  }

  let result;
  try {
    result = await evalStrudel(code);
  } catch (err) {
    console.error(`ERROR evaluating ${args.file}: ${err.message}`);
    process.exit(1);
  }

  const { pattern, cps, layers, core } = result;
  const cyclesFor = (mode) => args.cycles ?? DEFAULT_CYCLES[mode];
  const widest = Math.max(...[...args.modes].map(cyclesFor));
  const haps = pattern.queryArc(args.from, args.from + widest).filter((h) => h.hasOnset());
  haps.sort((a, b) => a.whole.begin.valueOf() - b.whole.begin.valueOf());
  const events = toEvents(haps, { noteToMidi: core.noteToMidi, freqToMidi: core.freqToMidi });
  const inWindow = (list, get, n) => list.filter((x) => get(x) >= args.from && get(x) < args.from + n);

  const json = {};
  const text = [];
  if (args.modes.has('list')) {
    const n = cyclesFor('list');
    const shown = inWindow(haps, (h) => h.whole.begin.valueOf(), n);
    json.events = inWindow(events, (e) => e.begin, n).map((e) => ({ begin: e.begin, end: e.end, layer: e.layer, value: e.raw }));
    text.push(formatList(args, cps, layers, shown, n));
  }
  if (args.modes.has('summary')) {
    const n = cyclesFor('summary');
    const summary = summarize(inWindow(events, (e) => e.begin, n), { from: args.from, cycles: n, cps, layers });
    json.summary = summary;
    text.push(formatSummary(summary));
  }
  if (args.modes.has('roll')) {
    const n = cyclesFor('roll');
    const roll = renderRoll(inWindow(events, (e) => e.begin, n), { from: args.from, cycles: n, res: args.res, layers });
    json.roll = roll; // ASCII grid; kept as a string since JSON has no more useful shape for it
    text.push(roll);
  }

  if (args.json) {
    // A single mode prints its payload directly; several modes print an object keyed by mode.
    const keys = Object.keys(json);
    console.log(JSON.stringify(keys.length === 1 && keys[0] === 'events' ? json.events : json, null, 2));
    return;
  }
  console.log(text.join('\n\n'));
}

function formatList(args, cps, layers, haps, cycles) {
  const to = args.from + cycles;
  const out = [];
  out.push(`file: ${args.file} | cps: ${cps} (${+(cps * 60).toFixed(2)} cpm) | layers: ${layers.join(', ') || '(single pattern)'}`);
  out.push(`cycles ${args.from}..${to} | ${haps.length} events\n`);
  for (let c = args.from; c < to; c++) {
    const inCycle = haps.filter((h) => Math.floor(h.whole.begin.valueOf()) === c);
    out.push(`cycle ${c} (${inCycle.length} events)`);
    for (const h of inCycle) {
      const { layer, body } = describe(h);
      const pos = h.whole.begin.valueOf() - c;
      const dur = h.whole.end.valueOf() - h.whole.begin.valueOf();
      out.push(`  ${fmt(pos).padStart(6)} +${fmt(dur).padEnd(6)} ${layer ? `[${layer}] `.padEnd(5) : ''}${body}`);
    }
  }
  return out.join('\n');
}

main();
