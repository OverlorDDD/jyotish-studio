import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const source=fileURLToPath(new URL('./source-integrity-repair.mjs',import.meta.url));
const git=(cwd,args)=>execFileSync('git',args,{cwd,encoding:'utf8'});
test('Integrity repair restores missing/hidden tracked files and preserves untracked .env',()=>{
 const root=mkdtempSync(join(tmpdir(),'galaxiora-integrity-'));
 const home=join(root,'safe-backups');
 mkdirSync(home);
 const run=(args)=>execFileSync(process.execPath,[source,...args],{cwd:root,env:{...process.env,HOME:home},encoding:'utf8'});
 try{
  git(root,['init','-q']);
  mkdirSync(join(root,'apps/web/app'),{recursive:true});
  writeFileSync(join(root,'apps/web/app/icon.svg'),'<svg>G</svg>');
  writeFileSync(join(root,'apps/web/app/layout.tsx'),'export const brand="Galaxiora";');
  writeFileSync(join(root,'.env'),'AUTH_SECRET=DO_NOT_TOUCH');
  git(root,['add','apps/web/app/icon.svg','apps/web/app/layout.tsx']);
  git(root,['-c','user.name=CI','-c','user.email=ci@example.test','commit','-qm','fixtures']);
  const original=git(root,['rev-parse','HEAD']).trim();
  git(root,['update-index','--assume-unchanged','apps/web/app/layout.tsx']);
  git(root,['update-index','--skip-worktree','apps/web/app/icon.svg']);
  writeFileSync(join(root,'apps/web/app/layout.tsx'),'export const brand="wrong";');
  rmSync(join(root,'apps/web/app/icon.svg'));
  assert.throws(()=>run([]),/SOURCE_TREE_INTEGRITY_OK|Command failed/);
  const repaired=run(['--repair']);
  assert.match(repaired,/RESTORED_TRACKED_FILES=2/);
  assert.match(repaired,/SOURCE_TREE_INTEGRITY_OK/);
  assert.equal(readFileSync(join(root,'apps/web/app/icon.svg'),'utf8'),'<svg>G</svg>');
  assert.equal(readFileSync(join(root,'apps/web/app/layout.tsx'),'utf8'),'export const brand="Galaxiora";');
  assert.equal(readFileSync(join(root,'.env'),'utf8'),'AUTH_SECRET=DO_NOT_TOUCH');
  assert.equal(git(root,['rev-parse','HEAD']).trim(),original);
  assert.equal(git(root,['status','--porcelain','--untracked-files=no']).trim(),'');
  assert.match(repaired,/BACKUP_DIRECTORY=/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
