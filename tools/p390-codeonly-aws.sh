#!/usr/bin/env bash
# Galaxiora P3.8.9: guarded code-only release with real Swiss Python preflight.
# Fixes the 2026-11-03 AWS rollback: test:p389:real used SSH Python without .env.
# Reads live settings privately, preserves approved logo and user data, checks green exact-SHA CI.
set -Eeuo pipefail
umask 077
[[ $# -eq 1 ]] || { echo 'Usage: bash p390-codeonly-aws.sh check|prepare|deploy' >&2; exit 2; }
MODE="$1"
case "$MODE" in check|prepare|deploy) ;; *) echo 'Use check, prepare or deploy' >&2; exit 2;; esac
cd /opt/galaxiora/app
STATE="$HOME/.galaxiora-p390-codeonly"
# Same P3.8.9 approved, exact-SHA CI-certified application code.
# The operator script is external to the production application commit.
TARGET=130af372225bf7543f4117fcb34c7947a49cb0cb
RELEASE=release/panchanga-p36-production-acceptance-20261102
fail(){ echo "P390_CODEONLY_STOP: $*" >&2; exit 2; }
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
 fail 'Independent P390 source ancestry missing'
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
console.log('P390_CONFIG_VALIDATED (secrets never printed)');
JS
# Real Swiss-Python preflight MUST run before checkout, backups or service restarts.
# P390 changed only the interpretation; Python sunrise source itself must be identical
# between installed live code and pinned P390, so checking the current file is sound.
git diff --quiet "$CURRENT" "$TARGET" -- tools/panchanga-sunrise.py ||
 fail 'Python sunrise source changed: unsafe to use this preflight for target code'
PY_CHOICE="$STATE/p390-python-choice"
VENV_PY="$STATE/py-venv/bin/python3"
if [[ -s "$PY_CHOICE" ]]; then
 RUN_PY=$(cat "$PY_CHOICE")
 [[ "$RUN_PY" == "$VENV_PY" ]] || fail 'Unexpected prepared interpreter path'
else
 RUN_PY=$(node --env-file=.env -p 'process.env.PYTHON_BIN||"python3"')
fi
python_probe(){
 # Use the SAME .env-visible Python that will be provided to the real-sky test.
 # This is an actual Swiss rise/set calculation, not just "import swisseph".
 PYTHON_BIN="$RUN_PY" node --env-file=.env --input-type=module - <<'P390_PY_PROBE'
import {spawnSync} from 'node:child_process';
const executable=process.env.PYTHON_BIN;
if (!executable || executable.length>2048 || /[\r\n\0]/.test(executable))process.exit(11);
const job=spawnSync(executable,['tools/panchanga-sunrise.py'],{
 encoding:'utf8',timeout:16000,maxBuffer:32768,
 input:JSON.stringify({noonUtc:'2026-11-03T10:00:00.000Z',latitude:50.4501,longitude:30.5234}),
 env:process.env
});
if(job.status!==0){
 console.error('P390_PYTHON_PROBE_FAIL: '+(job.stderr||job.error?.message||'Python exited nonzero').slice(0,600));
 process.exit(12);
}
try{
 const p=JSON.parse(job.stdout);
 if(!Array.isArray(p.rise)||p.rise.length<2||!Array.isArray(p.set)||p.set.length<2||
   !String(p.method).startsWith('Swiss Ephemeris'))throw Error('Swiss sunrise provenance mismatch');
}catch(e){console.error('P390_PYTHON_PROBE_FAIL: invalid Swiss sunrise result: '+e.message);process.exit(13)}
console.log('P390_REAL_SWISS_SUNRISE_PRECHECK_PASS (no site changes)');
P390_PY_PROBE
}
if [[ "$MODE" == prepare ]]; then
 if python_probe; then
  echo 'P390_PYTHON_PREPARED: existing interpreter valid; no installation required'
  exit 0
 fi
 command -v python3 >/dev/null || fail 'Cannot create isolated Python environment: python3 missing'
 # No apt, no sudo, no system-site packages, no Docker and no database changes.
 python3 -m venv "$STATE/py-venv" ||
  fail 'Python venv unavailable. Install python3-venv using system package manager before retry.'
 "$VENV_PY" -m pip install --disable-pip-version-check --no-input --no-cache-dir 'pyswisseph==2.10.3.2' ||
  fail 'Isolated PySwissEph installation failed. Site untouched.'
 RUN_PY="$VENV_PY"
 python_probe || fail 'Isolated interpreter does not pass actual Swiss sunrise; site untouched'
 printf '%s\n' "$RUN_PY" > "$PY_CHOICE"
 chmod 600 "$PY_CHOICE"
 echo 'P390_PYTHON_PREPARED: isolated verified interpreter; production untouched'
 exit 0
