import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreN4OriginalLahiri} from './n4-rc-lahiri-physical-audit.mjs';
import {vargaSign} from '../packages/jyotish-core/src/vargas.ts';
const names=['Lagna','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
function sources(){
 return Array.from({length:20},(_,i)=>{
  const actual=Object.fromEntries(names.map((name,j)=>[name,((i*29.761+j*31.17)%360)]));
  const original=Object.fromEntries(names.map(name=>{
   const lon=actual[name];
   return [name,{longitude:lon,d1:Math.floor(lon/30)+1,d9:vargaSign(lon,9)+1,d10_1_9:vargaSign(lon,10)+1}];
  }));
  return {id:'jqa3-'+String(i+1).padStart(2,'0'),actual,original};
 });
}
test('scoped 20 source agreement is NEVER a 50-case certification',()=>{
 const x=scoreN4OriginalLahiri(sources());
 assert.deepEqual(x.signs,{D1:200,D9:200,D10:200});
 assert.equal(x.moonWithinOneArcsecond,20);
 assert.equal(x.lagnaWithinOneArcsecond,20);
 assert.equal(x.requiredSameProfileOriginalCases,50);
 assert.equal(x.original50CaseExternalReleaseGatePassed,false);
 assert.equal(x.productionN4Approved,false);
});
test('one Moon mismatch above 1 arcsec cannot be disguised by all-sign parity',()=>{
 const a=sources();a[0].actual.Moon+=2/3600;
 const x=scoreN4OriginalLahiri(a);
 assert.equal(x.moonWithinOneArcsecond,19);
 assert.equal(x.signs.D1,200);
 assert.equal(x.all20MeetSubArcsecond,false);
 assert.equal(x.productionN4Approved,false);
});
test('source controls reject missing profile, nonfinite or short corpus',()=>{
 assert.throws(()=>scoreN4OriginalLahiri(sources().slice(0,19)),/REQUIRE_20/);
 const a=sources();delete a[1].original.Ketu;
 assert.throws(()=>scoreN4OriginalLahiri(a),/SOURCE_METHOD_MISMATCH/);
});
