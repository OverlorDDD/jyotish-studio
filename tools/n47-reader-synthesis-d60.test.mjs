import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';
import {buildD60Preview,compactD60PreviewForAi} from '../apps/api/src/reader-d60-n47.ts';

const NAMES=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const birth={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
function sample(seed=1,withD60=true){
 const backend={ayanamsa:23.8,ascendant:11+seed*13.1,julianDay:2451545,
  backend:'N47_SYNTHETIC_QA_ONLY',
  positions:NAMES.map((name,i)=>({name,longitude:(13+i*36.11+seed*(9.27+i*.33))%360,speed:.1}))};
 const chart=calculateChart(birth,backend);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',digest:String(seed.toString(16)).padStart(64,'a'),
  checks:['N47_SYNTHETIC_QA_ONLY'],externalReferenceChecked:false};
 const n4=makeN4RcPayload(chart,verification);
 return {...chart,verification,n4,...(withD60?{n4D60:makeN4D60Candidate(chart,verification)}:{})};
}
test('N47 whole-life synthesis gives a specific D1 ruler, Moon and distinct source-backed themes UA/EN',()=>{
 const set=new Set();
 for(let seed=1;seed<=18;seed++){
  const chart=sample(seed);
  for(const lang of ['uk','en']){
   const report=buildClassicalReaderV8(chart,lang,'2026-11-08');
   assert.equal(report.status,'available');
   assert.ok(report.synthesis);
   assert.equal(report.synthesis.highlights.length,3);
   assert.equal(new Set(report.highlights.map(h=>h.division)).size,3);
   assert.match(report.synthesis.opening,/\d/);
   assert.ok(report.synthesis.opening.length>130);
   assert.ok(report.synthesis.strength.length>120);
   assert.ok(report.synthesis.challenge.length>120);
   assert.ok(report.synthesis.direction.length>120);
   assert.ok(report.synthesis.highlights.every(h=>h.text.length>85));
   assert.doesNotMatch(report.synthesis.opening,/П’ятнадцять запитань|fifteen questions|Тут є опора/iu);
   set.add(report.synthesis.opening);
   for(const insight of report.insights){
    assert.doesNotMatch(insight.strength,/^(У цій частині карти|Це один із тих сюжетів|Тут потенціал|This part of the chart)/u);
    assert.ok(insight.step.length>=39);
   }
  }
 }
 assert.ok(set.size>=24,'different births and locales must produce different real chart stories');
});
test('D60 safe preview appears only with fully bound source and never implies certified house accuracy',()=>{
 const chart=sample(3);
 for(const lang of ['uk','en']){
  const preview=buildD60Preview(chart,lang);
  assert.equal(preview.version,'d60-conditional-signs-n47-v1');
  assert.equal(preview.status,'conditional_signs');
  assert.ok(preview.factors.length>=1&&preview.factors.length<=3);
  for(const factor of preview.factors){
   const natal=chart.d1.find(p=>p.name===factor.planet);
   const fine=chart.n4D60.planets.find(p=>p.name===factor.planet);
   assert.equal(factor.d1Sign,natal.sign);
   assert.equal(factor.d60Sign,fine.sign);
   assert.ok(factor.boundaryDistanceArcseconds>=90);
   assert.doesNotMatch(factor.note,/past life|минуле життя|у 10-му домі|guarantee|карма/iu);
  }
  assert.match(preview.warning,/D60/);
 }
 assert.match(compactD60PreviewForAi(chart),/SIGN-ONLY/);
 for(const bad of [
  {...chart,n4D60:{...chart.n4D60,sourceDigest:'f'.repeat(64)}},
  {...chart,n4D60:{...chart.n4D60,d60HouseInterpretationEligible:true}},
  {...chart,n4D60:{...chart.n4D60,continuousTimeStabilityCertified:true}},
  {...chart,n4D60:null}
 ]){
  const preview=buildD60Preview(bad,'uk');
  assert.equal(preview.status,'unavailable');
  assert.equal(preview.factors.length,0);
 }
});
test('N47 never personalizes D60 without separate annex and keeps 15 safe core topics',()=>{
 const chart=sample(2,false);
 const reader=buildClassicalReaderV8(chart,'uk','2026-11-08');
 assert.equal(reader.status,'available');
 assert.equal(reader.insights.length,15);
 assert.equal(reader.d60Preview.status,'unavailable');
 assert.ok(!reader.insights.some(x=>x.division===60));
});
