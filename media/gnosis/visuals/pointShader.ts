// A custom point sprite shader, replacing `THREE.PointsMaterial` — that default draws flat, hard-edged squares
// (no softness, no glow), which read as plain grey dots rather than light. Every other particle/point visual in
// this project (the-field's grains, songcord/musica-universalis's HdrCanvas) already uses a real `ShaderMaterial`;
// this brings gnosis up to the same level instead of leaning on the plain default.
import * as THREE from "three";

const VERTEX = /* glsl */ `
attribute vec3 color;
varying vec3 vColor;
uniform float uSize;
void main() {
  vColor = color;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * (400.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
uniform float uOpacity;
void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c) * 2.0; // 0 at center, 1 at the sprite's edge
  float alpha = smoothstep(1.0, 0.0, d) * uOpacity; // soft circular falloff, not a hard square
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor, alpha);
}
`;

export function makePointMaterial(size: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: { uSize: { value: size }, uOpacity: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
