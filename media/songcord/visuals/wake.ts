import { chromaAt, hash01, type Analysis } from "./analysis";

// Prototype L: the harmony layer (formerly the cymatic plate) becomes the wake that water keeps behind things moving
// through it, spread over the whole frame. Each of the 12 pitch classes owns an invisible source that wanders across the
// frame on its own slow path; while that note sounds, the source drops ring waves into the water, and the rings of a moving
// source interfere into the curved V-shaped arms of a wake. A wake lasts WAKE_SECONDS. The loudest notes leave the biggest
// wakes and the tonic (A) leaves the longest waves, so harmony still shapes the picture, as in the plate it replaces.
// Everything is a pure function of t: past positions and past note weights are evaluated directly.

export const NK = 4;             // pitch classes drawn at once (the four strongest over the last wake)
export const NH = 24;            // emission samples per wake
export const WAKE_SECONDS = 12;  // the user's choice; adjustable after seeing it
const TONIC = 9;                 // A

/** Where a pitch class's source is at time t (screen units, height = 1, centred): a slow wide wander over the whole frame. */
export function sourcePos(k: number, t: number, aspect: number): [number, number] {
  const X = 0.5 * aspect, Y = 0.5;
  const f = 0.055 + 0.03 * hash01(k * 3.7);
  const ph = 6.283 * hash01(k * 1.9 + 4);
  const x = 0.85 * X * (0.7 * Math.sin(f * t + ph) + 0.3 * Math.sin(2.3 * f * t + 2.1 * ph));
  const y = 0.85 * Y * (0.7 * Math.sin(1.31 * f * t + 1.7 * ph) + 0.3 * Math.sin(2.9 * f * t + ph));
  return [x, y];
}

const smooth = (a: number, b: number, x: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

/** Wave number per pitch class: the tonic is the longest wave, and harmonic distance from it shortens the wave. */
const KW_BY_DEGREE = [17, 22, 26, 30, 34, 27, 38, 24, 32, 28, 36, 40];
const kwOf = (k: number) => KW_BY_DEGREE[(k - TONIC + 12) % 12];

export function wakeUniforms(a: Analysis, t: number, aspect: number) {
  // note weight of every pitch class at every emission time inside the wake window
  const W: number[][] = Array.from({ length: 12 }, () => new Array(NH).fill(0));
  const score = new Array(12).fill(0);
  for (let m = 0; m < NH; m++) {
    const s = (m * WAKE_SECONDS) / NH;
    const tt = Math.max(0, t - s);
    const c = chromaAt(a, tt, 1.5);
    const fade = smooth(0, 0.6, s) * (1 - smooth(WAKE_SECONDS * 0.5, WAKE_SECONDS, s));
    for (let k = 0; k < 12; k++) {
      W[k][m] = Math.pow(c[k], 1.6) * fade;
      score[k] += W[k][m];
    }
  }
  const order = [...Array(12).keys()].sort((x, y) => score[y] - score[x]).slice(0, NK);
  const wake = new Float32Array(NK * NH * 4);
  const kw = new Float32Array(NK);
  let dominant = order[0];
  order.forEach((k, j) => {
    kw[j] = kwOf(k);
    for (let m = 0; m < NH; m++) {
      const s = (m * WAKE_SECONDS) / NH;
      const [x, y] = sourcePos(k, Math.max(0, t - s), aspect);
      wake.set([x, y, s, W[k][m]], (j * NH + m) * 4);
    }
  });
  return { wake, kw, dominantHue: dominant / 12 };
}
