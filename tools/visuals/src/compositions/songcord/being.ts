import { arcAt, hash01, type Analysis } from "./analysis";

// The "being of light" for prototype J: one luminous head that wanders the whole frame and leaves a trail that fades
// away over TRAIL_SECONDS. Its path is a pure function of a musical clock, so any past moment (needed for the trail)
// can be evaluated directly, with no carried state, as Remotion requires.

export const TRAIL_SECONDS = 4; // user's choice; adjustable after seeing it
export const NT = 32;           // samples along the trail

const smooth = (a: number, b: number, x: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

/**
 * How fast the being travels, from the measured loudness and the narrative curve: slow and gentle when the music is
 * soft, quick in the drama, and almost still in the held question (1:17-1:28), where it lingers instead of travelling.
 */
function rateAt(level: number, arc: number): number {
  return (0.15 + 2.0 * Math.pow(Math.max(0, level - 0.45), 1.3)) * (1 - 0.72 * smooth(0.85, 1.0, arc));
}

const clocks = new WeakMap<Analysis, Float64Array>();
export function beingClock(a: Analysis, t: number): number {
  let cum = clocks.get(a);
  if (!cum) {
    const r = a.frames.rms, fps = a.meta.fps;
    cum = new Float64Array(r.length + 1);
    for (let i = 0; i < r.length; i++) cum[i + 1] = cum[i] + rateAt(r[i], arcAt(i / fps)) / fps;
    clocks.set(a, cum);
  }
  const x = Math.max(0, Math.min(cum.length - 1, t * a.meta.fps));
  const i = Math.floor(x), j = Math.min(cum.length - 1, i + 1);
  return cum[i] + (cum[j] - cum[i]) * (x - i);
}

/** Position of the being at time t, in screen units (height = 1, centred). */
export function beingPos(a: Analysis, t: number, aspect: number): [number, number] {
  const c = beingClock(a, t);
  const X = 0.5 * aspect, Y = 0.5;
  // wide wandering path over the whole frame (two incommensurate sines per axis, so it does not close on itself)
  let x = 0.82 * X * (0.72 * Math.sin(0.31 * c + 0.6) + 0.28 * Math.sin(0.83 * c + 2.0));
  let y = 0.80 * Y * (0.70 * Math.sin(0.47 * c + 1.9) + 0.30 * Math.sin(1.13 * c));
  // in the held question it settles into a small slow orbit near the middle
  const arc = arcAt(t);
  const w = smooth(0.82, 0.95, arc);
  x += (0.16 * Math.cos(0.9 * c) - x) * w;
  y += (0.09 * Math.sin(0.9 * c) - y) * w;
  // toward the light (start and resolution) it rides a little higher
  y += 0.16 * Math.pow(1 - arc, 2) * (1 - w);
  return [x, y];
}

/** Trail samples as vec4 (core x, y, twist offset x, y); index 0 is the head, NT-1 the oldest point. */
export function beingTrail(a: Analysis, t: number, aspect: number, level: number, twist = true): Float32Array {
  const out = new Float32Array(NT * 4);
  for (let i = 0; i < NT; i++) {
    const u = i / (NT - 1);
    const tt = Math.max(0, t - u * TRAIL_SECONDS);
    const [x, y] = beingPos(a, tt, aspect);
    const [x0, y0] = beingPos(a, Math.max(0, tt - 0.06), aspect);
    const [x1, y1] = beingPos(a, tt + 0.06, aspect);
    let tx = x1 - x0, ty = y1 - y0;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len; ty /= len;
    // the two strands twist around the core; the phase belongs to the path (not to the screen), so the twist travels with it
    const amp = 0.030 * (0.25 + 0.75 * Math.pow(1 - u, 0.7)) * (0.7 + 0.7 * level);
    const s = Math.sin(6.5 * beingClock(a, tt) + hash01(3.3) * 6.283) * amp;
    out.set(twist ? [x, y, -ty * s, tx * s] : [x, y, 0, 0], i * 4); // twist = false: a single smooth beam, no strands
  }
  return out;
}
