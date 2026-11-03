#!/usr/bin/env bash
# Galaxiora P3.8.8: pinned code-only production release, NO Docker and NO database migrations.
# Reads live settings privately, preserves approved logo and user data, checks green exact-SHA CI.
set -Eeuo pipefail
umask 077
[[ $# -eq 1 ]] || { echo 'Usage: bash p388-codeonly-aws.sh check|deploy' >&2; exit 2; }
MODE="$1"
case "$MODE" in check|deploy) ;; *) echo 'Use check or deploy' >&2; exit 2;; esac
cd /opt/galaxiora/app
STATE="$HOME/.galaxiora-p388-codeonly"
TARGET=ed446a925f90f78c51471a367a8d77843cece90e
RELEASE=release/panchanga-p36-production-acceptance-20261102
fail(){ echo "P388_CODEONLY_STOP: $*" >&2; exit 2; }
for binary in git node npm curl systemctl sudo; do
 command -v "$binary" >/dev/null || fail "Missing $binary"
done
[[ -s .env && -s package.json ]] || fail 'Private .env or application package missing'
[[ -z "$(git status --porcelain --untracked-files=no)" ]] || {
 git status --short --untracked-files=no >&2
 fail 'Local tracked modifications; preserve them first'
}
CURRENT=$(git rev-parse --verify 'HEAD^{commit}')
git fetch --no-tags origin "refs/heads/$RELEASE"
FETCHED=$(git rev-parse --verify 'FETCH_HEAD^{commit}')
[[ "$FETCHED" == "$TARGET" ]] || fail 'Pinned release branch changed; no site changes'
git merge-base --is-ancestor "$CURRENT" "$TARGET" || fail 'Current AWS history does not fast-forward to release'
git merge-base --is-ancestor fe2cef6b1755f1467b6ad2c7efc619068735a2fc "$TARGET" ||
 fail 'Independent P388 source ancestry missing'
git diff --quiet "$CURRENT" "$TARGET" -- apps/api/prisma/ ||
 fail 'Prisma schema/migrations changed: cannot deploy without database review'
while IFS= read -r -d '' file; do
 if git cat-file -e "$TARGET:$file" 2>/dev/null; then
  fail "Untracked production asset would be overwritten: $file"
 fi
done < <(git ls-files --others --exclude-standard -z)
[[ ! -e apps/web/app/icon.svg ]] || fail 'Old G icon generator blocks approved spiral'
[[ -s apps/web/brand-assets/galaxiora-approved-spiral-6.png ]] ||
 fail 'Approved Galaxiora spiral #6 absent'
for service in caddy galaxiora-api galaxiora-web; do
 systemctl is-active --quiet "$service" || fail "Stopped service $service"
done
for endpoint in http://127.0.0.1:4000/api/health http://127.0.0.1:3000/uk; do
 http=$(curl --max-time 8 -s -o /dev/null -w '%{http_code}' "$endpoint" || true)
 [[ "$http" == 200 ]] || fail "Live site unhealthy before deployment: $endpoint HTTP $http"
done
mkdir -p -m 700 "$STATE"
git show "$TARGET:tools/panchanga-p388-ci-gate.mjs" > "$STATE/ci-gate.mjs"
test -s "$STATE/ci-gate.mjs" || fail 'Exact-SHA CI proof missing'
node "$STATE/ci-gate.mjs" "$TARGET" || fail 'Independent astronomy, Panchanga Quality or SEO CI is not green'
node --env-file=.env --input-type=module - <<'JS'
const e=process.env;
if(e.NEXT_PUBLIC_SITE_URL!=='https://galaxiora.com'||e.SITE_NOINDEX!=='0')
 throw Error('Unexpected public site/indexing configuration');
if(!e.DATABASE_URL||!e.AUTH_SECRET||e.AUTH_SECRET.length<32||e.SESSION_COOKIE_SECURE!=='1')
 throw Error('Required existing production secrets/configuration unavailable');
console.log('P388_CONFIG_VALIDATED (secrets never printed)');
JS
if [[ "$CURRENT" == "$TARGET" ]]; then
 echo "P388_CODEONLY_ALREADY_DEPLOYED $TARGET"
 exit 0
fi
echo "P388_CODEONLY_CODE_SAFE live=$CURRENT target=$TARGET"
echo 'P388_CODEONLY_DB_UNCHANGED: no Docker, no PostgreSQL backup, no database migrations'
# Check the actual required systemctl commands; sudo -v can prompt despite
# an explicit NOPASSWD sudoers rule and is not an adequate privilege probe.
if sudo -n systemctl is-active --quiet galaxiora-api &&
   sudo -n systemctl is-active --quiet galaxiora-web; then
 echo 'P388_SYSTEMD_PRIVILEGE=NOPASSWD_SYSTEMCTL_OK'
