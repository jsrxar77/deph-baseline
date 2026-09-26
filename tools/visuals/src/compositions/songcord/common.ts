import { arcAt, smoothAt, type Analysis } from "./analysis";
import type { UniformValue } from "./ShaderCanvas";

// GLSL shared by every songcord prototype: uniforms measured from the audio, noise, and the Deep Decay palette.
export const GLSL_COMMON = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uLevel;   // overall loudness, 0..1, dB-linear
uniform float uSub, uBass, uLowMid, uMid, uHighMid, uAir; // band levels, 0..1
uniform float uBright;  // spectral centroid, 0..1
uniform float uWidth;   // stereo width
uniform float uArc;     // narrative depth 0 (light/calm) .. 1 (the held question)
uniform float uPalette; // 0 = deph Deep Decay, 1 = Pandora (blues, greens, violets)
uniform float uVivid;   // 0 = as designed, 1 = more intense light (prototype J)

const float PI = 3.14159265359;
const vec3 OBSIDIAN = vec3(0.020, 0.020, 0.031);
const vec3 NIGHT    = vec3(0.071, 0.094, 0.161);
const vec3 VIOLET   = vec3(0.176, 0.106, 0.306);
const vec3 TEAL     = vec3(0.122, 0.639, 0.588);
const vec3 CYAN     = vec3(0.220, 0.741, 0.973);
const vec3 EMBER    = vec3(0.796, 0.220, 0.376);

// Pandora palette (this piece only, at the user's request): deep and electric blues, bioluminescent teal and green,
// violet and a magenta-violet. pandoraField() mixes them across space and time so layers blend into each other; green
// leans to the light (arc near 0), violet to the deep (arc near 1).
const vec3 PAN_DEEP    = vec3(0.030, 0.100, 0.300);
const vec3 PAN_BLUE    = vec3(0.130, 0.420, 1.000);
const vec3 PAN_TEAL    = vec3(0.060, 0.850, 0.780);
const vec3 PAN_GREEN   = vec3(0.220, 1.000, 0.600);
const vec3 PAN_VIOLET  = vec3(0.550, 0.270, 1.000);
const vec3 PAN_MAGENTA = vec3(0.800, 0.300, 1.000);

float hash11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2  hash22(vec2 p){ return vec2(hash21(p), hash21(p + 71.3)); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1,0)), f.x), mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
vec3 pandoraField(vec2 q, float seed){
  float n1 = fbm(q * 0.8 + vec2(uTime * 0.020, seed * 3.1));
  float n2 = fbm(q * 0.65 - vec2(uTime * 0.015, seed * 5.7) + 9.0);
  float wg = smoothstep(0.38, 0.68, n1) * (1.0 - 0.65 * uArc);
  float wv = clamp(smoothstep(0.42, 0.72, n2) + 0.55 * uArc, 0.0, 1.0);
  vec3 c = mix(PAN_BLUE, PAN_TEAL, smoothstep(0.30, 0.60, n1));
  c = mix(c, PAN_GREEN, wg);
  return mix(c, mix(PAN_VIOLET, PAN_MAGENTA, n2), wv * 0.85);
}
`;

export function commonUniforms(a: Analysis, t: number, width: number, height: number): Record<string, UniformValue> {
  const f = a.frames;
  return {
    uResolution: [width, height],
    uTime: t,
    uLevel: smoothAt(a, f.rms, t, 0.5),
    uSub: smoothAt(a, f.bands.sub, t, 0.5),
    uBass: smoothAt(a, f.bands.bass, t, 0.5),
    uLowMid: smoothAt(a, f.bands.lowMid, t, 0.5),
    uMid: smoothAt(a, f.bands.mid, t, 0.5),
    uHighMid: smoothAt(a, f.bands.highMid, t, 0.5),
    uAir: smoothAt(a, f.bands.air, t, 0.5),
    uBright: smoothAt(a, f.centroid, t, 0.8),
    uWidth: smoothAt(a, f.width, t, 0.8),
    uArc: arcAt(t),
    uPalette: 0,
    uVivid: 0,
  };
}
