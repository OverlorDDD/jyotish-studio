/**
 * N4.9.6 editorial acceptance: invented astronomical inputs only.
 * No real user birth data or external AI. Evidence hashes remain available
 * to the engine, not rendered as symbolic key/value noise in the reader.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {classicalLordshipTable} from '../apps/api/src/reader-classical.ts';
import {buildLifePortraitN496,N496_AREAS,N496_VERSION} from '../apps/api/src/reader-portrait-n496.ts';
import {buildMeaningfulN492} from '../apps/api/src/reader-meaning-n492.ts';

const planets=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const subject={identity:1,money:2,career:10,relationships:7,roots:4};
const division={identity:1,money:2,career:10,relationships:9,roots:4};
const expected=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60];
function fixture(seed){
 const input={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
 const eph={ayanamsa:23.8,ascendant:(10.713+seed*13.37)%360,julianDay:2451545,
  backend:'SYNTHETIC_TEST_ONLY',
  positions:planets.map((name,i)=>({name,longitude:(11+i*35.2+seed*(16.41+i*.13))%360,speed:.1}))};
 const chart=calculateChart(input,eph);
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',
  digest:seed.toString(16).padStart(64,'a'),checks:['SYNTHETIC_TEST_ONLY'],externalReferenceChecked:false};
 return {...chart,verification,n4:makeN4RcPayload(chart,verification),
  n4D60:makeN4D60Candidate(chart,verification)};
}

test('five non-overlapping human life themes cover all 16 divisions without code or book names',()=>{
 assert.deepEqual([...new Set(N496_AREAS.flatMap(x=>x.divisions))].sort((a,b)=>a-b),expected);
 assert.equal(N496_AREAS.flatMap(x=>x.divisions).length,16);
 const unique={uk:new Set(),en:new Set()};
 for(let seed=1;seed<=30;seed++){
  const chart=fixture(seed),lords=classicalLordshipTable(chart.ascendant.sign);
  for(const lang of ['uk','en']){
   const portrait=buildLifePortraitN496(chart,lang);
   assert.ok(portrait,seed+'/'+lang+' verified source must yield portrait');
   assert.equal(portrait.version,N496_VERSION);
   assert.equal(portrait.areas.length,5);
   assert.deepEqual(portrait.areas.map(a=>a.id),['identity','money','career','relationships','roots']);
   const openings=new Set();
   for(const area of portrait.areas){
    assert.ok(area.title.length>9&&area.title.length<70);
    assert.ok(area.story.length>130&&area.story.length<490,area.id+' story length: '+area.story.length);
    assert.ok(area.nuance.length>40&&area.nuance.length<220);
    assert.ok(area.action.length>45&&area.action.length<210);
    assert.doesNotMatch(area.story+' '+area.nuance+' '+area.action,
     /\bD(?:1|2|3|4|7|9|10|12|16|20|24|27|30|40|45|60)\b|D1\.|house-lord|[a-z-]+=\d|Brihat Jataka|Laghu Parashari|в практичному житті це торкається|тема знань і наставництва/iu);
    assert.doesNotMatch(area.story,/науково доведен|guarantee|guaranteed|психологічний діагноз/i);
    if(lang==='en')assert.doesNotMatch(area.story+' '+area.nuance+' '+area.action,/[А-Яа-яІіЇїЄєҐґ]/u);
    openings.add(area.story.slice(0,55));
    const actualLord=lords[subject[area.id]];
    const natal=chart.d1.find(p=>p.name===actualLord);
    const varga=chart.n4.charts.find(c=>c.division===division[area.id]).planets.find(p=>p.name===actualLord);
    assert.ok(area.proof.includes('D1.house-lord.'+subject[area.id]+'='+actualLord));
    assert.ok(area.proof.includes('D1.'+actualLord+'.house='+natal.house));
    assert.ok(area.proof.includes('D'+division[area.id]+'.'+actualLord+'.sign='+varga.sign));
    assert.ok(area.proof.includes('D'+division[area.id]+'.'+actualLord+'.house='+varga.house));
   }
   assert.equal(openings.size,5,'five subjects must not share an identical narrative opening');
   unique[lang].add(portrait.areas.map(a=>a.story).join('|'));
   const integrated=buildMeaningfulN492(chart,lang,'2026-11-10');
   assert.ok(integrated);
   assert.equal(integrated.portrait.version,N496_VERSION);
   assert.deepEqual(integrated.cards.map(x=>x.division),expected);
  }
 }
 assert.ok(unique.uk.size>=28);
 assert.ok(unique.en.size>=28);
});

test('first-view UX shows five themes; sources stay internal and sixteen vargas are an optional accordion',()=>{
 const view=readFileSync(new URL('../apps/web/app/components/ReaderN492View.tsx',import.meta.url),'utf8');
 const page=readFileSync(new URL('../apps/web/app/astrology/jyotish/page.tsx',import.meta.url),'utf8');
 assert.match(view,/data-testid="reader-n496-five-themes"/);
 assert.match(view,/portrait\.areas\.map/);
 assert.match(view,/<details className=\{book\.divisions\} data-testid="reader-n492-all-16-details">/);
 assert.match(view,/data-testid="reader-n492-16-cards"/);
 assert.doesNotMatch(view,/<code>|card\.proof\.join|legacy\.sources|\.work\},|Brihat Jataka|Laghu Parashari/);
 assert.match(page,/portrait\?\.version!=='n496-human-portrait-1\.0\.0'/);
 assert.match(page,/portrait\?\.version==='n496-human-portrait-1\.0\.0'/);
});
