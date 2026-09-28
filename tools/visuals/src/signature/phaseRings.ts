// deph's shared visual signature: "creation torus" — 4 concentric wavefronts pulsing outward and
// inward from the frame's center, each on its own time offset (3s / 6s / 9s / 12s) within a fixed
// 30-second cycle. 3+6+9+12 = 30 is the cycle length itself, and each wave's own offset is one of
// the same 4 numbers — the design mark, not arbitrary. Fixed for every deph composition regardless
// of that piece's own tempo — for "Slow Drift" it happens to also equal its 30cpm tempo.
//
// The torus itself must be INVISIBLE as a shape — no visible ring, no glow, no circle outline.
// The piece's own content is the star and is always fully visible; the wave's only trace is what
// it does to that content as it passes over it: a local surface displacement (a real bulge, not a
// brightness change) plus a subtle directional highlight, like a real wave making a surface
// momentarily ripple where it crosses, never hiding or replacing the surface itself.
//
// (Earlier versions got this backwards twice: straight bands drawn on top read as "Hollywood
// searchlights"; a background-ring version was visible as concentric circles even in empty space;
// a "reveal" version made the *content* fade in and out with wave proximity — hiding the star
// instead of the mechanism. This version touches the content without ever hiding it or drawing a
// visible ring of its own.)
//
// Usage: a composition's fragment shader concatenates DEPH_PHASE_RINGS_GLSL into its source, then
// calls `dephRingTouch(uv, uTime)` on its *raw screen-space* UV (before that piece's own
// zoom/transform). It returns (crestHighlight, radialSlope):
//   vec2 radialDir = length(uv) > 0.0001 ? uv / length(uv) : vec2(0.0);
//   vec2 touchedUv = uv + radialDir * touch.y * LIFT_STRENGTH;  // warp sampling before zoom
//   vec3 color = contentColorAt(touchedUv);           // content is ALWAYS fully visible
//   color += touch.x * presence * crestTint;          // gate every wave effect by "is there real
//   color += touch.y * presence * SHADE_STRENGTH;     // content here" so the wave stays invisible
//                                                      // wherever it isn't touching anything real.
// `presence` is however that piece defines "how solid is my own content here" (for
// slow-drift, derived from escape speed — see shaders.ts). Tune LIFT_STRENGTH/SHADE_STRENGTH
// per composition; the raw slope values are large (an analytic gaussian derivative) by design.

export const DEPH_PHASE_RINGS_GLSL = `
const float DEPH_RING_CYCLE = 30.0; // 3 + 6 + 9 + 12 — the signature's fixed period

// Radius breathes via a single continuous sine over the full cycle (no bump/reset) so expansion
// and contraction read as one organic pulse, not a repeating mechanical loop.
float dephRingRadius(float time, float offsetSeconds, float minRadius, float maxRadius) {
  float cyclePos = (time + offsetSeconds) / DEPH_RING_CYCLE;
  return mix(minRadius, maxRadius, 0.5 + 0.5 * sin(6.28318530718 * cyclePos - 1.5707963268));
}

// Returns (crestHighlight, radialSlope), unioned (max) for the highlight and summed for slope
// across the 4 waves (overlapping wave edges should compound their surface displacement). Both are
// faded to exactly 0 within a small radius of the frame's dead center (smoothstep below) — right at
// dist=0 the "outward" direction is undefined, and without this fade a wave shrinking toward the
// center produces a visible singularity (a sharp funnel/vortex), not a subtle touch.
vec2 dephRingTouch(vec2 uv, float time) {
  float dist = length(uv);
  float crestWidth = 0.045;
  float slopeWidth = 0.20;
  float crest = 0.0;
  float slope = 0.0;

  float r0 = dephRingRadius(time, 3.0, 0.12, 1.45);
  float d0 = dist - r0;
  crest = max(crest, exp(-(d0 * d0) / (2.0 * crestWidth * crestWidth)));
  slope += -d0 / (slopeWidth * slopeWidth) * exp(-(d0 * d0) / (2.0 * slopeWidth * slopeWidth));

  float r1 = dephRingRadius(time, 6.0, 0.12, 1.45);
  float d1 = dist - r1;
  crest = max(crest, exp(-(d1 * d1) / (2.0 * crestWidth * crestWidth)));
  slope += -d1 / (slopeWidth * slopeWidth) * exp(-(d1 * d1) / (2.0 * slopeWidth * slopeWidth));

  float r2 = dephRingRadius(time, 9.0, 0.12, 1.45);
  float d2 = dist - r2;
  crest = max(crest, exp(-(d2 * d2) / (2.0 * crestWidth * crestWidth)));
  slope += -d2 / (slopeWidth * slopeWidth) * exp(-(d2 * d2) / (2.0 * slopeWidth * slopeWidth));

  float r3 = dephRingRadius(time, 12.0, 0.12, 1.45);
  float d3 = dist - r3;
  crest = max(crest, exp(-(d3 * d3) / (2.0 * crestWidth * crestWidth)));
  slope += -d3 / (slopeWidth * slopeWidth) * exp(-(d3 * d3) / (2.0 * slopeWidth * slopeWidth));

  float centerFade = smoothstep(0.0, 0.1, dist);
  return vec2(crest, slope) * centerFade;
}
`;
