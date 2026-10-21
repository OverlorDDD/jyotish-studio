import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDetailedReport,calculateParashariDrishti,detailedReportFacts} from '../apps/api/src/report.ts';

const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const house=[10,8,12,10,2,9,2,5,11];
const sign=[9,7,11,9,1,8,1,4,10];
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const p=(name,i)=>({
 name,house:house[i],sign:sign[i],signName:signs[sign[i]-1],degreesInSign:13.25,
 longitude:(sign[i]-1)*30+13.25,nakshatra:'Swati',pada:4,retrograde:false
});
const positions=names.map(p);
const chart={
 input:{date:'2000-01-01',time:'12:00',timeZone:'Asia/Kolkata',latitude:28.6139,longitude:77.209},
 utc:'2000-01-01T06:30:00.000Z',ayanamsa:23.8,ephemeris:'Swiss Ephemeris',
 ascendant:{...p('Ascendant',0),house:1,sign:12,signName:'Pisces'},
 lagnaD9:{...p('Ascendant',0),house:1,sign:7,signName:'Libra'},
 lagnaD10:{...p('Ascendant',0),house:1,sign:12,signName:'Pisces'},
 d1:positions,d9:positions.map(x=>({...x,house:(x.house%12)+1})),
 d10:positions.map(x=>({...x,house:((x.house+2)%12)+1})),
 dasha:[{lord:'Saturn',start:'2020-01-01',end:'2035-01-01',
 antardashas:[{lord:'Ketu',start:'2026-01-01',end:'2027-01-01'}]}]
};
const byId=(r,id)=>r.sections.find(x=>x.id===id);

test('full report includes nine planet readings and twelve individually navigable houses',()=>{
 const r=buildDetailedReport(chart,'uk');
 assert.equal(r.sections.filter(x=>x.id.startsWith('planet-')).length,9);
 assert.equal(r.sections.filter(x=>/^house-\d+$/.test(x.id)).length,12);
 for(const id of ['portrait','sun-moon','planets-intro','houses-intro','drishti','navamsa','dashamsa','dasha'])
  assert.ok(byId(r,id),id);
 assert.ok(r.sections.length>=30);
 assert.ok(byId(r,'conjunctions'));
 assert.ok(byId(r,'cross-varga'));
 assert.equal(byId(r,'cross-varga').facts.length,9);
 assert.ok(byId(r,'cross-varga').facts.some(x=>x.includes('D1')&&x.includes('D9')&&x.includes('D10')));
 assert.ok(byId(r,'conjunctions').facts.some(x=>x.includes('Сонце')&&x.includes('Меркурій')));
 assert.ok(byId(r,'drishti').facts.length>=10);
 assert.match(byId(r,'planet-mars').paragraphs.join(' '),/Марс/);
 assert.match(byId(r,'house-10').heading,/Сфера життя 10/);
 assert.match(byId(r,'navamsa').paragraphs.join(' '),/Терези/);
});
test('English report is in English and preserves the same computed positions',()=>{
 const r=buildDetailedReport(chart,'en');
 assert.match(byId(r,'portrait').heading,/Your astrological portrait/);
 assert.match(byId(r,'planet-sun').facts[0],/Sun.*Sagittarius/);
 assert.equal(r.language,'en');
 assert.match(byId(r,'dasha').heading,/Life cycles/);
});
test('Parashari drishti includes Jupiter fifth and ninth, Saturn third/tenth, Mars fourth/eighth',()=>{
 const aspects=calculateParashariDrishti(chart);
 const offsets=name=>aspects.filter(a=>a.source===name).map(a=>a.offset);
 assert.deepEqual(offsets('Jupiter'),[5,7,9]);
 assert.deepEqual(offsets('Saturn'),[3,7,10]);
 assert.deepEqual(offsets('Mars'),[4,7,8]);
 assert.deepEqual(offsets('Sun'),[7]);
 assert.equal(offsets('Rahu').length,0);
 assert.equal(offsets('Ketu').length,0);
});
test('complete LLM fact clusters include D1 D9 D10 and aspects, never raw birth input',()=>{
 const facts=detailedReportFacts(chart,'uk');
 assert.deepEqual(facts.map(x=>x.id),['identity','planets','houses','aspects','navamsa','dashamsa','rules','dasha']);
 const payload=JSON.stringify(facts);
 for(const forbidden of ['2000-01-01','Asia/Kolkata','28.6139','77.209'])
  assert.ok(!payload.includes(forbidden),'Raw birth field transmitted: '+forbidden);
 assert.match(facts.find(x=>x.id==='planets').fact,/Юпітер/);
 assert.match(facts.find(x=>x.id==='navamsa').fact,/D9/);
 assert.match(facts.find(x=>x.id==='dashamsa').fact,/D10/);
});
test('illustrations are identified as fixed editorial source IDs, not LLM supplied URLs',()=>{
 const report=buildDetailedReport(chart,'uk');
 const images=report.sections.filter(x=>x.image).map(x=>x.image);
 assert.ok(images.includes('cosmos'));
 assert.ok(images.includes('earth'));
 assert.ok(images.includes('nebula'));
 assert.ok(images.every(x=>['cosmos','earth','nebula'].includes(x)));
});

