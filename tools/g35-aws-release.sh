#!/usr/bin/env bash
# Galaxiora G3.5 guarded operator-run AWS release. Deploy G3.4 analytics + G3.5 Google/Apple OIDC together. No Docker. One audited additive DB migration; no external publishing.
set -Eeuo pipefail
umask 077
export SYSTEMD_PAGER=cat PAGER=cat
MODE="${1:-}"
TARGET="${2:-}"
APP=/opt/galaxiora/app
BACKUP_ROOT=/home/ubuntu/galaxiora-backups/g35
APPROVED_BASE=af5583920c0d3556d43eeb58be61d4ae0be8bcb4
ORIGIN=https://galaxiora.com

die(){ printf 'G35_STOP: %s\n' "$*" >&2; exit 2; }
need(){ command -v "$1" >/dev/null || die "Required command missing: $1"; }
[[ "$MODE" == preflight || "$MODE" == deploy || "$MODE" == rollback ]] || die 'Usage: bash g35-aws-release.sh preflight|deploy|rollback TARGET_SHA [backup_directory]'
[[ "$TARGET" =~ ^[0-9a-f]{40}$ ]] || die 'Full pinned 40-character target SHA is required'
for cmd in git node npm tar curl python3 flock pg_dump; do need "$cmd"; done
# One release command at a time across scripts and SSH sessions.
exec 9>/tmp/galaxiora-g35-release.lock
flock -n 9 || die 'Another G3.5 production operation is still active'
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
  (e.AUTH_SECRET||'').length<32)process.exit(2);
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
  'User-Agent':'galaxiora-g34-release-gate','Accept':'application/vnd.github+json'}),timeout=15) as r:
  result=json.load(r)
except Exception as e:
 raise SystemExit('G35_STOP: Could not independently read exact-SHA GitHub checks')
checks={x['name']:x for x in result.get('check_runs',[])}
# This release is strictly scoped by check_changes() to G3.4/G3.5 files.
# An unrelated N4/JHora Windows fixture may remain running while its draft PR is in development.
# Do not block Google OAuth on that independent, unreleased Windows job.
# Never relax the exact-SHA and changed-file allowlist gates.
required=('Chromium accessibility, SEO and user smoke','PostgreSQL authorization and concurrency',
          'test','main-source-of-truth','analytics-contract','social-auth-security')
bad=[name for name in required if name not in checks or checks[name].get('conclusion')!='success']
if bad:raise SystemExit('G35_STOP: Not-green exact main CI checks: '+', '.join(bad))
print('EXACT_SHA_CI_PASS')
PY
}

check_changes(){
 local live="$1" path
 # Only the reviewed PR #125 quiet analytics UX and G3.5 dashboard.
 # This strict allowlist deliberately refuses concurrent Natal N4 code.
 while IFS= read -r path; do
   case "$path" in
     apps/web/app/\[locale\]/privacy/page.tsx|\
     apps/web/app/components/AnalyticsPreferences.tsx|\
     apps/web/app/components/GrowthConsent.tsx|\
     apps/web/app/components/AdminDashboard.tsx|\
     apps/web/app/components/AdminAnalyticsPanel.tsx|\
     apps/web/app/components/AdminAnalyticsPanel.module.css|\
     apps/web/app/components/GlobalAccount.tsx|\
     apps/web/app/globals.css|\
     apps/web/middleware.ts|apps/web/lib/visitor-analytics-policy.ts|\
     apps/api/src/admin.ts|apps/api/src/visitor-analytics.ts|\
     apps/api/src/visitor-aggregate.ts|\
     e2e/g3-public-tool-funnel.spec.mjs|e2e/mobile-header-account.spec.mjs|e2e/r42-consent.spec.mjs|\
     e2e/r42-ga4-diagnostics.spec.mjs|e2e/visitor-analytics.spec.mjs|\
     tools/r42-growth.test.mjs|tools/visitor-analytics.test.mjs|\
     tools/g34-first-party-analytics.test.mjs|tools/admin-realtime-ga4.test.mjs|\
     tools/g34-aws-release.sh|tools/g35-aws-release.sh|tools/g34-release-contract.test.mjs|\
     .github/workflows/g34-first-party-analytics.yml|\
     docs/operations/g34-first-party-analytics-social-login-20261105.md|\
     apps/api/src/social-auth.ts|apps/api/src/account.ts|apps/api/src/main.ts|apps/api/src/nest.ts|\
     apps/api/prisma/schema.prisma|apps/api/prisma/migrations/20261105170000_optional_oidc_identities/migration.sql|\
     apps/api/package.json|tools/g35-social-auth.test.mjs|tools/g35-aws-release.sh|\
     tools/g35-release-contract.test.mjs|.github/workflows/g35-social-auth.yml|\
     docs/operations/g35-google-apple-operator-guide-20261105.md) ;;
     *) die "Unreviewed production diff path: $path";;
   esac
 done < <(git diff --name-only "$live" "$TARGET")
}

