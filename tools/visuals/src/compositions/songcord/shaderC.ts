import { GLSL_COMMON } from "./common";

// Prototype C — "Cymatics": a vibrating plate of water. Each of the 12 pitch classes excites its own standing-wave
// mode, weighted by how much that note sounds right now (measured chroma), so the figure is drawn by the harmony:
// the tonic (A) is the simplest mode, and harmonic distance from it becomes geometric complexity. Nodal lines glow.
export const PLATE_GLSL = `
uniform float uChroma[12]; // pitch-class weight, 0..1 (strongest = 1)
uniform float uN[12];      // mode numbers per pitch class
uniform float uM[12];

float plate(vec2 q, float t){
  float v = 0.0;
  for (int k = 0; k < 12; k++){
    float a = uChroma[k];
    if (a < 0.02) continue;
    float w = 0.10 + 0.045 * sqrt(uN[k] * uN[k] + uM[k] * uM[k]);      // slow per-mode oscillation
    float m = cos(uN[k] * PI * q.x) * cos(uM[k] * PI * q.y) - cos(uM[k] * PI * q.x) * cos(uN[k] * PI * q.y);
    v += a * a * m * cos(w * t + float(k));
  }
  return v;
}

`;

export const FRAGMENT_C = GLSL_COMMON + PLATE_GLSL + `
void main(){
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  // a faint surface wobble so the plate reads as water, not as a flat diagram
  vec2 q = uv + 0.004 * vec2(fbm(uv * 6.0 + uTime * 0.05), fbm(uv * 6.0 - uTime * 0.04)) * (0.5 + uBass);
  float v = plate(q, uTime);
  // surface tilt from the plate height, for a lit-water look (finite differences)
  float ex = 0.003;
  vec2 grad = vec2(plate(q + vec2(ex, 0.0), uTime) - v, plate(q + vec2(0.0, ex), uTime) - v) / ex;
  vec3 nrm = normalize(vec3(-grad * 0.035, 1.0));
  float spec = pow(max(dot(reflect(-normalize(vec3(-0.4, 0.5, 0.75)), nrm), vec3(0.0, 0.0, 1.0)), 0.0), 18.0);
  float grain = hash21(floor(gl_FragCoord.xy / 2.0));  // fine grit, like sand on the plate

  float sharp = 0.022 + 0.05 * (1.0 - uLevel);
  float line = exp(-abs(v) / sharp);                 // nodal lines
  float belly = 1.0 - exp(-v * v * 1.6);             // antinode fill
  vec3 base = mix(OBSIDIAN, NIGHT, smoothstep(-0.6, 0.6, p.y));
  vec3 fill = mix(VIOLET, TEAL, smoothstep(0.0, 1.0, uBright + 0.3 * uArc)) * belly * (0.18 + 0.35 * uLevel);
  vec3 lineCol = mix(CYAN, vec3(0.85, 0.97, 1.0), 0.35 * uAir);
  vec3 col = base + fill + lineCol * line * (0.40 + 0.5 * uLevel) * (0.75 + 0.5 * grain) + TEAL * line * 0.20;
  col += CYAN * spec * 0.35 * (0.5 + 0.8 * uLevel);
  col += EMBER * 0.10 * smoothstep(0.75, 1.0, uArc) * line;   // a faint warm edge only at the held question

  col = 1.0 - exp(-col * 1.4);
  col *= 1.0 - 0.55 * dot(p * vec2(0.75, 1.1), p * vec2(0.75, 1.1));
  gl_FragColor = vec4(col, 1.0);
}
`;
