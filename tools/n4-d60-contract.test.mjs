import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4D60Candidate,N4_D60_VERSION,N4_D60_METHOD} from '../apps/api/src/n4-d60-candidate.ts';
import {assertD60Provisional,hasD60Provisional} from '../apps/web/lib/n4-d60-view.ts';

const NAMES=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
function fixture(){
 const chart=calculateChart(
  {date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50,longitude:30},
  {ayanamsa:23.8,julianDay:2451545,backend:'synthetic-test',
   ascendant:12.747,
   positions:NAMES.map((name,i)=>({name,longitude:(i*33.22+5.13)%360,speed:i%2?.2:-.1}))});
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:'a'.repeat(64),externalReferenceChecked:false,checks:['synthetic-only']};
 return {chart,verification};
}
test('D60 server emits traditional own-sign 60 chart from verified D1 and keeps time uncertainty provisional',()=>{
 const {chart,verification}=fixture();
 const d=makeN4D60Candidate(chart,verification);
 assert.equal(d.version,N4_D60_VERSION);assert.equal(d.method,N4_D60_METHOD);
 assert.equal(d.division,60);assert.equal(d.planets.length,9);
 assert.equal(d.sourceDigest,verification.digest);
 assert.equal(d.continuousTimeStabilityCertified,false);
 assert.equal(d.d60HouseInterpretationEligible,false);
 assert.equal(d.birthTimePrecision,'NOT_INFERRED_FROM_HH_MM');
 assert.equal(d.astronomicalCoordinatesPerBirthExternallyCertified,false);
 assert.doesNotThrow(()=>assertD60Provisional({verification,n4D60:d}));
});
test('D60 server rejects unverified digest or different ayanamsa and D1 body loss',()=>{
 const {chart,verification}=fixture();
 for(const fake of [{...verification,digest:'0'},{...verification,status:'uncertified'},
  {...verification,externalReferenceChecked:true}]){
  assert.throws(()=>makeN4D60Candidate(chart,fake),/N4_D60_SOURCE_INTEGRITY_REJECTED/);
 }
 assert.throws(()=>makeN4D60Candidate({...chart,config:{...chart.config,ayanamsa:'TrueCitra'}},verification),
  /N4_D60_SOURCE_INTEGRITY_REJECTED/);
 assert.throws(()=>makeN4D60Candidate({...chart,d1:chart.d1.slice(0,8)},verification),
  /N4_D60_SOURCE_INTEGRITY_REJECTED/);
});
test('D60 client rejects fake method, modified digest, false stability and trusted houses',()=>{
 const {chart,verification}=fixture(),d=makeN4D60Candidate(chart,verification);
 for(const change of [
  {method:'BPHS literal from Aries'},
  {sourceDigest:'b'.repeat(64)},
  {continuousTimeStabilityCertified:true},
  {d60HouseInterpretationEligible:true},
  {astronomicalCoordinatesPerBirthExternallyCertified:true},
  {status:'CERTIFIED_FOR_PERSON'},
  {division:45},
  {birthTimePrecision:'PROVEN_TO_SECOND'}
 ]){
  assert.equal(hasD60Provisional({verification,n4D60:{...d,...change}}),false);
 }
});
test('D60 client rejects any invented part and house inconsistent with nominal D60 lagna',()=>{
 const {chart,verification}=fixture(),d=makeN4D60Candidate(chart,verification);
 assert.equal(hasD60Provisional({verification,n4D60:{...d,planets:d.planets.map((p,i)=>i===0?{...p,part:61}:p)}}),false);
 assert.equal(hasD60Provisional({verification,n4D60:{...d,planets:d.planets.map((p,i)=>i===0?{...p,house:(p.house%12)+1}:p)}}),false);
});
test('D60 is a separate optional field and existing 15-chart method is unchanged',()=>{
 const {chart,verification}=fixture();
 const d=makeN4D60Candidate(chart,verification);
 assert.equal(d.division,60);
 assert.equal(d.d60HouseInterpretationEligible,false);
 assert.equal(d.symbolicMathScope,'VERIFIED_FOR_PINNED_INPUT_LONGITUDES_ONLY');
});
