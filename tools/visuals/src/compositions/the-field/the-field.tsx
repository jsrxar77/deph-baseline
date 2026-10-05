import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, CalculateMetadataFunction, Composition, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GRADE_SHADER, GRAIN_FRAG, GRAIN_VERT, N_BELLS, PLATE_FRAG, PLATE_VERT } from "./grains";
import { curve, FPS, recentEvents, smoothstep, spline, T, useTimeline, type Layer, type Timeline } from "./timeline";

// The Field — art direction (agreed with the user, 2026-10-05): one material (grains of quartz), one palette (nacre over
// the night's indigo), one light (moonlight that becomes dawn at the whole and returns), one continuous shot whose moves
// are all three-dimensional (crane, orbit, descent; never a sideways pan), deph's HDR look (bloom on real HDR light, ACES,
// grade) in SDR. The field vibrates (scattered grains jumping with the notes); its vibrations become frequencies (the
// grains find the nodal lines of a real Chladni figure, a new and clearly different one at each melodic note, chosen by
// that note's frequency); the frequencies organise into geometry (the same grains leave the table one by one and rise
// into the canon's rings); the geometry manifests the whole (4:16: a Flower of Life of 19 spheres drawn by those grains,
// its real shadow on the emptied table). Then they fall back and scatter. Mechanics: grains.ts.

const N_GRAINS = 724 * 724; // finer sand (smaller grains, twice as many), the user asked for smaller dust
const FOV = 30;
const NIGHT = new THREE.Color("#0B0E1A");

// ---- the figures: real Chladni figures chosen by the notes' frequencies ------------------------------------------
// Organic, not ruled (the user rejected straight-line "tic-tac-toe" grids): each figure is the plate's response to the
// note — the two modes that resonate nearest its frequency, weighted by how near each is (a driven plate between two
// resonances), with the degenerate halves of each mode mixed by c away from +-1 (c = +-1 is what draws straight lines).
// A square plate's mode (n, m) resonates at a frequency proportional to n^2 + m^2. Each melodic note picks the mode whose
// n^2 + m^2 is closest to 5 * f / 216 Hz (so A3 = 216 Hz, the piece's root, would sound the simplest figure, (1, 2)).
// Figures change at most every MIN_GAP seconds (the sand needs time to form one), alternate between the two families of
// Chladni figures (+ and -), never repeat the (n, m) of the two previous ones nor any figure of the last ten (the motif
// repeats every 16 s, and so did the figures); the arc pushes the plate into higher overtones as it builds, so the sand keeps drawing new images.
const MIN_GAP = 3.5;
const FIGURE_LAYERS: Layer[] = ["lead", "arp", "cantus", "middle", "high", "bells"];
type Figure = { t: number; n: number; m: number; n2: number; m2: number; c: number; w: number; s: number };
const CANDIDATES: [number, number][] = [];
for (let n = 2; n <= 10; n++) for (let m = n + 1; m <= 11; m++) CANDIDATES.push([n, m]); // n >= 2: (1, m) draws stripes

function figureSchedule(tl: Timeline): Figure[] {
  const notes = FIGURE_LAYERS.flatMap((l) => tl[l]).sort((a, b) => a.t - b.t);
  const out: Figure[] = [{ t: -100, n: 2, m: 3, n2: 3, m2: 4, c: -0.55, w: 0.3, s: -1 }];
  for (const e of notes) {
    if (e.t - out[out.length - 1].t < MIN_GAP) continue;
    const f = 440 * Math.pow(2, (e.note - 69) / 12);
    // The arc drives the plate into higher overtones as the piece builds (more energy, finer figures), back at the end.
    const overtone = curve([[0, 1], [64, 1.4], [176, 2.6], [240, 3.2], [304, 1.6], [369, 1]], e.t);
    const target = ((5 * f) / 216) * overtone;
    const s = -out[out.length - 1].s;
    const recent2 = out.slice(-2), recent6 = out.slice(-10);
    const dist = (c: [number, number]) => Math.abs(c[0] ** 2 + c[1] ** 2 - target);
    const sorted = [...CANDIDATES].sort((a, b) => dist(a) - dist(b));
    const pick = sorted.find(([n, m]) => !recent2.some((r) => r.n === n && r.m === m) && !recent6.some((r) => r.n === n && r.m === m && r.s === s))!;
    const second = sorted.find(([n, m]) => n !== pick[0] || m !== pick[1])!;
    const d1 = dist(pick), d2 = dist(second);
    const w = Math.min(0.45, Math.max(0.2, d1 / (d1 + d2 + 1e-6))); // the nearer resonance dominates, the other bends it
    const c = s * (0.3 + 0.45 * ((e.note * 0.618) % 1));              // degenerate mixing, never +-1
    out.push({ t: e.t, n: pick[0], m: pick[1], n2: second[0], m2: second[1], c, w, s });
  }
  return out;
}

