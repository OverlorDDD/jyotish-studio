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

test('sample chart: plain lead and text first, the placements behind it in the details',()=>{
 const chart=chartOf(7),f=buildReader10Facts(chart);
 assert.equal(f.lagna.sign,4);assert.equal(f.lagnaLord.name,'Moon');assert.equal(f.lagnaLord.house,3);
 assert.equal(f.yogakaraka.name,'Mars');assert.deepEqual(f.planets.Mars.rules,[5,10]);
 assert.equal(f.planets.Jupiter.dignity,'debilitated');
 assert.deepEqual(f.aspectsOnMoon.map(p=>p.name).sort(),['Jupiter','Saturn']);
 const uk=buildReader10(chart,'uk'),en=buildReader10(chart,'en');
 assert.equal(uk.version,READER10_VERSION);assert.equal(READER10_VERSION,'reader10-plain-1');
 assert.deepEqual(uk.chapters.map(c=>c.id),['self','money','work','love','home','path','summary']);
 const self=uk.chapters[0];
 assert.equal(self.title,'Хто ви');
 assert.equal(self.lead,'Головна тема вашого життя: власні зусилля, сміливість і слово.');
 assert.match(self.paragraphs[0],/^Ви тонко відчуваєте настрій інших/);
 assert.match(self.paragraphs[2],/А ще ви маєте вправні руки/);
 assert.match(self.paragraphs[3],/вам потрібне тепло, але ви звикли тримати все в собі/);
 assert.doesNotMatch(JSON.stringify(uk),/[Сс]трижень/);
 const sd=self.details.paragraphs.join(' ');
 assert.match(sd,/^Лагна, тобто знак, що сходив на сході в мить народження: Рак, 14°18′, накшатра Пуш’я\./);
 assert.match(sd,/Управитель лагни, Місяць, стоїть у третьому домі, у Діві\./);
 assert.match(sd,/Йога-карака вашої лагни, найсприятливіша планета карти: Марс у четвертому домі\./);
 assert.match(sd,/накшатра Хаста, пада 1/);assert.match(sd,/Юпітер при цьому у знаку падіння/);
 assert.match(self.details.basis,/Місяць — управитель лагни, Діва 11°58′, 3-й дім/);
 assert.deepEqual(self.details.links.map(x=>x.path),['pedia/sun-moon-rising-signs-compared','nakshatra/hasta','pedia/glossary']);
 const work=uk.chapters.find(c=>c.id==='work'),home=uk.chapters.find(c=>c.id==='home');
 assert.equal(work.lead,'У роботі ви здатні піднятися високо.');
 assert.match(work.paragraphs[0],/^Сильна амбіція й тяга до нестандартних шляхів/);
 assert.match(work.paragraphs[0],/Ця сфера у вас добре захищена\./);
 const wd=work.details.paragraphs.join(' ');
 assert.match(wd,/^Ваш десятий дім, що відповідає за цю сферу: Овен\. Раху в десятому домі\. Марс дивиться на власний дім і зміцнює його\./);
 assert.match(wd,/Управитель дому, Марс, стоїть у четвертому домі, у Терезах\./);
 assert.match(wd,/У карті D10 \(Дашамша\), яка уточнює тему «професія», Марс стоїть в Овні, у власному знаку, у десятому домі від її лагни\./);
 assert.match(home.details.paragraphs.join(' '),/варготтама/);
 assert.equal(uk.chapters.at(-1).details,null);
 assert.match(uk.chapters.at(-1).lead,/^Спиратися ви можете на ці сфери: /);
 assert.equal(en.chapters[0].lead,'The main theme of your life: your own effort, courage and voice.');
 assert.match(en.chapters[0].details.paragraphs[1],/^The lagna lord, the Moon, stands in the 3rd house, in Virgo\./);
 assert.equal(englishArticles('Moon rules. Sun shines on Moon.'),'The Moon rules. The Sun shines on the Moon.');
});

