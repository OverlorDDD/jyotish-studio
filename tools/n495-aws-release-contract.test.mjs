import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const src=readFileSync(new URL('./n495-aws-release.sh',import.meta.url),'utf8');

test('N495 preserves divergent AWS HEAD before exact-SHA checkout, never force-cleans',()=>{
 assert.match(src,/^set -Eeuo pipefail/m);
 assert.match(src,/^BRANCH=main$/m);
 assert.match(src,/git merge-base --is-ancestor "\$RELEASE_ANCESTOR" "\$TARGET"/);
 assert.match(src,/DIVERGED=0/);
 assert.match(src,/! git merge-base --is-ancestor "\$OLD" "\$TARGET"/);
 assert.doesNotMatch(src,/Production HEAD is not ancestor; stop and reconcile manually/);
 assert.match(src,/git update-ref "\$backupRef" "\$OLD"/);
 assert.match(src,/git rev-parse "\$backupRef"/);
 assert.match(src,/N495_PRODUCTION_ROLLBACK_REF_SAVED/);
 assert.match(src,/git -c advice\.detachedHead=false switch --detach "\$TARGET"\nCHANGED=1/);
 assert.match(src,/^rollback\(\)\{/m);
 assert.match(src,/switch --detach "\$OLD"/);
 assert.match(src,/Dirty tracked production files/);
 assert.match(src,/N495_AWS_PREFLIGHT_PASS/);
 assert.match(src,/N495_PUBLIC_REPORT_BINDING_VERIFIED/);
 assert.match(src,/N495_PRODUCTION_RELEASE_VERIFIED/);
 assert.doesNotMatch(src,/(?:git\s+reset\s+--hard|git\s+clean\s+-f|git\s+checkout\s+-f|docker\s+)/);
});

test('Diverged Git graphs retain unpublished old production commit for rollback',()=>{
 const root=mkdtempSync(join(tmpdir(),'n495-divergence-qa-'));
 const git=(...args)=>{
  const p=spawnSync('git',args,{cwd:root,encoding:'utf8'});
  assert.equal(p.status,0,'git '+args.join(' ')+': '+p.stderr);
  return p.stdout.trim();
 };
 try{
  git('init','-q');git('config','user.email','qa@galaxiora.test');git('config','user.name','Galaxiora QA');
  writeFileSync(join(root,'base.txt'),'shared\n');git('add','base.txt');git('commit','-qm','shared');
  const common=git('rev-parse','HEAD');
  git('checkout','-qb','production');writeFileSync(join(root,'live.txt'),'production-only\n');
  git('add','live.txt');git('commit','-qm','production special release');
  const old=git('rev-parse','HEAD');
  git('checkout','-qb','main',common);writeFileSync(join(root,'reader.txt'),'16 person-first natal cards\n');
  git('add','reader.txt');git('commit','-qm','Reader N495');
  const target=git('rev-parse','HEAD');
  assert.equal(spawnSync('git',['merge-base','--is-ancestor',old,target],{cwd:root}).status,1);
  git('checkout','-q','production');
  const ref='refs/galaxiora/n495-rollbacks/test-'+old.slice(0,8);
  git('update-ref',ref,old);
  assert.equal(git('rev-parse',ref),old);
  git('switch','--detach',target);
  assert.equal(git('rev-parse','HEAD'),target);
  assert.equal(git('show',ref+':live.txt'),'production-only');
  git('switch','--detach',old);
  assert.equal(git('rev-parse','HEAD'),old);
 }finally{rmSync(root,{recursive:true,force:true});}
});
