import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveN414CivilTime,inspectN414D60Envelope} from './n4-14-time-d60.mjs';

// Independently specified January 2024 standard/summer UTC offsets (minutes).
// These are regression fixtures, NOT authoritative historical-zone certification.
const zones=[
 ['Etc/UTC',0],['Europe/Kyiv',120],['Europe/London',0],
 ['Europe/Paris',60],['Asia/Kolkata',330],['Asia/Kathmandu',345],
 ['Asia/Tokyo',540],['Asia/Dubai',240],['Asia/Tehran',210],
 ['Africa/Johannesburg',120],['America/New_York',-300],
 ['America/Los_Angeles',-480],['America/Phoenix',-420],
 ['America/St_Johns',-210],['Pacific/Honolulu',-600],
 ['Pacific/Auckland',780],['Pacific/Chatham',825],
 ['Pacific/Apia',780],['Australia/Adelaide',630],
 ['Australia/Eucla',525]
];
test('N4.14 twenty-region UTC sanity corpus, including 30/45-minute offsets',()=>{
 assert.equal(zones.length,20);
 for(const [zone,minutes] of zones){
  const r=resolveN414CivilTime({date:'2024-01-15',time:'12:00',zone});
  assert.equal(r.status,'UNIQUE',zone);
  assert.deepEqual(r.candidatesUtc,[new Date(Date.UTC(2024,0,15,12)-minutes*60000).toISOString()],zone);
  assert.equal(r.productionTimeResolved,false,zone);
 }
});
test('D60 50 deterministic synthetic interval sweeps never hide crossing',()=>{
 for(let i=0;i<50;i++){
  const base=10+i*0.373;
  for(const span of [0.01,0.25,0.5,1,3,6]){
   const lo=base,hi=base+span,nominal=(lo+hi)/2;
   const result=inspectN414D60Envelope({minimum:lo,nominal,maximum:hi});
   const boundaries=[];
   for(let k=Math.floor(2*lo)-1;k<=Math.ceil(2*hi)+1;k++)
    if(k/2>=lo-1e-10&&k/2<=hi+1e-10)boundaries.push(k/2);
   assert.equal(result.boundaryCount,boundaries.length,'case '+i+', span '+span);
   assert.equal(result.stableWithoutBoundary,boundaries.length===0);
   assert.equal(result.productionD60Certified,false);
  }
 }
});
