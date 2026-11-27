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
 const seen=new Set(),overclaim=/Шлюб щасливий:|Грошей у вас буде рівно стільки|І це справджується повною мірою|The marriage is fortunate:|You will have as much money as the effort|And this comes true in full/i;
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
    assert.doesNotMatch(text,overclaim,'unsupported categorical prediction seed '+seed+' '+lang);
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

// N6 exercises the same Reader 10 fixtures without altering its existing chapters.
test('N6 retains the original six life chapters and summary, adds current dasha and respects D60 precision',async()=>{
 const {buildN6Reader,buildN6Brief,timingChapter}=await import('../apps/api/src/reader-n6.ts');
 let count=0;
 for(let seed=1;seed<=30;seed++){
  let chart;try{chart=chartOf(seed);}catch(error){if(/N4_RC_SOURCE_OR_METHOD_MISMATCH/.test(String(error)))continue;throw error;}
  count++;
  for(const lang of ['en','uk']){
   const original=buildReader10(chart,lang), exact=buildN6Reader(chart,lang,'2026-11-26',true),approx=buildN6Reader(chart,lang,'2026-11-26',false);
   assert.deepEqual(exact.chapters.filter(c=>c.id!=='timing'),original.chapters);
   assert.deepEqual(approx.chapters.filter(c=>!['timing','path'].includes(c.id)),original.chapters.filter(c=>c.id!=='path'));
   assert.equal(approx.chapters.length,8);assert.doesNotMatch(approx.chapters.flatMap(c=>[c.lead,...c.paragraphs,...(c.details?.paragraphs||[]),c.details?.basis||'']).join(' '),/D60(?=[: ])|Шаштіамша|Shashtiamsha/i);
   assert.equal(exact.chapters.find(c=>c.id==='timing').title,lang==='uk'?'Поточний період життя':'Current life period');
   assert.ok(buildN6Brief(exact).chapters.every(c=>c.evidence.length));
  }
 }
 assert.ok(count>=20);
 const c=chartOf(7),boundary={...c,dasha:[{lord:'Mars',start:'2020-01-01T00:00:00Z',end:'2030-01-01T00:00:00Z',antardashas:[{lord:'Moon',start:'2020-01-01T00:00:00Z',end:'2026-11-26T12:00:00Z'},{lord:'Rahu',start:'2026-11-26T12:00:00Z',end:'2030-01-01T00:00:00Z'}]}]};
 const timing=timingChapter(boundary,'en','2026-11-26');
 assert.match(timing.details.paragraphs[0],/Mars/);assert.match(timing.details.paragraphs[1],/Rahu/);
 assert.equal(timingChapter(boundary,'en','2031-01-01').details,null);
});

test('N6.1 timing uses both rulers, their lordships and current chart context without changing baseline chapters',async()=>{
 const {buildN6Reader,buildN6Brief}=await import('../apps/api/src/reader-n6.ts');
 const chart=chartOf(7);
 const c={...chart,dasha:[{lord:'Saturn',start:'2015-07-20T00:00:00Z',end:'2034-07-20T00:00:00Z',antardashas:[{lord:'Moon',start:'2026-06-22T00:00:00Z',end:'2028-01-21T00:00:00Z'}]}]};
 for(const lang of ['en','uk']){
  const r=buildN6Reader(c,lang,'2026-11-26',true),t=r.chapters.find(x=>x.id==='timing');
  assert.equal(t.paragraphs.length,4);assert.ok(t.paragraphs.join(' ').split(/\s+/).length>=85);
  assert.match(t.details.paragraphs[0],/Saturn|Сатурн/);assert.match(t.details.paragraphs[1],/Moon|Місяць/);
  assert.equal(r.chapters.filter(x=>x.id!=='timing').length,7);
  assert.deepEqual(r.chapters.filter(x=>x.id!=='timing'),buildReader10(c,lang).chapters);
  const b=buildN6Brief(r,c);assert.ok(b.context.some(x=>x.id==='shared.lordships'));
  assert.ok(b.context.some(x=>x.id==='shared.lagnaChain'));
  assert.doesNotMatch(JSON.stringify(b),/2000-01-01|latitude|longitude|2026-06-22|2028-01-21/);
 }
});

