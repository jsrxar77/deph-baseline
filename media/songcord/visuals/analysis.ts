import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

// Reads public/songcord-analysis.json (copy of media/songcord/sync/analysis.json, made by
// tools/sounds/analyze-audio.mjs). Everything below is a pure function of time `t` (seconds): frames may be
// rendered out of order / in parallel, so there is no carried state, and smoothing is done by averaging samples
// spread around `t`, never by remembering the previous frame.

export type Onset = { t: number; frame: number; strength: number; band: "low" | "mid" | "high"; pan: number; freq: number };

export type Analysis = {
  meta: { duration_s: number; fps: number; frames: number };
  onsets: Onset[];
  chroma: { perSecond: number[][] };
  frames: {
    rms: number[];
    centroid: number[];
    flux: number[];
    width: number[];
    balance: number[];
    pan: { low: number[]; mid: number[]; high: number[] };
    bands: { sub: number[]; bass: number[]; lowMid: number[]; mid: number[]; highMid: number[]; air: number[] };
  };
};

let cache: Analysis | null = null;

export function useAnalysis(): Analysis | null {
  const [data, setData] = useState<Analysis | null>(cache);
  const [handle] = useState(() => (cache ? null : delayRender("Loading songcord-analysis.json")));
  useEffect(() => {
    if (cache || handle === null) return;
    fetch(staticFile("songcord-analysis.json"))
      .then((r) => r.json())
      .then((a: Analysis) => {
        cache = a;
        setData(a);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
  return data;
}

/** Linear interpolation of a per-analysis-frame series at time t. */
function lerpAt(series: number[], fps: number, t: number): number {
  const x = Math.max(0, Math.min(series.length - 1, t * fps));
  const i = Math.floor(x);
  const j = Math.min(series.length - 1, i + 1);
  return series[i] + (series[j] - series[i]) * (x - i);
}

/** Series value at t, averaged over +-radius seconds (7 samples) so it moves smoothly and without jitter. */
export function smoothAt(a: Analysis, series: number[], t: number, radius = 0.3): number {
  let s = 0;
  for (let k = -3; k <= 3; k++) s += lerpAt(series, a.meta.fps, t + (k / 3) * radius);
  return s / 7;
}

/** Pitch-class energy at time t, averaged over +-radius seconds, normalised so the strongest class is 1. */
export function chromaAt(a: Analysis, t: number, radius = 1.5): number[] {
  const per = a.chroma.perSecond;
  const out = new Array(12).fill(0);
  for (let k = -3; k <= 3; k++) {
    const x = Math.max(0, Math.min(per.length - 1, t + (k / 3) * radius - 0.5));
    const i = Math.floor(x), j = Math.min(per.length - 1, i + 1), f = x - i;
    for (let c = 0; c < 12; c++) out[c] += (per[i][c] * (1 - f) + per[j][c] * f) / 7;
  }
  const max = Math.max(...out, 1e-6);
  return out.map((v) => v / max);
}

/** Onsets of the given bands that happened within the last `window` seconds, most recent first, capped at `max`. */
export function recentOnsets(a: Analysis, t: number, window: number, max: number, bands: Onset["band"][]): Onset[] {
  const hits: Onset[] = [];
  for (const o of a.onsets) {
    if (o.t > t) break; // onsets are sorted by time
    if (t - o.t < window && bands.includes(o.band)) hits.push(o);
  }
  return hits.slice(-max).reverse();
}

// Narrative curve for the piece, from the arc the user confirmed by ear (see media/songcord/songcord.md):
// 0 = surface / light / calm, 1 = deepest (the held question at 1:17-1:28). Keyframes in seconds; eased between them.
const ARC: [number, number][] = [
  [0, 0.0], [28, 0.2], [54, 0.55], [77, 0.95], [88, 0.92], [118, 0.65], [145, 0.5], [168, 0.12], [187, 0.0], [400, 0.0],
];
export function arcAt(t: number): number {
  for (let i = 0; i < ARC.length - 1; i++) {
    const [t0, v0] = ARC[i], [t1, v1] = ARC[i + 1];
    if (t <= t1) {
      const u = Math.max(0, (t - t0) / (t1 - t0));
      const e = u * u * (3 - 2 * u);
      return v0 + (v1 - v0) * e;
    }
  }
  return 0;
}

/** Deterministic pseudo-random in [0,1) from a number (used to place a ripple for a given onset time). */
export function hash01(x: number): number {
  const s = Math.sin(x * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * A clock that runs faster when the music is louder: the integral of (0.55 + 0.9 * loudness) over time. Built once
 * per analysis, so reading it is a pure function of t (motion can depend on energy without carrying state).
 */
const clocks = new WeakMap<Analysis, Float64Array>();
export function energyClock(a: Analysis, t: number): number {
  let cum = clocks.get(a);
  if (!cum) {
    const r = a.frames.rms, fps = a.meta.fps;
    cum = new Float64Array(r.length + 1);
    for (let i = 0; i < r.length; i++) cum[i + 1] = cum[i] + (0.55 + 0.9 * r[i]) / fps;
    clocks.set(a, cum);
  }
  const x = Math.max(0, Math.min(cum.length - 1, t * a.meta.fps));
  const i = Math.floor(x), j = Math.min(cum.length - 1, i + 1);
  return cum[i] + (cum[j] - cum[i]) * (x - i);
}

/** Screen position (height = 1, centred) for an attack: x from its measured stereo pan, y from its register. */
export function onsetPosition(o: Onset, aspect: number): [number, number] {
  // Pan in this recording is small (attacks sit within about +-0.15), so it is amplified; a deterministic jitter keeps
  // simultaneous attacks from stacking on one spot. y is the log-frequency of the attack's band (200 Hz low, 10 kHz high).
  const x = Math.max(-1, Math.min(1, o.pan * 3.5)) * 0.42 * aspect + (hash01(o.t * 3.1) - 0.5) * 0.30 * aspect;
  const reg = Math.log2(Math.max(o.freq, 100) / 200) / 5.64;
  const y = (Math.max(0, Math.min(1, reg)) - 0.5) * 0.80 + (hash01(o.t * 5.7 + 1) - 0.5) * 0.10;
  return [x, y];
}
