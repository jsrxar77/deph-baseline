---
name: strudel-ableton-deployer
description: Skill for automatically provisioning and deploying a decoupled YAML composition into Ableton Live using the ableton-mcp server.
---

# Strudel Ableton Deployer

This skill automates the process of setting up and synchronizing an Ableton Live session based on a composition's `.yaml` manifest using the **8-Channel Strudel Template standard**.

## 1. The Standard 8-Channel Template
- **Repository Location:** [Strudel Temaplte.als](file:///media/template/Strudel%20Temaplte.als) (`media/template/Strudel Temaplte.als`)
- **Ableton Library Location:** `~/Music/Ableton/User Library/Templates/Strudel Temaplte.als`
- **Track Layout:** 8 MIDI tracks mapped 1:1 to MIDI channels 1 through 8.
- **Routing & Monitoring:** All tracks have `UpperDisplayString: All Ins`, `LowerDisplayString: Ch. 1 - 8`, and `Monitoring: In` enabled by default. No manual MIDI routing or arming is required!

| Track Index | Default Name | Input Routing | Strudel Target | Standard Role |
| :--- | :--- | :--- | :--- | :--- |
| 0 | `1 MIDI 1` | All Ins / Ch. 1 | `.midichan(1)` | Drums / Rhythm |
| 1 | `2 MIDI 2` | All Ins / Ch. 2 | `.midichan(2)` | Bass / Sub |
| 2 | `3 MIDI 3` | All Ins / Ch. 3 | `.midichan(3)` | Lead / Main Arp |
| 3 | `4 MIDI 4` | All Ins / Ch. 4 | `.midichan(4)` | Pad / Atmosphere |
| 4 | `5 MIDI 5` | All Ins / Ch. 5 | `.midichan(5)` | Harmony / Chords / Secondary |
| 5 | `6 MIDI 6` | All Ins / Ch. 6 | `.midichan(6)` | Textures / FX |
| 6 | `7 MIDI 7` | All Ins / Ch. 7 | `.midichan(7)` | Percussion 2 |
| 7 | `8 MIDI 8` | All Ins / Ch. 8 | `.midichan(8)` | Secondary Lead / Solo |

## 2. Phase 1: Instrument & Session Provisioning
When the user asks to "pasar a Ableton" ("pass it to Ableton" or "cargar los instrumentos"):

1. **Verify Session & Template**:
   - Call `get_session_info` from `ableton-mcp` to ensure Live is connected.
   - If track count is 8, the template is active and ready. If track count is different or 0, gently suggest the user open `Strudel Temaplte.als` from their Ableton Templates.
   - **DO NOT** delete tracks or modify input routing. The routing is already wired in the template.

2. **Read Manifest & Catalog**:
   - Read the composition's `<name>.yaml` file.
   - Cross-reference instruments with [.agents/catalogs/plugins.json](file:///.agents/catalogs/plugins.json) to ensure plugin names and vendors match what is installed on the user's system.

3. **Provision & Load Instruments (MANDATORY)**:
   - For each track defined in the YAML (channels 1 through 8):
     - Calculate track index: `index = channel - 1`.
     - Call `set_track_name` with `track_index: index` and format: `Ch {channel} - {name} ({vst_source})` (e.g., `Ch 2 - Bass (Serum 2)`).
     - **CALL `load_instrument_or_effect` IMMEDIATELY**: Both native presets (`query:Drums#...`, `query:Synths#...`) and 3rd-party VST3 plugins (`query:Plugins#VST3:Vendor:PluginName`) CAN and MUST be loaded directly via `load_instrument_or_effect`.
     - **NEVER delegate loading to the user** if a URI is known or discoverable in Ableton's browser (`Plugins/VST3/` or `Instruments/`).

4. **Tempo Synchronization**:
   - Call `set_tempo` using the `bpm` defined in the YAML manifest.

5. **Hard Verification Gate (CRITICAL & NON-NEGOTIABLE)**:
   - Call `get_session_snapshot`.
   - Inspect the returned `tracks` array.
   - For every track defined in the YAML, assert that `track.devices` is NOT empty.
   - **PROHIBITED:** It is strictly prohibited to declare the deployment complete or tell the user it is ready if any target track has `devices: []`. If a device failed to load, diagnose the URI with `get_browser_items_at_path` and retry immediately.

## 3. Phase 2: Full Arrangement MIDI Deployment (MANDATORY STANDARD)
When the user asks to "pasar toda la pieza a midi en ableton", "desplegar en arrangement" o "pasar todo a ableton":

### Automated Deployment Tool:
Run the unified, zero-dependency deployment script:
```bash
npm run deploy:arrangement [ruta/al/archivo.strudel]
# o directamente:
node scripts/deploy_arrangement.js media/<tema>/<tema>.strudel
```

### Step-by-Step Arrangement Pipeline:
1. **Parse & Transpile Strudel**:
   - Parse the `.strudel` composition using `@strudel/core`, `@strudel/transpiler`, `@strudel/tonal`, and `@strudel/mini`.
   - Extract project BPM (`setcpm` or `setcps`).
   - Automatically parse structure, total duration (bars/beats), and section locators from the `arrange([bars, part], ...)` timeline.

2. **Extract Note Events**:
   - Query the pattern arc from beat `0` to `totalBars * 4`.
   - Convert notes for each channel (1 to 8):
     - Pitch: General MIDI drum map (e.g. Kick=36, Snare=38, Hats=42) or scale/note conversion.
     - Start time: `hap.whole.begin * 4` (beats).
     - Duration: `(hap.whole.end - hap.whole.begin) * 4` (beats).
     - Velocity: `Math.round((hap.value.velocity || hap.value.gain || 0.8) * 127)`.

3. **Socket Timeline Injection (TCP 9877)**:
   - For each active track:
     - `create_clip(track_index, clip_index: 0, length: totalBeats)` in Session view.
     - `clear_notes_from_clip(track_index, clip_index: 0)`.
     - `add_notes_to_clip(track_index, clip_index: 0, notes)` in batches of 400 notes.
     - `duplicate_session_clip_to_arrangement(track_index, clip_index: 0, destination_time: 0.0)`.
     - `set_arrangement_clip_name(track_index, clip_index: 0, name)`.

4. **Arrangement Section Locators**:
   - Call `create_locator` for each section defined in the arrangement (e.g. `1. Intro` at 0.0, `2. Build-Up` at 128.0, `3. Drop` at 256.0, `4. Breakdown` at 384.0, `5. Climax` at 512.0, `6. Outro` at 672.0, `End` at 800.0).

5. **View & Transport Reset**:
   - Call `switch_to_arrangement_view()` and `set_current_song_time(time: 0.0)`.

6. **Offline MIDI Backup**:
   - The script also writes standard `.mid` files (`01_ch1_drums.mid`, ..., `full_arrangement.mid`) into `media/<tema>/midi_exports/` via [scripts/export_midi.js](file:///scripts/export_midi.js).

## 4. Phase 3: Mastering, Gain Staging & Volume Control
When the user asks to master the project or balance track volumes:

1. **Track Volume & Gain Staging**:
   - To control volume on individual tracks with decibel precision, load the native Ableton **Utility** audio effect:
     - URI: `query:AudioFx#Utility` via `load_instrument_or_effect`.
     - Read parameters via `get_device_parameters(track_index, device_index)`.
     - Set `Gain` parameter in dB via `set_device_parameter`.

2. **Master Bus Processing Chain**:
   - Load standard mastering devices onto the Master track (or master bus) using `load_instrument_or_effect`:
     - **EQ Eight** (`query:AudioFx#EQ%20Eight`): High-pass filter at 25-30 Hz (removes inaudible sub-mud), slight dip at 250-350 Hz (clarity), gentle high-shelf at 10-12 kHz (air).
     - **Glue Compressor** (`query:AudioFx#Glue%20Compressor`): SSL Bus compressor behavior (Attack 30ms, Release Auto, Ratio 2:1, 1-2 dB gentle gain reduction).
     - **Saturator** (`query:AudioFx#Saturator`): Subtle analog warmth and harmonic peak rounding.
     - **Limiter** (`query:AudioFx#Limiter`): True peak ceiling at -0.3 dB to -1.0 dB (streaming standard) and transparent gain drive.

3. **Fine-Tuning Parameters**:
   - Use `get_device_parameters` to discover parameter indices, minimums, and maximums.
   - Use `set_device_parameter` to adjust thresholds, gains, frequencies, and releases.
   - Verify final balance with `get_session_snapshot`.
