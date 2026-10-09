// The Field — one material: grains of quartz on a square vibrating plate (the "table"). Every grain's position is a pure
// function of time, computed on the GPU (no state carried between frames, so parallel render workers agree). The grains
// are the same, and the same number, from the first frame to the last; nothing appears from nowhere:
//   1. scattered at its home on the plate, jumping with the notes (Vibration);
//   2. on the nodal lines of the plate's current mode — reached by Newton steps on the mode's field, f = 0, from its home —
//      and sliding to the next mode's lines when a new note sets a new figure (Frequency). The figures are real: Chladni's
//      square-plate modes, f = cos(n pi x) cos(m pi y) - cos(m pi x) cos(n pi y), each chosen by the note's frequency;
//   3. leaving the plate one by one and rising into the canon's rings, one ring group per voice, turning at that voice's
//      speed — the plate empties as the geometry fills (Geometry);
//   4. forming the rings of a three-dimensional Flower of Life — 19 spheres drawn as rings of grains (the whole); the plate
//      under it shows only its real shadow, cast by the one light;
//   5. falling back to the plate, re-forming a figure, then scattering (Return).
// Colour is nacre, spatially coherent: a gradient from the plate's centre outward, and one region of the palette per
// canon voice in the air.

export const N_BELLS = 8;

const COMMON = /* glsl */ `
#define PI 3.141592653589793
const float R = 0.19;          // Flower of Life cell (sphere) radius
const float PLATE = 1.0;       // the plate spans [-PLATE, PLATE] in x and z

vec2 hexAt(float r, float k, float off) { float a = PI / 3.0 * k + off; return r * vec2(cos(a), sin(a)); }
// Centre of sphere i (0..18), before its group's rotation: centre, 6 at R, 6 at R*sqrt3 (turned 30 deg), 6 at 2R.
vec2 flowerCentre(int i) {
  if (i == 0) return vec2(0.0);
  if (i < 7) return hexAt(R, float(i - 1), 0.0);
  if (i < 13) return hexAt(R * 1.7320508, float(i - 7), PI / 6.0);
  return hexAt(2.0 * R, float(i - 13), 0.0);
}
// Group of sphere i, following the canon: 0 cantus (ring at R*sqrt3), 1 middle (ring at 2R), 2 high (Seed of Life).
int groupOf(int i) { return i < 7 ? 2 : (i < 13 ? 0 : 1); }
// The circle each one buds off from: the first six from the centre, the outer twelve from the first-ring circle beside them.
int parentOf(int i) { if (i < 7) return 0; if (i < 13) return 1 + (i - 7); return 1 + (i - 13); }

mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }

// Nacre palette, t in 0..1 from cool to warm (sRGB values, returned in linear light).
vec3 nacre(float t) {
  vec3 c0 = vec3(0.373, 0.702, 0.702); // sea glass   #5FB3B3
  vec3 c1 = vec3(0.494, 0.549, 0.878); // periwinkle  #7E8CE0
  vec3 c2 = vec3(0.706, 0.557, 0.859); // lavender    #B48EDB
  vec3 c3 = vec3(0.898, 0.604, 0.690); // rose quartz #E59AB0
  vec3 c4 = vec3(0.949, 0.702, 0.541); // dawn peach  #F2B38A
  vec3 c5 = vec3(0.953, 0.847, 0.627); // champagne   #F3D8A0
  t = clamp(t, 0.0, 1.0) * 5.0;
  vec3 c;
  if (t < 1.0) c = mix(c0, c1, t);
  else if (t < 2.0) c = mix(c1, c2, t - 1.0);
  else if (t < 3.0) c = mix(c2, c3, t - 2.0);
  else if (t < 4.0) c = mix(c3, c4, t - 3.0);
  else c = mix(c4, c5, t - 4.0);
  return pow(c, vec3(2.2));
}
`;

