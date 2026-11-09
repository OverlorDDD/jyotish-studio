import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {dignityFor} from '../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable,yogakarakasForLagna} from '../apps/api/src/reader-classical.ts';
import {buildEvidenceN493,N493_VERSION} from '../apps/api/src/reader-evidence-n493.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';

const G=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const ORDER=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60];
function fake(seed){
 const input={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
 const ephemeris={ayanamsa:23.8,ascendant:(12.713+seed*12.97)%360,
  julianDay:2451545,backend:'N493_SYNTHETIC_TEST_ONLY',
  positions:G.map((name,i)=>({name,longitude:(11+i*35.2+seed*(16.41+i*.31))%360,speed:.1}))};
 const original=calculateChart(input,ephemeris);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:seed.toString(16).padStart(64,'a'),
  checks:['SYNTHETIC_TEST_ONLY'],externalReferenceChecked:false};
 return {...original,verification,n4:makeN4RcPayload(original,verification),
  n4D60:makeN4D60Candidate(original,verification)};
}
test('N493 40 x two languages: prioritization, 2 distinct grahas, verified ledger, stable 16 cards and final narrative',()=>{
 const fingerprints={uk:new Set(),en:new Set()};
 const outputs=['# N4.9.3 GENERATED FULL OUTPUT REVIEW · invented birth vectors only',
  'Not a historical Jyotish certification, real user reading, or proof of predictive validity.'];
 for(let seed=1;seed<=40;seed++){
  const chart=fake(seed);
  for(const lang of ['uk','en']){
   const read=buildEvidenceN493(chart,lang,'2026-11-09');
   const full=buildClassicalReaderV8(chart,lang,'2026-11-09');
   assert.equal(full.status,'available');
   assert.deepEqual(full.quality,read);
   assert.equal(read.version,N493_VERSION);
   assert.ok(read.patterns.length>=3&&read.patterns.length<=5);
   assert.deepEqual(read.cards.map(x=>x.division),ORDER);
   assert.equal(new Set(read.patterns.map(x=>x.theme)).size,read.patterns.length);
   const patterns=[];
   for(const pattern of read.patterns){
    assert.ok(pattern.evidence.length>=2);
    assert.ok(pattern.ruleIds.length>=1);
    assert.ok(pattern.insight.length>=50&&pattern.insight.length<=650,
     'bad insight length '+seed+' '+lang+' '+pattern.id+' '+pattern.insight.length);
    assert.ok(pattern.context.length>=45);
    assert.ok(pattern.score>0);
    assert.doesNotMatch(pattern.insight+pattern.context,/will guarantee|guaranteed success|стовідсотков/i);
    patterns.push(pattern.title+' | '+pattern.insight+' '+pattern.context+
     ' | Evidence: '+pattern.evidence.join(' · '));
   }
   const openings=new Set();
   const cards=[];
   for(const card of read.cards){
    assert.doesNotMatch(card.meaning,
     /Для цієї сфери суттєвий зв’язок двох різних контекстів|перший показник — управитель|Другий незалежний показник|A distinct second indicator|two different contexts/i,
     'empty repetitive formula must not return');
    openings.add(card.meaning.slice(0,54));
    assert.ok(card.meaning.length>=110&&card.meaning.length<=1600,
     'bad card length '+seed+' '+lang+' D'+card.division+' '+card.meaning.length);
    assert.ok(card.proof.length>=2);
    assert.ok(card.ruleIds.length>=1);
    assert.doesNotMatch(card.meaning,/обидва ракурси повторюють|один із показників|100%|обов’язково станеться/i);
    if(card.division!==60){
     const planetNames=new Set(card.proof.map(x=>/^D\d+\.([A-Za-z]+)\.(?:sign|house)=/.exec(x)?.[1]).filter(Boolean));
     assert.ok(planetNames.size>=2,'expect two distinct planetary positions D'+card.division+' '+seed+' '+lang);
     const divSigns=card.proof.filter(x=>x.startsWith('D'+card.division+'.')&&x.includes('.sign='));
     assert.ok(divSigns.length>=2);
     assert.equal(card.proof[0],'D1.ascendant.sign='+chart.ascendant.sign);
    }else{
     assert.equal(card.status,'provisional');
     assert.equal(card.proof.filter(x=>x.startsWith('D60.')).length,9);
     assert.doesNotMatch(card.meaning,/D60.*(?:асцендент|лагна|houses)/i);
    }
    cards.push('### D'+card.division+' '+card.title+'\n'+card.meaning+
     '\n'+(card.context||'')+'\nEvidence: '+card.proof.join(' · '));
   }
   assert.ok(openings.size>=12,'15 divisions need distinct subject-specific language');
   const finale=read.summary.portrait+' '+read.summary.focus;
   assert.ok(finale.length>=280&&finale.length<=1900);
   assert.ok(read.summary.proof.length>=4);
   assert.ok(!finale.includes('undefined'));
   assert.doesNotMatch(finale,/знаків.*гарантовано|не очікуючи від однієї|між грошей/i);
   fingerprints[lang].add(read.patterns.map(x=>x.insight).join('/'));
   outputs.push('\n## Synthetic '+seed+'/'+lang+' (Asc '+chart.ascendant.sign+')'+
    '\n\n### TOP PATTERNS\n'+patterns.join('\n\n')+
    '\n\n### 16 CARDS\n'+cards.join('\n\n')+
    '\n\n### WHOLE-CHART SYNTHESIS\n'+finale+
    '\n\nEvidence: '+read.summary.proof.join(' · '));
   if([1,7,17,33].includes(seed)&&lang==='uk')
    console.log('N493_HUMAN_REVIEW_'+seed+' '+read.patterns.map(p=>p.title+':'+p.insight).join(' | '));
  }
 }
 assert.ok(fingerprints.uk.size>=36);
 assert.ok(fingerprints.en.size>=36);
 mkdirSync('qa-artifacts',{recursive:true});
 writeFileSync('qa-artifacts/n493-80-full-synthetic-readings.md',outputs.join('\n'),'utf8');
 console.log('N493_EVIDENCE_80_COMPLETE_READINGS_GENERATED_AND_CHECKED_PASS');
});
test('Cancer ascendant: Mars owns 5th and 10th, no unsupported sign claim',()=>{
 const l=classicalLordshipTable(4);
 assert.equal(l[5],'Mars');
 assert.equal(l[10],'Mars');
 assert.ok(yogakarakasForLagna(4).includes('Mars'));
 assert.equal(dignityFor('Mars',10),'exalted');
 assert.equal(dignityFor('Mercury',12),'debilitated');
});
test('Reject forged N4 source digest, even if fake sign values appear favorable',()=>{
 const c=fake(11);
 const forged={...c,n4:{...c.n4,sourceDigest:'f'.repeat(64)}};
 assert.equal(buildEvidenceN493(forged,'uk','2026-11-09'),null);
});
