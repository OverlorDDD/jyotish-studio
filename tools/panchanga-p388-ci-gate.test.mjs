import test from 'node:test';
import assert from 'node:assert/strict';
import {validateP388ReleaseRuns,verifyP388ReleaseCI,REQUIRED_WORKFLOWS}
 from './panchanga-p388-ci-gate.mjs';
const sha='a'.repeat(40),branch='release/panchanga-p36-production-acceptance-20261102';
const run=(name,overrides={})=>({name,head_sha:sha,head_branch:branch,
 event:'push',status:'completed',conclusion:'success',created_at:'2026-11-03T12:00:00Z',id:1,...overrides});
const fixture=()=>({workflow_runs:REQUIRED_WORKFLOWS.map(name=>run(name))});
test('P388 CI: all 3 exact-SHA release-branch push checks must complete green',()=>{
 assert.equal(validateP388ReleaseRuns(fixture(),sha).length,3);
 for(const name of REQUIRED_WORKFLOWS){
  const missing=fixture();missing.workflow_runs=missing.workflow_runs.filter(x=>x.name!==name);
  assert.throws(()=>validateP388ReleaseRuns(missing,sha),/Missing successful/);
 }
});
test('P388 CI: cannot accept feature-only, PR-only, wrong SHA, stale or failed reruns',()=>{
 for(const change of [
  {head_branch:'release/panchanga-p388-independent-qa-20261103'},
  {event:'pull_request'}, {head_sha:'b'.repeat(40)},
  {status:'in_progress',conclusion:null},{conclusion:'failure'},{conclusion:'cancelled'}
 ]){
  const data=fixture();data.workflow_runs[0]={...data.workflow_runs[0],...change};
  assert.throws(()=>validateP388ReleaseRuns(data,sha));
 }
 const data=fixture();data.workflow_runs.push(run(REQUIRED_WORKFLOWS[0],{
  conclusion:'failure',id:55,created_at:'2026-11-03T13:00:00Z'}));
 assert.throws(()=>validateP388ReleaseRuns(data,sha),/CI failed/);
 assert.throws(()=>validateP388ReleaseRuns(fixture(),'notsha'),/40-character/);
});
test('P388 CI: HTTP errors, API missing, API success and no credentials',async()=>{
 const good=async(_url,opts)=>{
  assert.match(_url,/head_sha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/);
  assert.ok(!JSON.stringify(opts).includes('Authorization'));
  return {status:200,json:async()=>fixture()};
 };
 assert.equal((await verifyP388ReleaseCI(sha,good)).length,3);
 await assert.rejects(()=>verifyP388ReleaseCI(sha,async()=>({status:403})),/status unavailable/);
 await assert.rejects(()=>verifyP388ReleaseCI(sha,async()=>({status:200,json:async()=>({})})),/run list unavailable/);
});

test('P388 release push on P3.6 actually triggers all three required GitHub workflows',async()=>{
 const {readFileSync}=await import('node:fs');
 const files=[
  '.github/workflows/panchanga-p388-independent-release.yml',
  '.github/workflows/panchanga-v2-validation.yml',
  '.github/workflows/r43-search-indexnow-validation.yml'
 ];
 const expected=new Set(REQUIRED_WORKFLOWS);
 for(const file of files){
  const yml=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const title=yml.split(/\r?\n/)[0].replace(/^name:\s*/,'');
  assert.ok(expected.has(title),'Unexpected CI gate workflow '+title);
  const push=yml.split(/^  push:\s*$/m)[1]?.split(/^  (?:pull_request|workflow_dispatch):/m)[0]||'';
  assert.match(push,/release\/panchanga-p36-production-acceptance-20261102/,
   'Gate workflow missing release-branch push trigger: '+file);
  expected.delete(title);
 }
 assert.equal(expected.size,0,'Every CI gate workflow must be covered');
});
