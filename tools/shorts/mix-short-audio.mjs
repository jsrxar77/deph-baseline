#!/usr/bin/env node
// tools/shorts/mix-short-audio.mjs
//
// Ducks a Short's own narration under a cropped window of the full piece's mastered music, so building a
// narrated Short's audio is one command, not hand-written ffmpeg per piece (first done by hand for Gnosis
// and again for Slow Drift before this existed). Uses ffmpeg's sidechaincompress: the music ducks under
// the voice and recovers in the gaps, driven by the voice's own level, not a hand-timed envelope.
//
// Usage:
//   node tools/shorts/mix-short-audio.mjs --name <piece> --lang <es|en> --start <sec> --duration <sec>
//   node tools/shorts/mix-short-audio.mjs --name slow-drift --lang es --start 71 --duration 46
//
// Reads:
//   media/<name>/sync/audio-master.wav                       the full piece's mastered music
//   media/<name>/shorts/<name>-short-narration-<lang>.mp3    narration (from elevenlabs.mjs)
// Writes:
//   media/<name>/shorts/<name>-short-music-window.wav        the cropped window (shared across languages)
//   media/<name>/shorts/<name>-short-audio-<lang>.wav         narration ducked into the music window
//
// Then feed the output into master-short-audio.py for the -14 LUFS HyperFrames master.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const k = argv[i].slice(2);
      flags[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    }
  }
  return flags;
}

const args = parseArgs(process.argv.slice(2));
for (const req of ["name", "lang", "start", "duration"]) {
  if (args[req] === undefined) {
    console.error(`Usage: node mix-short-audio.mjs --name <piece> --lang <es|en> --start <sec> --duration <sec> [--narration-delay <sec>] [--voice-boost <n>]`);
    process.exit(1);
  }
}

const root = path.resolve(import.meta.dirname, "../..");
const shortsDir = path.join(root, "media", args.name, "shorts");
const start = Number(args.start);
const duration = Number(args.duration);
const narrationDelayMs = Math.round(Number(args["narration-delay"] ?? 0.9) * 1000);
const voiceBoost = Number(args["voice-boost"] ?? 1.3);

const musicSource = path.join(root, "media", args.name, "sync", "audio-master.wav");
const narrationSource = path.join(shortsDir, `${args.name}-short-narration-${args.lang}.mp3`);
const musicWindowOut = path.join(shortsDir, `${args.name}-short-music-window.wav`);
const mixOut = path.join(shortsDir, `${args.name}-short-audio-${args.lang}.wav`);

for (const f of [musicSource, narrationSource]) {
  if (!fs.existsSync(f)) {
    console.error(`Missing ${path.relative(root, f)}`);
    process.exit(1);
  }
}

fs.mkdirSync(shortsDir, { recursive: true });

console.log(`Cropping ${start}s-${start + duration}s of the full piece's music...`);
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  "-i", musicSource,
  "-ss", String(start), "-t", String(duration),
  musicWindowOut,
]);

console.log(`Ducking ${args.lang} narration under the music window...`);
// Level-triggered sidechaincompress was tried first and tuned by ear-equivalent measurement, but a
// sidechain threshold/ratio is relative to the music's own loudness at each instant — correct on a
// quiet passage, wrong on a loud one (confirmed: the user reported the voice completely inaudible even
// after retuning it twice). Fixed by ducking to a FIXED, known-low gain over a FIXED, known time window
// instead: the narration's own real start/end from its Whisper transcript (not a guess), so the music
// is unambiguously near-silent for exactly as long as someone is actually speaking, full-level
// everywhere else. Real finding on Slow Drift's own narrated Short (2026-11-03).
const whisperPath = path.join(shortsDir, `${args.name}-whisper-words-${args.lang}.json`);
if (!fs.existsSync(whisperPath)) {
  console.error(`Missing ${path.relative(root, whisperPath)} — run transcribe.py first (deph-shorts skill, step 6) so the duck window comes from the narration's real timing, not a guess.`);
  process.exit(1);
}
const whisperWords = JSON.parse(fs.readFileSync(whisperPath, "utf8"));
const lead = Number(args["duck-lead"] ?? 0.3);
const trail = Number(args["duck-trail"] ?? 0.3);
const speechStart = Math.max(0, whisperWords[0].start + narrationDelayMs / 1000 - lead);
const speechEnd = Math.min(duration, whisperWords[whisperWords.length - 1].end + narrationDelayMs / 1000 + trail);
// The user corrected 0.07 (~-23dB): the music is not mere accompaniment but part of the piece itself,
// and ducking it that hard buried it. 0.35 (~-9dB) is a much lighter duck — the voice still has room to
// read clearly, but the music stays present as itself, not wallpaper. Not re-verified against the
// user's ear as "right" yet; only confirmed as a deliberate, much lighter number than before.
const duckGain = Number(args["duck-gain"] ?? 0.35);
console.log(`  Music ducked to gain ${duckGain} from ${speechStart.toFixed(2)}s to ${speechEnd.toFixed(2)}s`);

const filterComplex = [
  `[1:a]aresample=48000,adelay=${narrationDelayMs}|${narrationDelayMs},pan=stereo|c0=c0|c1=c0,apad,atrim=0:${duration}[voice]`,
  `[0:a]volume=${duckGain}:enable='between(t,${speechStart.toFixed(3)},${speechEnd.toFixed(3)})'[duckedmusic]`,
  `[duckedmusic][voice]amix=inputs=2:duration=first:weights='1 ${voiceBoost}'[mixed]`,
].join(";");

execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  "-i", musicWindowOut,
  "-i", narrationSource,
  "-filter_complex", filterComplex,
  "-map", "[mixed]",
  "-ac", "2", "-ar", "48000",
  mixOut,
]);

const dur = execFileSync("ffprobe", [
  "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", mixOut,
]).toString().trim();
console.log(`✓ ${path.relative(root, mixOut)} (${dur}s)`);
console.log(`Next: python3 tools/shorts/master-short-audio.py ${path.relative(root, mixOut)} <out.m4a> media/${args.name}/shorts/hyperframes-${args.lang}/audio.mp3`);
