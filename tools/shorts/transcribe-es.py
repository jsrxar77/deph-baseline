import sys
import json
from faster_whisper import WhisperModel

audio_path = "media/gnosis/shorts/gnosis-short-narration-es.mp3"
print(f"Transcribing {audio_path}...")
model = WhisperModel("base", device="cpu", compute_type="int8")

segments, info = model.transcribe(audio_path, language="es", word_timestamps=True)

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
                "probability": round(word.probability, 3)
            })

print(f"\nTotal words extracted: {len(words_list)}")
with open("media/gnosis/shorts/gnosis-whisper-words-es.json", "w", encoding="utf-8") as f:
    json.dump(words_list, f, ensure_ascii=False, indent=2)
print("Saved to media/gnosis/shorts/gnosis-whisper-words-es.json")
