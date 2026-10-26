#!/bin/bash
# Renders a long/4K composition in frame-range chunks, each well under available disk space (render.mjs
# buffers every frame as a temp JPEG before the final mux, so a single 12-minute 4K render can need 100GB+
# of scratch space — confirmed 2026-10-26 after gnosis crashed with ENOSPC at 56%, encodedFrames stuck at
# 0 the whole time). Chunks are concatenated losslessly at the end (same codec/pixel format/fps throughout,
# so ffmpeg's concat demuxer just stream-copies, no re-encode).
set -e
COMP="$1"
OUT="$2"
TOTAL_FRAMES="$3"
CHUNK_SIZE="${4:-7260}"
START_CHUNK="${5:-0}" # resume from this chunk index; earlier chunks must already be in concat.txt
cd "$(dirname "$0")"
OUTDIR=$(dirname "$OUT")
CHUNKDIR="$OUTDIR/.chunks"
mkdir -p "$CHUNKDIR"
LIST="$CHUNKDIR/concat.txt"
if [ "$START_CHUNK" -eq 0 ]; then > "$LIST"; fi
start=$((START_CHUNK * CHUNK_SIZE))
i=$START_CHUNK
while [ "$start" -lt "$TOTAL_FRAMES" ]; do
  end=$((start + CHUNK_SIZE - 1))
  if [ "$end" -ge "$TOTAL_FRAMES" ]; then end=$((TOTAL_FRAMES - 1)); fi
  chunkfile="$CHUNKDIR/chunk-$(printf '%03d' $i).mp4"
  echo "=== Chunk $i: frames $start-$end -> $chunkfile ==="
  node render.mjs "$COMP" "$chunkfile" "--frames=${start}-${end}" "--concurrency=${CONCURRENCY:-2}"
  echo "file '$chunkfile'" >> "$LIST"
  start=$((end + 1))
  i=$((i + 1))
done
echo "=== Concatenating $i chunks into $OUT ==="
ffmpeg -y -f concat -safe 0 -i "$LIST" -c copy "$OUT"
echo "=== Done: $OUT ==="
rm -rf "$CHUNKDIR"
