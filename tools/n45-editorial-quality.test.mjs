import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';
import {N45_EDITORIAL_VERSION} from '../apps/api/src/reader-editorial-n45.ts';

const bodies=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const birth={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
function fixture(seed){
 const ephemeris={ayanamsa:23.8,ascendant:11.317+seed*7.43,julianDay:2451545,
  backend:'N45_EDITORIAL_SYNTHETIC_DO_NOT_PERSONALIZE',
  positions:bodies.map((name,i)=>({name,longitude:(17+i*34.71+seed*(13.37+i*.61))%360,speed:.1}))};
 const chart=calculateChart(birth,ephemeris);
 const proof={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:String(seed.toString(16)||'0').padStart(64,'a'),checks:['SYNTHETIC_QA'],externalReferenceChecked:false};
 return {...chart,verification:proof,n4:makeN4RcPayload(chart,proof)};
}
const banned=[
 /додатков(ий|ого) показник підтримує/u,
 /класичне правило застосовано/u,
 /давній принцип тут застосовано/u,
 /сучасним тематичним орієнтиром/u,
 /власним досвідом, а не наперед/u,
 /додаткового прямого класичного правила/u,
 /одна з можливих складнощів:/u,
 /один(?:\s+)?маленький крок:/u,
 /тема може бути корисною для уваги зараз/u,
 /another checked factor reinforces this theme/iu,
 /no specific additional classical rule/iu,
 /one more small step/iu,
 /traditional placement gives this angle more weight/iu,
 /modern thematic lens/iu,
 /D60\s+(?:гарантує|визначає)/iu
];
test('Reader 8.1 has fifteen actual stories with concrete steps and book evidence kept outside main prose',()=>{
 for(let seed=0;seed<18;seed++){
  const chart=fixture(seed);
  for(const lang of ['uk','en']){
   const r=buildClassicalReaderV8(chart,lang,'2026-11-07');
   assert.equal(r.status,'available');
   assert.equal(r.editorialVersion,N45_EDITORIAL_VERSION);
   assert.equal(r.insights.length,15);
   assert.equal(r.highlights.length,3);
   const titles=new Set(),actions=new Set(),starts=new Set();
   for(const insight of r.insights){
    titles.add(insight.title);actions.add(insight.step);starts.add(insight.headline);
    assert.ok(insight.headline.length>65,lang+' insufficient reader hook D'+insight.division);
    assert.ok(insight.strength.length>100,lang+' insufficient useful support D'+insight.division);
    assert.ok(insight.challenge.length>105,lang+' insufficient specific tension D'+insight.division);
    assert.ok(insight.context.length>110,lang+' insufficient real-life context D'+insight.division);
    assert.ok(insight.step.length>=39,lang+' action is too vague D'+insight.division);
    const prose=[insight.headline,insight.strength,insight.context,insight.challenge,insight.step].join(' ');
    for(const pattern of banned)assert.doesNotMatch(prose,pattern,lang+' boilerplate D'+insight.division);
    assert.doesNotMatch(prose,/^(?:D1|D9|D10|D27|D30)\b/m,'unexplained chart code');
    assert.doesNotMatch(prose,/nakshatra|антардаша|душтхана|yogakaraka|шадбала/iu,'jargon in main prose');
    assert.ok(insight.proof.some(e=>e.startsWith('D'+insight.division+'.')),
      'thematic placement must be bound D'+insight.division);
    assert.ok(insight.proof.some(e=>e.startsWith('D1.')),'natal comparison must be bound');
   }
   assert.equal(titles.size,15,'each area has its own name');
   assert.equal(starts.size,15,'all headline hooks must differ by topic');
   assert.equal(actions.size,15,'all recommended actions must differ by topic');
   assert.ok(r.highlights.every(x=>x.text.length>80),'top three should contain a real question and a concrete action');
   assert.ok(new Set(r.highlights.map(x=>x.division)).size>=2,'summaries should not be the same chart');
   assert.ok(!r.insights.some(x=>x.division===60),'D60 never receives personal phala');
  }
 }
});
test('Real computed factors change the text, not only the technical evidence below it',()=>{
 const reports=Array.from({length:28},(_,i)=>buildClassicalReaderV8(fixture(i),'uk','2026-11-07'));
 for(const division of [2,9,10,24,27,30]){
  const field=(r)=>{const x=r.insights.find(i=>i.division===division);return x.strength+'|'+x.challenge+'|'+x.context+'|'+x.step};
  assert.ok(new Set(reports.map(field)).size>=9,'meaningful individual variation expected in D'+division);
  assert.ok(new Set(reports.map(r=>r.insights.find(i=>i.division===division).step)).size>=3,
   'action selection should follow actual house context in D'+division);
 }
 const headlines=reports.map(r=>r.highlights.map(h=>h.title+' '+h.text).join(' '));
 assert.ok(new Set(headlines).size>=8,'lead takeaways must vary between people');
});
test('An incomplete or forged natal source never produces a lyrical but unsupported reading',()=>{
 const chart=fixture(2);
 for(const source of [
  {...chart,n4:null},
  {...chart,n4:{...chart.n4,sourceDigest:'f'.repeat(64)}},
  {...chart,n4:{...chart.n4,d60Excluded:false}}
 ]){
  const r=buildClassicalReaderV8(source,'uk','2026-11-07');
  assert.equal(r.status,'unavailable');assert.equal(r.insights.length,0);
 }
});
