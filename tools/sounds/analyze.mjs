// Musical analysis of the events produced by inspect.mjs. Pure functions: no Strudel imports.
// Events come from `toEvents`; `summarize`/`formatSummary` and `renderRoll` work on them.

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
// Krumhansl-Schmuckler key profiles.
const PROFILE_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const PROFILE_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const GRIDS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32];
const NOT_PARAMS = new Set(['s', 'note', 'n', 'freq', 'bank', 'layer', 'value']);

export const midiName = (m) => `${NOTE_NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
const r3 = (n) => +Number(n).toFixed(3);
const stable = (v) => JSON.stringify(v, (_, x) => (typeof x === 'number' ? +x.toFixed(4) : x));

/** Normalizes haps into flat events: { begin, end, cycle, pos, dur, layer, sound, midi, row, params, raw }. */
export function toEvents(haps, { noteToMidi, freqToMidi }) {
  const toMidi = (note) => {
    if (typeof note === 'number') return Math.round(note);
    try {
      return noteToMidi(String(note));
    } catch {
      return null;
    }
  };
  return haps.map((h) => {
    const value = h.value !== null && typeof h.value === 'object' ? h.value : { value: h.value };
    const { layer = 'main', ...v } = value;
    let midi = null;
    if (v.note !== undefined) midi = toMidi(v.note);
    else if (typeof v.freq === 'number') midi = Math.round(freqToMidi(v.freq));
    const sound = v.s !== undefined ? String(v.s) : v.value !== undefined ? String(v.value) : '?';
    const begin = h.whole.begin.valueOf();
    const end = h.whole.end.valueOf();
    const cycle = Math.floor(begin + 1e-9);
    const params = {};
    for (const [k, x] of Object.entries(v)) if (!NOT_PARAMS.has(k) && x !== undefined) params[k] = x;
    return {
      begin, end, cycle, pos: begin - cycle, dur: end - begin, layer, sound, midi,
      bank: v.bank, params,
      row: midi !== null ? midiName(midi) : sound + (v.n !== undefined ? `:${v.n}` : ''),
      raw: v,
    };
  });
}

function correlation(a, b) {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

/** Probable key from pitched events (duration-weighted pitch classes). Null when there is too little to go on. */
export function estimateKey(pitched) {
  const hist = new Array(12).fill(0);
  for (const e of pitched) hist[((e.midi % 12) + 12) % 12] += Math.min(e.dur, 2);
  if (hist.filter((w) => w > 0).length < 3) return null;
  const total = hist.reduce((s, x) => s + x, 0);
  const candidates = [];
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const [mode, profile, scale] of [['major', PROFILE_MAJOR, MAJOR], ['minor', PROFILE_MINOR, MINOR]]) {
      const rotated = profile.map((_, i) => profile[(i - tonic + 12) % 12]);
      const inScale = scale.reduce((s, off) => s + hist[(tonic + off) % 12], 0) / total;
      candidates.push({ key: `${NOTE_NAMES[tonic]} ${mode}`, r: r3(correlation(hist, rotated)), inScale: r3(inScale) });
    }
  }
  candidates.sort((a, b) => b.r - a.r);
  return { best: candidates[0], alternative: candidates[1] };
}

const cycleSignature = (evs, c) =>
  evs
    .filter((e) => e.cycle === c)
    .map((e) => `${r3(e.pos)}|${r3(e.dur)}|${stable(e.raw)}`)
    .sort()
    .join(';');

/** Smallest P (in cycles) such that the material repeats exactly, checked inside the window. */
function loopLength(evs, cycleList) {
  const sigs = cycleList.map((c) => cycleSignature(evs, c));
  for (let p = 1; p <= Math.floor(sigs.length / 2); p++) {
    if (sigs.every((s, i) => i + p >= sigs.length || s === sigs[i + p])) return p;
  }
  return null;
}

const smallestGrid = (positions) => GRIDS.find((d) => positions.every((p) => Math.abs(p * d - Math.round(p * d)) < 0.01)) ?? null;

function summarizeParams(evs) {
  const acc = {};
  for (const e of evs) {
    for (const [k, x] of Object.entries(e.params)) (acc[k] ??= new Set()).add(typeof x === 'number' ? r3(x) : String(x));
  }
  return Object.fromEntries(
    Object.entries(acc).map(([k, set]) => {
      const vals = [...set];
      const nums = vals.every((x) => typeof x === 'number');
      return [k, nums ? (vals.length === 1 ? `${vals[0]}` : `${Math.min(...vals)}-${Math.max(...vals)}`) : vals.join('/')];
    }),
  );
}

function countBy(list, fn) {
  const m = new Map();
  for (const x of list) m.set(fn(x), (m.get(fn(x)) ?? 0) + 1);
  return m;
}

function summarizeLayer(name, evs, cycleList) {
  const counts = cycleList.map((c) => evs.filter((e) => e.cycle === c).length);
  const pitched = evs.filter((e) => e.midi !== null);
  const midis = pitched.map((e) => e.midi);
  const banks = [...new Set(evs.map((e) => e.bank).filter(Boolean))];
  return {
    layer: name,
    events: evs.length,
    perCycle: counts.length ? { min: Math.min(...counts), max: Math.max(...counts) } : null,
    activeCycles: counts.filter((c) => c > 0).length,
    sounds: Object.fromEntries([...countBy(evs.filter((e) => e.midi === null || e.sound !== '?'), (e) => e.sound)].sort((a, b) => b[1] - a[1])),
    banks,
    pitch: pitched.length
      ? {
          range: [midiName(Math.min(...midis)), midiName(Math.max(...midis))],
          notes: Object.fromEntries([...countBy(pitched, (e) => e.midi)].sort((a, b) => b[0] - a[0]).map(([m, n]) => [midiName(m), n])),
        }
      : null,
    grid: evs.length ? smallestGrid(evs.map((e) => e.pos)) : null,
    loopCycles: evs.length ? loopLength(evs, cycleList) : null,
    params: summarizeParams(evs),
  };
}

export function summarize(events, { from, cycles, cps, layers }) {
  const cycleList = Array.from({ length: cycles }, (_, i) => from + i);
  const names = [...new Set([...(layers.length ? layers : []), ...events.map((e) => e.layer)])];
  const loop = events.length ? loopLength(events, cycleList) : null;
  const simultaneous = countBy(events, (e) => r3(e.begin));
  const [peakAt, peak] = [...simultaneous].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  const perCycle = cycleList.map((c) => events.filter((e) => e.cycle === c).length);
  return {
    window: { from, cycles },
    tempo: { cps, cpm: +(cps * 60).toFixed(2), secondsPerCycle: r3(1 / cps) },
    total: {
      layers: names.length,
      events: events.length,
      perCycle: { min: Math.min(...perCycle), max: Math.max(...perCycle) },
      loopCycles: loop,
      loopSeconds: loop ? r3(loop / cps) : null,
      peakSimultaneous: { count: peak, atCycle: peakAt === null ? null : Math.floor(peakAt), pos: peakAt === null ? null : r3(peakAt - Math.floor(peakAt)) },
    },
    key: estimateKey(events.filter((e) => e.midi !== null)),
    layers: names.map((n) => summarizeLayer(n, events.filter((e) => e.layer === n), cycleList)),
  };
}

export function formatSummary(s) {
  const out = [];
  const range = (r) => (r.min === r.max ? `${r.min}` : `${r.min}-${r.max}`);
  out.push(`SUMMARY | cycles ${s.window.from}..${s.window.from + s.window.cycles} | ${s.tempo.cpm} cpm (1 cycle = ${s.tempo.secondsPerCycle}s)`);
  const t = s.total;
  out.push(
    `  ${t.layers} layer(s), ${t.events} events, ${range(t.perCycle)} per cycle | ` +
      (t.loopCycles ? `repeats every ${t.loopCycles} cycle(s) = ${t.loopSeconds}s` : `no exact repeat within the window`),
  );
  if (t.peakSimultaneous.count > 1) {
    out.push(`  peak: ${t.peakSimultaneous.count} onsets at once (first at cycle ${t.peakSimultaneous.atCycle}, position ${t.peakSimultaneous.pos})`);
  }
  if (s.key) {
    const { best, alternative } = s.key;
    out.push(`  key (estimate): ${best.key} (r=${best.r}, ${Math.round(best.inScale * 100)}% of note weight in scale); next: ${alternative.key} (r=${alternative.r})`);
  } else {
    out.push('  key: not enough pitched material to estimate');
  }
  for (const l of s.layers) {
    out.push('', `[${l.layer}]`);
    if (!l.events) {
      out.push('  silent in this window');
      continue;
    }
    const sounds = Object.entries(l.sounds).map(([k, n]) => `${k} x${n}`).join(', ');
    out.push(`  sounds: ${sounds}${l.banks.length ? ` (bank ${l.banks.join('/')})` : ''}`);
    out.push(`  ${range(l.perCycle)} events/cycle | active in ${l.activeCycles}/${s.window.cycles} cycles | ${l.loopCycles ? `repeats every ${l.loopCycles} cycle(s)` : 'no exact repeat in window'} | onsets on a ${l.grid ? `1/${l.grid * 1} grid` : 'non-regular grid'}`.replace('1/1 grid', 'whole-cycle grid'));
    if (l.pitch) out.push(`  pitch: ${l.pitch.range[0]}-${l.pitch.range[1]} | ${Object.entries(l.pitch.notes).map(([k, n]) => `${k} x${n}`).join(' ')}`);
    const params = Object.entries(l.params).map(([k, v]) => `${k}=${v}`).join(' ');
    if (params) out.push(`  params: ${params}`);
  }
  return out.join('\n');
}

/**
 * Text piano roll. One row per pitch (pitched sounds) or per sound (drums/samples), grouped by layer.
 * `#` onset, `=` sustain (pitched only), `+` onset that is off the grid (drawn at the nearest step).
 */
