import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {buildHumanReaderCard,buildHumanReaderSummary} from '../apps/api/src/reader-human-n495.ts';

const repoFile=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const main=[1,2,10,9,4];
const divisions=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45];
const grahas=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
function inventedChart(seed){
 const input={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
 const eph={ayanamsa:23.8,ascendant:(10.713+seed*13.37)%360,julianDay:2451545,
  backend:'SYNTHETIC_TEST_ONLY',
  positions:grahas.map((name,i)=>({name,longitude:(11+i*35.2+seed*(16.41+i*.13))%360,speed:.1}))};
 const base=calculateChart(input,eph);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:seed.toString(16).padStart(64,'a'),checks:['SYNTHETIC_TEST_ONLY'],
  externalReferenceChecked:false};
 return {...base,verification,n4:makeN4RcPayload(base,verification),
  n4D60:makeN4D60Candidate(base,verification)};
}
const storyOf=(card,lang)=>card.meaning.split(lang==='uk'?'Практичний крок:':'Practical step:')[0].trim();
const sentenceSet=text=>new Set(text.split(/(?<=[.!?])\s+/u).map(x=>x.trim()).filter(x=>x.length>=65));

test('Reader 9 keeps the approved five-theme, sixteen-varga UI and keeps proof opt-in',()=>{
 const view=repoFile('apps/web/app/components/ReaderN492View.tsx');
 const page=repoFile('apps/web/app/astrology/jyotish/page.tsx');
 const report=repoFile('apps/web/app/components/DetailedReport.tsx');
 const human=repoFile('apps/api/src/reader-human-n495.ts');
 assert.match(view,/data-reader-edition="9"/);
 assert.match(view,/READER 9 · ПЕРСОНАЛЬНЕ ТРАКТУВАННЯ/);
 assert.match(page,/Читати без AI — класичне трактування/);
 assert.match(page,/Read without AI — classic reading/);
 assert.match(report,/Reader 9 · цілісне традиційне прочитання/);
 assert.match(view,/data-testid="reader-n497-varga-map"/);
 assert.match(view,/<ol className=\{book\.vargaGrid\}>/);
 assert.match(view,/<details className=\{book\.evidence\}/);
 assert.match(view,/data-testid="reader-n492-final"/);
 assert.match(view,/data-testid="reader-n492-d60-nine"/);
 assert.doesNotMatch(human,/Замість ще одного опису сфери|Rather than repeating its label/);
 assert.doesNotMatch(human,/\+\s*arena\s*\+/);
 assert.doesNotMatch(human,/const secondSentence=/);
});

test('Reader 9: 60 invented charts, 16 divisions, bilingual subject relevance and unique life chapters',()=>{
 const finalUk=new Set(),finalEn=new Set();
 for(let seed=1;seed<=60;seed++){
  const chart=inventedChart(seed);
  for(const lang of ['uk','en']){
   const cards=new Map(divisions.map(div=>[div,buildHumanReaderCard(chart,lang,div)]));
   for(const [div,card] of cards){
    assert.ok(card,'missing '+lang+' seed='+seed+' D'+div);
    assert.match(card.meaning,lang==='uk'?/Практичний крок:/u:/Practical step:/u);
    assert.match(card.meaning,lang==='uk'?/Астрологічна основа:/u:/Astrological basis:/u);
    assert.match(card.basis,new RegExp('D'+div+'\\b'),'source D'+div+' seed='+seed);
    const story=storyOf(card,lang);
    assert.ok(story.length>=120,'short '+lang+' D'+div+' seed='+seed+' '+story);
    if(lang==='en')assert.doesNotMatch(story,/[А-Яа-яІіЇїЄєҐґ]/u);
   }
   const chapters=main.map(div=>storyOf(cards.get(div),lang));
   assert.equal(new Set(chapters).size,5,'five main chapters must be distinct');
   // No long identical borrowed sentence between two different main topics.
   for(let i=0;i<chapters.length;i++){
    const a=sentenceSet(chapters[i]);
    for(let j=i+1;j<chapters.length;j++)
     for(const sentence of sentenceSet(chapters[j]))
      assert.ok(!a.has(sentence),'duplicated sentence D'+main[i]+'/D'+main[j]+' seed='+seed+' '+lang+': '+sentence);
   }
   const incorrect=lang==='uk'?
    [/у навчанні або передачі досвіду|у виконанні професійного завдання/u,
     /у розв’язанні складної щоденної задачі|у виконанні професійного завдання/u,
     /у домовленостях із партнером|у розв’язанні складної щоденної задачі/u]:
    [/when learning or sharing what you know|when taking responsibility for a result at work/u,
     /when dealing with a demanding everyday task|when taking responsibility for a result at work/u,
     /when making agreements with a partner|when dealing with a demanding everyday task/u];
   for(const [ix,div] of [9,7,20].entries())
    assert.doesNotMatch(storyOf(cards.get(div),lang),incorrect[ix],'cross-topic splice '+lang+' D'+div);
   const summary=buildHumanReaderSummary(chart,lang);
   assert.ok(summary.direction.length>=165,'summary must be a real synthesis');
   assert.equal(summary.references.length,3,'three source-bound core subjects');
   assert.doesNotMatch(summary.direction,/перевірте один професійний задум невеликим проєктом|testing one vocational idea with a small project/iu);
   (lang==='uk'?finalUk:finalEn).add(summary.direction);
   const d60=buildHumanReaderCard(chart,lang,60);
   if(d60){
    assert.match(d60.basis,/D1.*D60/s);
    assert.ok(storyOf(d60,lang).length<1100,'D60 should be concise and avoid chained secondary personalities');
    assert.doesNotMatch(storyOf(d60,lang),/У сфері .* може знадобитися поєднати звичку |With .* you may need to combine the familiar wish/u);
   }
  }
 }
 assert.ok(finalUk.size>=30&&finalEn.size>=30,'summaries must meaningfully vary across 60 charts');
 console.log('READER9_60_CHART_BILINGUAL_SUBJECT_QA_PASS');
});

test('Reader 9 never invents a varga reading when source verification is absent',()=>{
 const full=inventedChart(9),without={...full,n4:undefined};
 for(const lang of ['uk','en']){
  for(const division of divisions){
   assert.equal(buildHumanReaderCard(without,lang,division),null,'verified source required for '+lang+' D'+division);
  }
 }
});
