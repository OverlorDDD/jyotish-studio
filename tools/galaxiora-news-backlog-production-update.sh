#!/usr/bin/env bash
# Galaxiora: Hindi/English/Ukrainian NMT safety release with real Azure pre-cutover QA.
# No migrations, no secret changes, no new provider keys.
# Usage: bash /tmp/galaxiora-nmt-update.sh <pinned-full-SHA>
set -Eeuo pipefail
umask 077
APP=/opt/galaxiora/app
BRANCH=fix/news-nmt-backlog-drain-20261101
TARGET="$1"
STATE="$HOME/galaxiora-nmt-backlog-release"
[ "$(printf '%s' "$TARGET" | wc -c)" -eq 40 ] || { echo 'STOP: invalid target SHA'; exit 2; }
mkdir -p "$STATE"
chmod 700 "$STATE"
cd "$APP"
PREVIOUS=$(git rev-parse HEAD)
echo '=== GALAXIORA: NMT ARCHIVE BACKLOG RECOVERY ==='
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
if data.get('NEWS_INGESTION_ENABLED')=='0':
 raise SystemExit('STOP: NEWS_INGESTION_ENABLED=0 explicitly disables production news. Change to 1 in .env using your normal secret management, then rerun.')
print('PASS: production ingestion is not explicitly disabled; public registration and indexing are enabled')
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
CANARY=0
roll_back(){
 local rc=$?
 trap - EXIT
 [ "$rc" = 0 ] && return
 set +e
 if [ "$CANARY" != 0 ]; then
  kill -- "-$CANARY" 2>/dev/null || true
 fi
 echo 'NMT CANDIDATE FAILED — restoring previous application.'
 # Old API stays running during pre-cutover canary.
 if [ "$CUTOVER" = 1 ]; then
  sudo systemctl stop galaxiora-api.service galaxiora-web.service
 fi
 cp "$STATE/env.before" .env
 chmod 600 .env
 git stash push -m 'Galaxiora horoscope aborted generated changes' -- apps/web/next-env.d.ts package.json >/dev/null 2>&1 || true
 git switch --detach "$PREVIOUS"
 if [ "$CUTOVER" = 0 ]; then
  echo 'PASS: failed candidate stopped before production cutover.'
  echo 'Existing web and API processes were not restarted or interrupted.'
  return
 fi
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
echo '=== ARCHIVE QUEUE ELIGIBILITY REGRESSION ==='
node --test tools/news-nmt-backlog.test.mjs
echo '=== PRE-CUTOVER REAL AZURE NMT SAMPLE (NO DB WRITES) ==='
# This test uses small, bounded Azure NMT samples. It may cost a few characters,
# but must PASS before enabling the new translation logic in live API.
npm run news:translate:multilingual || {
 echo 'STOP: real Hindi mixed-language sample still BLOCKED. Production remains unchanged.'
 exit 1
}
echo '=== Azure monthly budget snapshot ==='
npm run news:azure:budget
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
from urllib.error import HTTPError
try:
 get('/api/v1/personal/horoscope/western')
 raise SystemExit('STOP: Western personal endpoint returned private data to guest')
except HTTPError as error:
 if error.code!=401:raise SystemExit('STOP: Western private guest access returned '+str(error.code)+' rather than 401')
try:
 get('/api/v1/personal/horoscope/synthesis?days=7')
 raise SystemExit('STOP: Synthesis endpoint leaked private natal details to guest')
except HTTPError as error:
 if error.code!=401:raise SystemExit('STOP: Synthesis access returned '+str(error.code)+' instead of 401')
try:
 get('/api/v1/personal/horoscope/synthesis/advanced?days=7')
 raise SystemExit('STOP: ASE-2 private endpoint returned data to guest')
except HTTPError as error:
 if error.code!=401:raise SystemExit('STOP: ASE-2 private endpoint returned '+str(error.code)+' instead of 401')
try:
 get('/api/v1/personal/horoscope/synthesis/reading')
 raise SystemExit('STOP: retired AI synthesis endpoint is still available')
except HTTPError as error:
 if error.code!=404:raise SystemExit('STOP: retired AI endpoint expected 404, found '+str(error.code))
status=get('/api/v1/news/status')
assert 'freshness' in status and status['freshness']['state'] in (
 'healthy','disabled','never_scanned','scan_stale','feed_stale','degraded')
try:
 get('/api/v1/news/admin/health')
 raise SystemExit('STOP: private news admin diagnostics leaked to guest')
except HTTPError as error:
 if error.code!=401:raise SystemExit('STOP: private news admin diagnostics returned '+str(error.code))
try:
 get('/api/v1/admin/overview')
 raise SystemExit('STOP: private admin overview leaked to guest')
except HTTPError as error:
 if error.code!=401:raise SystemExit('STOP: admin overview returned '+str(error.code))
print('PASS: legacy horoscope contracts, news freshness schema and staff endpoint privacy')
PY
kill -- "-$CANARY" 2>/dev/null || true
wait "$CANARY" 2>/dev/null || true
CANARY=0
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
echo '=== POST-CUTOVER GALAXINEWS API ==='
python3 - <<'PY'
from urllib.request import urlopen
import json
with urlopen('http://127.0.0.1:4000/api/v1/news/status',timeout=15) as response:
 data=json.load(response)
assert data.get('running') is True, 'STOP: production news scheduler is not enabled'
assert isinstance(data.get('freshness'),dict), 'STOP: missing news diagnostics'
print('GalaxiNews:',data['freshness']['state'],'last scan:',data['freshness']['lastScanAt'],
      'latest accepted:',data['freshness']['lastNewArticleAt'])
print('PASS: scheduler configured. Verify actual new scans and articles in Admin > News after 15-30 minutes.')
PY
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
echo '=== UPDATE SUCCESS: NMT ARCHIVE BACKLOG AND SOURCE COOLDOWN ==='
echo "LIVE: $(git rev-parse --short HEAD)"
echo 'No DB migrations; credentials untouched. Check actual ingestion log, next scan and accepted records in admin.'
trap - EXIT
