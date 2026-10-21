---
name: vst-scanner
description: "Proper, scalable methods to discover installed VSTs, Audio Units, and DAW presets on macOS without using brute force filesystem scans."
---

# VST & Preset Discovery Skill

When you need to know exactly which VSTs, Audio Units (AU), or DAW Presets are installed on the user's system in order to provide accurate recommendations or code, **DO NOT use brute-force `find` or `ls` commands** across the entire filesystem. This is slow, fragile, and does not scale.

Instead, use the following robust, system-level approaches:

## 1. Automated Project Scanner (Recommended)
This workspace includes an automated scanner that queries Ableton's live plugin database directly without brute force:

```bash
npm run scan:plugins
# or
node scripts/scan_plugins.js
```

This generates an always-up-to-date catalog in:
- [plugins.json](file:///.agents/catalogs/plugins.json): Machine-readable catalog for agents to reference exact installed plugins and vendors.
- [plugins.md](file:///.agents/catalogs/plugins.md): Human-readable catalog table.

**Agent Rule**: Whenever composing YAML sound manifests or recommending instruments, check [.agents/catalogs/plugins.json](file:///.agents/catalogs/plugins.json). If you need an updated list after installing a new plugin, run `npm run scan:plugins`.

## 2. Querying Audio Units (macOS Native)
macOS maintains a centralized database of installed Audio Units (which DAWs like Ableton and Logic use natively).
You can query this database using the built-in Core Audio validation tool, `auval`.

- **To list all registered Audio Units:**
  ```bash
  auval -a
  ```

## 3. Querying Ableton Live's Database Directly
Ableton Live indexes plugins and presets into an SQLite database:
- Path: `~/Library/Application Support/Ableton/Live Database/Live-plugins-1.db`
- Query:
  ```bash
  sqlite3 "$HOME/Library/Application Support/Ableton/Live Database/Live-plugins-1.db" "SELECT DISTINCT vendor, name, subcategories FROM plugins WHERE enabled = 1 ORDER BY vendor, name;"
  ```

## 4. Dedicated MCP Servers (For Future Control)
If the user wants seamless AI control over their plugins, recommend they install:
- **SnappySnap**: An MCP-enabled VST3/AU plugin that acts as a server, connecting their DAW directly to AI models for parameter and preset control.
- **LobeHub VST MCP**: A framework for exposing plugin states and databases to LLMs.

## 5. Strict Professional Standard: ZERO Hallucinations & Mandatory Verification
**REGULATION**: Agents must NEVER invent, assume, or hallucinate preset names, categories, or sound descriptions (e.g., generic placeholders like "Sub Bass", "Rubber Bass", or "Warm Pluck").
- You have terminal access, Ableton MCP tools (`get_browser_items_at_path`), SQLite databases, and standard plugin preset locations:
  - macOS Application Support: `/Library/Application Support/<Vendor>/.../Presets/` and `~/Library/Application Support/<Vendor>/.../Presets/`.
  - Audio Presets: `/Library/Audio/Presets/<Vendor>/...` and `~/Library/Audio/Presets/<Vendor>/...`.
- **MANDATORY PROCEDURE BEFORE WRITING OR SPEAKING**:
  Before recommending a preset to the user or writing it in a `.yaml` manifest, the agent **MUST** inspect the actual preset folder or database to extract the literal category and literal preset name that actually exists on the user's computer.
  Inventing or guessing names without checking is strictly considered an engineering failure.
