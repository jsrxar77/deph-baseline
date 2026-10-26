// A custom point sprite shader, replacing `THREE.PointsMaterial` — that default draws flat, hard-edged squares
// (no softness, no glow), which read as plain grey dots rather than light. Every other particle/point visual in
// this project (the-field's grains, songcord/musica-universalis's HdrCanvas) already uses a real `ShaderMaterial`.
//
// `aBoost` (per point) and `uBoost` (whole cloud) are how the music reaches each point (see music.ts): a boosted
// point grows and brightens a little. Brightening multiplies the point's own color, so gold stays gold and blue
// stays blue — a channel clips at 1.0 instead of the hue sliding toward white.
import * as THREE from "three";

const VERTEX = /* glsl */ `
attribute vec3 color;
attribute float aBoost;
varying vec3 vColor;
varying float vBoost;
uniform float uSize;
uniform float uBoost;
void main() {
  vColor = color;
  vBoost = aBoost + uBoost;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  // Never smaller than ~1.5 px: in the final slow zoom out the points would otherwise shrink below a pixel and
  // vanish, leaving the cube looking empty instead of holding what's been integrated inside it.
  gl_PointSize = max(uSize * (1.0 + 1.3 * vBoost) * (400.0 / -mvPosition.z), 1.5);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vBoost;
uniform float uOpacity;
void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c) * 2.0; // 0 at center, 1 at the sprite's edge
  float alpha = (1.0 - smoothstep(0.0, 1.0, d)) * uOpacity; // soft circular falloff, not a hard square
  if (alpha < 0.01) discard;
  // Brighten without leaving the hue: scale the whole color, but never past the point where its strongest channel
  // reaches 1.0 — clipping one channel (gold's green) shifted gold toward lemon yellow (seen 2026-10-25). What
  // a boosted point gains beyond that comes from its size, its opacity and the bloom.
  float peak = max(max(vColor.r, vColor.g), max(vColor.b, 0.001));
  vec3 col = vColor * min(1.0 + 0.6 * vBoost, 1.0 / peak);
  // Written in linear light: the scene renders into a half-float target and OutputPass encodes to sRGB once at
  // the very end (gnosis.tsx) — so the point's color on screen is still exactly vColor, as before the bloom pass.
  vec3 lin = mix(col / 12.92, pow((col + 0.055) / 1.055, vec3(2.4)), step(0.04045, col));
  gl_FragColor = vec4(lin, min(1.0, alpha * (1.0 + 0.5 * vBoost)));
}
`;

export function makePointMaterial(size: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: { uSize: { value: size }, uOpacity: { value: 1 }, uBoost: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// Every geometry drawn with this material needs an `aBoost` attribute (zeros = no boost).
export function addBoostAttribute(geometry: THREE.BufferGeometry, count: number): Float32Array {
  const boost = new Float32Array(count);
  geometry.setAttribute("aBoost", new THREE.BufferAttribute(boost, 1).setUsage(THREE.DynamicDrawUsage));
  return boost;
}
