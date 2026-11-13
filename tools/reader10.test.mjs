import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {buildReader10,englishArticles,READER10_VERSION} from '../apps/api/src/reader10.ts';
import {buildReader10Facts,aspectedHouses,dignityOf,signLord} from '../apps/api/src/reader10-facts.ts';
import {makeN4RcPayload} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {AREAS,SUPPORT,VARGA_NAME} from '../apps/api/src/reader10-areas.ts';
import {LAGNA,LAGNA_LORD_HOUSE,MOON_SIGN,MOON_NAKSHATRA,NAKSHATRA_NAME,SIGN_NAME,SIGN_IN} from '../apps/api/src/reader10-texts.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const GRAHAS=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
// Invented placements only: this exercises text rules, never astronomy.
function chartOf(seed,verified=true){
 const lon=GRAHAS.map((_,i)=>(11+i*35.2+seed*(16.41+i*.13))%360);lon[8]=(lon[7]+180)%360;
 const base=calculateChart({date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52},
  {ayanamsa:23.8,ascendant:(10.713+seed*13.37)%360,julianDay:2451545,backend:'SYNTHETIC_TEST_ONLY',
   positions:GRAHAS.map((name,i)=>({name,longitude:lon[i],speed:.1}))});
 if(!verified)return base;
 const verification={version:'jyotish-integrity-v3',status:'verified_internal',digest:seed.toString(16).padStart(64,'a'),checks:['SYNTHETIC_TEST_ONLY'],externalReferenceChecked:false};
 return {...base,verification,n4:makeN4RcPayload(base,verification),n4D60:makeN4D60Candidate(base,verification)};
}

