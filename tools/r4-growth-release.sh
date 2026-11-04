#!/usr/bin/env bash
# R4.1 GitHub-tested public content discovery release.
# Run ONLY after reviewing the PR, checking the production checkout,
# and fast-forwarding AWS git HEAD to the exact green CI commit.
set -Eeuo pipefail
umask 077
cd /opt/galaxiora/app
BASE=40ff2b13c48b7a77625488e95ecbcd44a400c2e7
HEAD=$(git rev-parse HEAD)
if ! git merge-base --is-ancestor "$BASE" "$HEAD"; then
 echo "STOP: AWS head does not descend from verified R3.3 production baseline"
 exit 2
fi
if [ ! -f apps/web/app/components/ShareTools.tsx ] || [ ! -f tools/r4-growth.test.mjs ]; then
 echo "STOP: R4.1 release not checked out"
 exit 2
fi
node --env-file=.env -e "
 if(process.env.SITE_NOINDEX!=='0'||process.env.NEXT_PUBLIC_SITE_URL!=='https://galaxiora.com')
  throw Error('Production SEO indexing config mismatch');
"
BACKUP="/opt/galaxiora/r4-before-web-$(date +%Y%m%d-%H%M%S)"
mkdir -m 700 "$BACKUP"
test -d apps/web/.next && cp -a apps/web/.next "$BACKUP/previous-next"
printf '%s\n' "$HEAD" > "$BACKUP/release-sha"
npm run test:seo
npm run test:r32:seo
npm run test:r33:authority
npm run test:r4:growth
npm run build
sudo systemctl restart galaxiora-web
READY=0
for n in $(seq 1 30); do
 if curl -fsS --max-time 5 http://127.0.0.1:3000/uk -o /dev/null; then
  READY=1
  break
 fi
 sleep 2
done
if [ "$READY" -ne 1 ]; then
 echo "BLOCKED: web service did not become ready"
 sudo systemctl status galaxiora-web -l --no-pager || true
 sudo journalctl -u galaxiora-web -n 60 --no-pager || true
 exit 1
fi
systemctl is-active galaxiora-web
systemctl is-active galaxiora-api
npm run site:check
npm run launch:verify
npm run r32:seo:audit
for path in /uk/panchanga /en/panchanga /uk/eclipses/2027 /en/tarot/cards/moon; do
 curl -fsS --max-time 20 "https://galaxiora.com$path" -o /dev/null
done
echo "DEPLOYED_SHA=$(git rev-parse HEAD)"
echo "R4_1_PRODUCTION_VERIFIED"