export const GRAIN_VERT = /* glsl */ `
${COMMON}
uniform float uTime;
uniform vec4 uModeA;       // previous figure: its two modes (n1, m1, n2, m2)
uniform vec4 uModeB;       // current figure: its two modes
uniform vec4 uCW;          // previous (c, w), current (c, w): degenerate-mode mixing c, weight w of the second mode
uniform float uModeMix;    // 0 previous .. 1 current
uniform float uOrder;      // 0 scattered .. 1 on the nodal lines
uniform float uJump;       // the notes: grains on vibrating ground jump
uniform float uShimmer;    // the arp: a fine trembling
uniform float uLift;       // 0..1 grains leave the plate, one by one, into the canon rings
uniform vec3 uRot;         // rotation of each ring group (cantus, middle, high)
uniform float uWhole;      // 0..1 the rings settle into the spheres of the Flower of Life
uniform float uFall;       // 0..1 the grains fall back to the plate
uniform float uScatter;    // 0..1 the grains scatter to their homes at the end
uniform float uFlowerH;    // height of the spheres' centres
uniform vec4 uBells[${N_BELLS}];
uniform float uPixelScale; // pixels per unit of size at distance 1
uniform float uFocusDist;
uniform float uAperture;
uniform float uGrain;      // grain radius

attribute vec4 aSeed;

varying vec3 vColorKey;    // colour position, seed, glint
varying float vAlpha;
varying float vEdge;

// Chladni's square plate, coordinates u in [0, 1]. One mode (n, m) is cos(n pi x) cos(m pi y) + c cos(m pi x) cos(n pi y):
// the two degenerate halves mixed by c, which on a real plate depends on where it is driven. Pure c = +1 or -1 draws
// straight lines and grids ("tic-tac-toe boards", rejected by the user); c away from +-1 bends them into curves.
// A real figure at a driving frequency between two resonances is a weighted sum of both modes: (1 - w) A + w B.
float mode(vec2 u, vec2 nm, float c) { return cos(nm.x * PI * u.x) * cos(nm.y * PI * u.y) + c * cos(nm.y * PI * u.x) * cos(nm.x * PI * u.y); }
vec2 modeGrad(vec2 u, vec2 nm, float c) {
  float a = nm.x * PI, b = nm.y * PI;
  return vec2(-a * sin(a * u.x) * cos(b * u.y) - c * b * sin(b * u.x) * cos(a * u.y),
              -b * cos(a * u.x) * sin(b * u.y) - c * a * cos(b * u.x) * sin(a * u.y));
}
float field(vec2 p, vec4 nn, vec2 cw) {
  vec2 u = p / (2.0 * PLATE) + 0.5;
  return mix(mode(u, nn.xy, cw.x), mode(u, nn.zw, cw.x), cw.y);
}
vec2 fieldGrad(vec2 p, vec4 nn, vec2 cw) {
  vec2 u = p / (2.0 * PLATE) + 0.5;
  return mix(modeGrad(u, nn.xy, cw.x), modeGrad(u, nn.zw, cw.x), cw.y) / (2.0 * PLATE);
}
// The nearest point of the nodal lines (Newton steps on f), then a small offset across the line: the sand ridge's width.
vec2 toNodal(vec2 p, vec4 nn, vec2 cw, float jitter) {
  // Newton steps with a capped length: near an antinode the slope is almost flat, and a damped step left those grains
  // in place (they piled up as a blob); a capped full step always walks them to a line.
  for (int i = 0; i < 14; i++) {
    float f = field(p, nn, cw);
    vec2 g = fieldGrad(p, nn, cw);
    vec2 step = f * g / (dot(g, g) + 1e-4);
    float len = length(step);
    if (len > 0.06) step *= 0.06 / len;
    p -= step;
    p = clamp(p, vec2(-0.985 * PLATE), vec2(0.985 * PLATE));
  }
  vec2 g = fieldGrad(p, nn, cw);
  return clamp(p + normalize(g + 1e-5) * jitter, vec2(-0.99 * PLATE), vec2(0.99 * PLATE));
}

// deph's creation torus: four waves on the 3/6/9/12 s offsets of a 30 s cycle, lifting the grains they cross.
float ringRadius(float time, float off) { return mix(0.12, 1.45, 0.5 + 0.5 * sin(6.28318530718 * (time + off) / 30.0 - 1.5707963268)); }
float torusCrest(vec2 c, float time) {
  float d = length(c), k = 0.0;
  for (int i = 1; i <= 4; i++) { float x = d - ringRadius(time, 3.0 * float(i)); k = max(k, exp(-(x * x) / (2.0 * 0.045 * 0.045))); }
  return k * smoothstep(0.0, 0.1, d);
}

void main() {
  vec2 home = position.xz;
  float s0 = aSeed.x, s1 = aSeed.y, s2 = aSeed.z, s3 = aSeed.w;

  // ---- on the plate ----
  // Real sand lines are not perfect (the user asked for more dispersion): a wider ridge, and a long tail of grains
  // that did not quite arrive (a quarter of them up to three times farther from the line).
  float width = 0.016;
  float tail = s3 > 0.75 ? 1.0 + 2.0 * (s3 - 0.75) * 4.0 : 1.0;
  float jitter = (s1 - 0.5) * 2.0 * width * (0.35 + 0.65 * s2) * tail;
  vec2 prevN = toNodal(home, uModeA, uCW.xy, jitter);
  vec2 curN = toNodal(home, uModeB, uCW.zw, jitter);
  // All grains move almost together (a wide stagger showed the old figure and a cloud of travelling grains at once,
  // read as two images overlaid).
  float m = smoothstep(0.0, 1.0, clamp(uModeMix * 1.12 - s2 * 0.12, 0.0, 1.0));
  vec2 nodal = mix(prevN, curN, m);
  // Organic motion: a grain in transit swings off the straight path (a curve, not a rail), and every grain drifts slowly
  // on its own, so the sand is never frozen.
  vec2 travel = curN - prevN;
  nodal += vec2(-travel.y, travel.x) * sin(PI * m) * (s3 - 0.5) * 0.6;
  nodal += vec2(sin(uTime * 0.31 + s1 * 40.0), cos(uTime * 0.27 + s2 * 37.0)) * 0.0025;
  float stray = step(s0, 0.10);                                                // some grains never find a line
  float order = smoothstep(0.0, 1.0, clamp(uOrder * 1.4 - s3 * 0.4, 0.0, 1.0)) * (1.0 - stray);
  vec2 plate = mix(home, nodal, order);
  float hop = sin(PI * m) * 0.010 * order;                                     // grains hop while they slide

  // Vibration: grains on vibrating ground jump with the notes; grains on a nodal line stay still (as on a real plate).
  float energy = clamp(abs(field(home, uModeB, uCW.zw)) * 0.5, 0.0, 1.0);
  float vib = 0.7 + 0.3 * s1; // every grain, evenly: jumps limited to antinode grains looked isolated
  float y = (uJump * (0.25 + 0.75 * s3) * 0.022 + uShimmer * s1 * 0.004) * vib + hop;
  y += torusCrest(plate, uTime) * 0.006;
  y += width * 0.25 * max(0.0, 1.0 - abs(jitter) / (2.0 * width)) * order;  // the ridge's own height
  float glint = 0.0;
  for (int i = 0; i < ${N_BELLS}; i++) {
    vec4 b = uBells[i];
    if (b.w <= 0.0) continue;
    float env = smoothstep(0.0, 0.25, b.z) * exp(-b.z / 1.4) * b.w; // a soft rise, never a flash
    float d = min(length(plate - b.xy), length(plate - vec2(-b.x, b.y)));   // mirrored left / right
    float near = exp(-d * d / 0.0006);
    y += near * env * 0.05;
    glint = max(glint, near * env);
  }
  vec3 onPlate = vec3(plate.x, y, plate.y);
  float edgeFade = 1.0 - smoothstep(0.8, 0.99, max(abs(plate.x), abs(plate.y)));

  // ---- leaving the plate: the Flower of Life is born like cells dividing ----
  // Assembly mirrors the disassembly the user approved (fall straight down, then slide into the figure), reversed and in
  // the order of mitosis: the centre circle first, then its six, then the twelve. Each grain first slides on the table to
  // just under its place in its parent's ring, rises straight up, and then its circle separates from the parent and moves
  // to its own place — a new cell budding off. The canon's three speeds turn the groups until they line up at 4:16.
  int sphere = int(floor(hash11(s0 * 913.7 + s2 * 71.3) * 19.0));
  int grp = groupOf(sphere);
  float rotA = grp == 0 ? uRot.x : (grp == 1 ? uRot.y : uRot.z);
  vec2 centre = rot2(rotA) * flowerCentre(sphere);
  int par = parentOf(sphere);
  int pgrp = groupOf(par);
  float rotP = pgrp == 0 ? uRot.x : (pgrp == 1 ? uRot.y : uRot.z);
  vec2 parentC = rot2(rotP) * flowerCentre(par);
  float ang = fract(s1 * 7.31 + s3 * 3.17) * 2.0 * PI; // its own seed: sharing s1 with the offset split each ring in two
  vec2 ringOff = (R + jitter * 0.45) * vec2(cos(ang), sin(ang));
  float hgt = uFlowerH + (s0 - 0.5) * width * 0.4;
  float birth = float(sphere) / 19.0 * 0.78;
  float q = clamp((uLift * 1.04 - birth - s2 * 0.06) / 0.16, 0.0, 1.0) * (1.0 - stray);
  float slide = smoothstep(0.0, 0.35, q);   // across the table to just under its place
  float rise = smoothstep(0.3, 0.75, q);    // straight up: the fall, reversed
  float split = smoothstep(0.7, 1.0, q);    // mitosis: the new circle leaves its parent for its own place
  vec2 under = parentC + ringOff;
  vec2 xz = mix(mix(plate, under, slide), centre + ringOff, split);
  vec3 air = vec3(xz.x, mix(y, hgt, rise), xz.y);
  float lift = rise;
  float lifted = step(0.0001, q);
  vec3 pos = mix(onPlate, air, lifted);
  // Falling back (approved as is): each grain falls straight down, accelerating, then slides into the figure.
  float fall = clamp((uFall * 1.1 - s2) / 0.1, 0.0, 1.0);
  vec3 landed = vec3(pos.x, onPlate.y, pos.z);
  vec3 down = mix(pos, landed, fall * fall);
  down = mix(down, onPlate, smoothstep(0.75, 1.0, fall) * smoothstep(0.0, 1.0, clamp((uFall - 0.6) / 0.4, 0.0, 1.0)));
  pos = mix(pos, down, lifted * step(0.0001, fall));
  pos.xz = mix(pos.xz, home, uScatter);
  pos.y *= 1.0 - uScatter;

  // ---- size and depth of field ----
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float dist = -mv.z;
  float diam = 2.0 * uGrain * (0.65 + 0.7 * s2) * uPixelScale / dist;
  float coc = uAperture * abs(dist - uFocusDist) / max(dist, 1e-3) * uPixelScale;
  float size = max(diam, coc);
  gl_PointSize = clamp(size, 1.0, 256.0);
  gl_Position = projectionMatrix * mv;
  // A grain smaller than a pixel is drawn as one pixel carrying only its own share of light (drawing it as a full pixel
  // covered the whole frame in wide shots and the bloom burnt it white).
  float sub = min(diam * diam, 1.0) * mix(edgeFade, 1.0, lift * (1.0 - fall));
  vAlpha = clamp(pow(max(diam, 1.0) / max(size, 1.0), 2.0) * 1.6, 0.05, 1.0) * sub;
  vEdge = clamp(1.0 - diam / max(size, 1.0), 0.0, 1.0);
  // Colour: on the plate a nacre gradient from the centre outward; in the air one region of the palette per voice.
  // One colour field for everything, always a gradient (the user: "no una caja de M&M", different colours but uniform,
  // uniting the parts): nacre by distance from the centre, the same on the plate and in the air. Scattered grains follow a
  // slowly flowing version of it (a stain of nacre across the table), each only slightly off.
  float radial = length(pos.xz) * 0.75;
  float flowing = length(home) * 0.75 + 0.18 * sin(home.x * 2.3 + home.y * 1.7 + uTime * 0.05);
  vColorKey = vec3(mix(flowing, radial, max(order, lift)) + (s3 - 0.5) * 0.05, s3, glint);
}
`;

