#!/usr/bin/env bash
# N4.9.1 pinned-SHA EC2 release. Run ONLY after exact-head CI is green.
# Called remotely by Windows PowerShell over SSH, never by Actions.
# Does not use Docker, mutate schemas, wipe tracked files or reset --hard.
set -Eeuo pipefail
umask 077

MODE="${1:-}"
TARGET="${2:-}"
APP=/opt/galaxiora/app
BRANCH=fix/n491-concise-varga-reader-d60-20261109
OLD=''
CHANGED=0

fail(){ printf 'N491_STOP: %s\n' "$*" >&2; exit 2; }
if [[ "$MODE" != '--deploy' && "$MODE" != '--preflight' ]]; then
  fail 'Usage: bash tools/n491-aws-release.sh --deploy|--preflight <full-40-hex-SHA>'
fi
[[ "$TARGET" =~ ^[0-9a-f]{40}$ ]] || fail 'Exact 40-digit lowercase Git SHA required'
[[ -d "$APP/.git" ]] || fail "Repository not found at $APP"
cd "$APP"
OLD="$(git rev-parse HEAD)"
test -n "$OLD"
command -v npm >/dev/null || fail 'npm missing'
command -v node >/dev/null || fail 'node missing'
command -v curl >/dev/null || fail 'curl missing'
sudo -n systemctl is-active --quiet galaxiora-web || fail 'web service not healthy before release'
sudo -n systemctl is-active --quiet galaxiora-api || fail 'api service not healthy before release'
# Avoid overwriting uncommitted edits. next-env.d.ts is an observed generated
# Next artifact and may be restored only when its state is exactly " M".
dirty="$(git status --porcelain --untracked-files=no | grep -v -E '^ M apps/web/next-env\.d\.ts$' || true)"
[[ -z "$dirty" ]] || { printf '%s\n' "$dirty"; fail 'Dirty tracked production files; refusing destructive checkout'; }
echo '=== N491 STAGE 1: verify immutable GitHub commit ==='
git -c gc.auto=0 -c maintenance.auto=false fetch --no-auto-gc origin \
  "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
remote="$(git rev-parse "refs/remotes/origin/$BRANCH")"
[[ "$remote" == "$TARGET" ]] || fail "Branch moved; target=$TARGET remote=$remote"
git cat-file -e "$TARGET^{commit}" || fail 'Commit object missing'
if [[ "$OLD" != "$TARGET" ]]; then
  git merge-base --is-ancestor "$OLD" "$TARGET" || fail 'Production HEAD is not ancestor; stop and reconcile manually'
fi
echo "OLD=$OLD"
echo "NEW=$TARGET"
echo '=== N491 STAGE 2: capacity & preflight ==='
df -h "$APP"
node --version
npm --version
# Always assert source files for the exact proposed release exist before switch.
git cat-file -e "$TARGET:tools/n49-release-expert-qa.test.mjs"
git cat-file -e "$TARGET:e2e/n49-real-reader.spec.mjs"
git cat-file -e "$TARGET:apps/api/src/reader-compact-n491.ts"
git cat-file -e "$TARGET:tools/n491-concise-varga-reader.test.mjs"
if [[ "$MODE" == '--preflight' ]]; then
  echo 'N491_AWS_PREFLIGHT_PASS (no checkout, no restart)'
  exit 0
fi
if [[ "$OLD" == "$TARGET" ]]; then
  echo 'N491_ALREADY_AT_TARGET: rebuilding and running smoke checks'
fi

backupBase="$HOME/.galaxiora-release-backups"
mkdir -p -m 700 "$backupBase"
backup="$(mktemp -d "$backupBase/n491-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")"
chmod 700 "$backup"
printf '%s\n' "$OLD" > "$backup/previous-commit.txt"
printf '%s\n' "$TARGET" > "$backup/target-commit.txt"
if [[ -f .env ]]; then cp -p .env "$backup/production.env"; chmod 600 "$backup/production.env"; fi
printf 'Release rollback evidence stored privately in %s\n' "$backup"
rollback(){
  local rc=$?
  trap - EXIT
  if [[ "$rc" != 0 && "$CHANGED" == 1 ]]; then
    echo '=== N491 RELEASE FAILED: attempting repository/build/service rollback ===' >&2
    set +e
    if git -c advice.detachedHead=false switch --detach "$OLD" &&
      npm install --no-audit --no-fund --no-package-lock &&
      npm run db:generate &&
      npm run build &&
      sudo -n systemctl restart galaxiora-api galaxiora-web &&
      sudo -n systemctl is-active --quiet galaxiora-api &&
      sudo -n systemctl is-active --quiet galaxiora-web; then
      echo 'N491_ROLLBACK_REBUILD_SUCCESS — verify externally' >&2
    else
      echo 'N491_ROLLBACK_UNCONFIRMED — inspect services urgently' >&2
    fi
  fi
  if [[ "$rc" != 0 ]]; then echo "N491_RELEASE_FAILED_EXIT=$rc" >&2; fi
  exit "$rc"
}
trap rollback EXIT
echo '=== N491 STAGE 3: checkout exact audited SHA ==='
if [[ -n "$(git status --porcelain -- apps/web/next-env.d.ts)" ]]; then
  # Only the known, GENERATED file is restored; all other changes already stop.
  git restore --worktree -- apps/web/next-env.d.ts
