// Gnosis — an image to meditate with: always organic, never abrupt, everything arriving little by little.
//
// The Demiurgo (matter, violet) is caged: he bounces inside his own rotating form, dense — and the form itself
// transforms through the five Platonic solids as the piece goes on (tetrahedron, hexahedron, octahedron,
// dodecahedron, icosahedron; form.ts), its edges moving from violet toward gold. Sofía (light, blue) has no form:
// she's free, always orbiting his, a gold seed of the integration already in her core from the first second, and
// a small, slowly growing part of her pulled inside. The Shepard IS their integration: gold rising inside the
// icosahedron, which almost breaks. Then a slow zoom out on the icosahedron with Sofía, the Demiurgo and the
// integration inside it — the icosahedron rounding into a sphere that shrinks into one gold point: the same gold
// point the piece opens on, out of which Sofía grows. Always centered, nothing ever leaves the screen. (The
// user's direction, 2026-10-25.)
//
// Synchronized note by note with the music (music.ts, from frames.json): Sofía's notes make her cloud breathe at
// the height of each note; the Demiurgo's notes make his form pulse, and it transforms during his own turns; the tint voice lights her gold core; every
// arpeggio note lights one point; the bass weighs on his density; each chord change sends a wave through the web;
// the Shepard's real notes are the gold rising through the form. Mechanism (cloud motion, connections): clouds.ts.
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, CalculateMetadataFunction, Composition, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// Clips the scene at 1.0 per channel before the bloom. The scene renders into a half-float target, where hundreds
// of overlapping additive lines no longer clip at 1 the way they did on screen — they summed to 10, 20+, and the
// bloom spread that into a huge blocky white mass (found on the first render, 2026-10-25). Clipping first gives
// back exactly the on-screen behavior the piece had, and leaves the bloom to act only on what's truly bright.
const ClipShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader:
    "uniform sampler2D tDiffuse; varying vec2 vUv; void main() { vec4 c = texture2D(tDiffuse, vUv); gl_FragColor = vec4(min(c.rgb, vec3(1.0)), 1.0); }",
};
import {
  cloudCenter, connectClouds, connectWithinCloud, contractToward, cubeRotationY, gatherInside, cubeTiltX, keepOnScreen, makeCaptureThresholds,
  makeCloud, makeWander, MAX_CONNECTIONS_PER_PARTICLE, stepCloud, stepSofia, type Bands, type Cloud, type Wander,
} from "./clouds";
import { makeFatLines } from "./fatLines";
import {
  FORM_SEGMENTS, makeFormFaceGeometry, makeFormFaceMaterial, makeFormVertexGeometry, updateFormVertices, writeFormEdges, writeFormFaces,
  type FormState,
} from "./form";
import { activeNotes, chordWave, layerPulse, shepardBreath, useMusic, type Music } from "./music";
import { addBoostAttribute, makePointMaterial } from "./pointShader";
import {
  activeLevel, cameraZoomOut, capturedFraction, demiurgeFirmness, demiurgeFormPresence, demiurgeFormProgress, edgeGold,
  finalShrink, FPS, goldPoint, integratedGold, motionTime, MOVEMENT, SHEPARD_WINDOWS, shepardIntensity, sofiaGather, sofiaGrowth,
  smoothstep, sophiaPresence, sphereAmount,
} from "./timeline";

const NIGHT = new THREE.Color("#000000"); // pure black (OLED), per the user's direction — not a tinted near-black
const FOV = 42;
const CAMERA_ORBIT_RATE = 0.012; // radians per second — shared by the camera and the arpeggio's spark placement

// Colors (0..1), confirmed with the user 2026-10-25. Sofía: electric blue, several tones (clouds.ts baseColors).
// Demiurgo: violet, several tones. Integration: gold, always — never white.
const SOFIA_COLOR: [number, number, number] = [0.25, 0.5, 1.0];
const DEMIURGE_COLOR: [number, number, number] = [0.42, 0.2, 0.62];
const GOLD: [number, number, number] = [1.0, 0.75, 0.15];

