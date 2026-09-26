import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { arcAt, energyClock, hash01, recentOnsets, smoothAt, useAnalysis, type Analysis } from "./analysis";

// Prototype D — "Ribbons": three currents of light over the Dive's world. Each current is one REGISTER of the music
// (low, mid, high), drawn as a rope of twisting ribbons around a spine with comet trails:
//   - where it sits: the register's height, and its measured stereo position (frames.pan.<band>, amplified);
//   - how alive it is: that register's own level (bass / body / air), which also sets its brightness and thickness;
//   - how fast it flows: the energy clock (faster when the music is louder), not a fixed speed;
//   - how many ribbons are present: it thins out in quiet passages (the held question) and fills in the drama;
//   - colour: Pandora blues, greens and violets, drifting toward violet with the narrative curve;
//   - mid/high attacks flash one ribbon of the matching register.
// Every position is a pure function of the frame (the geometry is rewritten in place on each render): no useFrame.

const PER = 9;               // ribbons per current
const BUNDLES = 3;           // 0 = low register, 1 = mid, 2 = high
const N = PER * BUNDLES;
const PTS = 150;             // points per ribbon
const DUST = 420;
const TRAIL = 16;            // trail length, in spine-parameter units

const C_DEEP = new THREE.Color("#2f7bff");
const C_TEAL = new THREE.Color("#0fd9c6");
const C_GREEN = new THREE.Color("#38ff9c");
const C_VIOLET = new THREE.Color("#8c46ff");
const C_MAGENTA = new THREE.Color("#cc4dff");
const C_WHITE = new THREE.Color("#e4f7ff");

type Params = { bundle: number; radius: number; twist: number; ph: number; width: number; hue: number; rank: number };
const params: Params[] = Array.from({ length: N }, (_, j) => ({
  bundle: j % BUNDLES,
  radius: 0.25 + 1.15 * hash01(j * 1.3),
  twist: (0.45 + 0.75 * hash01(j * 2.9 + 1)) * (hash01(j * 4.1) > 0.5 ? 1 : -1),
  ph: 6.283 * hash01(j * 9.1 + 6),
  width: 0.030 + 0.040 * hash01(j * 2.3 + 9),
  hue: hash01(j * 11.9 + 10),
  rank: Math.floor(j / BUNDLES) / PER, // 0..1 within its current: which ribbons appear first
}));

const BUNDLE_SPEED = [0.42, 0.55, 0.70]; // low register flows slowest, high fastest
const BUNDLE_PHASE = [0.0, 2.1, 4.2];
const BUNDLE_Y = [-1.7, 0.0, 1.7];

// The spine of a current: a large, slow, smooth 3D curve, shifted by the register's height and stereo position.
function spine(b: number, tau: number, amp: number, panX: number, out: THREE.Vector3) {
  const f = BUNDLE_PHASE[b];
  out.set(
    (3.4 * Math.sin(0.21 * tau + f) + 1.1 * Math.sin(0.53 * tau + 2 * f)) * amp + panX,
    (1.6 * Math.sin(0.17 * tau + 1.3 * f) + 0.5 * Math.cos(0.41 * tau)) * amp + BUNDLE_Y[b],
    2.6 * Math.cos(0.19 * tau + f) * amp - 1.5,
  );
}

// Camera position as a pure function of time: slow drift plus a dolly that follows the narrative curve.
function cameraAt(t: number, out: THREE.Vector3) {
  out.set(1.4 * Math.sin(t * 0.045), 0.6 * Math.sin(t * 0.031 + 1), 8.8 - 2.4 * arcAt(t));
}

