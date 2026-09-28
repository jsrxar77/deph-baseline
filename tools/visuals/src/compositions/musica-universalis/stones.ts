import { N_RIPPLES } from "../../shared/ripples";
import { recentEvents, type Timeline } from "./timeline";

// Stones in the water (Songcord's ripples, tools/visuals/src/shared/ripples.ts), dropped by the piece's own notes:
// every arp note is a small stone (a tight, quick ripple), every lead bell a bigger one (wide and slow), and sustained
// sound breathes a very wide slow ring every 2.4 s, stronger when few notes are around — as in Songcord, so the water
// never goes still in held passages. A note falls where it sounds: leaning left/right with its pan and up/down with its
// pitch, and otherwise spread over the frame so ripples cross everywhere. Its strength follows
// the note's level, so the water quiets down when the arp fades (the flight, the outro) and fills up in the climax.

const LIFE = 7;          // seconds a ripple lives (Songcord's value)
const BREATH_EVERY = 2.4;
const BREATH_LIFE = 9;
const BREATHS = 4;       // slots kept for breath rings

const hash01 = (x: number) => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export function stoneUniforms(tl: Timeline, t: number, aspect: number, arcValue: number) {
  const on = new Float32Array(N_RIPPLES * 4);
  const kind = new Float32Array(N_RIPPLES); // 0 = bell (wide, slow), 1 = arp note (tight, quick), 2 = breath
  const notes = [
    ...recentEvents(tl, "arp", t, LIFE).map((e) => ({ ...e, k: 1 })),
    ...recentEvents(tl, "lead", t, LIFE).map((e) => ({ ...e, k: 0 })),
  ].sort((a, b) => a.age - b.age);
  let slot = 0;
  for (const e of notes.slice(0, N_RIPPLES - BREATHS)) {
    const at = t - e.age;
    // Pan and pitch only lean the spot (the arp has just two pans, 0.3 and 0.7: placing by pan alone stacked the
    // stones on two spots and drew two bullseyes); the rest is spread over the frame so ripples cross everywhere.
    const x = ((e.pan - 0.5) / 0.2) * 0.2 * aspect + (hash01(at * 3.1 + e.note) - 0.5) * 0.78 * aspect;
    const reg = Math.min(1, Math.max(0, (e.note - 60) / 43));
    const y = (reg - 0.5) * 0.45 + (hash01(at * 5.7 + 1) - 0.5) * 0.5;
    on.set([x, y, e.age, 0.15 + 0.85 * e.level], slot * 4);
    kind[slot++] = e.k;
  }
  const first = Math.floor((t - BREATH_LIFE) / BREATH_EVERY);
  for (let k = first; k <= Math.floor(t / BREATH_EVERY) && slot < N_RIPPLES; k++) {
    const tb = k * BREATH_EVERY;
    if (tb < 0 || t - tb > BREATH_LIFE) continue;
    const near = notes.filter((e) => Math.abs(t - e.age - tb) < 2).length;
    const strength = (0.35 + 0.5 * Math.max(0, 1 - near / 4)) * (0.6 + 0.4 * arcValue);
    on.set([(hash01(tb * 2.3) - 0.5) * 0.7 * aspect, (hash01(tb * 4.9) - 0.5) * 0.5, t - tb, strength], slot * 4);
    kind[slot++] = 2;
  }
  return { uOn: { kind: "4fv" as const, value: on }, uOnK: { kind: "1fv" as const, value: kind } };
}
