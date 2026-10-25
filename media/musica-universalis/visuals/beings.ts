import { arc } from "./timeline";

// Musica Universalis — the beings of light, built like Songcord's (compositions/songcord/being.ts): a few of them, not
// a swarm. The user compared the two pieces: the swarm of 26 thin, short, slow, one-colour streaks read as "bacterias",
// while Songcord's single being — wide and white at the front, thinning through teal and blue to violet, a long trail,
// a flare stretched along its travel, lighting everything around it — is the look to follow ("como Songcord… quizá
// menos que ahora"). The shader draws them (shader.ts); this file only moves them.
//
// How a being moves (what the user asked for on top of Songcord's wander):
// - Through 3D space on large circular orbits ("spheres"), seen in perspective: nearer = larger and brighter.
// - The orbit's tilted plane precesses about the line of sight, so the path weaves instead of repeating one circle.
// - At chord changes a being may change sphere: it leaves its orbit along the tangent it already moves on, onto a new
//   orbit of another size and plane, at the same speed. Position and direction stay continuous.
// - Its speed follows the music like Songcord's (slow when the piece is quiet and open, faster at the climax): the
//   orbit angle advances with a MUSIC CLOCK, the integral of a rate over time, never `rate(t) * t` — that product once
//   made every ray jump 16-25x in speed at each chord change.
//
// Measured constraints kept from the earlier rays: orbit planes never tilt past MAX_TILT from the screen (seen edge-on,
// a being flies toward the camera, nearly stops on screen, then races: 70x swings were measured), so precession turns
// about the line of sight exactly and a being only changes sphere while it travels roughly across the screen.

export const NBEING = 6;
export const TRAIL_SECONDS = 4;   // Songcord's trail
const CAMERA = 2.4;               // camera distance, in screen units (height = 1)
const DURATION = 400;             // seconds of path precomputed (the piece is 368 s)
const CHORD_SECONDS = 4;          // the harmony changes chord every 2 bars
const CHANGE_CHANCE = 0.15;       // per being, per chord change
const MIN_ORBIT_SECONDS = 12;     // an orbit lasts at least this long before the being may change sphere
const PREC_SHARE = 0.12;          // precession speed as a share of the orbit's own angular speed
const PREC_RAMP = 3;              // music-clock seconds for the precession to reach full speed on a new orbit
const MAX_TILT = 0.7;
const CHANGE_MAX_DZ = 0.42;
const LINE_OF_SIGHT: V3 = [0, 0, 1];

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => mul(a, 1 / Math.max(1e-9, Math.hypot(a[0], a[1], a[2])));
/** Rotate w about the unit axis k by angle th (Rodrigues). */
const rotate = (w: V3, k: V3, th: number): V3 =>
  add(add(mul(w, Math.cos(th)), mul(cross(k, w), Math.sin(th))), mul(k, dot(k, w) * (1 - Math.cos(th))));
const hash01 = (x: number) => { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); };
const mix = (a: number, b: number, u: number) => a + (b - a) * u;

// The music clock: seconds that pass faster when the piece is fuller (rate 0.55 in the open intro and outro, 1.45 at the
// top of the arc). Precomputed as a running integral at 120 Hz, so reading it is a pure function of t.
const CLOCK_HZ = 120;
const CLOCK = (() => {
  const n = DURATION * CLOCK_HZ + 2, c = new Float64Array(n);
  for (let i = 1; i < n; i++) c[i] = c[i - 1] + (0.55 + 0.9 * arc((i - 0.5) / CLOCK_HZ)) / CLOCK_HZ;
  return c;
})();
function clock(t: number): number {
  const x = Math.max(0, Math.min(CLOCK.length - 1, t * CLOCK_HZ));
  const i = Math.floor(x), j = Math.min(CLOCK.length - 1, i + 1);
  return CLOCK[i] + (CLOCK[j] - CLOCK[i]) * (x - i);
}

/** One orbit: from t0, position = c + rotate(r (cos a u + sin a v), k, precession), a = omega * (music time since t0). */
type Orbit = { t0: number; c0: number; c: V3; u: V3; v: V3; r: number; omega: number; k: V3; prec: number };

function orbitPos(o: Orbit, t: number): V3 {
  const dc = clock(t) - o.c0;
  const a = o.omega * dc;
  const w = add(mul(o.u, o.r * Math.cos(a)), mul(o.v, o.r * Math.sin(a)));
  const th = o.prec * (dc - PREC_RAMP * (1 - Math.exp(-dc / PREC_RAMP))); // its rate rises from 0: no kink at t0
  return add(o.c, rotate(w, o.k, th));
}

