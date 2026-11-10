#!/usr/bin/env bash
# N4.9.5 sixteen-card Reader production release from merged main. Run ONLY after exact-head CI is green.
# Called remotely by Windows PowerShell over SSH, never by Actions.
# Verifies merged SEO+Reader target; safely handles divergent production history via backup refs.
# Does not use Docker, mutate schemas, wipe tracked files or reset --hard.
set -Eeuo pipefail
umask 077

MODE="${1:-}"
RELEASE_ANCESTOR=2476fe0c9297626fb80ea2f50b9b898f3118fd37
TARGET="${2:-}"
APP=/opt/galaxiora/app
BRANCH=main
OLD=''
CHANGED=0

fail(){ printf 'N495_STOP: %s\n' "$*" >&2; exit 2; }
if [[ "$MODE" != '--deploy' && "$MODE" != '--preflight' ]]; then
  fail 'Usage: bash tools/n495-aws-release.sh --deploy|--preflight <full-40-hex-SHA>'
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
echo '=== N495 STAGE 1: verify immutable GitHub commit ==='
git -c gc.auto=0 -c maintenance.auto=false fetch --no-auto-gc origin \
  "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
remote="$(git rev-parse "refs/remotes/origin/$BRANCH")"
[[ "$remote" == "$TARGET" ]] || fail "Branch moved; target=$TARGET remote=$remote"
git cat-file -e "$TARGET^{commit}" || fail 'Commit object missing'
git merge-base --is-ancestor "$RELEASE_ANCESTOR" "$TARGET" || fail 'N4.9.5 integrated release commit is not included in main; merge PR #157 first'
# A previous production branch may have a divergent commit graph. Checkout of
# an exact verified commit does NOT require fast-forward ancestry; safe switch
# plus a durable ref to the old HEAD preserves unpublished production history.
DIVERGED=0
if [[ "$OLD" != "$TARGET" ]] && ! git merge-base --is-ancestor "$OLD" "$TARGET"; then
  DIVERGED=1
  echo "N495_PRODUCTION_HISTORY_DIVERGED old=$OLD new=$TARGET"
  echo '=== Production-only commits (diagnostic; retained in Git backup ref) ==='
  git log --oneline --max-count=12 "$TARGET..$OLD" || true
fi
echo "OLD=$OLD"
echo "NEW=$TARGET"
echo '=== N495 STAGE 2: capacity & preflight ==='
df -h "$APP"
node --version
npm --version
# Always assert source files for the exact proposed release exist before switch.
git cat-file -e "$TARGET:tools/n49-release-expert-qa.test.mjs"
git cat-file -e "$TARGET:e2e/n49-real-reader.spec.mjs"
git cat-file -e "$TARGET:apps/api/src/reader-compact-n491.ts"
git cat-file -e "$TARGET:tools/n491-concise-varga-reader.test.mjs"
git cat-file -e "$TARGET:apps/api/src/reader-meaning-n492.ts"
git cat-file -e "$TARGET:tools/n492-meaningful-reader.test.mjs"
git cat-file -e "$TARGET:apps/api/src/reader-insights-n493.ts"
git cat-file -e "$TARGET:tools/n493-discovery-editorial-qa.test.mjs"
git cat-file -e "$TARGET:apps/api/src/reader-human-n495.ts"
git cat-file -e "$TARGET:apps/web/app/components/ReaderN492View.tsx"
git cat-file -e "$TARGET:tools/n495-aws-release.sh"
if [[ "$MODE" == '--preflight' ]]; then
  echo 'N495_AWS_PREFLIGHT_PASS (no checkout, no restart)'
  exit 0
fi
if [[ "$OLD" == "$TARGET" ]]; then
  echo 'N495_ALREADY_AT_TARGET: rebuilding and running smoke checks'
fi

