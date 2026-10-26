// Two particle clouds — Sofía (light, high register) and the Demiurgo (matter, low register), connected by lines
// that appear only where two particles are genuinely close. The user's direction (2026-10-25): the Demiurgo is
// the one who's caged — he bounces inside his own rotating form (form.ts: a Platonic solid that transforms over
// the piece; it began as a cube, which is what "cube" means below). Sofía has no form of her own: she's free,
// orbiting his at a breathing radius, always drawn to it, never fully escaping outside the Shepard. A small,
// growing fraction of her particles are "captured" (bouncing inside his form like his own) even before the
// Shepard — see stepSofia below for the full mechanism. This follows three.js's own "buffergeometry
// drawrange" example (https://threejs.org/examples/#webgl_buffergeometry_drawrange),
// re-read from its real source (raw.githubusercontent.com/mrdoob/three.js/master/examples/webgl_buffergeometry_drawrange.html)
// rather than from memory, after the user caught a drift from it twice:
//   - `const r = 800` — the cube's edge length; a `THREE.BoxHelper` around a `BoxGeometry(r, r, r)` mesh, added to
//     the same `group` as the points and the connecting lines, color 0x474747.
//   - `group.rotation.y = time * 0.1` (in render(), using Date.now()-based absolute time, not accumulated per
//     frame) — the whole group (box, points, lines) spins together around Y. Ported here exactly, including that
//     it's a pure function of absolute time, not an accumulator — which is also what Remotion needs (frames can
//     render out of order or on separate worker threads; see visuals-compose).
//   - A line/color buffer sized for the worst case, reserved once, and `setDrawRange` telling the GPU how much of
//     it to actually draw this frame. Nothing about which particles connect is scripted.
//   - The demo's own `limitConnections`/`maxConnections` control (visible in its UI) caps how many lines a single
//     particle can take part in — adopted here too, not invented, because without it the connections flood into
//     an unreadable white mass exactly where the piece needs the integration to read as a growing web, not a blob.
//
// One necessary departure, stated plainly: the stock example's particle motion is velocity-integrated (stateful,
// carried frame to frame), which Remotion cannot allow. Positions here are the closed-form equivalent of true
// billiard motion — a triangle wave reflects each particle's straight-line travel off the cube's walls, giving the
// same constant-velocity bounce-in-a-box the source has, evaluable at any t with no memory of prior frames.
//
// The user's direction (2026-10-25): the Shepard is not a separate device — it IS the moment the two clouds
// integrate. So the connecting lines, and any particle caught in one, are tinted a third color distinct from
// both clouds' own — the intersection becomes its own thing, not just a gradient between the two.

import * as THREE from "three";
import { MAPPED, mapIntoForm, type FormState } from "./form";
import { addBoostAttribute } from "./pointShader";
import { smoothstep } from "./timeline";

export type CloudColor = [number, number, number];

export type CloudSpec = {
  n: number;
  color: CloudColor; // base color, 0..1
  centerSeed: number; // distinguishes this cloud's center-drift pattern
  orbitSeed: number; // distinguishes this cloud's per-particle bounce parameters
  cubeSize: number; // edge length of this cloud's own bounding cube (the source's `r`)
};

export type Cloud = {
  spec: CloudSpec;
  positions: Float32Array; // scratch buffer, rewritten every frame — not carried between frames
  // per-particle [vx, vy, vz, startX, startY, startZ] for the triangle-wave bounce — velocity (units/s) and an
  // "unfolded" starting offset (so particles begin already spread through the cube, not all from one corner).
  phase: Float32Array;
  // per-particle base color (n*3), a fixed small tonal variation around spec.color — "varios tonos... para dar
  // movimiento" (the user's direction, 2026-10-25): a cloud of one flat color reads as static; real variation
  // within the family reads as alive, without losing which character is which.
  baseColors: Float32Array;
  // per-particle music boost (the `aBoost` attribute of pointShader.ts) — rewritten every frame from the notes
  // (music.ts): 0 = at rest, ~1 = fully lit by a note.
  boost: Float32Array;
  // per-particle 0..1, how far this particle has turned gold for good (the integration's lasting gold) — rewritten
  // every frame by stepCloud/stepSofia; connectWithinCloud colors each line end by it.
  gold: Float32Array;
  geometry: THREE.BufferGeometry;
};

