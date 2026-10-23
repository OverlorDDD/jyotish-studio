#!/usr/bin/env bash
# Genuine JHora 8.x captures in a preinstalled, isolated Wine/AHK/Swift environment.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MATRIX="${JQA3_CAPTURE_MATRIX:-$ROOT/tests/fixtures/jhora-corpus/capture-matrix.psv}"
OUT="$ROOT/tests/fixtures/jhora-corpus/captures"
: "${JHORAKIT_DIR:?Need pinned JHoraKit checkout}"
: "${WINE_PREFIX:?Need isolated Wine prefix with JHora + AutoHotkey v1}"
: "${JHORA_VERSION:?Provide actual installed JHora 8.x version}"
command -v swift >/dev/null && command -v wine >/dev/null && command -v sha256sum >/dev/null || { echo "Swift/Wine/SHA256 required" >&2; exit 2; }
[[ -f "$MATRIX" && -d "$JHORAKIT_DIR/.git" ]] || { echo "Missing matrix or JHoraKit checkout" >&2; exit 2; }
kitSha="$(git -C "$JHORAKIT_DIR" rev-parse HEAD)"
[[ "$kitSha" == "f63826b501eabe69c6b08c5365875e1e2f74c24a" ]] || { echo "JHoraKit commit is not pinned" >&2; exit 2; }
[[ -z "$(git -C "$JHORAKIT_DIR" status --porcelain)" ]] || { echo "JHoraKit checkout dirty" >&2; exit 2; }

installation=''
for d in "Program Files (x86)" "Program Files"; do
 candidate="$WINE_PREFIX/drive_c/$d/Jagannatha Hora"
 if [[ -s "$candidate/bin/jhora.exe" ]]; then installation="$candidate"; break; fi
done
[[ -n "$installation" ]] || { echo "Installed official JHora not found" >&2; exit 2; }
ini="$installation/jhcore/jhora.ini"
if [[ ! -s "$ini" ]]; then
 echo "JHora executable installed, but its INI was not initialized. Installing pinned JHoraKit 8.0 preference template."
 test -s "$JHORAKIT_DIR/scripts/jhora.ini"
 mkdir -p "$installation/jhcore"
 cp "$JHORAKIT_DIR/scripts/jhora.ini" "$ini"
 if [[ "$installation" == *"Program Files/Jagannatha Hora" ]]; then
  sed -i 's@C:\\Program Files (x86)\\Jagannatha Hora@C:\\Program Files\\Jagannatha Hora@g' "$ini"
 fi
fi
test -s "$ini"
exeSha="$(sha256sum "$installation/bin/jhora.exe" | awk '{print $1}')"

# JHoraKit ships an AHK script pinned to the *x86* Program Files path.
# Wine 9 installs the official short JHora under Program Files; adapt only the
# executable locator, preserving the upstream AHK extraction logic.
sourceAhk="$JHORAKIT_DIR/Sources/JHoraKit/Resources/extract_param.ahk"
test -s "$sourceAhk"
ahkOverride="$(mktemp --suffix=.ahk)"
if [[ "$installation" == *"Program Files/Jagannatha Hora" ]]; then
 sed 's@C:\\Program Files (x86)\\Jagannatha Hora@C:\\Program Files\\Jagannatha Hora@g' "$sourceAhk" > "$ahkOverride"
else
 cp "$sourceAhk" "$ahkOverride"
fi
grep -q 'Run, "C:' "$ahkOverride" || { echo "AHK JHora launch command not found" >&2; exit 2; }
export JHORA_AHK_SCRIPT="$ahkOverride"

backup="$(mktemp)"
profile="$(mktemp)"
cp "$ini" "$backup"
python3 - "$backup" "$profile" <<'PY'
import re,sys
from pathlib import Path
source,target=map(Path,sys.argv[1:])
text=source.read_text(encoding='utf-8')
settings={
'Siddhanta':'0','UserSelectedAyanamsa':'0','DeltaFromUserSelectedAyanamsa':'0.000000',
'TrueNodes':'0','TruePositions':'0','TopocentricPositions':'0',
'NoNutation':'0','NoAberration':'0','NoGravDeflection':'0',
'D9Preference':'0','D10Preference':'0','DivLongFromEndToo':'0'
}
for key,val in settings.items():
    pattern=r'(?m)^'+re.escape(key)+r'=.*
trap finish EXIT
mkdir -p "$OUT"