backupBase="$HOME/.galaxiora-release-backups"
mkdir -p -m 700 "$backupBase"
backup="$(mktemp -d "$backupBase/n495-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")"
chmod 700 "$backup"
printf '%s\n' "$OLD" > "$backup/previous-commit.txt"
printf '%s\n' "$TARGET" > "$backup/target-commit.txt"
# Preserve even divergent/unpublished production commits across Git GC.
# This ref is created BEFORE touching HEAD, and rollback uses exact OLD.
backupRef="refs/galaxiora/n495-rollbacks/$(basename "$backup")"
git update-ref "$backupRef" "$OLD" || fail 'Could not preserve the old production commit'
[[ "$(git rev-parse "$backupRef")" == "$OLD" ]] || fail 'Production rollback reference was not saved'
printf '%s\n' "$backupRef" > "$backup/rollback-ref.txt"
git status --porcelain --untracked-files=normal > "$backup/previous-worktree-status.txt"
if [[ "$DIVERGED" == 1 ]]; then
  git log --format='%H %s' "$TARGET..$OLD" > "$backup/old-only-commits.txt" || true
  git diff --name-status "$TARGET" "$OLD" > "$backup/tracked-difference-summary.txt"
fi
echo "N495_PRODUCTION_ROLLBACK_REF_SAVED=$backupRef"
if [[ -f .env ]]; then cp -p .env "$backup/production.env"; chmod 600 "$backup/production.env"; fi
printf 'Release rollback evidence stored privately in %s\n' "$backup"
rollback(){
  local rc=$?
  trap - EXIT
  if [[ "$rc" != 0 && "$CHANGED" == 1 ]]; then
    echo '=== N495 RELEASE FAILED: attempting repository/build/service rollback ===' >&2
    set +e
    if git -c advice.detachedHead=false switch --detach "$OLD" &&
      npm install --no-audit --no-fund --no-package-lock &&
      npm run db:generate &&
      npm run build &&
      sudo -n systemctl restart galaxiora-api galaxiora-web &&
      sudo -n systemctl is-active --quiet galaxiora-api &&
      sudo -n systemctl is-active --quiet galaxiora-web; then
      echo 'N495_ROLLBACK_REBUILD_SUCCESS — verify externally' >&2
    else
      echo 'N495_ROLLBACK_UNCONFIRMED — inspect services urgently' >&2
    fi
  fi
  if [[ "$rc" != 0 ]]; then echo "N495_RELEASE_FAILED_EXIT=$rc" >&2; fi
  exit "$rc"
}
trap rollback EXIT
echo '=== N495 STAGE 3: checkout exact audited SHA ==='
if [[ -n "$(git status --porcelain -- apps/web/next-env.d.ts)" ]]; then
  # Only the known, GENERATED file is restored; all other changes already stop.
  git restore --worktree -- apps/web/next-env.d.ts
fi
# Git refuses to overwrite conflicting tracked edits or untracked files.
# Never force checkout; only mark the release changed after successful switch.
git -c advice.detachedHead=false switch --detach "$TARGET"
CHANGED=1
echo '=== N495 STAGE 4: install, schema client, deterministic critical QA ==='
npm install --no-audit --no-fund --no-package-lock
npm run db:generate
node --experimental-strip-types --test \
  tools/n49-unified-synthesis.test.mjs \
  tools/n49-release-expert-qa.test.mjs \
  tools/n491-concise-varga-reader.test.mjs \
  tools/n492-meaningful-reader.test.mjs \
  tools/n493-discovery-editorial-qa.test.mjs \
  tools/n44-classical-reader.test.mjs
echo '=== N495 STAGE 5: compile Next + Nest + core ==='
npm run build
echo '=== N495 STAGE 6: restart services, check existing site ==='
sudo -n systemctl restart galaxiora-api galaxiora-web
sleep 7
sudo -n systemctl is-active --quiet galaxiora-api
sudo -n systemctl is-active --quiet galaxiora-web
npm run site:check
npm run launch:verify
for locale in uk en; do
  curl -fsSL --max-time 30 -o /dev/null "https://galaxiora.com/$locale/astrology/jyotish"
