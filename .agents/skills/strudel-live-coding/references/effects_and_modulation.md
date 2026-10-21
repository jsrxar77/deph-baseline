# Strudel Audio Effects & Modulation Guide 🎛️🌊

Source: [https://strudel.cc/learn/effects/](https://strudel.cc/learn/effects/) & [https://strudel.cc/learn/signals/](https://strudel.cc/learn/signals/)

---

## 1. Filter Effects

### Low-Pass Filter (`lpf`)
Attenuates frequencies above the cutoff point (measured in Hz).
```javascript
// Cutoff frequency at 800 Hz
note("c2 c3 c2 c3").s("sawtooth").lpf(800)

// Dynamic cutoff stepping across notes
note("c2 c3 c2 c3").s("sawtooth").lpf("300 800 1500 400")
```

### High-Pass Filter (`hpf`) & Band-Pass Filter (`bpf`)
* `hpf(freq)`: Cuts low frequencies (useful for clearing muddy bass from leads or claps).
* `bpf(freq)`: Passes only a narrow band around `freq`.

### Filter Resonance (`lpq`)
Boosts frequencies around the cutoff point, providing classic synthesizer squelch/bite:
```javascript
note("c2 [c2 c3]").s("sawtooth").lpf(600).lpq(8)
```

### Formant / Vowel Filter (`vowel`)
Simulates human vocal tracts using five primary vowel formants:
```javascript
s("sawtooth").vowel("<a e i o u>")
```

---

## 2. Dynamic & Spatial Processing

### Volume & Velocity (`gain`)
Values range from `0` (silent) to `1` (nominal), with values `> 1` for amplification:
```javascript
// Accent every downbeat
s("hh*16").gain("[1 .3 .6 .3]*4")
```

### Stereo Panning (`pan`)
* `0.0`: Full Left
* `0.5`: Center
* `1.0`: Full Right
```javascript
s("hh*8").pan("0 .2 .4 .6 .8 1")
```

### Saturation & Distortion (`shape`)
Adds harmonic distortion / clipping:
```javascript
note("c2 c3").s("sawtooth").shape(0.4) // Subtle warmth
note("c2 c3").s("sawtooth").shape(0.8) // Aggressive overdrive
```

---

## 3. Envelopes (ADSR)

Controls volume changes over time per triggered event:
* **Attack (`attack`)**: Seconds to reach peak volume.
* **Decay (`decay`)**: Seconds to drop from peak to sustain level.
* **Sustain (`sustain`)**: Level held while the note is active (0.0 to 1.0).
* **Release (`release`)**: Seconds to fade to zero after the note turns off.

### Shorthand Syntax
```javascript
// Full method chaining:
note("c3 eb3 g3").s("sawtooth").attack(0.01).decay(0.1).sustain(0.3).release(0.2)

// Shorthand string (A:D:S:R):
note("c3 eb3 g3").s("sawtooth").adsr(".01:.1:.3:.2")
```

---

## 4. Time-Based Effects

### Delay / Echo (`delay`)
Syntax: `.delay("volume:time:feedback")`
* **volume**: 0 to 1
* **time**: delay duration relative to cycle (e.g. `1/8`, `0.25`, `0.125`)
* **feedback**: regeneration factor (0.1 to 0.9)
```javascript
// Quick eighth-note slapback echo with medium decay:
s("bd rim [~ cp] rim").bank("RolandTR707").delay(".6:.125:.5")
```

### Reverb / Room (`room`)
Simulates acoustic reverberation:
```javascript
note("c4 eb4 g4 bb4").s("piano").room(0.8).roomsize(2)
```

---

## 5. Continuous Modulation: Signals & LFOs

Signals are mathematical waveforms that produce continuously varying streams of values rather than discrete step events.

### Built-in Signal Waveforms
| Waveform | Shape | Trajectory |
| :--- | :--- | :--- |
| `sine` | Smooth Sine Wave | Gentle back-and-forth oscillation |
| `saw` | Sawtooth Ramp | Upward linear ramp followed by immediate drop |
| `tri` | Triangle Wave | Linear rise and fall |
| `square` | Square Wave | Binary alternating state |
| `rand` | Uniform Noise | Completely random continuous values |
| `perlin` | Perlin Noise | Coherent, organic natural wandering |

### Signal Scaling & Operators
By default, signals oscillate between `0` and `1`. Transform them with:
* `.range(min, max)`: Rescales output between `min` and `max`.
* `.slow(n)`: Stretches the waveform across `n` cycles.
* `.fast(n)`: Speeds up the waveform `n` times.
* `.mul(n)` / `.add(n)`: Arithmetic scaling.

```javascript
// Sweeping low-pass filter over 8 cycles:
note("<[c2 c3]*4 [bb1 bb2]*4>")
  .s("sawtooth")
  .lpf(sine.range(200, 2500).slow(8))
  .lpq(4)

// Generative humanized velocity:
s("hh*16").gain(perlin.range(0.3, 0.95))
```

---

## 6. Algorithmic Pattern Combinators

* **`rev()`**: Inverts pattern playback: `n("0 2 4 7").rev()`
* **`jux(fn)`**: Juxtaposes original pattern in left ear and transformed version in right ear:
  ```javascript
  n("0 2 4 7").scale("C:minor").s("piano").jux(rev)
  ```
* **`ply(n)`**: Stutters / retriggers each event `n` times:
  ```javascript
  s("bd sd").ply("<1 2 4 2>")
  ```
* **`off(timeOffset, fn)`**: Superimposes a time-delayed and transformed layer:
  ```javascript
  n("0 2 4 6").off(1/16, x => x.add(7)).scale("C:minor").s("sawtooth")
  ```
* **`superimpose(fn)`**: Duplicates the pattern and applies `fn` without time-offsetting:
  ```javascript
  note("c3 eb3 g3").s("sawtooth").superimpose(x => x.add(note(12)).delay(0.25))
  ```
* **`every(cycles, fn)`**: Runs `fn` only on specific cycle multiples:
  ```javascript
  s("bd hh sd hh").every(4, x => x.ply(2))
  ```
