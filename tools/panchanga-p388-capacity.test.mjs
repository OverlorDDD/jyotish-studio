import test from 'node:test';
import assert from 'node:assert/strict';
import {acquireP388TimeFinder} from '../apps/api/src/panchanga-p388-capacity.ts';

test('P388 one Swiss search can run; second parallel search fails busy, never unbounded queue',()=>{
 const release=acquireP388TimeFinder();
 assert.throws(()=>acquireP388TimeFinder(),/P388_TIME_FINDER_BUSY/);
 release();
 const second=acquireP388TimeFinder();
 second();
 assert.throws(()=>second(),/released twice/);
});
test('P388 concurrent searches return capacity even after failing evaluated promise',async()=>{
 const execute=async()=>{
  const done=acquireP388TimeFinder();
  try{await Promise.reject(Error('Swiss source unavailable'));}
  finally{done();}
 };
 await assert.rejects(execute,/Swiss source unavailable/);
 const done=acquireP388TimeFinder();
 done();
});
