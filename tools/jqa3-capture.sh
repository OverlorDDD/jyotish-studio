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
cp "$ini" "$backup"
restore(){ cp "$backup" "$ini"; }
finish(){ restore; rm -f "$backup" "$ahkOverride"; }
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
 swift run --package-path "$JHORAKIT_DIR" jhora-extract --name "$id" \
   --date "$date" --time "$localTime" --lat "$lat" --lon "$lon" --tz "$tz" --place "$place"
 mapfile -t captures < <(find "$scratch" -type f -name chart.json -print)
 [[ "${#captures[@]}" == 1 ]] || { echo "Exactly one chart.json required" >&2; exit 3; }
 sourceDir="$(dirname "${captures[0]}")"
 for f in chart.json chart_data.txt divisionals.txt; do
  [[ -s "$sourceDir/$f" ]] || { echo "Original output missing: $f" >&2; exit 3; }
  cp "$sourceDir/$f" "$dst/$f"
 done
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
