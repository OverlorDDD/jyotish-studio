import test from 'node:test';
import assert from 'node:assert/strict';
import {tarabala,chandrabala,verifiedDailyMoonStrength} from '../packages/jyotish-core/src/lunar-strength.ts';
test('27 nakshatras: inclusive Janma cycle and three canonical 9-tara rounds',()=>{
 for(let birth=1;birth<=27;birth++){
  for(let offset=0;offset<27;offset++){
   const transit=((birth+offset-1)%27)+1;
   const t=tarabala(birth,transit);
   assert.equal(t.inclusiveCount,offset+1);
   assert.equal(t.taraNumber,offset%9+1);
   assert.equal(t.cycle,Math.floor(offset/9)+1);
   assert.equal(t.quality,[2,4,6,8,9].includes(t.taraNumber)?'supportive':t.taraNumber===1?'caution':'challenging');
  }
 }
 assert.equal(tarabala(27,1).name,'Sampat');
 assert.equal(tarabala(4,4).name,'Janma');
 assert.equal(tarabala(4,13).name,'Janma');
 assert.equal(tarabala(4,22).name,'Janma');
});
test('Chandrabala: all twelve houses including ashtama Chandra and 12->1 wrapping',()=>{
 for(let natal=1;natal<=12;natal++){
  for(let i=1;i<=12;i++){
   const transit=((natal+i-2)%12)+1,c=chandrabala(natal,transit);
   assert.equal(c.houseFromJanmaRashi,i);
   assert.equal(c.quality,[1,3,6,7,10,11].includes(i)?'supportive':'challenging');
   assert.equal(c.ashtamaChandra,i===8);
  }
 }
 assert.equal(chandrabala(12,1).houseFromJanmaRashi,2);
});
test('derives natal nakshatra only from current verified lunar longitude',()=>{
 const x=verifiedDailyMoonStrength({moonLongitude:50.4,moonSign:2},
  {nakshatraNumber:5,moonSign:4});
 assert.equal(x.tarabala.birthNakshatraIndex,4);
 assert.equal(x.tarabala.taraNumber,2);
 assert.equal(x.chandrabala.houseFromJanmaRashi,3);
 assert.equal(x.predictiveGuarantee,false);
 assert.throws(()=>verifiedDailyMoonStrength({moonLongitude:NaN,moonSign:2},{nakshatraNumber:1,moonSign:1}),/Verified/);
 assert.throws(()=>verifiedDailyMoonStrength({moonLongitude:50.4,moonSign:3},{nakshatraNumber:1,moonSign:1}),/inconsistency/);
 assert.throws(()=>tarabala(0,1),/Invalid/);
 assert.throws(()=>chandrabala(1,13),/Invalid/);
});
