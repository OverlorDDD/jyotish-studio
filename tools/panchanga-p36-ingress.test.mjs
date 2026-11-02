import test from 'node:test';
import assert from 'node:assert/strict';
import {findVerifiedSignIngresses} from '../apps/api/src/panchanga-ingress.ts';
const HOUR=3600000;
const start=Date.parse('2026-11-02T04:30:00Z'),end=start+24*HOUR;
test('P3.6 fixed forward exact ingress stays ordered and within observed sunrise',()=>{
 const t0=start+3*HOUR+9*60000;
 const at=ms=>({longitude:30+(ms-t0)/HOUR*0.5,longitudeSpeed:12});
 const list=findVerifiedSignIngresses(start,start+6*HOUR,at);
 assert.equal(list.length,1);
 assert.equal(list[0].from,1);assert.equal(list[0].to,2);
 assert.ok(Math.abs(Date.parse(list[0].atUtc)-t0)<=1000);
});
test('P3.6 discovers retrograde cross-and-return inside one 30-minute bracket',()=>{
 // Both 00 and 30m samples lie in Aries; the midpoint briefly enters Taurus.
 // An endpoint-only sign scan (P3.4 pre-P3.6) would return NO events.
 const period=30*60000,at=ms=>{
  const angle=(ms-start)/period*2*Math.PI;
  return {longitude:29.994+0.010*Math.sin(angle),
   longitudeSpeed:0.010*Math.cos(angle)*Math.PI*2*86400000/period};
 };
 assert.equal(Math.floor(at(start).longitude/30),0);
 assert.equal(Math.floor(at(start+period).longitude/30),0);
 const list=findVerifiedSignIngresses(start,start+period+60000,at);
 assert.equal(list.length,2);
 assert.deepEqual(list.map(e=>[e.from,e.to]),[[1,2],[2,1]]);
 assert.ok(list.every(e=>Date.parse(e.atUtc)>start));
});
test('P3.6 detects a hidden double crossing even with same-sign midpoint',()=>{
 // Two full oscillations: start, midpoint, end all have the same sign.
 const period=30*60000,at=ms=>{
  const angle=(ms-start)/period*4*Math.PI;
  return {longitude:29.997+0.004*Math.sin(angle),
   longitudeSpeed:0.004*Math.cos(angle)*Math.PI*4*86400000/period};
 };
 assert.equal(Math.floor(at(start+period/2).longitude/30),0);
 const list=findVerifiedSignIngresses(start,start+period+60000,at);
 assert.equal(list.length,4);
 assert.deepEqual(list.map(e=>e.from),[1,2,1,2]);
});
test('P3.6 0° wrapping retrograde passage cannot skip Pisces→Aries→Pisces',()=>{
 const period=30*60000,at=ms=>{
  const angle=(ms-start)/period*2*Math.PI;
  const pos=359.996+0.008*Math.sin(angle);
  return {longitude:(pos+360)%360,
   longitudeSpeed:0.008*Math.cos(angle)*2*Math.PI*86400000/period};
 };
 const list=findVerifiedSignIngresses(start,start+period+60000,at);
 assert.deepEqual(list.map(e=>[e.from,e.to]),[[12,1],[1,12]]);
});
test('P3.6 no false ingress when body is far from sign boundary',()=>{
 const at=ms=>({longitude:123+0.01*(ms-start)/HOUR,longitudeSpeed:0.24});
 assert.deepEqual(findVerifiedSignIngresses(start,end,at),[]);
});
test('P3.6 invalid or unprovable astronomical position fails closed',()=>{
 assert.throws(()=>findVerifiedSignIngresses(start,end,()=>({longitude:NaN,longitudeSpeed:1})),/invalid Swiss/);
 assert.throws(()=>findVerifiedSignIngresses(start,end,()=>({longitude:10,longitudeSpeed:99})),/invalid Swiss/);
 assert.throws(()=>findVerifiedSignIngresses(start,start+30*HOUR,()=>({longitude:10,longitudeSpeed:1})),/sunrise interval/);
 assert.throws(()=>findVerifiedSignIngresses(start,end,()=>({longitude:29.99,longitudeSpeed:1}),{
  maxSamples:30}),/budget exceeded/);
});
