// The Demiurgo's form — the user's direction (2026-10-25): he is not a cube with solids inside it; he IS one form
// that transforms through the five Platonic solids over the piece — tetrahedron, hexahedron (cube), octahedron,
// dodecahedron, icosahedron — and is already the icosahedron when the integration arrives. There is never a second
// shape inside: only his particles and their connections, bouncing inside whatever the form is right now.
//
// One surface, always. Each solid is described by its radial function r(d): the distance from the center to its
// surface along a unit direction d. A transformation blends the two radial functions, so the surface itself flows
// from one solid to the next. The edges of BOTH solids are drawn projected onto that one blended surface — the old
// ones fading out while the new ones fade in — so at any moment there is a single contour, never a form inside a
// form (the user, 2026-10-25: "interno no debería haber más formas... solo las externas").
//
// A boundary that is there and isn't (the user, 2026-10-25): the edges and the vertex points always stay; what
// comes and goes are the walls — very faint, almost transparent surfaces that close in while the Demiurgo speaks
// and fade, all together and completely, while Sofía speaks (`firmness`, timeline.ts demiurgeFirmness): "que se
// desvanezcan todas juntas, no abrupto, pero que desvanezca Sofía es fuerte" (a face-by-face fade was tried first). An earlier pass faded the
// edges themselves; the user kept the rhythm but moved it to the walls: "siempre se tienen que mantener las
// aristas y los puntos, lo que debe aparecer y desaparecer son las paredes".
//
// The interior: particles still bounce in closed form inside an invisible cube (clouds.ts triangleBounce — exact,
// a pure function of t), and that position is then stretched radially into the form: a point touching the cube's
// wall lands exactly on the form's wall, and comes back in from there. So nothing ever leaves the form, and when
// the form changes, everything inside follows it without a jump. (The bounce angle is not a mirror reflection off
// the form's face — only the cube's — but on screen it reads as touching the wall and returning.)
import * as THREE from "three";
import type { CloudColor } from "./clouds";
import { addBoostAttribute } from "./pointShader";

type V3 = [number, number, number];
type Solid = {
  verts: V3[];
  edges: [number, number][];
  faces: number[][]; // vertex indices around each face, in order
  normals: V3[];
  heights: number[];
};

const PHI = (1 + Math.sqrt(5)) / 2;
const unit = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const signs = (n: number): number[][] => (n === 0 ? [[]] : signs(n - 1).flatMap((s) => [[...s, 1], [...s, -1]]));
const cyclic = (a: number, b: number, c: number): V3[] => [[a, b, c], [b, c, a], [c, a, b]];

const TETRA: V3[] = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
const CUBE: V3[] = signs(3).map((s) => s as V3);
const OCTA: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const ICOSA: V3[] = signs(2).flatMap(([a, b]) => cyclic(0, a, b * PHI));
const DODECA: V3[] = [...CUBE, ...signs(2).flatMap(([a, b]) => cyclic(0, a / PHI, b * PHI))];

function unitRadius(s: { normals: V3[]; heights: number[] }, d: V3): number {
  let r = Infinity;
  for (let f = 0; f < s.normals.length; f++) {
    const n = s.normals[f];
    const c = n[0] * d[0] + n[1] * d[1] + n[2] * d[2];
    if (c > 1e-9) r = Math.min(r, s.heights[f] / c);
  }
  return r;
}

// Face planes straight from the vertices: every plane through three vertices with all the others on one side
// (a convex hull by brute force — at most 20 vertices, computed once at module load).
function hullPlanes(verts: V3[]): { normals: V3[]; heights: number[] } {
  const normals: V3[] = [];
  const heights: number[] = [];
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) for (let k = j + 1; k < verts.length; k++) {
    const a = verts[i], b = verts[j], c = verts[k];
    const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (Math.hypot(n[0], n[1], n[2]) < 1e-9) continue;
    n = unit(n);
    let h = n[0] * a[0] + n[1] * a[1] + n[2] * a[2];
    if (h < 0) { n = [-n[0], -n[1], -n[2]]; h = -h; }
    if (!verts.every((p) => n[0] * p[0] + n[1] * p[1] + n[2] * p[2] <= h + 1e-6)) continue;
    if (normals.some((m) => m[0] * n[0] + m[1] * n[1] + m[2] * n[2] > 1 - 1e-6)) continue;
    normals.push(n);
    heights.push(h);
  }
  return { normals, heights };
}

