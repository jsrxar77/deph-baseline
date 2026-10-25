#!/usr/bin/env node
// deph studio: ONE generic local dev server for every piece, in the spirit of `remotion studio` /
// `hyperframes preview` — run it once, it finds every composition under media/*/sounds/*.strudel
// itself, you pick one from a sidebar (no typing a path), and it live-reloads when you edit the file.
// The input is always a .strudel file; nothing is generated or baked ahead of time.
//
// Draws one lane per voice over a time axis (same headless evaluation path as inspect.mjs — no
// audio, no browser, just event data) and embeds the real Strudel browser engine (@strudel/web, from
// a CDN, pinned to the version installed in this folder's package.json) so pressing play / clicking
// the timeline actually plays the piece from that point. That's a second, independent instance of the
// same engine — not a remote control for the VS Code extension; there is no API bridge between a web
// page and that extension, so this page plays the audio itself instead. Seeking re-evaluates the code
// with `all((x) => x.early(cycles))` appended, the same trick documented for manual use elsewhere.
//
// Usage: node deph-studio [--port 5678]   (a launcher at the project root; or node tools/sounds/deph-studio.mjs)
import http from 'node:http';
import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { evalStrudel } from './eval-strudel.mjs';
import { toEvents } from './analyze.mjs';
import { load as loadYaml } from 'js-yaml';

const STRUDEL_WEB_VERSION = '1.3.0'; // matches @strudel/webaudio in package.json
const ROOT = process.cwd(); // run from the project root, like every other tool in tools/sounds

function parseArgs(argv) {
  const args = { port: 5678 };
  for (let i = 0; i < argv.length; i++) if (argv[i] === '--port') args.port = Number(argv[++i]);
  return args;
}