while IFS='|' read -r id date localTime lat lon tz place; do
 [[ -z "$id" || "$id" =~ ^# ]] && continue
 [[ "$id" =~ ^[a-z0-9-]+$ ]] || { echo "Unsafe capture id: $id" >&2; exit 2; }
 dst="$OUT/$id"
 [[ ! -e "$dst" ]] || { echo "Refuse overwrite existing evidence: $dst" >&2; exit 2; }
 scratch="$(mktemp -d)"
 loadProfile
 mkdir -p "$dst"
 cp "$ini" "$dst/jhora.ini"
 export JHORA_OUT_DIR="$scratch"
 set +e
 swift run --package-path "$JHORAKIT_DIR" jhora-extract --name "$id" \
   --date "$date" --time "$localTime" --lat "$lat" --lon "$lon" --tz "$tz" --place "$place"
 parseStatus=$?
 set -e
 for raw in chart_data.txt divisionals.txt; do
  candidate="$WINE_PREFIX/drive_c/windows/temp/$raw"
  if [[ -s "$candidate" ]]; then cp "$candidate" "$dst/$raw"; fi
  [[ -s "$dst/$raw" ]] || { echo "Original JHora clipboard absent: $raw" >&2; exit 3; }
 done
 if [[ "$parseStatus" != 0 ]]; then
  echo "JHoraKit full 71-body schema unavailable; strict raw ten-body validator will run" >&2
 fi
 if [[ "$parseStatus" == 0 ]]; then
  mapfile -t captures < <(find "$scratch" -type f -name chart.json -print)
  [[ "${#captures[@]}" == 1 ]] || { echo "Expected one parsed chart.json" >&2; exit 3; }
  sourceDir="$(dirname "${captures[0]}")"
  cp "$sourceDir/chart.json" "$dst/chart.json"
 fi
 jhd="$WINE_PREFIX/drive_c/windows/temp/$id.jhd"
 [[ -s "$jhd" ]] || { echo "JHoraKit generated JHD missing" >&2; exit 3; }
 cp "$jhd" "$dst/input.jhd"
 restore
 python3 - "$dst/capture.json" "$id" "$date" "$localTime" "$lat" "$lon" "$tz" "$exeSha" "$JHORA_VERSION" "$kitSha" <<'PY'
import json,sys
from datetime import datetime,timedelta
from pathlib import Path
import re
path,id,date,clock,lat,lon,tz,exe,version,commit=sys.argv[1:]
chart=(Path(path).parent/'chart_data.txt').read_text(encoding='utf-8')
place=re.search(r'^Place:\\s*(\\d{1,3})\\s+([EW])\\s+(\\d{1,2})\'\\s+(\\d{1,2})",\\s*(\\d{1,2})\\s+([NS])\\s+(\\d{1,2})\'\\s+(\\d{1,2})"',chart,re.M)
if not place:raise SystemExit('JHora source place missing')
actualLongitude=(int(place[1])+int(place[3])/60+int(place[4])/3600)*(-1 if place[2]=='W' else 1)
actualLatitude=(int(place[5])+int(place[7])/60+int(place[8])/3600)*(-1 if place[6]=='S' else 1)
wall=datetime.fromisoformat(date+'T'+clock+':00')
offset=round(float(tz)*3600)
assert -14*3600<=offset<=14*3600
utc=wall-timedelta(seconds=offset)
record={'id':id,'utc':utc.strftime('%Y-%m-%dT%H:%M:%SZ'),
 'birthLocal':wall.strftime('%Y-%m-%dT%H:%M:%S'),'utcOffsetSeconds':offset,
 'latitude':actualLatitude,'longitude':actualLongitude,
 'requestedLatitude':float(lat),'requestedLongitude':float(lon),
 'jhoraExeSha256':exe,'jhoraVersion':version,
 'sourceRepo':'https://github.com/normalmystic/JHoraKit',
 'sourceCommit':commit,'jhoraConfigurationCapturedBeforeRun':True,
 'jhoraConfigurationRestoredAfterRun':True,
 'dashaYearDays':None,'dashaYearEvidence':'NOT_YET_ATTESTED'}
with open(path,'w',encoding='utf-8') as f: json.dump(record,f,indent=2)
PY
 if node --experimental-strip-types "$ROOT/tools/jqa3-corpus.mjs" import "$dst" "tests/fixtures/jhora-corpus/$id.json" &&
    node --experimental-strip-types "$ROOT/tools/jqa3-corpus.mjs" register "tests/fixtures/jhora-corpus/$id.json"; then
   echo "JQA3 VERIFIED RAW PARSE: $id"
 else
   echo "JQA3 UNVERIFIED RAW CAPTURE: $id (preserved for diagnosis)" >&2
 fi
 rm -rf "$scratch"
done < "$MATRIX"
echo "Captured genuine JHora raw files, INIs and normalized chart files. Preserve original evidence in Git, automatically updated the corpus manifest. Full dasha certification requires separately attested period settings."

    text,count=re.subn(pattern,key+'='+val,text)
    if count!=1:raise SystemExit('Missing JHora preference: '+key)
text,count=re.subn(r'(?m)^YearLength=0\\s+[0-9.]+
trap finish EXIT
mkdir -p "$OUT"

while IFS='|' read -r id date localTime lat lon tz place; do
 [[ -z "$id" || "$id" =~ ^# ]] && continue
 [[ "$id" =~ ^[a-z0-9-]+$ ]] || { echo "Unsafe capture id: $id" >&2; exit 2; }
 dst="$OUT/$id"
 [[ ! -e "$dst" ]] || { echo "Refuse overwrite existing evidence: $dst" >&2; exit 2; }
 scratch="$(mktemp -d)"
 restore
 mkdir -p "$dst"
 cp "$ini" "$dst/jhora.ini"
 export JHORA_OUT_DIR="$scratch"
 set +e
 swift run --package-path "$JHORAKIT_DIR" jhora-extract --name "$id" \
   --date "$date" --time "$localTime" --lat "$lat" --lon "$lon" --tz "$tz" --place "$place"
 parseStatus=$?
 set -e
 for raw in chart_data.txt divisionals.txt; do
  candidate="$WINE_PREFIX/drive_c/windows/temp/$raw"
  if [[ -s "$candidate" ]]; then cp "$candidate" "$dst/$raw"; fi
  [[ -s "$dst/$raw" ]] || { echo "Original JHora clipboard absent: $raw" >&2; exit 3; }
 done
 if [[ "$parseStatus" != 0 ]]; then
  echo "JHoraKit full 71-body schema unavailable; strict raw ten-body validator will run" >&2
 fi
 if [[ "$parseStatus" == 0 ]]; then
  mapfile -t captures < <(find "$scratch" -type f -name chart.json -print)
  [[ "${#captures[@]}" == 1 ]] || { echo "Expected one parsed chart.json" >&2; exit 3; }
  sourceDir="$(dirname "${captures[0]}")"
  cp "$sourceDir/chart.json" "$dst/chart.json"
 fi
 jhd="$WINE_PREFIX/drive_c/windows/temp/$id.jhd"
 [[ -s "$jhd" ]] || { echo "JHoraKit generated JHD missing" >&2; exit 3; }
 cp "$jhd" "$dst/input.jhd"
 restore
 python3 - "$dst/capture.json" "$id" "$date" "$localTime" "$lat" "$lon" "$tz" "$exeSha" "$JHORA_VERSION" "$kitSha" <<'PY'
import json,sys
from datetime import datetime,timedelta
path,id,date,clock,lat,lon,tz,exe,version,commit=sys.argv[1:]
wall=datetime.fromisoformat(date+'T'+clock+':00')
offset=round(float(tz)*3600)
assert -14*3600<=offset<=14*3600
utc=wall-timedelta(seconds=offset)
record={'id':id,'utc':utc.strftime('%Y-%m-%dT%H:%M:%SZ'),
 'birthLocal':wall.strftime('%Y-%m-%dT%H:%M:%S'),'utcOffsetSeconds':offset,
 'latitude':float(lat),'longitude':float(lon),
 'jhoraExeSha256':exe,'jhoraVersion':version,
 'sourceRepo':'https://github.com/normalmystic/JHoraKit',
 'sourceCommit':commit,'jhoraConfigurationCapturedBeforeRun':True,
 'jhoraConfigurationRestoredAfterRun':True,
 'dashaYearDays':None,'dashaYearEvidence':'NOT_YET_ATTESTED'}
with open(path,'w',encoding='utf-8') as f: json.dump(record,f,indent=2)
PY
 node --experimental-strip-types "$ROOT/tools/jqa3-corpus.mjs" import "$dst" "tests/fixtures/jhora-corpus/$id.json"
 node --experimental-strip-types "$ROOT/tools/jqa3-corpus.mjs" register "tests/fixtures/jhora-corpus/$id.json"
 rm -rf "$scratch"
done < "$MATRIX"
echo "Captured genuine JHora raw files, INIs and normalized chart files. Preserve original evidence in Git, automatically updated the corpus manifest. Full dasha certification requires separately attested period settings."
, 'YearLength=0 365.242500',text)
if count!=1:raise SystemExit('Missing JHora year-length index 0')
target.write_text(text,encoding='utf-8')
PY
restore(){ cp "$backup" "$ini"; }
loadProfile(){ cp "$profile" "$ini"; }
finish(){ restore; rm -f "$backup" "$profile" "$ahkOverride"; }
trap finish EXIT
mkdir -p "$OUT"

while IFS='|' read -r id date localTime lat lon tz place; do
 [[ -z "$id" || "$id" =~ ^# ]] && continue
 [[ "$id" =~ ^[a-z0-9-]+$ ]] || { echo "Unsafe capture id: $id" >&2; exit 2; }
 dst="$OUT/$id"
 [[ ! -e "$dst" ]] || { echo "Refuse overwrite existing evidence: $dst" >&2; exit 2; }
 scratch="$(mktemp -d)"
 restore
 mkdir -p "$dst"
 cp "$ini" "$dst/jhora.ini"
 export JHORA_OUT_DIR="$scratch"
 set +e
 swift run --package-path "$JHORAKIT_DIR" jhora-extract --name "$id" \
   --date "$date" --time "$localTime" --lat "$lat" --lon "$lon" --tz "$tz" --place "$place"
 parseStatus=$?
 set -e
 for raw in chart_data.txt divisionals.txt; do
  candidate="$WINE_PREFIX/drive_c/windows/temp/$raw"
  if [[ -s "$candidate" ]]; then cp "$candidate" "$dst/$raw"; fi
  [[ -s "$dst/$raw" ]] || { echo "Original JHora clipboard absent: $raw" >&2; exit 3; }
 done
 if [[ "$parseStatus" != 0 ]]; then
  echo "JHoraKit full 71-body schema unavailable; strict raw ten-body validator will run" >&2
 fi
 if [[ "$parseStatus" == 0 ]]; then
  mapfile -t captures < <(find "$scratch" -type f -name chart.json -print)
  [[ "${#captures[@]}" == 1 ]] || { echo "Expected one parsed chart.json" >&2; exit 3; }
  sourceDir="$(dirname "${captures[0]}")"
  cp "$sourceDir/chart.json" "$dst/chart.json"
 fi
 jhd="$WINE_PREFIX/drive_c/windows/temp/$id.jhd"
 [[ -s "$jhd" ]] || { echo "JHoraKit generated JHD missing" >&2; exit 3; }
 cp "$jhd" "$dst/input.jhd"
 restore
 python3 - "$dst/capture.json" "$id" "$date" "$localTime" "$lat" "$lon" "$tz" "$exeSha" "$JHORA_VERSION" "$kitSha" <<'PY'
import json,sys
from datetime import datetime,timedelta
path,id,date,clock,lat,lon,tz,exe,version,commit=sys.argv[1:]
wall=datetime.fromisoformat(date+'T'+clock+':00')
offset=round(float(tz)*3600)
assert -14*3600<=offset<=14*3600
utc=wall-timedelta(seconds=offset)
record={'id':id,'utc':utc.strftime('%Y-%m-%dT%H:%M:%SZ'),
 'birthLocal':wall.strftime('%Y-%m-%dT%H:%M:%S'),'utcOffsetSeconds':offset,
 'latitude':float(lat),'longitude':float(lon),
 'jhoraExeSha256':exe,'jhoraVersion':version,
 'sourceRepo':'https://github.com/normalmystic/JHoraKit',
 'sourceCommit':commit,'jhoraConfigurationCapturedBeforeRun':True,
 'jhoraConfigurationRestoredAfterRun':True,
 'dashaYearDays':None,'dashaYearEvidence':'NOT_YET_ATTESTED'}
with open(path,'w',encoding='utf-8') as f: json.dump(record,f,indent=2)
PY
 node --experimental-strip-types "$ROOT/tools/jqa3-corpus.mjs" import "$dst" "tests/fixtures/jhora-corpus/$id.json"
 node --experimental-strip-types "$ROOT/tools/jqa3-corpus.mjs" register "tests/fixtures/jhora-corpus/$id.json"
 rm -rf "$scratch"
done < "$MATRIX"
echo "Captured genuine JHora raw files, INIs and normalized chart files. Preserve original evidence in Git, automatically updated the corpus manifest. Full dasha certification requires separately attested period settings."
