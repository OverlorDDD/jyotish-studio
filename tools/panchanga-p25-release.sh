#!/usr/bin/env bash
# P2.5 guarded single-EC2 release. Runs ONLY on the existing AWS host.
# No rewrite of .env, DNS, GA4 credentials, Caddy or news configuration.
set -Eeuo pipefail
umask 077
export SYSTEMD_PAGER=cat PAGER=cat
ACTION="${1:-preflight}"
APP="${P25_APP_ROOT:-/opt/galaxiora/app}"
BRANCH="release/panchanga-v2-p25-integrated-20261102"
P24_BASE="4bcf56921f5123df00d222f2a49d2ebb65b8370e"
STATE="$HOME/.galaxiora-p25"
mkdir -p -m 700 "$STATE"
cd "$APP"

ready(){
 local service="$1" url="$2" status
 for _ in $(seq 1 45); do
  status=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "$url" || true)
  if systemctl is-active --quiet "$service" && [ "$status" = 200 ]; then
   echo "PASS: $service HTTP 200";return 0
  fi
  sleep 2
 done
 echo "FAILED: $service";sudo journalctl -u "$service" -n 60 --no-pager || true
 return 1
}
check_environment(){
 test -s .env && test -s package.json || { echo 'STOP: production .env or package.json missing';return 2; }
 node --env-file=.env - <<'JS'
const env=process.env;
if(env.NEXT_PUBLIC_SITE_URL!=='https://galaxiora.com'||env.SITE_NOINDEX!=='0')
 throw Error('STOP: production origin or existing public index policy differs');
if(!/^G-[A-Z0-9]+$/.test(env.NEXT_PUBLIC_GA4_MEASUREMENT_ID||''))
 throw Error('STOP: GA4 measurement ID not configured as expected');
if(!env.AUTH_SECRET||env.AUTH_SECRET.length<32)throw Error('STOP: missing session secret');
if(!env.DATABASE_URL)throw Error('STOP: missing production database URL');
console.log('PASS: existing public URL, indexing, GA4, session and database config verified (values hidden)');
JS
}
diagnose(){
 echo '=== P2.5 READ-ONLY GIT DIAGNOSTICS ==='
 echo "WORKTREE=$(pwd)"
 echo "CURRENT_SHA=$(git rev-parse HEAD)"
 echo 'Tracked changes (filenames/status only; no file contents or secrets):'
 git status --short --untracked-files=no || true
 echo 'Unstaged change statistics:'
 git diff --stat -- . ':(exclude).env' || true
 echo 'Staged change statistics:'
 git diff --cached --stat -- . ':(exclude).env' || true
 echo 'Release branch ancestry:'
 git fetch --no-tags origin "$BRANCH" || { echo 'FETCH_FAILED';return 2; }
 local target
 target=$(git rev-parse FETCH_HEAD)
 echo "FETCHED_TARGET_SHA=$target"
 if git merge-base --is-ancestor HEAD "$target";then
  echo 'GIT_ANCESTRY=FAST_FORWARD'
 else
  echo 'GIT_ANCESTRY=DIVERGED'
  echo "COMMON_BASE=$(git merge-base HEAD "$target" || true)"
  echo 'STOP: the live commit has changes absent from the release branch; preserve and reconcile them first'
 fi
 echo 'This diagnostic does not modify any tracked files. Do not run git reset --hard or git clean.'
}
preflight(){
 local head target free
 head=$(git rev-parse HEAD)
 if [ -n "$(git status --porcelain --untracked-files=no)" ];then
  echo 'STOP: production has tracked local changes. Showing filenames and ancestry for safe reconciliation.'
  diagnose
  return 2
 fi
 [[ "${P25_TARGET_SHA:-}" =~ ^[0-9a-f]{40}$ ]] || {
  echo 'STOP: supply the exact tested 40-character P25_TARGET_SHA';return 2;
 }
 git fetch --no-tags origin "$BRANCH"
 target=$(git rev-parse FETCH_HEAD)
 [ "$target" = "$P25_TARGET_SHA" ] || {
  echo "STOP: GitHub branch changed; tested $P25_TARGET_SHA but fetched $target";return 2;
 }
 git merge-base --is-ancestor "$P24_BASE" "$target" || {
  echo 'STOP: release is not based on verified P2.4';return 2;
 }
 git merge-base --is-ancestor "$head" "$target" || {
  echo "STOP: production HEAD $head is a divergent sibling; merge it first in GitHub";return 2;
 }
 check_environment
 for service in caddy galaxiora-web galaxiora-api;do
  systemctl is-active --quiet "$service" || { echo "STOP: $service inactive";return 2; }
 done
 command -v npm >/dev/null && command -v python3 >/dev/null || {
  echo 'STOP: Node/Python not available';return 2;
 }
 free=$(df -Pk "$APP" | awk 'END{print $4}')
 [ "$free" -ge 2097152 ] || { echo 'STOP: need 2 GiB of free disk for safe rebuild';return 2; }
 echo "P25_PREFLIGHT_PASS current=$head target=$target"
}
save_backup(){
 command -v sudo >/dev/null || { echo 'STOP: sudo unavailable';return 2; }
 systemctl list-unit-files galaxiora-db-backup.service --no-legend |grep -q galaxiora-db-backup || {
  echo 'STOP: production DB backup service missing';return 2;
 }
 echo '=== Run existing PostgreSQL backup service before migration ==='
 sudo systemctl start galaxiora-db-backup.service
 local old directory
 old=$(git rev-parse HEAD)
 directory="$STATE/backup-$(date -u +%Y%m%dT%H%M%SZ)"
 mkdir -p -m 700 "$directory"
 cp -a .env "$directory/env.before"
 chmod 600 "$directory/env.before"
 printf '%s\n' "$old" > "$directory/previous.sha"
 if [ -d apps/web/.next ];then cp -a apps/web/.next "$directory/web-next.before";fi
 printf '%s\n' "$directory" > "$STATE/last-backup"
 echo "BACKUP=$directory"
}
rollback(){
 local dir old
 test -s "$STATE/last-backup" || { echo 'STOP: no recorded release backup';return 2; }
 dir=$(cat "$STATE/last-backup")
 old=$(cat "$dir/previous.sha")
 [[ "$old" =~ ^[0-9a-f]{40}$ ]] || return 2
 echo "=== RESTORE CODE $old ==="
 cp -a "$dir/env.before" .env
 chmod 600 .env
 git switch --detach "$old"
 npm install --no-audit --no-fund
 npm run db:generate
 npm run build
 sudo systemctl restart galaxiora-api
 ready galaxiora-api http://127.0.0.1:4000/api/health
 sudo systemctl restart galaxiora-web
 ready galaxiora-web http://127.0.0.1:3000/uk
 echo 'ROLLBACK_CODE_OK. Database migrations are additive and NOT reversed; DB backup retained.'
}
deploy(){
 preflight
 [ "${P25_DEPLOY_CONFIRM:-}" = "DEPLOY_P25" ] || {
  echo 'STOP: explicitly set P25_DEPLOY_CONFIRM=DEPLOY_P25 to cut over';return 2;
 }
 save_backup
 recover(){
  local code=$?
  trap - ERR
  echo "RELEASE_FAILED code=$code — restoring previous code without reversing the DB migration"
  rollback || echo 'ROLLBACK_FAILED: use saved previous.sha and inspect service logs'
  exit "$code"
 }
 trap recover ERR
 echo '=== Switch to pinned CI-tested code; retain existing secrets ==='
 git switch --detach "$P25_TARGET_SHA"
 test ! -e apps/web/app/icon.svg || { echo 'STOP: legacy icon.svg could replace approved spiral';return 2; }
 test -s apps/web/brand-assets/galaxiora-approved-spiral-6.png
 npm install --no-audit --no-fund
 npm run db:generate
 npm run test:panchanga
 npm run test:vedic-calendar
 npm run test:r43:seo
 npm run test:r43:visitors
 npm run test:brand:icons
 npm run build
 echo '=== Additive P2.1 observer preference migration (database backed up) ==='
 npm run db:migrate
 sudo systemctl restart galaxiora-api
 ready galaxiora-api http://127.0.0.1:4000/api/health
 sudo systemctl restart galaxiora-web
 ready galaxiora-web http://127.0.0.1:3000/uk
 npm run site:check
 npm run launch:verify
 npm run r32:seo:audit
 P25_SITE_ORIGIN=http://127.0.0.1:3000 npm run p25:smoke
 P25_SITE_ORIGIN=https://galaxiora.com P25_EXPECT_PUBLIC=1 P25_VERIFY_BRAND=1 npm run p25:smoke
 trap - ERR
 echo "P25_PRODUCTION_RELEASE_VERIFIED SHA=$(git rev-parse HEAD)"
 echo 'Verify browser UA/EN and GA4 Realtime/consent separately; SEO indexing still depends on Google.'
}
case "$ACTION" in
 diagnose)diagnose;;
 preflight)preflight;;
 deploy)deploy;;
 rollback)rollback;;
 *)echo 'Usage: bash tools/panchanga-p25-release.sh diagnose|preflight|deploy|rollback';exit 2;;
esac
