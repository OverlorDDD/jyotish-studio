import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {buildN493Overview} from '../apps/api/src/reader-insights-n493.ts';
import {buildN493ThematicDetail,N493_THEMATIC_DIVISIONS} from '../apps/api/src/reader-detail-n493.ts';
import {buildHumanReaderCard,buildHumanReaderSummary} from '../apps/api/src/reader-human-n495.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';
import {yogakarakasForLagna,classicalLordshipTable} from '../apps/api/src/reader-classical.ts';
import {dignityFor} from '../packages/jyotish-core/src/rules.ts';
const planets=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
function fixture(seed){
 const birth={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
 const ephemeris={ayanamsa:23.8,ascendant:(10.713+seed*13.37)%360,julianDay:2451545,
  backend:'SYNTHETIC_TEST_ONLY',
  positions:planets.map((name,i)=>({name,longitude:(11+i*35.2+seed*(16.41+i*.13))%360,speed:.1}))};
 const base=calculateChart(birth,ephemeris);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:seed.toString(16).padStart(64,'a'),checks:['SYNTHETIC_TEST_ONLY'],externalReferenceChecked:false};
 return {...base,verification,n4:makeN4RcPayload(base,verification),
  n4D60:makeN4D60Candidate(base,verification)};
}
test('N493 prioritizes 3-5 sourced discoveries, avoids false double votes, integrates with 16 cards × 60 invented charts',()=>{
 const full=['# N4.9.3 — complete editorial output of synthetic invented charts',
  'Purpose: inspect interpretive utility; this is not observational validation of predictions.'];
 const signatures={uk:new Set(),en:new Set()},observedCancer=[];
 for(let seed=1;seed<=60;seed++){
  const chart=fixture(seed),lords=classicalLordshipTable(chart.ascendant.sign);
  for(const lang of ['uk','en']){
   const direct=buildN493Overview(chart,lang);
   const report=buildClassicalReaderV8(chart,lang,'2026-11-09');
   assert.equal(report.status,'available');
   const reading=report.meaningful;
   assert.equal(reading.cards.length,16);
   assert.deepEqual(reading.discoveries,direct);
   assert.equal(direct.version,'n493-ranked-patterns-1.0.0');
   assert.ok(direct.insights.length>=3&&direct.insights.length<=5);
   assert.equal(new Set(direct.insights.map(x=>x.id)).size,direct.insights.length);
   assert.ok(direct.insights.every(x=>x.proof.length>=3));
   assert.deepEqual(direct.insights.map(x=>x.prominence),[...direct.insights.map(x=>x.prominence)].sort((a,b)=>b-a));
   assert.doesNotMatch(JSON.stringify(direct),/"date"\s*:|"time"\s*:|"longitude"\s*:|"latitude"\s*:/);
   assert.ok(!direct.insights.some(x=>x.id==='career')||!direct.insights.some(x=>x.id==='education')||
      lords[10]!==lords[5], 'same ruler repeated as independent career and education finding');
   for(const item of direct.insights){
    assert.ok(item.headline.length>=18&&item.headline.length<=130);
    assert.ok(item.teaser.length>=30&&item.teaser.length<=245, JSON.stringify({seed,lang,id:item.id,teaser:item.teaser}));
    assert.ok(item.interpretation.length>=105&&item.interpretation.length<=980,
     JSON.stringify({seed,lang,id:item.id,len:item.interpretation.length}));
    assert.ok(item.attention.length>=40);
    assert.ok(reading.cards.find(x=>x.division===item.division));
    assert.ok(item.proof.every(e=>typeof e==='string'&&!e.includes('undefined')));
    assert.doesNotMatch(item.teaser,/шаблон|one of the indicators|unknown rule means|100%/i);
    if(lang==='en')assert.doesNotMatch(item.headline+' '+item.teaser+' '+item.interpretation,/[А-Яа-яІіЇїЄєҐґ]/u);
    // Evidence must reference facts in specific D charts, not narrative labels.
    assert.ok(item.proof.some(e=>e.startsWith('D1.')));
    if(item.id==='career'){
     const planet=lords[10],b=chart.n4.charts.find(x=>x.division===10).planets.find(x=>x.name===planet);
     assert.equal(item.planet,planet);
     assert.ok(item.proof.includes('D10.'+planet+'.sign='+b.sign));
     if(yogakarakasForLagna(chart.ascendant.sign).includes(planet)){
      assert.ok(item.proof.includes('D1.house-lord.5='+planet), 'functional yogakaraka must remain in proof');
      if(chart.ascendant.sign===4)observedCancer.push({seed,lang,planet});
     }
     if(item.relatedDivisions.includes(24)){
      const other=chart.n4.charts.find(x=>x.division===24).planets.find(x=>x.name===planet);
      assert.ok(['exalted','own'].includes(dignityFor(planet,other.sign)));
      assert.ok(['exalted','own'].includes(dignityFor(planet,b.sign)));
      assert.ok(item.proof.includes('D24.'+planet+'.sign='+other.sign), 'linked varga must be traceable without repetition');
     }
    }
   }
   assert.ok(direct.summary.length>120&&direct.summary.length<600);
   assert.equal(direct.summary,buildHumanReaderSummary(chart,lang).overview);
   const prefix=lang==='uk'?'Астрологічна основа:':'Astrological basis:';
   for(const finding of direct.insights){
    assert.ok(finding.interpretation.includes(prefix),
     'every discovery needs just one compact evidence line');
    assert.equal(finding.interpretation.split(prefix).length,2);
    const readable=buildHumanReaderCard(chart,lang,finding.division);
    if(['career','relationships','identity','resources','education'].includes(finding.id)){
     assert.equal(finding.interpretation,readable.meaning);
     assert.equal(finding.teaser,readable.teaser);
    }
   }
   for(const div of [1,2,9,10,24]){
    const card=reading.cards.find(x=>x.division===div);
    const readable=buildHumanReaderCard(chart,lang,div);
    assert.equal(card.meaning,readable.meaning);
    assert.equal(card.connection,null);
   }
   assert.ok(!reading.cards.slice(0,15).some(c=>c.meaning.includes('Обидва ракурси повторюють')));
   for(const div of N493_THEMATIC_DIVISIONS){
    const card=reading.cards.find(x=>x.division===div);
    const detail=buildN493ThematicDetail(chart,lang,div);
    assert.ok(detail);
    assert.notEqual(detail.primary,detail.secondary,'one planet must not count as two');
    assert.ok(detail.proof.some(x=>x.startsWith('D'+div+'.'+detail.primary+'.sign=')));
    assert.ok(detail.proof.some(x=>x.startsWith('D'+div+'.'+detail.secondary+'.sign=')));
    assert.ok(card.proof.some(x=>x.startsWith('D'+div+'.'+detail.secondary+'.sign=')));
    const readable=buildHumanReaderCard(chart,lang,div);
    assert.ok(readable);
    assert.equal(card.meaning,readable.meaning,'client-facing card must be person-first');
    assert.match(card.meaning,lang==='uk'?/Астрологічна основа:/u:/Astrological basis:/);
    assert.equal((card.meaning.match(lang==='uk'?/D\d+/gu:/D\d+/g)||[]).length,2,
     'one D1/Dn evidence sentence, not repeated calculation prose');
    assert.ok(card.meaning.indexOf(lang==='uk'?'Астрологічна основа:':'Astrological basis:')>200,
     'person-first narrative must precede technical source line');
    assert.ok(detail.meaning.length>=260&&detail.meaning.length<940,
     JSON.stringify({seed,lang,division:div,len:detail.meaning.length}));
    assert.match(detail.meaning,lang==='uk'?/Практичний крок:/u:/A practical next step:/,
     'Every subject card must translate evidence into one concrete topic-specific next step');
    assert.ok(detail.meaning.includes(lang==='uk'?'D1':'D1')&&
      detail.meaning.includes('D'+div), 'interpretation must bridge D1 and thematic varga');
    if(lang==='uk')assert.doesNotMatch(detail.meaning,
     /підтримка присутня у (?:Сонце|Місяць|Марс|Меркурій|Юпітер|Венера|Сатурн)|поєднує дім і внутрішня опора|важливий Венера/u,
     'real generated Ukrainian case and subject grammar must be natural');

   }
   if(lang==='uk'){
    const all=reading.cards.map(c=>c.meaning).join(' ');
    assert.doesNotMatch(all,
     /від дім і внутрішня опора|від щоденна практика|акцент на турбота|акцент на увага до деталей|через практики навички|через самостійно розпочатого завдання|пов’язана із ініціативою|поєднання [A-Za-z]+ — традиційно пов’язана/u,
     'generated Ukrainian must not contain previously observed case/agreement defects');
   }
   const sample=direct.insights.map(x=>x.id+' '+x.headline+'\n'+x.teaser+'\n'+x.interpretation+
    '\nAttention: '+x.attention+'\nEvidence: '+x.proof.join(' · ')).join('\n\n');
   full.push('\n## Seed '+seed+' · '+lang+' · Asc '+chart.ascendant.sign+'\n'+sample+
    '\n### Life area cards\n'+reading.cards.map(x=>'D'+x.division+' '+x.title+': '+x.meaning).join('\n\n')+
    '\n### Final\n'+reading.summary.strength+'\n'+reading.summary.attention+'\n'+direct.summary);
   signatures[lang].add(direct.insights.map(i=>i.id+':'+i.headline+':'+i.interpretation).join(''));
   if([1,6,12,24].includes(seed)&&lang==='uk')
    console.log('N493_EDITORIAL_REVIEW_'+seed+': '+direct.insights.map(x=>x.id+'='+x.teaser).join(' | '));
  }
 }
 assert.ok(signatures.uk.size>=58&&signatures.en.size>=58);
 assert.ok(observedCancer.length>=1,'Cancer lagna/Mars must be covered');
 mkdirSync('qa-artifacts',{recursive:true});
 writeFileSync('qa-artifacts/n493-120-synthetic-reader-reports.md',full.join('\n'),'utf8');
 console.log('N493_120_READER_OUTPUTS_QA_PASS');
});
