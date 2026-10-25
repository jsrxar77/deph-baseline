// The music, as seen by the picture: every value here is a pure function of time t (seconds), read from the piece's
// own frames.json (every Strudel event with its exact onset). Nothing is carried between frames, so parallel render
// workers agree (see the visuals-compose skill).
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

export const FPS = 60;
export const BAR = 2; // seconds per bar (cpm 30)

// Sections in bars (musica-universalis.strudel `S`): intro 8, dev 24, climax 40, flight 32, return 48, outro 28.
export const SECTIONS = { intro: 0, dev: 8, climax: 32, flight: 72, ret: 104, outro: 152, end: 180 } as const;

// Layer keys, in the order of the `$:` blocks in the .strudel file.
const LAYER = { drone: "$0", pad: "$1", arp: "$2", sub: "$3", lead: "$4", shepard: "$5" } as const;

type RawEvent = { layer: string; seconds: number; endSeconds: number; value: { note?: number; gain?: number; velocity?: number; pan?: number } };
export type Ev = { t: number; end: number; note: number; level: number; pan: number };
export type Timeline = Record<keyof typeof LAYER, Ev[]> & { peak: Record<keyof typeof LAYER, number> };

export function useTimeline(): Timeline | null {
  const [tl, setTl] = useState<Timeline | null>(null);
  const [handle] = useState(() => delayRender("musica-universalis frames.json"));
  useEffect(() => {
    fetch(staticFile("musica-universalis-frames.json"))
      .then((r) => r.json())
      .then((raw: RawEvent[]) => {
        const out = {} as Timeline;
        out.peak = {} as Timeline["peak"];
        for (const [name, key] of Object.entries(LAYER) as [keyof typeof LAYER, string][]) {
          const evs = raw
            .filter((e) => e.layer === key)
            .map((e) => ({ t: e.seconds, end: e.endSeconds, note: e.value.note ?? 0, level: (e.value.gain ?? 1) * (e.value.velocity ?? 1), pan: e.value.pan ?? 0.5 }))
            .sort((a, b) => a.t - b.t);
          out[name] = evs;
          out.peak[name] = Math.max(1e-6, ...evs.map((e) => e.level));
        }
        setTl(out);
        continueRender(handle);
      })
      .catch((err) => {
        console.error(err);
        continueRender(handle);
      });
  }, [handle]);
  return tl;
}

// Index of the last event starting at or before t (binary search), -1 if none.
function lastBefore(evs: Ev[], t: number): number {
  let lo = 0, hi = evs.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (evs[mid].t <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}

// Events of one layer sounding within the last `life` seconds: onset age, pitch and stereo pan.
export function recentEvents(tl: Timeline, layer: keyof typeof LAYER, t: number, life: number): { age: number; note: number; level: number; pan: number }[] {
  const evs = tl[layer];
  const out: { age: number; note: number; level: number; pan: number }[] = [];
  for (let k = lastBefore(evs, t); k >= 0 && evs[k].t > t - life; k--) out.push({ age: t - evs[k].t, note: evs[k].note, level: evs[k].level / tl.peak[layer], pan: evs[k].pan });
  return out;
}

export const smoothstep = (a: number, b: number, x: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

// The arc as one number 0..1: how open the picture is (how many rays are lit). Rises through intro and development, holds high in
// climax/flight/return, folds back small in the outro.
export function arc(t: number): number {
  const b = t / BAR;
  const keys: [number, number][] = [[0, 0.1], [8, 0.35], [32, 0.75], [72, 0.85], [104, 1], [152, 0.75], [180, 0.08]];
  for (let i = 1; i < keys.length; i++) {
    if (b <= keys[i][0]) {
      const [b0, v0] = keys[i - 1], [b1, v1] = keys[i];
      const u = smoothstep(0, 1, (b - b0) / (b1 - b0));
      return v0 + (v1 - v0) * u;
    }
  }
  return 0.08;
}

// How much of the monochord (the single string) is present: 1 at the very start and the very
// end, fading toward 0 once the other voices are in full swing.
export const monochord = (t: number) => Math.max(1 - smoothstep(0, 8, t / BAR), smoothstep(SECTIONS.outro + 4, SECTIONS.end, t / BAR));
