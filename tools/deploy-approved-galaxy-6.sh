#!/usr/bin/env bash
# Restore ONLY the owner-approved spiral #6 branding on currently working R4.2.
# No changes to database, service-account credentials or Google Analytics APIs.
set -Eeuo pipefail
umask 077
cd /opt/galaxiora/app
BASE=058c2451835b27a766cc0bf1404b90101b0bbe9d
git merge-base --is-ancestor "$BASE" HEAD || {
 echo "STOP: unexpected production baseline; do not overwrite the site";exit 2;
}
node --env-file=.env -e "
 if(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!=='G-SZDVCT8TF4'||process.env.SITE_NOINDEX!=='0')
  throw Error('STOP: existing GA4 or public indexing configuration differs');
"
test -f apps/web/brand-assets/galaxiora-approved-spiral-6.png
test ! -e apps/web/app/icon.svg || {
 echo 'BLOCKED: old icon.svg still exists. Preserve and inspect it before building.'
 exit 2
}
echo '=== Verify no files have been silently replaced ==='
node tools/source-integrity-repair.mjs --repair
node tools/source-integrity-repair.mjs
echo '=== Test the approved image and all formats ==='
npm run brand:icons:build
npm run test:brand-favicon
npm run test:brand:icons
node --test tools/google-brand-visibility.test.mjs
npm run test:r42:growth
echo '=== Create web build backup before install ==='
BACKUP="/opt/galaxiora/brand-six-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p -m 700 "$BACKUP"
if [ -d apps/web/.next ]; then cp -a apps/web/.next "$BACKUP/previous-next"; fi
echo "BACKUP_DIRECTORY=$BACKUP"
echo '=== Rebuild web only, preserve live NestJS and PostgreSQL ==='
npm run build -w @jyotish/web
sudo systemctl restart galaxiora-web
READY=0
for i in $(seq 1 40);do
 if curl -fsS --max-time 4 http://127.0.0.1:3000/uk >/dev/null 2>&1;then READY=1;break;fi
 sleep 2
done
if [ "$READY" -ne 1 ];then
 echo 'WEB_STARTUP_FAILED';sudo journalctl -u galaxiora-web -n 60 --no-pager;exit 1
fi
echo 'WEB_STARTED_OK'
npm run r42:ga:doctor
npm run site:check
npm run launch:verify
npm run r32:seo:audit
echo '=== Check live approved original icon, not the G fallback ==='
curl -fsS --max-time 15 https://galaxiora.com/icon.png -o "$BACKUP/live-icon.png"
curl -fsS --max-time 15 https://galaxiora.com/galaxiora-favicon.png -o "$BACKUP/live-favicon.png"
node -e '
 const fs=require("fs"),assert=require("assert");
 const base="apps/web/brand-assets/galaxiora-approved-spiral-6.png";
 const files=[process.argv[1],process.argv[2]];
 for(const f of files)assert.deepStrictEqual(fs.readFileSync(f),fs.readFileSync(base),"Deployed site is NOT showing approved spiral #6: "+f);
 console.log("APPROVED_GALAXY_6_LIVE_BYTES_VERIFIED");
' "$BACKUP/live-icon.png" "$BACKUP/live-favicon.png"
HTTP=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 https://galaxiora.com/icon.svg)
if [ "$HTTP" != 404 ];then echo "BLOCKED: old G /icon.svg still responds HTTP $HTTP";exit 1;fi
systemctl is-active galaxiora-web galaxiora-api
echo "DEPLOYED_SHA=$(git rev-parse HEAD)"
echo "APPROVED_SPIRAL_6_PRODUCTION_VERIFIED"
