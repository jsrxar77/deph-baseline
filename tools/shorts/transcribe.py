#!/usr/bin/env python3
# tools/shorts/transcribe.py
#
# Generalized version of what was first built one-off as transcribe-es.py (kept as-is, Gnosis-only).
# Word-level transcription (faster-whisper) for a narrated Short's voice track, used to time karaoke
# captions in build-short-hyperframes.mjs. Needs the SPOKEN language, not assumed from a filename suffix,
# since a Short's narration audio file may not be named after its language.
#
# Usage:
#   python3 tools/shorts/transcribe.py <audio.mp3> <out.json> --lang es
#   python3 tools/shorts/transcribe.py media/slow-drift/shorts/slow-drift-short-narration-en.mp3 \
#       media/slow-drift/shorts/slow-drift-whisper-words-en.json --lang en
import sys
import json
import argparse
from faster_whisper import WhisperModel

parser = argparse.ArgumentParser()
parser.add_argument("audio_path")
parser.add_argument("out_path")
parser.add_argument("--lang", required=True, choices=["es", "en"])
parser.add_argument("--model", default="base")
args = parser.parse_args()

print(f"Transcribing {args.audio_path} (lang={args.lang})...")
model = WhisperModel(args.model, device="cpu", compute_type="int8")
segments, info = model.transcribe(args.audio_path, language=args.lang, word_timestamps=True)

words_list = []
for segment in segments:
    print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")
    for word in segment.words:
        w_text = word.word.strip()
        if w_text:
            words_list.append({
                "word": w_text,
                "start": round(word.start, 3),
                "end": round(word.end, 3),
                "probability": round(word.probability, 3),
            })

print(f"\nTotal words extracted: {len(words_list)}")
with open(args.out_path, "w", encoding="utf-8") as f:
    json.dump(words_list, f, ensure_ascii=False, indent=2)
print(f"Saved to {args.out_path}")
