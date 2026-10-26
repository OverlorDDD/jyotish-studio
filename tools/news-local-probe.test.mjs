import test from 'node:test';
import assert from 'node:assert/strict';
import {probeLocalNewsFrontend} from './news-local-probe.mjs';

test('doctor verifies reachable current Next release on IPv4 first',async()=>{
 const called=[];
 const response=await probeLocalNewsFrontend(async url=>{
  called.push(url);
  return new Response('<main data-release="world-v1.5"><input id="galaxinews-search"/></main>',{status:200});
 });
 assert.equal(response.current,true);
 assert.equal(called.length,1);
 assert.match(called[0],/127\.0\.0\.1/);
});
test('doctor falls back to localhost after IPv4 is unavailable',async()=>{
 const result=await probeLocalNewsFrontend(async url=>{
  if(url.includes('127.0.0.1'))throw Error('connection refused');
  return new Response('data-release="world-v1.5" galaxinews-search',{status:200});
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
