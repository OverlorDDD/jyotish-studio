#!/usr/bin/env bash
# Galaxiora privacy-safe Visitor Analytics: guarded, one-command AWS rollout.
# Never overwrite dirty production or unknown/unrelated worktree.
set -Eeuo pipefail
readonly APP=/opt/galaxiora/app
readonly BRANCH=fix/ga4-reliable-anonymous-visitor-analytics-20261103
readonly TESTED_ANCESTOR=67f1a90330087c28d6438064ad075ac710c99cd6
[[ -d "$APP/.git" ]] || { echo 'STOP: production git worktree not found'; exit 2; }
cd "$APP"
[[ -z "$(git status --porcelain --untracked-files=normal)" ]] || { echo 'STOP: dirty production worktree; back up and review changes first'; git status --short; exit 2; }
command -v node >/dev/null && command -v npm >/dev/null && command -v pg_dump >/dev/null || {
 echo 'STOP: node, npm and pg_dump are required for guarded deployment'; exit 2; }
[[ -f .env ]] || { echo 'STOP: .env missing'; exit 2; }
node --env-file=.env -e '
 const id=process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
 const pid=process.env.GA4_PROPERTY_ID;
 const auth=process.env.AUTH_SECRET;
 if(id!=="G-SZDVCT8TF4"||!/^\d{4,20}$/.test(pid||"")||!auth||auth.length<24||!process.env.DATABASE_URL){
  console.error("STOP: invalid GA4 ID, numeric property ID, AUTH_SECRET, or DATABASE_URL");process.exit(2);
 }
 if(process.env.SITE_NOINDEX==="1"){console.error("STOP: SITE_NOINDEX=1; production indexing at risk");process.exit(2)}
 console.log("Preflight: GA4 public ID, numeric property ID, database and internal auth configured");
'
OLD_SHA="$(git rev-parse HEAD)"
echo "Current production SHA: $OLD_SHA"
git fetch --no-tags origin "$BRANCH"
TARGET_SHA="$(git rev-parse FETCH_HEAD)"
git merge-base --is-ancestor "$TESTED_ANCESTOR" "$TARGET_SHA" || {
 echo 'STOP: target lacks validated analytics implementation'; exit 2; }
git merge-base --is-ancestor "$OLD_SHA" "$TARGET_SHA" || {
 echo 'STOP: current production has commits absent from analytics branch; requires deliberate merge/review'; exit 2; }
if [[ "$OLD_SHA" == "$TARGET_SHA" ]];then echo 'Already at target commit'; exit 0; fi
# PostgreSQL custom format backup; connection credentials are supplied via
# subprocess environment, never command-line flags or printed URLs.
BACKUP_ROOT=/home/ubuntu/galaxiora-backups
mkdir -p -m 700 "$BACKUP_ROOT"
BACKUP="$BACKUP_ROOT/visitor-analytics-$(date -u +%Y%m%dT%H%M%SZ)-$OLD_SHA.dump"
umask 077
node --env-file=.env - "$BACKUP" <<'NODE'
import {spawnSync} from 'node:child_process';
const url=new URL(process.env.DATABASE_URL);
if(!['postgresql:','postgres:'].includes(url.protocol))throw Error('STOP: unsupported DATABASE_URL protocol');
const env={...process.env,
 PGHOST:url.hostname,PGPORT:url.port||'5432',
 PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),
 PGDATABASE:decodeURIComponent(url.pathname.slice(1))
};
const result=spawnSync('pg_dump',['--format=custom','--no-owner','--no-acl','--file',process.argv[2]],
 {env,stdio:'inherit'});
if(result.status!==0)throw Error('STOP: PostgreSQL backup failed: '+result.status);
NODE
[[ -s "$BACKUP" ]] || { echo 'STOP: empty DB backup'; exit 2; }
echo "PostgreSQL backup written: $BACKUP"
ROLLED=0
on_error(){
 local rc=$?
 trap - ERR
 if [[ "$ROLLED" == 1 ]];then
  echo "RELEASE FAILED: restoring previous code $OLD_SHA (additive DB migration is left intact)"
  git switch --detach "$OLD_SHA" || true
  npm ci --no-audit --no-fund || true
  npm run db:generate || true
  npm run build || true
  sudo systemctl restart galaxiora-api galaxiora-web || true
 fi
 exit "$rc"
}
trap on_error ERR
ROLLED=1
git switch --detach "$TARGET_SHA"
npm ci --no-audit --no-fund
npm run db:generate
npm run build
node --env-file-if-exists=.env tools/r42-ga4-doctor.mjs
npm run db:migrate
sudo systemctl restart galaxiora-api galaxiora-web
sleep 3
sudo systemctl is-active --quiet galaxiora-api
sudo systemctl is-active --quiet galaxiora-web
sudo systemctl is-active --quiet caddy
curl -fsS --max-time 20 http://127.0.0.1:4000/api/health >/dev/null
curl -fsS --max-time 20 http://127.0.0.1:3000/uk >/dev/null
curl -fsS --max-time 20 https://galaxiora.com/en >/dev/null
ROLLED=0
trap - ERR
echo "AWS_CODE_DEPLOY_OK sha=$TARGET_SHA backup=$BACKUP"
echo "GA4_ACCEPTANCE_PENDING: open https://galaxiora.com/en?ga4_debug=1, approve consent, verify real G-SZDVCT8TF4 in DebugView/Realtime."
