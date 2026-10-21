# Strudel Model Context Protocol (MCP) Integration 🔌🤖

## 1. Overview of Strudel MCP Servers

To enable AI assistants (Gemini, Antigravity IDE, Claude, Claude Code) to interact with **Strudel.cc** in real time, the developer community created dedicated Model Context Protocol (MCP) servers.

The primary, production-ready server is:
* **Package**: `@williamzujkowski/live-coding-music-mcp`
* **Author**: William Zujkowski
* **Repository**: [https://github.com/williamzujkowski/live-coding-music-mcp](https://github.com/williamzujkowski/live-coding-music-mcp)
* **Status**: Version 4.0.0 (active, npm published, production-grade test coverage).
* **Historical note**: Originally published under `@williamzujkowski/strudel-mcp-server`, it was renamed to `live-coding-music-mcp` to maintain trademark distinction while retaining schema compatibility.

---

## 2. Server Architecture & REPL Bridge

The MCP server acts as an intelligent intermediary between the AI model and the Strudel runtime:
1. **AI Client (Antigravity / Gemini)**: Sends structured tool calls over Stdio or SSE.
2. **MCP Server**: Validates pattern syntax, parses mini-notation, performs algorithmic transformations, and manages session history.
3. **Browser Bridge**: Communicates directly with the active Strudel web instance ([https://strudel.cc](https://strudel.cc)), allowing the AI to:
   * Evaluate code in real time into the live audio engine.
   * Read back audio state, tempo, and playing patterns.
   * Insert dynamic visual sliders to let the human adjust parameters while playing.

---

## 3. Tool Capabilities (40+ Tools)

The MCP server exposes rich musical manipulation tools categorized into:

### Pattern Transformations (`transform`)
* **Transpose**: Shift patterns up/down musically by semitones or scale intervals.
* **Invert / Reverse**: Retrograde, invert pitch contours.
* **Time Stretch**: Double-time, half-time, polymetric redistribution.
* **Humanize & Swing**: Inject microtiming variations and velocity curves.
* **Quantize**: Align loose timings to strict metric grids.

### Pattern Persistence (`pattern_store`)
* `save_pattern`: Save reusable motifs, drum kits, or tracks to disk.
* `load_pattern`: Retrieve saved patterns by name or tag.
* `list_patterns`: Browse pattern catalog.

### History & Version Control (`history`)
* `undo` / `redo`: Walk through algorithmic mutations during live performance.
* `diff_patterns`: Compare musical changes across iterations.
* `snapshot`: Save checkpoint before drastic musical departures.

### MIDI & External Formats (`import_midi`)
* `import_midi`: Convert Standard MIDI Files (.mid) into native Strudel mini-notation patterns (handles separate pitched and drum tracks).
* `export_midi`: Export algorithmic patterns to MIDI for use in DAWs (Ableton, Logic, Reaper).

### Interactive Sliders
* Insert interactive numeric ranges directly into the editor code so the user can tweak filter cutoff, tempo, or gain via GUI sliders without typing.

---

## 4. Configuring in Antigravity IDE / Gemini

### Option A: Local Workspace Configuration (`.agents/mcp_config.json`)
Placed inside your project root at `.agents/mcp_config.json`:

```json
{
  "mcpServers": {
    "strudel-live-coding": {
      "command": "npx",
      "args": ["-y", "@williamzujkowski/live-coding-music-mcp"],
      "env": {}
    }
  }
}
```

### Option B: Global Configuration (`~/.gemini/config/mcp_config.json`)
To enable Strudel MCP across all workspaces on your computer, add it to `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "live-coding-music-mcp": {
      "command": "npx",
      "args": ["-y", "@williamzujkowski/live-coding-music-mcp"]
    }
  }
}
```

---

## 5. Alternative Community Implementations
* **`phildougherty/strudel-mcp`**: A minimalist bridge connecting local CLI agents to Strudel browser sessions.
* **`mcp-music-studio`**: A broader MCP suite covering ABC notation, LilyPond, and MIDI orchestration alongside live-coding bridges.
