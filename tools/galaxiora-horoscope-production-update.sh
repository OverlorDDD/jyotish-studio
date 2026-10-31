#!/usr/bin/env bash
# Galaxiora: Western tropical + Vedic lunar horoscope update.
# No migrations, no secret changes, no new provider keys.
# Usage: bash /tmp/galaxiora-horoscope-update.sh <pinned-full-SHA>
set -Eeuo pipefail
umask 077
APP=/opt/galaxiora/app
BRANCH=feat/western-vedic-horoscopes-20261031
TARGET="$1"
STATE="$HOME/galaxiora-horoscope-release"
[ "$(printf '%s' "$TARGET" | wc -c)" -eq 40 ] || { echo 'STOP: invalid target SHA'; exit 2; }
mkdir -p "$STATE"
chmod 700 "$STATE"
cd "$APP"
PREVIOUS=$(git rev-parse HEAD)
echo '=== GALAXIORA: TWO HOROSCOPE SYSTEMS ==='
echo "Previous: $PREVIOUS"
echo "Candidate: $TARGET"
for svc in galaxiora-api.service galaxiora-web.service caddy.service; do
 systemctl is-active --quiet "$svc" || { echo "STOP: $svc not active"; exit 1; }
done
for url in http://127.0.0.1:4000/api/health http://127.0.0.1:3000/uk; do
 curl -fsS --max-time 10 "$url" >/dev/null || { echo "STOP: old site unhealthy: $url"; exit 1; }
done
python3 - <<'PY'
from pathlib import Path
import json
data={}
for line in Path('.env').read_bytes().splitlines():
 if b'=' not in line:continue
 k,v=line.split(b'=',1)
 try:
  x=v.strip().decode('ascii')
  data[k.strip().decode('ascii')]=json.loads(x) if x.startswith('"') else x
 except (UnicodeError,ValueError):continue
for k,v in [('PUBLIC_REGISTRATION_ENABLED','1'),('SITE_NOINDEX','0')]:
 if data.get(k)!=v:raise SystemExit('STOP: public user registration/SEO is not fully active: '+k)
for k in ('DATABASE_URL','AUTH_SECRET','RESEND_API_KEY','TURNSTILE_SECRET_KEY'):
 if not data.get(k):raise SystemExit('STOP: existing production security setting missing '+k)
print('PASS: public registration and indexing are enabled')
PY
git fetch origin "$BRANCH"
[ "$(git rev-parse FETCH_HEAD)" = "$TARGET" ] || { echo 'STOP: release head moved'; exit 1; }
git merge-base --is-ancestor "$PREVIOUS" "$TARGET" || { echo 'STOP: unexpected Git history'; exit 1; }
while IFS= read -r path; do
 case "$path" in apps/web/next-env.d.ts|package.json) ;;
 *) echo "STOP: unexpected local tracked modification $path"; exit 1 ;;
 esac
done < <(git diff --name-only HEAD)
cp .env "$STATE/env.before"
chmod 600 "$STATE/env.before"
printf '%s\n' "$PREVIOUS" > "$STATE/previous.sha"
CUTOVER=0
roll_back(){
 local rc=$?
 trap - EXIT
 [ "$rc" = 0 ] && return
 set +e
 echo 'HOROSCOPE UPDATE FAILED — restoring previous application.'
 # Old API stays running during pre-cutover canary.
 if [ "$CUTOVER" = 1 ]; then
  sudo systemctl stop galaxiora-api.service galaxiora-web.service
 fi
 cp "$STATE/env.before" .env
 chmod 600 .env
 git stash push -m 'Galaxiora horoscope aborted generated changes' -- apps/web/next-env.d.ts package.json >/dev/null 2>&1 || true
 git switch --detach "$PREVIOUS"
 npm run build -w @jyotish/api
 npm run build -w @jyotish/web
 sudo systemctl restart galaxiora-api.service galaxiora-web.service
 for i in $(seq 1 35); do
  curl -fsS --max-time 3 http://127.0.0.1:4000/api/health >/dev/null 2>&1 &&
  curl -fsS --max-time 3 http://127.0.0.1:3000/uk >/dev/null 2>&1 && break
  sleep 2
 done
 echo 'Restore completed; check that previous endpoints return 200.'
 echo 'PostgreSQL was not migrated or reset, and existing user credentials were not touched.'
}
trap roll_back EXIT
git stash push -m 'Galaxiora horoscope hotfix preserve generated files' -- apps/web/next-env.d.ts package.json
git switch --detach "$TARGET"
echo '=== BUILD SERVER WITHOUT STOPPING LIVE USERS ==='
npm run build -w @jyotish/api
echo '=== CANARY API ON ISOLATED PORT 4001 ==='
setsid env PORT=4001 NEWS_INGESTION_ENABLED=0 NEWS_TRANSLATION_ENABLED=0 \
 npm run start -w @jyotish/api > "$STATE/canary.log" 2>&1 &
