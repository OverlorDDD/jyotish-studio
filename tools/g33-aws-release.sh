#!/usr/bin/env bash
# Galaxiora G3.2.2 / G3.3 guarded operator-run AWS release. No Docker, DB changes or external publishing.
set -Eeuo pipefail
umask 077
export SYSTEMD_PAGER=cat PAGER=cat
MODE="${1:-}"
TARGET="${2:-}"
APP=/opt/galaxiora/app
BACKUP_ROOT=/home/ubuntu/galaxiora-backups/g322
APPROVED_BASE=16b26b5234ecdd070a5cbfa2b94515341ab55d5e
ORIGIN=https://galaxiora.com

die(){ printf 'G322_STOP: %s\n' "$*" >&2; exit 2; }
need(){ command -v "$1" >/dev/null || die "Required command missing: $1"; }
[[ "$MODE" == preflight || "$MODE" == deploy || "$MODE" == rollback ]] || die 'Usage: bash g33_aws_release.sh preflight|deploy|rollback TARGET_SHA [backup_directory]'
[[ "$TARGET" =~ ^[0-9a-f]{40}$ ]] || die 'Full pinned 40-character target SHA is required'
for cmd in git node npm tar curl python3; do need "$cmd"; done
[[ -d "$APP/.git" ]] || die 'Expected git checkout missing: /opt/galaxiora/app'
cd "$APP"

validate_next_env(){
  [[ -f apps/web/next-env.d.ts ]] || die 'Next.js type declaration missing'
  node - <<'NODE'
const fs=require('node:fs');
const text=fs.readFileSync('apps/web/next-env.d.ts','utf8').replace(/\r\n/g,'\n');
const lines=text.split('\n').map(x=>x.trim()).filter(Boolean);
const allowed=[
  /^\/\/\/ <reference types="next" \/>$/,
  /^\/\/\/ <reference types="next\/image-types\/global" \/>$/,
  /^\/\/\/ <reference types="next\/navigation-types\/compat\/navigation" \/>$/,
  /^\/\/\/ <reference path="\.\/\.next\/types\/routes\.d\.ts" \/>$/,
  /^import ["']\.\/\.next\/types\/routes\.d\.ts["'];?$/,
  /^\/\/.*$/
];
if (text.length>2048||lines[0]!=='/// <reference types="next" />'||
    !lines.includes('/// <reference types="next/image-types/global" />')||
    lines.some(x=>!allowed.some(re=>re.test(x)))) process.exit(2);
NODE
  [[ $? == 0 ]] || die 'next-env.d.ts contains unexpected changes'
}

check_tree(){
 git diff --cached --quiet || die 'Staged tracked server changes found; no reset or stash allowed'
 local dirty
 dirty="$(git diff --name-only)"
 if [[ -n "$dirty" ]]; then
   [[ "$dirty" == 'apps/web/next-env.d.ts' ]] || { git status --short; die 'Unexpected tracked modifications found'; }
   validate_next_env
 fi
 # Detect new target-tracked files that collide with existing ignored OR untracked local files.
 local path
 while IFS= read -r -d '' path; do
   if ! git ls-files --error-unmatch -- "$path" >/dev/null 2>&1 && [[ -e "$path" || -L "$path" ]]; then
     die "Local file collides with new tracked release path: $path"
   fi
 done < <(git ls-tree -r -z --name-only "$TARGET")
}

check_env(){
 [[ -s .env ]] || die 'Production .env missing or empty'
 node --env-file=.env - <<'NODE'
const e=process.env;
if(e.SITE_NOINDEX!=='0'||e.NEXT_PUBLIC_SITE_URL!=='https://galaxiora.com'||
  e.NEXT_PUBLIC_GA4_MEASUREMENT_ID!=='G-SZDVCT8TF4'||!e.DATABASE_URL||
  (e.AUTH_SECRET||'').length<24)process.exit(2);
console.log('INDEXING_GA4_AND_APP_SECRETS_PRESENT (values not printed)');
NODE
}

check_ci(){
 # Read-only exact-SHA GitHub CI check. Never trust green status of an earlier PR SHA.
 TARGET_SHA="$TARGET" python3 - <<'PY'
import json,os,urllib.request
sha=os.environ['TARGET_SHA']
url=f'https://api.github.com/repos/OverlorDDD/jyotish-studio/commits/{sha}/check-runs?per_page=100'
try:
 with urllib.request.urlopen(urllib.request.Request(url,headers={
  'User-Agent':'galaxiora-g322-release-gate','Accept':'application/vnd.github+json'}),timeout=15) as r:
  result=json.load(r)
except Exception as e:
 raise SystemExit('G322_STOP: Could not independently read exact-SHA GitHub checks')
checks={x['name']:x for x in result.get('check_runs',[])}
required=('Chromium accessibility, SEO and user smoke','PostgreSQL authorization and concurrency',
          'test','Windows JHora pinned fixture and CRLF regression','main-source-of-truth')
bad=[name for name in required if name not in checks or checks[name].get('conclusion')!='success']
if bad:raise SystemExit('G322_STOP: Not-green exact main CI checks: '+', '.join(bad))
print('EXACT_SHA_CI_PASS')
PY
}

check_changes(){
 local live="$1" path
 # This release may include only the already-reviewed G3.2.2 UI/CI and G3.3 docs/release gate.
 # Any current main containing unrelated changes must be reviewed through a new release.
 while IFS= read -r path; do
   case "$path" in
     .github/workflows/ci.yml|.github/workflows/g32-organic-engine.yml|\
     apps/web/app/components/OrganicIntentBridge.module.css|\
     apps/web/app/components/OrganicIntentBridge.tsx|\
     docs/seo/g322-search-console-connection-20261105.md|\
     e2e/g32-organic-ux.spec.mjs|\
     tools/g32-credential-guard.test.mjs|tools/g32-date-window.test.mjs|\
     tools/g32-report-summary.mjs|tools/g32-report-summary.test.mjs|\
     tools/g32-search-intelligence.mjs|tools/g32-search-intelligence.test.mjs|\
     tools/g33-aws-release.sh|tools/g33-release-contract.test.mjs|\
     docs/seo/g33-first-real-visitors-20261105.md|\
     docs/seo/g33-first-real-visitors-tracker-20261105.csv) ;;
     *) die "Unreviewed production diff path: $path";;
   esac
 done < <(git diff --name-only "$live" "$TARGET")
}