export const GRAIN_FRAG = /* glsl */ `
${COMMON}
uniform vec3 uLightDir;    // in view space
uniform vec3 uLightColor;  // can exceed 1: highlights are real HDR light, rolled off by the grade
uniform float uWarm;
uniform float uFade;
varying vec3 vColorKey;
varying float vAlpha;
varying float vEdge;

void main() {
  // Dust, not spheres (the user: "más polvo, no tan esfera"): a soft round mote lit by the one light, no sphere shading.
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(uv, uv);
  if (r2 > 1.0) discard;
  float mote = exp(-r2 * (3.5 - 2.5 * vEdge));
  float t = clamp(vColorKey.x * 0.85 + vColorKey.y * 0.04 + uWarm * 0.12, 0.0, 1.0);
  vec3 nc = nacre(t);
  float lum = dot(nc, vec3(0.2126, 0.7152, 0.0722));
  nc = max(mix(vec3(lum), nc, 1.35), 0.0);
  vec3 col = nc * uLightColor * (0.55 + 0.45 * mote);
  col += uLightColor * step(0.985, vColorKey.y) * mote * 2.2;     // a few motes catch the light: HDR sparkles
  col += vec3(0.95, 0.97, 1.0) * vColorKey.z * 4.0;               // a bell's glint
  gl_FragColor = vec4(col, vAlpha * mote * uFade);
}
`;

