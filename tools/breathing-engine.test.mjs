import test from 'node:test';
import assert from 'node:assert/strict';
import {BREATHING_PATTERNS,breathFrame,patternById,cycleMs,sessionMs,formatBreathTime} from '../apps/web/lib/breathing-patterns.ts';

test('Box 4-4-4-4: phase transitions every four seconds and complete exactly 15 cycles',()=>{
 const p=patternById('box');
 assert.deepEqual(p.seconds,{inhale:4,holdIn:4,exhale:4,holdOut:4});
 assert.equal(p.rounds,15);assert.equal(cycleMs(p),16000);assert.equal(sessionMs(p),240000);
 const expected=[[0,'inhale'],[3999,'inhale'],[4000,'holdIn'],[7999,'holdIn'],[8000,'exhale'],
  [11999,'exhale'],[12000,'holdOut'],[15999,'holdOut'],[16000,'inhale'],[240000,'holdOut']];
 for(const [t,phase] of expected)assert.equal(breathFrame(p,t).phase,phase, t);
 const finished=breathFrame(p,240000);
 assert.equal(finished.done,true);assert.equal(finished.completed,15);assert.equal(finished.remainingMs,0);
 assert.equal(breathFrame(p,239999).done,false);
});
test('Alternatives have no holds and skip directly to exhale; never classify an inhale as 90 seconds',()=>{
 for(const id of ['equal','extended']){
  const p=patternById(id);
  assert.equal(p.seconds.holdIn,0);assert.equal(p.seconds.holdOut,0);
  assert.equal(sessionMs(p),240000);
  assert.equal(breathFrame(p,p.seconds.inhale*1000).phase,'exhale');
  assert.equal(breathFrame(p,0).phase,'inhale');
 }
 assert.equal(Math.max(...BREATHING_PATTERNS.flatMap(p=>Object.values(p.seconds))),5);
});
test('Round/remaining values are clamped, stable and monotonic',()=>{
 const p=patternById('box');
 assert.equal(breathFrame(p,-100).elapsedMs,0);
 assert.equal(breathFrame(p,1000).ratio,.25);
 assert.equal(breathFrame(p,17000).cycle,2);
 assert.equal(breathFrame(p,17000).completed,1);
 assert.equal(breathFrame(p,1e9).done,true);
 assert.equal(formatBreathTime(240000),'04:00');
 assert.equal(formatBreathTime(1),'00:01');
});
