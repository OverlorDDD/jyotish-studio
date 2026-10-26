import test from 'node:test';
import assert from 'node:assert/strict';
import {probeLocalNewsFrontend} from './news-local-probe.mjs';

test('doctor verifies reachable current Next release on IPv4 first',async()=>{
 const called=[];
 const response=await probeLocalNewsFrontend(async url=>{
  called.push(url);
  return new Response('<main data-release="world-v1.7"><div data-testid="news-article-count"></div><div data-testid="news-all-interest-tags"></div><input id="galaxinews-search"/></main>',{status:200});
 });
 assert.equal(response.current,true);
 assert.equal(called.length,1);
 assert.match(called[0],/127\.0\.0\.1/);
});
test('doctor falls back to localhost after IPv4 is unavailable',async()=>{
 const result=await probeLocalNewsFrontend(async url=>{
  if(url.includes('127.0.0.1'))throw Error('connection refused');
  return new Response('data-release="world-v1.7" id="galaxinews-search" data-testid="news-article-count" data-testid="news-all-interest-tags"',{status:200});
 });
 assert.equal(result.available,true);
 assert.equal(result.current,true);
 assert.equal(result.attempts.length,1);
});
test('doctor distinguishes old UI from inaccessible UI and reports errors',async()=>{
 const old=await probeLocalNewsFrontend(async()=>new Response('old GalaxiNews',{status:200}));
 assert.equal(old.available,true);
 assert.equal(old.current,false);
 const unavailable=await probeLocalNewsFrontend(async()=>{throw Error('ECONNREFUSED')});
 assert.equal(unavailable.available,false);
 assert.match(unavailable.attempts.join(' '),/ECONNREFUSED/);
});

test('doctor never calls a partial or legacy interface CURRENT',async()=>{
 const old=await probeLocalNewsFrontend(async()=>new Response(
  '<main data-release="world-v1.7"><input id="galaxinews-search"/></main>'));
 assert.equal(old.available,true);
 assert.equal(old.current,false);
 assert.equal(old.hasCount,false);
 const legacy=await probeLocalNewsFrontend(async()=>new Response(
  '<main data-release="world-v1.7" id="galaxinews-search" data-testid="news-article-count" data-testid="news-all-interest-tags">Перевірка джерел приблизно кожні 15 хвилин</main>'));
 assert.equal(legacy.current,false);
 assert.equal(legacy.obsoleteCopy,true);
});

test('browser UI diagnostics supports offline help without launching Chromium',async()=>{
 const {spawnSync}=await import('node:child_process');
 const out=spawnSync(process.execPath,['tools/news-browser-check.mjs','--help'],{encoding:'utf8'});
 assert.equal(out.status,0,out.stderr);
 assert.match(out.stdout,/news:verify-ui/);
});
