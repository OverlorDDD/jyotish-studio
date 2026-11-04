#!/usr/bin/env bash
# Galaxiora GA4 + anonymous visitor analytics — guarded AWS deployment.
# Untracked local artifacts are ARCHIVED AND RETAINED, never deleted or stashed.
set -Eeuo pipefail
umask 077

readonly APP=/opt/galaxiora/app
readonly BRANCH=fix/ga4-production-d2c777-20261103
readonly TESTED_PRODUCTION_BASE=d2c77781781e65ee0b8af04e05bce62e9d61baea
readonly BACKUP_ROOT=/home/ubuntu/galaxiora-backups

die(){ echo "STOP: $*" >&2; exit 2; }
command -v git >/dev/null && command -v node >/dev/null &&
 command -v npm >/dev/null && command -v tar >/dev/null || die "git, node, npm and tar required"
[[ -d "$APP/.git" ]] || die "Expected production git checkout is missing: $APP"
cd "$APP"
[[ -f .env ]] || die "Private .env file missing"

# A Next.js production build may rewrite its tracked auto-generated
# apps/web/next-env.d.ts, adding the local .next/types/routes.d.ts import.
# Any OTHER tracked change, or ANY staged change, remains a hard stop.
git diff --cached --quiet || { git status --short; die "Staged production changes require review"; }
DIRTY_NEXT_ENV=0
while IFS= read -r -d '' changed; do
 if [[ "$changed" == "apps/web/next-env.d.ts" ]]; then
  DIRTY_NEXT_ENV=1
 else
  git status --short
  die "Unexpected tracked production change: $changed"
 fi
done < <(git diff --name-only -z)
if [[ "$DIRTY_NEXT_ENV" == 1 ]]; then
 node - <<'NODE'
