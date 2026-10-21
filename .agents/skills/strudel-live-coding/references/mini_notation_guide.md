# TidalCycles Mini-Notation in Strudel 🎼

The **Mini-Notation** is a domain-specific rhythm language designed to express intricate polyrhythmic, Euclidean, and polymetric patterns concisely. In Strudel, mini-notation strings are evaluated by `@strudel/mini`.

---

## 1. Syntax Overview Table

| Symbol / Operator | Concept | Description | Example |
| :--- | :--- | :--- | :--- |
| ` ` (space) | **Sequence** | Events divide the current cycle evenly | `s("bd sd hh cp")` |
| `[ ... ]` | **Sub-sequence** | Grouped events take the duration of a single outer event | `s("bd [hh hh] sd hh")` |
| `[[ ... ]]` | **Nested Sub-sequence** | Infinite nesting of subdivided time | `s("bd [[rim rim] hh] sd cp")` |
| `,` (comma) | **Parallel / Polyphony** | Plays streams concurrently within the same cycle | `s("bd*4, hh*8, [~ cp]*2")` |
| `< ... >` | **Alternation** | Plays one element per cycle in sequential order | `note("<c3 eb3 g3 bb3>")` |
| `*n` | **Multiplication** | Speeds up the event/subsequence by factor `n` | `s("hh*8")`, `s("[bd sd]*2")` |
| `/n` | **Division** | Slows down the event/subsequence across `n` cycles | `note("[c d e g]/2")` |
| `@n` | **Elongation / Weight** | Sets relative duration weight (default is `@1`) | `note("c@3 eb")` (3:1 ratio) |
| `!n` | **Replication** | Repeats an event `n` times without altering tempo | `note("c!3 e")` |
| `~` or `-` | **Rest / Silence** | Designates empty beats | `s("bd ~ sd -")` |
| `:n` | **Sample Index** | Selects sample index `n` from the audio bank | `s("jazz:0 jazz:2 jazz:4")` |
| `?` or `?p` | **Degrade (Chance)** | 50% chance of dropout (`?`), or specific probability `?0.2` | `s("hh*16?0.15")` |
| `\|` (pipe) | **Random Choice** | Randomly selects one of the delimited elements | `note("c3 \| eb3 \| g3")` |
| `(k, n, o)` | **Euclidean Rhythm** | Distributes `k` pulses over `n` subdivisions with offset `o` | `s("bd(3,8,0)")` |
| `{ ... }` | **Polymeter** | Steps through concurrent sequences at equal event duration | `s("{bd hh sd, cp rim}")` |

---

## 2. In-Depth Concepts

### Cycle-Based Subdivision
In traditional step sequencers, adding a step lengthens the measure. In Strudel:
* `s("bd sd")`: Each sound lasts 1/2 cycle (1 second at default 30 CPM).
* `s("bd hh sd hh")`: Each sound lasts 1/4 cycle (0.5 seconds).
* `s("bd [hh hh hh] sd hh")`:
  - `bd`: 1/4 cycle
  - `[hh hh hh]`: Three triplet hi-hats sharing 1/4 cycle total (each 1/12 cycle)
  - `sd`: 1/4 cycle
  - `hh`: 1/4 cycle

### Alternations (`< >`)
Angle brackets cycle through elements sequentially bar-by-bar:
```javascript
// Over 4 cycles, plays:
// Cycle 1: c2
// Cycle 2: eb2
// Cycle 3: f2
// Cycle 4: g2
note("<c2 eb2 f2 g2>").s("sawtooth")
```
Combined with multiplication:
```javascript
// Plays 8 notes per cycle, picking from the alternation sequence:
note("<c3 d3 eb3 g3 bb3>*8").s("piano")
```

### Euclidean Rhythms `(beats, segments, offset)`
Godfried Toussaint's Euclidean algorithm distributes `k` active pulses across `n` total subdivisions as evenly as possible:
* `bd(3,8)`: The classic Tresillo / Pop Clave: `[x . . x . . x .]`
* `bd(5,8)`: Cinquillo / Cuban Habanera: `[x . x x . x x .]`
* `bd(2,5)`: Khafif-e-ramal rhythm
* `bd(3,4)`: Samba rhythm fragment
* `bd(7,16)`: Bossa Nova variation
```javascript
// Poly-rhythmic Euclidean stack:
$: s("bd(3,8)").bank("RolandTR909")
$: s("hh(5,8)").bank("RolandTR909")
$: s("sd(2,8,2)").bank("RolandTR909")
```

### Polymeter vs Polyrhythm
* **Polyrhythm (with `,`)**: Both sequences fit within the exact same cycle duration:
  ```javascript
  // 3 against 4 polyrhythm:
  s("bd*3, hh*4")
  ```
* **Polymeter (with `{ }`)**: Both sequences step at the same speed, but have different lengths, causing phase shifting over time:
  ```javascript
  // Left takes 3 beats, right takes 4 beats:
  s("{bd sd cp, hh hh hh hh}")
  ```

### Randomness & Generative Music
* `?`: 50% probability of dropping the note.
* `?0.2`: 20% probability of dropping.
* `|`: Pick one at random per cycle slot:
  ```javascript
  // Generative hi-hat variations:
  s("hh*16?0.1").gain("[.3 | .6 | .9 | 1]*16")
  ```
