// GLSL shaders for Gnosis: The Transducting Rod & The Folded Manifold.
// Architecture adheres to the deph aesthetic:
// - One unified material: Quantum plasma filaments & high-density energy field.
// - One lighting model: High-dynamic-range volumetric radiation from the central grounding rod.
// - Palette "Deep Decay": Obsidian (#050508), Night Blue (#0B0E1A), Electric Cyan (#38BDF8),
//   Alchemical Amber (#FBBF24), Sapphire (#0369A1), with transient rose/ember flashes (#CB3860).

export const COMMON_GLSL = /* glsl */ `
#define PI 3.141592653589793
#define TWO_PI 6.283185307179586

mat2 rot2(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

// Deep Decay Palette in linear HDR space
vec3 deepDecay(float t) {
  vec3 c_night = pow(vec3(0.043, 0.055, 0.102), vec3(2.2));   // #0B0E1A
  vec3 c_sapphire = pow(vec3(0.012, 0.412, 0.631), vec3(2.2));// #0369A1
  vec3 c_cyan = pow(vec3(0.219, 0.741, 0.973), vec3(2.2));    // #38BDF8
  vec3 c_gold = pow(vec3(0.984, 0.749, 0.141), vec3(2.2));    // #FBBF24
  vec3 c_amber = pow(vec3(0.961, 0.619, 0.043), vec3(2.2));   // #F59E0B
  vec3 c_ember = pow(vec3(0.796, 0.220, 0.361), vec3(2.2));   // #CB3860

  float tt = fract(clamp(t, 0.0, 1.0));
  if (tt < 0.25) return mix(c_night, c_sapphire, tt / 0.25);
  if (tt < 0.50) return mix(c_sapphire, c_cyan, (tt - 0.25) / 0.25);
  if (tt < 0.75) return mix(c_cyan, c_gold, (tt - 0.50) / 0.25);
  if (tt < 0.90) return mix(c_gold, c_amber, (tt - 0.75) / 0.15);
  return mix(c_amber, c_ember, (tt - 0.90) / 0.10);
}

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
`;

// =========================================================================
// 1. THE GROUNDING ROD SHADER (Central Plasma Axis)
// =========================================================================
export const ROD_VERT = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorld = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const ROD_FRAG = /* glsl */ `
${COMMON_GLSL}

uniform float uTime;
uniform float uRodEnergy; // 0..1 overall power
uniform float uThetaPulse; // 6 Hz cerebral oscillation

varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  // Height along the axis normalized
  float yNorm = clamp((vWorld.y + 10.0) / 20.0, 0.0, 1.0);

  // Gradient: Upper celestial pole (cyan/sapphire) to lower grounding pole (gold/amber)
  vec3 topColor = vec3(0.22, 0.74, 0.97) * 1.6; // Electric Cyan
  vec3 bottomColor = vec3(0.98, 0.65, 0.10) * 1.5; // Amber Gold
  vec3 rodCore = mix(bottomColor, topColor, yNorm);

  // Core plasma turbulence
  float stream = sin(vWorld.y * 3.0 - uTime * 3.0) * cos(vUv.x * TWO_PI * 3.0 + uTime * 1.5);
  float coreHot = pow(max(0.0, 1.0 - abs(vUv.x - 0.5) * 2.0), 4.0);

  // Fresnel edge glow for volumetric feel
  vec3 viewDir = normalize(cameraPosition - vWorld);
  float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 2.0);

  vec3 col = rodCore * (0.7 + 0.3 * stream) * (1.0 + 0.15 * sin(uThetaPulse));
  col += vec3(0.8, 1.0, 1.2) * coreHot * (0.8 + 0.4 * uRodEnergy);
  col += rodCore * fresnel * 1.2;

  gl_FragColor = vec4(col * (0.5 + uRodEnergy * 0.5), 1.0);
}
`;

