#!/usr/bin/env bash
# Operator-only P3.8.8 release wrapper. Never bypass GitHub CI or force checkout.
set -Eeuo pipefail
umask 077
ACTION="${1:-check}"
APP=/opt/galaxiora/app
BRANCH=release/panchanga-p36-production-acceptance-20261102
EXPECTED_SHA=ed446a925f90f78c51471a367a8d77843cece90e
SCRIPT=/tmp/galaxiora-p388-release.sh
case "$ACTION" in check|deploy) ;; *) echo 'Usage: bash script.sh check|deploy' >&2; exit 2;; esac
cd "$APP"

echo '=== Verify GitHub release SHA and source ==='
git fetch --no-tags origin "refs/heads/$BRANCH"
TARGET_SHA=$(git rev-parse --verify 'FETCH_HEAD^{commit}')
if [[ "$TARGET_SHA" != "$EXPECTED_SHA" ]]; then
 echo "P388_STOP: expected $EXPECTED_SHA but release branch is $TARGET_SHA" >&2
 exit 2
fi
git cat-file -e "$TARGET_SHA:tools/panchanga-p388-release.sh"
git show "$TARGET_SHA:tools/panchanga-p388-release.sh" > "$SCRIPT"
test -s "$SCRIPT"
grep -Fq P388_PREFLIGHT_PASS "$SCRIPT"
grep -Fq P388_PRODUCTION_RELEASE_VERIFIED "$SCRIPT"
bash -n "$SCRIPT"
echo "P388_RELEASE_SHA_VALIDATED $TARGET_SHA"

echo '=== Current exact-SHA GitHub Actions (public API) ==='
if ! node --input-type=module - "$TARGET_SHA" <<'JS'
const sha=process.argv[2];
const branch='release/panchanga-p36-production-acceptance-20261102';
const required=[
 'P3.8.8 Independent Astronomy and Production Release Candidate',
 'Panchanga 2.0 Quality',
 'R4.3 International Search and IndexNow Safety'
];
try{
 const url='https://api.github.com/repos/OverlorDDD/jyotish-studio/actions/runs?head_sha='+sha+'&per_page=100';
 const r=await fetch(url,{headers:{Accept:'application/vnd.github+json',
  'User-Agent':'Galaxiora-P388-operator-check'},signal:AbortSignal.timeout(20000)});
 if(r.status!==200)throw Error('GitHub API HTTP '+r.status);
 const data=await r.json();
 if(!Array.isArray(data.workflow_runs))throw Error('Invalid GitHub Actions data');
 const runs=data.workflow_runs.filter(x=>x.event==='push'&&x.head_sha===sha&&x.head_branch===branch);
 let green=true;
 for(const name of required){
  const matches=runs.filter(x=>x.name===name).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
  const x=matches[0];
  const state=x?(x.status==='completed'?(x.conclusion||'unknown'):x.status):'missing';
  console.log(name+' = '+state);
  if(x?.html_url)console.log('  '+x.html_url);
  if(!x||x.status!=='completed'||x.conclusion!=='success')green=false;
 }
 if(!green){console.error('P388_CI_NOT_READY: NO PRODUCTION DEPLOYMENT');process.exitCode=3;}
 else console.log('P388_CI_EXACT_SHA_GREEN '+sha);
}catch(e){console.error('P388_CI_CHECK_FAILED: '+e.message);process.exitCode=3;}
JS
then
 echo 'P388_STOP: Site and database have NOT been changed.' >&2
 exit 3
fi

echo '=== Verified production preflight ==='
export P388_TARGET_SHA="$TARGET_SHA"
bash "$SCRIPT" preflight
if [[ "$ACTION" == check ]]; then
 echo 'P388_CHECK_READY. Deploy explicitly: bash /tmp/p388-safe-aws.sh deploy'
 exit 0
fi

echo '=== Explicit approval required ==='
read -r -p 'Type DEPLOY_P388 to back up and update production: ' answer
if [[ "$answer" != DEPLOY_P388 ]]; then
 echo 'P388_CANCELLED: Nothing deployed.'
 exit 2
fi
export P388_CI_ATTESTED_SHA="$TARGET_SHA"
export P388_APPROVAL=I_APPROVE_P388_PRODUCTION
bash "$SCRIPT" deploy