check_pending_migrations(){
 # Abort if any other migration is pending or failed. New OAuth table and nullable
 # social-account password are the ONLY approved schema changes for this release.
 node --env-file=.env - <<'NODE'
const fs=require('node:fs');
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient();
(async()=>{
 const dirs=fs.readdirSync('apps/api/prisma/migrations',{withFileTypes:true})
   .filter(x=>x.isDirectory()).map(x=>x.name).sort();
 const rows=await db.$queryRawUnsafe(
   'SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"');
 const completed=new Set(rows.filter(x=>x.finished_at && !x.rolled_back_at).map(x=>x.migration_name));
 const failed=rows.filter(x=>!x.finished_at&&!x.rolled_back_at).map(x=>x.migration_name);
 const pending=dirs.filter(x=>!completed.has(x));
 if(failed.length || pending.some(x=>x!=='20261105170000_optional_oidc_identities'))
   throw new Error('Unapproved, failed or pending migrations; inspect migration state before deploying');
 console.log('G35_DB_MIGRATION_GATE_PASS pending='+pending.length);
})().catch(e=>{console.error('G35_STOP: '+e.message);process.exitCode=2;}).finally(()=>db.$disconnect());
NODE
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
 check_pending_migrations
 echo "G35_PREFLIGHT_PASS live=$live target=$TARGET no_docker=true one_additive_migration=true"
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
 # Migration is additive and left in place on code-only rollback; never restore an old DB over new live writes.
 sudo systemctl restart galaxiora-api
 sudo systemctl restart galaxiora-web
 sudo systemctl is-active --quiet galaxiora-web || die 'Rollback web restart failed'
 curl -fsS --max-time 15 http://127.0.0.1:3000/en -o /dev/null || die 'Rollback web URL failed'
 echo "G35_ROLLBACK_VERIFIED sha=$old backup=$backup"
}