// A solid from its vertices, scaled to circumradius 1: every solid's vertices touch the same invisible sphere,
// the one sized to fill the screen's height (gnosis.tsx FORM_RADIUS) — the user's direction, 2026-10-25: the
// figures centered, never leaving the screen. (Equal volume was tried first: the tetrahedron's tips then reached
// 2.5x the cube's half-extent, far outside the frame.) Edges are the pairs at the shortest vertex distance.
function makeSolid(rawVerts: V3[]): Solid {
  const verts = rawVerts.map(unit);
  let minD = Infinity;
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) minD = Math.min(minD, dist(verts[i], verts[j]));
  const edges: [number, number][] = [];
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) if (dist(verts[i], verts[j]) < minD * 1.001) edges.push([i, j]);
  const { normals, heights } = hullPlanes(verts);
  // Each face: the vertices lying on its plane, ordered by angle around the face's center.
  const faces = normals.map((n, f) => {
    const idx = verts.map((_, i) => i).filter((i) => Math.abs(n[0] * verts[i][0] + n[1] * verts[i][1] + n[2] * verts[i][2] - heights[f]) < 1e-6);
    const c = idx.reduce<V3>((m, i) => [m[0] + verts[i][0] / idx.length, m[1] + verts[i][1] / idx.length, m[2] + verts[i][2] / idx.length], [0, 0, 0]);
    const e1 = unit([verts[idx[0]][0] - c[0], verts[idx[0]][1] - c[1], verts[idx[0]][2] - c[2]]);
    const e2: V3 = [n[1] * e1[2] - n[2] * e1[1], n[2] * e1[0] - n[0] * e1[2], n[0] * e1[1] - n[1] * e1[0]];
    const angle = (i: number) => {
      const v: V3 = [verts[i][0] - c[0], verts[i][1] - c[1], verts[i][2] - c[2]];
      return Math.atan2(v[0] * e2[0] + v[1] * e2[1] + v[2] * e2[2], v[0] * e1[0] + v[1] * e1[1] + v[2] * e1[2]);
    };
    return idx.sort((a, b) => angle(a) - angle(b));
  });
  return { verts, edges, faces, normals, heights };
}
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// In order of the piece: tetrahedron, hexahedron, octahedron, dodecahedron, icosahedron.
const SOLIDS: Solid[] = [TETRA, CUBE, OCTA, DODECA, ICOSA].map(makeSolid);
const EDGE_SAMPLES = 12; // each edge as a short polyline, so it can bend over the blended surface mid-transformation
export const FORM_SEGMENTS = SOLIDS.reduce((n, s) => n + s.edges.length * EDGE_SAMPLES, 0);
export const FORM_VERTICES = SOLIDS.reduce((n, s) => n + s.verts.length, 0);
// Faces as fans of triangles around their center, each subdivided so it can curve over the blended surface.
const FACE_SUBDIV = 4;
export const FORM_FACE_TRIANGLES = SOLIDS.reduce((n, s) => n + s.faces.reduce((m, f) => m + f.length, 0), 0) * FACE_SUBDIV * FACE_SUBDIV;

// `progress` 0..4 (timeline.ts demiurgeFormProgress): 0 = tetrahedron ... 4 = icosahedron, fractional mid-change.
// `radius` is the form's circumradius; `half` the half-extent of the invisible cube the particles bounce in (it sets
// their speed, not where they end up); `crack` the integration's slight trembling (0 outside it); `firmness` 0..1
// how present the walls are (1 = every face showing, 0 = none; the edges and vertices are always drawn); `sphere`
// 0..1 how far the form has rounded into a sphere at the end (timeline.ts sphereAmount) — its edges and vertex points
// fade as it does, leaving only the walls as a membrane.
export type FormState = {
  radius: number; half: number; progress: number; crack: number; firmness: number; sphere: number; t: number;
};

const weightOf = (form: FormState, j: number) => Math.max(0, 1 - Math.abs(form.progress - j));

