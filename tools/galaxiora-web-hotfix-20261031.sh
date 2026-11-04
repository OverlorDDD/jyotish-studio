#!/usr/bin/env bash
# Web-only production update: city search and privacy. No database/API changes.
set -Eeuo pipefail
umask 077
TARGET="$1"
APP=/opt/galaxiora/app
STATE="$HOME/galaxiora-city-privacy-update"
BRANCH=fix/galaxinews-editorial-qa-20261030
if [ "$(printf '%s' "$TARGET" | wc -c)" -ne 40 ]; then
 echo 'STOP: specify exact 40-character commit SHA'
 exit 2
fi
mkdir -p "$STATE"
chmod 700 "$STATE"
cd "$APP"
PREVIOUS=$(git rev-parse HEAD)
echo '=== GALAXIORA WEB HOTFIX ==='
echo "Previous: $PREVIOUS"
echo "Candidate: $TARGET"
for service in galaxiora-api.service galaxiora-web.service caddy.service; do
 systemctl is-active --quiet "$service" || { echo "STOP: $service inactive"; exit 1; }
done
for path in /uk /en; do
 curl -fsS --max-time 12 "http://127.0.0.1:3000$path" >/dev/null
done
curl -fsS --max-time 12 http://127.0.0.1:4000/api/health >/dev/null
python3 - <<'PY'
from pathlib import Path
import json
p=Path('/opt/galaxiora/app/.env')
if not p.is_file():raise SystemExit('STOP: missing production .env')
data={}
for line in p.read_bytes().splitlines():
 if b'=' not in line:continue
 key,value=line.split(b'=',1)
 try:
  k=key.strip().decode('ascii')
  v=value.strip().decode('ascii')
  data[k]=json.loads(v) if v.startswith('"') else v
 except (ValueError,UnicodeError):continue
for k,v in [('PUBLIC_REGISTRATION_ENABLED','1'),('SITE_NOINDEX','0')]:
 if data.get(k)!=v:raise SystemExit('STOP: protected public release is not active: '+k)
print('PASS: existing public signup and SEO configuration')
PY
git fetch origin "$BRANCH"
test "$(git rev-parse FETCH_HEAD)" = "$TARGET" || { echo 'STOP: release revision changed'; exit 1; }
git merge-base --is-ancestor "$PREVIOUS" "$TARGET" || { echo 'STOP: unexpected Git history'; exit 1; }
while IFS= read -r file; do
 case "$file" in
  apps/web/next-env.d.ts|package.json) ;;
  *) echo "STOP: unexpected tracked file modified: $file"; exit 1 ;;
 esac
done < <(git diff --name-only HEAD)
cp .env "$STATE/env.backup"
chmod 600 "$STATE/env.backup"
printf '%s\n' "$PREVIOUS" > "$STATE/previous.sha"
rollback(){
 local code=$?
 trap - EXIT
 if [ "$code" -eq 0 ]; then return; fi
 set +e
 echo 'HOTFIX FAILED — restoring previous web version.'
 cp "$STATE/env.backup" .env
 chmod 600 .env
 git stash push -m 'Hotfix rollback generated changes' -- apps/web/next-env.d.ts package.json >/dev/null 2>&1 || true
 git switch --detach "$PREVIOUS"
 sudo systemctl stop galaxiora-web.service
 npm run build -w @jyotish/web
 sudo systemctl start galaxiora-web.service
 curl -fsS --max-time 15 http://127.0.0.1:3000/uk >/dev/null &&
  echo 'RESTORED previous public website' || echo 'CHECK web service manually'
 echo 'NestJS, database, and account credentials were untouched.'
}
trap rollback EXIT
git stash push -m 'Galaxiora hotfix protected local files' -- apps/web/next-env.d.ts package.json
git switch --detach "$TARGET"
echo '=== REMOVE PUBLIC OWNER NAME FROM ENV ==='
python3 - <<'PY'
from pathlib import Path
import os
p=Path('.env')
raw=p.read_bytes()
lines=[line for line in raw.splitlines()
       if line.split(b'=',1)[0].strip()!=b'NEXT_PUBLIC_OPERATOR_NAME']
