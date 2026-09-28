import React from "react";
import { CalculateMetadataFunction, Composition, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { HdrCanvas, type HdrParams } from "../../shared/HdrCanvas";
import { beingPos, NBEING, TRAIL_SECONDS, visibleCount } from "./beings";
import { FRAGMENT, NT } from "./shader";
import { stoneUniforms } from "./stones";
import { arc, FPS, monochord, recentEvents, useTimeline, type Timeline } from "./timeline";

// Musica Universalis: beings of light like Songcord's, on 3D orbits (beings.ts) — one alone at the start, up to six at
// the top of the arc, one again at the end — over star dust at several depths, all seen through water where every note
// drops a stone (stones.ts, Songcord's ripples); a lead bell makes one being swell. Graded like Songcord for SDR screens.
// Structure and reasons: shader.ts's header.

const GRADE: HdrParams = { bloom: 0.55, exposure: 1.05, saturation: 1.28, threshold: 1.2, ca: 0.0012, gamma: 2.25 }; // Songcord's
const SCENE = FRAGMENT(NBEING);

function buildUniforms(tl: Timeline, t: number, aspect: number) {
  const vc = visibleCount(arc(t), monochord(t));

  const A = arc(t);
  // A lead bell makes one lit being swell (0.3 s rise, ~2.6 s fade, like the bell's tail), capped like Songcord's pulse.
  const pulse = new Float32Array(NBEING);
  const lit = Math.max(1, Math.floor(vc));
  for (const e of recentEvents(tl, "lead", t, 4)) {
    const i = Math.abs(Math.round(e.note * 5 + (t - e.age) * 3)) % lit;
    pulse[i] = Math.min(0.35, pulse[i] + 0.35 * e.level * Math.min(1, e.age / 0.3) * Math.exp(-e.age / 1.3));
  }

  // Trails head first (index 0 = now), as Songcord's shader expects. Power as Songcord's (0.7 + 0.8 * level), times
  // each being's fade in/out as the arc opens and closes.
  const trail = new Float32Array(NBEING * NT * 4);
  const power = new Float32Array(NBEING);
  for (let i = 0; i < NBEING; i++) {
    power[i] = Math.min(1, Math.max(0, vc - i)) * (0.7 + 0.8 * (0.2 + 0.8 * A));
    if (power[i] < 0.004) continue;
    for (let k = 0; k < NT; k++) {
      const [x, y, s] = beingPos(i, Math.max(0, t - (TRAIL_SECONDS * k) / (NT - 1)));
      trail.set([x, y, s, 0], (i * NT + k) * 4);
    }
  }

  return {
    ...stoneUniforms(tl, t, aspect, A),
    uSwell: 0.3 + 0.5 * A,
    uLevel: 0.3 + 0.7 * A,
    uRes: [aspect, 1] as [number, number],
    uTime: t,
    uArc: A,
    uMonochord: monochord(t),
    uTrail: { kind: "4fv" as const, value: trail },
    uPower: { kind: "1fv" as const, value: power },
    uPulse: { kind: "1fv" as const, value: pulse },
  };
}

export const MusicaUniversalis: React.FC = () => {
  const tl = useTimeline();
  const t = useCurrentFrame() / FPS;
  const { width, height } = useVideoConfig();
  const uniforms = tl ? buildUniforms(tl, t, width / height) : null;
  return <HdrCanvas sceneFragment={SCENE} uniforms={uniforms} width={width} height={height} params={GRADE} audioSrc="musica-universalis-youtube.wav" />;
};

const calculateMetadata: CalculateMetadataFunction<Record<string, unknown>> = async () => {
  const seconds = await getAudioDurationInSeconds(staticFile("musica-universalis-audio.wav"));
  return { durationInFrames: Math.ceil(seconds * FPS) };
};

export const MusicaUniversalisCompositions: React.FC = () => (
  <Composition id="musica-universalis" component={MusicaUniversalis} durationInFrames={22080} fps={FPS} width={3840} height={2160} calculateMetadata={calculateMetadata} />
);