done
echo '=== N495 STAGE 7: ensure public API really serves new Reader ==='
curl -fsSL --max-time 30 https://galaxiora.com/api/v1/jyotish/runtime |
 node -e '
 let s="";
 process.stdin.on("data",d=>s+=d);
 process.stdin.on("end",()=>{
  const j=JSON.parse(s);
  for(const [key,expected] of [
    ["readerEdition","reader-v8.0.0-n44"],
    ["editorialEdition","n48-poetic-evidence-1.0.0"],
    ["interpretationEdition","n49-unified-evidence-v1"],
    ["verificationContract","jyotish-integrity-v3"],
    ["presentationEdition","n493-ranked-patterns-1.0.0"]
  ]){if(j[key]!==expected)throw Error("N495_RUNTIME_MISMATCH:"+key);}
  console.log("N495_PUBLIC_API_READER_EDITION_VERIFIED");
 });'
# A real public /reports request is stronger than a runtime version string:
# use invented QA birth inputs only; no personal customer chart is read or saved.
for lang in uk en; do
  body="$(printf '{"date":"2000-01-01","time":"12:00","timeZone":"Etc/UTC","latitude":50.45,"longitude":30.52,"lang":"%s","preferred":"local","asOf":"2026-11-10"}' "$lang")"
  curl -fsSL --retry 1 --max-time 60 \
    -H 'Content-Type: application/json' --data-binary "$body" \
    https://galaxiora.com/api/v1/reports |
   node -e '
    let s="";
    process.stdin.on("data",c=>s+=c);
    process.stdin.on("end",()=>{
      const a=JSON.parse(s),reader=a.readerV8, n=reader?.integrated;
      if(a.verification?.status!=="verified_internal"||a.readerV8?.status!=="available"||
       n?.version!=="n49-unified-evidence-v1"||n?.links?.length!==15||
       n?.threads?.length!==5||reader?.compactCards?.length!==15||reader?.d60Preview?.allPlanets?.length!==9||
       reader?.meaningful?.version!=="n492-evidence-prioritized-16-varga-v1"||
       reader?.meaningful?.discoveries?.version!=="n493-ranked-patterns-1.0.0"||
       reader?.meaningful?.discoveries?.insights?.length<3||
       reader?.meaningful?.discoveries?.insights?.length>5||
       !reader?.meaningful?.discoveries?.insights?.every(i=>i.teaser?.length>40&&i.proof?.length>=3)||
       reader?.meaningful?.cards?.length!==16||
       reader?.meaningful?.cards?.[0]?.division!==1||
       reader?.meaningful?.cards?.[15]?.division!==60||
       !reader?.meaningful?.cards?.[15]?.meaning?.includes("Astrological basis:") &&
       !reader?.meaningful?.cards?.[15]?.meaning?.includes("Астрологічна основа:")||
       !reader?.meaningful?.cards?.[15]?.meaning?.match(/Практичний крок:|Practical step:/)||
       !reader?.meaningful?.cards?.every(card=>card.meaning?.length>90&&card.proof?.length>0)||
       !reader?.meaningful?.summary?.direction||
       a.ai?.fallbackReason!=="reader_only")
         throw Error("N495_PUBLIC_REPORT_INTEGRITY_FAILURE");
      console.log("N495_PUBLIC_REPORT_BINDING_VERIFIED");
    });'
done
[[ "$(git rev-parse HEAD)" == "$TARGET" ]] || fail 'Deployed SHA mismatch'
CHANGED=0
trap - EXIT
echo ''
echo '===================================='
echo 'N495_PRODUCTION_RELEASE_VERIFIED'
echo "OLD=$OLD"
echo "NEW=$TARGET"
echo '===================================='
