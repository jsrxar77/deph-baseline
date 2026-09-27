// Strudel events -> MIDI tracks, shared by midi.mjs (writes a .mid file) and midi-live.mjs (plays to a
// MIDI port such as the IAC bus, in real time). One mapping, two outputs — so what you audition live in
// Ableton is exactly what the exported .mid contains. Pure functions: no Strudel imports, no I/O.
//
// The mapping (see docs/daw-bridge.md for the reasoning behind each choice):
// - One track per `$:` layer, MIDI channel = track index (0-based, max 16).
// - Time: 1 Strudel cycle = 1 bar of 4/4, so BPM = cpm * 4. An arrange() section of N cycles is N bars.
// - Pitch: `note` (MIDI number, possibly fractional) is split into the nearest integer note plus a residual in
//   cents. A piece tuned off 440 (Slow Drift: A4 = 432, every note -31.77 cents) has the SAME residual on every
//   note, so it becomes one pitch-bend value per track sent before the first note. That is what makes the
//   tuning survive into Ableton without touching any plugin. Residuals that differ between notes of one track
//   (microtonal writing) cannot be expressed that way and are reported as a warning — unless the track is listed in
//   `noBend`: its tuning is then the synth's job (a .scl/.kbm tuning file, see scl.mjs), so it gets no bend and its
//   notes are simply the nearest 12-TET keys (Musica Universalis's Pythagorean monochord).
// - Dynamics: Strudel's `gain` is fixed per note (sampled at the note's onset — superdough never changes it
//   mid-note; its `velocity` just multiplies gain, so the level used is gain * velocity), so MIDI velocity per note
//   carries it faithfully, as long as the synth turns velocity into volume.
//   The law is dB-linear, the one Surge XT uses (SurgeVoice.cpp: gain dB = level + velsense * (1 - vel/127)):
//   velocity = 127 * (1 + dB / velRange), dB = 20*log10(gain / the track's peak gain). With Surge's
//   "Vel > Gain" set to -velRange dB (default 40) the synth reproduces Strudel's levels exactly; notes more
//   than velRange dB below the peak get velocity 1. Most factory presets ship with Vel > Gain at 0 (velocity
//   ignored), so the DAW guide must say to set it. The track's peak gain relative to the loudest track
//   becomes a suggested starting fader level.
// - Layers with no `note` (e.g. a binaural pair written in Hz with `freq`) have no MIDI equivalent: they are
//   reported as audio-only, to be brought into the DAW as a rendered stem (render.mjs --only).
// - Not carried: pan movement, filter sweeps, reverb, delay, envelopes, FM. They are listed per track in
//   `params` so the DAW guide can recreate them with the plugin/effects instead.

export const PPQ = 480;
export const TICKS_PER_CYCLE = PPQ * 4;
const BEND_CENTER = 8192;

export const bpmFromCps = (cps) => cps * 60 * 4;

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

// cents -> 14-bit pitch-bend value for a synth whose bend range is +/- `rangeSemitones`.
export function bendValue(cents, rangeSemitones = 2) {
  const v = Math.round(BEND_CENTER + (cents / 100 / rangeSemitones) * BEND_CENTER);
  return Math.max(0, Math.min(16383, v));
}

// A note's level as superdough plays it: `gain * velocity` (superdough.mjs: "velocity currently only multiplies with
// gain"), both defaulting to 1.
const level = (v) => (v.gain ?? 1) * (v.velocity ?? 1);

export function velocityFor(gain, peak, velRange = 40) {
  const db = gain > 0 ? 20 * Math.log10(gain / peak) : -Infinity;
  return Math.max(1, Math.min(127, Math.round(127 * (1 + db / velRange))));
}

