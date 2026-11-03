#!/usr/bin/env bash
# P3.8.8 operator-only AWS release. CI NEVER calls deploy.
# Only a reviewed integration commit merged into the vetted P3.6 production release branch, preserving current
# Galaxiora icons/SEO/news/auth and verified as a fast-forward from live.
set -Eeuo pipefail
umask 077
export SYSTEMD_PAGER=cat PAGER=cat
ACTION="${1:-diagnose}"
APP="${P388_APP_ROOT:-/opt/galaxiora/app}"
STATE="${P388_STATE_ROOT:-$HOME/.galaxiora-p388}"
RELEASE_BRANCH=release/panchanga-p36-production-acceptance-20261102
# Independently generated 30-vector oracle must be in merged commit ancestry.
RELEASE_ROOT=fe2cef6b1755f1467b6ad2c7efc619068735a2fc
cd "$APP"
fail(){ printf 'P388_STOP: %s\n' "$*" >&2;return 2; }
is_sha(){ [[ "${1:-}" =~ ^[0-9a-f]{40}$ ]]; }
ready(){
 local service="$1" endpoint="$2" response
 for _ in $(seq 1 45);do
  response=$(curl --max-time 5 -s -o /dev/null -w '%{http_code}' "$endpoint" || true)
  if [[ "$response" == 200 ]] && systemctl is-active --quiet "$service";then
   echo "P388_READY $service HTTP 200";return 0
  fi
  sleep 2
 done
 fail "$service not healthy (inspect sudo journalctl -u $service)"
}
diagnose(){
 echo 'P388_READ_ONLY_DIAGNOSIS: no production changes, no secret values'
 echo "LIVE_SHA=$(git rev-parse HEAD)"
 echo "LIVE_BRANCH=$(git branch --show-current)"
 echo "TRACKED_CHANGED=$(git status --porcelain --untracked-files=no |wc -l)"
 echo "DISK_FREE_KB=$(df -Pk "$APP" |awk 'END{print $4}')"
 echo "MEM_AVAILABLE_KB=$(awk '/MemAvailable:/{print $2}' /proc/meminfo)"
 for name in caddy galaxiora-api galaxiora-web;do
  echo "SERVICE_${name}=$(systemctl is-active "$name" || true)"
 done
 for uri in http://127.0.0.1:4000/api/health http://127.0.0.1:3000/uk;do
  echo "HTTP_${uri}=$(curl --max-time 6 -s -o /dev/null -w '%{http_code}' "$uri" || true)"
 done
 echo 'Release requires exact merged SHA, green CI, and an authenticated native PostgreSQL connection; Docker access is not required.'
}
preflight(){
 local current target available
 [[ -f .env && -s .env && -f package.json ]] || fail 'Existing private .env or package.json missing'
 is_sha "${P388_TARGET_SHA:-}" || fail 'Set exact pinned release SHA'
 # Git fetch does not modify the worktree; obtain a trusted helper directly
 # from the pinned reviewed target before reconciling Next-generated metadata.
 git fetch --no-tags origin "$RELEASE_BRANCH"
 target=$(git rev-parse FETCH_HEAD)
 current=$(git rev-parse HEAD)
 [[ "$target" == "$P388_TARGET_SHA" ]] ||
  fail "Remote release SHA changed ($P388_TARGET_SHA)"
 mkdir -p -m 700 "$STATE"
 git show "$target:tools/panchanga-p388-next-env-guard.mjs" > "$STATE/p388-next-env-guard.mjs"
 chmod 600 "$STATE/p388-next-env-guard.mjs"
 P388_APP_ROOT="$APP" P388_STATE_ROOT="$STATE" node "$STATE/p388-next-env-guard.mjs" reconcile ||
  fail 'Unexpected tracked modifications in generated Next metadata'
 if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo 'P388_LOCAL_MODIFICATIONS: release STOPPED. Changed tracked file names (no contents):' >&2
  git status --short --untracked-files=no >&2
  fail 'Back up and reconcile tracked server edits first; never reset/clean blindly'
 fi
 git merge-base --is-ancestor "$RELEASE_ROOT" "$target" ||
  fail 'Vetted release branch lacks reviewed independent P388 source ancestry: merge PR, do not squash'
 git merge-base --is-ancestor "$current" "$target" ||
  fail 'Live checkout diverges from vetted release branch: STOP, reconcile approved logo/SEO/news edits in separate PR'
 # Prevent Git checkout from overwriting an untracked production asset or
 # operator file that becomes tracked in the target. Preserve all such files.
 local candidate_path
 while IFS= read -r -d '' candidate_path; do
  if git cat-file -e "$target:$candidate_path" 2>/dev/null; then
   fail "Untracked local file conflicts with target: $candidate_path; back it up and reconcile, never auto-delete"
  fi
 done < <(git ls-files --others --exclude-standard -z)
 # Independently query GitHub for fully completed green PUSH checks on EXACT
 # integrated release SHA; a manually supplied attestation string is insufficient.
 mkdir -p -m 700 "$STATE"
 git show "$target:tools/panchanga-p388-ci-gate.mjs" > "$STATE/p388-ci-gate.mjs"
 chmod 600 "$STATE/p388-ci-gate.mjs"
 node "$STATE/p388-ci-gate.mjs" "$target" ||
  fail 'Exact merged SHA lacks green independent astronomy, build and SEO CI checks'
 for source in tools/panchanga-p388-release.sh tools/panchanga-p388-next-env-guard.mjs tools/panchanga-p388-db-direct.mjs tools/panchanga-p388-production-smoke.mjs \
  tests/fixtures/p388-independent-asc-30.tsv;do
  git cat-file -e "$target:$source" || fail "Merged vetted P3.6 release commit missing $source"
 done
 # Never output credentials or contents of .env to terminal or GitHub.
 node --env-file=.env --input-type=module - <<'JS'
const e=process.env;
if(e.NEXT_PUBLIC_SITE_URL!=='https://galaxiora.com'||e.SITE_NOINDEX!=='0')
 throw Error('HTTPS production origin / existing index policy mismatch');
if(!e.AUTH_SECRET||e.AUTH_SECRET.length<32||!e.DATABASE_URL)
 throw Error('Production secrets missing');
if(e.SESSION_COOKIE_SECURE!=='1')
 throw Error('Production cookies must remain secure');
console.log('P388 private HTTPS/indexing/secure-cookie policy present (values hidden)');
JS
 for service in caddy galaxiora-web galaxiora-api;do
  systemctl is-active --quiet "$service" || fail "$service not running"
 done
 for binary in git node npm python3 psql pg_dump pg_restore curl awk df free;do
  command -v "$binary" >/dev/null || fail "Required command missing: $binary (install PostgreSQL client 16 if needed)"
 done
 # Preflight runs from the *previous live commit*, before checkout.
 # Load the helper from the already-CI-tested target into the private state
 # directory. Never use Docker CLI or guess a host/port: same DATABASE_URL
 # that NestJS/Prisma uses. Credentials only pass as libpq child ENV.
 git show "$target:tools/panchanga-p388-db-direct.mjs" > "$STATE/p388-db-direct.mjs"
 chmod 600 "$STATE/p388-db-direct.mjs"
 P388_STATE_ROOT="$STATE" node --env-file=.env "$STATE/p388-db-direct.mjs" check ||
  fail 'Native PostgreSQL connection / compatible pg_dump preflight failed'
 # Verify the exact astronomical dependency that failed the previous AWS
 # deployment BEFORE code checkout, npm install, migration or DB backup.
 # Operator may set PYTHON_BIN to the isolated pinned venv Python. Never
 # download data or silently switch to a non-Swiss astronomical provider.
 local python_exe="${PYTHON_BIN:-python3}"
 [[ -x "$python_exe" ]] || command -v "$python_exe" >/dev/null ||
  fail 'Selected Python executable unavailable: use PYTHON_BIN=/home/ubuntu/.galaxiora-python/bin/python'
 "$python_exe" -c 'import swisseph as s; assert s.version=="2.10.03",s.version' ||
  fail 'Pyswisseph 2.10.03 missing in selected Python interpreter'
 for ephe in sepl_18.se1 semo_18.se1;do
  test -s "node_modules/@swisseph/node/ephemeris/$ephe" ||
   fail "Official Swiss astronomical file missing: $ephe"
 done
 printf '%s' '{"noonUtc":"2026-11-03T10:00:00.000Z","latitude":50.4501,"longitude":30.5234}' |
  "$python_exe" tools/panchanga-sunrise.py >/dev/null ||
  fail 'Real Swiss sunrise check failed: do not start build/deployment'
 echo 'P388_SWISS_SUNRISE_READY verified_utc=2026-11-03 Kyiv'
 available=$(df -Pk "$APP" |awk 'END{print $4}')
 [[ "$available" =~ ^[0-9]+$ ]] && ((available>=3145728)) ||
  fail 'At least 3 GiB disk needed for snapshot + Next build'
 test ! -e apps/web/app/icon.svg || fail 'Old SVG/G generator would overwrite approved spiral'
 test -s apps/web/brand-assets/galaxiora-approved-spiral-6.png ||
  fail 'Approved Galaxiora spiral #6 is missing'
 echo "P388_PREFLIGHT_PASS live=$current merged_p36_release=$target"
}
backup(){
 mkdir -p -m 700 "$STATE"
 local folder="$STATE/backup-$(date -u +%Y%m%dT%H%M%SZ)"
 [[ ! -e "$folder" ]] || fail 'Release backup timestamp collision'
 mkdir -m 700 "$folder"
 git rev-parse HEAD > "$folder/previous.sha"
 cp -p .env "$folder/env.before"
 chmod 600 "$folder/env.before"
 # Consistent online custom-format backup over native PostgreSQL protocol;
 # owner/account/natal data stays in private state outside the webroot.
 # From the same DATABASE_URL used by the verified live API, no Docker calls.
 [[ -s "$STATE/p388-db-direct.mjs" ]] || fail 'Native database helper missing: rerun preflight'
 P388_STATE_ROOT="$STATE" node --env-file=.env "$STATE/p388-db-direct.mjs" backup "$folder/production-before.dump" ||
  fail 'Native PostgreSQL backup failed: preserve live code, inspect DB client/connectivity'
 chmod 600 "$folder/production-before.dump"
 [[ -s "$folder/production-before.dump" ]] || fail 'Native PostgreSQL dump empty'
 printf '%s\n' "$folder" > "$STATE/last-backup"
 echo "P388_BACKUP_TOC_PASS path=$folder (actual restore tested separately in isolated CI)"
}
rollback_code(){
 [[ -s "$STATE/last-backup" ]] || fail 'No recorded release backup'
 local folder previous
 folder=$(cat "$STATE/last-backup")
 [[ "$folder" == "$STATE"/backup-* ]] || fail 'Unexpected rollback path'
 [[ -f "$folder/previous.sha" && -s "$folder/env.before" ]] ||
  fail 'Incomplete private rollback snapshot'
 previous=$(cat "$folder/previous.sha")
 is_sha "$previous" || fail 'Invalid rollback SHA'
 # A failed or successful Next production build can change this tracked
 # generator file. Preserve its generated bytes, never force-reset other files.
 [[ -s "$STATE/p388-next-env-guard.mjs" ]] || fail 'Pinned Next metadata guard missing'
 P388_APP_ROOT="$APP" P388_STATE_ROOT="$STATE" node "$STATE/p388-next-env-guard.mjs" reconcile ||
  fail 'Unsafe generated Next metadata; manual rollback required'
 [[ -z "$(git status --porcelain --untracked-files=no)" ]] ||
  fail 'Modified tracked server files: preserve them and rollback manually'
 git cat-file -e "$previous^{commit}" || fail 'Previous SHA not locally available'
 cp -p "$folder/env.before" .env
 chmod 600 .env
 git switch --detach "$previous"
 npm install --no-audit --no-fund
 npm run db:generate
 npm run build
 sudo systemctl restart galaxiora-api
 ready galaxiora-api http://127.0.0.1:4000/api/health
 sudo systemctl restart galaxiora-web
 ready galaxiora-web http://127.0.0.1:3000/uk
 echo "P388_CODE_ROLLBACK_PASS sha=$previous (database NOT restored/downgraded)"
}
deploy(){
 [[ "${P388_APPROVAL:-}" == 'I_APPROVE_P388_PRODUCTION' ]] ||
  fail 'Explicit P388_APPROVAL=I_APPROVE_P388_PRODUCTION required'
 [[ "${P388_CI_ATTESTED_SHA:-}" == "${P388_TARGET_SHA:-}" ]] ||
  fail 'Operator attestation must name SAME merged release SHA tested on GitHub CI (the variable alone is not proof of green CI)'
 preflight
 backup
 restore_after_error(){
  local code=$?
  trap - ERR
  echo "P388_DEPLOY_FAILED rc=$code; attempting code-only rollback" >&2
  rollback_code || echo 'P388_MANUAL_RECOVERY_REQUIRED: preserve DB backup and inspect service logs'
  exit "$code"
 }
 trap restore_after_error ERR
 git switch --detach "$P388_TARGET_SHA"
 npm install --no-audit --no-fund
 npm run db:generate
 npm run test:panchanga
 npm run test:p410
 npm run test:vedic-calendar
 npm run test:p388:independent
 npm run test:brand:icons
 npm run build
 # Next can rewrite tracked next-env.d.ts during build. Keep checkout clean
 # without discarding any manual changes or affecting generated build artifacts.
 P388_APP_ROOT="$APP" P388_STATE_ROOT="$STATE" node "$STATE/p388-next-env-guard.mjs" reconcile ||
  fail 'Unexpected Next metadata after production build'
 # Existing migrations only; no destructive schema reset or database restore.
 npm run db:migrate
 sudo systemctl restart galaxiora-api
 ready galaxiora-api http://127.0.0.1:4000/api/health
 sudo systemctl restart galaxiora-web
 ready galaxiora-web http://127.0.0.1:3000/uk
 npm run site:check
 npm run launch:verify
 npm run r32:seo:audit
 P388_SITE_ORIGIN=http://127.0.0.1:3000 node tools/panchanga-p388-production-smoke.mjs
 P388_SITE_ORIGIN=https://galaxiora.com P388_PUBLIC=1 node tools/panchanga-p388-production-smoke.mjs
 P25_SITE_ORIGIN=https://galaxiora.com P25_EXPECT_PUBLIC=1 P25_VERIFY_BRAND=1 node tools/panchanga-p25-smoke.mjs
 trap - ERR
 echo "P388_PRODUCTION_RELEASE_VERIFIED sha=$(git rev-parse HEAD)"
 echo 'Full wedding Muhurta remains UNCERTIFIED until 21-dosha + Kuta acceptance.'
}
case "$ACTION" in
 diagnose) diagnose;;
 preflight) preflight;;
 deploy) deploy;;
 rollback)
  [[ "${P388_ROLLBACK_APPROVAL:-}" == 'I_APPROVE_P388_ROLLBACK' ]] ||
   fail 'Set explicit P388_ROLLBACK_APPROVAL'
  rollback_code;;
 *)fail 'Usage: release.sh diagnose|preflight|deploy|rollback';;
esac