const N_SOFIA = 700;
const N_DEMIURGE = 600;
const DEMIURGE_CUBE = 220; // the invisible cube his particles bounce in (form.ts) — it sets their speed
// The camera orbits the form's center at this distance, and the form is sized from it: its circumradius is exactly
// what fills the frame's height there, so the form always sits centered and never leaves the screen — the user's
// direction, 2026-10-25: "que las figuras estén en el centro... que no se vayan de pantalla... sin márgenes".
const CAMERA_DISTANCE = 460;
const FORM_RADIUS = CAMERA_DISTANCE * Math.sin(THREE.MathUtils.degToRad(FOV / 2));
const MIN_DISTANCE = 46;
const SOFIA_ORBIT_RADIUS = DEMIURGE_CUBE * 0.95;
const SOFIA_SELF_CAP = 40;
// Raised from 22 with brighter lines and points (below): inside the cube the violet has to lead, not Sofía's blue
// web drawn over it — "todo lo que está adentro... tiene que ser violeta" (the user's direction, 2026-10-25).
const DEMIURGE_SELF_CAP = 28;

// Edge width in pixels of a 1080-line frame, scaled to the real 4K render size. Lowered twice on the user's
// direction, 2026-10-25: from 2.5 to 1.7 ("si son 3 entonces pon 2... mas sutil"), then to this ("mas finas todas
// las aristas").
const FORM_LINE_PX = 1.2;
// How bright the walls get when fully present — very faint, almost transparent (the user's direction,
// 2026-10-25), a fraction of the edge color.
const FACE_LEVEL = 0.02; // 0.05 read as a solid tinted box, not "casi transparente"
const SPHERE_FACE_LEVEL = 0.02; // the final membrane: as faint as the walls; its rim (form.ts) is what makes it read
const SOFIA_POINT_SIZE = 5.5;
const DEMIURGE_POINT_SIZE = 7.2;
// The perfect form at the start and the end — the same size on screen at both (kept constant at any camera
// distance), raised from 30 ("más grande, del mismo tamaño"): about the size the sphere has shrunk to when the
// point takes over, so the sphere closes into it without a jump in size.
const GOLD_POINT_SIZE = 80;

function makeLineGeometry(maxLines: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(maxLines * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(maxLines * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setDrawRange(0, 0);
  return g;
}
const additiveLines = () =>
  new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });

// Each arpeggio note lights one of Sofía's points, chosen once (deterministically) for that note: the point that,
// at the note's own onset, sits where the note "is" — its stereo pan as left/right from the camera's view at that
// moment, its pitch as height. Chosen from a small seeded sample so the choice never flickers frame to frame.
function mapArpToParticles(music: Music, wander: Wander): Int32Array {
  const arp = music.arp;
  const [lo, hi] = music.range.arp;
  const out = new Int32Array(arp.length);
  let seed = 2026102508;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  for (let e = 0; e < arp.length; e++) {
    const ev = arp[e];
    const a = ev.t * CAMERA_ORBIT_RATE;
    const rightX = Math.cos(a), rightZ = -Math.sin(a);
    const targetX = (ev.pan * 2 - 1) * 0.8;
    const targetY = hi > lo ? ((ev.note - lo) / (hi - lo)) * 2 - 1 : 0;
    let best = 0, bestScore = Infinity;
    for (let c = 0; c < 48; c++) {
      const i = Math.floor(rnd() * wander.length / 7);
      const w = i * 7;
      const rr = wander[w + 6];
      const mt = motionTime(ev.t); // her particles move on the motion clock, not on t
      const x = Math.sin(mt * wander[w] + wander[w + 3]) * rr;
      const y = Math.sin(mt * wander[w + 1] + wander[w + 4]) * rr;
      const z = Math.cos(mt * wander[w + 2] + wander[w + 5]) * rr;
      const sx = x * rightX + z * rightZ;
      const score = (sx - targetX) ** 2 + (y - targetY) ** 2;
      if (score < bestScore) { bestScore = score; best = i; }
    }
    out[e] = best;
  }
  return out;
}