function formRadius(form: FormState, dx: number, dy: number, dz: number): number {
  const d: V3 = [dx, dy, dz];
  const k = Math.min(3, Math.floor(form.progress));
  const u = Math.min(1, Math.max(0, form.progress - k));
  const a = SOLIDS[k], b = SOLIDS[k + 1];
  const ra = u < 1 ? unitRadius(a, d) : 0;
  const rb = u > 0 ? unitRadius(b, d) : 0;
  const solid = ra * (1 - u) + rb * u;
  return (solid + (1 - solid) * form.sphere) * form.radius; // a sphere's radial function is 1 everywhere
}

// Where a point bounced inside the invisible cube (local frame, within [-half, half]^3) sits inside the form.
export const MAPPED = { x: 0, y: 0, z: 0 };
export function mapIntoForm(form: FormState, lx: number, ly: number, lz: number) {
  const len = Math.hypot(lx, ly, lz);
  if (len < 1e-9 || form.half <= 0) { MAPPED.x = lx; MAPPED.y = ly; MAPPED.z = lz; return; }
  const gauge = Math.max(Math.abs(lx), Math.abs(ly), Math.abs(lz)) / form.half; // 0 at the center, 1 on the cube's wall
  const f = (gauge * formRadius(form, lx / len, ly / len, lz / len)) / len;
  MAPPED.x = lx * f; MAPPED.y = ly * f; MAPPED.z = lz * f;
}

// A point on the blended surface along direction p, plus the integration's trembling — slow, and smooth along the
// surface (a function of direction), so edges bend very slightly instead of their corners jittering apart.
function surfacePoint(form: FormState, p: V3, out: Float32Array, o: number) {
  const len = Math.hypot(p[0], p[1], p[2]);
  const dx = p[0] / len, dy = p[1] / len, dz = p[2] / len;
  const r = formRadius(form, dx, dy, dz);
  const amp = form.crack * form.radius * 0.025;
  const t = form.t;
  out[o] = dx * r + Math.sin(t * 0.43 + dx * 5.1 + dy * 1.3) * amp;
  out[o + 1] = dy * r + Math.sin(t * 0.57 + dy * 4.3 + dz * 2.1) * amp;
  out[o + 2] = dz * r + Math.sin(t * 0.37 + dz * 3.7 + dx * 1.7) * amp;
}

// Every solid's edges into one fat-line buffer: positions on the blended surface, and each solid's color scaled by
// its weight right now (additive blending, so a weight of 0 draws nothing).
export function writeFormEdges(form: FormState, positions: Float32Array, colors: Float32Array, color: CloudColor) {
  let o = 0;
  const p: V3 = [0, 0, 0];
  for (let j = 0; j < SOLIDS.length; j++) {
    const s = SOLIDS[j];
    const w = weightOf(form, j) * (1 - form.sphere);
    for (const [a, b] of s.edges) {
      const va = s.verts[a], vb = s.verts[b];
      for (let k = 0; k < EDGE_SAMPLES; k++) {
        for (let e = 0; e < 2; e++) {
          const tau = (k + e) / EDGE_SAMPLES;
          if (w > 0) {
            p[0] = va[0] + (vb[0] - va[0]) * tau; p[1] = va[1] + (vb[1] - va[1]) * tau; p[2] = va[2] + (vb[2] - va[2]) * tau;
            surfacePoint(form, p, positions, o);
          } else {
            positions[o] = 0; positions[o + 1] = 0; positions[o + 2] = 0;
          }
          colors[o] = color[0] * w; colors[o + 1] = color[1] * w; colors[o + 2] = color[2] * w;
          o += 3;
        }
      }
    }
  }
}