fi
if ! python_probe; then
 echo 'P390_PYTHON_NOT_READY: Run bash /tmp/p390-codeonly-aws.sh prepare, then check again.' >&2
 fail 'No changes to application or database'
fi
if [[ "$CURRENT" == "$TARGET" ]]; then
 echo "P390_CODEONLY_ALREADY_DEPLOYED $TARGET"
 exit 0
fi
echo "P390_CODEONLY_CODE_SAFE live=$CURRENT target=$TARGET"
echo 'P390_CODEONLY_DB_UNCHANGED: no Docker, no PostgreSQL backup, no database migrations'
# Check the actual required systemctl commands; generic sudo checks can prompt despite
# an explicit NOPASSWD sudoers rule and is not an adequate privilege probe.
if sudo -n systemctl is-active --quiet galaxiora-api &&
   sudo -n systemctl is-active --quiet galaxiora-web; then
 echo 'P390_SYSTEMD_PRIVILEGE=NOPASSWD_SYSTEMCTL_OK'
else
 fail 'Cannot run sudo -n systemctl for existing API/Web services. No code changed.'
fi
if [[ "$MODE" == check ]]; then
 echo 'P390_CODEONLY_CHECK_PASS (no site changes made)'
 exit 0
fi
# No interactive password prompt for sudo; stop before checkout if denied.
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
echo "P390_PREVIOUS_CODE_SAVED $BACKUP (database NOT modified or backed up)"
SWITCHED=0
recover(){
 rc=$?
 if [[ "$rc" == 0 ]]; then rc=130; fi
 trap - ERR INT TERM
 echo "P390_RELEASE_FAILED rc=$rc; attempting restore of previous code/build" >&2
 if [[ "$SWITCHED" == 1 ]]; then
  git restore -- apps/web/next-env.d.ts || true
  # Restore the Python runtime configuration along with the previously working code.
  if [[ -s "$BACKUP/env.before" ]]; then
   cp -p "$BACKUP/env.before" .env || true
  fi
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
   echo 'P390_ROLLBACK_ATTEMPTED: inspect service status and previous SHA' >&2
  else
   echo "P390_MANUAL_RECOVERY_REQUIRED previous=$CURRENT backup=$BACKUP" >&2
  fi
 fi
 exit "$rc"
}
trap recover ERR INT TERM
# First pin code and activate the rollback guard. Only then modify .env:
# any failed configuration write MUST also restore the original private .env.
git switch --detach "$TARGET"
SWITCHED=1
# The newly prepared isolated Python must also be available to the restarted
# NestJS runtime, not only to the one-off SSH test. Keep all secrets untouched.
if [[ "$RUN_PY" == "$VENV_PY" ]]; then
 P390_NEW_PY="$RUN_PY" node --input-type=module - <<'P390_CONFIG_PY'
import {readFileSync,writeFileSync,chmodSync} from 'node:fs';
const original=readFileSync('.env','utf8'),wanted=process.env.P390_NEW_PY;
if(!wanted?.endsWith('/py-venv/bin/python3'))throw Error('Unsafe interpreter path');
const entries=original.split(/\r?\n/);
const count=entries.filter(x=>/^PYTHON_BIN\s*=/.test(x)).length;
if(count>1)throw Error('Multiple PYTHON_BIN keys in private .env');
const replacement='PYTHON_BIN='+wanted;
const updated=count?entries.map(x=>/^PYTHON_BIN\s*=/.test(x)?replacement:x).join('\n'):
 original.replace(/\s*$/,'')+'\n'+replacement+'\n';
writeFileSync('.env',updated,{mode:0o600});
chmodSync('.env',0o600);
console.log('P390_RUNTIME_PYTHON_CONFIGURED (path and other secrets hidden)');
P390_CONFIG_PY
fi
export PYTHON_BIN="$RUN_PY"
npm install --no-audit --no-fund --no-package-lock
npm run db:generate
npm run test:panchanga
# The interpreter was prechecked BEFORE checkout; use it during regression too.
PYTHON_BIN="$RUN_PY" npm run test:p389:real
PYTHON_BIN="$RUN_PY" npm run test:p390:real
npm run test:vedic-calendar
npm run test:brand:icons
npm run build
git restore -- apps/web/next-env.d.ts
# Deliberately no database schema migrations and no Docker calls.
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
printf 'P390_CODEONLY_PRODUCTION_VERIFIED sha=%s\n' "$(git rev-parse HEAD)"
echo 'NO_DB_MIGRATION_OR_DOCKER_IN_RELEASE. PostgreSQL was not backed up; full wedding Muhurta remains uncertified.'
