#!/usr/bin/env bash
set -euo pipefail
export WINEDEBUG=-all
export WINEARCH=win64
export WINEPREFIX="${RUNNER_TEMP:-/tmp}/n4-jhora8-wine"
export JHORA_KIT_ROOT="${RUNNER_TEMP:-/tmp}/n4-jhorakit"
export N4_JHORA_EXPORT_ROOT="${RUNNER_TEMP:-/tmp}/n4-jhora8-exports"
mkdir -p "$N4_JHORA_EXPORT_ROOT"
echo 'N4 original 50-case JHora 8.0 verification; synthetic records, ephemeral Wine prefix'
command -v wine >/dev/null
command -v swift >/dev/null
wineboot -u
wineserver -w
install="$RUNNER_TEMP/jh_short_install.zip"
for base in 'https://www.vedicastrologer.org/jh' 'https://vedicastrologer.org/jh'; do
  if curl --fail --location --retry 2 --connect-timeout 15 --max-time 180 \
     -H 'User-Agent: Mozilla/5.0' "$base/jh_short_install.zip" -o "$install"; then
    if unzip -t "$install" >/dev/null; then break; fi
  fi
done
unzip -t "$install" >/dev/null || { echo 'N4_JHORA_DOWNLOAD_UNAVAILABLE: authentic author ZIP not accessible'; exit 1; }
mkdir -p "$RUNNER_TEMP/jhinstaller"
unzip -qo "$install" -d "$RUNNER_TEMP/jhinstaller"
installer="$(find "$RUNNER_TEMP/jhinstaller" -iname 'jh_short_install.exe' -type f | head -1)"
test -n "$installer"
echo 'N4_JHORA_ORIGINAL_OFFICIAL_INSTALLER_DOWNLOADED'
# The author supplies a Windows setup program. /S is supported by some installers;
# use the result, never assume it worked without verifying the actual JHora executable.
timeout 200 wine "$installer" /S || true
wineserver -w || true
jhroot="$WINEPREFIX/drive_c/Program Files (x86)/Jagannatha Hora"
test -f "$jhroot/bin/jhora.exe" || { echo 'N4_JHORA_INSTALL_NOT_VERIFIED'; exit 1; }
test -f "$jhroot/jhcore/jhora.ini" || { echo 'N4_JHORA_INI_NOT_PRESENT'; exit 1; }
grep -q '^JHoraVersion=8.0.0.0' "$jhroot/jhcore/jhora.ini" || {
 echo 'N4_JHORA_VERSION_NOT_8_0'; exit 1;
}
echo 'N4_JHORA8_EXE_AND_VERSION_VERIFIED'
ahk="$RUNNER_TEMP/AutoHotkey_1.1.37.02.zip"
curl --fail --location --retry 3 --connect-timeout 20 \
  'https://github.com/AutoHotkey/AutoHotkey/releases/download/v1.1.37.02/AutoHotkey_1.1.37.02.zip' \
  -o "$ahk"
printf '%s  %s\n' '6F3663F7CDD25063C8C8728F5D9B07813CED8780522FD1F124BA539E2854215F' "$ahk" | sha256sum --check
mkdir -p "$RUNNER_TEMP/ahk"
unzip -qo "$ahk" -d "$RUNNER_TEMP/ahk"
export AHK_EXE="$RUNNER_TEMP/ahk/AutoHotkeyU32.exe"
test -f "$AHK_EXE"
git clone --quiet https://github.com/normalmystic/JHoraKit.git "$JHORA_KIT_ROOT"
git -C "$JHORA_KIT_ROOT" checkout --quiet f63826b501eabe69c6b08c5365875e1e2f74c24a
test "$(git -C "$JHORA_KIT_ROOT" rev-parse HEAD)" = f63826b501eabe69c6b08c5365875e1e2f74c24a
swift build --package-path "$JHORA_KIT_ROOT" -c release
# Pin the intended N4 mathematical conventions, and capture the exact resulting INI hash.
export N4_JHORA_INI="$jhroot/jhcore/jhora.ini"
python3 - "$N4_JHORA_INI" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
src=p.read_text(encoding='latin1')
replacements={
'HoraPreference':'0','D3Preference':'0','D4Preference':'0','D7Preference':'0',
'D9Preference':'0','D10Preference':'0','D12Preference':'0','D16Preference':'0',
'D20Preference':'0','D24Preference':'0','D27Preference':'0','D30Preference':'0',
'D60Preference':'0','DivLongFromEndToo':'0',
'Siddhanta':'0','TopocentricPositions':'0','TruePositions':'1',
'UserSelectedAyanamsa':'0','TrueNodes':'0'
}
seen=set()
out=[]
for line in src.splitlines():
    key=line.partition('=')[0]
    if key in replacements:
        out.append(key+'='+replacements[key]);seen.add(key)
    else:out.append(line)
missing=set(replacements)-seen
if missing:
    raise SystemExit('N4_JHORA_PROFILE_INCOMPLETE '+','.join(sorted(missing)))
p.write_text('\n'.join(out)+'\n',encoding='latin1')
PY
# Save pinned settings for postmortem only inside ephemeral runner, never commit birth metadata.
echo 'N4_PINNED_JHORA8_PROFILE_SHA256:'
sha256sum "$N4_JHORA_INI"
export JHORA_OUT_DIR="$N4_JHORA_EXPORT_ROOT"
export N4_JHORA_LIMIT=50
node --experimental-strip-types tools/n4-jhora8-batch.mjs
node --experimental-strip-types tools/n4-jhorakit-import.mjs \
 "$N4_JHORA_EXPORT_ROOT/n4-manifest.json" "$RUNNER_TEMP/n4-jhora8-sanitized.json"
node --experimental-strip-types tools/n4-external-varga-gate.mjs \
 "$RUNNER_TEMP/n4-jhora8-sanitized.json"
echo 'N4_ORIGINAL_JHORA8_PARITY_PASS'