// The canon voices' ring groups: one statement turns a group by 60 deg (the flower is six-fold), and every statement
// ends at 4:16, so all three line up exactly there. Periods in seconds per statement: cantus 21, middle 13, high 8 cycles.
const PERIODS = [42, 26, 16];
const groupAngle = (period: number, t: number) =>
  (Math.PI / 3) * (t < T.whole ? (t - T.whole) / period : t < T.wholeEnd ? 0 : (t - T.wholeEnd) / period);

// One continuous shot. Keys: time, target (x, z), distance, elevation (deg, 90 = straight down), azimuth (deg).
const SHOT: [number, number, number, number, number, number][] = [
  [0, 0.22, -0.08, 0.16, 58, 0],      // macro, low enough for depth of field: scattered grains
  [64, 0.22, -0.08, 0.24, 62, 14],
  [120, 0.08, -0.03, 1.25, 80, 30],   // crane up and back: the figures
  [176, 0, 0, 1.75, 76, 45],          // the sand filling the frame
  [236, 0, 0, 1.9, 42, 95],           // tilting down into 3D as the grains rise
  [T.whole, 0, 0, 1.7, 34, 110],      // the whole
  [300, 0, 0, 1.65, 36, 200],         // half an orbit around it
  [340, 0, 0, 1.2, 70, 230],          // rising back over the table
  [T.end, 0.1, 0.05, 0.17, 84, 250],  // down to the grains again
];
const shotAt = (t: number) => {
  const col = (i: number) => spline(SHOT.map((k) => [k[0], k[i]] as [number, number]), t); // flows through the keys
  return { tx: col(1), tz: col(2), dist: col(3), elev: col(4), az: col(5) };
};