// Astrological vocabulary that must not appear in the plain layer (Cyrillic-aware word starts).
const TERMS_UK=/(?<![а-яіїєґ’])(лагн|накшатр|управител|йог[аи]|варг|домі(?![а-яіїєґ’])|аспект|екзальтац|падінн|раху(?![а-яіїєґ’н])|кету|сатурн|юпітер|марс(?![а-яіїєґ’])|венер|меркурі|хор[аі](?![а-яіїєґ’]))|\bD\d/i;
const TERMS_EN=/\b(lagna|nakshatra|lord|yoga|varga|house|aspect|exalt\w*|debilit\w*|rahu|ketu|saturn|jupiter|mars|venus|mercury|hora|D\d+)\b/i;
test('400 invented charts × 2 languages: plain layer without terms, details with every chart used, clean and unique',()=>{
 const seen=new Set(),hedge=/(?<![а-яіїєґ’])(може|можуть|можливо|ймовірно|мабуть)(?![а-яіїєґ’])|\b(may|might|perhaps|possibly)\b/i;
 const banned=/смерт|помре|хвороб|діагноз|безплід|вагітн|death|disease|diagnos|infertil|pregnan|guarantee[sd]?\b/i;
 let charts=0,words=0;
 for(let seed=1;seed<=400;seed++){
  // A few invented longitude sets sit exactly on a divisional boundary and are rejected by the
  // verified-varga contract itself; those are skipped, not read.
  let chart;try{chart=chartOf(seed);}catch(error){if(/N4_RC_SOURCE_OR_METHOD_MISMATCH/.test(String(error)))continue;throw error;}
  charts++;
  const f=buildReader10Facts(chart);
  for(const lang of ['uk','en']){
   const report=buildReader10(chart,lang);
   assert.equal(report.language,lang);
   assert.deepEqual(report.chapters.map(c=>c.id),['self','money','work','love','home','path','summary']);
   for(const chapter of report.chapters){
    const visible=[chapter.lead,...chapter.paragraphs];
    assert.ok(chapter.lead.length>15&&chapter.paragraphs.length>=1,'thin '+seed+' '+chapter.id);
    assert.doesNotMatch(visible.join(' '),lang==='uk'?TERMS_UK:TERMS_EN,'term in plain text seed '+seed+' '+lang+' '+chapter.id);
    assert.doesNotMatch(visible.join(' '),/:[^.!?]*:/,'two colons in one sentence seed '+seed+' '+chapter.id);
    const all=[...visible,...(chapter.details?[...chapter.details.paragraphs,chapter.details.basis]:[])];
    assert.ok(all.every(p=>/[.!?»”]$/.test(p)),'unfinished sentence seed '+seed+' '+chapter.id);
    const text=all.join(' ');
    assert.doesNotMatch(text,/undefined|NaN|null|\s{2}|\.\.|,\.|\s[,.;]/,'dirty text seed '+seed+' '+lang);
    assert.doesNotMatch(text,hedge,'hedged text seed '+seed+' '+lang);
    assert.doesNotMatch(text,banned,'out-of-bounds claim seed '+seed+' '+lang);
    assert.equal(new Set(chapter.paragraphs).size,chapter.paragraphs.length,'repeated paragraph seed '+seed);
    if(lang==='uk')words+=visible.join(' ').split(/\s+/).length;
   }
   const self=report.chapters[0],details=report.chapters.map(c=>c.details?.paragraphs.join(' ')||'').join(' ');
   for(const division of [2,3,4,7,9,10,12,16,20,24,27,30,40,45])
    assert.ok(details.includes(VARGA_NAME[division][lang]),'D'+division+' unused seed '+seed+' '+lang);
   for(const rule of AREAS){
    const chapter=report.chapters.find(c=>c.id===rule.id),sign=((f.lagna.sign+rule.house-2)%12)+1;
    assert.ok(chapter.details.paragraphs[0].includes(SIGN_NAME[sign-1][lang]),rule.id+' house sign missing seed '+seed);
   }
   const sd=self.details.paragraphs.join(' ');
   assert.ok(sd.includes(SIGN_NAME[f.lagna.sign-1][lang]),'lagna sign missing '+seed);
   assert.ok(sd.includes(NAKSHATRA_NAME[f.planets.Moon.nakshatraNumber-1][lang]),'Moon nakshatra missing '+seed);
   assert.ok(self.lead.includes(LAGNA_LORD_HOUSE[f.lagnaLord.house-1].focus[lang]),'main theme missing '+seed);
   assert.ok(self.details.links.every(x=>/^[a-z0-9][a-z0-9/-]{0,80}$/.test(x.path)),'unsafe link seed '+seed);
   if(lang==='uk')seen.add(JSON.stringify(report.chapters.map(c=>[c.lead,c.paragraphs])));
  }
 }
 assert.ok(charts>=300,'enough invented charts: '+charts);
 assert.equal(seen.size,charts,'readings must differ between charts');
 // Plain layer stays short: well under half of the previous ~1,040 visible words.
 assert.ok(words/charts<520,'visible words per reading '+Math.round(words/charts));
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
 assert.match(view,/READER10_UI_VERSION='reader10-plain-1'/);
 assert.match(ui,/!isReader10\(report\.reader10\)&&hasV8&&report\.readerV8\?<ReaderN492View/);assert.doesNotMatch(view,/dangerouslySetInnerHTML/);
 assert.doesNotMatch(read('apps/api/src/reader10.ts')+read('apps/api/src/reader10-texts.ts')+read('apps/api/src/reader10-areas.ts')+read('apps/api/src/reader10-plain.ts'),/Chiron|Хірон|T-square|тау-квадрат|Placidus/i);
});

test('Ukrainian sign names follow the site convention (Близнюки, Козоріг)',()=>{
 for(const file of ['apps/api/src/reader10-texts.ts','apps/api/src/reader10-areas.ts','apps/api/src/reader10-plain.ts','apps/web/lib/nakshatra-guides.ts']){
  assert.doesNotMatch(read(file),/Близнят|Козер[іо]г|Козероз/,file);
 }
 assert.equal(SIGN_NAME[2].uk,'Близнюки');assert.equal(SIGN_IN[2].uk,'у Близнюках');
 assert.equal(SIGN_NAME[9].uk,'Козоріг');assert.equal(SIGN_IN[9].uk,'у Козорозі');
});
