import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {classicalLordshipTable} from '../apps/api/src/reader-classical.ts';
import {buildN491Cards,n491Contrast} from '../apps/api/src/reader-compact-n491.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';
import {buildD60Preview} from '../apps/api/src/reader-d60-n47.ts';

const bodies=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const house={1:1,2:2,3:3,4:4,7:5,9:7,10:10,12:4,16:4,20:9,24:5,27:1,30:6,40:4,45:9};
const related={1:9,2:10,3:27,4:12,7:9,9:7,10:24,12:4,16:4,20:9,24:10,27:30,30:27,40:12,45:9};
function fixture(seed){
 const input={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
 const eph={ayanamsa:23.8,ascendant:(12.713+seed*11.37)%360,julianDay:2451545,
  backend:'N491_SYNTHETIC_ONLY',
  positions:bodies.map((name,i)=>({name,longitude:(11+i*35.2+seed*(16.41+i*.12))%360,speed:.1}))};
 const base=calculateChart(input,eph);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:seed.toString(16).padStart(64,'a'),checks:['SYNTHETIC_TEST_ONLY'],externalReferenceChecked:false};
 return {...base,verification,n4:makeN4RcPayload(base,verification),
  n4D60:makeN4D60Candidate(base,verification)};
}
test('N491 gives 15 concise chart-specific D stories grounded in D1 and one related division',()=>{
 const distinct={uk:new Set(),en:new Set()};
 for(let seed=1;seed<=24;seed++){
  const chart=fixture(seed),lords=classicalLordshipTable(chart.ascendant.sign);
  for(const lang of ['uk','en']){
   const cards=buildN491Cards(chart,lang);
   const report=buildClassicalReaderV8(chart,lang,'2026-11-09');
   assert.equal(report.status,'available');
   assert.equal(cards.length,15);
   assert.deepEqual(report.compactCards,cards);
   assert.equal(new Set(cards.map(c=>c.division)).size,15);
   for(const card of cards){
    const ruler=lords[house[card.division]];
    const original=chart.d1.find(p=>p.name===ruler);
    const subject=chart.n4.charts.find(c=>c.division===card.division).planets.find(p=>p.name===ruler);
    const companion=chart.n4.charts.find(c=>c.division===related[card.division]).planets.find(p=>p.name===ruler);
    assert.equal(card.relatedDivision,related[card.division]);
    assert.ok(card.relatedDivision!==card.division);
    assert.ok(card.proof.includes('D1.'+ruler+'.house='+original.house));
    assert.ok(card.proof.includes('D'+card.division+'.'+ruler+'.sign='+subject.sign));
    assert.ok(card.proof.includes('D'+card.division+'.'+ruler+'.house='+subject.house));
    assert.ok(card.proof.includes('D'+card.relatedDivision+'.'+ruler+'.sign='+companion.sign));
    assert.ok(card.proof.includes('D'+card.relatedDivision+'.'+ruler+'.house='+companion.house));
    assert.match(card.connection,new RegExp('D'+card.relatedDivision+'\\b'));
    assert.ok(card.lead.length>=90&&card.lead.length<=440);
    assert.ok(card.connection.length>=50&&card.connection.length<=300);
    assert.ok(['agreement','conflict','care','unresolved'].includes(card.contrast));
    assert.doesNotMatch(card.lead+' '+card.connection,/гарантовано|100%|will definitely|past life|карма|shadbala/i);
    if(lang==='uk')assert.doesNotMatch(card.lead+' '+card.connection,/важливий Венера|той самий Венера|тема домом|тема спільними/i);

   }
   const serial=JSON.stringify(cards);
   assert.doesNotMatch(serial,/"(?:latitude|longitude|date|time|birthDate|place)"\s*:/i);
   distinct[lang].add(cards.map(c=>c.lead+c.connection).join(' '));
  }
 }
 for(const lang of ['uk','en'])assert.ok(distinct[lang].size>=23);
});
test('D60 all nine computed signs are returned, including near-boundary placements marked uncertain, without unsupported D60 house claims',()=>{
 const c=fixture(3);
 const preview=buildD60Preview(c,'uk');
 assert.equal(preview.status,'conditional_signs');
 assert.equal(preview.allPlanets.length,9);
 for(const p of preview.allPlanets){
  const natal=c.d1.find(x=>x.name===p.planet);
  const fine=c.n4D60.planets.find(x=>x.name===p.planet);
  assert.equal(p.d1Sign,natal.sign);
  assert.equal(p.d60Sign,fine.sign);
  assert.equal(p.boundaryDistanceArcseconds,fine.boundaryDistanceArcseconds);
 }
 const changed={...c,n4D60:{...c.n4D60,planets:c.n4D60.planets.map(p=>
  p.name==='Moon'?{...p,boundaryDistanceArcseconds:30}:p)}};
 const close=buildD60Preview(changed,'en');
 assert.equal(close.status,'conditional_signs');
 assert.equal(close.allPlanets.length,9);
 assert.equal(close.allPlanets.find(p=>p.planet==='Moon').nearBoundary,true);
 assert.equal(close.factors.some(p=>p.planet==='Moon'),false);
 assert.ok(!JSON.stringify(close).includes('D60.Moon.house'));
 const forged={...c,n4D60:{...c.n4D60,sourceDigest:'f'.repeat(64)}};
 assert.equal(buildD60Preview(forged,'uk').status,'unavailable');
 assert.equal(buildD60Preview(forged,'uk').allPlanets.length,0);
});
test('n491Contrast treats unknown signs as unknown, not negative',()=>{
 assert.equal(n491Contrast('own','exalted'),'agreement');
 assert.equal(n491Contrast('own','debilitated'),'conflict');
 assert.equal(n491Contrast('debilitated','other'),'care');
 assert.equal(n491Contrast('other','other'),'unresolved');
});
