#!/usr/bin/env node
// Voiceover generator using ElevenLabs with exact character-level and word-level timestamps.
// Automatically loads ELEVENLABS_API_KEY from process.env, ./.env, or ~/.env.
// Outputs audio file (.mp3) and synchronized captions (.captions.json).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

// Default voice: Adam (deep, calm, articulate documentary narrator voice)
export const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB";
export const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

export function getElevenLabsApiKey() {
  if (process.env.ELEVENLABS_API_KEY) {
    return process.env.ELEVENLABS_API_KEY.trim();
  }
  const candidatePaths = [
    path.join(REPO_ROOT, ".env"),
    "/Users/javier/Projects/brandforge-os/.env",
    "/Users/javier/.env",
  ];
  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/ELEVENLABS_API_KEY\s*=\s*([^\r\n]+)/);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
  }
  return null;
}

/**
 * Group character-level alignment from ElevenLabs into clean word tokens with timestamps and frame numbers.
 */
export function groupCharactersIntoWords(alignment, fps = 60, offsetSeconds = 0) {
  const { characters = [], character_start_times_seconds = [], character_end_times_seconds = [] } = alignment;
  const words = [];
  let currentWord = "";
  let wordStart = null;
  let wordEnd = null;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const start = character_start_times_seconds[i];
    const end = character_end_times_seconds[i];

    if (/\s/.test(char)) {
      if (currentWord.length > 0) {
        words.push(createWordObj(currentWord, wordStart, wordEnd, fps, offsetSeconds));
        currentWord = "";
        wordStart = null;
        wordEnd = null;
      }
    } else {
      if (currentWord.length === 0) {
        wordStart = start;
      }
      wordEnd = end;
      currentWord += char;
    }
  }

  if (currentWord.length > 0) {
    words.push(createWordObj(currentWord, wordStart, wordEnd, fps, offsetSeconds));
  }

  return words;
}

function createWordObj(text, startSec, endSec, fps, offsetSeconds) {
  const adjustedStart = (startSec ?? 0) + offsetSeconds;
  const adjustedEnd = (endSec ?? adjustedStart + 0.2) + offsetSeconds;
  return {
    word: text,
    cleanWord: text.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "").toUpperCase(),
    startSec: Math.round(adjustedStart * 1000) / 1000,
    endSec: Math.round(adjustedEnd * 1000) / 1000,
    startFrame: Math.round(adjustedStart * fps),
    endFrame: Math.round(adjustedEnd * fps),
  };
}

/**
 * Generate voiceover audio and word-level alignment captions from text.
 */
export async function generateVoiceover({
  text,
  voiceId = DEFAULT_VOICE_ID,
  modelId = DEFAULT_MODEL_ID,
  outAudioPath,
  outCaptionsPath,
  fps = 60,
  offsetSeconds = 0.5, // subtle lead-in before voice starts
  stability = 0.55,
  similarityBoost = 0.8,
}) {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error(
      "Missing ELEVENLABS_API_KEY. Add it to .env or ~/.env to enable automated AI voiceovers."
    );
  }

  if (!text || !text.trim()) {
    throw new Error("Cannot generate voiceover for empty text.");
  }

  console.log(`\nSynthesizing voiceover with ElevenLabs (voice: ${voiceId})...`);
  console.log(`Script: "${text.slice(0, 80)}${text.length > 80 ? "..." : ""}" (${text.length} chars)`);

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text.trim(),
      model_id: modelId,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const audioBuffer = Buffer.from(result.audio_base64, "base64");

  if (outAudioPath) {
    fs.mkdirSync(path.dirname(outAudioPath), { recursive: true });
    fs.writeFileSync(outAudioPath, audioBuffer);
    console.log(`✓ Voice audio written to: ${outAudioPath} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);
  }

  const words = groupCharactersIntoWords(result.alignment || {}, fps, offsetSeconds);

  const captionsData = {
    script: text,
    voiceId,
    modelId,
    offsetSeconds,
    totalDurationSeconds: words.length > 0 ? words[words.length - 1].endSec : 0,
    words,
  };

  if (outCaptionsPath) {
    fs.mkdirSync(path.dirname(outCaptionsPath), { recursive: true });
    fs.writeFileSync(outCaptionsPath, JSON.stringify(captionsData, null, 2), "utf8");
    console.log(`✓ Synchronized captions written to: ${outCaptionsPath} (${words.length} words)`);
  }

  return {
    audioBuffer,
    captionsData,
  };
}

// CLI usage
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const textArg = args.find((a) => a.startsWith("--text="))?.split("=").slice(1).join("=");
  const outAudio = args.find((a) => a.startsWith("--out-audio="))?.split("=").slice(1).join("=");
  const outCaptions = args.find((a) => a.startsWith("--out-captions="))?.split("=").slice(1).join("=");

  if (!textArg) {
    console.log("Usage: node tools/voice/tts.mjs --text=\"Script...\" [--out-audio=voice.mp3] [--out-captions=captions.json]");
    process.exit(1);
  }

  generateVoiceover({
    text: textArg,
    outAudioPath: outAudio,
    outCaptionsPath: outCaptions,
  }).catch((err) => {
    console.error("✗ Voiceover generation failed:", err.message);
    process.exit(1);
  });
}
