import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, Composition, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GRADE_SHADER, MANIFOLD_FRAG, MANIFOLD_VERT, ROD_FRAG, ROD_VERT } from "./shaders";
import { curve, FPS, getCameraAt, T, TOTAL_FRAMES, TOTAL_SECONDS } from "./timeline";

// Gnosis — Art Direction: The Transducting Rod & The Folded Manifold
// 500,000 quantum filaments forming a continuous 3D toroidal Clifford manifold around a vertical plasma grounding rod.
// Continuous 3D camera spline traversing 24:00 (1440s / 86,400 frames @ 60 fps).

const N_POINTS = 500_000;
const NIGHT_BG = new THREE.Color("#050508");

const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function createManifoldGeometry() {
  const rnd = mulberry32(20261020);
  const pos = new Float32Array(N_POINTS * 3);
  const seed = new Float32Array(N_POINTS * 4);

  for (let i = 0; i < N_POINTS; i++) {
    // aSeed: [angle, radius, height, phase]
    seed[i * 4 + 0] = rnd() * Math.PI * 2;
    seed[i * 4 + 1] = Math.sqrt(rnd()); // Uniform area distribution
    seed[i * 4 + 2] = rnd() * 2.0 - 1.0;
    seed[i * 4 + 3] = rnd();

    // Default position (updated dynamically in vertex shader)
    pos[i * 3 + 0] = 0;
    pos[i * 3 + 1] = 0;
    pos[i * 3 + 2] = 0;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geom.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  return geom;
}

interface SceneProps {
  t: number;
  width: number;
  height: number;
}

const Scene: React.FC<SceneProps> = ({ t, width, height }) => {
  const { gl, scene, camera } = useThree();

  const manifoldGeom = useMemo(() => createManifoldGeometry(), []);

  // 1. Manifold Material (Custom Shader)
  const manifoldMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: MANIFOLD_VERT,
        fragmentShader: MANIFOLD_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uPhase: { value: 0 },
          uFoldDensity: { value: 0 },
          uVortexPower: { value: 0 },
          uThetaPulse: { value: 0 },
          uPixelScale: { value: height / 1080 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [height]
  );

  // 2. Grounding Rod Material (Luminous Plasma Cylinder)
  const rodMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ROD_VERT,
        fragmentShader: ROD_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uRodEnergy: { value: 0.5 },
          uThetaPulse: { value: 0 },
        },
        side: THREE.DoubleSide,
      }),
    []
  );

  // Postprocessing (Composer + Bloom + ACES Grade)
  const post = useMemo(() => {
    const composer = new EffectComposer(gl);
    composer.renderToScreen = true;

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // High quality Bloom (calibrated threshold so only intense specular sparks bloom)
    const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.75, 0.45, 0.92);
    composer.addPass(bloom);

    const grade = new ShaderPass(GRADE_SHADER);
    composer.addPass(grade);

    return { composer, bloom, grade };
  }, [gl, scene, camera, width, height]);

  useLayoutEffect(() => {
    post.composer.setSize(width, height);
  }, [post, width, height]);

  // Frame update loop
  useFrame(() => {
    const progress = t / TOTAL_SECONDS;
    const thetaWave = t * 6.0 * Math.PI * 2; // 6 Hz Theta oscillation

    // Macro evolution curves across Gnosis arc
    const foldDensity = curve(
      [
        [0, 0.15],
        [T.descent, 0.35],
        [T.density, 0.95],
        [T.grounding, 0.70],
        [T.transfiguration, 0.25],
        [T.end, 0.10],
      ],
      t
    );

    const vortexPower = curve(
      [
        [0, 0.1],
        [T.descent, 0.3],
        [T.density, 0.5],
        [T.grounding, 1.4],
        [T.transfiguration, 0.3],
        [T.end, 0.05],
      ],
      t
    );

    const rodEnergy = curve(
      [
        [0, 0.4],
        [T.descent, 0.6],
        [T.density, 0.8],
        [T.grounding, 1.5],
        [T.transfiguration, 0.7],
        [T.end, 0.3],
      ],
      t
    );

    // Update uniforms
    manifoldMat.uniforms.uTime.value = t;
    manifoldMat.uniforms.uProgress.value = progress;
    manifoldMat.uniforms.uFoldDensity.value = foldDensity;
    manifoldMat.uniforms.uVortexPower.value = vortexPower;
    manifoldMat.uniforms.uThetaPulse.value = thetaWave;

    rodMat.uniforms.uTime.value = t;
    rodMat.uniforms.uRodEnergy.value = rodEnergy;
    rodMat.uniforms.uThetaPulse.value = thetaWave;

    post.grade.uniforms.uTime.value = t;

    // Update 3D Camera spline trajectory
    const cam = getCameraAt(t);
    camera.position.set(cam.position[0], cam.position[1], cam.position[2]);
    camera.lookAt(cam.target[0], cam.target[1], cam.target[2]);

    // Render through HDR postprocessing pipeline
    post.composer.render();
  }, 1);

  return (
    <>
      {/* Central Grounding Rod (Axis) */}
      <mesh material={rodMat} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 24, 32]} />
      </mesh>

      {/* Central Spark Core */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={new THREE.Color("#FBBF24")} />
      </mesh>

      {/* 500,000 Quantum Filaments (The Folded Manifold) */}
      <points geometry={manifoldGeom} material={manifoldMat} frustumCulled={false} />
    </>
  );
};

export const Gnosis: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#050508" }}>
      <ThreeCanvas
        width={width}
        height={height}
        gl={{ antialias: false, preserveDrawingBuffer: true, alpha: false }}
        camera={{ fov: 42, near: 0.01, far: 50, position: [0, 1.8, 3.5] }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.NoToneMapping; // Grade shader handles ACES tone mapping
          gl.outputColorSpace = THREE.LinearSRGBColorSpace;
          gl.setPixelRatio(1);
          scene.background = NIGHT_BG;
        }}
      >
        <Scene t={t} width={width} height={height} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const GnosisCompositions: React.FC = () => (
  <Composition
    id="gnosis"
    component={Gnosis}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={3840}
    height={2160}
  />
);
