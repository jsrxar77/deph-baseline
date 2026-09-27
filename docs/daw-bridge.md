# DAW bridge: Strudel → Ableton Live → back into the pipeline

Strudel is where a deph piece is **composed**; Ableton Live 12 Suite, with the VST/AU library installed on this Mac
(Surge XT, Serum 2, Vital, Kontakt, Massive X, Analog Lab, Ozone 12 Elements, Raum, Replika…), is where its sound can
be **refined**: real instruments instead of superdough's sine/triangle/FM, real effects, mixing, mastering. The bridge
is optional per composition. A piece that never goes through Ableton keeps the existing pipeline
(`render.mjs` → `master.mjs` → `frames.mjs`) unchanged.

The actionable version of this doc is the `ableton-bridge` skill; keep both in sync. Each composition that uses the
bridge also gets a step-by-step guide for the user (who is new to Ableton): `media/<name>/<name>.ableton.md`.

## Two paths, one mapping

| | A. Export (`midi.mjs`) | B. Live (`midi-live.mjs`) |
|---|---|---|
| What | Writes the whole piece as `.mid` files | Plays the piece in real time to the IAC MIDI bus |
| For | The final version recorded in Ableton | Quickly trying instruments/presets while listening |
| Ableton receives | MIDI clips on tracks (editable, exportable) | Live MIDI on armed tracks |
| Tuning, dynamics | Same (shared `midi-map.mjs`) | Same |

Both call `buildTracks()` in `tools/sounds/midi-map.mjs`, so what you audition live is exactly what gets exported.

**Why not Strudel's own `.midi()`**: the VS Code extension used to play pieces (`cmillsdev.strudelvs` 2.1.0) does not
bundle Strudel's MIDI output. Its bundle has the `midichan`/`midiport` control names but no WebMIDI code (checked:
no `requestMIDIAccess` anywhere). `.midi()` works only on strudel.cc in Chrome. `midi-live.mjs` plays from Node through
`@julusian/midi` (prebuilt native binding, installed in `tools/sounds/`) and keeps the loop in the editor.

## The mapping (Strudel event → MIDI)

- **Tracks and channels**: one track per `$:` layer that has notes; MIDI channel = track order (1-based in Ableton).
  Layer keys (`$0`, `$1`, …) are what the inspector and `frames.json` show; `--names` gives them readable names in
  order (Slow Drift: `drone,sub,pad,bells`). Layers stay anonymous `$:` in the `.strudel` file on purpose, because the
  video reads them by key (`bellPulses.ts` filters `$3`).
- **Time**: 1 cycle = 1 bar of 4/4, so **BPM = cpm × 4** (Slow Drift: cpm 30 → 120 BPM). An `arrange()` section of N
  cycles is N bars; bar 1 = second 0. PPQ 480.
- **Pitch and tuning**: `note` (a MIDI number, possibly fractional) → nearest integer note + a residual in cents. A
  piece tuned off 440 has the same residual on every note (Slow Drift, A4 = 432: −31.77 cents), so it becomes **one
  pitch-bend message per track at tick 0**. Bend value for ±2 semitones: 6891 (centre 8192). The user picked this
  as the simplest option: nothing to set in Ableton or in the plugin. Verified: every Surge XT factory preset checked uses a
  ±2 bend range (`pbrange_up/dn = 2` in the `.fxp`). Another synth with a different range needs `--bend-range N`. If
  a track's notes are detuned by different amounts (microtonal writing), one bend can't express it: warning.
