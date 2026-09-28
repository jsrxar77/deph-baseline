import { DEPH_PHASE_RINGS_GLSL } from "../../signature/phaseRings";

// GLSL for the "deph / Deep Decay" Julia-set visualizer for Slow Drift.
// Single fractal, filling the frame — tried a 3-blob layout with a self-similar zoom-in/zoom-out
// cycle first, but it read as mechanical and disconnected from the music (a repeating camera
// gimmick, not something following the piece's arc), so this went back to one continuously
// transforming shape instead. "Growth" now comes from `growth(t)`, a one-way (not cyclic) function
// of position in the piece's 364s duration: the view is more compact during the intro and expands
// through development into the climax, easing back slightly for the outro — tied to the arc, not a
// fixed-period loop.

export const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `
precision highp float;

${DEPH_PHASE_RINGS_GLSL}

uniform vec2 uResolution;
uniform float uTime;       // seconds since composition start
uniform float uBass;       // 0-1, sub-bass energy (drone/sub voices)
uniform float uMid;        // 0-1, mid energy (pad/drone body)
uniform float uHigh;       // 0-1, high energy (bells/transients)
uniform float uColorOffset; // slow, continuous palette phase cycle
uniform float uIterBase;   // base iteration depth, before uHigh modulation
uniform vec2 uSeed;        // fixed per-composition Julia-constant anchor
uniform vec2 uCam;         // camera center in fractal space (framing.ts)
uniform vec4 uBells[6];    // active bell pulses: x, y (screen space), age in seconds, amplitude (0 = unused)
uniform float uSignature;  // 1 = creation-torus ripple on, 0 = off (see SIGNATURE_ENABLED in FractalVisualizer.tsx)

const int MAX_ITER = 340; // hard cap so uHigh modulation can't blow the render budget

// Five stops, not four: cx is a deliberately disruptive rose/ember accent inserted as a brief
// band between the night-blue and cosmic-violet stops — an anomaly within the otherwise cool
// "Deep Decay" palette, not a full extra hue family, so it reads as a flash rather than a new theme.
vec3 palette(float t) {
  vec3 c1 = vec3(0.0706, 0.0941, 0.1608); // #121829 blue noche desaturado
  vec3 c2 = vec3(0.1765, 0.1059, 0.3059); // #2d1b4e violeta cosmico
  vec3 cx = vec3(0.7961, 0.2196, 0.3608); // #cb3860 disruptive rose/ember accent
  vec3 c3 = vec3(0.1216, 0.6392, 0.5882); // #1fa396 verde cobre oxidado
  vec3 c4 = vec3(0.2196, 0.7412, 0.9725); // #38bdf8 cian electrico
  float tt = fract(t);
  if (tt < 0.20) return mix(c1, c2, tt / 0.20);
  if (tt < 0.28) return mix(c2, cx, (tt - 0.20) / 0.08);
  if (tt < 0.36) return mix(cx, c2, (tt - 0.28) / 0.08);
  if (tt < 0.60) return mix(c2, c3, (tt - 0.36) / 0.24);
  if (tt < 0.85) return mix(c3, c4, (tt - 0.60) / 0.25);
  return mix(c4, c1, (tt - 0.85) / 0.15);
}

// Returns (smoothIterationCount, insideSet ? 1.0 : 0.0, orbitTrapDistance). The count is absolute
// (not divided by iterMax): far-away points escape in a few iterations and near-boundary points take
// many, so a color cycle over the raw count draws contour bands that hug the set's shape at EVERY
// distance. Dividing by iterMax (the earlier version) squashed all exterior points into one tiny
// range of the palette, which is what left the space around the fractal as flat, empty gradient.
vec3 juliaEscape(vec2 uv, vec2 c, float iterMax) {
  vec2 z = uv;
  vec2 dz = vec2(1.0, 0.0);
  float step2 = 1.0;
  for (int j = 0; j < MAX_ITER; j++) {
    if (float(j) >= iterMax) break;
    vec2 zNext = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    dz = zNext - z;
    step2 = dot(dz, dz);
    z = zNext;
    float d2 = dot(z, z);
    if (d2 > 256.0) {
      float logZn = log(d2) * 0.5;
      float nu = log(logZn / log(2.0)) / log(2.0);
      return vec3(float(j) + 1.0 - nu, 0.0, 0.0);
    }
    // Converged to an attracting point (threshold sits above float32 rounding noise, ~1e-14).
    if (step2 < 1e-12) break;
  }
  // Interior. Two continuous dynamical quantities, both smooth across the whole basin even when the
  // orbit converges too slowly to ever stop (|multiplier| near 1 — which is exactly when the basin is
  // huge and the frame would otherwise be one flat color, leaving only the signature rings visible):
  //   x = how far the orbit still is from settling (-log of its last step), which contours the basin
  //       around its attractor, and
  //   z = the direction of that last step, which winds around the attractor and, combined with x,
  //       draws spiral arms rather than plain rings.
  return vec3(-log(max(step2, 1e-14)), 1.0, atan(dz.y, dz.x));
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Interior coloring is banded (fract of the trap distance), not a single lerp toward flat black —
// a basin whose orbit trap value happens to be large would otherwise render as flat black
// regardless of iteration depth. Banding guarantees visible structure (rings) everywhere, with at
// least a 35% color floor. Returns (color, presence): interior and boundary are "presence 1" (this
// is the piece's own real content), but far exterior points — fast-escaping "open sky" with no
// fractal structure — fade toward presence 0. This is what lets the signature wave stay invisible
// in open space (see below): it should only be seen interacting with real content, not as a shape
// of its own floating in empty background.
vec4 colorAt(vec2 uv, vec2 c, float iterMax) {
  vec3 result = juliaEscape(uv, c, iterMax);
  vec3 deepBg = vec3(0.0196, 0.0196, 0.0314); // #050508 obsidiana profunda
  if (result.y > 0.5) {
    // Interior: palette cycles over the convergence count (see juliaEscape), same language as the
    // exterior bands, so a frame that lands inside a large basin still carries color and rhythm.
    // Exactly 2 palette cycles around the full angle (2/(2*pi)) so there is no seam at the atan branch cut.
    float phase = result.x * 0.11 + result.z * 0.31831 + uTime * 0.012 + uColorOffset;
    vec3 tint = palette(phase);
    float ring = 0.5 + 0.5 * smoothstep(0.0, 1.0, fract(result.x * 0.6));
    return vec4(mix(deepBg, tint, 0.4 + 0.5 * ring), 1.0);
  }
  // Exterior: palette cycles over the absolute escape count (contour bands hugging the set), with a
  // gentle brightness ripple from the orbit trap so the bands read as filigree, not flat stripes.
  float bandPhase = result.x * 0.085 + uColorOffset;
  vec3 col = palette(bandPhase);
  col *= 0.72 + 0.28 * smoothstep(0.0, 1.0, fract(result.x * 0.5));
  // Only the very far, near-instant-escape region counts as "open sky" for the signature's gating.
  float presence = smoothstep(1.0, 5.0, result.x);
  return vec4(col, presence);
}

void main() {
  vec2 base = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);

  // deph's shared signature layer. The fractal is the star and is ALWAYS fully visible — think of
  // it as a fractal printed on the surface of water: the wave never hides or reveals it, it only
  // makes that surface ripple where it currently passes (a real displacement + a subtle highlight),
  // the way real water disturbs a floating image without ever removing it. The torus itself has no
  // visible shape of its own — see the presence-gating below. Screen-space, before this piece's own
  // zoom/growth transform, so the waves stay a consistent size/speed regardless of how zoomed the
  // content is. See tools/visuals/src/signature/phaseRings.ts.
  vec2 touch = dephRingTouch(base, uTime) * uSignature;
  float crest = touch.x;
  float slope = touch.y;
  float distFromCenter = length(base);
  vec2 radialDir = distFromCenter > 0.0001 ? base / distFromCenter : vec2(0.0);
  // Slope values are large by design (an analytic gaussian derivative) — scaled way down here so
  // the ripple reads as a subtle surface disturbance, not a violent warp.
  vec2 ripple = base + radialDir * slope * 0.012;

  // Bell pulses (bellPulses.ts): each bell lifts the fractal's surface where it sounds — a soft swell that
  // pulls the sampling toward the bell's position (a lens-like bulge, not a ring) plus a gentle cool glow.
  // Fast-ish rise, then a long fade matching the bell's own tail. Never a shape of its own: it only
  // exists as an effect on the fractal, and it is deliberately subtle.
  float bellGlow = 0.0;
  for (int k = 0; k < 6; k++) {
    vec4 bell = uBells[k];
    if (bell.w > 0.0) {
      vec2 toBell = base - bell.xy;
      float d = length(toBell);
      float radius = 0.11 + 0.32 * (1.0 - exp(-bell.z / 2.2));
      float soft = exp(-(d * d) / (radius * radius));
      float env = smoothstep(0.0, 0.3, bell.z) * exp(-bell.z / 2.6) * bell.w;
      bellGlow += soft * env;
      ripple -= (d > 0.0001 ? toBell / d : vec2(0.0)) * soft * env * 0.018;
    }
  }

  // Autonomous drift — the main source of visible change, fast enough to matter within seconds.
  // Amplitude is deliberately small: the Mandelbrot-set boundary (where c has to sit for the Julia
  // set to be visually rich) is infinitely thin, and uSeed sits right on it — a larger amplitude
  // (0.22, tried earlier) spent most of its time in visually "boring" territory (deep inside, or
  // disconnected/dust-like) instead of near that rich boundary. uMid nudges it further, smoothed
  // upstream (useAudioBands.ts) so it stays organic, not jittery. Amplitude is kept small on
  // purpose in a second sense too, not just to stay near the rich boundary region: past a certain
  // drift distance from uSeed, c crosses out of the Mandelbrot set's connected locus entirely and
  // the Julia set stops being one connected shape — it shatters into scattered disconnected
  // fragments ("dust"), which is what read as stray "manchas" appearing after ~2 minutes with the
  // previous, larger amplitude. This range was checked by rendering across the full piece and
  // confirming the shape stays connected throughout, not assumed from the math alone.
  vec2 c = uSeed
    + 0.022 * vec2(cos(uTime * 0.035), sin(uTime * 0.045))
    + 0.004 * uMid * vec2(cos(uTime * 0.12), sin(uTime * 0.1));

  // Growth: a one-way function of position in the piece (not a repeating cycle) — compact during
  // the intro, expanding through development into the climax, easing back slightly for the outro.
  // Arc breakpoints mirror media/slow-drift/slow-drift.yaml (12/24/72/48/24 cycles at 30cpm);
  // kept as plain seconds here since this shader doesn't parse Strudel or read the yaml, same as
  // the rest of this composition — update by hand if the piece's arc changes.
  // No bass-driven zoom/pan here anymore — it read as a shaky, uncomfortable "tremble" tied to the
  // sub-bass rather than a pleasant pulse (real user feedback, not a guess), so growth and the
  // slow autonomous breathing are the only things moving the camera now; uBass no longer touches it.
  float arcT = uTime / 364.0;
  float growth = smoothstep(0.0, 0.55, arcT) * (1.0 - 0.25 * smoothstep(0.85, 1.0, arcT));
  float zoom = mix(1.05, 0.5, growth) * (1.0 + 0.05 * sin(uTime * 0.05));

  float iterMax = uIterBase + uHigh * 40.0;

  // Chromatic aberration: evaluate the fractal three times at a tiny radial offset per channel —
  // affordable again now that there's one fractal to render, not three. Sampled from ripple, not
  // raw base, so the wave's disturbance actually distorts what's drawn, not just its highlight.
  // Camera target comes from framing.ts (uCam): a precomputed continuous path that keeps the frame on
  // the richest part of the set as c drifts — see that file for why a fixed target doesn't work.
  vec2 uv = ripple * zoom + uCam;
  float aberration = 0.0018 * length(ripple);
  vec2 dir = length(ripple) > 0.0001 ? normalize(ripple) : vec2(0.0);

  float r = colorAt(uv + dir * aberration, c, iterMax).r;
  vec4 g = colorAt(uv, c, iterMax);
  float b = colorAt(uv - dir * aberration, c, iterMax).b;
  vec3 fractalColor = vec3(r, g.g, b);
  float presence = g.a;

  // The fractal is always fully visible — it's the star, never hidden or gated by the wave. Only
  // the wave's own trace (the crest highlight and the directional relief shading) is gated by
  // presence, so *that* stays invisible in empty space (no floating ring/circle of its own) while
  // still showing up wherever it actually disturbs the fractal's real surface.
  vec3 color = fractalColor;
  color += crest * presence * vec3(0.8, 0.95, 1.0) * 0.35; // subtle highlight tracing the wavefront
  // Directional relief shading — signed, so one side of each ripple is lit and the other shadowed,
  // like real light catching a wave crossing a water surface.
  color += slope * presence * 0.025;

  color += bellGlow * vec3(0.55, 0.85, 1.0) * 0.32;

  // Vignette.
  float d = length(gl_FragCoord.xy / uResolution - 0.5);
  color *= smoothstep(1.25, 0.45, d);

  // Procedural grain.
  float grain = (hash(gl_FragCoord.xy + uTime * 61.0) - 0.5) * 0.03;
  color += grain;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
