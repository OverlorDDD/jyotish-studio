#!/usr/bin/env bash
# Galaxiora: single canonical spiral #6 favicon, production-only web release.
# Input: GALAXIORA_DEPLOY_SHA=<merged-commit>. Run with bash -se via SSH.
# No Docker, DB migrations, package upgrades, or environment changes.
set -Eeuo pipefail
umask 077

APP=/opt/galaxiora/app
BASE=89bb6dd8999137a26e39a9aee63d61f34f341c07
TARGET="$GALAXIORA_DEPLOY_SHA"
BACKUPS=/home/ubuntu/galaxiora-backups/brand-spiral6-search
PHASE=preflight

stop(){ echo "BRAND_RELEASE_STOP: $*" >&2; exit 2; }
for bin in git node npm tar curl flock sudo; do
  command -v "$bin" >/dev/null || stop "Missing binary $bin"
done
[[ "$TARGET" =~ ^[0-9a-f]{40}$ ]] || stop "Invalid commit SHA"
exec 9>/tmp/galaxiora-brand-spiral6.lock
flock -n 9 || stop "Concurrent brand deployment"
cd "$APP" || stop "Missing app directory"
[[ -d .git && -s .env && -d apps/web/.next ]] || stop "Production app, env or build missing"
for svc in galaxiora-web galaxiora-api caddy; do
  systemctl is-active --quiet "$svc" || stop "Service not active: $svc"
done
sudo -n true || stop "sudo unavailable"
OLD=$(git rev-parse HEAD)
[[ "$OLD" == "$BASE" ]] || stop "Unexpected deployed SHA: $OLD. Nothing changed."
git diff --cached --quiet || stop "Staged changes exist"
DIRTY=$(git diff --name-only)
if [[ -n "$DIRTY" && "$DIRTY" != "apps/web/next-env.d.ts" ]]; then
  git status --short
  stop "Unreviewed tracked changes on production"
fi
git fetch --no-tags origin refs/heads/main
MAIN=$(git rev-parse FETCH_HEAD)
[[ "$MAIN" == "$TARGET" ]] || stop "main=$MAIN does not match pinned release=$TARGET"
git merge-base --is-ancestor "$OLD" "$TARGET" || stop "Release is not based on production"

echo "=== VERIFY SAFE SOURCE SCOPE ==="
while IFS= read -r path; do
  case "$path" in
    apps/web/app/layout.tsx|\
    tools/brand-favicon.test.mjs|\
    tools/brand-icons.test.mjs|\
    tools/google-brand-visibility.test.mjs|\
    tools/google-favicon-production-audit.mjs|\
    tools/google-favicon-serp6-aws-release.sh|\
    e2e/galaxiora-favicon.spec.mjs|\
    .github/workflows/google-brand-visibility.yml|\
    docs/operations/google-favicon-spiral6-stable-refresh-2026-11-06.md)
      ;;
    *) stop "Unreviewed file changed since AWS: $path" ;;
  esac
done < <(git diff --name-only "$OLD" "$TARGET")
while IFS= read -r -d '' path; do
  if git cat-file -e "$TARGET:$path" 2>/dev/null; then
    stop "Untracked file would be overwritten: $path"
  fi
done < <(git ls-files --others --exclude-standard -z)

available=$(df -Pm "$APP" | awk 'NR==2 {print $4}')
[[ "$available" =~ ^[0-9]+$ ]] && (( available >= 1300 )) || stop "Need 1300MB free disk, got $available"
mkdir -p -m 700 "$BACKUPS"
BACKUP="$BACKUPS/$(date -u +%Y%m%dT%H%M%SZ)-$OLD"
mkdir -m 700 "$BACKUP"
printf '%s\n' "$OLD" > "$BACKUP/old.sha"
printf '%s\n' "$TARGET" > "$BACKUP/target.sha"
[[ -z "$DIRTY" ]] || cp -p apps/web/next-env.d.ts "$BACKUP/next-env.before"
tar -cf "$BACKUP/next-before.tar" -C apps/web .next
[[ -s "$BACKUP/next-before.tar" ]] || stop "Cannot back up existing Next build"
echo "BRAND_PRECHECK_PASS backup=$BACKUP"

rollback(){
  result=$?
  trap - EXIT
  if (( result != 0 )) && [[ "$PHASE" != preflight ]]; then
    echo "BRAND_RELEASE_FAILED: attempting rollback" >&2
    sudo -n systemctl stop galaxiora-web || true
    if [[ "$(git diff --name-only)" == "apps/web/next-env.d.ts" ]]; then
      git restore --worktree -- apps/web/next-env.d.ts || true
    fi
    if git diff --quiet && git diff --cached --quiet; then
      git switch --detach "$OLD" || true
    fi
    if [[ -d apps/web/.next ]]; then
      mv apps/web/.next "$BACKUP/failed-next-$(date +%s)" || true
    fi
    tar -xf "$BACKUP/next-before.tar" -C apps/web || true
    [[ ! -f "$BACKUP/next-env.before" ]] || cp -p "$BACKUP/next-env.before" apps/web/next-env.d.ts || true
    sudo -n systemctl start galaxiora-web || true
    echo "BRAND_ROLLBACK_ATTEMPTED backup=$BACKUP" >&2
  fi
  exit "$result"
}
trap rollback EXIT
PHASE=install
if [[ -n "$DIRTY" ]]; then
  git restore --worktree -- apps/web/next-env.d.ts
fi

echo "=== CHECK OUT APPROVED BRAND RELEASE ==="
git switch --detach "$TARGET"

echo "=== REBUILD EXACT USER-APPROVED SPIRAL #6 ==="
npm run brand:icons:build
node --test tools/brand-icons.test.mjs tools/brand-favicon.test.mjs tools/google-brand-visibility.test.mjs
node --check tools/google-favicon-production-audit.mjs

echo "=== BUILD NEXT WEB WITHOUT DOCKER ==="
sudo -n systemctl stop galaxiora-web
npm run build -w @jyotish/web
sudo -n systemctl start galaxiora-web

ready=0
for attempt in $(seq 1 40); do
  if systemctl is-active --quiet galaxiora-web &&
     curl -fsS --max-time 5 http://127.0.0.1:3000/ >/dev/null; then
    ready=1
    break
  fi
  sleep 2
done
[[ "$ready" == 1 ]] || stop "New Next web did not become ready"

echo "=== AUDIT LIVE BYTES, HEAD TAGS, GOOGLEBOT-IMAGE ==="
node tools/google-favicon-production-audit.mjs http://127.0.0.1:3000
node tools/google-favicon-production-audit.mjs https://galaxiora.com
[[ "$(git rev-parse HEAD)" == "$TARGET" ]] || stop "Wrong production SHA"
for svc in galaxiora-web galaxiora-api caddy; do
  systemctl is-active --quiet "$svc" || stop "Service lost: $svc"
done

PHASE=done
trap - EXIT
echo "BRAND_SPIRAL6_AWS_SOURCE_VERIFIED sha=$TARGET backup=$BACKUP"
echo "GOOGLE_SERP_NOT_VERIFIED Google Search controls the cached search-result icon"
