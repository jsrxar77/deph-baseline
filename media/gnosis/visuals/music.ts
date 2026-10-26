// The music, as the picture hears it — every note of gnosis-live.strudel, read from its own frames.json (exact
// onset/end per note, rendered by tools/sounds/frames.mjs from the same source as the audio). Not an FFT guess:
// the visual envelope of each note is built from that note's own attack and release, so the image breathes the
// way the sound does. Two rules on top, both from the user's direction (2026-10-25): it's an image to meditate
// with — "siempre orgánico, no abrupto, de a poco" — so no note ever hits harder than a slow swell (a minimum
// visual attack, and releases stretched past the audible ones), and every value here is a pure function of t
// (Remotion renders frames out of order across workers).
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { smoothstep } from "./timeline";

export type NoteEv = { t: number; end: number; note: number; level: number; pan: number; attack: number; release: number };
const LAYERS = ["sophia", "demiurge", "tint", "arp", "bass", "shepard"] as const;
export type Layer = (typeof LAYERS)[number];
export type Music = Record<Layer, NoteEv[]> & {
  chordTimes: number[];
  shepardSteps: number[]; // each step of the Shepard's endless climb (a new chord every 4 s in the flight)
  range: Record<Layer, [number, number]>;
};

const MIN_ATTACK = 0.6; // seconds — even a plucked note swells in, never flashes
const MIN_RELEASE = 1.5;
const RELEASE_STRETCH = 1.6; // the picture lets go a little slower than the sound does

type RawEvent = { layer: string; seconds: number; endSeconds: number; value: Record<string, number | string | undefined> };
const num = (v: number | string | undefined, d: number) => (typeof v === "number" ? v : d);

export function useMusic(): Music | null {
  const [music, setMusic] = useState<Music | null>(null);
  const [handle] = useState(() => delayRender("gnosis frames.json"));
  useEffect(() => {
    fetch(staticFile("gnosis-frames.json"))
      .then((r) => r.json())
      .then((raw: RawEvent[]) => {
        const out = { range: {} } as Music;
        for (const layer of LAYERS) {
          const evs = raw
            .filter((e) => e.layer === layer)
            .map((e) => ({
              t: e.seconds,
              end: e.endSeconds,
              note: num(e.value.note, 60),
              level: num(e.value.gain, 1) * num(e.value.velocity, 1),
              pan: num(e.value.pan, 0.5),
              attack: num(e.value.attack, 0.1),
              release: num(e.value.release, 1),
            }))
            .filter((e) => e.level > 0.0005)
            .sort((a, b) => a.t - b.t);
          const peak = Math.max(1e-6, ...evs.map((e) => e.level));
          for (const e of evs) e.level /= peak;
          out[layer] = evs;
          const notes = evs.map((e) => e.note);
          out.range[layer] = [Math.min(...notes), Math.max(...notes)];
        }
        out.chordTimes = [...new Set(raw.filter((e) => e.layer === "pad").map((e) => e.seconds))].sort((a, b) => a - b);
        out.shepardSteps = [...new Set(out.shepard.map((e) => e.t))].sort((a, b) => a - b);
        setMusic(out);
        continueRender(handle);
      })
      .catch((err) => {
        console.error(err);
        continueRender(handle);
      });
  }, [handle]);
  return music;
}

// One note's visual envelope at time t: a slow swell over its own attack (never shorter than MIN_ATTACK), held
// while the note sounds, then a long exponential let-go after it ends.
export function noteEnvelope(e: NoteEv, t: number): number {
  if (t < e.t) return 0;
  const rise = smoothstep(0, Math.max(e.attack, MIN_ATTACK), t - e.t);
  const fall = t <= e.end ? 1 : Math.exp(-(t - e.end) / (Math.max(e.release, MIN_RELEASE) * RELEASE_STRETCH));
  return rise * fall * e.level;
}

function lastBefore(evs: NoteEv[], t: number): number {
  let lo = 0, hi = evs.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (evs[mid].t <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}

// Every note of a layer still audible-or-fading at t (newest first), with its envelope — looking back far enough
// to cover the longest note plus its stretched release.
export function activeNotes(evs: NoteEv[], t: number, lookback = 45): { index: number; env: number; ev: NoteEv }[] {
  const out: { index: number; env: number; ev: NoteEv }[] = [];
  for (let k = lastBefore(evs, t); k >= 0 && evs[k].t > t - lookback; k--) {
    const env = noteEnvelope(evs[k], t);
    if (env > 0.002) out.push({ index: k, env, ev: evs[k] });
  }
  return out;
}

// The strongest note of a layer right now, and its pitch normalized to that layer's own range (0 = its lowest
// note in the piece, 1 = its highest) — used for "the height of the note decides the height of the glow".
export function layerPulse(m: Music, layer: Layer, t: number): { value: number; pitch: number } {
  let best = 0, pitch = 0.5;
  const [lo, hi] = m.range[layer];
  for (const a of activeNotes(m[layer], t)) {
    if (a.env > best) { best = a.env; pitch = hi > lo ? (a.ev.note - lo) / (hi - lo) : 0.5; }
  }
  return { value: Math.min(1, best), pitch };
}

function lastTimeBefore(times: number[], t: number): number {
  let lo = 0, hi = times.length - 1, k = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= t) { k = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return k;
}

// A chord change sends one slow wave outward through the web: 0..1 front position, and how strong it still is.
export function chordWave(m: Music, t: number): { front: number; strength: number } {
  const k = lastTimeBefore(m.chordTimes, t);
  if (k < 0) return { front: 0, strength: 0 };
  const age = t - m.chordTimes[k];
  return { front: smoothstep(0, 3.6, age), strength: smoothstep(0, 0.8, age) * Math.exp(-age / 2.2) };
}

// One slow breath per Shepard step, 0..1: swells from the step's onset, peaks halfway, settles to rest exactly as
// the next step begins (sin², so it starts and ends with zero speed — no visible seam between steps).
export function shepardBreath(m: Music, t: number): number {
  const steps = m.shepardSteps;
  const k = lastTimeBefore(steps, t);
  if (k < 0) return 0;
  const len = k + 1 < steps.length ? steps[k + 1] - steps[k] : 4;
  const u = (t - steps[k]) / len;
  return u >= 1 ? 0 : Math.sin(Math.PI * u) ** 2;
}