const fs=require('node:fs');
const source=fs.readFileSync('apps/web/next-env.d.ts','utf8').replace(/\r\n/g,'\n');
const lines=source.split('\n').map(s=>s.trim()).filter(Boolean);
const allowed=[
 /^\/\/\/ <reference types="next" \/>$/,
 /^\/\/\/ <reference types="next\/image-types\/global" \/>$/,
 /^\/\/\/ <reference types="next\/navigation-types\/compat\/navigation" \/>$/,
 /^\/\/\/ <reference path="\.\/\.next\/types\/routes\.d\.ts" \/>$/,
 /^import ["']\.\/\.next\/types\/routes\.d\.ts["'];?$/,
 /^\/\/(?:[^\r\n]*)$/
];
if(source.length>2048||
 lines[0]!=='/// <reference types="next" />'||
 !lines.includes('/// <reference types="next/image-types/global" />')||
 lines.some(line=>!allowed.some(pattern=>pattern.test(line)))){
 console.error('STOP: next-env.d.ts contains unexpected edits, not just Next.js generated type references');
 process.exit(2);
}
console.log('Validated tracked Next.js-generated next-env.d.ts drift (will archive before checkout).');
NODE
fi
node --env-file=.env -e '
 const id=process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
 if(id!=="G-SZDVCT8TF4")throw Error("STOP: production build needs G-SZDVCT8TF4 in .env");
 if(!process.env.DATABASE_URL)throw Error("STOP: DATABASE_URL missing");
 if((process.env.AUTH_SECRET||"").length<24)throw Error("STOP: shared AUTH_SECRET too short");
 if(process.env.SITE_NOINDEX==="1")throw Error("STOP: SITE_NOINDEX=1 would disable search indexing");
 if(!/^\d{4,20}$/.test(process.env.GA4_PROPERTY_ID||""))
  console.log("WARNING: numeric GA4_PROPERTY_ID absent; server aggregates work but GA4 Data API sessions may be unavailable");
 console.log("Production GA4 public ID, database and internal server secret: OK");
'

OLD_SHA="$(git rev-parse HEAD)"
echo "Production commit before rollout: $OLD_SHA"
git fetch --no-tags origin "$BRANCH"
TARGET_SHA="$(git rev-parse FETCH_HEAD)"
git merge-base --is-ancestor "$TESTED_PRODUCTION_BASE" "$TARGET_SHA" ||
 die "Target is not based on verified production d2c7778"

git merge-base --is-ancestor "$OLD_SHA" "$TARGET_SHA" ||
 die "Current production has commits not contained in the tested release. No reset or force operation was attempted."
echo "Verified: release is a descendant of currently deployed production."
# Git switch preserves non-conflicting untracked files. Check ALL paths,
# including names with spaces, and never use git clean/reset --hard/stash.
while IFS= read -r -d '' file; do
 if git cat-file -e "$TARGET_SHA:$file" 2>/dev/null; then
   die "Untracked file conflicts with target version: $file"
 fi
done < <(git ls-files --others --exclude-standard -z)

[[ "$OLD_SHA" != "$TARGET_SHA" ]] || {
 echo "ALREADY_DEPLOYED $TARGET_SHA (run live GA4 DebugView verification)"; exit 0;
}
mkdir -p -m 700 "$BACKUP_ROOT"
RUN_DIR="$BACKUP_ROOT/ga4-visitor-$(date -u +%Y%m%dT%H%M%SZ)-$OLD_SHA"
mkdir -p -m 700 "$RUN_DIR"
# GNU tar reads NUL-separated names, preserving odd filenames byte-for-byte.
git ls-files --others --exclude-standard -z |
 tar -cf "$RUN_DIR/untracked-files.tar" --null --verbatim-files-from -T -
echo "Untracked production files preserved and archived: $RUN_DIR/untracked-files.tar"
echo "Untracked files remain in the working tree. Nothing has been deleted."
if [[ "$DIRTY_NEXT_ENV" == 1 ]]; then
 # Preserve exact modified bytes before normalizing this generated file.
 cp -p -- apps/web/next-env.d.ts "$RUN_DIR/next-env.d.ts.generated-before-deploy"
 git restore --source=HEAD --worktree -- apps/web/next-env.d.ts
 echo "Next.js generated next-env.d.ts archived and normalized (source preserved)."
fi
git diff --quiet || die "Tracked worktree still modified; refusing checkout"

DB_BACKUP="$RUN_DIR/database.dump"
if command -v pg_dump >/dev/null && command -v pg_restore >/dev/null; then
  echo "Backing up PostgreSQL using installed client..."
  node --env-file=.env tools/com-db-backup.mjs --output "$DB_BACKUP"
else
  # On AWS the PostgreSQL 16 client is already inside jyotish-db.
  # Verify DATABASE_URL really points at that local container first.
  node --env-file=.env -e '
   const url=new URL(process.env.DATABASE_URL);
   if(!["localhost","127.0.0.1"].includes(url.hostname)||
     url.port!=="5433"||decodeURIComponent(url.pathname)!=="/jyotish"||
     decodeURIComponent(url.username)!=="jyotish")
     throw Error("STOP: Docker backup not permitted for an unrecognized database");
  '
  if docker info >/dev/null 2>&1; then
    DOCKER=(docker)
  elif sudo -n docker info >/dev/null 2>&1; then
    DOCKER=(sudo -n docker)
  else
    die "Neither local PostgreSQL client nor access to PostgreSQL Docker container is available"
  fi
  [[ "$("${DOCKER[@]}" inspect -f '{{.State.Running}}' jyotish-db 2>/dev/null)" == "true" ]] ||
    die "Production jyotish-db container is not running"
  echo "Backing up Docker PostgreSQL 16 (no database credentials in command)..."
  "${DOCKER[@]}" exec jyotish-db pg_dump -U jyotish -d jyotish -Fc > "$DB_BACKUP"
  "${DOCKER[@]}" exec -i jyotish-db pg_restore --list < "$DB_BACKUP" >/dev/null
fi
[[ -s "$DB_BACKUP" ]] || die "PostgreSQL backup is empty"
echo "Verified DB backup: $DB_BACKUP"

SWITCHED=0
rollback(){
 local rc=$?
 trap - ERR
 if [[ "$SWITCHED" == 1 ]]; then
  echo "Deployment failed: restoring old code $OLD_SHA. Saved backups: $RUN_DIR"
  # Some brand images were tracked on old main, but ignored/generated in
  # the new branch. Archive those new artifacts before switching back, so
  # git never overwrites an untracked file during rollback.
  for file in apps/web/app/icon.png apps/web/public/galaxiora-favicon.png \
    apps/web/brand-assets/galaxiora-circle-64.png \
    apps/web/public/galaxiora-galaxy-approved-64.png; do
    if git cat-file -e "$OLD_SHA:$file" 2>/dev/null &&
      ! git ls-files --error-unmatch "$file" >/dev/null 2>&1 &&
      [[ -e "$file" ]]; then
      mkdir -p "$RUN_DIR/rollback-generated/$(dirname "$file")"
      mv -- "$file" "$RUN_DIR/rollback-generated/$file"
    fi
  done
  git switch --detach "$OLD_SHA" || true
  npm install --no-audit --no-fund || true
  npm run db:generate || true
  npm run build || true
  sudo systemctl restart galaxiora-api galaxiora-web || true
  echo "Additive VisitorAggregate table is deliberately not dropped."
 fi
 exit "$rc"
}
trap rollback ERR

SWITCHED=1
git switch --detach "$TARGET_SHA"
# The previous production lockfile is untracked and may not match this
# branch; npm install reconciles it safely (its old bytes are in the archive).
npm install --no-audit --no-fund
npm run db:generate
npm run test:visitor-analytics
npm run test:admin:realtime
npm run test:brand-favicon
npm run build
node --env-file-if-exists=.env tools/r42-ga4-doctor.mjs
npm run db:migrate
sudo systemctl restart galaxiora-api galaxiora-web
for attempt in $(seq 1 25); do
 if curl -fsS --max-time 4 http://127.0.0.1:4000/api/health >/dev/null 2>&1 &&
    curl -fsS --max-time 4 http://127.0.0.1:3000/uk >/dev/null 2>&1; then
   break
 fi
 sleep 2
done
sudo systemctl is-active --quiet galaxiora-api
sudo systemctl is-active --quiet galaxiora-web
sudo systemctl is-active --quiet caddy
curl -fsS --max-time 12 http://127.0.0.1:4000/api/health >/dev/null
curl -fsS --max-time 12 http://127.0.0.1:3000/uk >/dev/null
curl -fsS --max-time 20 https://galaxiora.com/en >/dev/null

# Critical: never silently swap the approved spiral #6 for an older G.
node - <<'NODE'
const fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('apps/web/brand-assets/galaxiora-approved-spiral-6.png');
for(const path of ['apps/web/app/icon.png','apps/web/public/galaxiora-favicon.png'])
  assert.deepEqual(fs.readFileSync(path),source,'Approved galaxy #6 was not retained: '+path);
console.log('APPROVED_GALAXY_6_BUILD_VERIFIED');
NODE
SWITCHED=0
trap - ERR
echo "AWS_CODE_DEPLOY_OK sha=$TARGET_SHA backup=$RUN_DIR"
echo "GA4_ACCEPTANCE_PENDING: open https://galaxiora.com/en?ga4_debug=1, choose Allow analytics, check G-SZDVCT8TF4 in DebugView/Realtime."
