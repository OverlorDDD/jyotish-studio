import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {classicalLordshipTable,yogakarakasForLagna} from '../apps/api/src/reader-classical.ts';
import {buildN492Meaning,N492_DIVISIONS} from '../apps/api/src/reader-meaning-n492.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const BODIES=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
function fixture(seed){
 const input={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
 const eph={ayanamsa:23.8,ascendant:(12.713+seed*11.37)%360,julianDay:2451545,
  backend:'N492_SYNTHETIC_QA_ONLY',
  positions:BODIES.map((name,i)=>({name,longitude:(11+i*35.2+seed*(16.41+i*.12))%360,speed:.1}))};
 const base=calculateChart(input,eph);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:seed.toString(16).padStart(64,'a'),checks:['SYNTHETIC_TEST_ONLY'],externalReferenceChecked:false};
 return {...base,verification,n4:makeN4RcPayload(base,verification),
  n4D60:makeN4D60Candidate(base,verification)};
}
function checkCase(chart,lang){
 const output=buildN492Meaning(chart,lang,'2026-11-09');
 assert.ok(output);
 assert.equal(output.version,'n492-meaning-first-16-v1');
 assert.deepEqual(output.cards.map(x=>x.division),N492_DIVISIONS);
 assert.equal(output.takeaways.length,3);
 const lords=classicalLordshipTable(chart.ascendant.sign);
 for(const card of output.cards){
  assert.ok(card.reading.length>65 && card.reading.length<1100,
   'short, real interpretive data '+lang+' D'+card.division+': '+card.reading.length);
  assert.ok(card.sourceFacts.length>=2 || card.division===60);
  assert.doesNotMatch(card.reading,/гарантовано|100%|will definitely|proved person|певне майбутнє/iu);
  assert.doesNotMatch(card.reading,/[.!?](?=[А-Яа-яІіЇїЄєҐґA-Za-z])/u,'run-on sentence');
  if(card.division!==60){
   const houses={1:1,2:2,3:3,4:4,7:5,9:7,10:10,12:4,16:4,20:9,24:5,27:1,30:6,40:4,45:9};
   const lord=lords[houses[card.division]];
   assert.ok(card.sourceFacts.includes('D1.'+lord+'.house='+chart.d1.find(p=>p.name===lord).house));
   if(card.division!==1)
    assert.ok(card.sourceFacts.some(x=>x.startsWith('D'+card.division+'.'+lord+'.sign=')));
   else assert.doesNotMatch(card.reading,/а в D1 —|and in D1 as well/);
  }else{
   assert.equal(card.sensitivity,'provisional');
   assert.ok(card.sourceFacts.every(x=>!/^D60\.[^.]+\.house=/.test(x)));
  }
  if(card.corroboration){
   assert.ok(card.sourceFacts.some(x=>/^D\d+\.[A-Z][A-Za-z]+\.sign=/.test(x)));
  }
 }
 assert.ok(output.takeaways.every(t=>t.text.length>90&&t.text.length<850&&t.sourceFacts.length>=2));
 assert.ok(output.cards[0].reading.includes(lang==='uk'?'Місяць':'Moon'));
 return output;
}
test('N4.9.2 48 distinct invented horoscopes × 2 languages produce 16 evidence-linked readings and distinct synthesis',()=>{
 const signatures={uk:new Set(),en:new Set()};
 const sample=[];
 for(let seed=1;seed<=48;seed++){
  const chart=fixture(seed);
  for(const lang of ['uk','en']){
   const report=buildClassicalReaderV8(chart,lang,'2026-11-09');
   assert.equal(report.status,'available');
   const out=checkCase(chart,lang);
   assert.deepEqual(report.meaningReader,out);
   signatures[lang].add(out.cards.map(c=>c.reading).join(' '));
   if([2,7,14,26,41].includes(seed)){
    const titles={uk:'Контрольний зразок',en:'Synthetic QA sample'};
    const care=out.cards.find(c=>c.division===10);
    sample.push('## '+titles[lang]+' '+seed+' '+lang+'\n'+
     'D1: '+out.cards[0].reading+'\nD9: '+out.cards.find(c=>c.division===9).reading+
     '\nD10: '+care.reading+'\nD10 link: '+(care.corroboration||'none')+
     '\nD60: '+out.cards.find(c=>c.division===60).reading+'\nSummary: '+
     out.takeaways.map(t=>t.text).join(' '));
    console.log('N492_EDITORIAL_SAMPLE '+seed+' '+lang+' D10='+care.reading);
   }
   if(chart.ascendant.sign===4)
    assert.ok(out.cards.find(c=>c.division===10).reading.includes(lang==='uk'?'йогакарака':'yogakaraka'),
     'Cancer ascendant must identify Mars yogakaraka');
  }
 }
 assert.ok(signatures.uk.size>=46&&signatures.en.size>=46,
  'repeated one-size-fits-all stories');
 mkdirSync('qa-artifacts',{recursive:true});
 writeFileSync(join('qa-artifacts','n492-synthetic-editorial-samples.md'),
  '# Synthetic chart editorial samples — NOT human certified\n\n'+sample.join('\n\n'),'utf8');
 console.log('N492_96_BILINGUAL_SAMPLES_16_CARDS_EDITORIAL_GATE_PASS');
});
test('reject unbound data and check conditional cross-varga links do not appear for every subject',()=>{
 const chart=fixture(9);
 const altered={...chart,verification:{...chart.verification,digest:'9'.repeat(64)}};
 assert.equal(buildN492Meaning(altered,'uk','2026-11-09'),null);
 const uk=checkCase(chart,'uk');
 const crossCount=uk.cards.filter(x=>x.corroboration).length;
 assert.ok(crossCount<14,'avoid mandatory fake comparisons just to fill screen');
 assert.ok(uk.cards.filter(x=>x.division!==60).length===15);
 assert.equal(yogakarakasForLagna(chart.ascendant.sign).every(g=>BODIES.includes(g)),true);
});
