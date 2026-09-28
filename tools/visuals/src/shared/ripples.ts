// Stones in water (first built for Songcord as prototype B "Interference", shared since Musica Universalis uses it too):
// each sound event drops a round ripple at its own spot; the wave packets expand, fade, cross and interfere. The water
// is never drawn: heightAt() returns the surface height, and the scene lights it (refraction of what is behind, glints
// where the surface tilts toward the light — brightest where two ripples cross). Phase and interference are what "deph"
// (deep phase) is about. A pure function of time: up to N recent events come in as uniforms, each with its age.
//
// The including shader must declare `uniform float uTime;` and `float vnoise(vec2)`, and set `uSwell` (0..1, how much
// the slow ambient swell moves; Songcord drives it with the bass).
export const N_RIPPLES = 24;
export const RIPPLES_GLSL = `
#define N ${N_RIPPLES}
uniform float uSwell;
uniform vec4 uOn[N];   // x, y (centred, height = 1), age (s), strength; strength 0 = unused slot
uniform float uOnK[N]; // 0 = mid hit (wide, slow ripple), 1 = high hit (tight, fast ripple), 2 = breath (sustained sound: very wide, slow, long-lived)

float heightAt(vec2 p){
  float h = 0.006 * (vnoise(p * 1.1 + vec2(uTime * 0.02, 0.0)) - 0.5) * (0.6 + 1.2 * uSwell); // very slow, smooth ambient swell
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
