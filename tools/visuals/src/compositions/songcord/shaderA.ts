import { GLSL_COMMON } from "./common";

// Prototype A — "Dive": a slow descent from the lit surface into the dark and back. Camera height IS the
// narrative curve (uArc), so the deepest point is the held question at 1:17-1:28 and the return to light is the
// resolution at 2:48. Light shafts and marine snow are world-space, so they move because the camera does.
export const SCENE_A_GLSL = `
uniform float uCamY;

float snowLayer(vec2 p, float scale, float parallax, float seed, float lit){
  vec2 q = p * scale + vec2(seed * 7.0, uCamY * parallax * scale + uTime * 0.05 * scale * 0.1);
  vec2 id = floor(q), f = fract(q) - 0.5;
  float present = step(0.72, hash21(id + seed));
  vec2 off = (hash22(id + seed * 3.0) - 0.5) * 0.7;
  float r = 0.035 + 0.07 * hash21(id + 9.0);
  float d = length(f - off);
  return present * smoothstep(r, r * 0.15, d) * lit;
}

// Soft glowing motes on a jittered grid. Neighbouring cells are sampled too, so a glow larger than its cell is not
// clipped into a square; colour is per mote (not per screen cell), so there are no tinted tiles.
vec3 glowLayer(vec2 p, float scale, float parallax, float seed, float t){
  vec2 q = p * scale + vec2(seed * 5.0 + t * 0.012 * scale, uCamY * parallax * scale);
  vec2 base = floor(q);
  vec3 acc = vec3(0.0);
  for (int j = -1; j <= 1; j++){
    for (int i = -1; i <= 1; i++){
      vec2 id = base + vec2(float(i), float(j));
      if (hash21(id + seed * 2.0) < 0.86) continue;
      vec2 pos = id + 0.5 + (hash22(id + seed) - 0.5) * 0.5;
      float d = length(q - pos);
      float pulse = 0.55 + 0.45 * sin(t * (0.4 + hash21(id) * 0.8) + hash21(id) * 6.28);
      float size = 0.55 + 0.6 * hash21(id + 5.0);
      vec3 c = mix(TEAL, CYAN, smoothstep(0.3, 0.9, hash21(id + 11.0)));
      c = mix(c, VIOLET * 2.2, 0.35 * hash21(id + 23.0));
      c = mix(c, pandoraField(pos * 0.25, seed) * 1.5, uPalette);
      acc += c * exp(-d * d / (size * size * 0.085)) * pulse;
    }
  }
  return acc;
}

vec3 sceneA(vec2 p){
  vec3 cTeal   = mix(TEAL,   mix(PAN_TEAL, pandoraField(p * 0.5, 1.0), 0.55), uPalette);
  vec3 cCyan   = mix(CYAN,   mix(PAN_BLUE, pandoraField(p * 0.5 + 3.0, 2.0), 0.55), uPalette);
  vec3 cViolet = mix(VIOLET, PAN_VIOLET * 0.55, uPalette);
  float depth = uArc;
  float light = pow(1.0 - depth, 1.3);

  // Water column: bright teal near the light, falling to obsidian as depth grows and toward the bottom of frame.
  float vy = p.y + 0.5; // 0 bottom .. 1 top
  vec3 col = mix(OBSIDIAN, NIGHT, smoothstep(0.0, 1.0, vy));
  col += mix(cTeal * 0.20, cCyan * 0.16, vy) * light * (0.35 + 0.9 * vy);
  col += cViolet * 0.35 * (1.0 - vy) * (0.4 + 0.6 * depth);

  // Light shafts from above the frame; the source recedes as we go down, so they thin out and vanish.
  vec2 src = vec2(-0.25 + 0.1 * sin(uTime * 0.04), 0.85 + 1.7 * depth);
  vec2 dv = p - src;
  float ang = atan(dv.x, -dv.y);
  float dist = length(dv);
  float shafts = fbm(vec2(ang * 7.0 + uTime * 0.03, 3.0)) * fbm(vec2(ang * 15.0 - uTime * 0.02, 9.0) + 4.0) * 2.4;
  shafts = smoothstep(0.35, 1.0, shafts);
  float rayK = shafts * exp(-dist * (0.75 + 1.2 * depth)) * light * (0.55 + 0.6 * uLevel + 0.4 * uAir);
  col += mix(cTeal, cCyan, 0.5) * rayK * 0.55 * (1.0 + 0.7 * uVivid);

  // Caustic shimmer near the surface (only when shallow).
  vec2 cp = p * 5.0 + vec2(uTime * 0.05, -uTime * 0.03);
  float caus = pow(1.0 - abs(sin(cp.x * 1.3 + fbm(cp + uTime * 0.05) * 5.0) * sin(cp.y * 1.1 + fbm(cp * 1.4 - uTime * 0.04) * 5.0)), 6.0);
  col += cCyan * caus * 0.10 * smoothstep(0.2, 0.9, vy) * pow(1.0 - depth, 2.0);

  // Marine snow, lit by the shafts and a little ambient; parallax layers.
  float ambient = 0.10 + 0.5 * rayK;
  float snow = snowLayer(p, 9.0, 0.32, 1.0, ambient) + snowLayer(p, 14.0, 0.5, 2.0, ambient * 0.9)
             + snowLayer(p, 22.0, 0.8, 3.0, ambient * 0.8) + snowLayer(p, 6.0, 0.2, 4.0, ambient * 1.1);
  col += vec3(0.75, 0.9, 1.0) * snow * 0.75;

  // Bioluminescent motes: barely there in the light, the main light source in the deep. Choir/air brightens them.
  float vis = 0.18 + 1.1 * depth;
  vec3 g = glowLayer(p, 3.5, 0.25, 1.0, uTime) + glowLayer(p, 5.5, 0.4, 2.0, uTime) * 0.8 + glowLayer(p, 8.0, 0.6, 3.0, uTime) * 0.6;
  col += g * vis * (0.55 + 0.9 * uAir + 0.5 * uLevel) * (1.0 + 1.0 * uVivid);

  return col;
}
`;

export const FRAGMENT_A = GLSL_COMMON + SCENE_A_GLSL + `
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y; // centred, y up, height = 1
  vec3 col = sceneA(p);
  col = 1.0 - exp(-col * 1.35);
  col *= 1.0 - 0.55 * dot(p * vec2(0.8, 1.1), p * vec2(0.8, 1.1));
  gl_FragColor = vec4(col, 1.0);
}
`;