// ---- discovery: every media/<name>/sounds/*.strudel, excluding sounds/backup/ -------------------------------------
function discover() {
  const out = [];
  let dirs = [];
  try { dirs = readdirSync(`${ROOT}/media`, { withFileTypes: true }).filter((d) => d.isDirectory()); } catch { return out; }
  for (const d of dirs) {
    const soundsDir = `${ROOT}/media/${d.name}/sounds`;
    if (!existsSync(soundsDir)) continue;
    let files = [];
    try { files = readdirSync(soundsDir, { withFileTypes: true }); } catch { continue; }
    // The composition's own yaml is the real source of truth for duration (`total_cycles`) — but only for the
    // one file it actually names (`domains.sound.file`); a variant like gnosis-live.strudel has its own, different
    // duration and must fall back to its own comment guess instead of inheriting the canonical file's length.
    let yamlCycles = null, canonicalFile = null;
    try {
      const doc = loadYaml(readFileSync(`${ROOT}/media/${d.name}/${d.name}.yaml`, 'utf8'));
      if (typeof doc?.total_cycles === 'number') yamlCycles = doc.total_cycles;
      if (typeof doc?.domains?.sound?.file === 'string') canonicalFile = `media/${d.name}/${doc.domains.sound.file}`;
    } catch { /* no yaml, or no total_cycles field — fall back to the per-file guess below */ }
    for (const f of files) {
      if (f.isDirectory() || !f.name.endsWith('.strudel')) continue;
      const rel = `media/${d.name}/sounds/${f.name}`;
      let cycles = rel === canonicalFile ? yamlCycles : null;
      if (cycles == null) {
        try {
          const head = readFileSync(`${ROOT}/${rel}`, 'utf8').slice(0, 4000);
          const m = head.match(/(\d+)\s*cycles\s*=\s*\d+:\d\d\s*exact/i) || head.match(/(\d+)\s*cycles/i);
          if (m) cycles = Number(m[1]);
        } catch { /* leave cycles null; the page asks for it */ }
      }
      out.push({ path: rel, label: `${d.name} / ${f.name}`, cycles });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

// Some pieces use a `.late(rand.segment(N)...)`-style humanize (The Field, Musica Universalis) that's genuinely
// expensive to query over a full piece in Strudel — 20s+ for a 12-minute piece, confirmed by profiling. Caching
// the computed result per (file, cycles, names, bin, mtime) means that cost is only ever paid once per edit, not
// on every reload/switch — the actual fix for "se queda colgado" when flipping between pieces repeatedly.
const dataCache = new Map();
async function computeData(file, cycles, namesParam, bin) {
  const mtime = statSync(`${ROOT}/${file}`).mtimeMs;
  const cacheKey = `${file}|${cycles}|${namesParam.join(',')}|${bin}|${mtime}`;
  if (dataCache.has(cacheKey)) return dataCache.get(cacheKey);
  const code = readFileSync(`${ROOT}/${file}`, 'utf8');
  const { pattern, cps, layers, core } = await evalStrudel(code);
  const haps = pattern.queryArc(0, cycles).filter((h) => h.hasOnset());
  const events = toEvents(haps, { noteToMidi: core.noteToMidi, freqToMidi: core.freqToMidi });

  const layerList = layers.length ? layers : ['main'];
  const names = namesParam.length === layerList.length ? namesParam : layerList;
  const totalSec = cycles / cps;
  const binSec = bin;
  const nBins = Math.max(1, Math.ceil(totalSec / binSec));
  const grid = layerList.map(() => new Array(nBins).fill(0));

  for (const e of events) {
    const li = layerList.indexOf(e.layer);
    if (li === -1) continue;
    const g = typeof e.raw.gain === 'number' ? e.raw.gain : 1;
    const beginSec = e.begin / cps, endSec = Math.max(e.end / cps, beginSec + binSec * 0.5);
    const b0 = Math.max(0, Math.floor(beginSec / binSec));
    const b1 = Math.min(nBins - 1, Math.floor((endSec - 1e-6) / binSec));
    for (let b = b0; b <= b1; b++) grid[li][b] = Math.max(grid[li][b], g);
  }
  const peaks = grid.map((row) => Math.max(...row, 1e-6));
  const norm = grid.map((row, i) => row.map((v) => v / peaks[i]));
  const result = { names, grid: norm, totalSec, binSec, cps, source: code, mtime };
  dataCache.set(cacheKey, result);
  return result;
}

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>deph studio</title>
<style>
  :root { --bg:#050508; --panel:#0b0e14; --row:#121829; --accent:#38bdf8; --accent2:#1fa396; --live:#cb3860; --text:#e6edf3; --muted:#6b7488; }
  * { box-sizing: border-box; }
  html, body { margin:0; height:100%; background:var(--bg); color:var(--text); font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; }
  #app { display:flex; height:100%; }
  #sidebar { width: 260px; flex: 0 0 260px; background:var(--panel); border-right:1px solid #1b2230; overflow-y:auto; padding: 0 0 10px; }
  #brand { display:flex; align-items:center; gap:10px; padding: 16px 14px 14px; border-bottom: 1px solid #1b2230;
    background: linear-gradient(135deg, var(--panel), #0d1222 60%, #140c20); }
  #brand img { width: 34px; height: 34px; border-radius: 50%; border: 1px solid #232b3d; box-shadow: 0 0 12px rgba(56,189,248,0.25); }
  #brand .name { font-size: 14px; font-weight: 700; letter-spacing: 0.02em; color: var(--text); }
  #brand .tag { font-size: 10px; color: var(--muted); margin-top: 1px; }
  #sidebar h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); padding: 6px 14px; margin: 10px 0 0; }
  .piece { padding: 8px 14px; font-size: 13px; color: var(--text); cursor: pointer; border-left: 2px solid transparent; }
  .piece:hover { background: var(--row); }
  .piece.active { background: var(--row); border-left-color: var(--accent); color: var(--accent); }
  #main { flex: 1; overflow-y: auto; padding: 14px 20px 24px; }
  h1 { font-size: 15px; font-weight: 600; margin: 0 0 2px; color: var(--text); }
  .sub { font-size: 12px; color: var(--muted); }
  .row { display:flex; gap:8px; align-items:center; margin: 10px 0; flex-wrap: wrap; }
  input { background:var(--row); color:var(--text); border:1px solid #232b3d; border-radius:6px; padding:6px 10px; font-size:13px; font-family: ui-monospace, Menlo, monospace; width: 100px; }
  input[name=names] { flex: 1 1 260px; width: auto; }
  button { background:var(--row); color:var(--text); border:1px solid #232b3d; border-radius:6px; padding:6px 14px; font-size:13px; cursor:pointer; }
  button:hover { border-color: var(--accent); }
  button:disabled { opacity: 0.4; cursor: default; }
  #time { font-family: ui-monospace, Menlo, monospace; font-size: 13px; color: var(--accent); min-width: 108px; }
  #status { font-size: 11px; color: var(--muted); white-space: pre-wrap; margin-top: 6px; }
  #status.live { color: var(--live); }
  #track { position:relative; background:var(--row); border:1px solid #1b2230; border-radius:8px; padding: 10px 0; user-select:none; cursor:pointer; margin-top: 10px; display:none; }
  .lane { position:relative; height: 26px; display:flex; align-items:center; }
  .lane-label { position:absolute; left:8px; font-size:11px; color:var(--muted); z-index:2; pointer-events:none; white-space:nowrap; text-shadow: 0 0 4px var(--bg), 0 0 4px var(--bg); }
  .lane-label.active { color: var(--text); font-weight:600; }
  .bars { position:absolute; left:140px; right:12px; top:4px; bottom:4px; display:flex; }
  .bar { flex: 1 0 auto; margin: 0 0.5px; border-radius: 1px; background: var(--accent2); align-self: stretch; }
  #axis { position:relative; margin: 2px 12px 0 140px; height: 16px; font-size: 10px; color: var(--muted); font-family: ui-monospace, Menlo, monospace; }
  #axis span { position:absolute; transform: translateX(-50%); }
  #playhead { position:absolute; top:0; bottom:0; width:1px; background: var(--accent); left:140px; pointer-events:none; box-shadow: 0 0 6px var(--accent); }
  #reloadBadge { display:none; font-size: 11px; color: var(--live); margin-left: 8px; }
</style></head>
<body>
<div id="app">
  <div id="sidebar">
    <div id="brand"><img src="/avatar.jpg" alt="deph" /><div><div class="name">deph studio</div><div class="tag">deep phase</div></div></div>
    <h2>compositions</h2><div id="list"></div>
  </div>
  <div id="main">
    <h1 id="title">deph studio</h1>
    <div class="sub" id="subtitle">pick a piece on the left</div>
    <div class="row" id="params" style="display:none">
      <label>cycles <input name="cycles" /></label>
      <label>bin s <input name="bin" value="1" /></label>
      <input name="names" placeholder="lane names (optional, a,b,c)" />
      <button id="apply">apply</button>
    </div>
    <div class="row">
      <button id="play" disabled>pick a piece</button>
      <div id="time">0:00 / 0:00</div>
      <span id="reloadBadge">reloaded ●</span>
    </div>
    <div id="track"><div id="playhead"></div><div id="lanes"></div></div>
    <div id="axis"></div>
    <div id="status"></div>
  </div>
</div>
<script type="module">
const listEl = document.getElementById('list');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');
const paramsEl = document.getElementById('params');
const paramsForm = { cycles: document.querySelector('input[name=cycles]'), bin: document.querySelector('input[name=bin]'), names: document.querySelector('input[name=names]') };
const lanesEl = document.getElementById('lanes');
const trackEl = document.getElementById('track');
const playheadEl = document.getElementById('playhead');
const timeEl = document.getElementById('time');
const playBtn = document.getElementById('play');
const statusEl = document.getElementById('status');
const axisEl = document.getElementById('axis');
const reloadBadge = document.getElementById('reloadBadge');

function fmt(s) { s = Math.max(0, s); const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return m + ':' + String(sec).padStart(2, '0'); }

let PIECES = [], current = null, DATA = null, seekSec = 0, playing = false, repl = null, raf = null, watchTimer = null;

async function loadPieces() {
  PIECES = await (await fetch('/api/pieces')).json();
  listEl.innerHTML = '';
  for (const p of PIECES) {
    const el = document.createElement('div');
    el.className = 'piece'; el.textContent = p.label.replace(/\\.strudel$/, '');
    el.addEventListener('click', () => selectPiece(p));
    listEl.appendChild(el);
  }
}

function markActive(path) {
  [...listEl.children].forEach((el, i) => el.classList.toggle('active', PIECES[i].path === path));
}

async function selectPiece(p) {
  current = p;
  markActive(p.path);
  titleEl.textContent = p.label;
  paramsEl.style.display = 'flex';
  paramsForm.cycles.value = p.cycles || '';
  if (!p.cycles) { subtitleEl.textContent = "couldn't guess the cycle count — type it and press apply"; return; }
  await load();
}

async function load() {
  if (watchTimer) clearInterval(watchTimer);
  if (!current || !paramsForm.cycles.value) return;
  const forPath = current.path; // snapshot: if the user picks a different piece before this fetch
                                 // resolves, the stale response below must not overwrite the new one.
  stopPlayback();
  playBtn.disabled = true; playBtn.textContent = 'loading…';
  const q = { file: forPath, cycles: paramsForm.cycles.value, names: paramsForm.names.value, bin: paramsForm.bin.value || '1' };
  // Some pieces (anything using a per-note random humanize) take 10-25s to evaluate the first time — say so,
  // with a running clock, so a slow first load doesn't read as a hang. Cached on the server after that.
  const startedAt = Date.now();
  const tick = () => { if (current && current.path === forPath) statusEl.textContent = 'reading ' + forPath + '… (' + Math.round((Date.now() - startedAt) / 1000) + 's — first load of a complex piece can take up to ~25s; faster after)'; };
  tick();
  const statusTimer = setInterval(tick, 1000);
  let result;
  try {
    const res = await fetch('/api/data?' + new URLSearchParams(q));
    if (!res.ok) throw new Error(await res.text());
    result = await res.json();
  } catch (err) {
    clearInterval(statusTimer);
    if (current && current.path === forPath) { statusEl.textContent = 'could not load: ' + err.message; statusEl.classList.add('live'); }
    return;
  }
  clearInterval(statusTimer);
  if (!current || current.path !== forPath) return; // superseded by a newer selection while this was in flight
  DATA = result;
  statusEl.textContent = ''; statusEl.classList.remove('live');
  subtitleEl.textContent = fmt(DATA.totalSec) + ' total · ' + DATA.names.length + ' voices';
  drawLanes();
  seekSec = 0; placePlayhead(0);
  playBtn.disabled = false; playBtn.textContent = '\\u25B6 play from here';
  watchTimer = setInterval(checkReload, 1000);
}

function drawLanes() {
  lanesEl.replaceChildren();
  DATA.names.forEach((name, i) => {
    const lane = document.createElement('div'); lane.className = 'lane';
    const label = document.createElement('div'); label.className = 'lane-label'; label.textContent = name; label.dataset.i = i;
    const bars = document.createElement('div'); bars.className = 'bars';
    DATA.grid[i].forEach((v) => {
      const bar = document.createElement('div'); bar.className = 'bar';
      bar.style.opacity = Math.max(0.03, v).toFixed(3);
      bars.appendChild(bar);
    });
    lane.appendChild(bars); lane.appendChild(label); lanesEl.appendChild(lane);
  });
  trackEl.style.height = (DATA.names.length * 26 + 20) + 'px';
  trackEl.style.display = 'block';
  axisEl.replaceChildren();
  const nTicks = Math.min(12, Math.ceil(DATA.totalSec / 30));
  for (let k = 0; k <= nTicks; k++) {
    const tt = (DATA.totalSec * k) / nTicks;
    const span = document.createElement('span');
    span.style.left = (tt / DATA.totalSec * 100) + '%';
    span.textContent = fmt(tt);
    axisEl.appendChild(span);
  }
}

async function checkReload() {
  if (!current) return;
  const watchedPath = current.path; // snapshot: don't act on this tick's result if the piece changed meanwhile
  try {
    const res = await fetch('/api/mtime?' + new URLSearchParams({ file: watchedPath }));
    const { mtime } = await res.json();
    if (!current || current.path !== watchedPath) return;
    if (DATA && mtime !== DATA.mtime) {
      const wasPlaying = playing, at = seekSec + (playing && repl ? repl.scheduler.now() / DATA.cps : 0);
      await load();
      if (current.path !== watchedPath) return; // the user switched pieces during the reload itself
      reloadBadge.style.display = 'inline';
      setTimeout(() => (reloadBadge.style.display = 'none'), 2000);
      if (wasPlaying && repl) playFrom(at);
    }
  } catch { /* server hiccup, try again next tick */ }
}

document.getElementById('apply').addEventListener('click', load);

async function loadReplOnce() {
  if (repl) return repl;
  statusEl.textContent = 'loading Strudel audio engine…';
  const mod = await import('https://cdn.jsdelivr.net/npm/@strudel/web@${STRUDEL_WEB_VERSION}/dist/index.mjs');
  repl = await mod.initStrudel();
  statusEl.textContent = '';
  return repl;
}
function placePlayhead(sec) {
  const pct = DATA.totalSec ? sec / DATA.totalSec : 0;
  playheadEl.style.left = 'calc(140px + ' + pct + ' * (100% - 152px))';
  timeEl.textContent = fmt(sec) + ' / ' + fmt(DATA.totalSec);
  const bin = Math.min(DATA.grid[0] ? DATA.grid[0].length - 1 : 0, Math.floor(sec / DATA.binSec));
  document.querySelectorAll('.lane-label').forEach((el) => {
    const v = DATA.grid[el.dataset.i][bin] || 0;
    el.classList.toggle('active', v > 0.12);
  });
}
function frame() {
  if (!playing || !repl) return;
  const sec = Math.min(DATA.totalSec, seekSec + repl.scheduler.now() / DATA.cps);
  placePlayhead(sec);
  if (sec >= DATA.totalSec) { stopPlayback(); return; }
  raf = requestAnimationFrame(frame);
}
function playFrom(sec) {
  seekSec = Math.max(0, Math.min(DATA.totalSec, sec));
  const cycles = seekSec * DATA.cps;
  const code = cycles > 0 ? DATA.source + '\\nall((x) => x.early(' + cycles + '))' : DATA.source;
  repl.evaluate(code, true);
  playing = true;
  playBtn.textContent = '\\u23F8 stop';
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);
}
function stopPlayback() {
  playing = false;
  if (playBtn) playBtn.textContent = '\\u25B6 play from here';
  if (repl) repl.stop();
  if (raf) cancelAnimationFrame(raf);
}
function scrubTo(clientX) {
  const rect = trackEl.getBoundingClientRect();
  const left = 140, right = rect.width - 12;
  const pct = Math.min(1, Math.max(0, (clientX - rect.left - left) / (right - left)));
  const sec = pct * DATA.totalSec;
  if (playing) playFrom(sec); else { seekSec = sec; placePlayhead(sec); }
}
let dragging = false;
trackEl.addEventListener('mousedown', (e) => { dragging = true; scrubTo(e.clientX); });
window.addEventListener('mousemove', (e) => { if (dragging) scrubTo(e.clientX); });
window.addEventListener('mouseup', () => { dragging = false; });
playBtn.addEventListener('click', async () => {
  if (!DATA) return;
  if (playing) { stopPlayback(); return; }
  try { await loadReplOnce(); } catch (err) {
    statusEl.textContent = 'audio engine failed to load (' + err.message + ') — click/drag the track to find a ' +
      'time, then paste this at the end of the .strudel file and press Cmd+Enter in VS Code: all((x) => x.early(N))';
    statusEl.classList.add('live');
    return;
  }
  playFrom(seekSec);
});

loadPieces();
</script>
</body></html>`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/avatar.jpg') {
      try {
        res.writeHead(200, { 'content-type': 'image/jpeg' });
        res.end(readFileSync(`${ROOT}/docs/youtube-channel/avatar.jpg`));
      } catch {
        res.writeHead(404);
        res.end();
      }
      return;
    }
    if (url.pathname === '/api/pieces') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(discover()));
      return;
    }
    if (url.pathname === '/api/mtime') {
      try {
        const file = url.searchParams.get('file');
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ mtime: statSync(`${ROOT}/${file}`).mtimeMs }));
      } catch (err) {
        res.writeHead(500, { 'content-type': 'text/plain' });
        res.end('ERROR: ' + err.message);
      }
      return;
    }
    if (url.pathname === '/api/data') {
      try {
        const file = url.searchParams.get('file');
        const cycles = Number(url.searchParams.get('cycles'));
        const names = (url.searchParams.get('names') || '').split(',').map((s) => s.trim()).filter(Boolean);
        const bin = Number(url.searchParams.get('bin') || '1');
        if (!file || !cycles) { res.writeHead(400, { 'content-type': 'text/plain' }); res.end('file and cycles are required'); return; }
        const data = await computeData(file, cycles, names, bin);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(500, { 'content-type': 'text/plain' });
        res.end('ERROR: ' + err.message);
      }
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(PAGE);
  });
  server.listen(args.port, () => console.log(`deph studio running at http://localhost:${args.port}/`));
}

main();
