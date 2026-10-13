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
