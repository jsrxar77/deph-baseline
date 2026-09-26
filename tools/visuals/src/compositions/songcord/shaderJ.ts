import { GLSL_COMMON } from "./common";
import { SCENE_A_GLSL } from "./shaderA";
import { RIPPLES_GLSL } from "./shaderB";
import { PLATE_GLSL } from "./shaderC";
import { NT } from "./being";

// Prototype J — E made intense: the same world, ripples and cymatic filigree, rendered as linear HDR light (see
// HdrCanvas: bloom, filmic tone curve), with more saturated Pandora colours, and D's ribbons reduced to ONE being of
// light — a white-hot core with a halo — that wanders the whole frame and leaves a twisting trail that fades away.
// The world reacts to it: structure (motes, glints, filigree) brightens where the being passes.
export const FRAGMENT_J = GLSL_COMMON + SCENE_A_GLSL + RIPPLES_GLSL + PLATE_GLSL + `
#define NT ${NT}
uniform vec4 uTrail[NT];   // xy = core, zw = twist offset (the two strands are core +- zw); index 0 is the head
uniform vec2 uHead;
uniform float uHeadPower;  // brightness, follows loudness
uniform float uPulse;      // soft, capped swell on attacks (never a flash)

float segDist(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

// White-hot at the head, then teal, electric blue and violet as the trail ages and fades.
vec3 trailColor(float u){
  vec3 c = mix(vec3(1.0), PAN_TEAL * 1.7, smoothstep(0.0, 0.12, u));
  c = mix(c, PAN_BLUE * 1.6, smoothstep(0.10, 0.45, u));
  return mix(c, PAN_VIOLET * 1.5, smoothstep(0.40, 1.0, u));
}

vec3 beingLight(vec2 p){
  vec3 acc = vec3(0.0);
  for (int i = 0; i < NT - 1; i++){
    float u = (float(i) + 0.5) / float(NT - 1);
    vec4 a = uTrail[i], b = uTrail[i + 1];
    float fade = pow(1.0 - u, 1.7);
    float sig = mix(0.014, 0.004, u);
    float dc = segDist(p, a.xy, b.xy);
    float da = segDist(p, a.xy + a.zw, b.xy + b.zw);
    float db = segDist(p, a.xy - a.zw, b.xy - b.zw);
    float dm = min(dc, min(da, db));
    float g = exp(-dc * dc / (sig * sig)) * 2.2 + (exp(-da * da / (sig * sig)) + exp(-db * db / (sig * sig))) * 1.6 + exp(-dm * dm / (sig * sig * 22.0)) * 0.45;
    acc = max(acc, trailColor(u) * g * fade); // max, not sum: slow passages pack many short segments together and a sum would blow out
  }
  return acc * uHeadPower * 1.4;
}

vec3 headLight(vec2 p){
  float r = length(p - uHead);
  float r2 = r * r;
  vec3 c = vec3(1.0) * exp(-r2 / 0.00012) * 10.0;
  c += vec3(0.75, 1.0, 1.0) * exp(-r2 / 0.0009) * 2.2;
  c += PAN_TEAL * 0.9 * exp(-r2 / 0.0064);
  c += mix(PAN_VIOLET, PAN_MAGENTA, 0.5) * (1.0 / (1.0 + r2 / 0.0225)) * 0.14;
  c += PAN_BLUE * (1.0 / (1.0 + r2 / 0.20)) * 0.04;
  return c * uHeadPower * (1.0 + uPulse);
}

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float aspect = uResolution.x / uResolution.y;

  // ripples (B)
  float e = 0.004;
  float h  = heightAt(p);
  vec2 slope = vec2(heightAt(p + vec2(e, 0.0)) - h, heightAt(p + vec2(0.0, e)) - h) / e;
  vec2 pr = p + slope * 0.018;

  // how close this pixel is to the being: structure near it lights up
  float rh = length(p - uHead);
  float near = exp(-rh * rh / 0.05);

  // the world (A), seen through the water
  vec3 col = sceneA(pr);

  // cymatic filigree (C), under the water, stronger with depth
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

  // more saturated, then lit by the being
  float lum = dot(col, vec3(0.30, 0.59, 0.11));
  col = mix(vec3(lum), col, 1.45);
  col = max(col * 0.24 - 0.022, 0.0);                                 // dark world: HDR impact needs deep darks, so the lights can stand far above them
  col *= 1.0 + 1.3 * near * uHeadPower;
  col += mix(PAN_TEAL, PAN_VIOLET, 0.4) * near * 0.03 * uHeadPower;

  // the being of light (linear HDR: the core is far brighter than 1 and blooms)
  col += beingLight(p) + headLight(p);

  gl_FragColor = vec4(col, 1.0);
}
`;
