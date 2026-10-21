# Strudel Soundbanks & Synthesizers Reference 🎹🥁

Source: [https://strudel.cc/learn/samples/](https://strudel.cc/learn/samples/) & [https://strudel.cc/learn/synths/](https://strudel.cc/learn/synths/)

---

## 1. Built-in Drum Machines (`bank`)

To apply a drum machine bank to your sounds, chain `.bank("BankName")` to any drum pattern:

```javascript
s("bd hh sd cp").bank("RolandTR909")
```

### Supported Kit Names
| Bank Name | Musical Heritage / Characteristics |
| :--- | :--- |
| `RolandTR909` | Industry standard for House, Techno, Acid, Trance |
| `RolandTR808` | Deep sub kicks, crisp snappy snares for Hip-Hop, Trap, Electro |
| `RolandTR707` | Punchy 80s digital drums, classic Chicago House, Synthpop |
| `RolandTR505` | Vintage 80s PCM rhythm machine |
| `AkaiLinn` | Iconic LinnDrum LM-2 / Linn 9000 sound (Prince, 80s pop) |
| `CasioRZ1` | Lo-fi 12-bit PCM sampling drum machine |
| `RhythmAce` | Vintage analog preset drum machine (Ace Tone / early Roland) |
| `ViscoSpaceDrum` | Analog space percussion synthesizer |
| `RolandCompurhythm1000` | Vintage preset rhythm box |

### Standard Drum Triggers
| Trigger | Component |
| :--- | :--- |
| `bd` | Bass Drum / Kick |
| `sd` | Snare Drum |
| `rim` | Rimshot |
| `hh` | Closed Hi-Hat |
| `oh` | Open Hi-Hat |
| `cp` | Hand Clap |
| `lt` | Low Tom |
| `mt` | Middle Tom |
| `ht` | High Tom |
| `rd` | Ride Cymbal |
| `cr` | Crash Cymbal |
| `perc` | General Percussion |

---

## 2. Default Acoustic & Miscellaneous Samples

These sounds can be played directly with `sound("name")` or `s("name")`:
* `casio`: Classic Casio VL-Tone / keyboard sounds (`casio:0`, `casio:1`, etc.)
* `metal`: Metallic percussions and strikes
* `jazz`: Acoustic jazz drum and percussion set
* `wind`: Wind / atmospheric textures
* `insect`: Insect chirps and organic clicks
* `east`: World/Eastern percussions
* `space`: Sci-fi effects and sound design hits
* `crow`: Crow sound effects
* `numbers`: Spoken numbers (`numbers:0` to `numbers:9`)

---

## 3. Web Audio Synthesizers

Strudel includes native Web Audio oscillators that respond to `note(...)` or `n(...)`:

```javascript
note("c3 eb3 g3 bb3").s("sawtooth")
```

| Synth Type | Tone Character | Best For |
| :--- | :--- | :--- |
| `sawtooth` | Rich in harmonics, bright, buzzy | Basslines, synth leads, brass stabs |
| `square` | Hollow, woody, odd harmonics | Chiptune 8-bit, clarinet-like leads, hollow bass |
| `triangle` | Soft, round, gentle harmonics | Warm sub bass, soft flute-like melodies |
| `sine` | Pure fundamental frequency, no harmonics | Deep 808 sub bass, test tones, smooth pads |

---

## 4. General MIDI Soundbank Instruments

Strudel can load high-quality General MIDI sampled instruments on demand:

```javascript
note("c4 e4 g4 b4").s("piano")
note("c2 [c2 c3]").s("gm_acoustic_bass")
```

### Popular General MIDI Instruments
* **Keyboards**: `piano`, `gm_epiano1`, `gm_epiano2`, `gm_harpsichord`, `gm_clavinet`
* **Bass**: `gm_acoustic_bass`, `gm_electric_bass_finger`, `gm_electric_bass_pick`, `gm_synth_bass_1`, `gm_synth_bass_2`
* **Guitars**: `gm_acoustic_guitar_nylon`, `gm_electric_guitar_clean`, `gm_electric_guitar_muted`, `gm_overdriven_guitar`
* **Strings & Pads**: `gm_violin`, `gm_cello`, `gm_synth_strings_1`, `gm_string_ensemble_1`, `gm_choir_aahs`, `gm_voice_oohs`
* **Winds & Brass**: `gm_trumpet`, `gm_trombone`, `gm_tenor_sax`, `gm_flute`, `gm_blown_bottle`
* **Tuned Percussion**: `gm_xylophone`, `gm_marimba`, `gm_vibraphone`, `gm_glockenspiel`
* **World / Ethnic**: `gm_sitar`, `gm_koto`, `gm_kalimba`, `gm_accordion`

---

## 5. Custom Sample Loading

External sound packs can be imported via GitHub or URL using `samples()`:

```javascript
// Load Dirt samples from GitHub:
samples('github:tidalcycles/dirt-samples')

// Load custom folder / CDN:
samples({
  snare: 'https://cdn.freesound.org/previews/123/123456_lq.mp3',
  kick: 'https://example.com/audio/kick.wav'
})
```
