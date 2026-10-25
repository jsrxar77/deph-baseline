// Gnosis — the Demiurgo (matter) and Sofía (light) as two particle clouds, each bouncing inside its own rotating
// wireframe cube (three.js's "buffergeometry drawrange" example, re-verified from source — see clouds.ts for the
// exact numbers ported: r=800 cube, group.rotation.y = time*0.1, the demo's own maxConnections cap). Each cloud
// also has its own internal constellation (intra-cloud connections), not just the cross-cloud ones. The Shepard
// isn't a separate device: it IS the moment the two clouds integrate — the connecting lines between them, and any
// particle caught in one, take on a third color distinct from both clouds' own, growing as the Shepard rises
// (direction confirmed with the user, 2026-10-25).
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, CalculateMetadataFunction, Composition, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  cloudCenter, connectClouds, connectWithinCloud, cubeRotationY, cubeTiltX, makeCloud, MAX_CONNECTIONS_PER_PARTICLE, stepCloud, type Cloud,
} from "./clouds";
import { makePointMaterial } from "./pointShader";
import { activeLevel, demiurgePresence, FPS, MOVEMENT, shepardIntensity, sophiaPresence } from "./timeline";

const NIGHT = new THREE.Color("#000000"); // pure black (OLED), per the user's direction — not a tinted near-black
const FOV = 42;

// Base colors (0..1). Sofía: cold electric cyan/white, light. Demiurgo: dark violet, matter. Integration: a third,
// warm color belonging to neither — the thing the other two become when they meet, not a blend read as "a bit of
// both".
const SOFIA_COLOR: [number, number, number] = [0.45, 0.85, 1.0];
const DEMIURGE_COLOR: [number, number, number] = [0.32, 0.16, 0.5];
const INTEGRATION_COLOR: [number, number, number] = [1.0, 0.82, 0.45];
const CUBE_COLOR = new THREE.Color(0x474747); // the source demo's own BoxHelper color, unmodified

const N_SOFIA = 480;
const N_DEMIURGE = 420;
const SOFIA_CUBE = 190;
const DEMIURGE_CUBE = 220;
const MIN_DISTANCE = 46;

function useCubeWireframe(edges: THREE.BufferGeometry) {
  return useMemo(() => new THREE.LineBasicMaterial({ color: CUBE_COLOR, transparent: true, opacity: 0.55 }), []);
}