const mulberry32 = (a: number) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function makeGrains() {
  const rnd = mulberry32(20261005);
  const pos = new Float32Array(N_GRAINS * 3);
  const seed = new Float32Array(N_GRAINS * 4);
  for (let i = 0; i < N_GRAINS; i++) {
    pos.set([(rnd() * 2 - 1) * 0.98, 0, (rnd() * 2 - 1) * 0.98], i * 3); // homes spread over the square table
    seed.set([rnd(), rnd(), rnd(), rnd()], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  return g;
}

const hash01 = (x: number) => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

const Scene: React.FC<{ tl: Timeline; t: number; width: number; height: number }> = ({ tl, t, width, height }) => {
  const { gl, scene, camera } = useThree();
  const geometry = useMemo(makeGrains, []);
  const figures = useMemo(() => figureSchedule(tl), [tl]);
  const grainMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GRAIN_VERT,
        fragmentShader: GRAIN_FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 }, uModeA: { value: new THREE.Vector4() }, uModeB: { value: new THREE.Vector4() }, uCW: { value: new THREE.Vector4() }, uModeMix: { value: 0 },
          uOrder: { value: 0 }, uJump: { value: 0 }, uShimmer: { value: 0 }, uLift: { value: 0 }, uRot: { value: new THREE.Vector3() },
          uWhole: { value: 0 }, uFall: { value: 0 }, uScatter: { value: 0 }, uFlowerH: { value: 0.32 },
          uBells: { value: Array.from({ length: N_BELLS }, () => new THREE.Vector4()) },
          uPixelScale: { value: 1 }, uFocusDist: { value: 1 }, uAperture: { value: 0 }, uGrain: { value: 0.0005 },
          uLightDir: { value: new THREE.Vector3() }, uLightColor: { value: new THREE.Color() }, uWarm: { value: 0 }, uFade: { value: 1 },
        },
      }),
    [],
  );
  const plateMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PLATE_VERT,
        fragmentShader: PLATE_FRAG,
        uniforms: {
          uLightColor: { value: new THREE.Color() }, uLightWorld: { value: new THREE.Vector3() },
        },
      }),
    [],
  );

  // deph's HDR look: the scene in half-float, a bloom of what is brighter than 1, then HdrCanvas's grade to SDR.
  const post = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType });
    const composer = new EffectComposer(gl, target);
    composer.setPixelRatio(1);
    composer.setSize(width, height);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.5, 1.0));
    const grade = new ShaderPass(GRADE_SHADER);
    composer.addPass(grade);
    return { composer, grade };
  }, [gl, scene, camera, width, height]);
  useFrame(() => post.composer.render(), 1); // priority 1: this replaces the default render

  // Everything per frame is set here, in a layout effect: it runs before ThreeCanvas renders the frame.
  useLayoutEffect(() => {
    const u = grainMat.uniforms;
    const p = plateMat.uniforms;
    // Camera: one continuous shot.
    const s = shotAt(t);
    const el = THREE.MathUtils.degToRad(s.elev), az = THREE.MathUtils.degToRad(s.az);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = FOV; cam.near = 0.005; cam.far = 30; cam.aspect = width / height;
    // The camera turns around the Flower of Life itself while it floats (it sat high in the frame when the camera aimed at
    // the table under it).
    const ty = curve([[T.geometry, 0], [T.inhale, 0.24], [T.wholeEnd, 0.28], [330, 0], [T.end, 0]], t);
    cam.position.set(s.tx + s.dist * Math.cos(el) * Math.sin(az), ty + s.dist * Math.sin(el), s.tz + s.dist * Math.cos(el) * Math.cos(az));
    cam.lookAt(s.tx, ty, s.tz);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    u.uPixelScale.value = height / (2 * Math.tan(THREE.MathUtils.degToRad(FOV) / 2));
    u.uFocusDist.value = s.dist;
    u.uAperture.value = curve([[0, 0.14], [64, 0.12], [120, 0.02], [176, 0.006], [T.whole, 0.006], [340, 0.02], [T.end, 0.14]], t);

    // One light: low moonlight that rises and warms into dawn at the whole, then returns. Intensity above 1: real HDR.
    const up = curve([[0, 0.2], [176, 0.35], [T.whole, 0.75], [T.wholeEnd, 0.7], [T.end, 0.2]], t);
    const warm = curve([[0, 0], [176, 0.3], [T.whole, 1], [T.rest, 0.5], [T.end, 0]], t);
    const lightWorld = new THREE.Vector3(-0.75 * Math.sqrt(1 - up * up), up, 0.45 * Math.sqrt(1 - up * up)).normalize();
    u.uLightDir.value.copy(lightWorld).transformDirection(cam.matrixWorldInverse);
    const moon = new THREE.Color(0.72, 0.8, 1.0), dawn = new THREE.Color(1.0, 0.86, 0.76);
    u.uLightColor.value.copy(moon).lerp(dawn, warm).multiplyScalar(1.5 - 0.5 * up); // a high light reaches every grain: less of it
    u.uWarm.value = warm;
    p.uLightColor.value.copy(u.uLightColor.value);
    p.uLightWorld.value.copy(lightWorld);

    // The figure: the last one set by a note (see figureSchedule), sliding from the one before.
    let k = 0;
    while (k + 1 < figures.length && figures[k + 1].t <= t) k++;
    const cur = figures[k], prev = figures[Math.max(0, k - 1)];
    u.uModeA.value.set(prev.n, prev.m, prev.n2, prev.m2);
    u.uModeB.value.set(cur.n, cur.m, cur.n2, cur.m2);
    u.uCW.value.set(prev.c, prev.w, cur.c, cur.w);
    u.uModeMix.value = k === 0 ? 1 : smoothstep(0, 3.0, t - cur.t); // nothing abrupt: a 3 s glide between figures
    u.uTime.value = t;
    u.uOrder.value = curve([[0, 0], [24, 0], [T.frequency, 1], [350, 1], [T.end, 0]], t);
    u.uScatter.value = curve([[350, 0], [T.end, 1]], t);

    // The music moves the grains.
    let jump = 0;
    // A note lifts the dust softly (0.15 s rise, slow settle), not a hit.
    for (const e of recentEvents(tl, "lead", t, 3)) jump += e.level * Math.exp(-e.age / 0.8) * smoothstep(0, 0.15, e.age) * 0.7;
    u.uJump.value = Math.min(1.2, jump) * curve([[0, 1], [T.frequency, 0.6]], t);
    let shimmer = 0;
    for (const e of recentEvents(tl, "arp", t, 1)) shimmer += e.level * Math.exp(-e.age / 0.25);
    u.uShimmer.value = Math.min(1, shimmer);
    const lift = curve([[T.geometry, 0], [T.inhale, 1]], t);
    const fall = curve([[300, 0], [330, 1]], t);
    u.uLift.value = lift;
    const rot = new THREE.Vector3(groupAngle(PERIODS[0], t), groupAngle(PERIODS[1], t), groupAngle(PERIODS[2], t));
    u.uRot.value.copy(rot);
    const whole = curve([[T.whole - 0.5, 0], [T.whole + 2.5, 1]], t);
    u.uWhole.value = whole;
    u.uFall.value = fall;
    u.uFade.value = curve([[0, 0], [2, 1], [T.end - 3, 1], [T.end + 5, 0]], t);
    const bells = recentEvents(tl, "bells", t, 3).slice(0, N_BELLS);
    u.uBells.value.forEach((v: THREE.Vector4, i: number) => {
      const e = bells[i];
      if (!e) return v.set(0, 0, 0, 0);
      const at = t - e.age;
      v.set(0.15 + hash01(at * 1.7 + e.note) * 0.6, (hash01(at * 6.1) - 0.5) * 1.2, e.age, 0.4 + 0.6 * e.level);
    });
    post.grade.uniforms.uTime.value = t;
  });

  return (
    <>
      {/* The stone goes on well past the frame: the sand lives on the 2x2 vibrating square at its centre. (A 2x2 slab
          showed its corners as black triangles whenever the camera turned 45 degrees around it.) */}
      <mesh position={[0, -0.02, 0]} material={plateMat}>
        <boxGeometry args={[14, 0.04, 14]} />
      </mesh>
      <points geometry={geometry} material={grainMat} frustumCulled={false} />
    </>
  );
};

export const TheField: React.FC = () => {
  const tl = useTimeline();
  const t = useCurrentFrame() / FPS;
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0E1A" }}>
      <Audio src={staticFile("the-field-youtube.wav")} />
      <ThreeCanvas
        width={width}
        height={height}
        gl={{ antialias: false, preserveDrawingBuffer: true }}
        camera={{ fov: FOV, near: 0.005, far: 30, position: [0, 1, 0] }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.NoToneMapping; // the grade does the tone mapping
          gl.outputColorSpace = THREE.LinearSRGBColorSpace;
          gl.setPixelRatio(1);
          scene.background = NIGHT;
        }}
      >
        {tl ? <Scene tl={tl} t={t} width={width} height={height} /> : null}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// Duration from the raw render (the analysis copy), which has the same length as the played master.
const calculateMetadata: CalculateMetadataFunction<Record<string, unknown>> = async () => {
  const seconds = await getAudioDurationInSeconds(staticFile("the-field-audio.wav"));
  return { durationInFrames: Math.ceil(seconds * FPS) };
};

export const TheFieldCompositions: React.FC = () => (
  <Composition id="the-field" component={TheField} durationInFrames={375 * FPS} fps={FPS} width={3840} height={2160} calculateMetadata={calculateMetadata} />
);
