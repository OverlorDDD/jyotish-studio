#!/usr/bin/env bash
# One production release: restore tracked Git source safely, build once, restart
# BOTH API and web, then verify SEO + analytics + admin auth. No DB migrations.
set -Eeuo pipefail
umask 077
cd /opt/galaxiora/app
BASE=f3e27d74eb5bdb14b1938472f1409eeae540b817
CURRENT=$(git rev-parse HEAD)
if ! git merge-base --is-ancestor "$BASE" "$CURRENT"; then
 echo "STOP: production HEAD is not descended from confirmed R4.2 audit release"; exit 2
fi
test -f tools/source-integrity-repair.mjs
test -f apps/api/src/admin-ga4-realtime.ts
node --env-file=.env -e "
 if(process.env.SITE_NOINDEX!=='0'||process.env.NEXT_PUBLIC_SITE_URL!=='https://galaxiora.com')
  throw Error('STOP: search indexing settings are wrong');
 if(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!=='G-SZDVCT8TF4')
  throw Error('STOP: unexpected or missing GA4 public Measurement ID');
"
echo "=== RECONCILE HIDDEN / MISSING TRACKED FILES, SAVE BACKUPS ==="
node tools/source-integrity-repair.mjs --repair
node tools/source-integrity-repair.mjs
test -s apps/web/app/icon.svg
grep -q GrowthConsent apps/web/app/layout.tsx
echo "=== TEST REPAIRED SOURCES / SECURITY ==="
npm run test:source:integrity
npm run test:admin:realtime
npm run test:r42:growth
npm run test:seo
npm run test:r32:seo
echo "=== PRESERVE PREVIOUS WEB BUILD ==="
BACKUP="/opt/galaxiora/deploy-r42-admin-$(date +%Y%m%d-%H%M%S)"
mkdir -p -m 700 "$BACKUP"
echo "$CURRENT" > "$BACKUP/source-sha"
test -d apps/web/.next && cp -a apps/web/.next "$BACKUP/previous-next" || true
echo "BACKUP_DIRECTORY=$BACKUP"
echo "=== BUILD ALL WORKSPACES ==="
npm run build
npm run r42:ga:doctor
echo "=== RESTART BOTH CHANGED SERVICES ==="
sudo systemctl restart galaxiora-api
sudo systemctl restart galaxiora-web
READY=0
for n in $(seq 1 40); do
 if curl -fsS --max-time 4 http://127.0.0.1:3000/uk >/dev/null 2>&1 &&
    curl -fsS --max-time 4 http://127.0.0.1:4000/api/health >/dev/null 2>&1; then
  READY=1;break
 fi
 sleep 2
done
if [ "$READY" -ne 1 ]; then
 echo "BLOCKED: API/web startup failed"
 sudo systemctl status galaxiora-api galaxiora-web --no-pager -l || true
 sudo journalctl -u galaxiora-api -n 50 --no-pager || true
 sudo journalctl -u galaxiora-web -n 50 --no-pager || true
 exit 1
fi
echo "WEB_AND_API_STARTED_OK"
systemctl is-active galaxiora-api galaxiora-web
echo "=== REGRESSION AND SEARCH CHECKS ==="
npm run site:check
npm run launch:verify
npm run r32:seo:audit
npm run r4:search:audit
echo "=== VERIFY ADMIN TRAFFIC ENDPOINT IS PRIVATE ==="
STATUS=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 https://galaxiora.com/api/v1/admin/traffic/realtime)
if [ "$STATUS" != 401 ]; then echo "BLOCKED: guest admin analytics HTTP $STATUS (expected 401)";exit 1;fi
echo "ADMIN_TRAFFIC_GUEST_DENIED_401"
echo "DEPLOYED_SHA=$(git rev-parse HEAD)"
echo "R42_ADMIN_GROWTH_PRODUCTION_VERIFIED"
echo "NOTE: Admin GA4 traffic is NOT configured until GA4_PROPERTY_ID and a protected service-account key are set, and the Data API is enabled. PostgreSQL dashboard counts remain live."