test('Engine 2.0 report includes formal rulers, dignities and detected yoga facts with traceable evidence',()=>{
 const report=buildDetailedReport(chart,'uk','2026-10-13');
 for(const name of ['house-lords','dignities','yogas'])assert.ok(byId(report,name),name);
 assert.equal(report.rulesVersion,'2.0.0');
 assert.equal(report.asOf,'2026-10-13');
 assert.equal(report.rulesDigest.length,64);
 assert.equal(report.ruleFacts.filter(f=>f.id.startsWith('house-lord:')).length,12);
 assert.equal(report.ruleFacts.filter(f=>f.id.startsWith('dignity:')).length,9);
 assert.ok(report.ruleFacts.every(f=>f.evidence.length));
});
test('same calculated chart + language + asOf produces bit-for-bit identical canonical report',()=>{
 const first=JSON.stringify(buildDetailedReport(chart,'uk','2026-10-13'));
 const second=JSON.stringify(buildDetailedReport(chart,'uk','2026-10-13'));
 assert.equal(first,second);
 const tomorrow=buildDetailedReport(chart,'uk','2026-10-14');
 assert.notEqual(tomorrow.rulesDigest,buildDetailedReport(chart,'uk','2026-10-13').rulesDigest);
});

test('usable evidence-based weekly actions exist even without an LLM',()=>{
 const a=buildDetailedReport(chart,'uk','2026-10-13');
 const b=buildDetailedReport(chart,'uk','2026-10-13');
 assert.ok(a.practicalTips.length>=2);
 assert.deepEqual(a.practicalTips,b.practicalTips);
 assert.ok(a.practicalTips.every(t=>t.action.length>=40&&t.evidence.some(e=>e.startsWith('D1.'))));
 assert.ok(a.practicalTips.some(t=>t.title.includes('Кар')||t.title.includes('Ресурс')||t.title.includes('Стосунк')||t.title.includes('Довіра')));
 const english=buildDetailedReport(chart,'en','2026-10-13');
 assert.equal(english.practicalTips.length,a.practicalTips.length);
 assert.notEqual(english.practicalTips[0].action,a.practicalTips[0].action);
});

test('life portrait has five practical narrative themes, each linked to actual chart positions',()=>{
 const a=buildDetailedReport(chart,'uk','2026-10-13');
 const b=buildDetailedReport(chart,'uk','2026-10-13');
 assert.deepEqual(a.lifePortrait,b.lifePortrait);
 assert.deepEqual(a.lifePortrait.chapters.map(c=>c.id),['strengths','challenges','relationships','career','money','inner-life','growth']);
 for(const section of a.lifePortrait.chapters){
  assert.ok(section.overview.length>110);
  assert.ok(section.example.length>35);
  assert.ok(section.action.length>25);
  assert.ok(section.evidence.length>0);
  for(const evidence of section.evidence){
   if(!evidence.startsWith('D1.'))continue;
   const match=evidence.match(/^D1\.(\w+)\.(sign|house)=(\d+)$/);
   assert.ok(match,'Evidence format is grounded: '+evidence);
   assert.equal(chart.d1.find(x=>x.name===match[1])[match[2]],Number(match[3]));
  }
 }
 const changed=structuredClone(chart);
 changed.d1.find(x=>x.name==='Venus').sign=7;
 changed.d1.find(x=>x.name==='Venus').house=8;
 changed.d1.find(x=>x.name==='Venus').longitude=180+13.25;
 assert.notDeepEqual(a.lifePortrait,buildDetailedReport(changed,'uk','2026-10-13').lifePortrait);
});