test('fact layer: classical dignities, lordships and graha drishti',()=>{
 assert.equal(dignityOf('Sun',1),'exalted');assert.equal(dignityOf('Sun',7),'debilitated');assert.equal(dignityOf('Sun',5),'own');
 assert.equal(dignityOf('Moon',2),'exalted');assert.equal(dignityOf('Moon',8),'debilitated');
 assert.equal(dignityOf('Jupiter',4),'exalted');assert.equal(dignityOf('Jupiter',10),'debilitated');
 assert.equal(dignityOf('Saturn',7),'exalted');assert.equal(dignityOf('Saturn',1),'debilitated');assert.equal(dignityOf('Saturn',11),'own');
 assert.equal(dignityOf('Venus',12),'exalted');assert.equal(dignityOf('Mercury',6),'exalted');assert.equal(dignityOf('Mars',10),'exalted');
 assert.equal(dignityOf('Rahu',3),'neutral');
 assert.deepEqual([1,2,3,4,5,6,7,8,9,10,11,12].map(signLord),
  ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter']);
 assert.deepEqual(aspectedHouses('Mars',4),[10,7,11]);
 assert.deepEqual(aspectedHouses('Jupiter',7),[1,11,3]);
 assert.deepEqual(aspectedHouses('Saturn',9),[3,11,6]);
 assert.deepEqual(aspectedHouses('Venus',12),[6]);assert.deepEqual(aspectedHouses('Rahu',5),[]);
});

test('sample chart reads its real placements: Cancer lagna, Moon in the third, Mars yogakaraka',()=>{
 const chart=chartOf(7),f=buildReader10Facts(chart);
 assert.equal(f.lagna.sign,4);assert.equal(f.lagnaLord.name,'Moon');assert.equal(f.lagnaLord.house,3);
 assert.equal(f.yogakaraka.name,'Mars');assert.deepEqual(f.planets.Mars.rules,[5,10]);
 assert.equal(f.planets.Jupiter.dignity,'debilitated');
 assert.deepEqual(f.aspectsOnMoon.map(p=>p.name).sort(),['Jupiter','Saturn']);
 const uk=buildReader10(chart,'uk'),en=buildReader10(chart,'en');
 assert.equal(uk.version,READER10_VERSION);assert.equal(READER10_VERSION,'reader10-full-1');
 assert.deepEqual(uk.chapters.map(c=>c.id),['core','self','money','work','love','home','path','summary']);
 const core=uk.chapters[0],self=uk.chapters[1];
 assert.equal(core.title,'Центральна тема вашої карти');
 assert.match(core.paragraphs[0],/^Центральна тема вашої карти задана положенням управителя лагни: Місяць стоїть у третьому домі\./);
 assert.doesNotMatch(JSON.stringify(uk),/[Сс]трижень/);
 assert.match(core.paragraphs.join(' '),/йога-карака/);assert.match(core.paragraphs.join(' '),/Сатурн і Місяць/);
 assert.match(self.paragraphs[0],/^Ваша лагна — Рак, 14°18′, накшатра Пуш’я\./);
 assert.match(self.paragraphs.join(' '),/Накшатра Хаста \(пада 1\)/);
 assert.match(self.paragraphs.join(' '),/Юпітер при цьому стоїть у знаку падіння/);
 assert.match(self.basis,/Місяць — управитель лагни, Діва 11°58′, 3-й дім, Хаста-1/);
 assert.match(en.chapters[0].paragraphs[0],/^The central theme of your chart is set by the lagna lord: the Moon stands in the 3rd house\./);
 const work=uk.chapters.find(c=>c.id==='work'),home=uk.chapters.find(c=>c.id==='home');
 assert.match(work.paragraphs[0],/^Ваш десятий дім — Овен\. Раху в десятому домі/);
 assert.match(work.paragraphs[0],/Марс дивиться на власний дім і зміцнює його\./);
 assert.match(work.paragraphs[1],/^Управитель дому, Марс, стоїть у четвертому домі, у Терезах\./);
 assert.match(work.paragraphs[2],/^У карті D10 \(Дашамша\), яка уточнює тему «професія», Марс стоїть в Овні, у десятому домі від її лагни\./);
 assert.match(work.summary,/^Коротко: робота — сильна сфера вашої карти/);
 assert.match(home.paragraphs[2],/варготтама/);
 assert.match(uk.chapters.at(-1).summary,/ваші сильні сфери — /);
 assert.equal(englishArticles('Moon rules. Sun shines on Moon.'),'The Moon rules. The Sun shines on the Moon.');
});

test('400 invented charts × 2 languages: every paragraph names a chart fact, text is clean, direct and unique',()=>{
 const seen=new Set(),hedge=/(?<![а-яіїєґ’])(може|можуть|можливо|ймовірно|мабуть)(?![а-яіїєґ’])|\b(may|might|perhaps|possibly)\b/i;
 const banned=/смерт|помре|хвороб|діагноз|безплід|вагітн|death|disease|diagnos|infertil|pregnan|guarantee[sd]?\b/i;
 let charts=0;
 for(let seed=1;seed<=400;seed++){
  // A few invented longitude sets sit exactly on a divisional boundary and are rejected by the
  // verified-varga contract itself; those are skipped, not read.
  let chart;try{chart=chartOf(seed);}catch(error){if(/N4_RC_SOURCE_OR_METHOD_MISMATCH/.test(String(error)))continue;throw error;}
  charts++;
  const f=buildReader10Facts(chart);
  for(const lang of ['uk','en']){
   const report=buildReader10(chart,lang);
   assert.equal(report.language,lang);
   for(const chapter of report.chapters){
    assert.ok(chapter.paragraphs.length>=2&&chapter.summary.length>20&&chapter.basis.length>20,'thin '+seed);
    assert.ok(chapter.paragraphs.every(p=>/[.!?»”]$/.test(p)),'unfinished paragraph seed '+seed+' '+chapter.id);
    const all=[...chapter.paragraphs,chapter.summary,chapter.basis].join(' ');
    assert.doesNotMatch(all,/undefined|NaN|null|\s{2}|\.\.|,\.|\s[,.;]/,'dirty text seed '+seed+' '+lang);
    assert.doesNotMatch(all,hedge,'hedged text seed '+seed+' '+lang);
    assert.doesNotMatch(all,banned,'out-of-bounds claim seed '+seed+' '+lang);
    assert.equal(new Set(chapter.paragraphs).size,chapter.paragraphs.length,'repeated paragraph seed '+seed);
   }
   const self=report.chapters[1].paragraphs.join(' '),core=report.chapters[0].paragraphs.join(' ');
   const whole=report.chapters.map(c=>c.paragraphs.join(' ')).join(' ');
   // All fifteen verified divisional charts take part in the one reading.
   for(const division of [2,3,4,7,9,10,12,16,20,24,27,30,40,45])
    assert.ok(whole.includes(VARGA_NAME[division][lang]),'D'+division+' unused seed '+seed+' '+lang);
   for(const rule of AREAS){
    const chapter=report.chapters.find(c=>c.id===rule.id),sign=((f.lagna.sign+rule.house-2)%12)+1;
    assert.ok(chapter.paragraphs[0].includes(SIGN_NAME[sign-1][lang]),rule.id+' house sign missing seed '+seed);
    assert.ok(chapter.paragraphs.length>=4,rule.id+' thin seed '+seed);
   }
   assert.ok(self.includes(SIGN_NAME[f.lagna.sign-1][lang]),'lagna sign missing '+seed);
   assert.ok(self.includes(NAKSHATRA_NAME[f.planets.Moon.nakshatraNumber-1][lang]),'Moon nakshatra missing '+seed);
   assert.ok(self.includes(lang==='uk'?SIGN_IN[f.lagnaLord.sign-1].uk:SIGN_NAME[f.lagnaLord.sign-1].en),'lagna lord sign missing '+seed);
   assert.ok(core.includes(LAGNA_LORD_HOUSE[f.lagnaLord.house-1].focus[lang]),'core theme missing '+seed);
   if(lang==='uk')seen.add(core+self);
  }
 }
 assert.ok(charts>=300,'enough invented charts: '+charts);
 assert.equal(seen.size,charts,'readings must differ between charts');
});

test('rule tables are complete and bilingual; no reading without a verified chart',()=>{
 assert.equal(LAGNA.length,12);assert.equal(LAGNA_LORD_HOUSE.length,12);assert.equal(MOON_SIGN.length,12);
 assert.equal(MOON_NAKSHATRA.length,27);assert.equal(NAKSHATRA_NAME.length,27);
 for(const item of [...LAGNA.map(x=>x.text),...LAGNA_LORD_HOUSE.map(x=>x.text),...MOON_SIGN]){
  assert.ok(item.uk.length>80&&item.en.length>80);
 }
 assert.equal(buildReader10(chartOf(7,false),'uk'),null);
 const report=read('apps/api/src/report.ts'),ui=read('apps/web/app/components/DetailedReport.tsx'),view=read('apps/web/app/components/Reader10View.tsx');
 assert.match(report,/reader10:buildReader10\(chart,lang\)/);
 assert.match(ui,/isReader10\(report\.reader10\)\?<Reader10View/);
 assert.equal(AREAS.length,5);for(const rule of AREAS){assert.equal(rule.lord.length,12);assert.equal(Object.keys(rule.occupants).length,9);}
 assert.deepEqual(Object.keys(SUPPORT).map(Number).sort((a,b)=>a-b),[3,7,12,16,20,24,27,30,40,45]);
 assert.ok(ui.indexOf('<Reader10View')<ui.indexOf('<ReaderN492View'),'Reader 10 must come first');
 assert.match(view,/READER10_UI_VERSION='reader10-full-1'/);
 assert.match(ui,/!isReader10\(report\.reader10\)&&hasV8&&report\.readerV8\?<ReaderN492View/);assert.doesNotMatch(view,/dangerouslySetInnerHTML/);
 assert.doesNotMatch(read('apps/api/src/reader10.ts')+read('apps/api/src/reader10-texts.ts')+read('apps/api/src/reader10-areas.ts'),/Chiron|Хірон|T-square|тау-квадрат|Placidus/i);
});