tmp=p.with_name('.env.hotfix.tmp')
with tmp.open('wb') as f:
 f.write(b'\n'.join(lines)+b'\n')
 f.flush()
 os.fsync(f.fileno())
tmp.chmod(0o600)
tmp.replace(p)
print('Removed unused personal-name setting; secret keys preserved.')
PY
echo '=== REBUILD WEB ONLY ==='
sudo systemctl stop galaxiora-web.service
npm run build -w @jyotish/web
sudo systemctl start galaxiora-web.service
ready=0
for i in $(seq 1 45); do
 http=$(curl -s -o /dev/null -w '%{http_code}' --max-time 4 http://127.0.0.1:3000/uk || true)
 if systemctl is-active --quiet galaxiora-web.service && [ "$http" = 200 ]; then ready=1; break; fi
 sleep 2
done
test "$ready" = 1 || { echo 'STOP: website not ready'; exit 1; }
echo '=== VERIFY NATAL CITY PICKER + PRIVACY HTML ==='
python3 - <<'PY'
from pathlib import Path
from urllib.request import urlopen
import json
root='http://127.0.0.1:3000'
backup=Path.home()/'galaxiora-city-privacy-update'/'env.backup'
owner=None
for line in backup.read_bytes().splitlines():
 if b'=' not in line:continue
 key,value=line.split(b'=',1)
 if key.strip()!=b'NEXT_PUBLIC_OPERATOR_NAME':continue
 try:
  raw=value.decode('utf-8').strip()
  owner=json.loads(raw) if raw.startswith('"') else raw
 except (UnicodeError,ValueError):pass
for lang in ('uk','en'):
 with urlopen(root+'/'+lang+'/astrology/jyotish',timeout=15) as response:
  chart=response.read().decode('utf-8','replace')
 if 'global-city-input' not in chart or 'global-city-search' not in chart:
  raise SystemExit('STOP: worldwide city search not rendered in '+lang+' birth chart')
 with urlopen(root+'/'+lang+'/privacy',timeout=15) as response:
  privacy=response.read().decode('utf-8','replace')
 if owner and owner in privacy:
  raise SystemExit('STOP: operator private name is still present in '+lang+' privacy page')
 if 'support@galaxiora.com' not in privacy:
  raise SystemExit('STOP: expected public support email missing')
 print('PASS:',lang,'natal world-city search and privacy contact')
PY
echo '=== VERIFY EXISTING ACCOUNTS AND API ==='
curl -fsS --max-time 12 http://127.0.0.1:4000/api/health >/dev/null
curl -fsS --max-time 12 http://127.0.0.1:3000/api/v1/account/me >/dev/null
echo 'PASS: existing account API and database connection healthy'
echo '=== CHECK LIVE CITY DATA PROVIDER ==='
status=$(curl -s -o "$STATE/geo-response.json" -w '%{http_code}' --max-time 15 \
  'http://127.0.0.1:4000/api/v1/panchanga/cities?q=London&lang=en' || true)
if [ "$status" = 200 ]; then
 python3 - "$STATE/geo-response.json" <<'PY'
import json,sys
data=json.load(open(sys.argv[1]))
rows=data.get('items',[])
assert isinstance(rows,list) and rows
assert any(isinstance(x.get('latitude'),(int,float)) and
           isinstance(x.get('longitude'),(int,float)) and
           x.get('timeZone') for x in rows)
print('PASS: world geocoding returns coordinates and time zones')
PY
else
 echo "WARN: live world geocoding returned HTTP $status; provider may be temporarily unavailable"
fi
trap - EXIT
echo '=== GALAXIORA UPDATE SUCCESS ==='
echo "Deployed: $(git rev-parse --short HEAD)"
echo 'No database migration, API restart, or key changes.'