test('reader-first editorial report has chart-specific chapters and accurately counted elements',()=>{
 const uk=buildDetailedReport(chart,'uk','2026-10-13');
 const en=buildDetailedReport(chart,'en','2026-10-13');
 assert.equal(uk.editorial.version,'4.1.0');
 assert.deepEqual(uk.editorial.chapters.map(c=>c.id),['portrait','configuration','tensions','relationships','career','resources','timing','conclusion']);
 assert.equal(uk.editorial.elements.reduce((s,v)=>s+v.count,0),7);
 assert.ok(uk.editorial.elements.every(v=>v.percentage===Math.round(v.count/7*100)));
 assert.ok(uk.editorial.highlights.length===3);
 assert.ok(uk.editorial.chapters.every(c=>c.paragraphs.length>=2&&c.evidence.length));
 assert.ok(uk.editorial.chapters.every(c=>!c.insights.length));
 assert.match(uk.editorial.chapters.find(c=>c.id==='career').paragraphs.join(' '),/Десятий дім|управитель|Дашамша/);
 assert.ok(!uk.editorial.chapters.some(c=>c.paragraphs.some(p=>p.includes('Placidus')||p.includes('Уран'))));
 assert.equal(en.editorial.elements.map(v=>v.count).join(','),uk.editorial.elements.map(v=>v.count).join(','));
 assert.deepEqual(uk.editorial,buildDetailedReport(chart,'uk','2026-10-13').editorial);
 const changed=structuredClone(chart);
 const sun=changed.d1.find(p=>p.name==='Sun');
 sun.sign=10;sun.signName='Capricorn';sun.house=11;sun.longitude=283.25;
 assert.notDeepEqual(uk.editorial,buildDetailedReport(changed,'uk','2026-10-13').editorial);
});

test('reader summary supplies astrology rather than a worksheet action list',()=>{
 const editorial=buildDetailedReport(chart,'uk','2026-10-13').editorial;
 const end=editorial.chapters.find(c=>c.id==='conclusion');
 assert.equal(end.insights.length,0);
 assert.match(end.paragraphs.join(' '),/управитель|махадаша/);
 assert.ok(editorial.chapters.every(ch=>ch.insights.length===0));
 assert.doesNotMatch(editorial.chapters.flatMap(ch=>ch.paragraphs).join(' '),/Традиційний ключ:|Оберіть дві практичні ідеї/);
});
test('reader v3: synthesis rather than duplicate keys, meaningful D1 cluster and house lords',()=>{
 const natal=structuredClone(chart);
 natal.ascendant.sign=4;natal.ascendant.signName='Cancer';
 for(const name of ['Sun','Mars','Mercury','Saturn']){
  const p=natal.d1.find(g=>g.name===name);p.house=9;p.sign=12;p.signName='Pisces';p.longitude=343.25;
 }
 const moon=natal.d1.find(g=>g.name==='Moon');
 moon.house=12;moon.sign=3;moon.signName='Gemini';moon.longitude=73.25;
 for(const graha of natal.d1)graha.house=((graha.sign-natal.ascendant.sign+12)%12)+1;
 const reading=buildDetailedReport(natal,'uk','2026-10-20').editorial;
 const byChapter=id=>reading.chapters.find(c=>c.id===id).paragraphs.join(' ');
 assert.match(byChapter('configuration'),/Сонце.*Марс.*Меркурій.*Сатурн/);
 assert.match(byChapter('configuration'),/9-му домі/);
 assert.match(byChapter('tensions'),/Марс і Сатурн/);
 assert.match(byChapter('portrait'),/Місяць у Близнюках, у домі 12/);
 assert.match(byChapter('relationships'),/Навамша D9/);
 assert.match(byChapter('career'),/Дашамша D10/);
 assert.match(byChapter('career'),/Управитель дев’ятого дому Юпітер/);
 assert.match(byChapter('career'),/управитель десятого дому Марс/);
 assert.doesNotMatch(byChapter('career'),/Десятий дім[^.]*його управитель Юпітер/);
 assert.match(byChapter('timing'),/махадаша Сатурн/);
 assert.ok(reading.chapters.every(ch=>!ch.insights.length));
 assert.doesNotMatch(reading.chapters.flatMap(ch=>ch.paragraphs).join(' '),/Традиційний ключ:|Оберіть дві практичні/);
});