if [[ "$MODE" == rollback ]]; then
 [[ "${G35_ROLLBACK_APPROVAL:-}" == 'I_APPROVE_CODE_ONLY_ROLLBACK' ]] || die 'Set G35_ROLLBACK_APPROVAL for manual rollback'
 [[ $# -eq 3 ]] || die 'Rollback requires backup directory as third argument'
 rollback_to_backup "$3"
 exit 0
fi

[[ "${G35_DEPLOY_APPROVAL:-}" == 'I_APPROVE_G35_PRODUCTION' ]] || die 'Set G35_DEPLOY_APPROVAL to authorize live deployment'
preflight
OLD="$(git rev-parse HEAD)"
if [[ "$OLD" == "$TARGET" ]]; then echo "G35_ALREADY_DEPLOYED sha=$TARGET"; exit 0; fi
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
# Mandatory database backup before schema changes. Credentials are passed only via
# PG* environment variables to the child process, never as command-line args.
BACKUP_FILE="$BACKUP/database-pre-g35.dump"
G35_BACKUP_FILE="$BACKUP_FILE" node --env-file=.env - <<'NODE'
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const target=process.env.G35_BACKUP_FILE;
let parsed;
try{parsed=new URL(process.env.DATABASE_URL||'');}
catch{throw new Error('DATABASE_URL missing or invalid');}
if(!['postgresql:','postgres:'].includes(parsed.protocol))throw new Error('PostgreSQL URL required');
const pgEnv={...process.env,
 PGHOST:parsed.hostname,
 PGPORT:parsed.port||'5432',
 PGUSER:decodeURIComponent(parsed.username),
 PGPASSWORD:decodeURIComponent(parsed.password),
 PGDATABASE:decodeURIComponent(parsed.pathname.slice(1)),
 PGSSLMODE:parsed.searchParams.get('sslmode')||'prefer'};
delete pgEnv.DATABASE_URL;
const fd=fs.openSync(target,'wx',0o600);
try{
 const p=spawnSync('pg_dump',['--format=custom','--no-owner','--no-privileges'],
   {env:pgEnv,stdio:['ignore',fd,'inherit'],timeout:120000});
 if(p.status!==0||fs.fstatSync(fd).size<1024)throw new Error('PostgreSQL backup failed or empty');
}finally{fs.closeSync(fd);}
console.log('G35_DB_BACKUP_PASS');
NODE
echo "G35_BACKUP_COMPLETE dir=$BACKUP"

if [[ "$(git diff --name-only)" == 'apps/web/next-env.d.ts' ]]; then git restore --worktree -- apps/web/next-env.d.ts; fi
SWITCHED=0
on_failure(){
 local code=$?
 trap - EXIT ERR
 if [[ "$code" != 0 && "$SWITCHED" == 1 ]]; then
   echo "G35_DEPLOY_FAILED attempting code-only rollback backup=$BACKUP" >&2
   G35_ROLLBACK_APPROVAL=I_APPROVE_CODE_ONLY_ROLLBACK rollback_to_backup "$BACKUP" ||
     echo "G35_ROLLBACK_NEEDS_OPERATOR backup=$BACKUP" >&2
 fi
 exit "$code"
}
trap on_failure EXIT
SWITCHED=1
git switch --detach "$TARGET"
npm install --no-audit --no-fund
npm run db:generate
# Only the explicitly checked additive G3.5 migration is eligible.
npm run db:migrate
TSX_TSCONFIG_PATH=apps/api/tsconfig.json node --import tsx --test tools/g35-social-auth.test.mjs
node --experimental-strip-types --test tools/g34-first-party-analytics.test.mjs
npm run test:visitor-analytics
npm run test:admin:realtime
npm run test:brand-favicon
npm run build
# Brand #6 byte parity after build, no substitute G favicon.
node - <<'NODE'
const fs=require('node:fs'),assert=require('node:assert/strict');
const root=fs.readFileSync('apps/web/brand-assets/galaxiora-approved-spiral-6.png');
for(const p of ['apps/web/app/icon.png','apps/web/public/galaxiora-favicon.png'])
 assert.deepEqual(fs.readFileSync(p),root,'Approved spiral #6 drift: '+p);
console.log('G35_APPROVED_GALAXY_6_PASS');
NODE
# Public API and opt-in OAuth endpoints changed; restart API and web.
sudo systemctl restart galaxiora-api
API_READY=0
for attempt in $(seq 1 25); do
 if sudo systemctl is-active --quiet galaxiora-api &&
    curl -fsS --max-time 3 -o /dev/null http://127.0.0.1:4000/api/health; then
   API_READY=1
   break
 fi
 sleep 2
done
[[ "$API_READY" == 1 ]] || die 'API failed readiness; automatic rollback requested'
sudo systemctl restart galaxiora-web
# Give Next.js enough time to initialize before judging the new build unhealthy.
READY=0
for attempt in $(seq 1 30); do
 if sudo systemctl is-active --quiet galaxiora-web &&
    curl -fsS --max-time 3 -o /dev/null http://127.0.0.1:3000/en; then
   READY=1
   break
 fi
 sleep 2
done
[[ "$READY" == 1 ]] || die 'New web did not become healthy; automatic rollback requested'
sudo systemctl is-active --quiet galaxiora-api
sudo systemctl is-active --quiet caddy
for path in /en /uk /en/astrology/jyotish /en/panchanga /en/tarot /uk/astrology/jyotish /uk/panchanga /uk/tarot /uk/privacy /en/privacy /robots.txt /sitemap.xml; do
 curl -fsS --retry 4 --retry-delay 2 --max-time 20 -o /dev/null "http://127.0.0.1:3000$path"
done
for path in /en /uk /en/astrology/jyotish /en/panchanga /en/tarot; do
 curl -fsS --retry 3 --retry-delay 2 --max-time 20 -o /dev/null "$ORIGIN$path"
done
node --env-file=.env tools/g32-organic-health.mjs --json > "$BACKUP/postdeploy-seo-health.json"
# The ADMIN report must remain inaccessible to unsigned visitors.
status="$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/api/v1/admin/traffic/visitor-analytics?days=30)"
[[ "$status" == 401 || "$status" == 403 ]] || die "Anonymous admin access check failed: HTTP $status"
echo 'G35_ADMIN_AUTH_GATE_PASS'
curl -fsS --max-time 10 http://127.0.0.1:4000/api/v1/account/oauth/providers | node -e "
const fs=require('fs'),assert=require('assert');
const v=JSON.parse(fs.readFileSync(0,'utf8'));
assert.equal(typeof v.google,'boolean');
assert.equal(typeof v.apple,'boolean');
assert.ok(Array.isArray(v.linked));
console.log('G35_SOCIAL_PROVIDER_STATUS_PASS');
"
[[ "$(git rev-parse HEAD)" == "$TARGET" ]] || die 'Unexpected deployed HEAD after build'
trap - EXIT
SWITCHED=0
echo "G35_PRODUCTION_RELEASE_VERIFIED sha=$TARGET rollback_backup=$BACKUP no_docker=true additive_db_migration=true"