- **Tuning handled by the synth** (`--no-bend a,b`): a voice whose notes are detuned by *different* amounts (Musica
  Universalis's Pythagorean monochord: pure fifths, each degree k × 1.955 cents off 12-TET) can't travel as one bend.
  Its track gets no bend, its notes are the nearest 12-TET keys, and the synth applies the tuning from a Scala pair
  written by `tools/sounds/scl.mjs` (`.scl` = exact ratios, `.kbm` = root key at its 12-TET frequency for the piece's
  A4, so the root still meets the equal-tempered voices). Surge XT loads both (Menu → Tuning); Serum 2's support is
  unverified.
- **Dynamics**: superdough fixes `gain` per note at its onset (continuous ramps like `saw.slow(12).range(...)` are
  sampled per note, never mid-note), so per-note velocity is a faithful carrier. The law is **dB-linear**, the one
  Surge XT uses. From its source, `SurgeVoice.cpp`: `Gain = db_to_linear(vca_level + vca_velsense * (1 - velocity))`.
  So `velocity = 127 × (1 + dB / 40)`, `dB = 20·log10(level / track peak)`, where a note's level is
  `gain × velocity`: superdough multiplies the two (linearly), and Musica Universalis's Shepard scale carries its
  bell curve in `velocity`. With Surge's **Vel > Gain set to −40 dB**,
  the synth reproduces Strudel's relative levels exactly. Notes more than 40 dB below the peak get velocity 1.
  **Most Surge factory presets ship with Vel > Gain at 0 dB**, i.e. velocity ignored, so every section fade is
  lost unless the guide makes the user set it. Other synths have their own velocity curves: approximate.
  `--vel-range N` changes the 40.
- **Levels between tracks**: `tracks.json` has each track's peak gain relative to the loudest as `suggestedFaderDb`,
  a starting point only. Each plugin preset has its own output level, so the real balance is set by ear against the
  reference track (the Strudel render).
- **Duplicates**: same pitch at the same onset inside one layer becomes one note, keeping the louder one (Slow Drift's
  bells are two stacked FM operators per hit: 42 events → 21 notes). A repeated pitch before the previous one
  ends cuts the previous one short, because a MIDI channel can't hold two copies of one pitch.
- **Not carried by MIDI**: filter (`lpf`) values and sweeps, reverb (`room`/`size`), delay, pan and its movement,
  envelopes (ADSR), FM. `tracks.json` lists each track's ranges under `params`, and the composition's guide says how to
  recreate each one with plugin settings or Ableton effects.
- **Layers with no notes** (e.g. a binaural pair written with `freq` in Hz): no MIDI equivalent. They become an
  **audio stem**: `render.mjs --only '$4'` renders just that layer, full length from second 0, so it lines up at
  bar 1.

## Files

```
media/<name>/daw/
  <name>.mid             all tracks + conductor (tempo, 4/4)          tracked
  tracks/NN-<name>.mid   one file per track (what the guide uses)     tracked
  tracks.json            per-track mapping info and Strudel params   tracked
  stems/NN-<name>.wav    audio-only layers from render.mjs --only    git-ignored
  exports/<name>-*.wav   mixes exported from Ableton                 git-ignored
  <name> Project/        the Ableton Live Set (<name>.als tracked; audio, Backup/ ignored)
media/<name>/<name>.ableton.md   the step-by-step guide for this piece (tracked)
```

Commands (from the project root):

```
node tools/sounds/midi.mjs media/<name>/sounds/<name>.strudel --cycles <total_cycles> --out-dir media/<name>/daw --names a,b,c
node tools/sounds/render.mjs media/<name>/sounds/<name>.strudel --cycles <total_cycles> --only '$4' --out media/<name>/daw/stems/05-<name>.wav
node tools/sounds/midi-live.mjs media/<name>/sounds/<name>.strudel --cycles <total_cycles> [--from <cycle>] --names a,b,c --watch
node tools/sounds/midi-live.mjs --list
node tools/sounds/scl.mjs --root D --a4 432 --out media/<name>/daw/tuning/<name>-pythagorean
```

**Render time**: `render.mjs` keeps every audio node alive during a render (the guard against the engine lockup), so a
dense piece slows down a lot. Musica Universalis (about 5,900 events, arp and bass in 16ths) took over 25 minutes as one
render. Rendering each layer with `--only` in parallel processes and summing them is equivalent, because every voice
has its own orbit and so its own reverb/delay, and far faster. The per-layer files double as reference stems in
Ableton. Not rendered headlessly: `phaser` (an AudioWorklet that isn't registered in Node), so put phasers in Ableton.

`midi-live.mjs --watch` re-evaluates the file on every save and continues from the current position. A save with an
error keeps the previous version playing (tested). It watches the folder, not the file, because editors that save by
replacing the file would otherwise detach the watcher (found in testing). `--from` also sends the notes that are
already sounding at that cycle, so starting mid-drone still has the drone.

## Back into the pipeline

Once a mix is exported from Ableton (full length from bar 1 plus a tail for reverbs):

1. **Convert into `sync/`** in the exact format the rest of the pipeline reads (16-bit PCM, 48 kHz, stereo, plain
   44-byte header; `frames.mjs --audio` computes the duration from that header):
   `ffmpeg -i media/<name>/daw/exports/<name>-mix.wav -ar 48000 -ac 2 -c:a pcm_s16le -map_metadata -1 -fflags +bitexact -flags:a +bitexact media/<name>/sync/audio.wav`
2. **Check alignment**: `node tools/sounds/align-check.mjs media/<name>/sync/audio.wav --frames media/<name>/sync/frames.json`.
   It high-passes the audio (500 Hz), and slides one layer's onsets over the rise of its energy. The best shift is
   the global offset, which must be within 35 ms. Tested on Slow Drift: its own render reads +15 ms (the rise peaks at
   the end of the bell's attack); a copy delayed 250 ms reads +265 and one cut 100 ms early reads −85. It picks the
   layer with the shortest attack by default; a slow-attack layer gives no clear peak and reports INCONCLUSIVE
   rather than a wrong number.
3. **Master**, one of two options (left open on purpose, per composition):
   - *In Ableton* (Ozone 12 Elements on the Master track): export twice. With Ozone bypassed →
     `sync/audio.wav`, and with Ozone on → converted the same way to `sync/audio-master.wav`. Then
     `node tools/sounds/master.mjs media/<name>/sync/audio-master.wav --measure` checks it against −16 LUFS / −1 dBTP.
   - *In the pipeline*: export without anything on the Master track, then `master.mjs` as usual.
4. **Regenerate `frames.json`/`manifest.json`** with `frames.mjs ... --audio media/<name>/sync/audio.wav` (the
   events are unchanged, but the duration comes from the new audio), and refresh the copies in
   `tools/visuals/public/`.
5. **Record it in the yaml**: `domains.sound.source: ableton` (vs `strudel`), so a later `render.mjs` run isn't
   mistaken for the current audio. `sync/audio.wav` holds whichever source the yaml names. The Strudel render can
   always be regenerated.

Consequence to watch: a video's audio-reactive mapping was tuned against the Strudel render's levels (Slow Drift's
`FractalVisualizer.tsx` says so). A new mix has different band energies, so check the reactivity after switching
sources.

## What Claude can and cannot do here

Claude cannot operate Ableton or hear the result. It prepares what goes in (`.mid`, stems, `tracks.json`, the guide),
plays live MIDI to the IAC bus, and verifies what comes out (alignment, loudness). Choosing and judging sounds is the
user's, and the guide's preset suggestions are chosen from preset names and measured parameters, not by ear.

## Driving Live directly: the Ableton MCP server

Installed 2026-09-27 and tested on Live 12.4.6: `mcp-server-ableton-live` 1.8.1 (MIT, wstierhout/ableton-live-mcp),
registered in the project's `.mcp.json` (`uvx mcp-server-ableton-live@1.8.1`, version pinned). Its Remote Script is at
`~/Music/Ableton/User Library/Remote Scripts/AbletonMCP/`, selected in Live as Control Surface "AbletonMCP" (Input and
Output None). Code reviewed before installing: the script listens on 127.0.0.1:9877 only, dispatches a closed
whitelist of commands (no eval/exec), writes no files and makes no network calls. The wheel's hash matched PyPI, and the
installed script matched the reviewed one (`uvx mcp-server-ableton-live@1.8.1 doctor --json` checks it).

Tested, working:
- Read the set, set tempo, create tracks, **load third-party plugins by browser URI** (Surge XT and Serum 2, e.g.
  `query:Plugins#VST3:Surge%20Synth%20Team:Surge%20XT`, `query:Plugins#VST3:Xfer%20Records:Serum%202`).
  The project README says it can't; the browser's Plug-Ins root works.
- Create a Session clip, write notes with velocity, `duplicate_to_arrangement` at an exact beat (checked with
  `get_arrangement_clips`).
- Load native effects (e.g. `query:AudioFx#Utility`) and set or automate their parameters. **Clip automation of
  Utility's Output (gain)** works; its native value maps to **dB = 35 × value** between −0.5 and +0.5 (−0.25 → −8.75 dB,
  −0.5 → −17.5 dB, 0.5 → +17.5 dB), and it curves below: −0.75 → −29.6 dB.

Found limits:
- **Plugin parameters are invisible**: Live exposes none of Surge's or Serum's internal parameters to the API (only
  "Device On") unless they are added by hand in the device's **Configure** mode. So Vel > Gain, envelopes and presets
  stay manual. Section fades therefore go on a native **Utility** after the synth, as clip automation, which works with
  any synth and needs no velocity setting.
- **No pitch bend**: `write_automation` only reaches device parameters (clip envelopes of Session clips), not a MIDI
  clip's pitch-bend envelope. With MCP-written notes, 432 Hz has to come from the synths' own tuning. Surge XT loads
  `.scl`/`.kbm`. **Serum 2 has "Load Tuning (.tun)…", "Global Tuning" and MTS-ESP** (strings in its binary). The
  exported `.mid` files still carry the bend, for the manual path.
- **A modal dialog in Live freezes the bridge**: every command times out. The first load of Surge XT did this, and the
  user pressing Enter in Live released it.
- `batch_commands` uses the Remote Script's own parameter names (`item_uri`, not `uri`, for loading).
- `set_device_parameter` rejected negative dB strings ("-12 dB"); native numbers work.
- `record_section` records in real time, capped at 5 minutes per call: an 8-minute piece takes two calls.

### Building a whole set through the MCP (done for Musica Universalis v2, 2026-09-27)

Procedure that worked, all verified by reading the set back:
1. **Structure**: tempo, tracks, names in one `batch_commands`. Load each plugin separately, because a plugin window can
   open a modal and freeze the bridge. Then a **Utility right after every synth**: it carries the section fades as clip
   automation of `Output`, so dynamics don't depend on the synth's velocity response. Velocity stays constant (100),
   except where it *is* the musical content (the Shepard scale's per-voice bell).
2. **Notes without sending thousands**: a plan script evaluates the piece and, per voice and segment, finds the base
   period (4 or 8 bars; the Shepard scale repeats every 14 beats), and checks that tiling it reproduces the Strudel
   notes exactly (0 mismatches). Per track: one **template clip** in a spare Session slot, then per segment
   `duplicate_clip_to` → `duplicate_loop` until long enough → `set_clip_loop(end)` + `crop` for odd lengths →
   `write_automation` → `duplicate_to_arrangement` at the segment's beat. About 300 notes crossed the bridge instead of
   about 7,000.
3. **Verify**: `get_arrangement_clips` for every track against the plan (all 29 clip positions matched), and
   `get_clip_notes` counts on cropped clips.

Parameter facts measured on Live 12.4.6:
- Utility `Output`: dB = 35 × value on [−0.5, 0.5]. Below that: −0.55 → −19.3, −0.6 → −21.4, −0.65 → −23.7, −0.75 →
  −29.6, −0.8 → −33.5, −0.85 → −38.6 dB, and −1 → −inf.
- Auto Filter `Frequency`: value = log10(Hz / 20) / 3 (20 Hz to 20 kHz, exactly logarithmic).
- Reverb `Decay Time`, `Dry/Wet` and Delay `L Time` accept display strings ("6 s", "35 %", "1130 ms").
- Enum parameters take the **index** as a number: Delay `L 16th` "3" is index 2. Passing "3" set index 3 ("4").
- Auto Pan-Tremolo's `Frequency` bottoms out at 0.10 Hz. For slower movement use `Time Mode` = Time, where `Time` goes
  up to 200 s.
- An audio clip from `create_audio_clip` comes in warped: set `warping` false (`set_clip_audio`) for stems.
- Loading a plugin can arm its track: disarm afterwards.
- `save_set` can't Save As, so the user saves the set to `media/<name>/daw/`.

**Retriggered long notes don't translate.** A Strudel voice that repeats one long note (Musica Universalis's drone: every
4 bars, attack 3 s / release 5 s, cross-fading into a continuous sound) relies on Strudel's own envelope. In Live, the
preset's envelope rules instead, and "Subtle Comb Strings" has 0.08 s attack and 0.44 s release: the user heard the drone
cut and re-attack every 8 s ("el drone no está funcionando como drone"). Fix: in Live, a drone is **one held note per
segment** (up to 64 bars). The "no note longer than 4 bars" rule exists only because Strudel can't stop a started note;
it doesn't apply in a DAW. Check any voice whose notes rely on long attack/release overlaps (pads retriggering every bar)
the same way.

The plan/command scripts for Musica Universalis are ad hoc; generalising them into `tools/sounds/` (reading the segment
list from the piece) is the next step if this becomes the standard path.
