/**
 * N4.9.2 authorial QA:
 * 30 synthetic (never real people) natal source cards × UA/EN.
 * Independent factual checking here uses chart values, while the mapping
 * shares the product code; it is NOT a historical astrology certification.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {classicalLordshipTable,yogakarakasForLagna} from '../apps/api/src/reader-classical.ts';
import {buildMeaningfulN492,N492_ORDER} from '../apps/api/src/reader-meaning-n492.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';
import {dignityFor} from '../packages/jyotish-core/src/rules.ts';

const planets=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const subjects={1:1,2:2,3:3,4:4,7:5,9:7,10:10,12:4,16:4,20:9,24:5,27:1,30:6,40:4,45:9};
function fixture(seed){
 const input={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
 const eph={ayanamsa:23.8,ascendant:(10.713+seed*13.37)%360,julianDay:2451545,
  backend:'SYNTHETIC_TEST_ONLY',
  positions:planets.map((name,i)=>({name,longitude:(11+i*35.2+seed*(16.41+i*.13))%360,speed:.1}))};
 const base=calculateChart(input,eph);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:seed.toString(16).padStart(64,'a'),checks:['SYNTHETIC_TEST_ONLY'],externalReferenceChecked:false};
 return {...base,verification,n4:makeN4RcPayload(base,verification),
  n4D60:makeN4D60Candidate(base,verification)};
}
test('N492 16 valid cards and chart-specific closing x 30 invented birth vectors x 2 languages',()=>{
 const sample=['# N4.9.2 · Independent editorial-output review of invented charts',
  'These are synthetic birth vectors, not actual users. Scientific or classical interpretive validity is NOT established by this evidence exercise.'];
 const seen={uk:new Set(),en:new Set()},notable=[];
 for(let seed=1;seed<=30;seed++){
  const chart=fixture(seed),lords=classicalLordshipTable(chart.ascendant.sign);
  const yoga=yogakarakasForLagna(chart.ascendant.sign);
  for(const lang of ['uk','en']){
   const report=buildClassicalReaderV8(chart,lang,'2026-11-09');
   assert.equal(report.status,'available');
   const result=report.meaningful;
   assert.equal(result.version,'n492-evidence-prioritized-16-varga-v1');
   assert.deepEqual(result.cards.map(x=>x.division),N492_ORDER);
   assert.equal(result.cards.length,16);
   const texts=[];
   for(const card of result.cards){
    assert.ok(card.title.length>5);
    assert.ok(card.meaning.length>=110&&card.meaning.length<=970, 'meaning length '+seed+'/'+lang+'/'+card.division+'/'+card.meaning.length);
    assert.doesNotMatch(card.meaning,/Обидва ракурси повторюють|заслуговує на окрему увагу|один із показників|D1[^\n]*а в D1|мінімальний обсяг|one of the indicators/i);
    if(lang==='uk')assert.doesNotMatch(card.meaning,/лагна у Овні|не рахуємо її двічі|важливий Венера|пов’язаний з Місяць/u,
      'do not leak grammar errors or editorial implementation jargon');
    assert.doesNotMatch(card.meaning,/сповнена гарантій|guaranteed fate|scientifically proven personality/i);
    if(lang==='en')assert.doesNotMatch(card.meaning,/[А-Яа-яІіЇїЄєҐґ]/u);
    assert.equal(card.division===60,card.status==='provisional');
    assert.ok(card.proof.every(p=>typeof p==='string'&&p.length>0));
    if(card.division!==60){
     const name=lords[subjects[card.division]];
     const natal=chart.d1.find(x=>x.name===name);
     const dn=chart.n4.charts.find(x=>x.division===card.division).planets.find(x=>x.name===name);
     assert.ok(card.proof.includes('D1.house-lord.'+subjects[card.division]+'='+name));
     assert.ok(card.proof.includes('D1.'+name+'.house='+natal.house));
     assert.ok(card.proof.includes('D'+card.division+'.'+name+'.sign='+dn.sign));
     if(card.division===1)assert.doesNotMatch(card.meaning,/а в D1 —|and in D1/iu);
     if(card.division===10&&yoga.includes(name)){
      assert.match(card.meaning,lang==='uk'?/йогакаракою/:/yogakaraka/);
      notable.push({seed,lang,asc:chart.ascendant.sign,planet:name});
     }
     if(card.division===10&&dignityFor(name,dn.sign)==='exalted')
      assert.match(card.meaning,lang==='uk'?/екзальтації/:/exaltation/);
    }else{
     assert.equal(card.proof.filter(p=>p.startsWith('D60.')).length,9);
     assert.doesNotMatch(card.meaning,/D60\..*\.house|D60 .*асцендент|D60 lagna/i);
    }
    assert.ok(!card.connection||card.connection.length>=60);
    texts.push('### D'+card.division+' — '+card.title+'\n'+card.meaning+
     (card.connection?'\nCross-chart evidence: '+card.connection:'')+
     '\nEvidence: '+card.proof.join(' · '));
   }
   const d60=report.d60Preview;
   const d60Selected=d60.factors[0];
   if(d60Selected&&d60Selected.d1Sign===d60Selected.d60Sign&&lang==='uk')
    assert.doesNotMatch(result.cards[15].meaning,/цю різницю|два різні/u,
     'same D1 and D60 sign must not be called different');
   if(d60Selected&&d60Selected.d1Sign===d60Selected.d60Sign&&lang==='en')
    assert.doesNotMatch(result.cards[15].meaning,/these two placements differ|a different sign/i);
   assert.doesNotMatch(result.summary.attention,
    /пов’язаний із (?:грошей|праці|професії)|між грошей|та грошей|між праці|та праці|between .* and \\1/i);
   assert.doesNotMatch(result.summary.strength,/»\\.D\\d+|\\.D\\d+:/u,
    'must separate adjacent sentences and dignity evidence');
   assert.doesNotMatch(result.summary.direction,/Ваша карта не зводиться до|does not reduce to a concentration|не очікуючи від однієї з них відповіді/i);
   if(lang==='uk')assert.doesNotMatch(result.summary.direction,/пов’язаний з (?:Місяць|Венера|Марс|Сатурн|Меркурій|Юпітер)|кар’єра — з (?:Марс|Венера|Місяць|Сатурн|Меркурій)/u,
     'Ukrainian case must be correct in the final summary');
   if(lords[1]===lords[10]){
    assert.match(result.summary.direction,lang==='uk'?/одночасно керує/:/same /,
     'same natal lord should be synthesized, not listed twice without explanation');
   }
   assert.doesNotMatch(result.summary.direction,/Ваша карта не зводиться до одного скупчення|one planetary concentration/i);
   const d9=result.cards.find(c=>c.division===9);
   if(lords[7]==='Venus')assert.doesNotMatch(d9.meaning,/а Венера —|Venus occupies .* and Venus occupies/i,
    'do not double-count the exact same Venus');
   assert.ok(result.summary.direction.length>=100);
   assert.ok(result.summary.direction.length<=640);
   assert.ok(result.summary.strength.length<=500);
   assert.ok(result.summary.attention.length<=330);
   assert.ok(result.summary.proof.length>=4);
   const fingerprint=result.cards.slice(0,3).map(c=>c.meaning).join(' ');
   seen[lang].add(fingerprint);
   sample.push('\n## Vector '+seed+' / '+lang+' · Ascendant '+chart.ascendant.sign+
    '\n'+texts.join('\n\n')+'\n\n**Closing:** '+result.summary.strength+
    '\n\n**Watch:** '+result.summary.attention+
    '\n\n**Direction:** '+result.summary.direction);
   if([1,6,12,24].includes(seed)&&lang==='uk')
    console.log('N492_REVIEW_VECTOR_'+seed+': '+result.cards.filter(c=>[1,9,10,60].includes(c.division))
     .map(c=>'D'+c.division+':'+c.meaning.slice(0,250)).join(' | '));
  }
 }
 assert.ok(seen.uk.size>=28&&seen.en.size>=28);
 assert.ok(notable.length>=2,'need several actual yogakaraka cases');
 mkdirSync('qa-artifacts',{recursive:true});
 writeFileSync('qa-artifacts/n492-60-complete-synthetic-readings.md',sample.join('\n'),'utf8');
 console.log('N492_ALL_16_COMPLETE_30_VECTORS_UK_EN_EDITORIAL_OUTPUT_PASS');
});