test('Interpretation v3 findings are ranked, evidence-linked and free of identifying birth data',()=>{
 const reading=buildDetailedReport(chart,'uk','2026-10-20').editorial;
 assert.ok(reading.findings.length>=12&&reading.findings.length<=24);
 assert.ok(reading.findings.every(f=>f.ruleId&&f.verifiedEvidence.length&&f.supportingFactors.length&&f.limitations.length));
 assert.ok(reading.findings.every(f=>Number.isFinite(f.relativeImportance)));
 assert.equal(reading.chapters.length,8);
 const serialized=JSON.stringify(reading);
 for(const secret of ['Asia/Kolkata','28.6139','77.209','2000-01-01'])
  assert.ok(!serialized.includes(secret));
 assert.ok(reading.chapters.every(c=>!c.insights.length));
 assert.ok(!reading.chapters.some(c=>c.id==='elements'));
});

test('A8.5 twenty independent synthetic whole-sign charts yield stable, substantively different consultations',()=>{
 const variants=[];
 for(let i=0;i<20;i++){
  const sample=structuredClone(chart);
  const asc=i%12+1;
  sample.ascendant.sign=asc;sample.ascendant.signName=signs[asc-1];
  sample.d1.forEach((g,j)=>{
   const zodiac=((i*7+j*3+(j===3?i:0)+(i>=12&&(j===0||j===4)?(i-11)*2:0))%12)+1;
   g.sign=zodiac;g.signName=signs[zodiac-1];g.house=((zodiac-asc+12)%12)+1;
   g.longitude=(zodiac-1)*30+13.25;
  });
  const out=buildDetailedReport(sample,'uk','2026-10-20').editorial;
  assert.equal(out.version,'4.1.0');
  assert.ok(out.findings.every(f=>f.verifiedEvidence.length));
  assert.equal(out.chapters.length,8);
  assert.deepEqual(out,buildDetailedReport(sample,'uk','2026-10-20').editorial);
  variants.push(JSON.stringify(out.chapters.map(c=>c.paragraphs)));
 }
 assert.ok(new Set(variants).size>=18,'reader should not recycle the same consultation for every chart');
});

test('reader v3 rejects inconsistent whole-sign input rather than inventing narrative',()=>{
 const invalid=structuredClone(chart);
 invalid.d1[0].house=1;
 assert.throws(()=>buildDetailedReport(invalid,'uk','2026-10-20'),/whole-sign house mismatch/);
});


test('A7 reader never presents ninth-house Jupiter as the tenth-house ruler, including English',()=>{
 const natal=structuredClone(chart);
 natal.ascendant.sign=4;natal.ascendant.signName='Cancer';
 const zodiac={Sun:12,Moon:3,Mars:12,Mercury:12,Jupiter:9,Venus:1,Saturn:12,Rahu:7,Ketu:1};
 for(const graha of natal.d1){
  graha.sign=zodiac[graha.name];graha.signName=signs[graha.sign-1];
  graha.house=((graha.sign-4+12)%12)+1;
  graha.longitude=(graha.sign-1)*30+13.25;
 }
 for(const language of ['uk','en']){
  const report=buildDetailedReport(natal,language,'2026-10-20').editorial;
  const career=report.chapters.find(c=>c.id==='career').paragraphs.join(' ');
  assert.ok(career.includes(language==='uk'?'дев’ятого дому Юпітер':'ninth-house ruler Jupiter'),career);
  assert.ok(career.includes(language==='uk'?'десятого дому Марс':'tenth-house ruler Mars'),career);
 }
});