// Every solid's faces into one triangle buffer, on the same blended surface as the edges; `color` already carries
// how faint they are (gnosis.tsx); each solid's own weight and the walls' presence (`firmness`) are applied here.
// The walls' material: additive vertex color, plus a rim — brighter where the surface turns away from the eye —
// that only comes in as the form becomes a sphere (`uRim` = form.sphere), so the final membrane reads as a sphere
// (like a soap bubble) rather than a flat disc. Its normal is the radial direction, exact for the sphere. Fogged
// like the MeshBasicMaterial it replaced, so the walls look the same as before through the rest of the piece.
export function makeFormFaceMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uRim: { value: 0 } }]),
    vertexShader: /* glsl */ `
      attribute vec3 color;
      varying vec3 vColor;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      #include <fog_pars_vertex>
      void main() {
        vColor = color;
        vNormalView = normalize(normalMatrix * normalize(position));
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform float uRim;
      varying vec3 vColor;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      #include <fog_pars_fragment>
      void main() {
        float rim = 1.0 - abs(dot(normalize(vNormalView), normalize(vViewDir)));
        gl_FragColor = vec4(vColor * (1.0 + uRim * 3.0 * pow(rim, 3.0)), 1.0);
        #include <fog_fragment>
      }`,
    fog: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export function makeFormFaceGeometry(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(FORM_FACE_TRIANGLES * 9), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(FORM_FACE_TRIANGLES * 9), 3).setUsage(THREE.DynamicDrawUsage));
  return g;
}

export function writeFormFaces(form: FormState, geometry: THREE.BufferGeometry, color: CloudColor) {
  const pos = geometry.attributes.position.array as Float32Array;
  const col = geometry.attributes.color.array as Float32Array;
  const visible = color[0] + color[1] + color[2] > 0;
  let o = 0;
  const p: V3 = [0, 0, 0];
  const corner = (c: V3, a: V3, b: V3, i: number, j: number) => {
    const u = i / FACE_SUBDIV, v = j / FACE_SUBDIV;
    p[0] = c[0] + (a[0] - c[0]) * u + (b[0] - c[0]) * v;
    p[1] = c[1] + (a[1] - c[1]) * u + (b[1] - c[1]) * v;
    p[2] = c[2] + (a[2] - c[2]) * u + (b[2] - c[2]) * v;
  };
  for (let j = 0; j < SOLIDS.length; j++) {
    const s = SOLIDS[j];
    const w = visible ? weightOf(form, j) : 0;
    const fw = w * form.firmness;
    for (const face of s.faces) {
      const c = face.reduce<V3>((m, i) => [m[0] + s.verts[i][0] / face.length, m[1] + s.verts[i][1] / face.length, m[2] + s.verts[i][2] / face.length], [0, 0, 0]);
      for (let q = 0; q < face.length; q++) {
        const a = s.verts[face[q]], b = s.verts[face[(q + 1) % face.length]];
        for (let i = 0; i < FACE_SUBDIV; i++) {
          for (let k = 0; k < FACE_SUBDIV - i; k++) {
            const tris: [number, number][][] = [[[i, k], [i + 1, k], [i, k + 1]]];
            if (i + k + 1 < FACE_SUBDIV) tris.push([[i + 1, k], [i + 1, k + 1], [i, k + 1]]);
            for (const tri of tris) {
              for (const [ti, tk] of tri) {
                if (fw > 0) {
                  corner(c, a, b, ti, tk);
                  surfacePoint(form, p, pos, o);
                } else {
                  pos[o] = 0; pos[o + 1] = 0; pos[o + 2] = 0;
                }
                col[o] = color[0] * fw; col[o + 1] = color[1] * fw; col[o + 2] = color[2] * fw;
                o += 3;
              }
            }
          }
        }
      }
    }
  }
  (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  (geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
}

// The vertices as real points ("los vértices deben ser puntos"), every solid's, weighted the same way as the edges.
export function makeFormVertexGeometry(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(FORM_VERTICES * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(FORM_VERTICES * 3), 3).setUsage(THREE.DynamicDrawUsage));
  addBoostAttribute(g, FORM_VERTICES); // all zero — these points take the whole-form `uBoost` (the Demiurgo's voice)
  return g;
}

export function updateFormVertices(form: FormState, geometry: THREE.BufferGeometry, color: CloudColor) {
  const pos = geometry.attributes.position.array as Float32Array;
  const col = geometry.attributes.color.array as Float32Array;
  let o = 0;
  for (let j = 0; j < SOLIDS.length; j++) {
    const w = weightOf(form, j) * (1 - form.sphere);
    for (const v of SOLIDS[j].verts) {
      surfacePoint(form, v, pos, o);
      col[o] = color[0] * w; col[o + 1] = color[1] * w; col[o + 2] = color[2] * w;
      o += 3;
    }
  }
  (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  (geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
}
