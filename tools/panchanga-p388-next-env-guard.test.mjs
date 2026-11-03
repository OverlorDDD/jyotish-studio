import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const helper=fileURLToPath(new URL('./panchanga-p388-next-env-guard.mjs',import.meta.url));
const original='/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n// This file is maintained by Next.js.\n';
const generated='/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n/// <reference path="./.next/types/routes.d.ts" />\n\n// NOTE: This file should not be edited\n// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.\n';
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'p388-next-env-')),web=join(root,'apps','web');
 mkdirSync(web,{recursive:true});
 const f=join(web,'next-env.d.ts');
 writeFileSync(f,original);
 const git=(...args)=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);};
 git('init','-q');git('config','user.email','ci@example.test');git('config','user.name','CI');git('add','apps/web/next-env.d.ts');git('commit','-qm','baseline');
 return {root,f,git,state:join(root,'.private-state')};
}
function run(f){
 return spawnSync(process.execPath,[helper,'reconcile'],{
  cwd:f.root,env:{...process.env,P388_APP_ROOT:f.root,P388_STATE_ROOT:f.state},encoding:'utf8'});
}
test('P388 generator guard: preserves harmless Next.js rewrite privately and restores reviewed HEAD',()=>{
 const f=fixture();
 try{
  writeFileSync(f.f,generated);
  const r=run(f);assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/P388_NEXT_ENV_RECONCILED/);
  assert.equal(readFileSync(f.f,'utf8'),original);
  const backups=readdirSync(f.state).filter(x=>x.startsWith('generated-next-env-'));
  assert.equal(backups.length,1);
  assert.equal(readFileSync(join(f.state,backups[0]),'utf8'),generated);
  const checked=run(f);assert.equal(checked.status,0);assert.match(checked.stdout,/P388_NEXT_ENV_CLEAN/);
 }finally{rmSync(f.root,{recursive:true,force:true})}
});
test('P388 generator guard: never rewrites manually edited tracked Next source',()=>{
 const f=fixture();
 try{
  for(const bad of ['// user edits\n'+generated,original+'import "unexpected";\n']){
   writeFileSync(f.f,bad);
   const r=run(f);
   assert.notEqual(r.status,0);
   assert.match(r.stderr,/P388_NEXT_ENV_STOP/);
   assert.equal(readFileSync(f.f,'utf8'),bad);
  }
 }finally{rmSync(f.root,{recursive:true,force:true})}
});
test('P388 release script: generator is reconciled before checkout, in rollback, and after build',()=>{
 const script=readFileSync(new URL('./panchanga-p388-release.sh',import.meta.url),'utf8');
 const occurrences=script.match(/p388-next-env-guard\.mjs" reconcile/g)||[];
 assert.equal(occurrences.length,3);
 assert.ok(script.indexOf('p388-next-env-guard.mjs" reconcile')<script.indexOf('P388_LOCAL_MODIFICATIONS'));
 const r=spawnSync('bash',['-n',fileURLToPath(new URL('./panchanga-p388-release.sh',import.meta.url))],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
});