CANARY=$!
ready=0
for i in $(seq 1 35); do
 status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 \
  http://127.0.0.1:4001/api/health || true)
 if [ "$status" = 200 ]; then ready=1; break; fi
 if ! kill -0 "$CANARY" 2>/dev/null; then break; fi
 sleep 2
done
if [ "$ready" != 1 ]; then
 tail -n 45 "$STATE/canary.log"
 kill -- "-$CANARY" 2>/dev/null || true
 exit 1
fi
python3 - <<'PY'
import json
from urllib.request import urlopen
root='http://127.0.0.1:4001'
def get(path):
 with urlopen(root+path,timeout=16) as r:
  if r.status!=200:raise SystemExit('STOP: '+path+' not HTTP 200')
  return json.load(r)
western=get('/api/v1/horoscope/western/today')
vedic=get('/api/v1/horoscope/today')
assert western['reference']=='TROPICAL_SUN_SIGN'
assert vedic['reference']=='SIDEREAL_MOON_SIGN'
assert len(western['signs'])==12 and len(vedic['signs'])==12
assert western['signs'][0]['evidence']['kind']=='PUBLIC_TROPICAL_SOLAR_REFERENCE'
assert vedic['signs'][0]['evidence']['kind']=='PUBLIC_JANMA_RASHI_REFERENCE'
week=get('/api/v1/horoscope/western/week')
assert week['reference']=='TROPICAL_SUN_SIGN' and len(week['days'])==7
me=get('/api/v1/account/me')
assert me['user'] is None
print('PASS: real tropical day/week, independent vedic day and existing anonymous account')
PY
kill -- "-$CANARY" 2>/dev/null || true
wait "$CANARY" 2>/dev/null || true
echo '=== SWITCH WEB + API TO TESTED RELEASE ==='
CUTOVER=1
sudo systemctl stop galaxiora-web.service galaxiora-api.service
npm run build -w @jyotish/web
sudo systemctl start galaxiora-api.service galaxiora-web.service
for i in $(seq 1 35); do
 api=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:4000/api/health || true)
 web=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:3000/uk || true)
 if [ "$api" = 200 ] && [ "$web" = 200 ]; then break; fi
 sleep 2
done
[ "$api" = 200 ] && [ "$web" = 200 ] || { echo 'STOP: server health check failed'; exit 1; }
echo '=== PUBLIC ROUTES AND SEO ==='
for path in /uk /en /uk/horoscope /en/horoscope \
 /uk/horoscope/western/aries /en/horoscope/western/aries \
 /uk/horoscope/aries /en/horoscope/aries; do
 code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 \
  --resolve galaxiora.com:443:127.0.0.1 "https://galaxiora.com$path" || true)
 echo "$path HTTP $code"
 [ "$code" = 200 ] || { echo "STOP: expected public route unavailable: $path"; exit 1; }
done
npm run site:check
echo '=== UPDATE SUCCESS: WESTERN + VEDIC + PERSONAL ==='
echo "LIVE: $(git rev-parse --short HEAD)"
echo 'Registration/DB/provider keys unchanged. Existing Caddy access and SEO preserved.'
trap - EXIT
