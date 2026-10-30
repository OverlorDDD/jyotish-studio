#!/usr/bin/env bash
# Galaxiora: guarded AWS deploy, then explicit public opening.
set -Eeuo pipefail
umask 077
export SYSTEMD_PAGER=cat PAGER=cat
ACTION="$1"
APP=/opt/galaxiora/app
STATE="$HOME/galaxiora-release-state"
CADDY=/etc/caddy/Caddyfile
BRANCH=fix/galaxinews-editorial-qa-20261030
mkdir -p "$STATE"
chmod 700 "$STATE"
cd "$APP"

ready(){
 local svc="$1" url="$2" http
 for i in $(seq 1 75); do
  http=$(curl -s -o /dev/null -w '%{http_code}' --max-time 4 "$url" || true)
  if systemctl is-active --quiet "$svc" && [ "$http" = 200 ]; then echo "READY: $svc 200"; return 0; fi
  sleep 2
 done
 echo "NOT READY: $svc"
 sudo journalctl -u "$svc" -n 40 --no-pager
 return 1
}
check_config(){
 test -s .env || { echo 'STOP: .env is empty'; exit 1; }
 test -s package-lock.json || { echo 'STOP: production package-lock.json missing'; exit 1; }
 # An earlier failed deployment can leave both services down. Do not
 # require a working site before deploying a fixed application.
 echo '=== CURRENT SERVICE HEALTH (NON-BLOCKING IF FAILED) ==='
 for svc in galaxiora-api.service galaxiora-web.service caddy.service; do
  echo "$svc: $(systemctl is-active "$svc" || true)"
 done
 local api web
 api=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:4000/api/health || true)
 web=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:3000/uk || true)
 echo "Previous HTTP: API $api, Web $web"
}
save_credentials(){
 read -r -p 'Turnstile Site Key: ' GX_SITE_KEY </dev/tty
 read -r -s -p 'Turnstile Secret Key: ' GX_SECRET_KEY </dev/tty; echo
 read -r -s -p 'Resend API Key: ' GX_RESEND_KEY </dev/tty; echo
 export GX_SITE_KEY GX_SECRET_KEY GX_RESEND_KEY
 python3 - <<'PY'
from pathlib import Path
import os, re, json
p=Path('.env')
raw=p.read_bytes()
if not raw or b'AUTH_SECRET=' not in raw or b'DATABASE_URL=' not in raw:
 raise SystemExit('STOP: old .env is invalid')
v={
 'PUBLIC_REGISTRATION_ENABLED':'1','SESSION_COOKIE_SECURE':'1',
 'NEXT_PUBLIC_SITE_URL':'https://galaxiora.com','SITE_NOINDEX':'1',
 'NEXT_PUBLIC_SITE_CONTACT_EMAIL':'support@galaxiora.com',
 'NEXT_PUBLIC_OPERATOR_NAME':'Denys Avramenko',
 'RESEND_FROM_EMAIL':'verify@mail.galaxiora.com',
 'NEXT_PUBLIC_TURNSTILE_SITE_KEY':os.environ['GX_SITE_KEY'].strip(),
 'TURNSTILE_SECRET_KEY':os.environ['GX_SECRET_KEY'].strip(),
 'RESEND_API_KEY':os.environ['GX_RESEND_KEY'].strip(),
 'NEWS_TRANSLATION_ENABLED':'0'
}
for k,x in v.items():
 try:x.encode('ascii','strict')
 except UnicodeError:raise SystemExit('STOP: invalid encoding in '+k)
 if not x or '\n' in x or '\r' in x:raise SystemExit('STOP: invalid value '+k)
if not re.fullmatch('[A-Za-z0-9_-]{12,256}',v['NEXT_PUBLIC_TURNSTILE_SITE_KEY']):
 raise SystemExit('STOP: invalid Turnstile site key')
if not re.fullmatch('[A-Za-z0-9_-]{12,256}',v['TURNSTILE_SECRET_KEY']):
 raise SystemExit('STOP: invalid Turnstile secret')
if v['NEXT_PUBLIC_TURNSTILE_SITE_KEY']==v['TURNSTILE_SECRET_KEY']:
 raise SystemExit('STOP: Turnstile site and secret keys must differ')
if not re.fullmatch('re_[A-Za-z0-9_-]{15,}',v['RESEND_API_KEY']):
 raise SystemExit('STOP: invalid Resend key')
names={k.encode('ascii') for k in v}
lines=[x for x in raw.splitlines() if x.split(b'=',1)[0].strip() not in names]
lines += [(k+'='+json.dumps(x,ensure_ascii=True)).encode('ascii') for k,x in v.items()]
temp=p.with_name('.env.final-write.tmp')
with temp.open('wb') as f:
 f.write(b'\n'.join(lines)+b'\n')
 f.flush()
 os.fsync(f.fileno())
temp.chmod(0o600)
temp.replace(p)
print('PASS: new signup settings saved, no secrets displayed')
PY
 unset GX_SITE_KEY GX_SECRET_KEY GX_RESEND_KEY
}
recover_deploy(){
 local rc=$?
 trap - EXIT
 [ "$rc" = 0 ] && return 0
 set +e
 echo 'DEPLOY FAILED. Attempting to restore original code and configuration.'
 sudo systemctl stop galaxiora-web.service galaxiora-api.service
 if [ -s "$STATE/env-before-deploy" ]; then
  cp "$STATE/env-before-deploy" .env
  chmod 600 .env
 fi
 git stash push -m 'Galaxiora failed-release generated files' -- apps/web/next-env.d.ts package.json >/dev/null 2>&1 || true
 if [ -s "$STATE/previous.sha" ]; then
  git switch --detach "$(cat "$STATE/previous.sha")"
  npm ci --no-audit --no-fund
  npm run db:generate
  npm run build
 fi
 sudo systemctl start galaxiora-api.service
 ready galaxiora-api.service http://127.0.0.1:4000/api/health || echo 'MANUAL REPAIR: API'
 sudo systemctl start galaxiora-web.service
 ready galaxiora-web.service http://127.0.0.1:3000/uk || echo 'MANUAL REPAIR: web'
 echo 'Database migration was not rolled back; backup retained.'
}
deploy(){
 check_config
 echo '=== VERIFY BRANCH AND LOCAL CHANGES ==='
 git fetch origin "$BRANCH"
 PREVIOUS=$(git rev-parse HEAD)
 TARGET=$(git rev-parse FETCH_HEAD)
 if [ -n "${GALAXIORA_RELEASE_TARGET:-}" ] && [ "$TARGET" != "$GALAXIORA_RELEASE_TARGET" ]; then
  echo 'STOP: release branch changed after this deployment was prepared'; exit 1
 fi
 git merge-base --is-ancestor "$PREVIOUS" "$TARGET" || { echo 'STOP: unexpected Git history'; exit 1; }
 while IFS= read -r f; do
  case "$f" in apps/web/next-env.d.ts|package.json) ;; *) echo "STOP: unexpected changed file $f"; exit 1;; esac
 done < <(git diff --name-only HEAD)
 echo "Previous: $PREVIOUS"
 echo "Target: $TARGET"
 echo '=== BACKUP ==='
 sudo systemctl start galaxiora-db-backup.service
 cp .env "$STATE/env-before-deploy"
 chmod 600 "$STATE/env-before-deploy"
 printf '%s\n' "$PREVIOUS" > "$STATE/previous.sha"
 printf '%s\n' "$TARGET" > "$STATE/target.sha"
 echo '=== CONFIGURE PROVIDED KEYS ==='
 # Trap starts only when the original environment is secured.
 trap recover_deploy EXIT
 save_credentials
 echo '=== UPDATE AND VERIFY ==='
 git stash push -m 'Galaxiora safe prelaunch local changes' -- apps/web/next-env.d.ts package.json
 test -z "$(git status --porcelain --untracked-files=no)"
 git switch --detach "$TARGET"
 npm ci --no-audit --no-fund
 npm run db:generate
 npm run test:access
 npm run test:news
 npm run test:com
 npm run test:r2-r3
 echo '=== ADDITIVE POSTGRES MIGRATION ==='
 npm run db:migrate
 echo '=== BUILD AND TEST NEW API BEFORE STOPPING PRODUCTION ==='
 npm run build
 # Real HTTP startup smoke on an isolated loopback port catches missing
 # decorator metadata and module crashes that a TypeScript build cannot.
 if ss -ltn | grep -qE '127\.0\.0\.1:4001[[:space:]]'; then
  echo 'STOP: API smoke port 4001 already in use'; exit 1
 fi
 local canary_pid http canary_ready=0
 setsid env PORT=4001 NEWS_INGESTION_ENABLED=0 NEWS_TRANSLATION_ENABLED=0 \
  npm run start -w @jyotish/api > "$STATE/api-canary.log" 2>&1 &
 canary_pid=$!
 for i in $(seq 1 35); do
  http=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:4001/api/health || true)
  if [ "$http" = 200 ]; then canary_ready=1; break; fi
  if ! kill -0 "$canary_pid" 2>/dev/null; then break; fi
  sleep 2
 done
 if [ "$canary_ready" != 1 ]; then
  kill -- "-$canary_pid" 2>/dev/null || true
  wait "$canary_pid" 2>/dev/null || true
  echo 'STOP: candidate API failed HTTP boot smoke on port 4001'
  tail -n 65 "$STATE/api-canary.log"
  exit 1
 fi
 echo '=== CANARY: SIGNUP PAYLOAD VALIDATION + FAKE TURNSTILE ==='
 # Check the real NestJS HTTP pipeline BEFORE touching production. The fake
 # token cannot send an email because Cloudflare rejects it first.
 local probe_body probe_status
 probe_body=$(mktemp)
 probe_status=$(curl -sS --max-time 18 -o "$probe_body" -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  --data '{"email":"galaxiora-smoke-check@example.com","password":"Safe-Test-Password-2026","turnstileToken":"fake-token"}' \
  http://127.0.0.1:4001/api/v1/account/register || true)
 if [ "$probe_status" != 403 ]; then
  echo "STOP: candidate signup rejected fake token with HTTP $probe_status instead of 403"
  python3 - "$probe_body" <<'PY'
import json,sys
try:
    data=json.load(open(sys.argv[1]))
    print('statusCode:',data.get('statusCode'))
    print('message:',str(data.get('message',''))[:500])
except Exception:
    print('No diagnostic JSON returned')
PY
  rm -f "$probe_body"
  kill -- "-$canary_pid" 2>/dev/null || true
  wait "$canary_pid" 2>/dev/null || true
  exit 1
 fi
 rm -f "$probe_body"
 echo 'PASS: canary signup validates JSON and blocks fake Turnstile HTTP 403'
 kill -- "-$canary_pid" 2>/dev/null || true
 wait "$canary_pid" 2>/dev/null || true
 echo 'PASS: candidate NestJS API starts and serves real DB health before production cutover'
 echo '=== SWITCH ACTIVE SERVICES ==='
 sudo systemctl stop galaxiora-web.service galaxiora-api.service
 sudo systemctl start galaxiora-api.service
 ready galaxiora-api.service http://127.0.0.1:4000/api/health
 sudo systemctl start galaxiora-web.service
 ready galaxiora-web.service http://127.0.0.1:3000/uk
 echo '=== LIVE ROUTE CHECKS ==='
 for p in /uk /en /uk/news /en/news /uk/privacy /en/privacy /uk/terms /en/terms; do
  curl -fsS --max-time 12 "http://127.0.0.1:3000$p" >/dev/null
  echo "OK: $p"
 done
 npm run site:check
 npm run launch:verify
 npm run r2:audit
 echo '=== FAKE TURNSTILE MUST BE REJECTED ==='
 # example.invalid is rejected by some email validators BEFORE Turnstile is
 # reached. Use IANA-reserved example.com with a valid format; no email can
 # be sent because the fake bot token must be rejected first.
 local response_file http_code
 response_file=$(mktemp)
 http_code=$(curl -sS -o "$response_file" -w '%{http_code}' --max-time 18 \
  -H 'Content-Type: application/json' \
  --data '{"email":"galaxiora-smoke-check@example.com","password":"Safe-Test-Password-2026","turnstileToken":"fake-token"}' \
  http://127.0.0.1:4000/api/v1/account/register || true)
 if [ "$http_code" != 403 ]; then
  echo "STOP: fake Turnstile token returned HTTP $http_code, expected 403."
  echo 'Server rejection detail (no secrets):'
  python3 - "$response_file" <<'PY'
import json,sys
try:
    data=json.load(open(sys.argv[1]))
    print('statusCode:',data.get('statusCode'))
    print('message:',str(data.get('message',''))[:500])
except Exception:
    print('Response was not JSON; inspect API logs without exposing credentials')
PY
  rm -f "$response_file"
  exit 1
 fi
 rm -f "$response_file"
 echo 'PASS: invalid Turnstile token blocked HTTP 403'
 printf '%s\n' "$TARGET" > "$STATE/deployed.sha"
 trap - EXIT
 echo '=== DEPLOY SUCCESS: PRIVATE REAL-USER TEST MODE ==='
 echo 'New protected signup enabled, Caddy IP allowlist and SITE_NOINDEX=1 remain.'
 echo 'NOW: Visit https://galaxiora.com/uk from your allowed browser; register with a real email and confirm OTP.'
 echo 'ONLY after success run the same script with argument open.'
}
recover_open(){
 local rc=$?
 trap - EXIT
 [ "$rc" = 0 ] && return 0
 set +e
 echo 'PUBLIC OPEN FAILURE: restoring preview configuration.'
 if [ -s "$STATE/caddy-before-open" ]; then
  sudo cp "$STATE/caddy-before-open" "$CADDY"
  sudo caddy validate --config "$CADDY" && sudo systemctl reload caddy
 fi
 if [ -s "$STATE/env-before-open" ]; then
  cp "$STATE/env-before-open" .env
  chmod 600 .env
  sudo systemctl stop galaxiora-web.service
  npm run build
  sudo systemctl start galaxiora-web.service
 fi
 echo 'Re-check before another public attempt.'
}
open_site(){
 [ -s "$STATE/deployed.sha" ] || { echo 'STOP: first run deploy'; exit 1; }
 [ "$(git rev-parse HEAD)" = "$(cat "$STATE/deployed.sha")" ] || { echo 'STOP: production commit changed'; exit 1; }
 ready galaxiora-api.service http://127.0.0.1:4000/api/health
 ready galaxiora-web.service http://127.0.0.1:3000/uk
 read -r -p 'After real email code + login succeeded, type VERIFIED: ' answer </dev/tty
 [ "$answer" = VERIFIED ] || { echo 'STOP: verified signup required'; exit 1; }
 sudo test -s "$CADDY"
 cp .env "$STATE/env-before-open"
 sudo cp "$CADDY" "$STATE/caddy-before-open"
 chmod 600 "$STATE/env-before-open"
 sudo chmod 600 "$STATE/caddy-before-open"
 trap recover_open EXIT
 echo '=== ENABLE PUBLIC SEO ==='
 python3 - <<'PY'
from pathlib import Path
import os
p=Path('.env')
raw=p.read_bytes()
lines=[line for line in raw.splitlines() if line.split(b'=',1)[0].strip()!=b'SITE_NOINDEX']
lines.append(b'SITE_NOINDEX=0')
tmp=p.with_name('.env.public-write.tmp')
with tmp.open('wb') as f:
 f.write(b'\n'.join(lines)+b'\n')
 f.flush()
 os.fsync(f.fileno())
tmp.chmod(0o600)
tmp.replace(p)
PY
 sudo systemctl stop galaxiora-web.service
 npm run build
 sudo systemctl start galaxiora-web.service
 ready galaxiora-web.service http://127.0.0.1:3000/uk
 npm run r2:audit
 npm run r3:seo:check
 npm run site:check
 npm run launch:verify
 echo '=== REMOVE ONLY THE PREVIOUSLY CONFIRMED TWO CADDY IP RULES ==='
 sudo python3 - <<'PY'
from pathlib import Path
p=Path('/etc/caddy/Caddyfile')
lines=p.read_text().splitlines(keepends=True)
rule='@blocked not remote_ip 195.114.144.253/32'
response='respond @blocked "Galaxiora private preview" 403'
a=[i for i,l in enumerate(lines) if l.strip()==rule]
b=[i for i,l in enumerate(lines) if l.strip()==response]
if len(a)!=1 or len(b)!=1:
 raise SystemExit('STOP: Caddy allowlist format changed; no automatic edits.')
text=''.join(l for i,l in enumerate(lines) if i not in {a[0],b[0]})
if '@blocked' in text or 'remote_ip' in text:
 raise SystemExit('STOP: other allowlist rules found; no automatic edits.')
p.write_text(text)
print('Caddy preview allowlist removed.')
PY
 sudo caddy validate --config "$CADDY"
 sudo systemctl reload caddy
 for p in /uk /en /uk/news /en/news /uk/privacy /en/terms; do
  curl --max-time 20 -fsS --resolve galaxiora.com:443:127.0.0.1 \
    "https://galaxiora.com$p" >/dev/null
  echo "HTTPS 200: $p"
 done
 echo '=== PUBLIC OPEN SUCCESS ==='
 echo 'Verify from a separate network; search-engine indexing and registration are enabled.'
 trap - EXIT
}
case "$ACTION" in
 deploy) deploy ;;
 open) open_site ;;
 *) echo 'Usage: script deploy|open'; exit 2 ;;
esac
