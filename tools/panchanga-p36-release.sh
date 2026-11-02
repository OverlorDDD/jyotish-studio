#!/usr/bin/env bash
# P3.6 guarded *operator-run* EC2 release; NEVER invoked by GitHub CI.
# Safe default: read-only diagnostics. The production .env, analytics,
# News translation, DNS, Caddy, brand/icon, and credentials stay untouched.
set -Eeuo pipefail
umask 077
export SYSTEMD_PAGER=cat PAGER=cat
ACTION="${1:-diagnose}"
APP="${P36_APP_ROOT:-/opt/galaxiora/app}"
STATE="${P36_STATE_ROOT:-$HOME/.galaxiora-p36}"
BRANCH="release/panchanga-p36-production-acceptance-20261102"
P35_BASE="e13b5fe80f48fea382b5cec44f3704b264bec6aa"
cd "$APP"

fail(){ printf 'P36_STOP: %s\n' "$*" >&2;return 2; }
sha(){ [[ "$1" =~ ^[0-9a-f]{40}$ ]]; }
ready(){
 local service="$1" endpoint="$2" response
 for _ in $(seq 1 45);do
  response=$(curl --max-time 5 -s -o /dev/null -w '%{http_code}' "$endpoint" || true)
  if [ "$response" = 200 ] && systemctl is-active --quiet "$service";then
   printf 'READY %s HTTP 200\n' "$service";return 0
  fi
  sleep 2
 done
 fail "$service health failed; inspect sudo journalctl -u $service"
}
diagnose(){
 echo 'P36 read-only production diagnostics (no private values, no changes)'
 printf 'LIVE_SHA=%s\n' "$(git rev-parse HEAD)"
 printf 'BRANCH=%s\n' "$(git branch --show-current)"
 printf 'TRACKED_DIFF=%s\n' "$(git status --porcelain --untracked-files=no |wc -l)"
 printf 'DISK_FREE_KB=%s\n' "$(df -Pk "$APP"|awk 'END{print $4}')"
 for service in caddy galaxiora-web galaxiora-api;do
  printf 'SERVICE_%s=%s\n' "$service" "$(systemctl is-active "$service" || true)"
 done
 for endpoint in http://127.0.0.1:4000/api/health http://127.0.0.1:3000/uk;do
  printf 'LOOPBACK_HTTP=%s\n' "$(curl -s --max-time 5 -o /dev/null -w '%{http_code}' "$endpoint" || true)"
 done
 echo 'Preflight requires pinned CI-tested commit and fast-forward ancestry; no hard reset.'
}
preflight(){
 local current target free
 [ -f .env ] && [ -s .env ] && [ -s package.json ] || fail 'Missing app or private .env'
 [ -z "$(git status --porcelain --untracked-files=no)" ] ||
  fail 'Tracked production changes; reconcile and preserve them before release'
 sha "${P36_TARGET_SHA:-}" || fail 'Provide exact 40-character CI-tested P36_TARGET_SHA'
 git fetch --no-tags origin "$BRANCH"
 target=$(git rev-parse FETCH_HEAD);current=$(git rev-parse HEAD)
 [ "$target" = "$P36_TARGET_SHA" ] || fail "Remote branch moved; pinned=$P36_TARGET_SHA latest=$target"
 git merge-base --is-ancestor "$P35_BASE" "$target" ||
  fail 'Candidate is missing P3.5 checked ancestry'
 git merge-base --is-ancestor "$current" "$target" ||
  fail 'LIVE SHA diverges from candidate: do NOT reset; reconcile main/production and stage new integration PR'
 # Never derive indexes or app secrets from this script.
 node --env-file=.env - <<'JS'
const e=process.env;
if(e.NEXT_PUBLIC_SITE_URL!=='https://galaxiora.com'||e.SITE_NOINDEX!=='0')
 throw Error('Stop: production HTTPS/index policy inconsistent');
if(!e.AUTH_SECRET||e.AUTH_SECRET.length<32||!e.DATABASE_URL)
 throw Error('Stop: production credentials missing');
if(e.SESSION_COOKIE_SECURE!=='1')throw Error('Stop: secure cookie config missing');
console.log('P36 production origin/index/cookie policy present (secret values hidden)');
JS
 for service in caddy galaxiora-web galaxiora-api;do
  systemctl is-active --quiet "$service" || fail "$service is not active"
 done
 for tool in docker node npm python3 curl git;do command -v "$tool" >/dev/null ||
  fail "$tool not installed";done
 docker inspect jyotish-db --format '{{.State.Running}}' |grep -qx true ||
  fail 'Production Postgres container not running'
 free=$(df -Pk "$APP"|awk 'END{print $4}')
 [ "$free" -ge 3145728 ] || fail 'Require >=3GiB free for DB snapshot, npm, Next build, rollback'
 test ! -e apps/web/app/icon.svg || fail 'Deprecated G icon may overwrite approved spiral #6'
 test -s apps/web/brand-assets/galaxiora-approved-spiral-6.png ||
  fail 'Missing approved galaxy spiral #6'
 echo "P36_PREFLIGHT_PASS current=$current target=$target"
}
backup(){
 local previous dir archive
 mkdir -p -m 700 "$STATE"
 previous=$(git rev-parse HEAD)
 dir="$STATE/backup-$(date -u +%Y%m%dT%H%M%SZ)"
 [ ! -e "$dir" ] || fail 'Backup stamp collision'
 mkdir -m 700 "$dir"
 printf '%s\n' "$previous" > "$dir/previous.sha"
 cp -p .env "$dir/env.before"
 chmod 600 "$dir/env.before"
 archive="$dir/db-before.dump"
 # Custom-format PostgreSQL 16 dump: consistent online snapshot.
 # Contains sensitive charts and users; keep outside webroot, mode 0600.
 docker exec jyotish-db pg_dump --format=custom --no-owner --no-acl -U jyotish -d jyotish > "$archive"
 chmod 600 "$archive"
 [ -s "$archive" ] || fail 'Empty PostgreSQL backup'
 docker exec -i jyotish-db pg_restore --list < "$archive" >/dev/null ||
  fail 'Backup archive TOC cannot be read'
 [ -f "$dir/previous.sha" ] && [ -s "$dir/env.before" ] ||
  fail 'Incomplete release rollback snapshot'
 printf '%s\n' "$dir" > "$STATE/last-backup"
 echo 'P36_BACKUP_VERIFIED: custom-format Postgres archive and environment snapshot retained privately'
 echo 'A TOC check does not prove complete restoration; see required rehearsal in runbook.'
}
rollback(){
 local dir previous
 [ -s "$STATE/last-backup" ] || fail 'No successful P36 backup exists'
 dir=$(cat "$STATE/last-backup")
 [[ "$dir" == "$STATE"/backup-* ]] || fail 'Unexpected backup path'
 [ -s "$dir/previous.sha" ] && [ -s "$dir/env.before" ] ||
  fail 'Incomplete rollback metadata'
 previous=$(cat "$dir/previous.sha")
 sha "$previous" || fail 'Invalid previous commit'
 [ -z "$(git status --porcelain --untracked-files=no)" ] ||
  fail 'Tracked changes: STOP and preserve them before switching rollback SHA'
 git cat-file -e "$previous^{commit}" || fail 'Previous commit not in local repository'
 cp -p "$dir/env.before" .env
 chmod 600 .env
 git switch --detach "$previous"
 npm install --no-audit --no-fund
 npm run db:generate
 npm run build
 sudo systemctl restart galaxiora-api
 ready galaxiora-api http://127.0.0.1:4000/api/health
 sudo systemctl restart galaxiora-web
 ready galaxiora-web http://127.0.0.1:3000/uk
 echo "P36_ROLLBACK_CODE_OK previous=$previous"
 echo 'No destructive automatic database downgrade. DB archive must remain protected.'
}
deploy(){
 [ "${P36_APPROVAL:-}" = 'I_APPROVE_P36_PRODUCTION' ] ||
  fail 'Production cutover requires explicit P36_APPROVAL=I_APPROVE_P36_PRODUCTION'
 preflight
 [ "${P36_ATTESTED_SHA:-}" = "$P36_TARGET_SHA" ] ||
  fail 'P36_ATTESTED_SHA must equal the exact all-green CI SHA'
 backup
 restore_on_error(){
  local result=$?
  trap - ERR
  echo "P36_DEPLOY_FAILED rc=$result — attempting guarded code rollback"
  rollback || echo 'P36_MANUAL_ROLLBACK_REQUIRED: inspect services and preserve DB snapshot'
  exit "$result"
 }
 trap restore_on_error ERR
 git switch --detach "$P36_TARGET_SHA"
 npm install --no-audit --no-fund
 npm run db:generate
 npm run test:panchanga
 npm run test:vedic-calendar
 npm run test:brand:icons
 npm run build
 # Only additive Prisma migration after protected snapshot; never run reset.
 npm run db:migrate
 sudo systemctl restart galaxiora-api
 ready galaxiora-api http://127.0.0.1:4000/api/health
 sudo systemctl restart galaxiora-web
 ready galaxiora-web http://127.0.0.1:3000/uk
 npm run site:check
 npm run launch:verify
 npm run r32:seo:audit
 P36_SITE_ORIGIN=http://127.0.0.1:3000 node tools/panchanga-p36-smoke.mjs
 P36_SITE_ORIGIN=https://galaxiora.com P36_PUBLIC=1 node tools/panchanga-p36-smoke.mjs
 P25_SITE_ORIGIN=https://galaxiora.com P25_EXPECT_PUBLIC=1 P25_VERIFY_BRAND=1 node tools/panchanga-p25-smoke.mjs
 trap - ERR
 echo "P36_PRODUCTION_RELEASE_VERIFIED sha=$(git rev-parse HEAD)"
}
case "$ACTION" in
 diagnose)diagnose;;
 preflight)preflight;;
 deploy)deploy;;
 rollback)
  [ "${P36_ROLLBACK_APPROVAL:-}" = 'I_APPROVE_P36_ROLLBACK' ] ||
   fail 'Operator must explicitly approve manual rollback'
  rollback;;
 *)fail 'Usage: bash tools/panchanga-p36-release.sh diagnose|preflight|deploy|rollback';;
esac
