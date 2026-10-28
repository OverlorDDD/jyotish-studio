import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {refreshDevNextCache} from './news-dev-cache.mjs';

test('on a new revision, only generated .next cache is removed',()=>{
 const dir=mkdtempSync(join(tmpdir(),'galaxiora-next-'));
 try{
  const cache=join(dir,'.next');mkdirSync(cache);
  const userData=join(dir,'keep-me.txt');writeFileSync(userData,'persistent');
  writeFileSync(join(cache,'old-client-bundle.js'),'old');
  const first=refreshDevNextCache(dir,'aaaaaaaa');
  assert.equal(first.state,'initial_dev_cache_cleanup');
  assert.equal(existsSync(join(cache,'old-client-bundle.js')),false);
  assert.equal(readFileSync(userData,'utf8'),'persistent');
  writeFileSync(join(cache,'new-bundle.js'),'new');
  assert.equal(refreshDevNextCache(dir,'aaaaaaaa').state,'unchanged');
  assert.equal(existsSync(join(cache,'new-bundle.js')),true);
  assert.equal(refreshDevNextCache(dir,'bbbbbbbb').state,'rebuild_for_updated_commit');
  assert.equal(existsSync(join(cache,'new-bundle.js')),false);
  assert.equal(readFileSync(join(cache,'.galaxiora-revision'),'utf8').trim(),'bbbbbbbb');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('build cache helper refuses unknown revision strings and linked cache directories',()=>{
 const dir=mkdtempSync(join(tmpdir(),'galaxiora-next-safe-'));
 try{
  assert.equal(refreshDevNextCache(dir,'not-a-commit').state,'no_revision');
  const elsewhere=mkdtempSync(join(tmpdir(),'galaxiora-elsewhere-'));
  try{
   // Windows directory junctions work without Developer Mode or elevated SeCreateSymbolicLinkPrivilege.
   // We still exercise the unsafe linked-cache rejection on both platforms.
   symlinkSync(elsewhere,join(dir,'.next'),process.platform==='win32'?'junction':'dir');
   assert.throws(()=>refreshDevNextCache(dir,'aaaaaaa'),/linked/);
  }finally{rmSync(elsewhere,{recursive:true,force:true});}
 }finally{rmSync(dir,{recursive:true,force:true});}
});
