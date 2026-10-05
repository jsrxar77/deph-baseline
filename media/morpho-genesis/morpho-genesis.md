# Morpho-Genesis

`sounds/morpho-genesis.strudel` (this composition's folder is `media/morpho-genesis/`) — a 24:09 generative ambient piece exploring the cosmic progression from **Vibration** to **Frequency** to **Sacred Geometry**. Composed in the cosmic mode **F# Lydian** (`F#:lydian`) tuned to **A4 = 432 Hz**, engineered with wide dynamic range, negative space, and strict spectral separation for profound meditation.

Cross-domain metadata is in `morpho-genesis.yaml`.

---

## 1. Dynamic Architecture (Wide Dynamic Range & Negative Space)

To prevent the "sound ball" (clutter/saturation) characteristic of flat ambient mixes, the piece employs strict dynamic staging and counter-phase breathing:

1. **Intimate Valley (Intro 0:00 - 3:00):**
   Ultra-sparse, whisper-level entrance (gains 0.006 - 0.040). The sub-bass is completely silent, keeping the floor light and uncrowded. The celestial pad breathes in dark warmth (420 → 560 Hz) without invading the mix. At 0:08, a single, deep crystal bowl in F#4 sounds softly with a felt mallet.

2. **Tidal Development (3:00 - 8:20):**
   Layers enter sequentially rather than simultaneously. The sub-bass is held silent until cycle 130 (halfway through development), entering as a gentle swell (0.020 → 0.065). The pad breathes in slow 24-cycle tidal waves. Singing bowls accent the space with generous 6-8 second gaps.

3. **Open Sky Climax (8:20 - 17:30):**
   A radiant, luminous peak, yet uncluttered:
   - **Counter-Phase Breathing:** When the 120-cycle (4-minute) Shepard ascension begins, the celestial pad **ducks to half-gain (0.045) and closes its filter (550 Hz)**, while the sub-bass pulls back to 0.035. This clears the upper-mid spectrum, giving the Shepard flight an uncrowded sky to ascend infinitely without harmonic masking.
   - **Beacon Decompression:** The Cosmic Beacon outlines the sacred geometry leitmotif with soft presence (0.022), bouncing cleanly across the stereo field.

4. **Progressive Unlayering (Deceleration 17:30 - 21:50):**
   Layers exit one by one: the sub-bass leaves at cycle 50 of deceleration, singing bowls thin out, and the pad descends into darkness (650 → 450 Hz, gains 0.065 → 0.020).

5. **Stillness (Outro 21:50 - 24:09):**
   Sub-bass, pad, bowls, and Shepard are completely silent. Only a fading drone (0.017), the binaural Delta pulse (0.020), and two distant beacon droplets (0.002) dissolve into pure silence at cycle 724.5.

---

## 2. Structure & Arc (24:09 exact)

Set to `setcpm(30)` where 1 cycle = 2 seconds. The total duration of 1449 seconds corresponds to **724.5 cycles**:

| Section | Cycles | Start (time) | Duration | Description |
| :--- | :---: | :---: | :---: | :--- |
| **Intro** | 90 | 0:00 | 3:00 (180s) | Intimate valley (gains 0.016-0.045), sub silent, warm pad (420->560 Hz), Theta beat, single bowl at 0:08, Beacon droplets (0.016 -> 0.026) |
| **Development** | 160 | 3:00 | 5:20 (320s) | Sequential entry: sub enters late (cycle 130), pad 24-cycle tidal swell, spacious bowls, Beacon ascending steps (0.026 -> 0.038) |
| **Climax & Flight** | 275 | 8:20 | 9:10 (550s) | Peak with Shepard open sky: pad ducks to 0.045 / 550 Hz during Shepard flight, Beacon peaking luminously at 0.052 |
| **Deceleration** | 130 | 17:30 | 4:20 (260s) | Unlayering: sub exits early, bowls thin, pad filter settles, Beacon melody disassembles (gain 0.042 -> 0.018) |
| **Outro** | 69.5 | 21:50 | 2:19 (139s) | Pure stillness: pad/sub/bowls/Shepard silent. Fading drone (0.017), Delta beat (4 Hz), final Beacon droplets (0.004 -> 0.014) |
| **Total** | **724.5** | — | **24:09** | **1449 seconds exact** |

---

## 3. Scale, Key & Tuning

* **Scale:** `F#:lydian` (F# G# A# B# C# D# E#)
  - Root: `F#`
  - Suffix: `:lydian` (single-quoted in JS to avoid Strudel mini-notation parser gotchas)
  - Color: Cosmic, celestial, ingravitational. The augmented 4th (B# / enharmonic C) creates a luminous, suspended quality characteristic of deep space exploration.
* **Tuning:** A4 = 432 Hz
  - Offset: `const TUNE = 12 * Math.log2(432 / 440)` (-0.3177 semitones)
  - Applied uniformly via `const tune = (p) => p.add(note(TUNE))` across all pitched layers.
* **Binaural Layer:**
  - Carrier: $F\#3 = 432 \times 2^{-15/12} \approx 181.65\text{ Hz}$.
  - Split: Left channel ($181.65 - \frac{\text{beat}}{2}\text{ Hz}$) and Right channel ($181.65 + \frac{\text{beat}}{2}\text{ Hz}$).
  - Arc schedule: 6 Hz (Intro) → 5 Hz (Dev) → 6 Hz (Climax) → 5 Hz (Decel) → 4 Hz (Outro). Dry, no reverb, dedicated `.orbit(5)`.

---

## 4. Voice Architecture & Spectral Separation

* **Layer 0 — Primordial Drone (`orbit(1)`):**
  Warm triangle foundation on F#2 and C#3 (`lpf(520-680)`). Gains: Intro 0.035 → Dev 0.080 → Climax 0.045 (ducks) → Decel 0.035 → Outro 0.017.
* **Layer 1 — Sub Bass:**
  Clean sine sub roots strictly below 140 Hz (`lpf: 140`). Silent in Intro, enters cycle 130, ducks to 0.035 during Shepard, exits cycle 50 of Decel, silent in Outro.
* **Layer 2 — Ethereal Sacred Pad (`orbit(2)`):**
  Warm mid-range cushion (`lpf: 420-850 Hz`), entering warmly from cycle 0. Reverb `size(8.5)`. Counter-phase breathing: ducks to 0.045 / 550 Hz during the Shepard ascent.
* **Layer 3 — Crystal & Tibetan Singing Bowls (`orbit(3)`):**
  Soft mallet attack (`attack: 0.18s`, `hpf: 400`, `lpf: 2000`), spacious 16-cycle phrase with 6-8 seconds of silence between strikes. Attenuated background levels (`0.018 - 0.048`).
* **Layer 4 — Shepard-Risset Endless Ascent (`orbit(4)`):**
  5 octaves of triangle voices climbing through 120 cycles in the Climax (`hpf: 300`, `lpf: 2400`, gain peak `0.060`). Operates in an uncluttered acoustic sky.
* **Layer 5 — Binaural Beat (`orbit(5)`):**
  Direct sine tones panned hard L/R (`gain: 0.020 - 0.026`).
* **Layer 6 — Cosmic Beacon Bell (`orbit(6)`):**
  Crystal droplet (`fm: 0.55`, `fmh: 2`, `attack: 0.025s`, `decay: 0.60s`, `release: 0.80s`, `hpf: 750`, `lpf: 3200`).
  Organically spaced 2.0-second bounces via `.late(1.0)`:
  - $t=0.0s$ (Cycle 0): Left (`pan: 0.18`, velocity `1.00`)
  - $t=+2.0s$ (Cycle 1): Right (`pan: 0.82`, velocity `0.58`)
  - $t=+4.0s$ (Cycle 2): Left (`pan: 0.22`, velocity `0.32`)
  - $t=+6.0s$ (Cycle 3): Right (`pan: 0.78`, velocity `0.16`)
  Balanced dynamic range: `0.006` (Intro) $\to$ `0.016` (Dev) $\to$ `0.022` (Climax) $\to$ `0.002` (Outro).
