---
name: strudel-live-coding
description: >-
  Create, manipulate, debug, and perform algorithmic live-coding music using Strudel (https://strudel.cc).
  Use when the user wants to compose music, create drum patterns, synthesize sounds, design melodies or chords,
  apply TidalCycles mini-notation, configure or control the Strudel MCP server, or integrate Strudel into web projects.
---

# Strudel Live Coding Skill 🌀🎹

[Strudel](https://strudel.cc) is an official port of the [TidalCycles](https://tidalcycles.org) pattern engine to JavaScript and the Web Audio API. It enables real-time algorithmic music composition, sequencing, audio synthesis, and interactive live coding in the browser and headless environments.

## Quick Reference & Core Workflow

### 1. Fundamental Rules of Strudel
* **Cycles & Time**: Time is measured in *cycles* (default: 2 seconds per cycle = 30 CPM = 120 BPM in 4/4). Use `setcpm(cyclesPerMinute)` (e.g. `setcpm(120/4)`) or `setcps(cyclesPerSecond)` to adjust global tempo.
* **Events & Squishing**: A sequence `s("bd hh sd hh")` fits all 4 events evenly into 1 cycle. The more events you add without brackets, the faster they play.
* **Mini-Notation**: Rhythmic syntax enclosed in double quotes `""` or backticks ` `` `.
* **Layering & Parallel Tracks**:
  * Use `$: <pattern>` prefix on separate lines to play multiple independent tracks in parallel.
  * Use `_$: <pattern>` to mute a track temporarily during live performances.
  * Or use `stack(...)` function to combine multiple patterns into a composite object.
* **Mandatory Drum Helpers (`drums` & `kit`)**: When triggering drum pads via MIDI (Ableton Drum Rack, C1 = 36), ALWAYS include `const drums = { kd: 35, bd: 36, ... }` and `const kit = (p) => s(p).fmap(...)` at the top of the file. NEVER omit or remove these helpers.

### 2. Basic Composition Anatomy
```javascript
// Global Tempo (e.g. 120 BPM in 4/4)
setcpm(120/4)

// Drum Track
$: s("bd*4, [~ <sd cp>]*2, [~ hh]*4")
  .bank("RolandTR909")
  .gain(".85")

// Bassline
$: note("<[c2 c3]*4 [bb1 bb2]*4 [f2 f3]*4 [eb2 eb3]*4>")
  .s("sawtooth")
  .lpf(sine.range(300, 1200).slow(4))
  .gain(".7")

// Melodic Arpeggio / Chords
$: n("<0 2 4 <[6,8] [7,9]>>*2")
  .scale("C4:minor")
  .s("gm_electric_guitar_muted")
  .delay(".5:.125:.6")
  .room(.6)

// MIDI Output (DAWs / Hardware Synths / Ableton)
$: note("c2 [~ c3]").midichan(1).midi()
```

### 3. Automated Song Arrangement Pattern (`arrange` + `stack`)
For complete, automated musical pieces and structured compositions (as opposed to looping live jams), always use the **3-Tier Declarative Architecture**:
1. **Modular Stems**: Declare individual rhythmic and melodic layers as constants (`const kick_4x4 = ...`, `const bass_line = ...`).
2. **Structural Scenes (`stack`)**: Group stems into formal parts (`part1_Intro`, `part2_BuildUp`, `part3_Drop1`, etc.). Use nested `arrange([bars_silence, silence], [bars_active, stem])` for delayed entrances.
3. **Master Timeline (`arrange`)**: Sequence the entire piece in a single master evaluation stream with bar counts:
```javascript
$: arrange(
  [32, part1_Intro],
  [32, part2_BuildUp],
  [32, part3_Drop1],
  [32, part4_Breakdown],
  [40, part5_Climax],
  [32, part6_Outro]
)
```

---

## Detailed Topic Guides & References

The knowledge base for Strudel is modularized into dedicated reference documents:

1. **[Workshop Guide](./references/workshop_getting_started.md)**:
   Step-by-step concepts from the official workshop (`getting-started`, `first-sounds`, `first-notes`, `first-effects`, `pattern-effects`, and `recap`).
2. **[Mini-Notation Specification](./references/mini_notation_guide.md)**:
   Exhaustive reference for subdivisions `[]`, alternations `<>`, Euclidean rhythms `(k,n,o)`, replication `!`, elongation `@`, degradation `?`, random choices `|`, and speed multipliers `*` and `/`.
3. **[Soundbanks & Synthesizers](./references/soundbanks_and_synths.md)**:
   Listing of built-in drum machine banks (`RolandTR909`, `RolandTR808`, `AkaiLinn`, `CasioRZ1`, etc.), General MIDI soundbanks (`gm_acoustic_bass`, `piano`, `gm_epiano1`), and oscillators (`sawtooth`, `square`, `triangle`, `sine`).
4. **[Audio Effects & Modulation](./references/effects_and_modulation.md)**:
   Filters (`lpf`, `hpf`, `bpf`), ADSR envelopes (`attack`, `decay`, `sustain`, `release`, `adsr`), delay & reverb (`delay`, `room`), dynamic signals (`sine`, `saw`, `rand`, `perlin`), and transformations (`ply`, `off`, `jux`, `rev`).
5. **[Model Context Protocol (MCP) Integration](./references/mcp_servers.md)**:
   Details on connecting AI agents with Strudel via the `@williamzujkowski/live-coding-music-mcp` server, its 40+ musical tools, and browser REPL synchronisation.

---

## Practical Examples & Templates

Ready-to-use compositions and rhythmic patterns are available in the examples folder:
- **[Drum Beats & Grooves](./examples/drum_beats.js)**: House, Techno, Boom-Bap, Funk Breakbeats, Pop Clave Euclidean rhythms.
- **[Melodies & Harmonies](./examples/melodies_and_chords.js)**: Modal jazz progressions, acid 303 lines, arpeggiated synth leads, shuffle basslines.
- **[Full Tracks & Live Stacks](./examples/full_tracks.js)**: Multi-part arrangements demonstrating progressive layering and drops.

---

## Workflow for AI Pair-Programming with Strudel

When assisting a user with Strudel:
1. **Understand Musical Intent**: Identify genre, tempo (BPM/CPM), harmonic key/scale, and mood (e.g. ambient, driving dance, lo-fi).
2. **Structure Clean Layers**: Separate Drums, Bass, Chords/Pads, and Lead melodies using `$:` or `stack()`.
3. **Apply Dynamic Variety**: Avoid flat loops by introducing:
   - Alternations `<a b c>` for bar-to-bar progression.
   - Euclidean accents like `bd(3,8)`.
   - Velocity/gain variations, e.g., `.gain("[.3 1]*4")`.
   - Continuous filter or effect modulation using `sine.range(min, max).slow(cycles)`.
4. **Verify Syntax**: Ensure proper method chaining, correct quotes, valid scale names, and parentheses balance.
