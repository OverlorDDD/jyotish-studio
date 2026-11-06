#!/usr/bin/env bash
# Galaxiora — approved spiral #6 icon release (all brand formats).
# Run after safely fast-forwarding AWS checkout to the exact CI-green commit.
# No database migrations or DNS changes. Brand assets generated from approved original spiral #6 PNG.
set -Eeuo pipefail
umask 077
cd /opt/galaxiora/app

EXPECTED_BASE=df08c08280d9747490b33879b9ce82a0aae0b4d1
CURRENT=$(git rev-parse HEAD)
git merge-base --is-ancestor "$EXPECTED_BASE" "$CURRENT" || {
 echo "STOP: checkout is not descended from the verified Google brand fix"
 exit 2
}
test -f tools/brand-icons-build.mjs
test -f apps/web/brand-assets/galaxiora-approved-spiral-6.png
test -f apps/web/public/site.webmanifest
node --env-file=.env -e "
if(process.env.SITE_NOINDEX!=='0'||process.env.NEXT_PUBLIC_SITE_URL!=='https://galaxiora.com'){
 throw Error('STOP: expected public Galaxiora indexing config');
}"

BACKUP="/opt/galaxiora/brand-g-prebuild-$(date +%Y%m%d-%H%M%S)"
mkdir -m 700 "$BACKUP"
if [ -d apps/web/.next ]; then cp -a apps/web/.next "$BACKUP/previous-next"; fi
printf '%s\n' "$CURRENT" > "$BACKUP/release-sha"

echo "=== Install explicit sharp dependency ==="
npm install --no-audit --no-fund

echo "=== Generate all icons from immutable approved spiral #6 PNG ==="
npm run brand:icons:build
npm run test:brand:icons
npm run test:brand-favicon
node --test tools/google-brand-visibility.test.mjs
npm run test:seo
npm run test:r32:seo

echo "=== Build production ==="
npm run build
echo "=== Restart web before checking readiness ==="
sudo systemctl restart galaxiora-web
READY=0
for attempt in $(seq 1 30); do
 if curl --fail --silent --max-time 5 http://127.0.0.1:3000/uk -o /dev/null; then
  READY=1
  break
 fi
 sleep 2
done
if [ "$READY" -ne 1 ]; then
 echo "WEB_STARTUP_FAILED"
 sudo systemctl status galaxiora-web --no-pager -l || true
 sudo journalctl -u galaxiora-web -n 60 --no-pager || true
 exit 1
fi
echo "WEB_STARTED_OK"

npm run site:check
npm run launch:verify
npm run r32:seo:audit

for path in /favicon.ico /icon.png /galaxiora-favicon.png /galaxiora-logo-128.png /apple-touch-icon.png /galaxiora-192.png /galaxiora-512.png /site.webmanifest; do
 curl --fail --silent --show-error --max-time 20 "https://galaxiora.com$path" -o /dev/null
done

echo "DEPLOYED_SHA=$(git rev-parse HEAD)"
echo "GALAXIORA_APPROVED_SPIRAL_6_VERIFIED"