function buildPath(i: number): Orbit[] {
  const seed = i * 9.173 + 0.37;
  const h = (k: number) => hash01(seed + k * 1.618);
  // Songcord's being travels far in its 4 s trail, which is what makes it a long beam: speed in screen heights per
  // music-second, so a trail spans ~0.3 in the quiet opening and ~0.7 at the climax. Orbits are large (0.34-0.52) so a
  // trail bends at most ~2 rad.
  const speed = mix(0.1, 0.13, h(1));
  const radius = (k: number) => mix(0.34, 0.52, k);
  // Each being's home: its own part of the frame and a depth. Orbits are chosen to stay around it.
  const hz = mix(-1.2, 0.3, h(8));
  const sc = CAMERA / (CAMERA - hz);
  const home: V3 = [(mix(-0.42, 0.42, (i + 0.5) / NBEING + 0.15 * (h(6) - 0.5)) * (16 / 9) * 0.5) / sc, ((h(7) * 2 - 1) * 0.12) / sc, hz];

  const r0 = radius(h(2));
  const tilt = mix(0.15, MAX_TILT, h(4)), axis = 6.283 * h(5), ph = 6.283 * h(9);
  const ux: V3 = [Math.cos(axis), Math.sin(axis), 0];
  const vy: V3 = [-Math.sin(axis) * Math.cos(tilt), Math.cos(axis) * Math.cos(tilt), Math.sin(tilt)];
  const spin = h(3) < 0.5 ? -1 : 1;
  const orbits: Orbit[] = [{
    t0: 0, c0: 0, c: home, r: r0, omega: speed / r0,
    u: add(mul(ux, Math.cos(ph)), mul(vy, Math.sin(ph))),
    v: mul(add(mul(ux, -Math.sin(ph)), mul(vy, Math.cos(ph))), spin),
    k: LINE_OF_SIGHT, prec: (h(13) < 0.5 ? -1 : 1) * PREC_SHARE * (speed / r0),
  }];

  for (let m = 1; m * CHORD_SECONDS < DURATION; m++) {
    const tau = m * CHORD_SECONDS;
    const cur = orbits[orbits.length - 1];
    if (tau - cur.t0 < MIN_ORBIT_SECONDS || hash01(seed * 31.7 + m * 7.31) > CHANGE_CHANCE) continue;
    const P = orbitPos(cur, tau);
    const T = unit(sub(orbitPos(cur, tau + 0.01), orbitPos(cur, tau - 0.01)));
    if (Math.abs(T[2]) > CHANGE_MAX_DZ) continue;
    const toC = sub(cur.c, P);
    const N0 = unit(sub(toC, mul(T, dot(toC, T))));            // the current orbit's inward normal at P
    const hm = (k: number) => hash01(seed * 13.1 + m * 3.7 + k * 1.618);
    const r = radius(hm(1));
    // Candidate new orbits: tangent at P (same point, same direction), the new plane turned about the tangent by psi.
    // Only planes that face the camera enough are allowed; among those, the one nearest home wins (one of the 3 best).
    const candidates = Array.from({ length: 20 }, (_, j) => 0.35 + j * 0.3).map((psi) => {
      const N = rotate(N0, T, psi);
      const c = add(P, mul(N, r));
      const facing = Math.abs(cross(T, N)[2]);
      const outOfDepth = Math.max(0, c[2] + r - 1.0) + Math.max(0, -1.9 - (c[2] - r));
      const score = (c[0] - home[0]) ** 2 + (c[1] - home[1]) ** 2 * 2 + 0.3 * (c[2] - home[2]) ** 2 + 10 * outOfDepth
        + 20 * Math.max(0, Math.cos(MAX_TILT) - facing);
      return { N, c, score };
    }).sort((a, b) => a.score - b.score);
    const pick = candidates[Math.floor(hm(2) * 3)];
    const omega = speed / r;
    orbits.push({
      t0: tau, c0: clock(tau), c: pick.c, r, omega, u: mul(pick.N, -1), v: T,
      k: LINE_OF_SIGHT, prec: (hm(5) < 0.5 ? -1 : 1) * PREC_SHARE * omega,
    });
  }
  return orbits;
}
const PATHS: Orbit[][] = Array.from({ length: NBEING }, (_, i) => buildPath(i));

/** Screen position (x, y; height = 1, centred) and perspective scale s (1 = at the screen plane, >1 nearer) of being
 * i at time t. */
export function beingPos(i: number, t: number): [number, number, number] {
  const path = PATHS[((i % NBEING) + NBEING) % NBEING];
  let lo = 0, hi = path.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (path[mid].t0 <= t) lo = mid; else hi = mid - 1; }
  const [x, y, z] = orbitPos(path[lo], t);
  const s = CAMERA / (CAMERA - z);
  return [x * s, y * s, s];
}

/** How many beings are lit, as a continuous count: one alone in the opening, up to NBEING at the top of the arc, back
 * to one at the end. Each fades in and out as its turn comes (`clamp(visibleCount - i, 0, 1)`). */
export function visibleCount(arcValue: number, monochordValue: number): number {
  const n = 1 + (NBEING - 1) * arcValue;
  return Math.max(0.8, n * (1 - 0.5 * monochordValue));
}

/** For checks: the moments being i changes sphere. */
export const _changeTimes = (i: number) => PATHS[i].slice(1).map((o) => o.t0);
