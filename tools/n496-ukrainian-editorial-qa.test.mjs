import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {buildHumanReaderCard} from '../apps/api/src/reader-human-n495.ts';

const planets=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const examples=[1,2,4,9,10];
function fixture(seed){
 const input={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
 const eph={ayanamsa:23.8,ascendant:(10.713+seed*13.37)%360,julianDay:2451545,
  backend:'SYNTHETIC_TEST_ONLY',
  positions:planets.map((name,i)=>({name,longitude:(11+i*35.2+seed*(16.41+i*.13))%360,speed:.1}))};
 const base=calculateChart(input,eph);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:seed.toString(16).padStart(64,'a'),checks:['SYNTHETIC_TEST_ONLY'],
  externalReferenceChecked:false};
 return {...base,verification,n4:makeN4RcPayload(base,verification),
  n4D60:makeN4D60Candidate(base,verification)};
}
test('N496 never exposes broken case grammar in five human-first Ukrainian chapter openings',()=>{
 const rejected=/(?:через|із|зі|потреба в|пов’язаний із|карта виділяє)\s+(?:дому|довіри|матеріальної|самостійних|взаємності|щоденної|знань|творчості|сміливості|професійної|спільних|власного)\b/iu;
 const seen={uk:new Set(),en:new Set()};
 for(let seed=1;seed<=35;seed++){
  const chart=fixture(seed);
  for(const lang of ['uk','en']){
   const cards=examples.map(div=>{
    const card=buildHumanReaderCard(chart,lang,div);
    assert.ok(card,seed+' '+lang+' D'+div);
    assert.match(card.meaning,lang==='uk'?/Практичний крок:/u:/Practical step:/);
    assert.match(card.meaning,lang==='uk'?/Астрологічна основа:/u:/Astrological basis:/);
    const story=card.meaning.split(lang==='uk'?'Практичний крок:':'Practical step:')[0];
    assert.ok(story.length>=150,JSON.stringify({seed,lang,div,story}));
    if(lang==='uk'){
     assert.doesNotMatch(story,rejected,JSON.stringify({seed,div,story}));
     assert.doesNotMatch(story,/Фінансовий спокій[^.]*\. Фінансова впевненість/u);
    }else assert.doesNotMatch(story,/[А-Яа-яІіЇїЄєҐґ]/u);
    return story;
   });
   assert.equal(new Set(cards).size,5,'five chapters must not be identical');
   seen[lang].add(cards.join('\n'));
  }
 }
 assert.ok(seen.uk.size>=30&&seen.en.size>=30,'varied charts require varied narratives');
 console.log('N496_35_CHARTS_FIVE_TOPICS_UK_EN_GRAMMAR_AND_DISTINCTNESS_PASS');
});

test('N497 all fifteen D1–D45 interpretations are specific, bilingual and evidence-linked on 35 invented charts',()=>{
 const all=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45];
 const rejected=/(?:У близьких стосунках вам варто звертати увагу на тему|Успадковані способи турботи та материнські приклади зачіпають тему)/u;
 for(let seed=1;seed<=35;seed++){
  const chart=fixture(seed);
  for(const lang of ['uk','en']){
   const cards=all.map(div=>{
    const result=buildHumanReaderCard(chart,lang,div);
    assert.ok(result,'missing '+lang+' D'+div+' seed='+seed);
    assert.match(result.meaning,lang==='uk'?/Практичний крок:/u:/Practical step:/);
    assert.match(result.meaning,lang==='uk'?/Астрологічна основа:/u:/Astrological basis:/);
    const story=result.meaning.split(lang==='uk'?'Практичний крок:':'Practical step:')[0];
    assert.ok(story.length>=120,'too little human interpretation '+lang+' D'+div);
    assert.doesNotMatch(story,rejected);
    if(lang==='en')assert.doesNotMatch(story,/[А-Яа-яІіЇїЄєҐґ]/u);
    return story;
   });
   assert.equal(cards.length,15);
   assert.ok(new Set(cards).size>=13,'varga-specific paragraphs should not become copies');
  }
 }
 console.log('N497_35_CHARTS_15_VARGAS_BILINGUAL_SOURCE_BOUND_PASS');
});
