/** Reproduce the EC2 --single-branch clone. Never require origin/<other branch>.
 * This test uses disposable git fixtures only, no network, credentials or AWS.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const run=(cwd,...args)=>{
 const r=spawnSync('git',args,{cwd,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr||r.stdout||args.join(' '));
 return r.stdout.trim();
};
test('P388 EC2 single-branch: fetch updates FETCH_HEAD, not automatically origin/release; exact blob is independently checked',()=>{
 const root=mkdtempSync(join(tmpdir(),'p388-ref-'));
 try{
  const bare=join(root,'remote.git'),src=join(root,'source'),live=join(root,'live');
  run(root,'init','--bare',bare);
  mkdirSync(src);run(src,'init');run(src,'config','user.name','p388-ci');
  run(src,'config','user.email','p388-ci@example.invalid');
  writeFileSync(join(src,'README.md'),'production\n');
  run(src,'add','.');run(src,'commit','-m','production');
  run(src,'branch','-M','main');run(src,'remote','add','origin',bare);
  run(src,'push','-u','origin','main');
  run(src,'switch','-c','release/panchanga-p388-independent-qa-20261103');
  mkdirSync(join(src,'tools'));
  writeFileSync(join(src,'tools/panchanga-p388-release.sh'),'#!/usr/bin/env bash\necho P388_READ_ONLY_DIAGNOSIS\necho P388_PRODUCTION_RELEASE_VERIFIED\n');
  run(src,'add','.');run(src,'commit','-m','p388 source only');
  run(src,'push','origin','HEAD');
  run(root,'clone','--single-branch','--branch','main',bare,live);
  run(live,'fetch','--no-tags','origin','refs/heads/release/panchanga-p388-independent-qa-20261103');
  const sha=run(live,'rev-parse','--verify','FETCH_HEAD^{commit}');
  assert.match(sha,/^[0-9a-f]{40}$/);
  const branch=spawnSync('git',['rev-parse','--verify','origin/release/panchanga-p388-independent-qa-20261103'],{cwd:live,encoding:'utf8'});
  assert.notEqual(branch.status,0,'Single-branch clone must not assume remote-tracking branch');
  run(live,'cat-file','-e',sha+':tools/panchanga-p388-release.sh');
  assert.match(run(live,'show',sha+':tools/panchanga-p388-release.sh'),/P388_READ_ONLY_DIAGNOSIS/);
  // Merged P3.6 source does not yet exist; safe bootstrap must reject it.
  run(live,'fetch','--no-tags','origin','refs/heads/main');
  const mainSha=run(live,'rev-parse','FETCH_HEAD');
  const missing=spawnSync('git',['cat-file','-e',mainSha+':tools/panchanga-p388-release.sh'],{cwd:live,encoding:'utf8'});
  assert.notEqual(missing.status,0,'Missing pre-merge release script must stop');
 }finally{rmSync(root,{recursive:true,force:true})}
});
test('P388 documented bootstrap checks file exists, is nonempty, contains guard markers and is syntactically valid',()=>{
 const doc=readFileSync(new URL('../docs/operations/panchanga-p388-independent-release-2026-11-03.md',import.meta.url),'utf8');
 assert.match(doc,/single-branch/);
 assert.match(doc,/git fetch --no-tags origin refs\/heads\/release\/panchanga-p388-independent-qa-20261103/);
 assert.match(doc,/git fetch --no-tags origin refs\/heads\/release\/panchanga-p36-production-acceptance-20261102/);
 assert.match(doc,/git rev-parse --verify 'FETCH_HEAD\^\{commit\}'/);
 assert.match(doc,/git cat-file -e "\$TARGET_SHA:tools\/panchanga-p388-release.sh"/);
 assert.match(doc,/test -s \/tmp\/galaxiora-p388-release.sh/);
 assert.match(doc,/grep -Fq P388_READ_ONLY_DIAGNOSIS/);
 assert.match(doc,/bash -n \/tmp\/galaxiora-p388-release.sh/);
 assert.doesNotMatch(doc,/git show origin\/release\/panchanga-p36-production-acceptance-20261102/);
});
