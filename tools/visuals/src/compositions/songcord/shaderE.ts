import { GLSL_COMMON } from "./common";
import { SCENE_A_GLSL } from "./shaderA";
import { RIPPLES_GLSL } from "./shaderB";
import { PLATE_GLSL } from "./shaderC";

// Prototype E — "Pandora deep": the Dive (A) is the world and the narrative; the water surface's ripples (B) refract
// that world and catch the light; the cymatic filigree (C) sits under the water and gathers as the piece goes deeper,
// so the held question at 1:17-1:28 is filled by the harmony itself, not only by attacks.
export const FRAGMENT_E = GLSL_COMMON + SCENE_A_GLSL + RIPPLES_GLSL + PLATE_GLSL + `
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float aspect = uResolution.x / uResolution.y;

  // Ripple height field and its slope (B).
  float e = 0.004;
  float h  = heightAt(p);
  vec2 slope = vec2(heightAt(p + vec2(e, 0.0)) - h, heightAt(p + vec2(0.0, e)) - h) / e;

  // The world (A), seen through the disturbed water: ripples bend the sampling position.
  vec2 pr = p + slope * 0.018;
  vec3 col = sceneA(pr);

  // Cymatic filigree (C), also refracted, weighted by depth: barely there in the light, complete in the question.
  float wC = smoothstep(0.30, 0.90, uArc) * (0.55 + 0.45 * uLevel);
  vec2 uv = pr / vec2(aspect, 1.0) + 0.5;
  float v = plate(uv, uTime);
  float line = exp(-abs(v) / (0.018 + 0.035 * (1.0 - uLevel)));
  float belly = 1.0 - exp(-v * v * 1.6);
  // filigree in violet/magenta blended with the running colour field, so it sits between the other layers' colours
  vec3 lineCol = mix(mix(PAN_VIOLET, PAN_MAGENTA, 0.4), pandoraField(pr * 1.1, 5.0), 0.35);
  col += lineCol * line * wC * 0.75;
  col += pandoraField(pr * 0.7, 6.0) * belly * wC * 0.08;

  // Glints on the ripples (B).
  vec3 n = normalize(vec3(-slope * 3.0, 1.0));
  vec3 L = normalize(vec3(-0.35, 0.55, 0.75));
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 26.0);
  // ripple glints carry their own colour (a mix of green, blue and violet that drifts across the water)
  col += pandoraField(p * 1.2, 3.0) * spec * 1.3 * (0.45 + 0.7 * uAir + 0.3 * uHighMid);
  col += pandoraField(p * 0.9 + 4.0, 4.0) * smoothstep(0.02, 0.35, length(slope)) * 0.13;

  col = 1.0 - exp(-col * 1.35);
  col *= 1.0 - 0.55 * dot(p * vec2(0.8, 1.1), p * vec2(0.8, 1.1));
  gl_FragColor = vec4(col, 1.0);
}
`;