// haps: onset haps from pattern.queryArc (value tagged with `layer` by eval-strudel.mjs).
// noteToMidi: Strudel's own converter, for note names given as strings ("c4").
export function buildTracks(haps, { noteToMidi, bendRange = 2, velRange = 40, names = [], noBend = [] } = {}) {
  const byLayer = new Map();
  for (const h of haps) {
    const { layer, ...value } = typeof h.value === 'object' ? h.value : { value: h.value };
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer).push({ begin: h.whole.begin.valueOf(), end: h.whole.end.valueOf(), value });
  }

  const tracks = [];
  const audioOnly = [];
  const warnings = [];
  for (const [layer, events] of byLayer) {
    const pitched = [];
    for (const e of events) {
      let m = e.value.note;
      if (typeof m === 'string') m = noteToMidi(m);
      if (typeof m === 'number' && Number.isFinite(m)) pitched.push({ ...e, midi: m });
    }
    if (!pitched.length) {
      audioOnly.push({ layer, events: events.length, sounds: [...new Set(events.map((e) => e.value.s).filter(Boolean))] });
      continue;
    }
    const badLevel = pitched.filter((e) => !Number.isFinite(level(e.value))).length;
    if (badLevel) {
      // e.g. `gain(pattern * 0.5)`: JS arithmetic on a Strudel pattern yields NaN, and superdough plays NaN gain as 1.
      warnings.push(`${layer}: ${badLevel} note(s) with a non-numeric gain/velocity — superdough plays those at FULL volume`);
    }
    if (pitched.length < events.length) {
      warnings.push(`${layer}: ${events.length - pitched.length} event(s) without a note were skipped`);
    }

    const name = names[tracks.length] ?? layer;
    const synthTuned = noBend.includes(name) || noBend.includes(layer);
    const residuals = pitched.map((e) => (e.midi - Math.round(e.midi)) * 100);
    const cents = median(residuals);
    const spread = Math.max(...residuals.map((r) => Math.abs(r - cents)));
    if (spread > 5 && !synthTuned) {
      warnings.push(`${layer}: notes are detuned by different amounts (up to ${spread.toFixed(1)} cents from the ` +
        `track's ${cents.toFixed(1)}); one pitch bend per track cannot represent that`);
    }

    const peak = Math.max(...pitched.map((e) => level(e.value)).filter(Number.isFinite));
    // Same pitch, same onset inside one layer (e.g. two stacked FM operators of one bell): one MIDI note.
    const unique = new Map();
    for (const e of pitched) {
      const key = `${Math.round(e.midi)}@${e.begin}`;
      const prev = unique.get(key);
      if (!prev || level(e.value) > level(prev.value)) unique.set(key, e);
    }
    const notes = [...unique.values()]
      .map((e) => ({
        begin: e.begin,
        end: e.end,
        pitch: Math.round(e.midi),
        velocity: velocityFor(level(e.value), peak, velRange),
      }))
      .sort((a, b) => a.begin - b.begin || a.pitch - b.pitch);
    // A MIDI channel can't hold two copies of one pitch: a repeat cuts the previous one short.
    const lastByPitch = new Map();
    for (const n of notes) {
      const prev = lastByPitch.get(n.pitch);
      if (prev && prev.end > n.begin) prev.end = n.begin;
      lastByPitch.set(n.pitch, n);
    }

    const params = {};
    for (const e of pitched) {
      for (const [k, v] of Object.entries(e.value)) {
        if (k === 'note' || k === 'gain' || k === 'velocity') continue;
        const p = (params[k] ??= typeof v === 'number' ? { min: v, max: v } : { values: new Set() });
        if (typeof v === 'number') (p.min = Math.min(p.min, v)), (p.max = Math.max(p.max, v));
        else p.values?.add(v);
      }
    }
    for (const p of Object.values(params)) if (p.values) p.values = [...p.values];

    tracks.push({
      layer,
      name,
      notes,
      cents: +cents.toFixed(2),
      bend: !synthTuned && Math.abs(cents) >= 0.5 ? bendValue(cents, bendRange) : null,
      synthTuned,
      peakGain: peak,
      pitchRange: [Math.min(...notes.map((n) => n.pitch)), Math.max(...notes.map((n) => n.pitch))],
      params,
    });
  }

  if (tracks.length > 16) throw new Error(`${tracks.length} pitched layers; MIDI has 16 channels`);
  const loudest = Math.max(...tracks.map((t) => t.peakGain));
  tracks.forEach((t, i) => {
    t.channel = i;
    t.suggestedFaderDb = +(20 * Math.log10(t.peakGain / loudest)).toFixed(1);
  });
  return { tracks, audioOnly, warnings };
}

// ---- Standard MIDI File (format 1) ----------------------------------------------------------------

const vlq = (n) => {
  const bytes = [n & 0x7f];
  while ((n >>= 7)) bytes.unshift((n & 0x7f) | 0x80);
  return bytes;
};
const text = (s) => [...Buffer.from(s, 'utf8')];
const chunk = (id, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  return Buffer.concat([Buffer.from(id, 'ascii'), len, Buffer.from(data)]);
};

// events: [{ tick, order, bytes }] -> MTrk chunk (delta times, end-of-track appended).
function trackChunk(events) {
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const data = [];
  let last = 0;
  for (const e of events) {
    data.push(...vlq(e.tick - last), ...e.bytes);
    last = e.tick;
  }
  data.push(0, 0xff, 0x2f, 0);
  return chunk('MTrk', data);
}

const conductor = (bpm, title) => {
  const us = Math.round(60e6 / bpm);
  return trackChunk([
    { tick: 0, order: 0, bytes: [0xff, 0x03, ...vlq(text(title).length), ...text(title)] },
    { tick: 0, order: 1, bytes: [0xff, 0x51, 0x03, (us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff] },
    { tick: 0, order: 2, bytes: [0xff, 0x58, 0x04, 4, 2, 24, 8] },
  ]);
};

function noteTrack(track) {
  const ch = track.channel;
  const name = text(track.name);
  const events = [{ tick: 0, order: 0, bytes: [0xff, 0x03, ...vlq(name.length), ...name] }];
  if (track.bend !== null) events.push({ tick: 0, order: 1, bytes: [0xe0 | ch, track.bend & 0x7f, track.bend >> 7] });
  for (const n of track.notes) {
    const on = Math.round(n.begin * TICKS_PER_CYCLE);
    const off = Math.max(on + 1, Math.round(n.end * TICKS_PER_CYCLE));
    events.push({ tick: on, order: 3, bytes: [0x90 | ch, n.pitch, n.velocity] });
    events.push({ tick: off, order: 2, bytes: [0x80 | ch, n.pitch, 64] }); // offs before ons on the same tick
  }
  return trackChunk(events);
}

export function smf(tracks, { bpm, title }) {
  const header = Buffer.alloc(6);
  header.writeUInt16BE(1, 0);
  header.writeUInt16BE(tracks.length + 1, 2);
  header.writeUInt16BE(PPQ, 4);
  return Buffer.concat([chunk('MThd', [...header]), conductor(bpm, title), ...tracks.map(noteTrack)]);
}
