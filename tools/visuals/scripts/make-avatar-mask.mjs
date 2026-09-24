#!/usr/bin/env node
// Builds public/deph-avatar-mask.png: an alpha mask that separates the illustrated portrait (head, hair, ears,
// neck, collar) from its blue/purple background, so the background can be replaced with the fractal.
// The background is bluish (blue above red) while skin is warm, hair is neutral grey and the outlines are near
// black; the largest connected foreground region around the face is kept, thin background lines are removed by
// a morphological opening, holes are filled, and the edge is feathered by 1-2 px.
//
// Usage (from tools/visuals/):  node scripts/make-avatar-mask.mjs [--debug out.png]
import { spawnSync } from 'node:child_process';

const SRC = '../../docs/youtube-channel/channels4_profile.jpg';
const OUT = 'public/deph-avatar-mask.png';
const N = 600;
const dbgIdx = process.argv.indexOf('--debug');
const DEBUG = dbgIdx > 0 ? process.argv[dbgIdx + 1] : null;

const run = (args, input) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { input, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(String(r.stderr));
  return r.stdout;
};

const rgb = run(['-i', SRC, '-vf', `scale=${N}:${N}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
const px = (i) => [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]];

// 1. foreground candidates: inside a generous head-and-torso region AND not bluish. The region keeps the dark
// and gold background rings near the frame's edge (which are not bluish and touch each other) from being
// mistaken for part of the figure; inside it, the bluish background is removed pixel by pixel.
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const inBound = (x, y) =>
  inEllipse(x, y, 300, 126, 228, 198) || inEllipse(x, y, 300, 312, 246, 336) || inEllipse(x, y, 300, 552, 180, 144);
let fg = new Uint8Array(N * N);
for (let i = 0; i < N * N; i++) {
  const [r, g, b] = px(i);
  const bluish = b > r + 10 && b > g - 6; // navy, cyan and purple lines
  const x = i % N, y = (i / N) | 0;
  // The face area is always figure: the drawing has a bluish rim light on the left ear and temple that is the
  // same colour as the background, so colour alone cannot tell them apart there.
  // Two ellipses: a wide one across the ears and temples, and a narrower one for the tapering jaw.
  const core = inEllipse(x, y, 300, 295, 196, 105) || inEllipse(x, y, 300, 380, 158, 200);
  fg[i] = inBound(x, y) && (core || !bluish) ? 1 : 0;
}

// Out-of-bounds counts as "same as the shape" for erosion (a shape touching the frame edge is not eroded there)
// and as empty for dilation, so neither operation invents foreground along the border.
const erode = (m, rad) => {
  const out = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let ok = 1;
    for (let dy = -rad; dy <= rad && ok; dy++) for (let dx = -rad; dx <= rad; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy < 0 || yy >= N || xx < 0 || xx >= N) continue;
      if (!m[yy * N + xx]) { ok = 0; break; }
    }
    out[y * N + x] = ok;
  }
  return out;
};
const dilate = (m, rad) => {
  const out = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let any = 0;
    for (let dy = -rad; dy <= rad && !any; dy++) for (let dx = -rad; dx <= rad; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy < 0 || yy >= N || xx < 0 || xx >= N) continue;
      if (m[yy * N + xx]) { any = 1; break; }
    }
    out[y * N + x] = any;
  }
  return out;
};

// 2. remove thin lines (opening), keep the component containing the face centre
fg = dilate(erode(fg, 4), 4);
const seen = new Uint8Array(N * N);
const comp = new Uint8Array(N * N);
const stack = [];
let seed = 300 * N + 300;
if (!fg[seed]) throw new Error('face centre is not foreground: classification failed');
stack.push(seed); seen[seed] = 1;
while (stack.length) {
  const i = stack.pop();
  comp[i] = 1;
  const x = i % N, y = (i / N) | 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const xx = x + dx, yy = y + dy;
    if (xx < 0 || xx >= N || yy < 0 || yy >= N) continue;
    const j = yy * N + xx;
    if (fg[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
  }
}

// 3. fill holes: anything not reachable from the border through non-foreground is foreground
const outside = new Uint8Array(N * N);
const st2 = [];
for (let x = 0; x < N; x++) for (const y of [0, N - 1]) { const i = y * N + x; if (!comp[i] && !outside[i]) { outside[i] = 1; st2.push(i); } }
for (let y = 0; y < N; y++) for (const x of [0, N - 1]) { const i = y * N + x; if (!comp[i] && !outside[i]) { outside[i] = 1; st2.push(i); } }
while (st2.length) {
  const i = st2.pop();
  const x = i % N, y = (i / N) | 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const xx = x + dx, yy = y + dy;
    if (xx < 0 || xx >= N || yy < 0 || yy >= N) continue;
    const j = yy * N + xx;
    if (!comp[j] && !outside[j]) { outside[j] = 1; st2.push(j); }
  }
}
let mask = new Uint8Array(N * N);
for (let i = 0; i < N * N; i++) mask[i] = outside[i] ? 0 : 1;

// 4. smooth the silhouette a little, then feather
mask = erode(dilate(mask, 3), 3);
const soft = new Float32Array(N * N);
const R = 2;
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  let s = 0, c = 0;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const yy = y + dy, xx = x + dx;
    if (yy < 0 || yy >= N || xx < 0 || xx >= N) continue;
    s += mask[yy * N + xx]; c++;
  }
  soft[y * N + x] = s / c;
}

const rgba = Buffer.alloc(N * N * 4);
for (let i = 0; i < N * N; i++) { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = 255; rgba[i * 4 + 3] = Math.round(soft[i] * 255); }
run(['-y', '-f', 'rawvideo', '-pixel_format', 'rgba', '-video_size', `${N}x${N}`, '-i', '-', '-frames:v', '1', OUT], rgba);
console.error(`wrote ${OUT} (${(mask.reduce((a, b) => a + b, 0) / (N * N) * 100).toFixed(1)}% of the image is foreground)`);

if (DEBUG) {
  // red tint over what is treated as background, to inspect the cut
  const dbg = Buffer.alloc(N * N * 3);
  for (let i = 0; i < N * N; i++) {
    const a = soft[i];
    const [r, g, b] = px(i);
    dbg[i * 3] = Math.round(r * a + 255 * (1 - a) * 0.8 + r * (1 - a) * 0.2);
    dbg[i * 3 + 1] = Math.round(g * a * 1 + g * (1 - a) * 0.2);
    dbg[i * 3 + 2] = Math.round(b * a + b * (1 - a) * 0.2);
  }
  run(['-y', '-f', 'rawvideo', '-pixel_format', 'rgb24', '-video_size', `${N}x${N}`, '-i', '-', '-frames:v', '1', DEBUG], dbg);
  console.error(`wrote debug ${DEBUG}`);
}
