import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload,N4_RC_CONTRACT_VERSION,N4_RC_DIVISIONS} from '../apps/api/src/n4-rc-contract.ts';
import {assertN4RcView,hasN4RcView,N4_RC_VIEW_DIVISIONS} from '../apps/web/lib/n4-rc-view.ts';
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const birth={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
const eph={
 ayanamsa:23.8,ascendant:11.713,
 julianDay:2451545,backend:'synthetic-SWIEPH-unit-only',
 positions:names.map((name,i)=>({name,longitude:(i*33.17+7)%360,speed:i%3===0?-0.1:0.3}))
};
function fixture(){
 const chart=calculateChart(birth,eph);
 const proof={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:'a'.repeat(64),externalReferenceChecked:false,checks:['synthetic_unit_source']};
 return {chart,proof};
}
test('N4 RC 15 only: D60 is neither in API nor in client-approved release',()=>{
 const {chart,proof}=fixture(),n4=makeN4RcPayload(chart,proof);
 assert.equal(n4.version,N4_RC_CONTRACT_VERSION);
 assert.equal(n4.charts.length,15);
 assert.deepEqual(n4.charts.map(x=>x.division),[...N4_RC_DIVISIONS]);
 assert.deepEqual(n4.charts.map(x=>x.division),[...N4_RC_VIEW_DIVISIONS]);
 assert.ok(!n4.charts.some(x=>x.division===60));
 assert.equal(n4.d60Excluded,true);
 assert.equal(n4.externalJhoraPerBirthCertified,false);
 assert.equal(n4.sourceDigest,proof.digest);
 assert.equal(n4.d2Method,'Sun/Moon Hora');
 assert.doesNotThrow(()=>assertN4RcView({...chart,verification:proof,n4}));
});
test('N4 RC server rechecks D1/D9/D10 source sign and house parity',()=>{
 const {chart,proof}=fixture(),n4=makeN4RcPayload(chart,proof);
 for(const n of [1,9,10]){
  const c=n4.charts.find(c=>c.division===n),baseline=n===1?chart.d1:n===9?chart.d9:chart.d10;
  assert.ok(c);
  for(const p of c.planets){
   const old=baseline.find(x=>x.name===p.name);
   assert.equal(p.sign,old.sign);
   assert.equal(p.house,old.house);
  }
 }
});
test('N4 RC rejects a forged server verification or wrong astronomical method',()=>{
 const {chart,proof}=fixture();
 for(const p of [{...proof,digest:'INVALID'},{...proof,status:'unverified'},
  {...proof,externalReferenceChecked:true}]){
  assert.throws(()=>makeN4RcPayload(chart,p),/N4_RC_SOURCE_OR_METHOD_MISMATCH/);
 }
 assert.throws(()=>makeN4RcPayload({...chart,config:{...chart.config,ayanamsa:'TrueCitra'}},proof),
  /N4_RC_SOURCE_OR_METHOD_MISMATCH/);
});
test('N4 RC refuses to mask a different D9 or D10 astronomical result',()=>{
 const {chart,proof}=fixture();
 for(const key of ['d9','d10']){
  const broken={...chart,[key]:chart[key].map((p,i)=>i? p:{...p,sign:(p.sign%12)+1})};
  assert.throws(()=>makeN4RcPayload(broken,proof),/N4_RC_SOURCE_OR_METHOD_MISMATCH/);
 }
});
test('N4 RC client rejects digest mismatch, tampered D60, and forged external certificate',()=>{
 const {chart,proof}=fixture(),n4=makeN4RcPayload(chart,proof);
 assert.equal(hasN4RcView({...chart,verification:proof,n4}),true);
 for(const changed of [
  {...n4,sourceDigest:'b'.repeat(64)},
  {...n4,charts:[...n4.charts,{...n4.charts[0],division:60}]},
  {...n4,externalJhoraPerBirthCertified:true},
  {...n4,d2Method:'Uma-Shambhu Hora'},
 ]){
  assert.equal(hasN4RcView({...chart,verification:proof,n4:changed}),false);
 }
});
test('N4 RC browser refuses altered planet houses and mismatched D1',()=>{
 const {chart,proof}=fixture(),n4=makeN4RcPayload(chart,proof);
 const altered={...n4,charts:n4.charts.map((c,i)=>
  i===2?{...c,planets:c.planets.map((p,j)=>j? p:{...p,house:12})}:c)};
 assert.equal(hasN4RcView({...chart,verification:proof,n4:altered}),false);
 assert.equal(hasN4RcView({...chart,verification:proof,n4,
  d1:chart.d1.map((p,i)=>i? p:{...p,sign:(p.sign%12)+1})}),false);
});
test('N4 RC failures do not turn into a false positive for incomplete planets',()=>{
 const {chart,proof}=fixture();
 assert.throws(()=>makeN4RcPayload({...chart,d1:chart.d1.slice(0,8)},proof),
  /N4_RC_SOURCE_OR_METHOD_MISMATCH/);
});
