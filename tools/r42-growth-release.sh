#!/usr/bin/env bash
# Galaxiora R4.2.0: privacy-first analytics foundations.
# First release intentionally keeps GA4 switched OFF until owner provisions the stream.
set -Eeuo pipefail
umask 077
cd /opt/galaxiora/app
BASE=40289d83d7cd424705a65bae4a25e4f3120bfc1c
CURRENT=$(git rev-parse HEAD)
git merge-base --is-ancestor "$BASE" "$CURRENT" || {
 echo "STOP: production is not descended from verified cosmic-G baseline"
 exit 2
}
test -f tools/r42-growth.test.mjs
test -f apps/web/app/components/GrowthConsent.tsx
node --env-file=.env -e "
 if(process.env.SITE_NOINDEX!=='0'||process.env.NEXT_PUBLIC_SITE_URL!=='https://galaxiora.com')throw Error('STOP: public site config mismatch');
 if(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID)throw Error('STOP: R4.2 first deployment must leave GA4 disabled until owner finishes consent/provider acceptance');
"
BACKUP="/opt/galaxiora/r42-before-web-$(date +%Y%m%d-%H%M%S)"
mkdir -m 700 "$BACKUP"
if [ -d apps/web/.next ]; then cp -a apps/web/.next "$BACKUP/previous-next"; fi
printf '%s\n' "$CURRENT" > "$BACKUP/release-sha"

npm run test:r42:growth
npm run test:r4:growth
npm run test:seo
npm run test:r32:seo
npm run build
sudo systemctl restart galaxiora-web
READY=0
for attempt in $(seq 1 30); do
 if curl -fsS --max-time 5 http://127.0.0.1:3000/uk -o /dev/null; then READY=1;break;fi
 sleep 2
done
if [ "$READY" != "1" ]; then
 echo "WEB_STARTUP_FAILED"
 sudo systemctl status galaxiora-web -l --no-pager || true
 sudo journalctl -u galaxiora-web -n 80 --no-pager || true
 exit 1
fi
systemctl is-active galaxiora-web
systemctl is-active galaxiora-api
npm run site:check
npm run launch:verify
npm run r32:seo:audit
echo "R42_ANALYTICS_PROVIDER=DISABLED_PENDING_OWNER_SETUP"
echo "DEPLOYED_SHA=$(git rev-parse HEAD)"
echo "R42_FOUNDATION_PRODUCTION_VERIFIED"
