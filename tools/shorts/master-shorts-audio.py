import subprocess
import json
import re

def master_audio(in_path, out_m4a, out_mp3):
    print(f"\n--- Mastering {in_path} to -14.0 LUFS, -1.0 dBTP ---")
    # Pass 1: Measure
    cmd_pass1 = [
        "ffmpeg", "-hide_banner", "-i", in_path,
        "-af", "loudnorm=I=-14.0:TP=-1.0:LRA=7.0:print_format=json",
        "-f", "null", "-"
    ]
    res1 = subprocess.run(cmd_pass1, capture_output=True, text=True)
    
    # Extract JSON from stderr
    m = re.search(r"\{[\s\S]*?\}", res1.stderr)
    if not m:
        raise RuntimeError(f"Could not find loudnorm JSON in pass 1 for {in_path}")
    stats = json.loads(m.group(0))
    print("Pass 1 stats:", stats)

    # Pass 2: Apply linear normalization
    filter_pass2 = (
        f"loudnorm=I=-14.0:TP=-1.0:LRA=7.0:"
        f"measured_I={stats['input_i']}:"
        f"measured_TP={stats['input_tp']}:"
        f"measured_LRA={stats['input_lra']}:"
        f"measured_thresh={stats['input_thresh']}:"
        f"offset={stats['target_offset']}:linear=true"
    )

    # Output M4A (AAC 320k 48kHz)
    cmd_m4a = [
        "ffmpeg", "-y", "-hide_banner", "-i", in_path,
        "-af", filter_pass2,
        "-c:a", "aac", "-b:a", "320k", "-ar", "48000",
        out_m4a
    ]
    subprocess.run(cmd_m4a, check=True)

    # Output MP3 (320k 48kHz for HyperFrames)
    cmd_mp3 = [
        "ffmpeg", "-y", "-hide_banner", "-i", out_m4a,
        "-c:a", "libmp3lame", "-b:a", "320k", "-ar", "48000",
        out_mp3
    ]
    subprocess.run(cmd_mp3, check=True)

    # Final verification
    meas_cmd = [
        "ffmpeg", "-hide_banner", "-i", out_m4a,
        "-af", "ebur128=peak=true", "-f", "null", "-"
    ]
    meas_res = subprocess.run(meas_cmd, capture_output=True, text=True)
    tail = meas_res.stderr[meas_res.stderr.rfind("Summary:"):]
    print("Verification result:\n", tail.strip())

if __name__ == "__main__":
    # ES
    master_audio(
        "media/gnosis/shorts/gnosis-short-audio-es.m4a",
        "media/gnosis/shorts/gnosis-short-audio-es-master.m4a",
        "media/gnosis/shorts/hyperframes-es/audio.mp3"
    )
    # EN
    master_audio(
        "media/gnosis/shorts/gnosis-short-audio-en.m4a",
        "media/gnosis/shorts/gnosis-short-audio-en-master.m4a",
        "media/gnosis/shorts/hyperframes-en/audio.mp3"
    )
    print("\n✓ Both audio tracks mastered to -14.0 LUFS and written to destination files!")
