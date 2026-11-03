#!/usr/bin/env python3
# tools/shorts/master-short-audio.py
#
# Generalized version of what was first built one-off as master-shorts-audio.py (kept as-is, Gnosis-only).
# Masters a Short's narration-plus-music mix to -14 LUFS / -1.0 dBTP (YouTube Shorts' own target, distinct
# from the main pieces' -16 LUFS via tools/sounds/master.mjs) and writes both an .m4a archival copy and
# the .mp3 a HyperFrames composition actually plays.
#
# Usage:
#   python3 tools/shorts/master-short-audio.py <in.wav|in.m4a> <out.m4a> <out_mp3_for_hyperframes>
import subprocess
import json
import re
import sys

def master_audio(in_path, out_m4a, out_mp3):
    print(f"\n--- Mastering {in_path} to -14.0 LUFS, -1.0 dBTP ---")
    cmd_pass1 = [
        "ffmpeg", "-hide_banner", "-i", in_path,
        "-af", "loudnorm=I=-14.0:TP=-1.0:LRA=7.0:print_format=json",
        "-f", "null", "-"
    ]
    res1 = subprocess.run(cmd_pass1, capture_output=True, text=True)

    m = re.search(r"\{[\s\S]*?\}", res1.stderr)
    if not m:
        raise RuntimeError(f"Could not find loudnorm JSON in pass 1 for {in_path}")
    stats = json.loads(m.group(0))
    print("Pass 1 stats:", stats)

    filter_pass2 = (
        f"loudnorm=I=-14.0:TP=-1.0:LRA=7.0:"
        f"measured_I={stats['input_i']}:"
        f"measured_TP={stats['input_tp']}:"
        f"measured_LRA={stats['input_lra']}:"
        f"measured_thresh={stats['input_thresh']}:"
        f"offset={stats['target_offset']}:linear=true"
    )

    cmd_m4a = [
        "ffmpeg", "-y", "-hide_banner", "-i", in_path,
        "-af", filter_pass2,
        "-c:a", "aac", "-b:a", "320k", "-ar", "48000",
        out_m4a
    ]
    subprocess.run(cmd_m4a, check=True)

    cmd_mp3 = [
        "ffmpeg", "-y", "-hide_banner", "-i", out_m4a,
        "-c:a", "libmp3lame", "-b:a", "320k", "-ar", "48000",
        out_mp3
    ]
    subprocess.run(cmd_mp3, check=True)

    meas_cmd = [
        "ffmpeg", "-hide_banner", "-i", out_m4a,
        "-af", "ebur128=peak=true", "-f", "null", "-"
    ]
    meas_res = subprocess.run(meas_cmd, capture_output=True, text=True)
    tail = meas_res.stderr[meas_res.stderr.rfind("Summary:"):]
    print("Verification result:\n", tail.strip())

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python3 master-short-audio.py <in.wav|in.m4a> <out.m4a> <out_mp3_for_hyperframes>")
        sys.exit(1)
    master_audio(sys.argv[1], sys.argv[2], sys.argv[3])
    print("\n✓ Mastered and written to destination files!")