// Shepard bands: the gold of the integration rising inside the cube, one band per sounding Shepard voice, at the
// height of that voice's real pitch (see gnosis.tsx). Pairs of [height -1..1 in the cube's own frame, intensity].
export type Bands = { data: Float32Array; count: number; color: CloudColor };
const BAND_WIDTH = 0.16; // in the cube's normalized height — soft, wide, never a hard stripe

function bandGlow(bands: Bands | undefined, yNorm: number): number {
  if (!bands) return 0;
  let g = 0;
  for (let b = 0; b < bands.count; b++) {
    const dy = yNorm - bands.data[b * 2];
    g += bands.data[b * 2 + 1] * Math.exp(-(dy * dy) / (BAND_WIDTH * BAND_WIDTH));
  }
  return Math.min(1, g);
}

// The integration's lasting gold, per particle: each one turns within its own short window, at its own moment
// (threshold 0.05-0.95 across the whole rise), so the gold spreads point by point. Turning the whole cloud at once
// passed every point through the halfway mix — blue and gold average to a pale grey, which read as white (seen at
// 9:20, 2026-10-25); one point at a time, only a few are ever mid-way.
const GOLD_WINDOW = 0.05;

// Every move of a color toward gold goes through this: the particle's own color dims while the gold rises, instead
// of a straight mix — blue and gold mixed halfway give a pale grey, violet and gold a pale lilac, and boosted by the
// music those read as white (seen 2026-10-25). Here the halfway point is a dim warm color, never a pale one.
const fromColor = (m: number) => 1 - smoothstep(0, 0.7, m);
const toGold = (m: number) => smoothstep(0.3, 1, m);
const OWN = new Float32Array(3); // scratch for a particle's own color before the move toward gold
function writeTowardGold(out: Float32Array, o: number, base: ArrayLike<number>, b: number, gold: CloudColor, m: number) {
  const f = fromColor(m), g = toGold(m);
  out[o] = base[b] * f + gold[0] * g;
  out[o + 1] = base[b + 1] * f + gold[1] * g;
  out[o + 2] = base[b + 2] * f + gold[2] * g;
}
const turnedGold = (integrated: number, threshold: number) =>
  integrated <= 0 ? 0 : smoothstep(threshold - GOLD_WINDOW, threshold + GOLD_WINDOW, integrated);

