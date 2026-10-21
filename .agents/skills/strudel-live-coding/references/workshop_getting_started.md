# Strudel Workshop: Getting Started & Core Concepts 🚀

Source: [https://strudel.cc/workshop/getting-started/](https://strudel.cc/workshop/getting-started/)

## 1. What is Strudel?
Strudel is an official JavaScript port of **TidalCycles**, the renowned live-coding pattern language created by Alex McLean. It brings algorithmic music composition directly to the web browser and modern JavaScript runtimes without requiring specialized audio synthesis software or complex setups.

### Key Applications
* **Live Coding**: Perform, compose, and tweak music in real time.
* **Algorithmic Composition**: Structure polyrhythms, generative melodies, and polymetric patterns.
* **Music & Code Education**: Low barrier of entry to learn programming and music theory simultaneously.
* **Hardware & Studio Integration**: Output MIDI and OSC signals to external synthesizers, DAWs, or visuals (Hydra).

---

## 2. Chapter 1: First Sounds

### Interactive Execution Shortcuts
* `Ctrl` + `Enter`: Play / Evaluate code block.
* `Ctrl` + `.`: Stop all playback (hush).
* `Ctrl` + `Z`: Undo previous code edit.

### Basic Sound Triggering
```javascript
sound("casio")
// or shorthand:
s("casio")
```
* Built-in sound samples: `casio`, `metal`, `insect`, `wind`, `jazz`, `east`, `crow`, `space`, `numbers`.
* Select alternate samples with `:` followed by an index (0-indexed):
```javascript
sound("casio:1")
sound("jazz:3")
```

### Drum Sounds
Standard drum abbreviations available by default:
* `bd` = Bass Drum (Kick)
* `sd` = Snare Drum
* `rim` = Rimshot
* `hh` = Closed Hi-Hat
* `oh` = Open Hi-Hat
* `lt` / `mt` / `ht` = Low, Middle, High Toms
* `rd` = Ride Cymbal
* `cr` = Crash Cymbal
* `cp` = Hand Clap

### Drum Machine Banks
Use `.bank("Name")` to switch the kit:
```javascript
sound("bd hh sd oh").bank("RolandTR909")
```
Common drum machine banks:
* `RolandTR909` (House, Techno)
* `RolandTR808` (Hip-Hop, Trap, Electro)
* `RolandTR707` (Classic 80s dance)
* `RolandTR505`
* `AkaiLinn` (LinnDrum)
* `RhythmAce`
* `ViscoSpaceDrum`
* `CasioRZ1`
* `RolandCompurhythm1000`

### Sequences & Tempo
* **Space-separated events** fit evenly inside one cycle:
  ```javascript
  sound("bd hh sd hh")
  ```
* **Cycles Per Minute (`setcpm`)**: Default is 30 cycles/minute (= 120 BPM in 4/4 time).
  ```javascript
  setcpm(90/4) // 90 BPM in 4/4
  ```
* **One sound per cycle `<...>`**: Angle brackets play one element per cycle, maintaining tempo regardless of list length:
  ```javascript
  sound("<bd bd hh bd rim bd hh bd>*8")
  ```
* **Rests `~` or `-`**: Insert silence:
  ```javascript
  sound("bd hh - rim - bd hh rim")
  ```
* **Sub-sequences `[...]`**: Squish multiple events into the slot of one event:
  ```javascript
  sound("bd [hh hh] sd [hh bd]")
  ```
* **Multipliers `*`**: Speed up individual events or subsequences:
  ```javascript
  sound("bd hh*2 rim hh*3 bd [- hh*2]")
  ```
* **Parallel sequences `,`**: Play simultaneous rhythms in one string:
  ```javascript
  sound("hh*4, bd [bd, casio]")
  ```
* **Sample selection with `n`**:
  ```javascript
  n("0 1 [4 2] 3*2").sound("jazz")
  ```

---

## 3. Chapter 2: First Notes

### Playing Pitches: Numbers vs Letters
Pitches can be specified as MIDI numbers or note names:
```javascript
// MIDI note numbers:
note("48 52 55 59").sound("piano")

// Note names (middle C is c3 or c4 depending on convention):
note("c e g b").sound("piano")

// Flats and sharps:
note("db eb gb ab bb").sound("piano")
note("c# d# f# g# a#").sound("piano")

// Specific octaves:
note("c2 e3 g4 b5").sound("piano")
```

### Built-in Instruments & Synths
* Synthesizer waveforms: `sawtooth`, `square`, `triangle`, `sine`.
* General MIDI instruments: `piano`, `gm_acoustic_bass`, `gm_electric_guitar_muted`, `gm_voice_oohs`, `gm_blown_bottle`, `gm_synth_bass_1`, `gm_synth_strings_1`, `gm_xylophone`, `gm_accordion`.

### Harmonic Scales with `scale`
Instead of calculating MIDI numbers manually, use scale degrees with `.scale("Root:Mode")`:
```javascript
n("0 2 4 <[6,8] [7,9]>").scale("C:minor").sound("piano")
```
Supported scales include:
* `C:major`, `A2:minor`, `D:dorian`, `G:mixolydian`, `A2:minor:pentatonic`, `F:major:pentatonic`, `C:harmonic:minor`, etc.
* Scales can be automated across cycles:
```javascript
n("<0 -3>, 2 4 <[6,8] [7,9]>").scale("<C:major D:mixolydian>/4").sound("piano")
```

### Time Modifiers in Mini-Notation
* **Division `/`**: Slow down an event or group over multiple cycles:
  ```javascript
  note("[36 34 41 39]/4").sound("gm_acoustic_bass")
  ```
* **Elongation `@`**: Extend note duration (weight) relative to others:
  ```javascript
  note("c@3 eb").sound("gm_acoustic_bass") // c lasts 3 units, eb lasts 1 unit
  ```
* **Replication `!`**: Repeat an event without changing subdivision tempo:
  ```javascript
  note("c!2 [eb, g]").sound("piano")
  ```

### Parallel Patterns with `$: `
Play multiple independent streams simultaneously:
```javascript
$: note("<[c2 c3]*4 [bb1 bb2]*4 [f2 f3]*4 [eb2 eb3]*4>")
  .sound("gm_synth_bass_1")
  .lpf(800)

$: n(`<
  [~ 0] 2 [0 2] [~ 2]
  [~ 0] 1 [0 1] [~ 1]
  [~ 0] 3 [0 3] [~ 3]
  [~ 0] 2 [0 2] [~ 2]
>*4`).scale("C4:minor").sound("gm_synth_strings_1")

$: sound("bd*4, [~ <sd cp>]*2, [~ hh]*4").bank("RolandTR909")
```
> Tip: Prefix with `_$` (e.g. `_$: sound(...)`) to mute that layer.

---

## 4. Chapter 3: First Effects

### Filters
* **Low-Pass Filter (`lpf`)**: Cuts high frequencies (values in Hz, e.g. 200 - 5000):
  ```javascript
  note("c2 c3 c2 c3").sound("sawtooth").lpf("200 1000 200 1000")
  ```
* **Vowel Filter (`vowel`)**: Formant filter imitating vocal sounds (`a`, `e`, `i`, `o`, `u`):
  ```javascript
  sound("sawtooth").vowel("<a e i o>")
  ```

### Dynamics & Spatials
* **`gain(val)`**: Volume control (default 1). Ideal for accents:
  ```javascript
  sound("hh*16").gain("[.25 1]*4")
  ```
* **`pan(val)`**: Stereo placement (0 = full left, 0.5 = center, 1 = full right):
  ```javascript
  sound("numbers:1 numbers:2 numbers:3 numbers:4").pan("0 0.3 .6 1")
  ```
* **`speed(val)`**: Sample playback rate (negative values play backward):
  ```javascript
  sound("bd rim [~ bd] rim").speed("<1 2 -1 -2>")
  ```

### ADSR Envelope
* Individual methods: `.attack(s)`, `.decay(s)`, `.sustain(0-1)`, `.release(s)`.
* Compact shorthand `.adsr("A:D:S:R")`:
  ```javascript
  note("c3 bb2 f3 eb3").sound("sawtooth").adsr(".1:.1:.5:.2")
  ```

### Time-Based Effects
* **`delay(vol:time:feedback)`**: Echo effect:
  ```javascript
  sound("bd rim").bank("RolandTR707").delay(".5:.125:.6")
  ```
* **`room(size)`**: Reverb / acoustic space simulator (0 to 2+):
  ```javascript
  sound("bd rim bd cp").room(0.5)
  ```

### Modulation with Signals & LFOs
Animate continuous parameters using waveforms:
* Waveforms: `sine`, `saw`, `tri`, `square`, `rand`, `perlin`.
* Range & Speed mapping:
  ```javascript
  sound("hh*16").lpf(saw.range(200, 4000).slow(2))
  sound("hh*16").gain(sine.range(0.2, 1))
  ```

---

## 5. Chapter 4: Pattern Effects

Transform existing patterns algorithmically:
* **`rev()`**: Reverse pattern playback direction:
  ```javascript
  n("0 1 [4 3] 2 0 2 [~ 3] 4").sound("jazz").rev()
  ```
* **`jux(fn)`**: Juxtapose: play original on left channel, transformed on right channel:
  ```javascript
  n("0 1 [4 3] 2 0 2 [~ 3] 4").sound("jazz").jux(rev)
  ```
* **`add(pattern)`**: Transpose notes or sample indices:
  ```javascript
  note("c2 [eb3,g3]".add("<0 <1 -1>>").add("0,7"))
  ```
* **`ply(n)`**: Stutter / retrigger each event `n` times within its time window:
  ```javascript
  sound("hh hh, bd rim [~ cp] rim").ply(2)
  sound("bd sd").ply("<1 2 4 2>")
  ```
* **`off(timeOffset, fn)`**: Superimpose a copy of the pattern shifted in time and modified:
  ```javascript
  n("0 [4 <3 2>] <2 3> [~ 1]").off(1/16, x => x.add(4)).scale("C5:minor").s("triangle")
  ```
* **`fast(n)` & `slow(n)`**: Scale tempo at the pattern method level:
  ```javascript
  sound("bd sd").fast(2)
  sound("bd sd").slow(2)
  ```
