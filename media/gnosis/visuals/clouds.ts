// Two particle clouds — Sofía (light, high register) and the Demiurgo (matter, low register) — each bouncing
// inside its own wireframe cube, connected by lines that appear only where two particles are genuinely close.
// This follows three.js's own "buffergeometry drawrange" example (https://threejs.org/examples/#webgl_buffergeometry_drawrange),
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
  geometry: THREE.BufferGeometry;
  cubeEdges: THREE.BufferGeometry; // static wireframe box geometry, local space, reused every frame
};

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
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  const colors = new Float32Array(spec.n * 3);
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
  const cubeEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(spec.cubeSize, spec.cubeSize, spec.cubeSize));
  return { spec, positions, phase, geometry, cubeEdges };
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

// The source's own `group.rotation.y = time * 0.1` — a pure function of absolute time, not an accumulator, so
// it's already safe for out-of-order/parallel rendering. Shared so the points, the lines and the cube wireframe
// all agree on the same angle for a given cloud at a given t (as `group` makes them agree in the source).
export const cubeRotationY = (t: number) => t * 0.1;

// A second, much slower and smaller tilt around X, on top of the source's own Y spin — so the cube's rotation
// reads as a real tumble in three dimensions, not just a flat turntable (the user's direction, 2026-10-25: "no
// es solo derecha-izquierda, tiene que ser vertical también... pero todo debe ser muy sutil"). A slow sine, not
// a second spin: it never completes a full cycle within the piece, so it reads as a gentle, continuous nod
// rather than a second mechanical rotation layered on the first.
export const cubeTiltX = (t: number) => 0.065 * Math.sin(t * 0.0032);

// Writes this cloud's particle positions (bounced inside its own cube, then rotated and translated into world
// space) and the base color (its own color, blended toward the integration tint where `integrationMask[i]` says
// this particle is caught in a connection). Pure function of t and the already-computed integration mask.
export function stepCloud(
  cloud: Cloud,
  t: number,
  center: THREE.Vector3,
  presence: number, // 0..1 — how "there" this voice is right now (from timeline.ts's presence envelopes)
  integrationMask: Float32Array, // per-particle 0..1, how much this particle is caught in a connection
  tintColor: CloudColor,
) {
  const { n, color, cubeSize } = cloud.spec;
  const half = (cubeSize / 2) * (0.35 + 0.65 * presence); // the cube itself breathes with presence, not a radius hack
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
    const lx = triangleBounce(vx * t + sx, half);
    const ly = triangleBounce(vy * t + sy, half);
    const lz = triangleBounce(vz * t + sz, half);
    // Rotate the local bounce position around the cube's own Y axis first (the source's `group.rotation.y`),
    // then the slow X tilt on top (same composition order as three.js's default 'XYZ' Euler, so the cube mesh's
    // own `rotation.set(angleX, angleY, 0)` in gnosis.tsx agrees exactly with this) — rigid-body motion, same
    // rotation for the box and its contents.
    const yx = lx * cosY + lz * sinY;
    const yz = -lx * sinY + lz * cosY;
    const rx = yx;
    const ry = ly * cosX - yz * sinX;
    const rz = ly * sinX + yz * cosX;
    pos[i * 3] = center.x + rx;
    pos[i * 3 + 1] = center.y + ry;
    pos[i * 3 + 2] = center.z + rz;

    const m = integrationMask[i];
    colorAttr.array[i * 3] = color[0] + (tintColor[0] - color[0]) * m;
    colorAttr.array[i * 3 + 1] = color[1] + (tintColor[1] - color[1]) * m;
    colorAttr.array[i * 3 + 2] = color[2] + (tintColor[2] - color[2]) * m;
  }
  (cloud.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  colorAttr.needsUpdate = true;
}

export const MAX_CONNECTIONS_PER_PARTICLE = 14; // the source demo's own "maxConnections" control (default 20); tuned
// down a little further since gnosis additionally pulls two whole clouds together during the Shepard, which the
// source's single static cloud never has to handle.

// Connections within ONE cloud — the real mechanism (distance check + setDrawRange + the source's own connection
// cap), giving each cloud its own internal constellation independent of the other. `baseColor` is that cloud's
// own color (no integration tint here — tinting is cross-cloud-only, see connectClouds).
export function connectWithinCloud(
  cloud: Cloud,
  minDistance: number,
  linePositions: Float32Array,
  lineColors: Float32Array,
  baseColor: CloudColor,
  intensity: number,
): number {
  const n = cloud.spec.n;
  const counts = new Uint8Array(n);
  let vertexPos = 0;
  let colorPos = 0;
  let numConnected = 0;
  for (let i = 0; i < n; i++) {
    if (counts[i] >= MAX_CONNECTIONS_PER_PARTICLE) continue;
    const ax = cloud.positions[i * 3], ay = cloud.positions[i * 3 + 1], az = cloud.positions[i * 3 + 2];
    for (let j = i + 1; j < n; j++) {
      if (counts[j] >= MAX_CONNECTIONS_PER_PARTICLE) continue;
      const bx = cloud.positions[j * 3], by = cloud.positions[j * 3 + 1], bz = cloud.positions[j * 3 + 2];
      const dx = ax - bx, dy = ay - by, dz = az - bz;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < minDistance * minDistance) {
        const dist = Math.sqrt(distSq);
        const alpha = (1.0 - dist / minDistance) * intensity;
        linePositions[vertexPos++] = ax; linePositions[vertexPos++] = ay; linePositions[vertexPos++] = az;
        linePositions[vertexPos++] = bx; linePositions[vertexPos++] = by; linePositions[vertexPos++] = bz;
        lineColors[colorPos++] = baseColor[0] * alpha; lineColors[colorPos++] = baseColor[1] * alpha; lineColors[colorPos++] = baseColor[2] * alpha;
        lineColors[colorPos++] = baseColor[0] * alpha; lineColors[colorPos++] = baseColor[1] * alpha; lineColors[colorPos++] = baseColor[2] * alpha;
        numConnected++;
        counts[i]++; counts[j]++;
        if (counts[i] >= MAX_CONNECTIONS_PER_PARTICLE) break;
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