const mulberry32 = (seed: number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// True billiard reflection, in closed form: unfolds the particle's straight-line travel `x` (= v*t + start) back
// onto the segment [-halfExtent, halfExtent] by a triangle wave — constant speed throughout, exact bounces at the
// walls, and (unlike sin()) no easing/slowdown near the edges. Pure function of x — safe to call for any frame.
function triangleBounce(x: number, halfExtent: number): number {
  const period = 4 * halfExtent;
  let m = (x + halfExtent) % period;
  if (m < 0) m += period;
  return m <= 2 * halfExtent ? m - halfExtent : (4 * halfExtent - m) - halfExtent;
}

export function makeCloud(spec: CloudSpec): Cloud {
  const rnd = mulberry32(spec.orbitSeed);
  const positions = new Float32Array(spec.n * 3);
  const phase = new Float32Array(spec.n * 6);
  const half = spec.cubeSize / 2;
  for (let i = 0; i < spec.n; i++) {
    // Slow, slightly mismatched per-axis speeds (a full wall-to-wall crossing every ~30-70s) — meditative drift,
    // slowed further after the user's note that gnosis's motion overall read as too busy (2026-10-25); not the
    // source demo's faster per-frame deltas (those were tuned for a generic interactive page, not a 12-minute
    // ambient piece). A random sign on velocity and a random "unfolded" start spread particles through the whole
    // cube from frame 0, instead of all starting bunched at one phase.
    const speed = (axisHalf: number) => (spec.cubeSize / (30 + rnd() * 40)) * (rnd() < 0.5 ? -1 : 1);
    phase.set(
      [
        speed(half), speed(half), speed(half),
        rnd() * 4 * half, rnd() * 4 * half, rnd() * 4 * half,
      ],
      i * 6,
    );
  }
  const baseColors = new Float32Array(spec.n * 3);
  for (let i = 0; i < spec.n; i++) {
    // +-12% per channel, clamped — enough to read as tonal variety, never enough to drift into a different hue.
    for (let c = 0; c < 3; c++) {
      const v = spec.color[c] * (0.88 + rnd() * 0.24);
      baseColors[i * 3 + c] = Math.min(1, Math.max(0, v));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  const colors = new Float32Array(spec.n * 3);
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
  const boost = addBoostAttribute(geometry, spec.n);
  return { spec, positions, phase, baseColors, boost, gold: new Float32Array(spec.n), geometry };
}

// Center of a cloud's cube, in world space — a slow independent drift, also closed-form in t.
export function cloudCenter(cloud: Cloud, t: number, baseY: number): THREE.Vector3 {
  const s = cloud.spec.centerSeed;
  return new THREE.Vector3(
    Math.sin(t * 0.011 + s) * 70 + Math.sin(t * 0.004 + s * 2.3) * 40,
    baseY + Math.sin(t * 0.007 + s * 1.7) * 18,
    Math.cos(t * 0.009 + s) * 70 + Math.cos(t * 0.004 + s * 2.3) * 40,
  );
}

// The cube turns the same way on both axes: a continuous spin around Y (left-right) and another around X
// (vertical), each a pure function of absolute time (safe for out-of-order/parallel rendering), shared so the
// points, the lines and the cube wireframe all agree on the same angle at a given t. The user's direction,
// 2026-10-25, repeated several times: "la rotación izquierda-derecha del cubo también debería ser vertical...
// hazlo todo muy sutil". An earlier version only nodded around X (a 0.3 rad sine whose period, ~966 s, was
// longer than the whole piece), which never read as vertical rotation at all. Both spins are slow — about two
// minutes per turn left-right and three per turn vertically (was ~1 min per turn, Y only) — and at different
// rates, so the tumble never lines up into a repeating mechanical loop.
export const cubeRotationY = (t: number) => t * 0.05;
export const cubeTiltX = (t: number) => t * 0.035;

// Writes this cloud's particle positions (bounced inside the Demiurgo's form — form.ts — then rotated and
// translated into world space) and the base color (its own color, blended toward the integration tint where
// `integrationMask[i]` says this particle is caught in a connection). Pure function of t and the integration mask.
//
// The form is passed in, not recomputed here: it must be exactly the form drawn on screen (gnosis.tsx), or
// particles bounce inside a different shape than the one you see — "todo lo violeta... si toca las aristas debe
// rebotar y mantenerse" (the user's direction, 2026-10-25).
export function stepCloud(
  cloud: Cloud,
  t: number,
  center: THREE.Vector3,
  form: FormState,
  integrationMask: Float32Array, // per-particle 0..1, how much this particle is caught in a connection
  tintColor: CloudColor,
  danceAmplitude = 0, // small, fast, per-particle wobble on top of the bounce — "points that don't connect but
  // are still there dancing" (the user's direction, 2026-10-25). Kept small for the Demiurgo (dense, heavy,
  // still) — Sofía's own free motion (stepSofia) uses a larger one (airy, more movement).
  bands?: Bands, // the Shepard's gold rising through the cube (see Bands above)
  boostBase = 0, // a whole-cloud music boost (the bass, for the Demiurgo), added to every particle
  motionT = t, // the clock the particles move on (timeline.ts motionTime) — the cube's rotation stays on t
  integrated = 0, // 0..1 how far the integration's lasting gold has spread (timeline.ts integratedGold)
) {
  const { n } = cloud.spec;
  const half = form.half;
  const angleY = cubeRotationY(t);
  const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
  const angleX = cubeTiltX(t);
  const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
  const pos = cloud.positions;
  const colorAttr = cloud.geometry.attributes.color as THREE.BufferAttribute;
  for (let i = 0; i < n; i++) {
    const base = i * 6;
    const vx = cloud.phase[base], vy = cloud.phase[base + 1], vz = cloud.phase[base + 2];
    const sx = cloud.phase[base + 3], sy = cloud.phase[base + 4], sz = cloud.phase[base + 5];
    const lx = triangleBounce(vx * motionT + sx, half);
    const ly = triangleBounce(vy * motionT + sy, half);
    const lz = triangleBounce(vz * motionT + sz, half);
    mapIntoForm(form, lx, ly, lz);
    // Rotate the local position around the form's own Y axis first (the source's `group.rotation.y`), then around
    // X (same composition order as three.js's default 'XYZ' Euler, so the form's own `rotation.set(angleX, angleY,
    // 0)` in gnosis.tsx agrees exactly with this) — rigid-body motion, same rotation for the form and its contents.
    const yx = MAPPED.x * cosY + MAPPED.z * sinY;
    const yz = -MAPPED.x * sinY + MAPPED.z * cosY;
    const rx = yx;
    const ry = MAPPED.y * cosX - yz * sinX;
    const rz = MAPPED.y * sinX + yz * cosX;
    let px = center.x + rx, py = center.y + ry, pz = center.z + rz;
    if (danceAmplitude > 0) {
      px += Math.sin(motionT * 0.7 + sx) * danceAmplitude;
      py += Math.sin(motionT * 0.83 + sy) * danceAmplitude;
      pz += Math.sin(motionT * 0.6 + sz) * danceAmplitude;
    }
    pos[i * 3] = px;
    pos[i * 3 + 1] = py;
    pos[i * 3 + 2] = pz;

    // Base color, then the Shepard's gold where a band passes this particle's height in the cube, the
    // connection-driven gold, and the integration's lasting gold — whichever is strongest.
    const glow = bandGlow(bands, half > 0 ? ly / half : 0);
    cloud.gold[i] = turnedGold(integrated, 0.05 + 0.9 * ((i * 0.6180339887) % 1));
    const m = Math.max(integrationMask[i], glow, cloud.gold[i]);
    const tc = bands && glow > integrationMask[i] ? bands.color : tintColor;
    writeTowardGold(colorAttr.array as Float32Array, i * 3, cloud.baseColors, i * 3, tc, m);
    cloud.boost[i] = boostBase + glow * 0.9;
  }
  (cloud.geometry.attributes.aBoost as THREE.BufferAttribute).needsUpdate = true;
  (cloud.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  colorAttr.needsUpdate = true;
}

// ---- Sofía: free, orbiting the Demiurgo's cube — never her own cube ----------------------------------------
// The user's direction (2026-10-25): she is not contained, but always drawn to his cube, orbiting it at a
// breathing radius (sometimes closer, sometimes trying to pull away, never fully escaping outside the Shepard).
// A small, fixed fraction of her particles are already "inside" his cube from the start, and that fraction
// grows slowly across the piece (see timeline.ts's capturedFraction), peaking near the Shepard flight (almost
// breaking the cube, the attraction at its strongest) with a partial release afterward — never total. Each
// particle's own capture is decided by a fixed personal threshold against that global fraction, blended
// smoothly (no pop) between her free orbit and bouncing inside his cube exactly like his own particles do.
export type Wander = Float32Array; // n*7: freqX, freqY, freqZ, phaseX, phaseY, phaseZ, radiusMul (per-particle)

export function makeWander(n: number, seed: number): Wander {
  const rnd = mulberry32(seed);
  const w = new Float32Array(n * 7);
  for (let i = 0; i < n; i++) {
    w.set(
      [
        0.025 + rnd() * 0.055, 0.025 + rnd() * 0.055, 0.025 + rnd() * 0.055, // faster, more mismatched than the
        // Demiurgo's bounce speeds — "más etérea, más movimiento" (the user's direction) — but slowed from
        // 0.035-0.12, like every small motion in this file (the dance, the solids' wobble, the crack, all about a
        // third of their earlier speed): "en todo movimientos sutiles, muchos pero sutiles... nunca frenéticos,
        // incluso en la integración" (the user's direction, 2026-10-25)
        rnd() * Math.PI * 2, rnd() * Math.PI * 2, rnd() * Math.PI * 2,
        0.45 + rnd() * 0.7,
      ],
      i * 7,
    );
  }
  return w;
}

export function makeCaptureThresholds(n: number, seed: number): Float32Array {
  const rnd = mulberry32(seed);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = rnd();
  return out;
}

export function stepSofia(
  cloud: Cloud, // her own geometry/color; `cloud.phase` doubles as her captured-mode bounce velocities (see
  // gnosis.tsx — she's built with makeCloud using the Demiurgo's own cube size, so those velocities are already
  // scaled right for bouncing inside HIS cube, even though she never gets her own wireframe)
  wander: Wander,
  thresholds: Float32Array,
  t: number, // the particles' own clock (timeline.ts motionTime) — her rotation inside his cube comes in as angles
  orbitCenter: THREE.Vector3, // the Demiurgo's current form center
  orbitRadius: number, // her breathing distance from it
  form: FormState,
  demiurgeAngleY: number,
  demiurgeAngleX: number,
  capturedFractionNow: number,
  presence: number,
  integrationMask: Float32Array,
  tintColor: CloudColor,
  danceAmplitude: number,
  coreColor: CloudColor, // the user's direction, 2026-10-25: a seed of the integration (gold) already lives in
  // Sofía from the very first second — not something that only appears once she connects to the Demiurgo. Stays
  // gold always (never the Shepard's white veer — that's `tintColor`, connection-driven only); the particles
  // closest to her own orbit center (smallest wander radius) are the ones carrying it, and they orbit a little
  // tighter too, so the core reads as a real denser cluster, not just a color.
  capturedColor: CloudColor, // the Demiurgo's own color (violet). The user's direction, 2026-10-25: "todo lo que
  // esta alli adentro, excepto algunas partes de sofia, tiene que ser violeta" — once a particle is actually
  // captured (not just nearby — `blend`, the same value that moves it inside his cube), it reads as his now, not
  // hers; the gold core and any live connection tint still show through on top, so "some parts" stay recognizable.
  music?: {
    pulse: number; // her own voice right now (music.ts layerPulse "sophia"), 0..1
    pulseHeight: number; // that note's pitch in her range, 0..1 — the glow sits at that height in her cloud
    tintPulse: number; // the tintinnabuli voice — her gold core glimmers with it
    sparks: Float32Array; // per-particle arpeggio sparks (gnosis.tsx), 0..1
    bands?: Bands; // the Shepard's gold, for whichever of her particles are inside his cube
  },
  integrated = 0, // 0..1 how far the integration's lasting gold has spread (timeline.ts integratedGold) — her
  // captured particles (lowest capture thresholds) turn first
) {
  const { n } = cloud.spec;
  const demiurgeHalf = form.half;
  const pos = cloud.positions;
  const colorAttr = cloud.geometry.attributes.color as THREE.BufferAttribute;
  const cosY = Math.cos(demiurgeAngleY), sinY = Math.sin(demiurgeAngleY);
  const cosX = Math.cos(demiurgeAngleX), sinX = Math.sin(demiurgeAngleX);
  const pulse = music?.pulse ?? 0;
  // Her whole cloud breathes out a little with each of her notes — slow, never a jolt (music.ts envelopes).
  const radius = orbitRadius * (0.5 + 0.5 * presence) * (1 + 0.05 * pulse);
  const heightTarget = (music?.pulseHeight ?? 0.5) * 2 - 1;
  for (let i = 0; i < n; i++) {
    const wb = i * 7;
    const fx = wander[wb], fy = wander[wb + 1], fz = wander[wb + 2];
    const px0 = wander[wb + 3], py0 = wander[wb + 4], pz0 = wander[wb + 5];
    const radiusMul = wander[wb + 6];
    // The core: particles with the smallest radius multiplier already orbit closest to center — exactly the
    // ones that should carry the gold seed, pulled a little tighter still.
    const coreAmt = smoothstep(0.62, 0.42, radiusMul);
    const blend = smoothstep(thresholds[i] - 0.08, thresholds[i] + 0.08, capturedFractionNow);
    // As a particle gets captured, her own free orbit shrinks toward the cube's boundary instead of staying at
    // its full radius while position is later lerped toward the (bounded) captured point — that straight lerp
    // could leave a "violet" particle floating in the empty space between the orbit and the cube for a while.
    // Shrinking the orbit radius itself means the free position is already AT the boundary by the time it
    // matters, so the hand-off into bouncing stays on/inside the cube throughout (the user's direction,
    // 2026-10-25: "todo lo violeta... si toca las aristas debe rebotar y mantenerse en el cubo").
    const rFull = radius * radiusMul * (1 - 0.35 * coreAmt);
    const r = rFull * (1 - blend) + form.radius * 0.55 * blend;
    const freeX = orbitCenter.x + Math.sin(t * fx + px0) * r;
    const freeY = orbitCenter.y + Math.sin(t * fy + py0) * r * 0.75;
    const freeZ = orbitCenter.z + Math.cos(t * fz + pz0) * r;

    const pb = i * 6;
    const vx = cloud.phase[pb], vy = cloud.phase[pb + 1], vz = cloud.phase[pb + 2];
    const sx = cloud.phase[pb + 3], sy = cloud.phase[pb + 4], sz = cloud.phase[pb + 5];
    const lx = triangleBounce(vx * t + sx, demiurgeHalf);
    const ly = triangleBounce(vy * t + sy, demiurgeHalf);
    const lz = triangleBounce(vz * t + sz, demiurgeHalf);
    mapIntoForm(form, lx, ly, lz);
    const yx = MAPPED.x * cosY + MAPPED.z * sinY;
    const yz = -MAPPED.x * sinY + MAPPED.z * cosY;
    const capX = orbitCenter.x + yx;
    const capY = orbitCenter.y + (MAPPED.y * cosX - yz * sinX);
    const capZ = orbitCenter.z + (MAPPED.y * sinX + yz * cosX);

    let px = freeX + (capX - freeX) * blend;
    let py = freeY + (capY - freeY) * blend;
    let pz = freeZ + (capZ - freeZ) * blend;
    if (danceAmplitude > 0) {
      px += Math.sin(t * 0.77 + px0 * 3.1) * danceAmplitude;
      py += Math.sin(t * 0.9 + py0 * 3.1) * danceAmplitude;
      pz += Math.sin(t * 0.63 + pz0 * 3.1) * danceAmplitude;
    }
    pos[i * 3] = px;
    pos[i * 3 + 1] = py;
    pos[i * 3 + 2] = pz;

    // Base color: her own tonal variation, pulled toward the permanent gold core where this particle carries it,
    // then (on top of that) toward the connection-driven tint (gold baseline, white only at the Shepard's peak —
    // see gnosis.tsx) where it's actually caught in a connection right now.
    // Layered, in order: her own toned cyan -> violet as she's actually captured (`blend`, not just nearby) ->
    // the permanent gold core seed on top of that -> the connection-driven tint (gold/white) strongest of all.
    // The Shepard's gold reaches her only where she's actually inside his cube (`blend`), at her height there.
    const glow = bandGlow(music?.bands, demiurgeHalf > 0 ? ly / demiurgeHalf : 0) * blend;
    cloud.gold[i] = turnedGold(integrated, 0.05 + 0.9 * thresholds[i]);
    const m = Math.max(integrationMask[i], glow, cloud.gold[i]);
    const cc0 = cloud.baseColors[i * 3] + (capturedColor[0] - cloud.baseColors[i * 3]) * blend * 0.85;
    const cc1 = cloud.baseColors[i * 3 + 1] + (capturedColor[1] - cloud.baseColors[i * 3 + 1]) * blend * 0.85;
    const cc2 = cloud.baseColors[i * 3 + 2] + (capturedColor[2] - cloud.baseColors[i * 3 + 2]) * blend * 0.85;
    OWN[0] = cc0 + (coreColor[0] - cc0) * coreAmt * 0.8;
    OWN[1] = cc1 + (coreColor[1] - cc1) * coreAmt * 0.8;
    OWN[2] = cc2 + (coreColor[2] - cc2) * coreAmt * 0.8;
    writeTowardGold(colorAttr.array as Float32Array, i * 3, OWN, 0, tintColor, m);

    // Music: her note glows at its own height in her cloud; the tint voice lights her gold core; each arpeggio
    // note lights one point (sparks); the Shepard's gold where she's inside his cube.
    if (music) {
      const relY = r > 0 ? (py - orbitCenter.y) / (r * 0.75) : 0;
      const dh = relY - heightTarget;
      const atHeight = Math.exp(-(dh * dh) / (0.45 * 0.45));
      cloud.boost[i] = pulse * 0.7 * atHeight + music.tintPulse * coreAmt * 0.9 + music.sparks[i] + glow * 0.9;
    } else {
      cloud.boost[i] = 0;
    }
  }
  (cloud.geometry.attributes.aBoost as THREE.BufferAttribute).needsUpdate = true;
  (cloud.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  colorAttr.needsUpdate = true;
}

export const MAX_CONNECTIONS_PER_PARTICLE = 14; // the source demo's own "maxConnections" control (default 20); tuned
// down a little further since gnosis additionally pulls two whole clouds together during the Shepard, which the
// source's single static cloud never has to handle.

// Connections within ONE cloud — the real mechanism (distance check + setDrawRange + the source's own connection
// cap), giving each cloud its own internal constellation independent of the other. `baseColor` is that cloud's
// own color; each line end turns toward `goldColor` as its particle takes on the integration's lasting gold.
export function connectWithinCloud(
  cloud: Cloud,
  minDistance: number,
  linePositions: Float32Array,
  lineColors: Float32Array,
  baseColor: CloudColor,
  intensity: number,
  maxPerParticle: number = MAX_CONNECTIONS_PER_PARTICLE, // Sofía gets a higher cap ("más conexiones por punto,
  // etérea" — the user's direction, 2026-10-25); the Demiurgo his own (gnosis.tsx).
  wave?: { center: THREE.Vector3; radius: number; width: number; strength: number }, // a chord change's slow wave
  // outward through the web (music.ts chordWave): lines near the wave front brighten a little as it passes
  goldColor: CloudColor = baseColor,
): number {
  const n = cloud.spec.n;
  const counts = new Uint8Array(n);
  let vertexPos = 0;
  let colorPos = 0;
  let numConnected = 0;
  const useWave = !!wave && wave.strength > 0.002;
  for (let i = 0; i < n; i++) {
    if (counts[i] >= maxPerParticle) continue;
    const ax = cloud.positions[i * 3], ay = cloud.positions[i * 3 + 1], az = cloud.positions[i * 3 + 2];
    for (let j = i + 1; j < n; j++) {
      if (counts[j] >= maxPerParticle) continue;
      const bx = cloud.positions[j * 3], by = cloud.positions[j * 3 + 1], bz = cloud.positions[j * 3 + 2];
      const dx = ax - bx, dy = ay - by, dz = az - bz;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < minDistance * minDistance) {
        const dist = Math.sqrt(distSq);
        let alpha = (1.0 - dist / minDistance) * intensity;
        if (useWave) {
          const mx = (ax + bx) / 2 - wave!.center.x, my = (ay + by) / 2 - wave!.center.y, mz = (az + bz) / 2 - wave!.center.z;
          const dw = Math.sqrt(mx * mx + my * my + mz * mz) - wave!.radius;
          alpha *= 1 + wave!.strength * Math.exp(-(dw * dw) / (wave!.width * wave!.width));
        }
        linePositions[vertexPos++] = ax; linePositions[vertexPos++] = ay; linePositions[vertexPos++] = az;
        linePositions[vertexPos++] = bx; linePositions[vertexPos++] = by; linePositions[vertexPos++] = bz;
        // Each end in its own particle's color: the cloud's own, or gold once that particle has turned (`gold`).
        for (const g of [cloud.gold[i], cloud.gold[j]]) {
          writeTowardGold(lineColors, colorPos, baseColor, 0, goldColor, g);
          lineColors[colorPos] *= alpha; lineColors[colorPos + 1] *= alpha; lineColors[colorPos + 2] *= alpha;
          colorPos += 3;
        }
        numConnected++;
        counts[i]++; counts[j]++;
        if (counts[i] >= maxPerParticle) break;
      }
    }
  }
  return numConnected;
}

// Cross-cloud connections: the real mechanism (distance check + setDrawRange + connection cap), checking only
// cross-cloud pairs (within-cloud pairs are connectWithinCloud's job). Returns the two integration masks (how
// much of cloudA/cloudB's particles ended up in at least one connection) so the caller can tint those particles.
export function connectClouds(
  cloudA: Cloud,
  cloudB: Cloud,
  minDistance: number,
  linePositions: Float32Array,
  lineColors: Float32Array,
  tintColor: CloudColor,
  intensity: number, // 0..1 — overall strength of the integration tint on the lines themselves
): { numConnected: number; maskA: Float32Array; maskB: Float32Array } {
  const maskA = new Float32Array(cloudA.spec.n);
  const maskB = new Float32Array(cloudB.spec.n);
  const countsA = new Uint8Array(cloudA.spec.n);
  const countsB = new Uint8Array(cloudB.spec.n);
  let vertexPos = 0;
  let colorPos = 0;
  let numConnected = 0;
  for (let i = 0; i < cloudA.spec.n; i++) {
    if (countsA[i] >= MAX_CONNECTIONS_PER_PARTICLE) continue;
    const ax = cloudA.positions[i * 3], ay = cloudA.positions[i * 3 + 1], az = cloudA.positions[i * 3 + 2];
    for (let j = 0; j < cloudB.spec.n; j++) {
      if (countsB[j] >= MAX_CONNECTIONS_PER_PARTICLE) continue;
      const bx = cloudB.positions[j * 3], by = cloudB.positions[j * 3 + 1], bz = cloudB.positions[j * 3 + 2];
      const dx = ax - bx, dy = ay - by, dz = az - bz;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < minDistance * minDistance) {
        const dist = Math.sqrt(distSq);
        const alpha = (1.0 - dist / minDistance) * intensity;
        linePositions[vertexPos++] = ax; linePositions[vertexPos++] = ay; linePositions[vertexPos++] = az;
        linePositions[vertexPos++] = bx; linePositions[vertexPos++] = by; linePositions[vertexPos++] = bz;
        lineColors[colorPos++] = tintColor[0] * alpha; lineColors[colorPos++] = tintColor[1] * alpha; lineColors[colorPos++] = tintColor[2] * alpha;
        lineColors[colorPos++] = tintColor[0] * alpha; lineColors[colorPos++] = tintColor[1] * alpha; lineColors[colorPos++] = tintColor[2] * alpha;
        numConnected++;
        const m = 1.0 - dist / minDistance;
        if (m > maskA[i]) maskA[i] = m;
        if (m > maskB[j]) maskB[j] = m;
        countsA[i]++; countsB[j]++;
        if (countsA[i] >= MAX_CONNECTIONS_PER_PARTICLE) break;
      }
    }
  }
  return { numConnected, maskA, maskB };
}

// The screen's own edges are the last wall — the user's direction, 2026-10-25: "que reboten en el final de la
// pantalla... sin márgenes", so no point ever drifts out of frame. Each point is taken into the camera's view,
// and its screen position folded back at the frame's edges with the same closed-form reflection the particles
// use inside the form (triangleBounce): a point that would cross an edge comes back in, mirrored — a bounce, not a
// clamp that would pile points up along the border. Identity for every point already on screen. Pure: a function
// of this frame's positions and camera only.
const VIEW = new THREE.Vector3();
export function keepOnScreen(cloud: Cloud, camera: THREE.PerspectiveCamera) {
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const tanH = tanV * camera.aspect;
  const pos = cloud.positions;
  for (let i = 0; i < cloud.spec.n; i++) {
    VIEW.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).applyMatrix4(camera.matrixWorldInverse);
    const depth = -VIEW.z;
    if (depth <= camera.near) continue;
    const sx = VIEW.x / (depth * tanH), sy = VIEW.y / (depth * tanV); // -1..1 across the frame
    if (Math.abs(sx) <= 1 && Math.abs(sy) <= 1) continue;
    VIEW.x = triangleBounce(sx, 1) * depth * tanH;
    VIEW.y = triangleBounce(sy, 1) * depth * tanV;
    VIEW.applyMatrix4(camera.matrixWorld);
    pos[i * 3] = VIEW.x; pos[i * 3 + 1] = VIEW.y; pos[i * 3 + 2] = VIEW.z;
  }
  (cloud.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
}

// Pulls every point of a cloud toward `center` by factor k (1 = untouched, 0 = all at the center) — Sofía growing
// out of the gold point at the start (k rising from 0).
export function contractToward(cloud: Cloud, center: THREE.Vector3, k: number) {
  if (k >= 1) return;
  const pos = cloud.positions;
  for (let i = 0; i < cloud.spec.n; i++) {
    pos[i * 3] = center.x + (pos[i * 3] - center.x) * k;
    pos[i * 3 + 1] = center.y + (pos[i * 3 + 1] - center.y) * k;
    pos[i * 3 + 2] = center.z + (pos[i * 3 + 2] - center.z) * k;
  }
  (cloud.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
}

// Brings a cloud inside a sphere of `radius` around `center` without bunching it up: each point's distance r goes
// toward radius * tanh(r / radius), which leaves the points already well inside almost where they are and folds the
// far ones in just under the wall — so she fills the sphere evenly. (Shrinking her whole orbit instead piled every
// point into the middle, where blue, violet and gold added up to a white knot — seen 2026-10-25.) g: 0 = untouched.
export function gatherInside(cloud: Cloud, center: THREE.Vector3, radius: number, g: number) {
  if (g <= 0) return;
  const pos = cloud.positions;
  for (let i = 0; i < cloud.spec.n; i++) {
    const dx = pos[i * 3] - center.x, dy = pos[i * 3 + 1] - center.y, dz = pos[i * 3 + 2] - center.z;
    const r = Math.hypot(dx, dy, dz);
    if (r < 1e-6) continue;
    const f = 1 + ((radius * Math.tanh(r / radius)) / r - 1) * g;
    pos[i * 3] = center.x + dx * f;
    pos[i * 3 + 1] = center.y + dy * f;
    pos[i * 3 + 2] = center.z + dz * f;
  }
  (cloud.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
}
