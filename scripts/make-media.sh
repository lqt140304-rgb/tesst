#!/usr/bin/env bash
# Demo inpatient clips (proposal-tech.md §11): Ken Burns over graded photos, H.264, NO audio track (-an).
# Always crop to 16:9 before moving the frame (zoompan does not preserve aspect).
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=build/graded
OUT=src/assets/media
mkdir -p "$OUT"
[ -d "$SRC" ] || python3 scripts/photos.py
tail -n +2 scripts/media.manifest.tsv | while IFS=$'\t' read -r id source move dur width poster a b; do
  in="$SRC/$source.jpg"
  height=$(( width * 9 / 16 ))
  frames=$(( dur * 30 ))
  if [ "$move" = "push" ]; then
    vf="scale=3840:-2,crop=3840:2160,zoompan=z='$a+($b-$a)*on/$frames':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${width}x${height}:fps=30,format=yuv420p"
  else
    vf="scale=3840:-2,crop=3840:2160:0:'(ih-2160)*($a+($b-$a)*t/$dur)',scale=${width}:${height}:flags=lanczos,format=yuv420p"
  fi
  ffmpeg -nostdin -loglevel error -y -loop 1 -framerate 30 -i "$in" -t "$dur" -vf "$vf" \
    -c:v libx264 -preset slow -crf 24 -profile:v high -level 4.0 -tune stillimage -g 60 -an -movflags +faststart "$OUT/$id.mp4"
  ffmpeg -nostdin -loglevel error -y -ss "$poster" -i "$OUT/$id.mp4" -frames:v 1 -q:v 5 "$OUT/$id.poster.jpg"
  ffmpeg -nostdin -loglevel error -y -ss "$poster" -i "$OUT/$id.mp4" -frames:v 1 -vf scale=480:-2 -q:v 6 "$OUT/$id.thumb.jpg"
  echo "made $id"
done