else
 fail 'Cannot run sudo -n systemctl for existing API/Web services. No code changed.'
fi
if [[ "$MODE" == check ]]; then
 echo 'P388_CODEONLY_CHECK_PASS (no site changes made)'
 exit 0
fi
# No interactive sudo -v and no sudo password request; stop before checkout if denied.
read -r -p 'Type DEPLOY_CODE_ONLY to apply without DB migration/backup: ' approval
[[ "$approval" == DEPLOY_CODE_ONLY ]] || fail 'Cancelled: no site changes'
disk=$(df -Pk . | awk 'END{print $4}')
[[ "$disk" =~ ^[0-9]+$ ]] && (( disk >= 4194304 )) ||
 fail 'Need at least 4 GiB free disk for safe code/build backup'
BACKUP="$STATE/backup-$(date -u +%Y%m%dT%H%M%SZ)"
[[ ! -e "$BACKUP" ]] || fail 'Backup timestamp collision'
mkdir -m 700 "$BACKUP"
printf '%s\n' "$CURRENT" > "$BACKUP/previous.sha"
cp -p .env "$BACKUP/env.before"
chmod 600 "$BACKUP/env.before"
if [[ -d apps/web/.next ]]; then cp -a apps/web/.next "$BACKUP/previous-next"; fi
if [[ -d apps/api/dist ]]; then cp -a apps/api/dist "$BACKUP/previous-api-dist"; fi
echo "P388_PREVIOUS_CODE_SAVED $BACKUP (database NOT modified or backed up)"
SWITCHED=0
recover(){
 rc=$?
 if [[ "$rc" == 0 ]]; then rc=130; fi
 trap - ERR INT TERM
 echo "P388_RELEASE_FAILED rc=$rc; attempting restore of previous code/build" >&2
 if [[ "$SWITCHED" == 1 ]]; then
  git restore -- apps/web/next-env.d.ts || true
  if git switch --detach "$CURRENT"; then
   if [[ -d "$BACKUP/previous-next" ]]; then
    if [[ -d apps/web/.next ]]; then mv apps/web/.next "$BACKUP/failed-next" || true; fi
    cp -a "$BACKUP/previous-next" apps/web/.next || true
   fi
   if [[ -d "$BACKUP/previous-api-dist" ]]; then
    if [[ -d apps/api/dist ]]; then mv apps/api/dist "$BACKUP/failed-api-dist" || true; fi
    cp -a "$BACKUP/previous-api-dist" apps/api/dist || true
   fi
   sudo -n systemctl restart galaxiora-api || true
   sudo -n systemctl restart galaxiora-web || true
   echo 'P388_ROLLBACK_ATTEMPTED: inspect service status and previous SHA' >&2
  else
   echo "P388_MANUAL_RECOVERY_REQUIRED previous=$CURRENT backup=$BACKUP" >&2
  fi
 fi
 exit "$rc"
}
trap recover ERR INT TERM
git switch --detach "$TARGET"
SWITCHED=1
npm install --no-audit --no-fund --no-package-lock
npm run db:generate
npm run test:panchanga
npm run test:vedic-calendar
npm run test:brand:icons
npm run build
git restore -- apps/web/next-env.d.ts
# Deliberately no prisma migrate and no Docker calls.
sudo -n systemctl restart galaxiora-api
sudo -n systemctl restart galaxiora-web
for service in galaxiora-api galaxiora-web; do
 systemctl is-active --quiet "$service" || { echo "Service failed: $service" >&2; false; }
done
for endpoint in http://127.0.0.1:4000/api/health http://127.0.0.1:3000/uk; do
 ready=0
 for _ in $(seq 1 25); do
  http=$(curl --max-time 5 -s -o /dev/null -w '%{http_code}' "$endpoint" || true)
  if [[ "$http" == 200 ]]; then ready=1; break; fi
  sleep 2
 done
 [[ "$ready" == 1 ]] || { echo "Unhealthy release: $endpoint" >&2; false; }
done
P388_SITE_ORIGIN=https://galaxiora.com P388_PUBLIC=1 node tools/panchanga-p388-production-smoke.mjs
trap - ERR INT TERM
printf 'P388_CODEONLY_PRODUCTION_VERIFIED sha=%s\n' "$(git rev-parse HEAD)"
echo 'NO_DB_MIGRATION_OR_DOCKER_IN_RELEASE. PostgreSQL was not backed up; wedding Muhurta remains uncertified.'
