---
name: strudel-yaml-composer
description: Skill for composing decoupled Strudel pieces, separating musical logic (.strudel) from sound design (.yaml) inside the media/ folder.
---

# Strudel YAML Composer

This skill defines the decoupled workflow for creating new Strudel compositions.

## Rules for Creating Compositions

1. **Folder Structure (`media/`)**:
   Every new piece MUST be placed inside a dedicated folder under the `media/` root directory (e.g., `media/techno/`).

2. **The `.strudel` File (Musical Logic Only)**:
   - Contains NO hardcoded instrument presets or sound design advice in the comments.
   - Must contain only pure musical logic (`kit`, `.midichan()`, `note()`, etc.).
   - Track layers should include a lightweight comment pointing to the YAML, for example: `// Ver YAML: Channel 1 - Drums`.
   - **MANDATORY DRUM MAPPINGS (`drums` & `kit`)**: Every `.strudel` file utilizing drums MUST explicitly define `drums` and `kit(p)` at the very top:
     ```javascript
     const drums = { kd: 35, bd: 36, kick: 36, rim: 37, rs: 37, sn: 38, sd: 38, cp: 39, clap: 39, sn2: 40, hh: 42, ch: 42, ph: 44, oh: 46, cr: 49, crash: 49, rd: 51, ride: 51, china: 52, rdbell: 53, splash: 55, lt2: 41, lt: 45, mt: 47, ht: 50, tamb: 54, cb: 56, cowbell: 56, sh: 58, shaker: 58, bongo: 60, conga: 63, timb: 65, agogo: 67, perc: 70, clave: 75 }
     const kit = (p) => s(p).fmap((v) => drums[v.s || v] ?? (Number(v.s || v) || 36)).note()
     ```
     **REGLA DE ORO**: NUNCA ELIMINAR, NUNCA BORRAR Y NUNCA QUITAR estas dos líneas. El archivo debe ser 100% autónomo y auto-contenido para que funcione de inmediato sin dependencias externas ni errores de `kit is not defined`.

3. **The `.yaml` Manifest (Sound Design & Routing)**:
   - Every composition MUST have a `.yaml` file sharing the exact same name as the `.strudel` file (e.g., `media/techno/techno.yaml`).
   - This file must document the exact Ableton/VST presets to be loaded, the MIDI channels they correspond to, and any other session metadata (e.g., BPM).
   - **CRITICAL & MANDATORY**: The YAML MUST include `vst_source`, `preset_uri` (e.g. `query:Plugins#VST3:Xfer%20Records:Serum%202` or `query:Drums#FileId_5447`), and `preset_name` in full so there is zero ambiguity. A YAML manifest without valid, loadable `preset_uri`s is considered invalid.
   - **STRICT GROUNDING & ZERO HALLUCINATIONS**: Agents must NEVER invent, approximate, or fabricate preset names (e.g. generic names like "Sub Bass" or "Rubber Bass"). You MUST inspect the plugin's real preset directory on disk (e.g. `/Library/Application Support/...` or `~/Library/Audio/Presets/...`) or query Ableton's database/MCP browser tree to write the EXACT, literal category and preset name that exists on the user's machine.

4. **Track Ordering & 8-Channel Standard**:
   - The project uses an 8-channel Ableton template standard (`Strudel Temaplte.als`). Channels are constrained to 1-8.
   - Cross-reference [.agents/catalogs/plugins.json](file:///.agents/catalogs/plugins.json) to pick verified, installed VSTs (e.g. *Serum 2*, *Vital*, *Analog Lab V*, *Massive X*, *Jura*, *OB-Xf*).
   - Tracks MUST be ordered logically: Rhythm first (Ch 1), Bass (Ch 2), melodic/harmonic elements (Ch 3-4), textures/secondary (Ch 5-8).
   - Standard roles:
     - Ch 1: Drums
     - Ch 2: Bass
     - Ch 3: Lead / Arp
     - Ch 4: Pad / Atmos
     - Ch 5-8: Secondary elements, chords, textures, FX

5. **Declarative Song Architecture Standard (`arrange` + `stack`)**:
   - Every complete song, piece, or automated arrangement MUST strictly adhere to the **3-Tier Modular Structure**:
     - **Tier 1: Modular Stems (Capas por Canal)**:
       Define individual rhythmic and melodic motifs as independent constants:
       ```javascript
       const kick_4x4       = kit("bd*4").midichan(1)
       const clap_backbeat  = kit("[~ cp]*2").midichan(1)
       const hats_offbeat   = kit("[~ hh]*4").gain(0.75).midichan(1)
       const bass_rolling   = n("<[~ 0 0 0] [~ 0 0 0]>").scale(bassScale).midichan(2)
       const arp_spiral     = n("<[0 2 4 7 4 2 0 4]>").scale(leadScale).midichan(3)
       const pad_ethereal   = n("<[0,2,4,7]>").scale(padScale).slow(2).midichan(4)
       ```
     - **Tier 2: Structural Scenes / Parts (`stack`)**:
       Assemble each formal section by stacking active layers. If an instrument enters or drops midway through a section, use nested `arrange`:
       ```javascript
       const part1_Intro = stack(
           pad_ethereal,
           drums_ambient,
           arrange([16, silence], [16, kick_4x4]) // kick entra en el compas 17
       )
       const part2_BuildUp   = stack(pad_ethereal, bass_rolling, drums_groove, arrange([16, silence], [16, arp_spiral]))
       const part3_Drop1     = stack(drums_full, bass_rolling, arp_spiral)
       const part4_Breakdown = stack(pad_ethereal, arp_spiral, ride_shimmer)
       const part5_Climax    = stack(drums_full, bass_rolling, arp_spiral, pad_ethereal)
       const part6_Outro     = stack(pad_ethereal, arrange([16, drums_groove], [16, silence]))
       ```
     - **Tier 3: Master Timeline (`arrange`)**:
       Sequence the entire piece chronologically in a single master stream with bar counts:
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
   - **Canonical 6-Part Structure (180-220 compases | ~5:30 - 7:00 min)**:
     1. **Intro (24-32 compases)**: Atmósfera flotante, textura ambiental, entrada suave de percusión.
     2. **Build-Up (24-32 compases)**: Entrada de la línea de bajo y groove rítmico, arpegio entrando a mitad de sección.
     3. **Drop 1 (32 compases)**: Máxima tracción de pista, interacción bajo + batería completa + melodía principal.
     4. **Breakdown (24-32 compases)**: Vaciado del bombo y bajo, desarrollo armónico suspended y espacio aéreo.
     5. **Climax / Main Drop (32-48 compases)**: Catarsis de energía con todas las capas sonando al unísono.
     6. **Outro (24-32 compases)**: Sustracción progresiva de capas para mezcla y transición de DJ.

### YAML Schema Example:
```yaml
composition: "techno"
bpm: 126
scale: "phrygian"
tracks:
  - channel: 1
    name: "Drums"
    vst_source: "Ableton Drum Rack"
    preset_uri: "query:Drums#FileId_5447" # Example URI
    preset_name: "909 Core Kit"
  - channel: 2
    name: "Lead"
    vst_source: "Ableton Analog"
    preset_uri: "query:Synths#Analog:Synth%20Lead:FileId_7272"
    preset_name: "Square Sync Lead"
```

## Agent Instructions:
When the user asks you to "create a new piece" or "compose a track":
1. Generate the `.yaml` first, choosing suitable factory presets.
2. Structure the `.strudel` composition according to the 3-Tier Declarative Standard (`arrange` + `stack`), avoiding flat monolithic loops.
3. Place both in the `media/<name>/` directory.
