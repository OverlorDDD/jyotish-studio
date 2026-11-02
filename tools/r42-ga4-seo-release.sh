#!/usr/bin/env bash
# Galaxiora: GA4 delivery diagnostics and new public-root SEO audit.
# Run only AFTER safe fast-forward from user-confirmed R4.2 commit and CI success.
set -Eeuo pipefail
umask 077
cd /opt/galaxiora/app
BASE=e58b0493fadbf6eaad97244c6ea63a281e676f17
HEAD=$(git rev-parse HEAD)
if ! git merge-base --is-ancestor "$BASE" "$HEAD"; then
 echo "STOP: release is not based on verified R4.2 commit"
 exit 2
fi
node --env-file=.env -e "
 if(process.env.SITE_NOINDEX!=='0'||process.env.NEXT_PUBLIC_SITE_URL!=='https://galaxiora.com')throw Error('STOP: incorrect public indexing settings');
 if(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!=='G-SZDVCT8TF4')throw Error('STOP: expected R4.2 owner-provided GA4 Measurement ID in .env');
"
echo "=== PREBUILD VALIDATION ==="
npm run test:r42:growth
npm run test:seo
npm run test:r32:seo
node --check tools/r4-search-discovery-audit.mjs
node --check tools/r42-ga4-doctor.mjs
BACKUP="/opt/galaxiora/r42-deep-audit-$(date +%Y%m%d-%H%M%S)"
mkdir -m 700 "$BACKUP"
if [ -d apps/web/.next ]; then cp -a apps/web/.next "$BACKUP/previous-next"; fi
echo "$HEAD" > "$BACKUP/release-sha"
echo "=== BUILD / VERIFY GA4 BUNDLE ==="
npm run build
npm run r42:ga:doctor
echo "=== RESTART / WAIT BEFORE SITE CHECKS ==="
sudo systemctl restart galaxiora-web
READY=0
for n in $(seq 1 40); do
 if curl -fsS --max-time 5 http://127.0.0.1:3000/uk -o /dev/null; then READY=1;break;fi
 sleep 2
done
if [ "$READY" -ne 1 ];then
 echo "WEB_STARTUP_FAILED"
 sudo systemctl status galaxiora-web --no-pager -l || true
 sudo journalctl -u galaxiora-web -n 80 --no-pager || true
 exit 1
fi
echo "WEB_STARTED_OK"
systemctl is-active galaxiora-web galaxiora-api
npm run site:check
npm run launch:verify
npm run r32:seo:audit
npm run r4:search:audit
echo "DEPLOYED_SHA=$(git rev-parse HEAD)"
echo "R42_GA4_DISCOVERY_AUDIT_DEPLOYED"
echo "IMPORTANT: GA4 tag loading does NOT establish delivery. Check DevTools or Google Tag Assistant after explicit opt-in."
