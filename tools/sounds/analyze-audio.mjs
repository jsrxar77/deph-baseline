#!/usr/bin/env node
// Audio-first analysis for compositions that have NO Strudel source (the music already exists as a recording).
// It is the counterpart of frames.mjs: where frames.mjs reads exact note events out of a pattern, this script
// *measures* what a finished recording does and writes it as data the video can read frame by frame.
//
// Usage (from the project root):
//   node tools/sounds/analyze-audio.mjs media/<name>/sync/audio.wav --out media/<name>/sync/analysis.json [--fps 30]
//
// Input: 16-bit PCM wav (convert an mp3 first: ffmpeg -i source.mp3 -ar 48000 -c:a pcm_s16le audio.wav).
// No dependencies (own FFT). Everything here is a measurement or a statistical estimate — key, tempo and
// section boundaries are guesses and are labelled as such in the output; the user's ear is the judge.
//
// Output (analysis.json):
//   meta      duration, sample rate, fps, frames, normalisation notes
//   frames    per video frame (index = frame number): pan{low,mid,high} (stereo position of each band group), rms, bands{sub,bass,lowMid,mid,highMid,air}, centroid,
//             flux, width (stereo side/mid), balance (-1 left .. 1 right); all normalised to 0..1
//   onsets    [{t, frame, strength, band, pan, freq}] spectral-flux peaks, band = low | mid | high (kick/bass, body,
//             hats/air); pan -1 (left) .. 1 (right) and freq (Hz, centre of that band's energy) locate the attack
//   sections  [{start, end, novelty}] candidate boundaries from a self-similarity novelty curve
//   chroma    per-second pitch-class energy (12 values per second)
//   key       chroma profile + Krumhansl-Schmuckler estimate (with the runner-up)
//   tempo     onset-autocorrelation candidates (a guess; ambient/rubato material has no real tempo)

import { readFileSync, writeFileSync } from 'node:fs';

// ---------- args ----------
const args = { file: undefined, out: undefined, fps: 30 };
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--out') args.out = process.argv[++i];
  else if (a === '--fps') args.fps = Number(process.argv[++i]);
  else if (!args.file) args.file = a;
}
if (!args.file || !args.out) {
  console.error('usage: node tools/sounds/analyze-audio.mjs <audio.wav> --out <analysis.json> [--fps 30]');
  process.exit(1);
}

// ---------- wav reader (16-bit PCM, any channel count) ----------
function readWav(path) {
  const buf = readFileSync(path);
  if (buf.toString('ascii', 0, 4) !== 'RIFF') throw new Error('not a RIFF/WAV file');
  let pos = 12, fmt = null, data = null;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === 'fmt ') fmt = { format: buf.readUInt16LE(pos + 8), channels: buf.readUInt16LE(pos + 10), rate: buf.readUInt32LE(pos + 12), bits: buf.readUInt16LE(pos + 22) };
    if (id === 'data') { data = buf.subarray(pos + 8, pos + 8 + size); break; }
    pos += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new Error('missing fmt/data chunk');
  if (fmt.format !== 1 || fmt.bits !== 16) throw new Error('only 16-bit PCM wav is supported (convert with ffmpeg)');
  const n = Math.floor(data.length / (2 * fmt.channels));
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    L[i] = data.readInt16LE(i * 2 * fmt.channels) / 32768;
    R[i] = fmt.channels > 1 ? data.readInt16LE(i * 2 * fmt.channels + 2) / 32768 : L[i];
  }
  return { rate: fmt.rate, L, R };
}

// ---------- FFT (iterative radix-2, in place) ----------
function makeFFT(N) {
  const cos = new Float32Array(N / 2), sin = new Float32Array(N / 2), rev = new Uint32Array(N);
  for (let i = 0; i < N / 2; i++) { cos[i] = Math.cos((2 * Math.PI * i) / N); sin[i] = -Math.sin((2 * Math.PI * i) / N); }
  const bits = Math.log2(N);
  for (let i = 0; i < N; i++) { let r = 0; for (let b = 0; b < bits; b++) if (i & (1 << b)) r |= 1 << (bits - 1 - b); rev[i] = r; }
  return (re, im) => {
    for (let i = 0; i < N; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= N; size <<= 1) {
      const half = size >> 1, step = N / size;
      for (let i = 0; i < N; i += size) {
        for (let j = 0, k = 0; j < half; j++, k += step) {
          const a = i + j, b = a + half;
          const tr = re[b] * cos[k] - im[b] * sin[k], ti = re[b] * sin[k] + im[b] * cos[k];
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        }
      }
    }
  };
}
const hann = (N) => Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));

