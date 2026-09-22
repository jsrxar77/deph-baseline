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

// Returns (smoothIterationRatio, insideSet ? 1.0 : 0.0, orbitTrapDistance).
vec3 juliaEscape(vec2 uv, vec2 c, float iterMax) {
  vec2 z = uv;
  float trap = 1000.0;
  for (int j = 0; j < MAX_ITER; j++) {
    if (float(j) >= iterMax) {
      return vec3(1.0, 1.0, trap); // stayed inside the set
    }
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    trap = min(trap, dot(z, z));
    float d2 = dot(z, z);
    if (d2 > 4.0) {
      float logZn = log(d2) * 0.5;
      float nu = log(logZn / log(2.0)) / log(2.0);
      return vec3((float(j) + 1.0 - nu) / iterMax, 0.0, trap);
    }
  }
  return vec3(1.0, 1.0, trap);
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
    float band = fract(result.z * 0.22 + uTime * 0.015);
    vec3 tint = palette(band * 1.4 + uColorOffset * 0.6);
    return vec4(mix(deepBg, tint, 0.35 + 0.4 * band), 1.0);
  }
  vec3 col = palette(result.x * 2.2 + uColorOffset);
  float presence = smoothstep(0.04, 0.4, result.x);
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
  vec2 touch = dephRingTouch(base, uTime);
  float crest = touch.x;
  float slope = touch.y;
  float distFromCenter = length(base);
  vec2 radialDir = distFromCenter > 0.0001 ? base / distFromCenter : vec2(0.0);
  // Slope values are large by design (an analytic gaussian derivative) — scaled way down here so
  // the ripple reads as a subtle surface disturbance, not a violent warp.
  vec2 ripple = base + radialDir * slope * 0.012;

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
  // Arc breakpoints mirror media/slow-drift/slow-drift.deph.yaml (12/24/72/48/24 cycles at 30cpm);
  // kept as plain seconds here since this shader doesn't parse Strudel or read the yaml, same as
  // the rest of this composition — update by hand if the piece's arc changes.
  // No bass-driven zoom/pan here anymore — it read as a shaky, uncomfortable "tremble" tied to the
  // sub-bass rather than a pleasant pulse (real user feedback, not a guess), so growth and the
  // slow autonomous breathing are the only things moving the camera now; uBass no longer touches it.
  float arcT = uTime / 364.0;
  float growth = smoothstep(0.0, 0.55, arcT) * (1.0 - 0.25 * smoothstep(0.85, 1.0, arcT));
  float zoom = mix(2.4, 1.25, growth) + 0.05 * sin(uTime * 0.05);

  float iterMax = uIterBase + uHigh * 40.0;

  // Chromatic aberration: evaluate the fractal three times at a tiny radial offset per channel —
  // affordable again now that there's one fractal to render, not three. Sampled from ripple, not
  // raw base, so the wave's disturbance actually distorts what's drawn, not just its highlight.
  vec2 uv = ripple * zoom;
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

  // Vignette.
  float d = length(gl_FragCoord.xy / uResolution - 0.5);
  color *= smoothstep(0.95, 0.3, d);

  // Procedural grain.
  float grain = (hash(gl_FragCoord.xy + uTime * 61.0) - 0.5) * 0.03;
  color += grain;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
