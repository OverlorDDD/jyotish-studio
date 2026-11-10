import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {buildClassicalReaderV8} from '../apps/api/src/reader-v8.ts';
import {makeLifeThemes} from '../apps/web/app/components/ReaderLifeThemes.ts';

const planets=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
function inventedChart(seed){
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
test('24 invented charts × two languages deliver five distinct readable life areas and retain 16 evidence-backed cards',()=>{
 const fingerprints={uk:new Set(),en:new Set()};
 for(let seed=1;seed<=24;seed++){
  const chart=inventedChart(seed);
  for(const lang of ['uk','en']){
   const report=buildClassicalReaderV8(chart,lang,'2026-11-10');
   const cards=report.meaningful?.cards;
   assert.equal(cards?.length,16,'all Shodashavarga retained at seed '+seed);
   const themes=makeLifeThemes(cards,lang);
   assert.equal(themes.length,5);
   const output=themes.map(t=>t.reading.narrative).join(' ');
   assert.ok(output.length>=410,'reader must remain substantive: '+lang+'/'+seed+'/'+output.length);
   for(const theme of themes){
    assert.ok(theme.reading.narrative.length>=65,'empty life-area story '+lang+'/'+seed+'/'+theme.id);
    assert.ok(theme.reading.action.length>=15,'missing personal action '+lang+'/'+seed+'/'+theme.id);
    assert.doesNotMatch(theme.reading.narrative,/D1\\.|D60\\.|house-lord|(?:Laghu Parashari|Brihat Jataka)|(?:Астрологічна основа|Astrological basis):/iu);
    assert.doesNotMatch(theme.reading.action,/D1\\.|D60\\.|house-lord/u);
   }
   fingerprints[lang].add(output);
  }
 }
 assert.ok(fingerprints.uk.size>=20,'not enough chart-specific Ukrainian variation');
 assert.ok(fingerprints.en.size>=20,'not enough chart-specific English variation');
});
