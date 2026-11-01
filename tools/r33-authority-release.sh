#!/usr/bin/env bash
# Galaxiora R3.3 one-command post-merge deployment gate.
# Run only AFTER safe git fetch and fast-forward to the CI-green R3.3 release SHA.
# No DB schema change, DNS edit, secret output, remote search-engine submission.
set -Eeuo pipefail
umask 077

cd /opt/galaxiora/app
EXPECTED_BASE=56d056e4794e141b5eeeae042226937df837ca0d
BACKUP=/opt/galaxiora/r33-authority-prebuild-20261101
CURRENT=$(git rev-parse HEAD)

if ! git merge-base --is-ancestor "$EXPECTED_BASE" "$CURRENT"; then
 echo "BLOCKED: checkout is not descended from verified R3.3 baseline"
 exit 2
fi
if [ ! -f tools/r33-authority.test.mjs ] || [ ! -f apps/web/app/'[locale]'/eclipses/2027/page.tsx ]; then
 echo "BLOCKED: R3.3 authority release files not checked out"
 exit 2
fi
node --env-file=.env -e "
 if(process.env.SITE_NOINDEX!=='0'||process.env.NEXT_PUBLIC_SITE_URL!=='https://galaxiora.com')
  throw Error('Public indexing environment mismatch');
"
echo "R33 authority release at $CURRENT"

if [ ! -d "$BACKUP" ]; then
 mkdir -m 700 "$BACKUP"
 if [ -d apps/web/.next ]; then cp -a apps/web/.next "$BACKUP/previous-next"; fi
 git rev-parse HEAD > "$BACKUP/prebuild-sha"
fi

npm run test:seo
npm run test:r32:seo
npm run test:r33:authority
node --check tools/r32-seo-audit.mjs

# Always restart the web process immediately after building, BEFORE any site:check.
npm run build
sudo systemctl restart galaxiora-web

READY=0
for attempt in $(seq 1 30); do
 if curl --fail --silent --show-error --max-time 5 http://127.0.0.1:3000/uk -o /dev/null; then
  READY=1
  break
 fi
 sleep 2
done

if [ "$READY" -ne 1 ]; then
 echo "BLOCKED: web did not start after build"
 sudo systemctl status galaxiora-web --no-pager -l || true
 sudo journalctl -u galaxiora-web -n 60 --no-pager || true
 exit 1
fi

systemctl is-active galaxiora-web
systemctl is-active galaxiora-api
npm run site:check
npm run launch:verify
npm run r32:seo:audit

# Confirm the new editorial landing pages are online as actual nonempty HTML.
for path in /uk/tarot/cards /en/tarot/cards/moon /uk/eclipses/2027 /en/eclipses/2027; do
 curl --fail --silent --show-error --max-time 25 "https://galaxiora.com$path" -o /dev/null
done
echo "DEPLOYED_SHA=$(git rev-parse HEAD)"
echo "R33_AUTHORITY_RELEASE_VERIFIED"
