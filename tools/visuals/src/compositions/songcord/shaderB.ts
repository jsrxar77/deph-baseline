import { GLSL_COMMON } from "./common";

// Prototype B — "Interference": each mid/high attack in the music drops a ripple on a dark water surface; the
// wave packets expand, cross and interfere. Phase and interference are what "deph" (deep phase) is about.
// Ripples are a pure function of time: up to N recent onsets are passed in, each with its age and strength.
export const RIPPLES_GLSL = `
#define N 24
uniform vec4 uOn[N];   // x, y (centred, height = 1), age (s), strength; strength 0 = unused slot
uniform float uOnK[N]; // 0 = mid hit (wide, slow ripple), 1 = high hit (tight, fast ripple), 2 = breath (sustained sound: very wide, slow, long-lived)

float heightAt(vec2 p){
  float h = 0.006 * (vnoise(p * 1.1 + vec2(uTime * 0.02, 0.0)) - 0.5) * (0.6 + 1.2 * uBass); // very slow, smooth ambient swell
  for (int i = 0; i < N; i++){
    vec4 o = uOn[i];
    if (o.w <= 0.0) continue;
    float k = uOnK[i];
    float r = length(p - o.xy);
    float br = step(1.5, k);                       // 1 for a breath ring
    float kk = min(k, 1.0);
    float speed = mix(mix(0.20, 0.26, kk), 0.15, br);
    float front = o.z * speed;
    float wid = mix(mix(0.13, 0.085, kk), 0.26, br);
    float d = r - front;
    float packet = exp(-d * d / (wid * wid));
    float wave = cos(mix(mix(34.0, 62.0, kk), 20.0, br) * d);
    float life = exp(-o.z * mix(mix(0.38, 0.55, kk), 0.20, br)) * smoothstep(0.0, mix(0.12, 0.8, br), o.z);
    h += o.w * life * packet * wave * mix(0.020, 0.024, br) / (1.0 + 2.2 * r);
  }
  return h;
}

`;

export const FRAGMENT_B = GLSL_COMMON + RIPPLES_GLSL + `
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float e = 0.004;
  float h  = heightAt(p);
  float hx = heightAt(p + vec2(e, 0.0)) - h;
  float hy = heightAt(p + vec2(0.0, e)) - h;
  vec2 slope = vec2(hx, hy) / e;               // surface gradient
  vec3 n = normalize(vec3(-slope * 3.0, 1.0));

  // The surface mirrors a night sky: a violet-to-teal gradient that the ripples bend.
  vec2 rp = p + n.xy * 0.55;
  float sky = smoothstep(-0.55, 0.65, rp.y + 0.15 * sin(rp.x * 2.0 + 0.6));
  vec3 base = mix(OBSIDIAN, NIGHT, smoothstep(-0.5, 0.5, p.y + 0.5));
  vec3 refl = mix(VIOLET * 0.9, TEAL, sky) * (0.05 + 0.20 * uLevel + 0.20 * uArc);
  vec3 col = base + refl * (0.35 + 0.65 * sky);

  // Specular glints where ripples tilt the surface toward the light.
  vec3 L = normalize(vec3(-0.35, 0.55, 0.75));
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 26.0);
  float rim = smoothstep(0.02, 0.35, length(slope));
  col += CYAN * spec * 1.35 * (0.6 + 0.8 * uAir + 0.4 * uHighMid);
  col += TEAL * rim * 0.12;
  
  col = 1.0 - exp(-col * 1.5);
  col *= 1.0 - 0.6 * dot(p * vec2(0.75, 1.1), p * vec2(0.75, 1.1));
  gl_FragColor = vec4(col, 1.0);
}
`;
