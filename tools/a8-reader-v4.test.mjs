import {verifyFreeProse} from '../apps/api/src/interpretation-policy.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {classicalLordshipTable,yogakarakasForLagna,readerClassicalContext,checkNarrativeLordClaims,CLASSICAL_METHOD_SOURCES} from '../apps/api/src/reader-classical.ts';
import {parseAiConsultation,buildAiChapterSpecs,CHAPTER_IDS} from '../apps/api/src/consultation-ai.ts';
import {buildDetailedReport} from '../apps/api/src/report.ts';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const planets=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
function chartFor(ascendantSign,seed=0){
 const position=(name,sign,lagna)=>({
  name,sign,signName:signs[sign-1],house:((sign-lagna+12)%12)+1,
  longitude:(sign-1)*30+13.25,degreesInSign:13.25,nakshatra:'Swati',pada:4,retrograde:false
 });
 const assign=name=>{
  const initial={Sun:12,Moon:3,Mars:12,Mercury:12,Jupiter:9,Venus:1,Saturn:12,Rahu:7,Ketu:1};
  const base=initial[name];
  const shift=ascendantSign===4&&seed===0?0:(seed*3+ascendantSign+planets.indexOf(name))%12;
  return ((base+shift-1)%12)+1;
 };
 const d1=planets.map(name=>position(name,assign(name),ascendantSign));
 const fakeD9=planets.map((name,i)=>position(name,(i%12)+1,9));
 const fakeD10=planets.map((name,i)=>position(name,((i+2)%12)+1,5));
 const asc=position('Ascendant',ascendantSign,ascendantSign);
 return {input:{date:'2000-01-01',time:'12:00',latitude:0,longitude:0,timeZone:'UTC'},
 utc:'2000-01-01T12:00:00Z',ayanamsa:23.8,ephemeris:'synthetic test only',
 ascendant:asc,lagnaD9:position('Ascendant',9,9),lagnaD10:position('Ascendant',5,5),
 d1,d9:fakeD9,d10:fakeD10,
 dasha:[{lord:'Saturn',start:'2020-01-01',end:'2035-01-01',antardashas:[{lord:'Moon',start:'2026-01-01',end:'2027-01-01'}]}]};
}
test('A8.2 all 12 ascendants have 12 exact whole-sign classical house lords',()=>{
 const rulers=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
 for(let sign=1;sign<=12;sign++){
  const lords=classicalLordshipTable(sign);
  assert.equal(Object.keys(lords).length,12);
  for(let h=1;h<=12;h++)assert.equal(lords[h],rulers[(sign+h-2)%12],String(sign)+':'+h);
 }
});
test('A8.2 six kendra/trikona yogakaraka ascendants are calculated rather than guessed',()=>{
 const expected=new Map([[2,'Saturn'],[4,'Mars'],[5,'Mars'],[7,'Saturn'],[10,'Venus'],[11,'Venus']]);
 for(let lagna=1;lagna<=12;lagna++)
  assert.deepEqual(yogakarakasForLagna(lagna),expected.has(lagna)?[expected.get(lagna)]:[],String(lagna));
});
test('A8.1 Cancer fourth Venus, seventh Saturn, tenth Mars, yogakaraka Mars and correct dasha lords',()=>{
 const c=readerClassicalContext(chartFor(4),'2026-10-21');
 assert.equal(c.lords[4],'Venus');assert.equal(c.lords[7],'Saturn');
 assert.equal(c.lords[10],'Mars');assert.equal(c.lords[9],'Jupiter');
 assert.deepEqual(c.yogakarakas,['Mars']);
 assert.deepEqual(c.functional.find(f=>f.graha==='Mars').houses,[5,10]);
 assert.deepEqual(c.functional.find(f=>f.graha==='Venus').houses,[4,11]);
 assert.deepEqual(c.functional.find(f=>f.graha==='Saturn').houses,[7,8]);
 assert.equal(c.dasha?.major,'Saturn');assert.equal(c.dasha?.minor,'Moon');
 assert.deepEqual(c.dasha?.majorHouses,[7,8]);assert.deepEqual(c.dasha?.minorHouses,[1]);
});
test('A8.1 rejects observed false family Saturn, numeric and English examples',()=>{
 const lords=classicalLordshipTable(4);
 assert.equal(checkNarrativeLordClaims('Управитель сімейного дому, Сатурн, додає відповідальності.',lords).ok,false);
 assert.equal(checkNarrativeLordClaims('Ruler of the fourth house, Saturn, carries the burden.',lords).ok,false);
 assert.equal(checkNarrativeLordClaims('Управитель 4-го дому, Сатурн, дає дисципліну.',lords).ok,false);
 assert.equal(checkNarrativeLordClaims('Управитель сімейного дому, Венера, пов’язана з домом.',lords).ok,true);
});
test('A8.4 semantic gate discards one incorrect section while preserving other seven',()=>{
 const lords=classicalLordshipTable(4);
 const specs=CHAPTER_IDS.map(id=>({id,title:id,facts:['computed rule evidence']}));
 const good='Traditional Jyotish connects these chart factors with personal responsibility and patient growth. Their confirmed counterweight calls for a nuanced reading rather than a certain event. It is a traditional interpretation rather than a claim about the actual future.';
 const bad=good+' Ruler of the fourth house, Saturn, creates a family obligation.';
 const raw=CHAPTER_IDS.map(id=>'[['+id+']]\n'+(id==='relationships'?bad:good)).join('\n\n');
 const result=parseAiConsultation(raw,specs,[],lords);
 assert.equal(result.length,7);
 assert.equal(result.some(x=>x.id==='relationships'),false);
});
test('A8.3 bibliographic methods are not fabricated exact Sanskrit verse citations',()=>{
 assert.ok(CLASSICAL_METHOD_SOURCES.length>=3);
 assert.ok(CLASSICAL_METHOD_SOURCES.some(x=>x.work==='Brihat Jataka'));
 assert.ok(CLASSICAL_METHOD_SOURCES.every(x=>x.status.includes('edition')||x.status.includes('review')||x.status.includes('verified')));
});
test('A8.5 twenty synthetic charts have eight evidence chapters and stable varied texts',()=>{
 const signatures=[];
 for(let i=0;i<20;i++){
  const natal=chartFor(i%12+1,Math.floor(i/12));
  const report=buildDetailedReport(natal,'uk','2026-10-21').editorial;
  assert.equal(report.version,'4.1.0');
  assert.equal(report.chapters.length,8);
  assert.ok(report.findings.length>=12);
  assert.ok(report.findings.every(x=>x.ruleId&&x.verifiedEvidence.length));
  assert.ok(report.chapters.every(x=>x.paragraphs.length>=2&&x.evidence.length));
  const specs=buildAiChapterSpecs(report);
  assert.equal(specs.length,8);assert.ok(specs.every(s=>s.facts.length>0));
  signatures.push(JSON.stringify(report.chapters.map(c=>c.paragraphs)));
 }
 assert.ok(new Set(signatures).size>=18);
});
test('A8.1 English and Ukrainian Cancer career passages mention yogakaraka Mars',()=>{
 const chart=chartFor(4);
 for(const lang of ['uk','en']){
  const r=buildDetailedReport(chart,lang,'2026-10-21').editorial;
  const career=r.chapters.find(x=>x.id==='career').paragraphs.join(' ');
  assert.match(career,lang==='uk'?/йогакарак/i:/yogakaraka/i);
 }
});

test('A8.4 yogakaraka only allowed with exact lagna proof, no unsupported named yoga',()=>{
 const prose='Для лагни в Раку Марс — йогакарака: в традиційному читанні він пов’язує покликання з творенням та наполегливою дією, хоча інші чинники карти мають значення.';
 assert.equal(verifyFreeProse(prose,[]).ok,false);
 assert.equal(verifyFreeProse(prose,['yogakaraka']).ok,true);
 const unsupported='Йогакарака Марс і Малавйя йога визначають майбутнє.';
 assert.equal(verifyFreeProse(unsupported,['yogakaraka']).ok,false);
});