// The plate: dark stone in the night's indigo, lit by the same single light. (A cast shadow of the flower was tried and
// removed: it did not read.)
export const PLATE_VERT = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const PLATE_FRAG = /* glsl */ `
${COMMON}
uniform vec3 uLightColor;
uniform vec3 uLightWorld;  // direction toward the light, world space
varying vec3 vWorld;
varying vec3 vNormal;
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec2 xz = vWorld.xz;
  vec3 night = pow(vec3(0.043, 0.055, 0.102), vec3(2.2));   // #0B0E1A
  vec3 deep = pow(vec3(0.102, 0.122, 0.227), vec3(2.2));    // #1A1F3A
  float stone = 0.55 * vnoise(xz * 40.0) + 0.3 * vnoise(xz * 160.0) + 0.15 * vnoise(xz * 600.0);
  vec3 col = mix(night, deep, 0.35 + 0.4 * stone);
  float lambert = max(dot(vNormal, uLightWorld), 0.0);
  col *= 0.6 + 1.6 * lambert;
  col += uLightColor * 0.012 * stone * lambert;
  gl_FragColor = vec4(col, 1.0);
}
`;

// The grade: deph's HDR look (tools/visuals/src/shared/HdrCanvas.tsx's final pass), applied after a half-float bloom:
// exposure, ACES filmic roll-off, saturation, a slightly steep gamma for deep darks, vignette, fine grain, and a small
// chromatic dispersion. "HDR look" in a standard SDR video, as in Songcord and Musica Universalis.
export const GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uExposure: { value: 1.0 },
    uSaturation: { value: 1.25 },
    uGamma: { value: 2.25 },
    uCA: { value: 0.0005 },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uExposure, uSaturation, uGamma, uCA, uTime;
    varying vec2 vUv;
    vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    void main() {
      vec2 ca = (vUv - 0.5) * uCA;
      vec3 hdr = vec3(texture2D(tDiffuse, vUv + ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - ca).b);
      vec3 c = aces(hdr * uExposure);
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSaturation);
      c = pow(max(c, 0.0), vec3(1.0 / uGamma));
      vec2 q = vUv - 0.5;
      c *= 1.0 - 0.5 * dot(q * vec2(0.9, 1.15), q * vec2(0.9, 1.15)) * 2.0;
      c += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * (1.5 / 255.0);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }
  `,
};
