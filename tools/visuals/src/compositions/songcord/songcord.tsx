import React from "react";
import { Composition, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { arcAt, hash01, onsetPosition, recentOnsets, smoothAt, useAnalysis, type Analysis } from "./analysis";
import { commonUniforms } from "./common";
import { HdrCanvas, type HdrParams, type UniformValue } from "../../shared/HdrCanvas";
import { FRAGMENT } from "./shader";
import { wakeUniforms } from "./wake";
import { beingPos, beingTrail } from "./being";
import { N_RIPPLES } from "../../shared/ripples";

// Songcord: the Dive world (A) with attack ripples and breath rings (B), water wakes over the whole frame (wake.ts),
// and one being of light, all seen through moving water, in linear HDR with bloom, graded for SDR screens. Every value
// is a pure function of the frame.

const FPS = 60;

// Camera height follows the narrative curve.
const extraA = (t: number): Record<string, UniformValue> => ({ uCamY: -1.6 * arcAt(t) });

// Recent mid/high onsets become ripples at deterministic positions; sustained sound becomes slow "breath" rings.
// Breaths exist because the music is not only attacks: in the held question (1:17-1:28) there are no mid/high onsets
// at all, yet strings and choir sound. A breath ring is emitted every 2.4 s, stronger the fewer attacks are around.
const N_ATTACKS = 20;
const BREATH_EVERY = 2.4;
const BREATH_LIFE = 9;
const extraB = (a: Analysis, t: number, aspect: number): Record<string, UniformValue> => {
  const on = new Float32Array(N_RIPPLES * 4);
  const kind = new Float32Array(N_RIPPLES);
  let slot = 0;
  for (const o of recentOnsets(a, t, 7, N_ATTACKS, ["mid", "high"])) {
    const [x, y] = onsetPosition(o, aspect); // x from the measured stereo pan, y from the attack's register
    on.set([x, y, t - o.t, 0.35 + 0.65 * o.strength], slot * 4);
    kind[slot++] = o.band === "high" ? 1 : 0;
  }
  const first = Math.floor((t - BREATH_LIFE) / BREATH_EVERY);
  for (let k = first; k <= Math.floor(t / BREATH_EVERY) && slot < N_RIPPLES; k++) {
    const tb = k * BREATH_EVERY;
    if (tb < 0 || t - tb > BREATH_LIFE) continue;
    const dens = a.onsets.filter((o) => o.band !== "low" && Math.abs(o.t - tb) < 2).length;
    const str = (0.35 + 0.5 * Math.max(0, 1 - dens / 4)) * (0.6 + 0.4 * smoothAt(a, a.frames.rms, tb, 0.5));
    const panMid = smoothAt(a, a.frames.pan.mid, tb, 0.5);
    on.set([Math.max(-1, Math.min(1, panMid * 3.5)) * 0.3 * aspect + (hash01(tb * 2.3) - 0.5) * 0.3 * aspect, (hash01(tb * 4.9) - 0.5) * 0.3, t - tb, str], slot * 4);
    kind[slot++] = 2;
  }
  return { uOn: { kind: "4fv", value: on }, uOnK: { kind: "1fv", value: kind } };
};

// Graded for SDR screens, where most YouTube viewers are: the dark cinematic grade (gain 0.24, gamma 2.0) looked dim on
// a phone, so the world is brighter, the bloom wider, colour a little stronger and the shadows lifted; the highlights
// still roll to white.
const GRADE: HdrParams = { bloom: 0.55, exposure: 1.05, saturation: 1.28, threshold: 1.2, ca: 0.004, gamma: 2.25 };
const GAIN = 0.42;

const Songcord: React.FC = () => {
  const a = useAnalysis();
  const t = useCurrentFrame() / FPS;
  const { width, height } = useVideoConfig();
  let uniforms: Record<string, UniformValue> | null = null;
  if (a) {
    const aspect = width / height;
    const level = smoothAt(a, a.frames.rms, t, 0.5);
    let pulse = 0;
    for (const o of recentOnsets(a, t, 0.8, 6, ["mid", "high"])) {
      const age = t - o.t;
      pulse += o.strength * Math.min(1, age / 0.12) * Math.exp(-age * 3.5) * 0.30;
    }
    const [hx, hy] = beingPos(a, t, aspect);
    const w = wakeUniforms(a, t, aspect);
    const common = commonUniforms(a, t, width, height);
    uniforms = {
      ...common, uSwell: common.uBass, ...extraA(t), ...extraB(a, t, aspect),
      uWake: { kind: "4fv", value: w.wake }, uWakeKw: { kind: "1fv", value: w.kw }, uDomHue: w.dominantHue,
      uPalette: 1, uVivid: 1, uGain: GAIN,
      uTrail: { kind: "4fv", value: beingTrail(a, t, aspect, level, false) },
      uHead: [hx, hy], uHeadPower: 0.7 + 0.8 * level, uPulse: Math.min(0.35, pulse),
    };
  }
  return <HdrCanvas sceneFragment={FRAGMENT} uniforms={uniforms} width={width} height={height} params={GRADE} audioSrc="songcord-youtube.wav" />;
};

const calculateMetadata = async () => {
  const seconds = await getAudioDurationInSeconds(staticFile("songcord-master.wav"));
  return { durationInFrames: Math.ceil(seconds * FPS) };
};

export const SongcordCompositions: React.FC = () => (
  <Composition id="songcord" component={Songcord} durationInFrames={11790} fps={FPS} width={3840} height={2160} calculateMetadata={calculateMetadata} />
);