export function renderRoll(events, { from, cycles, res, layers }) {
  const total = cycles * res;
  const inWindow = events.filter((e) => e.cycle >= from && e.cycle < from + cycles);
  const names = [...new Set([...(layers.length ? layers : []), ...inWindow.map((e) => e.layer)])];
  const groupSize = 4;
  const label = (i) => String(Math.floor(i / groupSize) + 1);

  // Build every row first so the label column can be sized to fit.
  const blocks = names.map((name) => {
    const rows = new Map();
    for (const e of inWindow.filter((x) => x.layer === name)) {
      if (!rows.has(e.row)) rows.set(e.row, { label: e.row, midi: e.midi, cells: new Array(total).fill('.') });
      const row = rows.get(e.row);
      const exact = (e.cycle - from) * res + e.pos * res;
      const col = Math.round(exact);
      if (col >= total) continue;
      row.cells[col] = Math.abs(exact - col) > 0.02 ? '+' : '#';
      if (e.midi !== null) {
        const n = Math.max(1, Math.round(e.dur * res));
        for (let k = 1; k < n && col + k < total; k++) if (row.cells[col + k] === '.') row.cells[col + k] = '=';
      }
    }
    const sorted = [...rows.values()].sort((a, b) => (a.midi !== null && b.midi !== null ? b.midi - a.midi : a.midi !== null ? -1 : b.midi !== null ? 1 : a.label.localeCompare(b.label)));
    return { name, rows: sorted };
  });
  const width = Math.max(4, ...blocks.flatMap((b) => b.rows.map((r) => r.label.length)));

  const draw = (cells) => {
    const cyclesText = [];
    for (let c = 0; c < cycles; c++) {
      const groups = [];
      for (let i = 0; i < res; i += groupSize) groups.push(cells.slice(c * res + i, c * res + Math.min(i + groupSize, res)).join(''));
      cyclesText.push(groups.join(' '));
    }
    return cyclesText.join(' | ');
  };
  const ruler = () => {
    const cyclesText = [];
    for (let c = 0; c < cycles; c++) {
      const groups = [];
      for (let i = 0; i < res; i += groupSize) groups.push(label(i).padEnd(Math.min(groupSize, res - i)));
      cyclesText.push(groups.join(' '));
    }
    return cyclesText.join(' | ');
  };

  const out = [`ROLL | cycles ${from}..${from + cycles} | ${res} steps/cycle | # onset  = sustain  + off-grid onset`];
  const heads = [];
  for (let c = 0; c < cycles; c++) heads.push(`cycle ${from + c}`.padEnd(res + Math.ceil(res / groupSize) - 1));
  out.push(`${' '.repeat(width + 2)}${heads.join(' | ')}`);
  out.push(`${' '.repeat(width + 2)}${ruler()}`);
  for (const b of blocks) {
    out.push(`[${b.name}]`);
    if (!b.rows.length) out.push(`  ${'(silent)'}`);
    for (const r of b.rows) out.push(`  ${r.label.padEnd(width)} ${draw(r.cells)}`);
  }
  return out.join('\n');
}
