import { RIPPLES_GLSL } from "../../shared/ripples";

// GLSL for Musica Universalis, a scene for HdrCanvas (linear light in; bloom, ACES and the SDR grade out). Built the
// way Songcord is built, because what makes Songcord work is that it is one scene, not stacked layers:
//   1. a world with texture and depth — here space, not Songcord's sea: a dark nebula and star dust at four depths
//      (tiny and sharp far away, large and out of focus up close), more of it as the piece opens;
//   2. water in front of it: a slow swell that bends everything, and the stones (shared/ripples.ts) — never drawn,
//      only seen through what they bend (refraction) and the light they catch (glints, brightest where ripples cross);
//   3. the beings of light (Songcord's, several, on 3D orbits: beings.ts), seen through the same water, lighting the
//      world, the dust and the glints around them.

export const NT = 32; // trail samples per being (Songcord's value)

export const FRAGMENT = (nb: number) => `
in vec2 vUv;
uniform vec2 uRes;
uniform float uTime, uArc, uMonochord, uLevel;
uniform vec4 uTrail[${nb * NT}];   // per being, head first: x, y, perspective scale (1 = screen plane, >1 nearer), unused
uniform float uPower[${nb}];       // how lit each being is (0 = not yet / no longer there)
uniform float uPulse[${nb}];       // a lead bell makes a being swell, capped (never a flash)

float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ return vec2(hash21(p), hash21(p + 71.3)); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int k = 0; k < 5; k++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }

const vec3 DEEP   = vec3(0.012, 0.018, 0.060);
const vec3 BLUE   = vec3(0.16, 0.34, 1.00);
const vec3 TURQ   = vec3(0.10, 0.85, 0.86);
const vec3 AQUA   = vec3(0.20, 1.00, 0.75);
const vec3 VIOLET = vec3(0.46, 0.22, 1.00);
const vec3 PALE   = vec3(0.80, 0.92, 1.00);

${RIPPLES_GLSL}

// Songcord's refraction swell: a slow large swell plus medium ripples and a fine shimmer, never a shake.
vec2 waterWarp(vec2 p){
  float t = uTime;
  vec2 w = 0.02 * vec2(sin(p.y * 3.1 + t * 0.55 + sin(p.x * 1.7 + t * 0.30)), cos(p.x * 2.6 - t * 0.47 + sin(p.y * 2.1 - t * 0.25)));
  vec2 q = p * 4.2;
  w += 0.012 * vec2(vnoise(q + vec2(t * 0.25, -t * 0.20)) - 0.5, vnoise(q + 7.3 - vec2(t * 0.20, t * 0.30)) - 0.5) * 2.0;
  w += 0.005 * vec2(sin(p.y * 13.0 + t * 1.1), cos(p.x * 11.0 - t * 0.9));
  return w * (0.7 + 0.5 * uLevel);
}

vec3 nebula(vec2 p){
  float t = uTime * 0.016;
  vec2 q = vec2(fbm(p * 1.15 + t), fbm(p * 1.15 - t + 5.2));
  float n = fbm(p * 1.6 + 1.5 * q + vec2(0.6 * t, -0.35 * t));
  vec3 c = DEEP;
  c += VIOLET * 0.08 * smoothstep(0.35, 0.9, n);
  c += TURQ * 0.04 * smoothstep(0.45, 0.95, q.y);
  return c;
}

// One depth of star dust (Songcord's mote technique: a jittered grid, neighbouring cells sampled so a glow larger than
// its cell is never clipped into a square). Nearer layers: bigger, softer (out of focus), drifting faster — that
// difference in drift between depths is the parallax, with no camera move. density: share of cells that hold a mote.
vec3 dust(vec2 p, float scale, float drift, float seed, float size, float density){
  vec2 q = p * scale + vec2(uTime * drift, uTime * drift * 0.3) + seed * 7.0;
  vec2 base = floor(q);
  vec3 acc = vec3(0.0);
  for (int j = -1; j <= 1; j++){
    for (int i = -1; i <= 1; i++){
      vec2 id = base + vec2(float(i), float(j));
      if (hash21(id + seed * 2.0) > density) continue;
      vec2 pos = id + 0.5 + (hash22(id + seed) - 0.5) * 0.7;
      float d = length(q - pos);
      float h = hash21(id + 5.0);
      float twinkle = 0.6 + 0.4 * sin(uTime * (0.4 + 0.8 * h) + h * 6.28);
      float sz = size * (0.5 + 0.8 * hash21(id + 9.0));
      vec3 c = mix(BLUE, TURQ, smoothstep(0.2, 0.8, h));
      c = mix(c, VIOLET, 0.5 * hash21(id + 23.0));
      c = mix(c, PALE, 0.35 * hash21(id + 31.0));
      acc += c * exp(-d * d / (sz * sz)) * twinkle;
    }
  }
  return acc;
}

vec3 world(vec2 p){
  float fill = mix(0.05, 0.16, uArc) * (1.0 - 0.5 * uMonochord);   // more dust as the piece opens, less as it resolves
  vec3 c = nebula(p);
  c += dust(p, 34.0, 0.03, 1.0, 0.07, fill * 1.4) * 0.35;           // far: tiny, sharp, dim
  c += dust(p, 16.0, 0.06, 2.0, 0.10, fill) * 0.45;
  c += dust(p, 7.0, 0.10, 3.0, 0.16, fill * 0.8) * 0.30;             // near: bigger, softer
  c += dust(p, 2.8, 0.13, 4.0, 0.34, fill * 0.5) * 0.10;             // nearest: large out-of-focus discs
  return c;
}

// The beings of light, drawn exactly as Songcord's (compositions/songcord/shader.ts, beamLight + headLight), one per
// being and scaled by depth: s (the perspective scale, 1 = screen plane) widens and brightens a being as it comes near.
// uTrail[b * NT + i]: i = 0 is the head, NT - 1 the oldest point; xy = position, z = s.
vec3 trailColor(float u){
  vec3 c = mix(vec3(1.0), TURQ * 1.7, smoothstep(0.0, 0.12, u));
  c = mix(c, BLUE * 1.6, smoothstep(0.10, 0.45, u));
  return mix(c, VIOLET * 1.5, smoothstep(0.40, 1.0, u));
}

float segDist(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  return length(pa - ba * h);
}

// One smooth beam: wide and white at the head, tapering through teal and blue to violet, fading along the trail.
// Segments combine with max, not a sum (a sum blows out the head where the trail packs tightly).
vec3 beamLight(int b, vec2 p){
  vec3 acc = vec3(0.0);
  int base = b * ${NT};
  for (int i = 0; i < ${NT} - 1; i++){
    vec4 A = uTrail[base + i], B = uTrail[base + i + 1];
    float u = (float(i) + 0.5) / float(${NT} - 1);
    float fade = pow(1.0 - u, 1.6);
    float s = 0.5 * (A.z + B.z);
    float sig = mix(0.012, 0.0028, u) * s;
    float d = segDist(p, A.xy, B.xy);
    float g = exp(-d * d / (sig * sig)) * 2.6 + exp(-d * d / (sig * sig * 30.0)) * 0.55;
    acc = max(acc, trailColor(u) * g * fade * s * s);
  }
  return acc * 1.4;
}

// The head: a white-hot core, its halo, and a flare stretched along the direction of travel (not a round blob).
vec3 headLight(int b, vec2 p){
  int base = b * ${NT};
  vec2 head = uTrail[base].xy;
  float s = uTrail[base].z;
  vec2 dir = normalize(head - uTrail[base + 3].xy + vec2(1e-5));
  vec2 d = (p - head) / s;
  float par = dot(d, dir), perp = dot(d, vec2(-dir.y, dir.x));
  float r2 = dot(d, d);
  vec3 c = vec3(1.0) * exp(-r2 / 0.00012) * 10.0;
  c += vec3(0.75, 1.0, 1.0) * exp(-r2 / 0.0009) * 2.2;
  c += vec3(0.6, 0.95, 1.0) * exp(-(par * par) / 0.0036 - (perp * perp) / 0.00006) * 1.6;
  c += TURQ * 0.9 * exp(-r2 / 0.0064);
  c += VIOLET * (1.0 / (1.0 + r2 / 0.0225)) * 0.14;
  c += BLUE * (1.0 / (1.0 + r2 / 0.20)) * 0.04;
  return c * s * s;
}

// How much being light reaches a point, as Songcord's near term: the world, the dust and the glints around a being catch
// its light — what makes it one scene.
float beingLight(vec2 p){
  float l = 0.0;
  for (int b = 0; b < ${nb}; b++){
    if (uPower[b] < 0.004) continue;
    vec4 h = uTrail[b * ${NT}];
    vec2 d = p - h.xy;
    l += uPower[b] * exp(-dot(d, d) / (0.05 * h.z * h.z));
  }
  return min(l, 1.0);
}

void main(){
  vec2 p0 = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  vec2 p = p0 + waterWarp(p0);

  // the stones: the surface height and its slope
  float e = 0.004;
  float h = heightAt(p);
  vec2 slope = vec2(heightAt(p + vec2(e, 0.0)) - h, heightAt(p + vec2(0.0, e)) - h) / e;
  vec2 pr = p + slope * 0.018;                                   // refraction: the world bends under a passing ripple

  float near = beingLight(p);
  vec3 col = world(pr);

  // glints where the surface tilts toward the light; two crossing ripples tilt it most, so crossings shine as points
  vec3 n = normalize(vec3(-slope * 3.0, 1.0));
  vec3 L = normalize(vec3(-0.35, 0.55, 0.75));
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 26.0);
  col += mix(TURQ, PALE, 0.55) * spec * 0.8 * (0.5 + 0.5 * uLevel) * (1.0 + 2.0 * near);
  col += mix(BLUE, TURQ, 0.5) * smoothstep(0.02, 0.35, length(slope)) * 0.05;

  // Songcord's key step: the world is scaled down and given a black level BEFORE the lights, so the beings stand
  // above real darks (without it the frame washed out to milky white with several beings lighting it).
  col = max(col * 0.5 - 0.01, 0.0);

  // lit by the beings, then the beings themselves (through the same water: their light wavers with it)
  col *= 1.0 + 1.3 * near;
  col += mix(TURQ, VIOLET, 0.4) * near * 0.03;
  for (int b = 0; b < ${nb}; b++){
    if (uPower[b] < 0.004) continue;
    col += (beamLight(b, p) + headLight(b, p)) * uPower[b] * (1.0 + uPulse[b]);
  }

  float hl = max(col.r, max(col.g, col.b));
  if (hl > 3.0) col *= (3.0 + 1.2 * log(1.0 + (hl - 3.0) / 1.2)) / hl;

  gl_FragColor = vec4(col, 1.0);
}
`;