const Ribbons: React.FC<{ a: Analysis }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const { geometry, dust } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const verts = 2 * N * PTS * 2; // two layers (wide halo + core), two vertices per point
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(verts * 4), 4));
    const idx: number[] = [];
    for (let layer = 0; layer < 2; layer++) {
      for (let j = 0; j < N; j++) {
        const base = (layer * N + j) * PTS * 2;
        for (let i = 0; i < PTS - 1; i++) {
          const v = base + i * 2;
          idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
        }
      }
    }
    g.setIndex(idx);
    const d = new THREE.BufferGeometry();
    d.setAttribute("position", new THREE.BufferAttribute(new Float32Array(DUST * 3), 3));
    d.setAttribute("color", new THREE.BufferAttribute(new Float32Array(DUST * 4), 4));
    return { geometry: g, dust: d };
  }, []);

  // ---- measured drivers (pure functions of t) ----
  const f = a.frames;
  const level = smoothAt(a, f.rms, t, 0.6);
  const air = smoothAt(a, f.bands.air, t, 0.6);
  const arc = arcAt(t);
  const clock = energyClock(a, t);
  const amp = 0.72 + 0.45 * level;
  // per current: its register's level and stereo position (pan is small in this recording, so it is amplified)
  const bandLevel = [
    (smoothAt(a, f.bands.sub, t, 0.6) + smoothAt(a, f.bands.bass, t, 0.6)) / 2,
    (smoothAt(a, f.bands.lowMid, t, 0.6) + smoothAt(a, f.bands.mid, t, 0.6)) / 2,
    (smoothAt(a, f.bands.highMid, t, 0.6) + smoothAt(a, f.bands.air, t, 0.6)) / 2,
  ];
  const bandPan = [smoothAt(a, f.pan.low, t, 0.8), smoothAt(a, f.pan.mid, t, 0.8), smoothAt(a, f.pan.high, t, 0.8)].map((p) => Math.max(-1, Math.min(1, p * 3.5)) * 2.2);
  // presence: thin in the quiet passages (the held question), full in the drama
  const presence = Math.min(1, Math.max(0, (level - 0.35) / 0.55));
  const flashes = recentOnsets(a, t, 1.2, 14, ["mid", "high"]);

  const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
  const col = geometry.getAttribute("color") as THREE.BufferAttribute;
  const P = new THREE.Vector3(), Q = new THREE.Vector3(), T = new THREE.Vector3(), S = new THREE.Vector3(), V = new THREE.Vector3();
  const cam = new THREE.Vector3();
  cameraAt(t, cam);
  const up = new THREE.Vector3(0, 1, 0);
  const s0 = new THREE.Vector3(), s1 = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3();
  const c = new THREE.Color();
  const pts: THREE.Vector3[] = Array.from({ length: PTS }, () => new THREE.Vector3());

  for (let j = 0; j < N; j++) {
    const p = params[j];
    const b = p.bundle;
    const head = clock * BUNDLE_SPEED[b] * 0.9 + p.ph * 0.4;
    const r = p.radius * (0.7 + 0.6 * bandLevel[b]);
    for (let i = 0; i < PTS; i++) {
      const tau = head - (i / (PTS - 1)) * TRAIL;
      spine(b, tau, amp, bandPan[b], s0);
      spine(b, tau + 0.02, amp, bandPan[b], s1);
      T.copy(s1).sub(s0).normalize();
      n1.crossVectors(T, up).normalize();
      n2.crossVectors(T, n1);
      const ang = p.twist * tau + p.ph;
      pts[i].copy(s0).addScaledVector(n1, r * Math.cos(ang)).addScaledVector(n2, r * Math.sin(ang));
    }

    // colour: the low current leans blue/teal, the mid green/teal, the high violet/green; everything drifts to violet with the arc
    if (b === 0) c.copy(C_DEEP).lerp(C_TEAL, p.hue);
    else if (b === 1) c.copy(C_TEAL).lerp(C_GREEN, p.hue);
    else c.copy(C_GREEN).lerp(C_MAGENTA, 0.3 + 0.5 * p.hue);
    c.lerp(C_VIOLET, Math.min(1, arc * (0.4 + 0.7 * p.hue)));

    let boost = 1;
    for (const o of flashes) {
      const target = (o.band === "high" ? 2 : 1) === b;
      if (target && Math.floor(hash01(o.t * 1.7) * PER) === Math.floor(j / BUNDLES)) boost += 1.6 * o.strength * Math.exp(-(t - o.t) * 2.6);
    }
    // this ribbon exists only once presence passes its rank
    const here = Math.min(1, Math.max(0, (presence * 1.15 - p.rank * 0.75) / 0.25));
    const bright = (0.35 + 0.9 * bandLevel[b]) * boost * here;

    for (let layer = 0; layer < 2; layer++) {
      const base = (layer * N + j) * PTS * 2;
      const w0 = p.width * (layer === 0 ? 3.4 : 1) * (0.8 + 0.9 * bandLevel[b] + 0.4 * air);
      const a0 = (layer === 0 ? 0.09 : 0.36) * bright;
      for (let i = 0; i < PTS; i++) {
        const u = i / (PTS - 1);
        P.copy(pts[i]);
        Q.copy(pts[Math.min(PTS - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]);
        T.copy(Q).normalize();
        V.copy(cam).sub(P).normalize();          // face the real camera, so a ribbon never turns edge-on to it
        S.crossVectors(T, V).normalize();
        const w = w0 * Math.pow(1 - u, 0.8) * Math.min(1, u * 25 + 0.25);
        const alpha = a0 * Math.pow(1 - u, 1.5);
        const v = base + i * 2;
        pos.setXYZ(v, P.x + S.x * w, P.y + S.y * w, P.z + S.z * w);
        pos.setXYZ(v + 1, P.x - S.x * w, P.y - S.y * w, P.z - S.z * w);
        const hot = layer === 1 ? Math.pow(1 - u, 4) * 0.4 : 0; // white-hot heads
        const rr = c.r + hot * (C_WHITE.r - c.r), gg = c.g + hot * (C_WHITE.g - c.g), bb = c.b + hot * (C_WHITE.b - c.b);
        col.setXYZW(v, rr, gg, bb, alpha);
        col.setXYZW(v + 1, rr, gg, bb, alpha);
      }
    }
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;

  // dust motes: a fixed cloud, slowly rotating, glowing more in the deep and with the airy band
  const dp = dust.getAttribute("position") as THREE.BufferAttribute;
  const dc = dust.getAttribute("color") as THREE.BufferAttribute;
  for (let k = 0; k < DUST; k++) {
    const rad = 3 + 9 * hash01(k * 1.7), th = 6.283 * hash01(k * 3.1) + t * 0.012 * (1 + hash01(k * 5.3)), y = (hash01(k * 7.9) - 0.5) * 8;
    dp.setXYZ(k, rad * Math.cos(th), y + 0.15 * Math.sin(t * 0.2 + k), rad * Math.sin(th) - 4);
    const tw = 0.5 + 0.5 * Math.sin(t * (0.3 + hash01(k)) + k);
    const hueK = hash01(k * 2.2);
    dc.setXYZW(k, 0.35 + 0.4 * hueK, 0.8 - 0.3 * hueK, 1, (0.10 + 0.32 * arc) * tw * (0.5 + 0.7 * air));
  }
  dp.needsUpdate = true;
  dc.needsUpdate = true;

  return (
    <>
      <mesh geometry={geometry} frustumCulled={false}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <points geometry={dust} frustumCulled={false}>
        <pointsMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} size={0.05} sizeAttenuation />
      </points>
    </>
  );
};

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const camera = useThree((s) => s.camera);
  cameraAt(frame / fps, camera.position);
  camera.lookAt(0, 0, -1.5);
  return null;
};

/** Transparent 3D layer, drawn over the shader world (the world supplies the background and the audio). */
export const RibbonsLayer: React.FC = () => {
  const a = useAnalysis();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {a ? (
        <ThreeCanvas width={width} height={height} camera={{ fov: 50, position: [0, 0, 8.8], near: 0.1, far: 60 }}>
          <CameraRig />
          <Ribbons a={a} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