preflight(){
 local live
 live="$(git rev-parse --verify HEAD)"
 git fetch --no-tags origin refs/heads/main
 [[ "$(git rev-parse --verify 'FETCH_HEAD^{commit}')" == "$TARGET" ]] || die 'Remote main SHA changed; review new main and CI before deployment'
 git merge-base --is-ancestor "$APPROVED_BASE" "$live" || die 'Production is older than reviewed G3.2 baseline; review cumulative changes first'
 git merge-base --is-ancestor "$live" "$TARGET" || die 'Production has divergent work; no force/reset permitted'
 check_tree
 check_changes "$live"
 check_env
 check_ci
 for service in galaxiora-web galaxiora-api caddy; do
   systemctl is-active --quiet "$service" || die "Service not active: $service"
 done
 for uri in http://127.0.0.1:3000/en http://127.0.0.1:4000/api/health "$ORIGIN/en"; do
   curl -fsS --max-time 15 -o /dev/null "$uri" || die "Preflight HTTP unavailable: $uri"
 done
 [[ -d apps/web/.next ]] || die 'Existing Next build missing: cannot prepare instant rollback backup'
 echo "G322_PREFLIGHT_PASS live=$live target=$TARGET no_docker=true no_db_mutation=true"
}

if [[ "$MODE" == preflight ]]; then preflight; exit 0; fi

rollback_to_backup(){
 local backup="$1" old new
 [[ "$backup" == "$BACKUP_ROOT/"* && -d "$backup" ]] || die 'Rollback path must point to a release backup directory'
 [[ -f "$backup/old-sha" && -f "$backup/target-sha" && -s "$backup/next-build.tar" ]] || die 'Incomplete rollback backup'
 old="$(cat "$backup/old-sha")"
 new="$(cat "$backup/target-sha")"
 [[ "$new" == "$TARGET" ]] || die 'Rollback backup target mismatch'
 [[ "$old" =~ ^[0-9a-f]{40}$ ]] || die 'Invalid rollback old SHA'
 echo "ROLLBACK_BEGIN old=$old target=$TARGET"
 # Archive any generated Next file before normalizing it. Never alter other tracked modifications.
 if [[ "$(git diff --name-only)" == 'apps/web/next-env.d.ts' ]]; then
   cp -p apps/web/next-env.d.ts "$backup/next-env.post-failure"
   git restore --worktree -- apps/web/next-env.d.ts
 fi
 git diff --cached --quiet || die 'Rollback blocked by staged edits'
 git diff --quiet || die 'Rollback blocked by unexpected tracked edits'
 git switch --detach "$old" || die 'Rollback git switch failed; investigate local files, do not force'
 if [[ -e apps/web/.next ]]; then
   mv apps/web/.next "$backup/failed-next-build-$(date -u +%s)"
 fi
 tar -xf "$backup/next-build.tar" -C apps/web
 # Do not modify database or API services; no migrations were executed.
 sudo systemctl restart galaxiora-web
 sudo systemctl is-active --quiet galaxiora-web || die 'Rollback web restart failed'
 curl -fsS --max-time 15 http://127.0.0.1:3000/en -o /dev/null || die 'Rollback web URL failed'
 echo "G322_ROLLBACK_VERIFIED sha=$old backup=$backup"
}