const Scene: React.FC<{ t: number; width: number; height: number; music: Music }> = ({ t, width, height, music }) => {
  const { gl, scene, camera } = useThree();
  const pxScale = height / 1080;

  // Sofía is built with the Demiurgo's own cube size: `phase` doubles as her captured-mode bounce velocities.
  const sofiaCloud = useMemo<Cloud>(
    () => makeCloud({ n: N_SOFIA, color: SOFIA_COLOR, centerSeed: 11, orbitSeed: 2026102501, cubeSize: DEMIURGE_CUBE }),
    [],
  );
  const demiurgeCloud = useMemo<Cloud>(
    () => makeCloud({ n: N_DEMIURGE, color: DEMIURGE_COLOR, centerSeed: 37, orbitSeed: 2026102502, cubeSize: DEMIURGE_CUBE }),
    [],
  );
  const sofiaWander = useMemo(() => makeWander(N_SOFIA, 2026102503), []);
  const sofiaThresholds = useMemo(() => makeCaptureThresholds(N_SOFIA, 2026102504), []);
  const arpParticle = useMemo(() => mapArpToParticles(music, sofiaWander), [music, sofiaWander]);
  const sparks = useMemo(() => new Float32Array(N_SOFIA), []);
  const bandData = useMemo(() => new Float32Array(160), []);

  // The Demiurgo's form (form.ts): every solid's edges in one fat-line buffer and every solid's vertices as real
  // points, each weighted by how present that solid is right now — only the external form, nothing inside it.
  const formLines = useMemo(() => makeFatLines(FORM_SEGMENTS, [1, 1, 1]), []);
  const formVertexGeometry = useMemo(() => makeFormVertexGeometry(), []);
  const formVertexMaterial = useMemo(() => makePointMaterial(16), []);
  const formVertexRef = useRef<THREE.Points>(null);
  const formFaceGeometry = useMemo(() => makeFormFaceGeometry(), []);
  const formFaceMaterial = useMemo(() => makeFormFaceMaterial(), []);
  const formFaceRef = useRef<THREE.Mesh>(null);

  // The gold point — one soft point of light at the form's center.
  const goldPointGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(GOLD), 3));
    addBoostAttribute(g, 1);
    return g;
  }, []);
  const goldPointMaterial = useMemo(() => makePointMaterial(GOLD_POINT_SIZE), []);
  const goldPointRef = useRef<THREE.Points>(null);
  // Everything but the gold point lives in one group, scaled toward the center as the sphere closes into the point.
  const contentRef = useRef<THREE.Group>(null);

  const maxCrossLines = N_SOFIA * MAX_CONNECTIONS_PER_PARTICLE;
  const crossGeometry = useMemo(() => makeLineGeometry(maxCrossLines), [maxCrossLines]);
  const crossMaterial = useMemo(additiveLines, []);
  const sofiaSelfGeometry = useMemo(() => makeLineGeometry((N_SOFIA * SOFIA_SELF_CAP) / 2), []);
  const demiurgeSelfGeometry = useMemo(() => makeLineGeometry((N_DEMIURGE * DEMIURGE_SELF_CAP) / 2), []);
  const sofiaSelfMaterial = useMemo(additiveLines, []);
  const demiurgeSelfMaterial = useMemo(additiveLines, []);

  const sofiaMaterial = useMemo(() => makePointMaterial(SOFIA_POINT_SIZE), []);
  const demiurgeMaterial = useMemo(() => makePointMaterial(DEMIURGE_POINT_SIZE), []);

  // The glow of the gold: a real bloom pass over the scene, rendered in half-float so bright light keeps its
  // headroom until the very last step. OutputPass applies the (no) tone mapping and the sRGB encode once, at the
  // end — the same pattern the-field already uses for its HDR look.
  const post = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(gl, target);
    composer.setPixelRatio(1);
    composer.setSize(width, height);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new ShaderPass(ClipShader));
    // Threshold 0.5 on linear luminance: gold (~0.59) glows; blue (~0.24) and violet (~0.08) only where stacked.
    // Only the finest blur level, at radius 0: a glow of a few pixels hugging each line and point — "halo muy muy
    // muy pequeño" (the user, 2026-10-25). With all five levels, once the whole sphere turned gold its glow summed
    // into a wide halo that lifted the black around it (measured 50,43,14 at 400 px from its center in 4K).
    const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.35, 0, 0.5);
    bloom.compositeMaterial.uniforms.bloomFactors.value = [1, 0, 0, 0, 0];
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    return { composer, bloom };
  }, [gl, scene, camera, width, height]);
  useFrame(() => post.composer.render(), 1); // priority 1: replaces the default render

  useLayoutEffect(() => {
    const sofiaP = sophiaPresence(t);
    const shepard = shepardIntensity(t);
    const captured = capturedFraction(t);
    const sofiaActive = activeLevel("S", t);
    const demiurgeActive = activeLevel("D", t);
    const zoomOut = cameraZoomOut(t);
    const gather = sofiaGather(t);
    // The gold point at both ends: Sofía growing out of it at the start, everything closing into it at the end.
    const growth = sofiaGrowth(t);
    const shrink = finalShrink(t);
    const contentFade = 1 - smoothstep(0.75, 1, shrink); // what's left fades as it reaches the point, never a white knot
    const emerge = smoothstep(0, 0.3, growth); // her points show as they leave the point
    const spread = smoothstep(0.25, 1, growth); // her lines only once her points have spread apart, never a tangled knot

    // The Shepard as integration belongs to the flight; the quiet preludio in the Pleroma is its foreshadowing,
    // heard as Sofía's gold core glimmering (below), not as a form that doesn't exist yet.
    const inFlight = t > SHEPARD_WINDOWS.flight[0] - 20;
    const flight = inFlight ? shepard : 0;

    // ---- the music, right now ----
    const sophiaNote = layerPulse(music, "sophia", t);
    const demiurgeNote = layerPulse(music, "demiurge", t).value;
    const tintNote = layerPulse(music, "tint", t).value;
    const bassNote = layerPulse(music, "bass", t).value;
    const preludio = inFlight ? 0 : layerPulse(music, "shepard", t).value;
    const wave = chordWave(music, t);

    sparks.fill(0);
    for (const a of activeNotes(music.arp, t, 10)) {
      const p = arpParticle[a.index];
      sparks[p] = Math.max(sparks[p], a.env * 0.9);
    }

    // The Shepard's real voices as gold bands in the form, each at its own pitch's height: as the notes climb,
    // the gold climbs; voices fading at the top of the illusion fade from the top of the form.
    let bandCount = 0;
    if (inFlight) {
      const [lo, hi] = music.range.shepard;
      for (const a of activeNotes(music.shepard, t, 20)) {
        if (bandCount >= bandData.length / 2) break;
        bandData[bandCount * 2] = hi > lo ? ((a.ev.note - lo) / (hi - lo)) * 2 - 1 : 0;
        bandData[bandCount * 2 + 1] = a.env * 0.55;
        bandCount++;
      }
    }
    const bands: Bands = { data: bandData, count: bandCount, color: GOLD };

    // ---- one continuous shot, always centered on the form ----
    // A slow orbit around the form's own center (so it never drifts off-center), then the long slow pull back to
    // the icosahedron lost in the ether. The fog thins as the camera retreats, so distance shrinks the form instead
    // of erasing it. No push-in during the integration: the form has to stay whole on screen.
    const pulledDemiurge = cloudCenter(demiurgeCloud, t, -70);
    const camAngle = t * CAMERA_ORBIT_RATE;
    const dist = CAMERA_DISTANCE + zoomOut * 900;
    const elevation = 0.12 + Math.sin(t * 0.005) * 0.035;
    const orbit = dist / Math.hypot(1, elevation);
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(pulledDemiurge.x + Math.sin(camAngle) * orbit, pulledDemiurge.y + elevation * orbit, pulledDemiurge.z + Math.cos(camAngle) * orbit);
    cam.lookAt(pulledDemiurge.x, pulledDemiurge.y, pulledDemiurge.z);
    cam.fov = FOV;
    cam.aspect = width / height;
    cam.near = 1;
    cam.far = 8000;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    if (scene.fog instanceof THREE.FogExp2) scene.fog.density = 0.0009 + (0.00012 - 0.0009) * zoomOut;

    // ---- the form and what moves inside it ----
    const sofiaPresenceScale = Math.max(sofiaP, 0.08 + sofiaActive * 0.4);
    // His form arrives with him and then stays to the end — the integration happens inside it (timeline.ts).
    const demiurgeVisualPresence = demiurgeFormPresence(t);
    const angleY = cubeRotationY(t);
    const angleX = cubeTiltX(t);
    // His notes contract the form very slightly — a breath, not a jolt (music.ts envelopes are slow).
    const size = (0.35 + 0.65 * demiurgeVisualPresence) * (1 - 0.035 * demiurgeNote);
    const form: FormState = {
      radius: FORM_RADIUS * size,
      half: (DEMIURGE_CUBE / 2) * size,
      progress: demiurgeFormProgress(t),
      crack: flight,
      firmness: demiurgeFirmness(t),
      sphere: sphereAmount(t),
      t,
    };
    const tint = GOLD;
    const integrated = integratedGold(t);

    // Every particle motion runs on the motion clock (timeline.ts), which slows down through the integration. What
    // little dance is left there breathes with the Shepard: one slow swell per step of its climb, settling before
    // the next — the movement follows the music instead of an independent wobble.
    const mt = motionTime(t);
    const breath = inFlight ? shepardBreath(music, t) : 0;
    const danceGate = 1 - flight + flight * (0.15 + 0.35 * breath);
    // At the end she is brought inside the form — the icosahedron rounding into the sphere — filling it evenly.
    const gatherRadius = form.radius * (0.8 + 0.12 * form.sphere);

    const sofiaMusic = {
      pulse: sophiaNote.value,
      pulseHeight: sophiaNote.pitch,
      // The gold core also holds as she gathers inside the form at the end: what ends up there is the integration.
      tintPulse: Math.max(tintNote, preludio, 0.6 * gather),
      sparks,
      bands,
    };

    const zeroA = new Float32Array(N_SOFIA);
    const zeroB = new Float32Array(N_DEMIURGE);
    stepCloud(demiurgeCloud, t, pulledDemiurge, form, zeroB, tint, 1.0 * danceGate, bands, 0, mt, integrated);
    stepSofia(
      sofiaCloud, sofiaWander, sofiaThresholds, mt, pulledDemiurge, SOFIA_ORBIT_RADIUS, form, angleY, angleX,
      captured, sofiaPresenceScale, zeroA, tint, 3.5 * danceGate, GOLD, DEMIURGE_COLOR, sofiaMusic, integrated,
    );
    contractToward(sofiaCloud, pulledDemiurge, growth);
    gatherInside(sofiaCloud, pulledDemiurge, gatherRadius, gather);
    keepOnScreen(sofiaCloud, cam);

    const crossPos = crossGeometry.attributes.position.array as Float32Array;
    const crossCol = crossGeometry.attributes.color.array as Float32Array;
    const { numConnected: numCross, maskA, maskB } = connectClouds(
      sofiaCloud, demiurgeCloud, MIN_DISTANCE, crossPos, crossCol, tint,
      Math.min(0.55, 0.12 + shepard * 0.35 + Math.min(sofiaActive, demiurgeActive) * 0.15) * spread * contentFade,
    );
    crossGeometry.setDrawRange(0, numCross * 2);
    (crossGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (crossGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    stepCloud(demiurgeCloud, t, pulledDemiurge, form, maskB, tint, 1.0 * danceGate, bands, 0, mt, integrated);
    stepSofia(
      sofiaCloud, sofiaWander, sofiaThresholds, mt, pulledDemiurge, SOFIA_ORBIT_RADIUS, form, angleY, angleX,
      captured, sofiaPresenceScale, maskA, tint, 3.5 * danceGate, GOLD, DEMIURGE_COLOR, sofiaMusic, integrated,
    );
    contractToward(sofiaCloud, pulledDemiurge, growth);
    gatherInside(sofiaCloud, pulledDemiurge, gatherRadius, gather);
    keepOnScreen(sofiaCloud, cam);

    // A chord change's wave travels outward from the form's center through both webs.
    const chordWaveArgs = { center: pulledDemiurge, radius: wave.front * SOFIA_ORBIT_RADIUS * 1.2, width: 45, strength: 0.6 * wave.strength };
    const sPos = sofiaSelfGeometry.attributes.position.array as Float32Array;
    const sCol = sofiaSelfGeometry.attributes.color.array as Float32Array;
    const numSofiaSelf = connectWithinCloud(sofiaCloud, MIN_DISTANCE * 1.6, sPos, sCol, SOFIA_COLOR, 0.5 * sofiaPresenceScale * spread * contentFade, SOFIA_SELF_CAP, chordWaveArgs, GOLD);
    sofiaSelfGeometry.setDrawRange(0, numSofiaSelf * 2);
    (sofiaSelfGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (sofiaSelfGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    const dPos = demiurgeSelfGeometry.attributes.position.array as Float32Array;
    const dCol = demiurgeSelfGeometry.attributes.color.array as Float32Array;
    const numDemiurgeSelf = connectWithinCloud(demiurgeCloud, MIN_DISTANCE * 0.95, dPos, dCol, DEMIURGE_COLOR, 1.0 * demiurgeVisualPresence * contentFade, DEMIURGE_SELF_CAP, chordWaveArgs, GOLD);
    demiurgeSelfGeometry.setDrawRange(0, numDemiurgeSelf * 2);
    (demiurgeSelfGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (demiurgeSelfGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    (sofiaMaterial.uniforms.uOpacity as THREE.IUniform).value = (0.35 + 0.65 * sofiaPresenceScale) * emerge * contentFade;
    (demiurgeMaterial.uniforms.uOpacity as THREE.IUniform).value = demiurgeVisualPresence * contentFade;
    // As everything closes into the point, the sprites shrink with it (their size is otherwise set by distance alone).
    const k = 1 - shrink;
    (sofiaMaterial.uniforms.uSize as THREE.IUniform).value = SOFIA_POINT_SIZE * (0.4 + 0.6 * k);
    (demiurgeMaterial.uniforms.uSize as THREE.IUniform).value = DEMIURGE_POINT_SIZE * (0.4 + 0.6 * k);
    (demiurgeMaterial.uniforms.uBoost as THREE.IUniform).value = 0.25 * bassNote; // the bass: the weight of matter

    // ---- the form's edges and vertices: violet moving toward gold with each transformation ----
    const gold = edgeGold(t);
    const edgeColor: [number, number, number] = [0, 1, 2].map((c) => DEMIURGE_COLOR[c] + (GOLD[c] - DEMIURGE_COLOR[c]) * gold) as [number, number, number];
    writeFormEdges(form, formLines.positions, formLines.colors, edgeColor);
    formLines.commit();
    formLines.object.position.copy(pulledDemiurge);
    formLines.object.rotation.set(angleX, angleY, 0);
    formLines.material.linewidth = FORM_LINE_PX * pxScale * (1 + 0.35 * demiurgeNote);
    formLines.material.opacity = 0.9 * demiurgeVisualPresence * (0.75 + 0.25 * demiurgeNote) * contentFade;
    formLines.material.resolution.set(width, height);
    updateFormVertices(form, formVertexGeometry, edgeColor);
    (formVertexMaterial.uniforms.uOpacity as THREE.IUniform).value = demiurgeVisualPresence * contentFade;
    (formVertexMaterial.uniforms.uBoost as THREE.IUniform).value = 0.8 * demiurgeNote;
    if (formVertexRef.current) {
      formVertexRef.current.position.copy(pulledDemiurge);
      formVertexRef.current.rotation.set(angleX, angleY, 0);
    }
    // The walls come and go with his voice — very faint surfaces, the boundary there and not; the edges and the
    // vertex points above always stay.
    const faceAmount = (FACE_LEVEL + (SPHERE_FACE_LEVEL - FACE_LEVEL) * form.sphere) * demiurgeVisualPresence * contentFade;
    (formFaceMaterial.uniforms.uRim as THREE.IUniform).value = form.sphere;
    writeFormFaces(form, formFaceGeometry, [edgeColor[0] * faceAmount, edgeColor[1] * faceAmount, edgeColor[2] * faceAmount]);
    if (formFaceRef.current) {
      formFaceRef.current.position.copy(pulledDemiurge);
      formFaceRef.current.rotation.set(angleX, angleY, 0);
    }

    // Everything closes into the point: the whole content group scales toward the center (center + k * (p - center)).
    if (contentRef.current) {
      contentRef.current.scale.setScalar(Math.max(k, 1e-4));
      contentRef.current.position.copy(pulledDemiurge).multiplyScalar(1 - k);
    }
    if (goldPointRef.current) goldPointRef.current.position.copy(pulledDemiurge);
    (goldPointMaterial.uniforms.uOpacity as THREE.IUniform).value = goldPoint(t);
    (goldPointMaterial.uniforms.uSize as THREE.IUniform).value = GOLD_POINT_SIZE * (dist / CAMERA_DISTANCE);

    // The gold glows more as the integration rises.
    post.bloom.strength = 0.35 + 0.6 * flight;
  });

  return (
    <>
      <points ref={goldPointRef} geometry={goldPointGeometry} material={goldPointMaterial} frustumCulled={false} />
      <group ref={contentRef}>
      <points geometry={sofiaCloud.geometry} material={sofiaMaterial} frustumCulled={false} />
      <points geometry={demiurgeCloud.geometry} material={demiurgeMaterial} frustumCulled={false} />
      <lineSegments geometry={crossGeometry} material={crossMaterial} frustumCulled={false} />
      <lineSegments geometry={sofiaSelfGeometry} material={sofiaSelfMaterial} frustumCulled={false} />
      <lineSegments geometry={demiurgeSelfGeometry} material={demiurgeSelfMaterial} frustumCulled={false} />
      <mesh ref={formFaceRef} geometry={formFaceGeometry} material={formFaceMaterial} frustumCulled={false} />
      <primitive object={formLines.object} />
      <points ref={formVertexRef} geometry={formVertexGeometry} material={formVertexMaterial} frustumCulled={false} />
      </group>
    </>
  );
};

export const Gnosis: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const { width, height } = useVideoConfig();
  const music = useMusic();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Audio src={staticFile("gnosis-master.wav")} />
      <ThreeCanvas
        width={width}
        height={height}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ fov: FOV, near: 1, far: 8000, position: [0, 40, 460] }}
        onCreated={({ gl, scene }) => {
          // No tone mapping: ACES (tried first) desaturates bright color toward white at its highlight rolloff —
          // exactly what made gold read as white. NoToneMapping just clips each channel, so gold stays gold.
          gl.toneMapping = THREE.NoToneMapping;
          gl.setPixelRatio(1);
          scene.background = NIGHT;
          scene.fog = new THREE.FogExp2(NIGHT.getHex(), 0.0009);
        }}
      >
        {music ? <Scene t={t} width={width} height={height} music={music} /> : null}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

const calculateMetadata: CalculateMetadataFunction<Record<string, unknown>> = async () => {
  const seconds = await getAudioDurationInSeconds(staticFile("gnosis-audio.wav"));
  return { durationInFrames: Math.ceil(seconds * FPS) };
};

export const GnosisCompositions: React.FC = () => (
  <Composition
    id="gnosis"
    component={Gnosis}
    durationInFrames={MOVEMENT.end * FPS}
    fps={FPS}
    width={3840}
    height={2160}
    calculateMetadata={calculateMetadata}
  />
);
