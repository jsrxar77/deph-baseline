import { GLSL_COMMON } from "./common";
import { SCENE_A_GLSL } from "./shaderA";
import { RIPPLES_GLSL } from "./shaderB";
import { PLATE_GLSL } from "./shaderC";
import { NT } from "./being";

// Prototype K — J seen through water. Two changes from J, both from the user's review:
//  1. The being of light is a single smooth BEAM: no twisting strands, just a tapering streak with a soft halo, and an
//     elongated flare along its direction of travel, still fading over the trail length.
//  2. Everything (the light shafts and motes of A, the cymatic filigree of C, the ripples, and the beam itself) is seen
//     through moving water: one shared refraction warp displaces every layer, caustics dance over the image, colour
//     is absorbed toward blue-green and disperses slightly at the edges (see HdrCanvas `ca`).
export const FRAGMENT_K = GLSL_COMMON + SCENE_A_GLSL + RIPPLES_GLSL + PLATE_GLSL + `
#define NT ${NT}
uniform vec4 uTrail[NT];   // xy = core; zw unused (0) in K; index 0 is the head
uniform vec2 uHead;
uniform float uHeadPower;
uniform float uPulse;

// Refraction: a slow large swell plus medium ripples, gently driven by the sound (never a shake).
vec2 waterWarp(vec2 p){
  float t = uTime;
  vec2 w = 0.022 * vec2(sin(p.y * 3.1 + t * 0.55 + sin(p.x * 1.7 + t * 0.30)), cos(p.x * 2.6 - t * 0.47 + sin(p.y * 2.1 - t * 0.25)));
  vec2 q = p * 4.2;
  w += 0.013 * vec2(vnoise(q + vec2(t * 0.25, -t * 0.20)) - 0.5, vnoise(q + 7.3 - vec2(t * 0.20, t * 0.30)) - 0.5) * 2.0;
  w += 0.006 * vec2(sin(p.y * 13.0 + t * 1.1), cos(p.x * 11.0 - t * 0.9)) * (0.4 + 0.6 * (1.0 - uArc)); // finer shimmer near the light
  return w * (0.8 + 0.5 * uLevel + 0.4 * uBass);
}

// Caustics: the bright network of light made by a moving surface. Two warped ridged-noise layers multiplied, so the
// light only survives where both ridges meet: thin, moving, interlocking lines (bounded 0..1 by construction).
float caustic(vec2 p){
  float t = uTime;
  vec2 q = p * 3.0;
  vec2 w = vec2(vnoise(q * 0.7 + vec2(t * 0.20, 0.0)), vnoise(q * 0.7 + vec2(0.0, t * 0.17) + 5.0)) - 0.5;
  float r1 = 1.0 - abs(2.0 * vnoise(q + w * 1.6 + vec2(t * 0.30, -t * 0.22)) - 1.0);
  float r2 = 1.0 - abs(2.0 * vnoise(q * 1.3 - w * 1.6 + vec2(-t * 0.26, t * 0.31) + 11.0) - 1.0);
  return clamp(pow(r1 * r2, 5.0) * 2.2, 0.0, 1.0);
}

float segDist(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

vec3 trailColor(float u){
  vec3 c = mix(vec3(1.0), PAN_TEAL * 1.7, smoothstep(0.0, 0.12, u));
  c = mix(c, PAN_BLUE * 1.6, smoothstep(0.10, 0.45, u));
  return mix(c, PAN_VIOLET * 1.5, smoothstep(0.40, 1.0, u));
}

// One smooth beam: a tapering streak plus a wider soft glow, fading with age. Max, not sum (see J).
vec3 beamLight(vec2 p){
  vec3 acc = vec3(0.0);
  for (int i = 0; i < NT - 1; i++){
    float u = (float(i) + 0.5) / float(NT - 1);
    float fade = pow(1.0 - u, 1.6);
    float sig = mix(0.012, 0.0028, u);
    float d = segDist(p, uTrail[i].xy, uTrail[i + 1].xy);
    float g = exp(-d * d / (sig * sig)) * 2.6 + exp(-d * d / (sig * sig * 30.0)) * 0.55;
    acc = max(acc, trailColor(u) * g * fade);
  }
  return acc * uHeadPower * 1.4;
}

vec3 headLight(vec2 p){
  vec2 dir = normalize(uTrail[0].xy - uTrail[3].xy + vec2(1e-5));
  vec2 d = p - uHead;
  float par = dot(d, dir), perp = dot(d, vec2(-dir.y, dir.x));
  float r2 = dot(d, d);
  vec3 c = vec3(1.0) * exp(-r2 / 0.00012) * 10.0;
  c += vec3(0.75, 1.0, 1.0) * exp(-r2 / 0.0009) * 2.2;
  c += vec3(0.6, 0.95, 1.0) * exp(-(par * par) / 0.0036 - (perp * perp) / 0.00006) * 1.6;   // elongated flare along the direction of travel
  c += PAN_TEAL * 0.9 * exp(-r2 / 0.0064);
  c += mix(PAN_VIOLET, PAN_MAGENTA, 0.5) * (1.0 / (1.0 + r2 / 0.0225)) * 0.14;
  c += PAN_BLUE * (1.0 / (1.0 + r2 / 0.20)) * 0.04;
  return c * uHeadPower * (1.0 + uPulse);
}

void main(){
  vec2 p0 = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float aspect = uResolution.x / uResolution.y;

  // everything below is seen through the same moving water
  vec2 p = p0 + waterWarp(p0);

  // ripples (B)
  float e = 0.004;
  float h  = heightAt(p);
  vec2 slope = vec2(heightAt(p + vec2(e, 0.0)) - h, heightAt(p + vec2(0.0, e)) - h) / e;
  vec2 pr = p + slope * 0.018;

  float rh = length(p - uHead);
  float near = exp(-rh * rh / 0.05);

  // the world (A) and the cymatic filigree (C), both through the water
  vec3 col = sceneA(pr);
  float wC = smoothstep(0.30, 0.90, uArc) * (0.55 + 0.45 * uLevel);
  vec2 uv = pr / vec2(aspect, 1.0) + 0.5;
  float v = plate(uv, uTime);
  float line = exp(-abs(v) / (0.016 + 0.030 * (1.0 - uLevel)));
  float belly = 1.0 - exp(-v * v * 1.6);
  vec3 lineCol = mix(mix(PAN_VIOLET, PAN_MAGENTA, 0.4), pandoraField(pr * 1.1, 5.0), 0.35);
  col += lineCol * line * wC * (1.1 + 1.6 * near);
  col += pandoraField(pr * 0.7, 6.0) * belly * wC * 0.10;

  // glints on the ripples
  vec3 n = normalize(vec3(-slope * 3.0, 1.0));
  vec3 L = normalize(vec3(-0.35, 0.55, 0.75));
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 26.0);
  col += pandoraField(p * 1.2, 3.0) * spec * 3.2 * (0.45 + 0.7 * uAir + 0.3 * uHighMid) * (1.0 + 3.0 * near);
  col += pandoraField(p * 0.9 + 4.0, 4.0) * smoothstep(0.02, 0.35, length(slope)) * 0.20;

  // caustics: light through the moving surface, strongest toward the light (top of frame, shallow arc)
  float shallow = smoothstep(-0.45, 0.5, p0.y) * (0.35 + 0.65 * pow(1.0 - uArc, 1.4));
  float ca = caustic(p * 1.05);
  col *= 0.80 + 0.95 * ca * shallow;
  col += mix(PAN_TEAL, PAN_BLUE, 0.4) * ca * shallow * 1.1;

  // more saturated, water absorbs red (toward blue-green), then lit by the being
  float lum = dot(col, vec3(0.30, 0.59, 0.11));
  col = mix(vec3(lum), col, 1.45);
  col *= vec3(0.86, 1.0, 1.08);
  col = max(col * 0.24 - 0.022, 0.0);
  col *= 1.0 + 1.3 * near * uHeadPower;
  col += mix(PAN_TEAL, PAN_VIOLET, 0.4) * near * 0.03 * uHeadPower;

  // the being of light, through the same water (its beam wavers)
  col += beamLight(p) + headLight(p);

  gl_FragColor = vec4(col, 1.0);
}
`;