// Magnitude spectrum of a mono window starting at `start` (zero-padded past the end).
function spectrum(x, start, N, win, fft, re, im) {
  for (let i = 0; i < N; i++) { const v = start + i < x.length && start + i >= 0 ? x[start + i] : 0; re[i] = v * win[i]; im[i] = 0; }
  fft(re, im);
  const mag = new Float32Array(N / 2);
  for (let k = 0; k < N / 2; k++) mag[k] = Math.hypot(re[k], im[k]);
  return mag;
}

const { rate, L, R } = readWav(args.file);
const n = L.length;
const M = new Float32Array(n), S = new Float32Array(n);
for (let i = 0; i < n; i++) { M[i] = (L[i] + R[i]) / 2; S[i] = (L[i] - R[i]) / 2; }
const duration = n / rate;
const nFrames = Math.ceil(duration * args.fps);
const percentile = (arr, p) => { const s = Float32Array.from(arr).sort(); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const round = (v, d = 3) => Math.round(v * 10 ** d) / 10 ** d;

// ---------- per-video-frame features (window 4096, centred on the frame) ----------
const BANDS = [['sub', 20, 60], ['bass', 60, 250], ['lowMid', 250, 500], ['mid', 500, 2000], ['highMid', 2000, 6000], ['air', 6000, 20000]];
const NW = 4096, win4 = hann(NW), fft4 = makeFFT(NW), re4 = new Float32Array(NW), im4 = new Float32Array(NW);
const hz = (k, N) => (k * rate) / N;
const GROUP_RANGES = [['low', 20, 250], ['mid', 250, 2000], ['high', 2000, 20000]];
const raw = { rms: [], centroid: [], flux: [], width: [], balance: [], pan: { low: [], mid: [], high: [] }, bands: Object.fromEntries(BANDS.map(([b]) => [b, []])) };
let prevMag = null;
for (let f = 0; f < nFrames; f++) {
  const centre = Math.round((f / args.fps) * rate), start = centre - NW / 2;
  const mag = spectrum(M, start, NW, win4, fft4, re4, im4);
  let e = 0, num = 0, den = 0;
  const bandE = BANDS.map(() => 0);
  for (let k = 1; k < mag.length; k++) {
    const fr = hz(k, NW), p = mag[k] * mag[k];
    e += p; num += fr * mag[k]; den += mag[k];
    for (let b = 0; b < BANDS.length; b++) if (fr >= BANDS[b][1] && fr < BANDS[b][2]) { bandE[b] += p; break; }
  }
  let td = 0, cnt = 0;
  for (let i = Math.max(0, start); i < Math.min(n, start + NW); i++) { td += M[i] * M[i]; cnt++; }
  raw.rms.push(cnt ? Math.sqrt(td / cnt) : 0); // true time-domain level, converted to dBFS below
  raw.centroid.push(den > 0 ? num / den : 0);
  BANDS.forEach(([name], b) => raw.bands[name].push(Math.sqrt(bandE[b])));
  let fl = 0;
  if (prevMag) for (let k = 1; k < mag.length; k++) { const d = Math.log1p(mag[k] * 50) - Math.log1p(prevMag[k] * 50); if (d > 0) fl += d; }
  raw.flux.push(fl); prevMag = mag;
  // where each band group sits in the stereo field: (right - left) / (right + left) amplitude within the group's bins
  const magL = spectrum(L, start, NW, win4, fft4, re4, im4), magR = spectrum(R, start, NW, win4, fft4, re4, im4);
  for (const [g, glo, ghi] of GROUP_RANGES) {
    let pl = 0, pr = 0;
    for (let k = 1; k < magL.length; k++) { const fr = hz(k, NW); if (fr >= glo && fr < ghi) { pl += magL[k] * magL[k]; pr += magR[k] * magR[k]; } }
    raw.pan[g].push(pl + pr > 1e-9 ? (Math.sqrt(pr) - Math.sqrt(pl)) / (Math.sqrt(pr) + Math.sqrt(pl)) : 0);
  }
  // stereo: energy of side vs mid, and left/right balance, over the same 4096 samples
  let em = 0, es = 0, el = 0, er = 0;
  for (let i = Math.max(0, start); i < Math.min(n, start + NW); i++) { em += M[i] * M[i]; es += S[i] * S[i]; el += L[i] * L[i]; er += R[i] * R[i]; }
  raw.width.push(em + es > 0 ? Math.sqrt(es / (em + es)) : 0);
  raw.balance.push(el + er > 0 ? (Math.sqrt(er) - Math.sqrt(el)) / (Math.sqrt(er) + Math.sqrt(el)) : 0);
}

// Normalise each series to 0..1 by its own 98th percentile (dB-linear for level-like series, so quiet
// passages are still visible). The raw dB / Hz ranges are kept in meta so nothing is lost.
const dbOf = (x) => 20 * Math.log10(Math.max(x, 1e-7));
const norm = (arr, log) => {
  if (!log) { const hi = percentile(arr, 0.98) || 1; return arr.map((x) => round(Math.min(1, x / hi))); }
  // level-like series: linear in dB between the series' own 2nd and 98th percentile, so the real dynamics show
  const v = arr.map(dbOf), lo = percentile(v, 0.02), hi = percentile(v, 0.98);
  return v.map((x) => round(Math.max(0, Math.min(1, (x - lo) / (hi - lo || 1)))));
};
const frames = {
  rms: norm(raw.rms, true),
  centroid: norm(raw.centroid, false),
  flux: norm(raw.flux, false),
  width: raw.width.map((x) => round(x)),
  balance: raw.balance.map((x) => round(x)),
  pan: Object.fromEntries(GROUP_RANGES.map(([g]) => [g, raw.pan[g].map((x) => round(x))])),
  bands: Object.fromEntries(BANDS.map(([b]) => [b, norm(raw.bands[b], true)])),
};

// ---------- onsets: spectral flux at 100 fps, one stream per band group, adaptive threshold, peak-picking ----------
// Groups: low (20-250 Hz: kicks, bass plucks), mid (250-2000 Hz: body, chords, voice), high (2-20 kHz: hats, air).
// Each group has its own flux (normalised by its bin count, else the many high bins swamp everything) and its own
// threshold and strength scale, so a soft hat and a hard kick are each judged against their own kind.
const GROUPS = [['low', 20, 250], ['mid', 250, 2000], ['high', 2000, 20000]];
const HOP_O = Math.round(rate / 100), NO = 1024, nO = Math.floor((n - 4096) / HOP_O);
// The low group needs a longer window: at 1024 samples one FFT bin is ~47 Hz, so 20-250 Hz is only ~5 bins of noise.
const NWIN = [4096, 1024, 1024];
const genv = GROUPS.map(() => new Float32Array(nO)), env = new Float32Array(nO);
GROUPS.forEach(([, lo, hi], g) => {
  const N = NWIN[g], w = hann(N), fft = makeFFT(N), re = new Float32Array(N), im = new Float32Array(N);
  const ks = []; for (let k = 1; k < N / 2; k++) { const fr = hz(k, N); if (fr >= lo && fr < hi) ks.push(k); }
  let prev = null;
  for (let i = 0; i < nO; i++) {
    const mag = spectrum(M, i * HOP_O + (4096 - N) / 2, N, w, fft, re, im); // windows share their centre across groups
    if (prev) { let fl = 0; for (const k of ks) { const d = Math.log1p(mag[k] * 50) - Math.log1p(prev[k] * 50); if (d > 0) fl += d; } genv[g][i] = fl / ks.length; env[i] += genv[g][i]; }
    prev = mag;
  }
});
const onsets = [];
GROUPS.forEach(([name], g) => {
  const e = genv[g], W = 30, found = [];
  const hi = percentile(e, 0.995) || 1;
  let last = -100;
  for (let i = 2; i < nO - 2; i++) {
    let mean = 0, cnt = 0;
    for (let j = Math.max(0, i - W); j < Math.min(nO, i + W); j++) { mean += e[j]; cnt++; }
    mean /= cnt;
    const isPeak = e[i] > e[i - 1] && e[i] >= e[i + 1] && e[i] > e[i - 2] && e[i] >= e[i + 2];
    if (isPeak && e[i] > mean * 1.8 + 0.05 * hi && i - last >= 8) { found.push({ i, v: e[i] }); last = i; }
  }
  const top = percentile(found.map((f) => f.v), 0.95) || 1;
  for (const f of found) { const t = (f.i * HOP_O + 2048) / rate; onsets.push({ t: round(t), frame: Math.round(t * args.fps), strength: round(Math.min(1, f.v / top)), band: name }); }
});
onsets.sort((a, b) => a.t - b.t);
// Where each attack sits: stereo position (right minus left within the group's band, over 2048 samples from just
// before the attack) and register (energy-weighted centre frequency of that band). This is the level of the whole
// band at that instant, not of the new note alone, so it is a good location hint, not a per-instrument fact.
{
  const NP = 2048, wP = hann(NP), fP = makeFFT(NP), rP = new Float32Array(NP), iP = new Float32Array(NP);
  for (const o of onsets) {
    const [, lo, hi] = GROUPS.find(([nm]) => nm === o.band);
    const st = Math.round(o.t * rate) - 256;
    const mL = spectrum(L, st, NP, wP, fP, rP, iP), mR = spectrum(R, st, NP, wP, fP, rP, iP);
    let el = 0, er = 0, num = 0, den = 0;
    for (let k = 1; k < NP / 2; k++) { const fr = hz(k, NP); if (fr < lo || fr >= hi) continue; el += mL[k] ** 2; er += mR[k] ** 2; const pw = mL[k] ** 2 + mR[k] ** 2; num += fr * pw; den += pw; }
    o.pan = round(el + er > 1e-9 ? (Math.sqrt(er) - Math.sqrt(el)) / (Math.sqrt(er) + Math.sqrt(el)) : 0, 2);
    o.freq = Math.round(den > 0 ? num / den : (lo + hi) / 2);
  }
}

// ---------- tempo guess: autocorrelation of the onset envelope ----------
const tempo = (() => {
  const x = Float32Array.from(env), m = x.reduce((a, b) => a + b, 0) / x.length;
  for (let i = 0; i < x.length; i++) x[i] -= m;
  const ac = (lag) => { let s = 0; for (let i = 0; i + lag < x.length; i++) s += x[i] * x[i + lag]; return s; };
  const zero = ac(0) || 1, res = [];
  for (let bpm = 50; bpm <= 200; bpm += 0.5) { const lag = (60 / bpm) * 100; const lo = Math.floor(lag), fr = lag - lo; res.push({ bpm, score: ((1 - fr) * ac(lo) + fr * ac(lo + 1)) / zero }); }
  const peaks = res.filter((r, i) => i > 0 && i < res.length - 1 && r.score > res[i - 1].score && r.score >= res[i + 1].score).sort((a, b) => b.score - a.score).slice(0, 4);
  return { note: 'a guess from onset autocorrelation; score ~0.1+ suggests a steady pulse, near 0 means none', candidates: peaks.map((p) => ({ bpm: round(p.bpm, 1), score: round(p.score) })) };
})();

// ---------- chroma + key (window 16384, hop 0.1 s, mono) ----------
const NC = 16384, winC = hann(NC), fftC = makeFFT(NC), reC = new Float32Array(NC), imC = new Float32Array(NC);
const chromaAt = (t) => {
  const mag = spectrum(M, Math.round(t * rate) - NC / 2, NC, winC, fftC, reC, imC), c = new Float64Array(12);
  for (let k = 1; k < mag.length; k++) {
    const fr = hz(k, NC); if (fr < 65 || fr > 2000) continue;
    const midi = 69 + 12 * Math.log2(fr / 440);
    c[((Math.round(midi) % 12) + 12) % 12] += mag[k] * mag[k];
  }
  return c;
};
const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const corr = (a, b) => { const ma = a.reduce((s, v) => s + v, 0) / 12, mb = b.reduce((s, v) => s + v, 0) / 12; let nu = 0, da = 0, db = 0; for (let i = 0; i < 12; i++) { nu += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return nu / Math.sqrt(da * db || 1); };
const estimateKey = (chroma) => {
  const cands = [];
  for (let r = 0; r < 12; r++) {
    cands.push({ key: `${NOTE[r]} major`, r: corr(chroma, MAJ.map((_, i) => MAJ[(i - r + 12) % 12])) });
    cands.push({ key: `${NOTE[r]} minor`, r: corr(chroma, MIN.map((_, i) => MIN[(i - r + 12) % 12])) });
  }
  cands.sort((a, b) => b.r - a.r);
  return { best: { key: cands[0].key, r: round(cands[0].r) }, alternative: { key: cands[1].key, r: round(cands[1].r) }, third: { key: cands[2].key, r: round(cands[2].r) } };
};
const chromaSeries = []; // one 12-vector per second, reused for sections and per-section keys
for (let t = 0.5; t < duration; t += 1) chromaSeries.push(Array.from(chromaAt(t)));
const sumChroma = (from, to) => { const c = new Array(12).fill(0); for (let s = Math.floor(from); s < Math.min(chromaSeries.length, Math.ceil(to)); s++) { const tot = chromaSeries[s].reduce((a, b) => a + b, 0) || 1; chromaSeries[s].forEach((v, i) => (c[i] += v / tot)); } const tot = c.reduce((a, b) => a + b, 0) || 1; return c.map((v) => v / tot); };
const globalChroma = sumChroma(0, duration);
const key = { note: 'Krumhansl-Schmuckler estimate over the whole recording — a statistical guess; check `alternative` when r values are close', chroma: Object.fromEntries(NOTE.map((nm, i) => [nm, round(globalChroma[i])])), ...estimateKey(globalChroma) };

// ---------- sections: novelty from a self-similarity matrix of 1-second feature vectors ----------
const secs = Math.floor(duration), perSec = args.fps;
const vec = [];
for (let s = 0; s < secs; s++) {
  const a = s * perSec, b = Math.min(nFrames, (s + 1) * perSec), avg = (arr) => arr.slice(a, b).reduce((x, y) => x + y, 0) / Math.max(1, b - a);
  vec.push([avg(frames.rms), avg(frames.centroid), avg(frames.width), ...BANDS.map(([nm]) => avg(frames.bands[nm])), ...chromaSeries[s].map((v, _, arr) => v / (arr.reduce((x, y) => x + y, 0) || 1) * 3)]);
}
const cosSim = (u, v) => { let d = 0, a = 0, b = 0; for (let i = 0; i < u.length; i++) { d += u[i] * v[i]; a += u[i] * u[i]; b += v[i] * v[i]; } return d / Math.sqrt(a * b || 1); };
const KH = 8; // half-kernel in seconds: boundaries are judged by how different the 8 s before is from the 8 s after
const novelty = new Float32Array(secs);
for (let s = KH; s < secs - KH; s++) {
  let within = 0, across = 0, cw = 0, ca = 0;
  for (let i = -KH; i < KH; i++) for (let j = -KH; j < KH; j++) {
    const sim = cosSim(vec[s + i], vec[s + j]);
    if ((i < 0) === (j < 0)) { within += sim; cw++; } else { across += sim; ca++; }
  }
  novelty[s] = within / cw - across / ca;
}
const nMax = percentile(novelty, 0.99) || 1;
const cuts = [];
for (let s = KH; s < secs - KH; s++) {
  let isMax = true; for (let j = -KH; j <= KH; j++) if (novelty[s + j] > novelty[s]) isMax = false;
  if (isMax && novelty[s] > 0.35 * nMax) cuts.push({ t: s, novelty: round(novelty[s] / nMax) });
}
const bounds = [{ t: 0, novelty: 1 }, ...cuts, { t: duration, novelty: 1 }];
const sections = bounds.slice(0, -1).map((b, i) => ({ start: round(b.t, 1), end: round(bounds[i + 1].t, 1), novelty_at_start: round(b.novelty, 2) }));

// ---------- per-section stats, for the human-readable map ----------
const toDb = (v) => 20 * Math.log10(Math.max(v, 1e-9));
const mean = (arr, a, b) => arr.slice(a, b).reduce((x, y) => x + y, 0) / Math.max(1, b - a);
for (const sc of sections) {
  const a = Math.round(sc.start * args.fps), b = Math.round(sc.end * args.fps);
  const c = sumChroma(sc.start, sc.end);
  sc.stats = {
    loudness_norm: round(mean(frames.rms, a, b), 2),
    brightness_hz: Math.round(mean(raw.centroid, a, b)),
    width: round(mean(frames.width, a, b), 2),
    onsets_per_sec: Object.fromEntries(GROUPS.map(([nm]) => [nm, round(onsets.filter((o) => o.band === nm && o.t >= sc.start && o.t < sc.end).length / (sc.end - sc.start), 2)])),
    dominant_bands: Object.entries(Object.fromEntries(BANDS.map(([nm]) => [nm, mean(frames.bands[nm], a, b)]))).sort((x, y) => y[1] - x[1]).slice(0, 2).map(([nm]) => nm),
    top_pitch_classes: c.map((v, i) => [NOTE[i], v]).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([nm]) => nm),
    key_guess: estimateKey(c).best.key,
  };
}

// ---------- write ----------
const meta = {
  source: args.file, duration_s: round(duration, 2), sample_rate: rate, fps: args.fps, frames: nFrames,
  raw_ranges: { rms_dbfs: [round(toDb(percentile(raw.rms, 0.02)), 1), round(toDb(percentile(raw.rms, 0.98)), 1)], centroid_hz: [Math.round(percentile(raw.centroid, 0.02)), Math.round(percentile(raw.centroid, 0.98))] },
  notes: 'frames.* are normalised to 0..1 by their own 98th percentile (level-like series linear in dB); width/balance are natural units (0..1 and -1..1). Sections, key and tempo are estimates.',
};
// Pitch-class energy per second (each second sums to 1; index 0 = C .. 11 = B), centred at t = i + 0.5 s.
const chroma = { note: 'index 0=C..11=B, one 12-vector per second centred at i+0.5 s, each summing to 1', perSecond: chromaSeries.map((c) => { const tot = c.reduce((a, b) => a + b, 0) || 1; return c.map((v) => round(v / tot, 4)); }) };
writeFileSync(args.out, JSON.stringify({ meta, tempo, key, sections, onsets, chroma, frames }));

// ---------- human-readable map ----------
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
console.log(`${args.file}: ${mmss(duration)} (${round(duration, 1)} s), ${rate} Hz, ${nFrames} frames @ ${args.fps} fps`);
console.log(`loudness (short-term RMS, dBFS, 2nd..98th percentile) ${meta.raw_ranges.rms_dbfs.join(' .. ')} dB, brightness ${meta.raw_ranges.centroid_hz.join(' .. ')} Hz`);
console.log(`key guess: ${key.best.key} (r=${key.best.r}), alt ${key.alternative.key} (r=${key.alternative.r}), 3rd ${key.third.key} (r=${key.third.r})`);
console.log(`tempo guess: ${tempo.candidates.map((c) => `${c.bpm} bpm (${c.score})`).join(', ')}`);
console.log(`onsets: ${onsets.length} (${round(onsets.length / duration, 2)}/s)`);
const stat = (arr) => { const m = arr.reduce((a, b) => a + b, 0) / arr.length; const sd = Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length); return `mean ${round(m, 2)}, spread ${round(sd, 2)}`; };
console.log('stereo position of each band group over time (-1 left .. 1 right): ' + GROUP_RANGES.map(([g]) => `${g}: ${stat(raw.pan[g])}`).join(' | '));
console.log('attack pan (-1..1): ' + GROUPS.map(([g]) => { const v = onsets.filter((o) => o.band === g).map((o) => o.pan); return `${g}: ${stat(v)}`; }).join(' | '));
console.log('\nsections (candidate boundaries — a guess):');
for (const sc of sections) console.log(`  ${mmss(sc.start)}-${mmss(sc.end)}  loud ${sc.stats.loudness_norm}  bright ${sc.stats.brightness_hz} Hz  width ${sc.stats.width}  hits/s low ${sc.stats.onsets_per_sec.low} mid ${sc.stats.onsets_per_sec.mid} high ${sc.stats.onsets_per_sec.high}  bands ${sc.stats.dominant_bands.join('+')}  pitches ${sc.stats.top_pitch_classes.join(' ')}  key~${sc.stats.key_guess}`);
console.log(`\nwrote ${args.out}`);
