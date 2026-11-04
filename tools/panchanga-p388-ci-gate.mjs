/** P3.8.8 release safety: do not trust an operator's unverified CI attestation.
 * Public GitHub API for this PUBLIC repository; never sends production secrets.
 * Require successful PUSH workflows on the actual integrated release branch SHA.
 * Network/rate-limit/incomplete results are a NO-GO, not an implicit PASS.
 */
import assert from 'node:assert/strict';
const REPO='OverlorDDD/jyotish-studio';
const BRANCH='release/panchanga-p36-production-acceptance-20261102';
export const REQUIRED_WORKFLOWS=[
 'P3.8.8 Independent Astronomy and Production Release Candidate',
 'Panchanga 2.0 Quality',
 'R4.3 International Search and IndexNow Safety'
];
export function validateP388ReleaseRuns(payload,sha){
 assert.match(sha,/^[0-9a-f]{40}$/,'Exact 40-character tested SHA required');
 assert.ok(payload&&Array.isArray(payload.workflow_runs),'GitHub run list unavailable');
 const runs=payload.workflow_runs.filter(x=>x.head_sha===sha&&x.head_branch===BRANCH&&x.event==='push');
 const report=[];
 for(const name of REQUIRED_WORKFLOWS){
  const found=runs.filter(r=>r.name===name);
  assert.ok(found.length,'Missing successful release-branch CI: '+name);
  // Last run of each workflow at exactly this SHA must succeed.
  const latest=found.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)))[0];
  assert.equal(latest.status,'completed','CI incomplete: '+name);
  assert.equal(latest.conclusion,'success','CI failed: '+name);
  report.push({name,id:latest.id});
 }
 return report;
}
export async function verifyP388ReleaseCI(sha,fetcher=fetch){
 assert.match(sha,/^[0-9a-f]{40}$/,'Exact 40-character tested SHA required');
 const endpoint='https://api.github.com/repos/'+REPO+
  '/actions/runs?head_sha='+sha+'&per_page=100';
 const r=await fetcher(endpoint,{headers:{Accept:'application/vnd.github+json',
  'User-Agent':'Galaxiora-P388-operator-release-gate',
  'X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(20000)});
 assert.equal(r.status,200,'GitHub Actions status unavailable; abort production release');
 const result=validateP388ReleaseRuns(await r.json(),sha);
 return result;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const sha=process.argv[2];
 try{
  const checks=await verifyP388ReleaseCI(sha);
  for(const check of checks)console.log('P388_CI_PASS '+check.name+' run='+check.id);
  console.log('P388_CI_EXACT_SHA_GREEN '+sha);
 }catch(err){
  console.error('P388_CI_NO_GO: '+(err instanceof Error?err.message:String(err)));
  process.exitCode=1;
 }
}
