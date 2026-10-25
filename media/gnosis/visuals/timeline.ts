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
const SHEPARD_PRELUDIO = normalize([[4, 0], [10, 0.016], [28, 0.016], [34, 0]]); // local env [[0,0],[6,...],[24,...],[30,0]] shifted +4
const SHEPARD_FLIGHT = normalize([[250, 0], [262, 0.08], [300, 0.08], [320, 0]]); // local env [[0,0],[12,...],[50,...],[70,0]] shifted +250

export const shepardIntensity = (t: number) => Math.max(curve(SHEPARD_PRELUDIO, t), curve(SHEPARD_FLIGHT, t));

// Named windows, in seconds, for anything that wants to branch rather than blend.
export const SHEPARD_WINDOWS = {
  preludio: [4 * CYCLE_SECONDS, 34 * CYCLE_SECONDS] as [number, number],
  flight: [250 * CYCLE_SECONDS, 320 * CYCLE_SECONDS] as [number, number],
};
