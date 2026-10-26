// Thin lines for the Demiurgo's form edges (form.ts), using three.js's own fat-line module
// (LineSegments2 + LineMaterial) — not a homemade shader. Two homemade attempts failed (2026-10-25): offset copies
// read as dashed/ghosted lines, and a custom screen-space ribbon blew up into huge flat planes whenever an edge
// passed near or behind the camera. LineMaterial handles exactly that case (it trims segments at the near plane).
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";

export type FatLines = {
  object: LineSegments2;
  material: LineMaterial;
  positions: Float32Array; // segment pairs (x1,y1,z1,x2,y2,z2), written in place every frame
  colors: Float32Array; // per-segment-end colors (r1,g1,b1,r2,g2,b2), multiplied by the material's color
  commit: () => void;
};

export function makeFatLines(segments: number, color: [number, number, number]): FatLines {
  const geometry = new LineSegmentsGeometry();
  geometry.setPositions(new Float32Array(segments * 6));
  geometry.setColors(new Float32Array(segments * 6).fill(1));
  const material = new LineMaterial({
    color: new THREE.Color(color[0], color[1], color[2]).getHex(),
    linewidth: 3,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
  });
  material.blending = THREE.AdditiveBlending;
  const object = new LineSegments2(geometry, material);
  object.frustumCulled = false;
  // setPositions/setColors store every segment in one shared interleaved buffer each (start/end both read it);
  // writing into those arrays in place avoids allocating a new GPU buffer on every frame.
  const attr = geometry.attributes.instanceStart as THREE.InterleavedBufferAttribute;
  const colorAttr = geometry.attributes.instanceColorStart as THREE.InterleavedBufferAttribute;
  return {
    object,
    material,
    positions: attr.data.array as Float32Array,
    colors: colorAttr.data.array as Float32Array,
    commit: () => { attr.data.needsUpdate = true; colorAttr.data.needsUpdate = true; },
  };
}