if [[ "$MODE" == rollback ]]; then
 [[ "${G322_ROLLBACK_APPROVAL:-}" == 'I_APPROVE_CODE_ONLY_ROLLBACK' ]] || die 'Set G322_ROLLBACK_APPROVAL for manual rollback'
 [[ $# -eq 3 ]] || die 'Rollback requires backup directory as third argument'
 rollback_to_backup "$3"
 exit 0
fi

[[ "${G322_DEPLOY_APPROVAL:-}" == 'I_APPROVE_G322_PRODUCTION' ]] || die 'Set G322_DEPLOY_APPROVAL to authorize live deployment'
preflight
OLD="$(git rev-parse HEAD)"
if [[ "$OLD" == "$TARGET" ]]; then echo "G322_ALREADY_DEPLOYED sha=$TARGET"; exit 0; fi
mkdir -p -m 700 "$BACKUP_ROOT"
BACKUP="$BACKUP_ROOT/$(date -u +%Y%m%dT%H%M%SZ)-$OLD"
mkdir -m 700 "$BACKUP"
printf '%s' "$OLD" > "$BACKUP/old-sha"
printf '%s' "$TARGET" > "$BACKUP/target-sha"
cp -p .env "$BACKUP/env.before"
if [[ -f package-lock.json ]]; then cp -p package-lock.json "$BACKUP/package-lock.json.before"; fi
if [[ "$(git diff --name-only)" == 'apps/web/next-env.d.ts' ]]; then
 cp -p apps/web/next-env.d.ts "$BACKUP/next-env.d.ts.before"
 git diff --binary -- apps/web/next-env.d.ts > "$BACKUP/next-env.patch"
fi
# Untracked inventory and archive; never clean or delete local files.
git ls-files --others --exclude-standard -z > "$BACKUP/untracked-paths.nul"
tar -cf "$BACKUP/untracked.tar" --null -T "$BACKUP/untracked-paths.nul"
tar -cf "$BACKUP/next-build.tar" -C apps/web .next
[[ -s "$BACKUP/next-build.tar" ]] || die 'Rollback Next build archive missing'
[[ -f "$BACKUP/next-build.tar" ]] || die 'Rollback archive missing'
echo "G322_BACKUP_COMPLETE dir=$BACKUP"

if [[ "$(git diff --name-only)" == 'apps/web/next-env.d.ts' ]]; then git restore --worktree -- apps/web/next-env.d.ts; fi
SWITCHED=0
on_failure(){
 local code=$?
 trap - ERR
 if [[ "$SWITCHED" == 1 ]]; then
   echo "G322_DEPLOY_FAILED attempting code-only rollback backup=$BACKUP" >&2
   G322_ROLLBACK_APPROVAL=I_APPROVE_CODE_ONLY_ROLLBACK rollback_to_backup "$BACKUP" ||
     echo "G322_ROLLBACK_NEEDS_OPERATOR backup=$BACKUP" >&2
 fi
 exit "$code"
}
trap on_failure ERR
SWITCHED=1
git switch --detach "$TARGET"
npm install --no-audit --no-fund
npm run db:generate
npm run test:g32:organic
node --experimental-strip-types --test tools/g32-report-summary.test.mjs
npm run test:brand-favicon
npm run build
# Brand #6 byte parity after build, no substitute G favicon.
node - <<'NODE'
const fs=require('node:fs'),assert=require('node:assert/strict');
const root=fs.readFileSync('apps/web/brand-assets/galaxiora-approved-spiral-6.png');
for(const p of ['apps/web/app/icon.png','apps/web/public/galaxiora-favicon.png'])
 assert.deepEqual(fs.readFileSync(p),root,'Approved spiral #6 drift: '+p);
console.log('G322_APPROVED_GALAXY_6_PASS');
NODE
# Do not restart API: this patch does not change the API, DB schema, or .env.
sudo systemctl restart galaxiora-web
sudo systemctl is-active --quiet galaxiora-web
sudo systemctl is-active --quiet galaxiora-api
sudo systemctl is-active --quiet caddy
for path in /en /uk /en/astrology/jyotish /en/panchanga /en/tarot /uk/astrology/jyotish /uk/panchanga /uk/tarot /robots.txt /sitemap.xml; do
 curl -fsS --retry 4 --retry-delay 2 --max-time 20 -o /dev/null "http://127.0.0.1:3000$path"
done
for path in /en /uk /en/astrology/jyotish /en/panchanga /en/tarot; do
 curl -fsS --retry 3 --retry-delay 2 --max-time 20 -o /dev/null "$ORIGIN$path"
done
node --env-file=.env tools/g32-organic-health.mjs --json > "$BACKUP/postdeploy-seo-health.json"
[[ "$(git rev-parse HEAD)" == "$TARGET" ]] || die 'Unexpected deployed HEAD after build'
trap - ERR
SWITCHED=0
echo "G322_PRODUCTION_RELEASE_VERIFIED sha=$TARGET rollback_backup=$BACKUP no_docker=true no_db_mutation=true"
