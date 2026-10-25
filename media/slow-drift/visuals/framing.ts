// Auto-framing for the Slow Drift fractal: where the camera should look so the whole frame is filled
// with fractal structure instead of a smooth patch (deep inside a basin, or out past the set's tip).
//
// The Julia set's shape changes as its constant `c` drifts, so no fixed camera position stays on
// interesting ground for the whole piece (tried: origin, and the repelling fixed point beta — each
// left large flat areas at some moments). Instead candidate centers are scored by how much of the
// frame they'd cover with "near-boundary" points (escape count in a mid range: not the flat deep
// interior, not the flat far exterior).
//
// Picking the best center independently per frame made the camera jump between distant regions when
// the winner changed, so the camera follows one continuous PATH instead: computed once when this
// module loads (deterministic, so every parallel Remotion render worker gets the identical path),
// hill-climbing from the best starting point with a hard speed limit, then smoothed and interpolated.
// Nothing here depends on per-frame state, which Remotion's out-of-order frame rendering forbids.
//
// The formulas for c and zoom below mirror shaders.ts — keep them in sync by hand.

export const JULIA_SEED: [number, number] = [-0.7269, 0.1889];
export const ASPECT = 16 / 9;

export function juliaC(t: number): [number, number] {
  return [
    JULIA_SEED[0] + 0.022 * Math.cos(t * 0.035),
    JULIA_SEED[1] + 0.022 * Math.sin(t * 0.045),
  ];
}

export function zoomAt(t: number): number {
  const arcT = t / 364;
  const s = Math.min(Math.max(arcT / 0.55, 0), 1);
  const smooth = s * s * (3 - 2 * s);
  const e = Math.min(Math.max((arcT - 0.85) / 0.15, 0), 1);
  const growth = smooth * (1 - 0.25 * (e * e * (3 - 2 * e)));
  return (1.05 + (0.5 - 1.05) * growth) * (1 + 0.05 * Math.sin(t * 0.05));
}

const ITER = 100;
const GRID_X = 13; // candidate columns across [-1.8, 1.8]
const GRID_Y = 9; // candidate rows across [-1.2, 1.2]
const SAMPLES_X = 6;
const SAMPLES_Y = 4;

// How "structured" one point is: near-boundary points (escape after a moderate number of steps) count
// fully; instant escapes (flat far exterior) and never-escaping points (flat deep interior) count little.
function richness(x: number, y: number, cx: number, cy: number): number {
  let zx = x;
  let zy = y;
  for (let j = 0; j < ITER; j++) {
    const nx = zx * zx - zy * zy + cx;
    zy = 2 * zx * zy + cy;
    zx = nx;
    if (zx * zx + zy * zy > 16) {
      if (j < 6) return j / 12;
      return 1;
    }
  }
  return 0.1;
}

function scoreCenter(px: number, py: number, t: number): number {
  const [cx, cy] = juliaC(t);
  const zoom = zoomAt(t);
  const halfW = 0.5 * ASPECT * zoom;
  const halfH = 0.5 * zoom;
  let sum = 0;
  for (let sy = 0; sy < SAMPLES_Y; sy++) {
    for (let sx = 0; sx < SAMPLES_X; sx++) {
      const ux = px + ((sx + 0.5) / SAMPLES_X - 0.5) * 2 * halfW;
      const uy = py + ((sy + 0.5) / SAMPLES_Y - 0.5) * 2 * halfH;
      sum += richness(ux, uy, cx, cy);
    }
  }
  return sum / (SAMPLES_X * SAMPLES_Y);
}

// Global search over a coarse grid. A Julia set is point-symmetric (z -> -z), so the two sides are
// mirror images: only one side is searched (otherwise equally good candidates on both sides would
// average to the dead center).
function globalBest(t: number): [number, number, number] {
  let best = -1;
  let bx = 0;
  let by = 0;
  for (let gy = 0; gy < GRID_Y; gy++) {
    for (let gx = 0; gx < GRID_X; gx++) {
      const px = -1.8 + (3.6 * gx) / (GRID_X - 1);
      const py = -1.2 + (2.4 * gy) / (GRID_Y - 1);
      if (px < -1e-9) continue;
      const score = scoreCenter(px, py, t);
      if (score > best) {
        best = score;
        bx = px;
        by = py;
      }
    }
  }
  return [bx, by, best];
}

const STEP = 0.5; // seconds between path points
const MAX_STEP = 0.03; // hill-climb speed limit: 0.06 units/s, about 0.12 frame-heights/s at deepest zoom
const RELATIVE_LOST = 0.8; // glide elsewhere when this spot scores under 80% of the best anywhere
const COOLDOWN_STEPS = 24; // 12s between glides
const GLIDE_STEP = 0.08;
const SMOOTH_HALF_WINDOW = 6; // path points either side (3s) for the final moving average

const PATH: [number, number][] = (() => {
  const total = Math.ceil(400 / STEP);
  const raw: [number, number][] = [];
  let [x, y] = globalBest(0);
  let target: [number, number] | null = null;
  let cooldown = 0;
  for (let i = 0; i <= total; i++) {
    const t = i * STEP;
    let bestScore = -1;
    let nx = x;
    let ny = y;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = x + dx * MAX_STEP;
        const py = y + dy * MAX_STEP;
        const score = scoreCenter(px, py, t);
        if (score > bestScore + 1e-9) {
          bestScore = score;
          nx = px;
          ny = py;
        }
      }
    }
    // If this spot is much poorer than the best one anywhere, commit to a slow glide toward that
    // better region and keep going until arrival (committing, rather than re-deciding every step,
    // is what stops the camera oscillating between two similar regions). A cooldown after arriving
    // prevents immediately re-triggering.
    if (cooldown > 0) cooldown--;
    if (target === null && cooldown === 0) {
      const [gx, gy, gscore] = globalBest(t);
      if (bestScore < RELATIVE_LOST * gscore && gscore - bestScore > 0.12) target = [gx, gy];
    }
    if (target !== null) {
      const dist = Math.hypot(target[0] - x, target[1] - y);
      if (dist < 0.05) {
        target = null;
        cooldown = COOLDOWN_STEPS;
      } else {
        const k = Math.min(1, GLIDE_STEP / dist);
        nx = x + (target[0] - x) * k;
        ny = y + (target[1] - y) * k;
      }
    }
    x = nx;
    y = ny;
    raw.push([x, y]);
  }
  return raw.map((_, i) => {
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let k = -SMOOTH_HALF_WINDOW; k <= SMOOTH_HALF_WINDOW; k++) {
      const j = Math.min(Math.max(i + k, 0), raw.length - 1);
      sx += raw[j][0];
      sy += raw[j][1];
      n++;
    }
    return [sx / n, sy / n] as [number, number];
  });
})();

export function frameCenter(t: number): [number, number] {
  const f = Math.min(Math.max(t / STEP, 0), PATH.length - 1);
  const i = Math.floor(f);
  const j = Math.min(i + 1, PATH.length - 1);
  const u = f - i;
  return [PATH[i][0] * (1 - u) + PATH[j][0] * u, PATH[i][1] * (1 - u) + PATH[j][1] * u];
}

export function pathScoreAt(t: number): number {
  const [x, y] = frameCenter(t);
  return scoreCenter(x, y, t);
}

export function globalBestScoreAt(t: number): number {
  return globalBest(t)[2];
}
