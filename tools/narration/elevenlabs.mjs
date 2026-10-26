#!/usr/bin/env node
// ElevenLabs text-to-speech, for narrated Shorts (deph-shorts). Adapted 2026-10-26 from brandforge-os's
// tools/elevenlabs.mjs — the API calls are the same, but that version's helpers (parseArgs, die, API key
// lookup) were split off from a client/asset-folder system this project doesn't have; this is the
// standalone equivalent, no unrelated dependency.
//
// Usage:
//   node tools/narration/elevenlabs.mjs list [--query "<name>"]
//   node tools/narration/elevenlabs.mjs tts --text "..." --voice "<name or id>" --out <path.mp3> [--model eleven_multilingual_v2]
//
// Needs ELEVENLABS_API_KEY (or XI_API_KEY) — checked in process.env, then ~/.env, then a project-root
// .env. Shared with brandforge-os's own tool since both read the same ~/.env.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      if (v !== undefined) flags[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith("--")) flags[k] = argv[++i];
      else flags[k] = true;
    } else pos.push(a);
  }
  return { pos, flags };
}

function readKeyFromEnvFile(file) {
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, "utf8");
  const m = text.match(/^(?:ELEVENLABS_API_KEY|XI_API_KEY)=["']?([^"'\r\n]+)["']?/m);
  return m ? m[1].trim() : null;
}

function getApiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  if (process.env.XI_API_KEY) return process.env.XI_API_KEY.trim();
  return readKeyFromEnvFile(path.join(os.homedir(), ".env")) || readKeyFromEnvFile(path.join(ROOT, ".env"));
}

const { pos, flags } = parseArgs(process.argv.slice(2));
const cmd = pos[0];

const apiKey = getApiKey();
if (!apiKey) {
  die('No ELEVENLABS_API_KEY found. Add it with:\n  echo "ELEVENLABS_API_KEY=your_key_here" >> ~/.env');
}

const BASE_URL = "https://api.elevenlabs.io/v1";

async function fetchVoices() {
  const res = await fetch(`${BASE_URL}/voices`, { headers: { "xi-api-key": apiKey } });
  if (!res.ok) die(`Error listing voices (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.voices || [];
}

async function listVoices(query) {
  console.log("Fetching your ElevenLabs voices...");
  const voices = await fetchVoices();
  const filtered = query
    ? voices.filter(
        (v) => v.name.toLowerCase().includes(query.toLowerCase()) ||
          (v.category && v.category.toLowerCase().includes(query.toLowerCase())),
      )
    : voices;
  if (filtered.length === 0) {
    console.log(`No voices matched "${query}". Total available: ${voices.length}`);
    return;
  }
  console.log(`\nFound ${filtered.length} voice(s):`);
  for (const v of filtered) {
    const labels = v.labels ? Object.entries(v.labels).map(([k, val]) => `${k}:${val}`).join(", ") : "";
    console.log(`- ${v.name.padEnd(30)} | ID: ${v.voice_id} | ${v.category || "custom"} | ${labels}`);
  }
}

async function synthesize({ text, voiceNameOrId, outPath, modelId, stability, similarityBoost }) {
  if (!text) die("Missing --text.");
  if (!outPath) die("Missing --out.");

  let voiceId = voiceNameOrId;
  if (!voiceId || !/^[A-Za-z0-9]{20,24}$/.test(voiceId)) {
    const searchName = voiceId;
    if (!searchName) die("Missing --voice (name or id). Run `list` to see what's available.");
    console.log(`Looking up voice ID for "${searchName}"...`);
    const voices = await fetchVoices();
    const found = voices.find((v) => v.name.toLowerCase().includes(searchName.toLowerCase()));
    if (!found) die(`No voice matching "${searchName}". Run \`node tools/narration/elevenlabs.mjs list\`.`);
    voiceId = found.voice_id;
    console.log(`Found: "${found.name}" (${voiceId})`);
  }

  const model = modelId || "eleven_multilingual_v2";
  console.log(`Synthesizing with model ${model}...\n  Text: "${text}"`);
  const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: { stability: Number(stability ?? 0.5), similarity_boost: Number(similarityBoost ?? 0.75) },
    }),
  });
  if (!res.ok) die(`Error synthesizing (${res.status}): ${await res.text()}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const absOut = path.resolve(outPath);
  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  fs.writeFileSync(absOut, buffer);
  console.log(`Wrote ${path.relative(ROOT, absOut)} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

if (cmd === "list") {
  await listVoices(flags.query || pos[1] || "");
} else if (cmd === "tts") {
  await synthesize({
    text: flags.text,
    voiceNameOrId: flags.voice,
    outPath: flags.out,
    modelId: flags.model,
    stability: flags.stability,
    similarityBoost: flags["similarity-boost"],
  });
} else {
  console.log(
    "Usage:\n  node tools/narration/elevenlabs.mjs list [--query <name>]\n" +
      "  node tools/narration/elevenlabs.mjs tts --text \"...\" --voice \"<name or id>\" --out <path.mp3>",
  );
}
