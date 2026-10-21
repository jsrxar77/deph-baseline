// Timeline and Camera Spline math for Gnosis (24:00 exact = 1440 seconds = 86,400 frames @ 60 fps)

export const FPS = 60;
export const TOTAL_CYCLES = 720; // @ 30 cpm
export const TOTAL_SECONDS = 1440; // 24:00 exact
export const TOTAL_FRAMES = TOTAL_SECONDS * FPS; // 86,400

// Arc phase timestamps (in seconds)
export const T = {
  pleroma: 0,
  descent: 216,         // 3:36
  density: 504,         // 8:24
  grounding: 864,       // 14:24 (Climax begins)
  transfiguration: 1224,// 20:24
  end: 1440,            // 24:00
};

// Smoothstep utility
export const smoothstep = (min: number, max: number, v: number): number => {
  const x = Math.max(0, Math.min(1, (v - min) / (max - min)));
  return x * x * (3 - 2 * x);
};

// Piecewise linear curve with smooth interpolation
export function curve(points: [number, number][], t: number): number {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 0; i < points.length - 1; i++) {
    const [t0, v0] = points[i];
    const [t1, v1] = points[i + 1];
    if (t >= t0 && t <= t1) {
      const s = smoothstep(t0, t1, t);
      return v0 + (v1 - v0) * s;
    }
  }
  return points[points.length - 1][1];
}

// Catmull-Rom 1D spline
export function spline(points: [number, number][], t: number): number {
  if (t <= points[0][0]) return points[0][1];
  if (t >= points[points.length - 1][0]) return points[points.length - 1][1];

  let i = 0;
  while (i < points.length - 1 && points[i + 1][0] < t) i++;

  const p0 = points[Math.max(0, i - 1)][1];
  const p1 = points[i][1];
  const p2 = points[Math.min(points.length - 1, i + 1)][1];
  const p3 = points[Math.min(points.length - 1, i + 2)][1];

  const t0 = points[i][0];
  const t1 = points[i + 1][0];
  const u = (t - t0) / (t1 - t0);

  const u2 = u * u;
  const u3 = u2 * u;

  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * u +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * u3)
  );
}

// Camera keyframe parameters: [time, targetX, targetY, targetZ, distance, elevationDeg, azimuthDeg]
// Elevation: 0 = horizontal, 90 = looking straight down, -20 = looking slightly upward
const CAMERA_SHOTS: [number, number, number, number, number, number, number][] = [
  [0, 0, 1.8, 0, 1.8, 18, 0],         // Pleroma: Macro inside the upper sapphire/cyan sphere
  [T.descent, 0, 0.5, 0, 3.6, 28, 40], // Descent: Pulling back into crane, revealing vertical rod
  [T.density, 0, -1.2, 0, 3.8, -10, 115], // Density: Descending to root level, looking up into matter
  [T.grounding, 0, 0, 0, 5.2, 38, 240], // Grounding (Climax): Spiraling out into full bipolar vortex
  [T.transfiguration, 0, 0, 0, 5.8, 18, 350], // Transfiguration: Harmonious orbital overview
  [T.end, 0, 0, 0, 4.2, 12, 410],     // Return / Dissolution
];

export function getCameraAt(t: number) {
  const col = (idx: number) =>
    spline(CAMERA_SHOTS.map((k) => [k[0], k[idx]] as [number, number]), t);

  const tx = col(1);
  const ty = col(2);
  const tz = col(3);
  const dist = col(4);
  const elevDeg = col(5);
  const azDeg = col(6);

  const elevRad = (elevDeg * Math.PI) / 180;
  const azRad = (azDeg * Math.PI) / 180;

  const cosElev = Math.cos(elevRad);
  const sinElev = Math.sin(elevRad);

  const camX = tx + dist * cosElev * Math.sin(azRad);
  const camY = ty + dist * sinElev;
  const camZ = tz + dist * cosElev * Math.cos(azRad);

  return {
    position: [camX, camY, camZ] as [number, number, number],
    target: [tx, ty, tz] as [number, number, number],
  };
}
