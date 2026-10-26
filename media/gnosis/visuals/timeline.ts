// Gnosis as seen by the picture — ported directly from the TIMELINE/env breakpoints in
// media/gnosis/sounds/gnosis-live.strudel (cpm 30, 1 cycle = 2s), not re-derived or guessed. Everything here is a
// pure function of time t (seconds): no accumulated/integrated state, since Remotion can render frames out of
// order or in parallel across workers (see visuals-compose).

export const FPS = 60;
export const CYCLE_SECONDS = 2; // 1 cycle = 2s at cpm 30

// Movement boundaries, in seconds (cycle boundaries x2).
export const MOVEMENT = {
  pleroma: 0,
  descent: 120,
  density: 270,
  transcendence: 450,
  peace: 600,
  end: 720,
} as const;

export const smoothstep = (a: number, b: number, x: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

// Piecewise curve through [seconds, value] keys, eased between keys (same shape as the other pieces' `curve`).
export function curve(keys: [number, number][], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      return v0 + (v1 - v0) * smoothstep(0, 1, (t - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
}

// ---- who is "speaking" — ported 1:1 from TIMELINE in gnosis-live.strudel (cycles x2 = seconds) -------------------
export type Voice = "S" | "D" | null;
type Turn = { start: number; end: number; voice: Voice };

function turnsFromCycles(blocks: [number, Voice][]): Turn[] {
  const out: Turn[] = [];
  let c = 0;
  for (const [len, voice] of blocks) {
    out.push({ start: c * CYCLE_SECONDS, end: (c + len) * CYCLE_SECONDS, voice });
    c += len;
  }
  return out;
}

export const TURNS: Turn[] = turnsFromCycles([
  // I. Pleroma — Sophia alone.
  [20, "S"], [20, "S"], [20, "S"],
  // II. Descent — true alternation.
  [15, "S"], [15, "D"], [15, "S"], [15, "D"], [15, "S"],
  // III. Density — shorter, more frequent turns.
  [10, "S"], [10, "D"], [10, "S"], [10, "D"], [10, "S"], [10, "D"], [10, "S"], [10, "D"], [10, "S"],
  // IV. Transcendence — his farewell, her last question, then both fall silent for the flight.
  [13, "D"], [12, "S"], [50, null],
  // V. Eternal peace — one last pedal, then true silence.
  [30, "S"], [30, null],
]);

export function turnAt(t: number): { voice: Voice; progress: number } {
  for (const turn of TURNS) {
    if (t >= turn.start && t < turn.end) {
      return { voice: turn.voice, progress: (t - turn.start) / (turn.end - turn.start) };
    }
  }
  return { voice: null, progress: 0 };
}

// How strongly `voice` is "speaking" right now, 0..1, with a short crossfade (not a hard pop) at each turn's
// edges — the turns themselves stay exactly as sharp/legible as the .strudel TIMELINE defines them; this only
// smooths the picture's own reaction to that boundary.
const TURN_FADE = 1.5; // seconds
export function activeLevel(voice: "S" | "D", t: number): number {
  let level = 0;
  for (const turn of TURNS) {
    if (turn.voice !== voice) continue;
    const inRamp = smoothstep(turn.start - TURN_FADE, turn.start + TURN_FADE, t);
    const outRamp = 1 - smoothstep(turn.end - TURN_FADE, turn.end + TURN_FADE, t);
    level = Math.max(level, Math.min(inRamp, outRamp));
  }
  return level;
}

// ---- presence envelopes — ported from each voice's own `env([[cycle, value], ...])` in the .strudel file --------
// Normalized 0..1 against that voice's own peak value (the shape matters here, not the absolute gain).
const normalize = (keys: [number, number][]): [number, number][] => {
  const peak = Math.max(...keys.map((k) => k[1]));
  return keys.map(([c, v]) => [c * CYCLE_SECONDS, v / peak]);
};

const SOPHIA_ENV = normalize([[0, 0.045], [60, 0.05], [135, 0.055], [225, 0.06], [250, 0.065], [300, 0], [330, 0.04], [360, 0]]);
const DEMIURGE_ENV = normalize([[0, 0], [60, 0], [90, 0.05], [135, 0.06], [225, 0.075], [238, 0.075], [250, 0], [360, 0]]);

export const sophiaPresence = (t: number) => curve(SOPHIA_ENV, t);
export const demiurgePresence = (t: number) => curve(DEMIURGE_ENV, t);

// ---- the Shepard — the two voices' integration. Ported from the `shepard:` arrange() nesting and its own
// envelopes: a preludio (cycles 4-34, barely felt) and the flight (cycles 250-320, the climax), both converted to
// absolute seconds here exactly as the .strudel file nests them.
// Both normalized against the FLIGHT's own peak (0.08), not each curve's own peak — the preludio's real gain
// (0.016) is 5x quieter than the flight's, and `normalize` (which scales each curve to ITS OWN peak=1) was
// discarding that difference, making the barely-felt preludio read as a full-strength integration moment on
// screen (a real bug, found 2026-10-25: a dense gold cluster appeared as early as t=60s, well before the
// Demiurgo even exists). Scaling both against the same reference preserves that the preludio is a faint echo,
// not a second climax.
const FLIGHT_PEAK = 0.08;
const scaleTo = (keys: [number, number][], peak: number): [number, number][] =>
  keys.map(([c, v]) => [c * CYCLE_SECONDS, v / peak]);
const SHEPARD_PRELUDIO = scaleTo([[4, 0], [10, 0.016], [28, 0.016], [34, 0]], FLIGHT_PEAK);
const SHEPARD_FLIGHT = scaleTo([[250, 0], [262, 0.08], [300, 0.08], [320, 0]], FLIGHT_PEAK);

export const shepardIntensity = (t: number) => Math.max(curve(SHEPARD_PRELUDIO, t), curve(SHEPARD_FLIGHT, t));

// ---- the integration's calm — the user's direction, 2026-10-25: "en la integración los movimientos de los puntos
// deben ser más sutiles, siguiendo la música". Every particle motion (bounces, Sofía's orbits, the solids' spin, the
// small dance) runs on this clock instead of t: identical to t up to the flight, then slowing gradually to 40% of
// its speed while the flight is at its peak, and easing back as it fades. It's the integral of that speed, built
// once at module load as a table (deterministic, the same in every render worker), so positions stay continuous —
// slowing down a pure `sin(t * f)` by changing f would make points jump instead. The cube's own rotation and the
// camera stay on real time.
const FLIGHT_SLOWDOWN = 0.6;
const MOTION_STEP = 0.05; // seconds
const MOTION_TABLE = (() => {
  const n = Math.ceil(800 / MOTION_STEP) + 1;
  const out = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    out[i] = out[i - 1] + MOTION_STEP * (1 - FLIGHT_SLOWDOWN * curve(SHEPARD_FLIGHT, (i - 0.5) * MOTION_STEP));
  }
  return out;
})();
export function motionTime(t: number): number {
  if (t <= 0) return t;
  const x = t / MOTION_STEP;
  const i = Math.floor(x);
  const last = MOTION_TABLE.length - 1;
  if (i >= last) return MOTION_TABLE[last] + (t - last * MOTION_STEP);
  return MOTION_TABLE[i] + (MOTION_TABLE[i + 1] - MOTION_TABLE[i]) * (x - i);
}

// ---- the Demiurgo's form (form.ts): tetrahedron -> hexahedron -> octahedron -> dodecahedron -> icosahedron ------
// Each transformation happens while he speaks — during one of his own turns in the TIMELINE, lasting exactly that
// turn (20-26 s): his 2nd turn in the Descent, his 1st and 3rd in the Density, and his farewell in the
// Transcendence, so he is already the icosahedron when the integration arrives. 0 = tetrahedron ... 4 = icosahedron.
const DEMIURGE_TURNS = TURNS.filter((turn) => turn.voice === "D");
const FORM_CHANGES = [1, 2, 4, 6].map((i) => DEMIURGE_TURNS[i]);
export const demiurgeFormProgress = (t: number) =>
  FORM_CHANGES.reduce((m, turn) => m + smoothstep(turn.start, turn.end, t), 0);

// How present his form is: it follows his own envelope while it grows (so it arrives with him), then holds once
// it peaks (cycle 238) — his voice falls silent before the flight, but the form stays to the very end: the
// integration happens inside it, and the piece closes on it.
const FORM_HOLD = 238 * CYCLE_SECONDS;
export const demiurgeFormPresence = (t: number) => (t < FORM_HOLD ? demiurgePresence(t) : 1);

// How present his walls are, 0..1 (form.ts; the edges and vertices always stay) — the user's direction,
// 2026-10-25: a boundary that is there and isn't; "firme cuando habla él y disuelto cuando habla ella". Each turn eases from wherever the last one left it toward its
// target: closing in when he speaks (in ~6 s), fading slowly when she speaks (~14 s, so within her 20-30 s turns
// the walls are fully gone for a while before he returns). From the icosahedron on — the integration and the ending
// — the form stays firm. Pure: replayed from the first turn for any t (a few dozen turns, no stored state).
const FIRM_RISE = 6;
const FIRM_DISSOLVE = 14;
export function demiurgeFirmness(t: number): number {
  let v = 0;
  for (const turn of TURNS) {
    if (turn.start >= t) break;
    const target = turn.start >= FORM_CHANGES[3].start || turn.voice === "D" ? 1 : turn.voice === "S" ? 0 : v;
    const dt = Math.min(t, turn.end) - turn.start;
    v += (target - v) * smoothstep(0, target > v ? FIRM_RISE : FIRM_DISSOLVE, dt);
  }
  return v;
}

// The edges stay violet through every one of his forms — violet is his — and turn gold only as the icosahedron
// assembles, which is when the integration arrives: from the start of that last transformation (his farewell turn)
// to the flight's full rise (cycle 262). The user's direction, 2026-10-25: "mantener el violeta hasta el final,
// cuando se arma el icosaedro, que es justo cuando llega la integración" (an earlier pass moved a step toward gold
// with each form).
export const edgeGold = (t: number) => curve([[FORM_CHANGES[3].start, 0], [262 * CYCLE_SECONDS, 1]], t);

// Named windows, in seconds, for anything that wants to branch rather than blend.
export const SHEPARD_WINDOWS = {
  preludio: [4 * CYCLE_SECONDS, 34 * CYCLE_SECONDS] as [number, number],
  flight: [250 * CYCLE_SECONDS, 320 * CYCLE_SECONDS] as [number, number],
};

// ---- Sofía's progressive capture — the user's direction (2026-10-25): a small part of her is inside the
// Demiurgo's cube from early on, and more and more of her (very slowly) over the course of the piece, peaking
// near the Shepard flight (cube almost breaking, the attraction at its strongest) — then a partial release
// (never total) into the Peace. "Casi liberando", not fully free even at the end. Lowered across the board
// (2026-10-25, "que la integracion de sofia del demiurgo sea minima en su interior"): his cube should stay
// mostly his own — violet, dense, structured — with only a small trace of her ever inside it, even at the peak.
// Keys are already in seconds with their real literal values (not a shape to renormalize — see `normalize`
// above, which is for porting .strudel gain curves where only the shape matters, not for these).
const CAPTURE: [number, number][] = [
  [0, 0.02], [270, 0.05], [450, 0.1], [500, 0.16], [600, 0.26], [640, 0.22], [680, 0.14], [720, 0.12],
];
export const capturedFraction = (t: number) => curve(CAPTURE, t);

// ---- the ending — the user's direction (2026-10-25): integration, then a slow zoom out in which the icosahedron
// rounds into a sphere (its edges and vertex points fading — a faint gold membrane, Sofía and the Demiurgo inside
// it), and the sphere shrinks, everything with it, into one gold point: the same point the piece began from.
//   625-660  zoom out begins; icosahedron -> sphere; Sofía closes in until all of her is inside (her last phrase
//            ends at 660) — still blue, still herself, not captured into violet
//   660-715  in the silence after her, the sphere shrinks to the point (pads and bass fading out)
//   715-end  the gold point alone, to the last frame
// The pull-back is shorter than before (it used to take the rest of the piece), so the sphere still reads before
// it shrinks.
export const cameraZoomOut = (t: number) => curve([[625, 0], [690, 1]], t);
export const sofiaGather = (t: number) => curve([[625, 0], [660, 1]], t);
export const sphereAmount = (t: number) => curve([[625, 0], [660, 1]], t);
export const finalShrink = (t: number) => curve([[660, 0], [715, 1]], t);

// What has been integrated stays integrated — the user's direction, 2026-10-25: Sofía and the Demiurgo turn gold
// little by little through the integration and never go back to their own colors. Rises from the flight's start
// (8:20) to just past its plateau (10:20), then holds — into the sphere and the final point. (Before, the gold
// inside followed only the Shepard's notes, so when they faded the blue and violet came back: not intended.)
export const integratedGold = (t: number) => curve([[SHEPARD_WINDOWS.flight[0], 0], [620, 1]], t);

// ---- the beginning — the user's direction (2026-10-25): the piece opens on that same gold point, alone in the
// black — the perfect form — and Sofía grows out of it little by little until she is her full, loose cloud: eased
// in and out, never a jump from one frame to the next. The point holds only briefly (it fades in over the first
// second, she starts growing at 2 s) and she reaches her full size with her second phrase (0:12.6 in frames.json).
// (A first pass held the point until 0:08 and then burst her out in 5 s, fast at the start: "tiene que durar menos
// y debe crecer de a poco... no de un fotograma pasar al todo".)
const GROWTH: [number, number] = [2, 12.6];
export const sofiaGrowth = (t: number) => smoothstep(GROWTH[0], GROWTH[1], t);

// The gold point itself: fading in over the first second, fading out as she grows out of it; back as the sphere
// closes into it at the end.
export const goldPoint = (t: number) =>
  t < GROWTH[1]
    ? smoothstep(0, 1, t) * (1 - smoothstep(GROWTH[0], GROWTH[0] + 4, t))
    : smoothstep(0.7, 1, finalShrink(t));