const Scene: React.FC<{ t: number; width: number; height: number }> = ({ t, width, height }) => {
  const { camera } = useThree();

  const sofiaCloud = useMemo<Cloud>(
    () => makeCloud({ n: N_SOFIA, color: SOFIA_COLOR, centerSeed: 11, orbitSeed: 2026102501, cubeSize: SOFIA_CUBE }),
    [],
  );
  const demiurgeCloud = useMemo<Cloud>(
    () => makeCloud({ n: N_DEMIURGE, color: DEMIURGE_COLOR, centerSeed: 37, orbitSeed: 2026102502, cubeSize: DEMIURGE_CUBE }),
    [],
  );

  const sofiaCubeMat = useCubeWireframe(sofiaCloud.cubeEdges);
  const demiurgeCubeMat = useCubeWireframe(demiurgeCloud.cubeEdges);
  const sofiaCubeRef = React.useRef<THREE.LineSegments>(null);
  const demiurgeCubeRef = React.useRef<THREE.LineSegments>(null);

  // Cross-cloud line buffer: capped by the source demo's own maxConnections (see clouds.ts), so the worst case is
  // bounded by N_SOFIA * cap, not N_SOFIA * N_DEMIURGE — reserved once, redrawn with setDrawRange each frame.
  const maxCrossLines = N_SOFIA * MAX_CONNECTIONS_PER_PARTICLE;
  const crossGeometry = useMemo(() => makeLineGeometry(maxCrossLines), [maxCrossLines]);
  const crossMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  );

  // Intra-cloud line buffers — each cloud's own constellation, same cap.
  const sofiaSelfGeometry = useMemo(() => makeLineGeometry((N_SOFIA * MAX_CONNECTIONS_PER_PARTICLE) / 2), []);
  const demiurgeSelfGeometry = useMemo(() => makeLineGeometry((N_DEMIURGE * MAX_CONNECTIONS_PER_PARTICLE) / 2), []);
  const sofiaSelfMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  );
  const demiurgeSelfMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  );

  const sofiaMaterial = useMemo(() => makePointMaterial(5.5), []);
  const demiurgeMaterial = useMemo(() => makePointMaterial(6.2), []);

  useLayoutEffect(() => {
    const sofiaP = sophiaPresence(t);
    const demiurgeP = demiurgePresence(t);
    const shepard = shepardIntensity(t);

    const sofiaActive = activeLevel("S", t);
    const demiurgeActive = activeLevel("D", t);

    // During the Shepard, the two clouds' cubes are pulled toward a shared midpoint — the integration is literal
    // proximity, not just a color change. Outside it they wander independently, each around its own register
    // (Sofía high, Demiurgo low).
    const sofiaCenter = cloudCenter(sofiaCloud, t, 70);
    const demiurgeCenter = cloudCenter(demiurgeCloud, t, -70);
    const midpoint = sofiaCenter.clone().add(demiurgeCenter).multiplyScalar(0.5);
    const pulledSofia = sofiaCenter.clone().lerp(midpoint, shepard * 0.65);
    const pulledDemiurge = demiurgeCenter.clone().lerp(midpoint, shepard * 0.65);

    const sofiaPresenceScale = Math.max(sofiaP, 0.08 + sofiaActive * 0.4);
    const demiurgePresenceScale = demiurgeP;

    // First pass with no integration mask yet (the mask depends on this frame's own positions) — zero masks, then
    // position, then connect, then re-tint using the real mask. Several small passes, still a pure function of t.
    const zeroA = new Float32Array(N_SOFIA);
    const zeroB = new Float32Array(N_DEMIURGE);
    stepCloud(sofiaCloud, t, pulledSofia, sofiaPresenceScale, zeroA, INTEGRATION_COLOR);
    stepCloud(demiurgeCloud, t, pulledDemiurge, demiurgePresenceScale, zeroB, INTEGRATION_COLOR);

    // Cross-cloud connections — NOT widened during the Shepard (that was what turned the integration into an
    // unreadable blob): the radius stays constant, so the density increase during the Shepard comes only from the
    // cubes physically moving closer together, the same way the source demo's own connections respond to real
    // motion rather than a tuned threshold.
    const crossPos = crossGeometry.attributes.position.array as Float32Array;
    const crossCol = crossGeometry.attributes.color.array as Float32Array;
    const { numConnected: numCross, maskA, maskB } = connectClouds(
      sofiaCloud, demiurgeCloud, MIN_DISTANCE, crossPos, crossCol, INTEGRATION_COLOR,
      Math.min(0.85, 0.15 + shepard * 0.55 + Math.min(sofiaActive, demiurgeActive) * 0.2),
    );
    crossGeometry.setDrawRange(0, numCross * 2);
    (crossGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (crossGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    // Re-tint each cloud's own particle colors using the real mask from this frame's cross-cloud connections.
    stepCloud(sofiaCloud, t, pulledSofia, sofiaPresenceScale, maskA, INTEGRATION_COLOR);
    stepCloud(demiurgeCloud, t, pulledDemiurge, demiurgePresenceScale, maskB, INTEGRATION_COLOR);

    // Each cloud's own internal constellation — independent of the other cloud entirely.
    const sPos = sofiaSelfGeometry.attributes.position.array as Float32Array;
    const sCol = sofiaSelfGeometry.attributes.color.array as Float32Array;
    const numSofiaSelf = connectWithinCloud(sofiaCloud, MIN_DISTANCE * 0.85, sPos, sCol, SOFIA_COLOR, 0.7 * sofiaPresenceScale);
    sofiaSelfGeometry.setDrawRange(0, numSofiaSelf * 2);
    (sofiaSelfGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (sofiaSelfGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    const dPos = demiurgeSelfGeometry.attributes.position.array as Float32Array;
    const dCol = demiurgeSelfGeometry.attributes.color.array as Float32Array;
    const numDemiurgeSelf = connectWithinCloud(demiurgeCloud, MIN_DISTANCE * 0.85, dPos, dCol, DEMIURGE_COLOR, 0.7 * demiurgePresenceScale);
    demiurgeSelfGeometry.setDrawRange(0, numDemiurgeSelf * 2);
    (demiurgeSelfGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (demiurgeSelfGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    (sofiaMaterial.uniforms.uOpacity as THREE.IUniform).value = 0.75 + 0.25 * sofiaPresenceScale;
    (demiurgeMaterial.uniforms.uOpacity as THREE.IUniform).value = 0.7 + 0.3 * demiurgePresenceScale;

    // The two cubes themselves: same center/rotation as their particles (cubeRotationY, cubeTiltX and stepCloud's
    // own breathing scale must all agree — see clouds.ts), so the wireframe always encloses what's actually
    // inside it. rotation.set(x, y, 0) with three's default 'XYZ' Euler order composes as Y first, then X on top
    // — the same order clouds.ts's stepCloud uses for the particles.
    const angleY = cubeRotationY(t);
    const angleX = cubeTiltX(t);
    if (sofiaCubeRef.current) {
      sofiaCubeRef.current.position.copy(pulledSofia);
      sofiaCubeRef.current.rotation.set(angleX, angleY, 0);
      const s = 0.35 + 0.65 * sofiaPresenceScale;
      sofiaCubeRef.current.scale.setScalar(s);
      sofiaCubeMat.opacity = 0.5 * sofiaPresenceScale;
    }
    if (demiurgeCubeRef.current) {
      demiurgeCubeRef.current.position.copy(pulledDemiurge);
      demiurgeCubeRef.current.rotation.set(angleX, angleY, 0);
      const s = 0.35 + 0.65 * demiurgePresenceScale;
      demiurgeCubeRef.current.scale.setScalar(s);
      demiurgeCubeMat.opacity = 0.45 * demiurgePresenceScale;
    }

    // One continuous shot: a slow orbit around the space between the two clouds, drawing in gently during the
    // Shepard — slowed down and flattened after the user's note that gnosis's movement overall read as too much.
    const camAngle = t * 0.012;
    const dist = 460 - shepard * 80;
    const elevation = 0.12 + Math.sin(t * 0.005) * 0.035;
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(Math.sin(camAngle) * dist, dist * elevation + 10, Math.cos(camAngle) * dist);
    cam.lookAt(midpoint.x, midpoint.y * 0.3, midpoint.z);
    cam.fov = FOV - shepard * 6;
    cam.aspect = width / height;
    cam.near = 1;
    cam.far = 3000;
    cam.updateProjectionMatrix();
  });

  return (
    <>
      <points geometry={sofiaCloud.geometry} material={sofiaMaterial} frustumCulled={false} />
      <points geometry={demiurgeCloud.geometry} material={demiurgeMaterial} frustumCulled={false} />
      <lineSegments geometry={crossGeometry} material={crossMaterial} frustumCulled={false} />
      <lineSegments geometry={sofiaSelfGeometry} material={sofiaSelfMaterial} frustumCulled={false} />
      <lineSegments geometry={demiurgeSelfGeometry} material={demiurgeSelfMaterial} frustumCulled={false} />
      <lineSegments ref={sofiaCubeRef} geometry={sofiaCloud.cubeEdges} material={sofiaCubeMat} frustumCulled={false} />
      <lineSegments ref={demiurgeCubeRef} geometry={demiurgeCloud.cubeEdges} material={demiurgeCubeMat} frustumCulled={false} />
    </>
  );
};

function makeLineGeometry(maxLines: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(maxLines * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(maxLines * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setDrawRange(0, 0);
  return g;
}

export const Gnosis: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Audio src={staticFile("gnosis-master.wav")} />
      <ThreeCanvas
        width={width}
        height={height}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ fov: FOV, near: 1, far: 3000, position: [0, 40, 460] }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          scene.background = NIGHT;
          scene.fog = new THREE.FogExp2(NIGHT.getHex(), 0.0009);
        }}
      >
        <Scene t={t} width={width} height={height} />
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