// =========================================================================
// 2. THE FOLDED QUANTUM MANIFOLD SHADER (500K Instanced Particles)
// =========================================================================
export const MANIFOLD_VERT = /* glsl */ `
${COMMON_GLSL}

uniform float uTime;
uniform float uProgress;    // 0..1 whole piece arc
uniform float uPhase;       // 0..4 (Pleroma, Descent, Density, Grounding, Transfiguration)
uniform float uFoldDensity; // Contraction of the manifold
uniform float uVortexPower; // Toroidal spin speed
uniform float uThetaPulse;  // 6 Hz cerebral wave
uniform float uPixelScale;  // Resolution scaling

attribute vec4 aSeed;      // x: angle, y: radius, z: height, w: unique phase

varying vec3 vColor;
varying float vAlpha;
varying float vDist;

void main() {
  float theta = aSeed.x + uTime * (0.03 + aSeed.w * 0.02) * (1.0 + uVortexPower * 2.0);
  float rBase = aSeed.y;
  float zBase = aSeed.z;

  // Multi-scale filament braids (Clifford Torus & Hopf Fibration fold)
  float u = theta;
  float v = zBase * PI;
  
  // Harmonic filament grouping
  float braid = sin(aSeed.x * 6.0 + aSeed.z * 4.0 - uTime * 0.4) * cos(aSeed.w * TWO_PI * 3.0);
  float rMod = (2.2 + 2.4 * rBase) * mix(1.3, 0.65, uFoldDensity) + 0.35 * braid;

  // Toroidal coordinates
  float tx = (rMod + 0.9 * cos(v)) * cos(u);
  float tz = (rMod + 0.9 * cos(v)) * sin(u);
  float ty = zBase * 6.5 + 0.6 * sin(u * 2.0 + v + uTime * 0.5);

  // Vertical drift toward grounding pole during descent & density
  float groundingPull = smoothstep(0.15, 0.75, uProgress);
  ty -= groundingPull * (1.5 / (0.4 + length(vec2(tx, tz))));

  // Climax vortex twist (Grounding phase)
  if (uProgress > 0.50 && uProgress < 0.92) {
    float vortexAngle = (1.2 / (0.5 + length(vec2(tx, tz)))) * 1.5;
    vec2 twisted = rot2(vortexAngle * (uProgress - 0.50) * 3.5) * vec2(tx, tz);
    tx = twisted.x;
    tz = twisted.y;
  }

  vec3 pos = vec3(tx, ty, tz);
  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

  // Size attenuation with distance for rich volumetric plasma filaments
  float distToCam = length(mvPos.xyz);
  vDist = distToCam;
  gl_PointSize = (16.0 * uPixelScale) / max(0.4, distToCam);
  gl_PointSize = clamp(gl_PointSize, 3.5, 48.0);

  // Coloring based on position along the grounding axis
  float heightT = clamp((ty + 4.5) / 9.0, 0.0, 1.0);
  float palT = mix(heightT, aSeed.w, 0.35) + 0.08 * sin(uTime * 0.15 + aSeed.x);
  
  // High-energy particle sparks
  vec3 baseCol = deepDecay(palT);
  float energySpark = pow(hash11(aSeed.w * 133.0 + floor(uTime * 2.5)), 6.0);
  
  vColor = baseCol * (1.3 + 2.5 * energySpark);
  vAlpha = (0.30 + 0.50 * aSeed.w) * mix(0.6, 1.0, uFoldDensity);

  gl_Position = projectionMatrix * mvPos;
}
`;

export const MANIFOLD_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
varying float vDist;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = exp(-d * 4.5);
  float halo = smoothstep(0.5, 0.0, d);

  vec3 finalColor = vColor * (core * 2.0 + halo * 0.7);
  gl_FragColor = vec4(finalColor, vAlpha * (core * 0.8 + halo * 0.4));
}
`;

// =========================================================================
// 3. GRADE & POST-PROCESSING SHADER (ACES HDR Roll-off & Film Optics)
// =========================================================================
export const GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uExposure: { value: 1.15 },
    uSaturation: { value: 1.28 },
    uGamma: { value: 2.2 },
    uCA: { value: 0.0007 },
    uVignette: { value: 0.8 },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uExposure;
    uniform float uSaturation;
    uniform float uGamma;
    uniform float uCA;
    uniform float uVignette;
    uniform float uTime;
    varying vec2 vUv;

    // ACES filmic tone mapping curve
    vec3 aces(vec3 x) {
      return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
    }

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      // Chromatic dispersion (edge fringing)
      vec2 shift = (vUv - 0.5) * uCA;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + shift).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - shift).b;

      // Exposure + ACES tone mapping
      vec3 mapped = aces(col * uExposure);

      // Saturation
      float lum = dot(mapped, vec3(0.2126, 0.7152, 0.0722));
      mapped = mix(vec3(lum), mapped, uSaturation);

      // Gamma correction for deep obsidian blacks
      mapped = pow(max(mapped, 0.0), vec3(1.0 / uGamma));

      // Vignette
      vec2 d = (vUv - 0.5) * vec2(1.0, 1.2);
      float vig = 1.0 - dot(d, d) * uVignette;
      mapped *= clamp(vig, 0.0, 1.0);

      // Dithering grain (eliminates 8-bit banding on dark gradients)
      float grain = (hash(gl_FragCoord.xy + fract(uTime) * 83.0) - 0.5) * (1.2 / 255.0);
      mapped += grain;

      gl_FragColor = vec4(clamp(mapped, 0.0, 1.0), 1.0);
    }
  `,
};