fi
CHANGED=1
git -c advice.detachedHead=false switch --detach "$TARGET"
echo '=== N491 STAGE 4: install, schema client, deterministic critical QA ==='
npm install --no-audit --no-fund --no-package-lock
npm run db:generate
node --experimental-strip-types --test \
  tools/n49-unified-synthesis.test.mjs \
  tools/n49-release-expert-qa.test.mjs \
  tools/n491-concise-varga-reader.test.mjs \
  tools/n44-classical-reader.test.mjs
echo '=== N491 STAGE 5: compile Next + Nest + core ==='
npm run build
echo '=== N491 STAGE 6: restart services, check existing site ==='
sudo -n systemctl restart galaxiora-api galaxiora-web
sleep 7
sudo -n systemctl is-active --quiet galaxiora-api
sudo -n systemctl is-active --quiet galaxiora-web
npm run site:check
npm run launch:verify
for locale in uk en; do
  curl -fsSL --max-time 30 -o /dev/null "https://galaxiora.com/$locale/astrology/jyotish"
done
echo '=== N491 STAGE 7: ensure public API really serves new Reader ==='
curl -fsSL --max-time 30 https://galaxiora.com/api/v1/jyotish/runtime |
 node -e '
 let s="";
 process.stdin.on("data",d=>s+=d);
 process.stdin.on("end",()=>{
  const j=JSON.parse(s);
  for(const [key,expected] of [
    ["readerEdition","reader-v8.0.0-n44"],
    ["editorialEdition","n48-poetic-evidence-1.0.0"],
    ["interpretationEdition","n491-unified-evidence-v1"],
    ["verificationContract","jyotish-integrity-v3"],
    ["presentationEdition","n491-compact-cross-varga-v1"]
  ]){if(j[key]!==expected)throw Error("N491_RUNTIME_MISMATCH:"+key);}
  console.log("N491_PUBLIC_API_READER_EDITION_VERIFIED");
 });'
# A real public /reports request is stronger than a runtime version string:
# use invented QA birth inputs only; no personal customer chart is read or saved.
for lang in uk en; do
  body="$(printf '{"date":"2000-01-01","time":"12:00","timeZone":"Etc/UTC","latitude":50.45,"longitude":30.52,"lang":"%s","preferred":"local","asOf":"2026-11-09"}' "$lang")"
  curl -fsSL --retry 1 --max-time 60 \
    -H 'Content-Type: application/json' --data-binary "$body" \
    https://galaxiora.com/api/v1/reports |
   node -e '
    let s="";
    process.stdin.on("data",c=>s+=c);
    process.stdin.on("end",()=>{
      const a=JSON.parse(s),reader=a.readerV8, n=reader?.integrated;
      if(a.verification?.status!=="verified_internal"||a.readerV8?.status!=="available"||
       n?.version!=="n491-unified-evidence-v1"||n?.links?.length!==15||
       n?.threads?.length!==5||reader?.compactCards?.length!==15||reader?.d60Preview?.allPlanets?.length!==9||
       !reader?.compactCards?.every(card=>card.proof?.some(f=>f.startsWith("D"+card.division+"."))&&
         card.proof?.some(f=>f.startsWith("D"+card.relatedDivision+".")))||
       a.ai?.fallbackReason!=="reader_only")
         throw Error("N491_PUBLIC_REPORT_INTEGRITY_FAILURE");
      console.log("N491_PUBLIC_REPORT_BINDING_VERIFIED");
    });'
done
[[ "$(git rev-parse HEAD)" == "$TARGET" ]] || fail 'Deployed SHA mismatch'
CHANGED=0
trap - EXIT
echo ''
echo '===================================='
echo 'N491_PRODUCTION_RELEASE_VERIFIED'
echo "OLD=$OLD"
echo "NEW=$TARGET"
echo '===================================='