test('N6.3 verified dominant patterns and summary facts are sent without classic prose or uncertain D60',async()=>{
 const {buildN6Reader,buildN6Brief,n6ProviderPayload}=await import('../apps/api/src/reader-n6.ts');
 let tested=0;
 for(let seed=1;seed<=40;seed++){
  let chart;try{chart=chartOf(seed);}catch(error){if(/N4_RC_SOURCE_OR_METHOD_MISMATCH/.test(String(error)))continue;throw error;}
  for(const lang of ['uk','en']){
   const reader=buildN6Reader(chart,lang,'2026-11-27',false),brief=buildN6Brief(reader,chart);
   const payload=JSON.parse(n6ProviderPayload(brief,false));
   const cluster=brief.context.find(e=>e.id.startsWith('shared.cluster'));
   assert.ok(brief.context.some(e=>e.id==='shared.d1Factors'));
   if(cluster)for(const id of ['self','path'])assert.ok(brief.chapters.find(c=>c.id===id).required.includes(cluster.id));
   const summary=brief.chapters.find(c=>c.id==='summary');
   assert.ok(summary.evidence.length>=2);assert.ok(summary.evidence.every(e=>!e.id.endsWith('.reader')));
   for(const c of payload.chapters){assert.equal(c.lead,undefined);assert.equal(c.paragraphs,undefined);}
   assert.doesNotMatch(JSON.stringify(payload),/D60(?=[: (])|Шаштіамша|Shashtiamsha/i);
   tested++;
  }
 }
 assert.ok(tested>=50);
});

test('N6.3.1 selects thematic factors from every verified varga, bounds provider evidence and never leaks D60 houses',async()=>{
 const {buildVargaIntelligence}=await import('../apps/api/src/reader-n63-vargas.ts');
 const {buildN6Reader,buildN6Brief,n6ProviderPayload}=await import('../apps/api/src/reader-n6.ts');
 let count=0,conditional=0;
 for(let seed=1;seed<=60;seed++){
  let chart;try{chart=chartOf(seed);}catch(error){if(/N4_RC_SOURCE_OR_METHOD_MISMATCH/.test(String(error)))continue;throw error;}
  for(const lang of ['uk','en']){
   const a=buildVargaIntelligence(chart,lang,true,'2026-11-27'),b=buildVargaIntelligence(chart,lang,false,'2026-11-27');
   assert.deepEqual(a.findings.map(x=>x.division),[2,3,4,7,9,10,12,16,20,24,27,30,40,45]);
   assert.ok(a.findings.every(x=>x.examined===9&&x.selected.length===2&&x.selected[0].planet!==x.selected[1].planet));
   for(const x of a.findings)for(const p of x.selected){
    const real=chart.n4.charts.find(c=>c.division===x.division).planets.find(q=>q.name===p.planet);
    assert.equal(p.sign,real.sign);assert.equal(p.house,real.house);
   }
   assert.equal(a.d60Examined,9);assert.equal(b.d60,null);assert.equal(b.d60Examined,0);
   if(a.d60){conditional++;assert.doesNotMatch(a.d60.text,/\bH\d+|дім \d+|house \d+/i);}
   const reader=buildN6Reader(chart,lang,'2026-11-27',false);
   const payload=JSON.parse(n6ProviderPayload(buildN6Brief(reader,chart,'2026-11-27'),true));
   assert.doesNotMatch(JSON.stringify(payload),/D60(?=[: (])|Шаштіамша|Shashtiamsha/i);
   for(const n of [2,3,4,7,9,10,12,16,20,24,27,30,40,45])assert.ok(payload.chapters.some(c=>c.evidence.some(e=>e.id.endsWith('.v'+n))));
   assert.ok(JSON.stringify(payload).length<26000,'bounded context');
   assert.equal(buildVargaIntelligence({...chart,n4:{...chart.n4,sourceDigest:'bad'}},lang,true),null);
   count++;
  }
 }
 assert.ok(count>=80);assert.ok(conditional>=40);
});

test('N631 Groq compact facts preserve all thematic and required source IDs and do not reintroduce D60',async()=>{
 const {buildN6Reader,buildN6Brief,groqN6Brief,groqN6Payload}=await import('../apps/api/src/reader-n6.ts');
 let translated=0;
 for(let seed=1;seed<=24;seed++){
  let chart;try{chart=chartOf(seed);}catch(error){if(/N4_RC_SOURCE_OR_METHOD_MISMATCH/.test(String(error)))continue;throw error;}
  const reader=buildN6Reader(chart,'uk','2026-11-27',false),brief=buildN6Brief(reader,chart,'2026-11-27');
  const alternate=groqN6Brief(brief,chart,'2026-11-27'),payload=JSON.parse(groqN6Payload(alternate));
  assert.equal(payload.language,'uk');
  assert.deepEqual(payload.context.map(e=>e.id),brief.context.map(e=>e.id));
  for(let i=0;i<brief.chapters.length;i++){
   assert.deepEqual(payload.chapters[i].evidence.map(e=>e.id),brief.chapters[i].evidence.map(e=>e.id));
   assert.deepEqual(payload.chapters[i].required,brief.chapters[i].required);
   assert.equal(payload.chapters[i].lead,undefined);
  }
  assert.doesNotMatch(JSON.stringify(payload),/D60(?=[: (])|Шаштіамша|Shashtiamsha/i);
  if(alternate!==brief)translated++;
 }
 assert.ok(translated>=12,'English compact representation should be used on ordinary verified fixtures');
});

test('N631 real-source compact repair for self and money preserves every required fact and bounds the request estimate',async()=>{
 const {buildN6Reader,buildN6Brief,groqN6Brief,groqN6Payload,packGroqN6,N631_GROQ_PROMPT}=await import('../apps/api/src/reader-n6.ts');
 let count=0;
 for(let seed=1;seed<=30;seed++){
  let chart;try{chart=chartOf(seed);}catch(error){if(/N4_RC_SOURCE_OR_METHOD_MISMATCH/.test(String(error)))continue;throw error;}
  const r=buildN6Reader(chart,'uk','2026-11-27',false),b=groqN6Brief(buildN6Brief(r,chart,'2026-11-27'),chart,'2026-11-27');
  const subset={...b,chapters:b.chapters.filter(c=>['self','money'].includes(c.id))},p=packGroqN6(subset,true);
  for(const c of subset.chapters){
   const packet=p.packets.find(q=>q.chapter===c.id);
   if(packet)assert.deepEqual(packet.ids,[...new Set(c.required)]);
  }
  const estimate=Math.ceil(Buffer.byteLength(groqN6Payload(p.brief)+'\n'+N631_GROQ_PROMPT,'utf8')/3)+1550+700;
  // Bound the context growth, not a claim about exact upstream tokenization.
  assert.ok(estimate<4500,'repair estimate '+estimate);
  count++;
 }
 assert.ok(count>=20);
});

test('N631 incident regression: two missing evidence chapters, 3203 remaining tokens, only the failed chapters regenerated',async()=>{
 const {buildN6Reader}=await import('../apps/api/src/reader-n6.ts');
 const {generateDirectJyotish}=await import('../apps/api/src/direct-jyotish.ts');
 const chart=chartOf(7),asOf='2026-11-27',reader=buildN6Reader(chart,'uk',asOf,false);
 let calls=0;const events=[],permits=[];
 const result=await generateDirectJyotish(chart,'uk',asOf,{reader10:reader,order:['groq'],keys:{groq:'fake'},freeConfirmed:{groq:true},limit:()=>{permits.push(1);return true;},onDiagnostic:d=>events.push(d),fetcher:async(_url,req)=>{
  calls++;
  const body=JSON.parse(req.body),brief=JSON.parse(body.messages[1].content.split('facts:\n')[1]);
  assert.ok(calls<=2);
  if(calls===2){
   assert.deepEqual(brief.chapters.map(c=>c.id),['self','money']);
   assert.ok(body.max_completion_tokens<=1550);
   assert.equal(brief.context.length,0);
  }
  const chapters=brief.chapters.map((c,i)=>{
   const missing=calls===1&&['self','money'].includes(c.id);
   const evidenceIds=missing?[c.evidence.find(e=>!c.required.includes(e.id)).id]:c.required;
   const lead='A distinct practical theme for '+c.id+' asks for thoughtful attention.';
   const paragraphs=Array.from({length:c.minParagraphs},(_,k)=>({
    text:(['The first useful perspective on ','Another distinct practical perspective on ','The final interaction of '][k])+c.id+' connects competing responsibilities with a deliberate daily choice rather than an assured outcome. Consider the relationship between your goals, your decisions and the resources available to you before making commitments.',
    evidenceIds
   }));
   return {id:c.id,lead,paragraphs};
  });
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({chapters})}}]}),{headers:{'x-ratelimit-limit-tokens':'8000','x-ratelimit-remaining-tokens':'3203','x-ratelimit-reset-tokens':'0s'}});
 }});
 assert.equal(calls,2);assert.equal(permits.length,2);
 assert.ok(result.result?.reader10);
 assert.ok(events.some(x=>x.reason==='n6_repaired_complete'));
 assert.ok(events.some(x=>x.reason==='n6_repair_self_money'));
 assert.ok(result.result.reader10.chapters.find(c=>c.id==='money').evidenceIds.flat().includes('money.v2'));
});
