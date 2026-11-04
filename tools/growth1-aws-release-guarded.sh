#!/usr/bin/env bash
# GROWTH-1: preserve live GA4/Panchanga, archive generated Next file, guarded release.
set -Eeuo pipefail
umask 077
APP=/opt/galaxiora/app
OLD=21e8b3d5ffb69d82467738ed70d31f6ad2c15e70
BASE=6566798a6150319c7d9cc5bb20b624593ca41eb5
BRANCH=release/growth1-preserve-live-ga4-20261104
RELEASE_BLOB=909c416735611e78b20a8d28ec1e09173ed72fa7
GENERATED=apps/web/next-env.d.ts
BACKUPS=/home/ubuntu/galaxiora-backups
TARGET="$1"
die(){ printf 'STOP: %s\n' "$*" >&2; exit 2; }
[[ "$TARGET" =~ ^[0-9a-f]{40}$ ]] || die "Provide complete 40-character pinned release SHA"
[[ -d "$APP/.git" ]] || die "Unexpected app location"
cd "$APP"
[[ "$(git rev-parse HEAD)" == "$OLD" ]] || die "Live HEAD moved; re-review production code."
git diff --cached --quiet || die "Staged tracked changes present"
CHANGED="$(git diff --name-only)"
if [[ -n "$CHANGED" ]]; then
 [[ "$CHANGED" == "$GENERATED" ]] || { git status --short; die "Other tracked modifications exist"; }
 [[ -f "$GENERATED" ]] || die "Generated Next.js file missing"
 grep -q '^/// <reference' "$GENERATED" || die "Generated file looks manually edited"
fi
[[ -f .env ]] || die "Private .env missing"
node --env-file=.env -e '
 if(process.env.SITE_NOINDEX!=="0")throw Error("SITE_NOINDEX must be 0");
 if(process.env.NEXT_PUBLIC_SITE_URL!=="https://galaxiora.com")throw Error("Wrong site origin");
 if(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!=="G-SZDVCT8TF4")throw Error("Wrong GA4 measurement ID");
'
git fetch --no-tags origin "$BRANCH"
[[ "$(git rev-parse FETCH_HEAD)" == "$TARGET" ]] || die "Release branch changed"
git merge-base --is-ancestor "$OLD" "$TARGET" || die "Target is not descendant of live production"
[[ "$(git diff --name-only "$BASE" "$TARGET")" == "tools/growth1-aws-release-guarded.sh" ]] ||
 die "Unexpected changes since reviewed integration commit"
[[ "$(git rev-parse "$TARGET:tools/ga4-visitor-aws-release.sh")" == "$RELEASE_BLOB" ]] ||
 die "Audited underlying release script changed"
while IFS= read -r -d '' file; do
 if git cat-file -e "$TARGET:$file" 2>/dev/null; then
  die "Untracked path collides with release: $file"
 fi
done < <(git ls-files --others --exclude-standard -z)
mkdir -p -m 700 "$BACKUPS"
RUN="$BACKUPS/growth1-$(date -u +%Y%m%dT%H%M%SZ)-$OLD"
mkdir -m 700 "$RUN"
if [[ -n "$CHANGED" ]]; then
 cp -p "$GENERATED" "$RUN/next-env.d.ts.before"
 git diff --binary -- "$GENERATED" > "$RUN/next-env.d.ts.patch"
fi
git show "$TARGET:tools/ga4-visitor-aws-release.sh" > "$RUN/release.sh"
python3 - "$RUN/release.sh" "$TARGET" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
target=sys.argv[2]
s=p.read_text()
def swap(old,new):
 global s
 if s.count(old)!=1:
  raise SystemExit("STOP: original release script differs from reviewed source")
 s=s.replace(old,new)
swap("readonly BRANCH=fix/ga4-reliable-anonymous-visitor-analytics-20261103",
     "readonly BRANCH=release/growth1-preserve-live-ga4-20261104")
swap('TARGET_SHA="$(git rev-parse FETCH_HEAD)"',
     'TARGET_SHA="$(git rev-parse FETCH_HEAD)"\n[[ "$TARGET_SHA" == "'+target+'" ]] || die "Unexpected release SHA"')
swap("npm run test:brand-favicon\nnpm run build",
     "npm run test:brand-favicon\nnpm run test:growth1:seo\nnpm run test:r32:seo\nnpm run test:r43:seo\nnpm run test:r43:visitors\nnpm run build")
p.write_text(s)
PY
bash -n "$RUN/release.sh" || die "Release script syntax invalid"
[[ "$(git rev-parse HEAD)" == "$OLD" ]] || die "Live SHA moved during preflight"
git diff --cached --quiet || die "Tracked staging occurred during preflight"
if [[ -n "$CHANGED" ]]; then git restore --worktree -- "$GENERATED"; fi
restore_on_failure(){
 local rc=$?
 trap - EXIT
 if [[ "$rc" != 0 && -f "$RUN/next-env.d.ts.before" ]]; then
  cp -p "$RUN/next-env.d.ts.before" "$APP/$GENERATED"
 fi
 exit "$rc"
}
trap restore_on_failure EXIT
bash "$RUN/release.sh"
trap - EXIT
echo "GROWTH1_RELEASE_COMPLETED sha=$TARGET backup=$RUN"
