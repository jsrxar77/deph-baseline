import React from "react";
import { Composition, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { ShaderCanvas, type UniformValue } from "./ShaderCanvas";
import { arcAt, chromaAt, hash01, onsetPosition, recentOnsets, smoothAt, useAnalysis, type Analysis } from "./analysis";
import { commonUniforms } from "./common";
import { FRAGMENT_A } from "./shaderA";
import { FRAGMENT_B } from "./shaderB";
import { FRAGMENT_C } from "./shaderC";
import { FRAGMENT_E } from "./shaderE";
import { FRAGMENT_J } from "./shaderJ";
import { HdrCanvas, type HdrParams } from "./HdrCanvas";
import { FRAGMENT_K } from "./shaderK";
import { FRAGMENT_L } from "./shaderL";
import { wakeUniforms } from "./wake";
import { beingPos, beingTrail } from "./being";
import { RibbonsLayer } from "./ProtoD";

// Look-development prototypes for Songcord: three different visual ideas over the whole track, so the Studio can be
// scrubbed anywhere (e.g. 1:17 the held question, 2:48 the resolution). Every value is a pure function of the frame.

const FPS = 60;

const useT = () => {
  const frame = useCurrentFrame();
  return frame / FPS;
};

function make(fragment: string, extra: (a: Analysis, t: number, w: number, h: number) => Record<string, UniformValue>): React.FC {
  return () => {
    const a = useAnalysis();
    const t = useT();
    const { width, height } = useVideoConfig();
    const uniforms = a ? { ...commonUniforms(a, t, width, height), ...extra(a, t, width, height) } : null;
    return <ShaderCanvas fragment={fragment} uniforms={uniforms} width={width} height={height} />;
  };
}

// ---- uniform builders, shared so the hybrid (E) can reuse exactly what A, B and C use ----

// A: camera height follows the narrative curve (a pure function of t).
const extraA = (_a: Analysis, t: number): Record<string, UniformValue> => ({ uCamY: -1.6 * arcAt(t) });

// B: recent mid/high onsets become ripples at deterministic positions; sustained sound becomes slow "breath" rings.
// Breaths exist because the music is not only attacks: in the held question (1:17-1:28) there are no mid/high onsets
// at all, yet strings and choir sound. A breath ring is emitted every 2.4 s, stronger the fewer attacks are around.
const N_RIPPLES = 24;
const N_ATTACKS = 20;
const BREATH_EVERY = 2.4;
const BREATH_LIFE = 9;
const extraB = (a: Analysis, t: number, w: number, h: number): Record<string, UniformValue> => {
  const aspect = w / h;
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

// C: pitch classes (0 = C .. 11 = B) mapped to plate modes by their distance from the tonic A.
const MODES: [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [3, 6], [4, 6], [5, 6], [5, 7]];
const TONIC = 9; // A
const extraC = (a: Analysis, t: number): Record<string, UniformValue> => {
  const c = chromaAt(a, t, 1.5);
  const n = new Float32Array(12), m = new Float32Array(12);
  for (let k = 0; k < 12; k++) {
    const [nn, mm] = MODES[(k - TONIC + 12) % 12];
    n[k] = nn;
    m[k] = mm;
  }
  return { uChroma: { kind: "1fv", value: Float32Array.from(c.map((v) => Math.pow(v, 1.6))) }, uN: { kind: "1fv", value: n }, uM: { kind: "1fv", value: m } };
};

const ProtoA = make(FRAGMENT_A, extraA);
const ProtoB = make(FRAGMENT_B, extraB);
const ProtoC = make(FRAGMENT_C, extraC);
// D: the Dive's world (Pandora palette) underneath, the three ribbon currents on top.
const WorldA = make(FRAGMENT_A, (a, t) => ({ ...extraA(a, t), uPalette: 1 }));
const ProtoD: React.FC = () => (
  <>
    <WorldA />
    <RibbonsLayer />
    <Composition id="SongcordFinal" component={ProtoFinal} durationInFrames={11790} fps={FPS} width={1920} height={1080} calculateMetadata={calculateMetadata} />
    <Composition id="SongcordFinal4K" component={ProtoFinal} durationInFrames={11790} fps={FPS} width={3840} height={2160} calculateMetadata={calculateMetadata} />
  </>
);
const ProtoE = make(FRAGMENT_E, (a, t, w, h) => ({ ...extraA(a, t), ...extraB(a, t, w, h), ...extraC(a, t), uPalette: 1 }));

const wakeExtras = (a: Analysis, t: number, aspect: number): Record<string, UniformValue> => {
  const w = wakeUniforms(a, t, aspect);
  return { uWake: { kind: "4fv", value: w.wake }, uWakeKw: { kind: "1fv", value: w.kw }, uDomHue: w.dominantHue };
};

// J and K: E in linear HDR with bloom, plus one being of light with a fading trail.
//   J: the being has a twisting two-strand trail; K: a single smooth beam, everything seen through water.
const makeLuminous = (fragment: string, twist: boolean, params: HdrParams, wake = false, gain = 0.24, audioSrc?: string): React.FC => () => {
  const a = useAnalysis();
  const t = useT();
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
    uniforms = {
      ...commonUniforms(a, t, width, height), ...extraA(a, t), ...extraB(a, t, width, height), ...(wake ? {} : extraC(a, t)),
      ...(wake ? wakeExtras(a, t, aspect) : {}),
      uPalette: 1, uVivid: 1, uGain: gain,
      uTrail: { kind: "4fv", value: beingTrail(a, t, aspect, level, twist) },
      uHead: [hx, hy], uHeadPower: 0.7 + 0.8 * level, uPulse: Math.min(0.35, pulse),
    };
  }
  return <HdrCanvas sceneFragment={fragment} uniforms={uniforms} width={width} height={height} params={params} audioSrc={audioSrc} />;
};
const ProtoJ = makeLuminous(FRAGMENT_J, true, { bloom: 0.5, exposure: 1.0, saturation: 1.15, threshold: 1.0 });
const ProtoK = makeLuminous(FRAGMENT_K, false, { bloom: 0.5, exposure: 1.0, saturation: 1.15, threshold: 1.0, ca: 0.004 });
const ProtoL = makeLuminous(FRAGMENT_L, false, { bloom: 0.5, exposure: 1.0, saturation: 1.15, threshold: 1.0, ca: 0.004 }, true, 0.24);

// Final: L graded for SDR screens, where most YouTube viewers are. The dark cinematic grade (gain 0.24, gamma 2.0) looks
// dim on a phone, so the world is brighter, the bloom wider, colour a little stronger and the shadows lifted; the
// highlights still roll to white. 4K is the same shader at 3840x2160 (the look is resolution-independent).
export const YT_GRADE: HdrParams = { bloom: 0.55, exposure: 1.05, saturation: 1.28, threshold: 1.2, ca: 0.004, gamma: 2.25 };
const YT_GAIN = 0.42;
const YT_AUDIO = "songcord-youtube.wav";
export const ProtoFinal = makeLuminous(FRAGMENT_L, false, YT_GRADE, true, YT_GAIN, YT_AUDIO);

const calculateMetadata = async () => {
  const seconds = await getAudioDurationInSeconds(staticFile("songcord-master.wav"));
  return { durationInFrames: Math.ceil(seconds * FPS) };
};

export const SongcordPrototypes: React.FC = () => (
  <>
    {[
      ["SongcordProtoA-Dive", ProtoA],
      ["SongcordProtoB-Interference", ProtoB],
      ["SongcordProtoC-Cymatics", ProtoC],
      ["SongcordProtoD-Ribbons", ProtoD],
      ["SongcordProtoE-PandoraDeep", ProtoE],
      ["SongcordProtoJ-Luminous", ProtoJ],
      ["SongcordProtoK-Underwater", ProtoK],
      ["SongcordProtoL-Wake", ProtoL],
    ].map(([id, component]) => (
      <Composition key={id as string} id={id as string} component={component as React.FC} durationInFrames={11790} fps={FPS} width={1920} height={1080} calculateMetadata={calculateMetadata} />
    ))}
    <Composition id="SongcordFinal" component={ProtoFinal} durationInFrames={11790} fps={FPS} width={1920} height={1080} calculateMetadata={calculateMetadata} />
    <Composition id="SongcordFinal4K" component={ProtoFinal} durationInFrames={11790} fps={FPS} width={3840} height={2160} calculateMetadata={calculateMetadata} />
  </>
);
