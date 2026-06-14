#!/usr/bin/env bash
cd "C:/Users/jwuck/OneDrive/Dokumente/SoloToDo/arise-ad" || exit 1
HF="npx --yes hyperframes@0.5.7"
BOOM="assets/sfx/boom_sub.wav"
MUSIC="assets/solo_grind_ad_cut.mp3"

echo "===== RENDER (standard) ====="
$HF render -c variants/v_pov.html      -o renders/var_pov_silent.mp4      --quality standard --quiet
$HF render -c variants/v_frage.html    -o renders/var_frage_silent.mp4    --quality standard --quiet
$HF render -c variants/v_claim.html    -o renders/var_claim_silent.mp4    --quality standard --quiet
$HF render -c variants/v_magiecut.html -o renders/var_magiecut_silent.mp4 --quality standard --quiet
$HF render -c variants/v_short8.html   -o renders/var_short8_silent.mp4   --quality standard --quiet

# 15s mux: music (0-15, faded) + 3 sub-impacts. $3 = first impact delay (ms)
mux15(){
  ffmpeg -y -i "$1" -i "$MUSIC" -i "$BOOM" -filter_complex \
"[1:a]atrim=0:15,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.4,afade=t=out:st=13.4:d=1.6,volume=0.95[mus];[2:a]asplit=3[x][y][z];[x]adelay=$3|$3,volume=0.6[b1];[y]adelay=5900|5900,volume=0.42[b2];[z]adelay=11850|11850,volume=0.8[b3];[mus][b1][b2][b3]amix=inputs=4:normalize=0,alimiter=level_in=1:level_out=1:limit=0.89[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "$2" -loglevel error && echo "MUXED $2"
}

echo "===== MUX 15s ====="
mux15 renders/var_pov_silent.mp4      renders/teaser_pov.mp4      1000
mux15 renders/var_frage_silent.mp4    renders/teaser_frage.mp4    1000
mux15 renders/var_claim_silent.mp4    renders/teaser_claim.mp4    1000
mux15 renders/var_magiecut_silent.mp4 renders/teaser_magiecut.mp4 200

echo "===== MUX 8s ====="
ffmpeg -y -i renders/var_short8_silent.mp4 -i "$MUSIC" -i "$BOOM" -filter_complex \
"[1:a]atrim=0:8,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.3,afade=t=out:st=6.6:d=1.4,volume=0.95[mus];[2:a]asplit=3[x][y][z];[x]adelay=150|150,volume=0.55[b1];[y]adelay=4900|4900,volume=0.7[b2];[z]adelay=6400|6400,volume=0.85[b3];[mus][b1][b2][b3]amix=inputs=4:normalize=0,alimiter=level_in=1:level_out=1:limit=0.89[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest renders/teaser_short8.mp4 -loglevel error && echo "MUXED short8"

echo "===== DONE ====="
for f in teaser_pov teaser_frage teaser_claim teaser_magiecut teaser_short8; do
  printf "%s: " "$f"; ffprobe -v error -show_entries format=duration:stream=codec_type -of csv=p=0 "renders/$f.mp4" 2>/dev/null | tr '\n' ' '; echo ""
done
