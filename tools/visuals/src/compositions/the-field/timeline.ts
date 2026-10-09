// The music, as seen by the picture. Every value here is a pure function of time t (seconds), read from the piece's own
// frames.json (every Strudel event with its exact onset), so parallel render workers agree (see visuals-compose).
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

export const FPS = 60;
export const CYCLE = 2; // seconds per cycle (cpm 30)

// Arc of the-field.strudel, in seconds.
export const T = {
  frequency: 64,     // cycle 32
  geometry: 176,     // cycle 88
  inhale: 240,       // cycle 120: arp out, filter closes, sub leaves
  whole: 256,        // cycle 128: the convergence — the whole manifests
  wholeEnd: 288,     // cycle 144: the voices start to drift apart
  rest: 304,         // cycle 152
  end: 369,          // cycle 184.5
} as const;

// Layer keys, in the order of the `$:` blocks in the .strudel file.
const LAYER = { pad: "$0", sub: "$1", arp: "$2", lead: "$3", cantus: "$4", middle: "$5", high: "$6", bells: "$7", gong: "$8" } as const;
export type Layer = keyof typeof LAYER;

type RawEvent = { layer: string; seconds: number; endSeconds: number; value: { note?: number; freq?: number; gain?: number; velocity?: number; pan?: number } };
export type Ev = { t: number; note: number; level: number; pan: number };
export type Timeline = Record<Layer, Ev[]> & { peak: Record<Layer, number> };

const midiOf = (v: RawEvent["value"]) => v.note ?? (v.freq ? 69 + 12 * Math.log2(v.freq / 440) : 0);

export function useTimeline(): Timeline | null {
  const [tl, setTl] = useState<Timeline | null>(null);
  const [handle] = useState(() => delayRender("the-field frames.json"));
  useEffect(() => {
    fetch(staticFile("the-field-frames.json"))
      .then((r) => r.json())
      .then((raw: RawEvent[]) => {
        const out = { peak: {} } as Timeline;
        for (const [name, key] of Object.entries(LAYER) as [Layer, string][]) {
          // Silent events (gain ~ 0, e.g. the arp before Frequency) are not part of what is heard.
          const evs = raw
            .filter((e) => e.layer === key)
            .map((e) => ({ t: e.seconds, note: midiOf(e.value), level: (e.value.gain ?? 1) * (e.value.velocity ?? 1), pan: e.value.pan ?? 0.5 }))
            .filter((e) => e.level > 0.004)
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
export function lastBefore(evs: Ev[], t: number): number {
  let lo = 0, hi = evs.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (evs[mid].t <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}

// Events of one layer that started within the last `life` seconds (newest first), with their age and level 0..1.
export function recentEvents(tl: Timeline, layer: Layer, t: number, life: number) {
  const evs = tl[layer];
  const out: { age: number; note: number; level: number; pan: number }[] = [];
  for (let k = lastBefore(evs, t); k >= 0 && evs[k].t > t - life; k--) out.push({ age: t - evs[k].t, note: evs[k].note, level: evs[k].level / tl.peak[layer], pan: evs[k].pan });
  return out;
}

// How many events of a layer have started by t, plus the newest one's growth (0..1 over `grow` seconds): a smooth count.
export function smoothCount(tl: Timeline, layer: Layer, t: number, from: number, grow: number) {
  const evs = tl[layer];
  const k = lastBefore(evs, t);
  if (k < 0) return 0;
  let n = 0;
  for (let i = 0; i <= k; i++) if (evs[i].t >= from) n++;
  if (n === 0) return 0;
  return n - 1 + smoothstep(0, grow, t - evs[k].t);
}

export const smoothstep = (a: number, b: number, x: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

// Smooth path through [time, value] keys that keeps moving through them (cubic Hermite with tangents from the
// neighbouring keys): for the camera, which with eased segments stopped at every key and read as mechanical.
export function spline(keys: [number, number][], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  const last = keys.length - 1;
  if (t >= keys[last][0]) return keys[last][1];
  let i = 0;
  while (t > keys[i + 1][0]) i++;
  const [t0, p0] = keys[i], [t1, p1] = keys[i + 1];
  const slope = (j: number) => {
    if (j === 0 || j === last) return 0; // the shot starts and ends at rest
    return (keys[j + 1][1] - keys[j - 1][1]) / (keys[j + 1][0] - keys[j - 1][0]);
  };
  const h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * h * slope(i) + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * h * slope(i + 1);
}

// Piecewise curve through [time, value] keys, eased between keys.
export function curve(keys: [number, number][], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      return v0 + (v1 - v0) * smoothstep(0, 1, (t - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
}
