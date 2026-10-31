import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateAshtakavarga,avSignsFromNatal,grahaDrishti,AV_GRAHAS} from '../apps/api/src/ashtakavarga.ts';
import {houseFromCusps,tropicalNatalChartAtUtc} from '../apps/api/src/western-natal.ts';
import {angleOrb,westernNatalContacts,westernTransitContacts,traceContactWindow,vedicAdvancedEvidence} from '../apps/api/src/advanced-synthesis.ts';
import {editorialWesternReading,editorialSynthesis,editorialAdvancedReading,houseTheme} from '../apps/api/src/horoscope-editorial.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('BPHS unreduced 7x8 tables conserve all 337 scores for 25 deterministic natal layouts',()=>{
 const expected={Sun:48,Moon:49,Mars:39,Mercury:54,Jupiter:56,Venus:52,Saturn:39};
 for(let n=0;n<25;n++){
  const placements=AV_GRAHAS.map((name,i)=>({name,sign:((n*3+i*i*7)%12)+1}));
  const signs=avSignsFromNatal(placements,((n*5)%12)+1);
  const result=calculateAshtakavarga(signs);
  assert.equal(result.total,337);
  assert.equal(result.sav.reduce((a,b)=>a+b,0),337);
  assert.equal(result.sav.length,12);
  for(const name of AV_GRAHAS){
   assert.equal(result.bav[name].reduce((a,b)=>a+b,0),expected[name]);
   assert.ok(result.bav[name].every(v=>v>=0&&v<=8));
  }
  for(let i=0;i<12;i++)
   assert.equal(result.sav[i],AV_GRAHAS.reduce((s,g)=>s+result.bav[g][i],0));
 }
 assert.throws(()=>avSignsFromNatal([{name:'Sun',sign:12}],1),/Missing valid natal/);
 assert.throws(()=>calculateAshtakavarga({...Object.fromEntries(
  [...AV_GRAHAS,'Lagna'].map(x=>[x,1])) ,Saturn:13}),/Invalid natal/);
});
test('Parashari special graha drishti uses inclusive 1-based house counting',()=>{
 assert.deepEqual(grahaDrishti('Mars',1).map(x=>x.toSign),[4,7,8]);
 assert.deepEqual(grahaDrishti('Jupiter',12).map(x=>x.toSign),[4,6,8]);
 assert.deepEqual(grahaDrishti('Saturn',10).map(x=>x.toSign),[12,4,7]);
 assert.deepEqual(grahaDrishti('Venus',4).map(x=>x.toSign),[10]);
 assert.throws(()=>grahaDrishti('Mars',0));
});
test('Full tropical house cusp wrapping and precise aspects are deterministic',()=>{
 const cusps=Array.from({length:12},(_,i)=>(350+i*30)%360);
 assert.equal(houseFromCusps(359,cusps),1);
 assert.equal(houseFromCusps(19,cusps),1);
 assert.equal(houseFromCusps(20,cusps),2);
 assert.throws(()=>houseFromCusps(40,cusps.slice(0,11)));
 assert.equal(angleOrb(359,1,0),2);
 assert.equal(angleOrb(359,179,180),0);
 assert.equal(angleOrb(90,0,90),0);
});
test('Numerical solver distinguishes exact UTC from clipped search horizons',async()=>{
 const center='2026-10-31T12:00:00.000Z',t0=Date.parse(center);
 const natal={planets:{Sun:{longitude:100}}};
 const contact={id:'T:Sun:Sun:conjunction',planet:'Sun',target:'Sun',
  aspect:'conjunction',angle:0,orb:3,orbLimit:3,applying:'stationary_or_turning'};
 const result=await traceContactWindow(natal,contact,center,{
  sample:async utc=>100+(Date.parse(utc)-t0)/86400000});
 assert.equal(result.clippedStart,false);
 assert.equal(result.clippedEnd,false);
 assert.ok(Math.abs(Date.parse(result.startUtc)-(t0-3*86400000))<=300000);
 assert.ok(Math.abs(Date.parse(result.endUtc)-(t0+3*86400000))<=300000);
 assert.ok(result.exactUtc.some(utc=>Math.abs(Date.parse(utc)-t0)<=300000));
 const slow=await traceContactWindow(natal,contact,center,{
  sample:async utc=>100+(Date.parse(utc)-t0)/1000000000});
 assert.equal(slow.clippedStart,true);
 assert.equal(slow.clippedEnd,true);
});
test('Real Swiss ephemeris: exact Western birth chart, natal/transit contacts and 12 houses',async()=>{
 const natal=await tropicalNatalChartAtUtc('2000-01-01T12:00:00.000Z',50.45,30.52);
 assert.equal(natal.cusps.length,12);
 assert.equal(Object.keys(natal.planets).length,7);
 assert.ok(natal.cusps.every(x=>x>=0&&x<360));
 assert.ok(Object.values(natal.planets).every(p=>p.house>=1&&p.house<=12));
 assert.ok(westernNatalContacts(natal).every(x=>x.orb<=x.orbLimit));
 const contacts=await westernTransitContacts(natal,'2026-10-31T12:00:00.000Z');
 assert.ok(contacts.every(x=>x.orb<=x.orbLimit));
 assert.ok(contacts.every(x=>['applying','separating','stationary_or_turning'].includes(x.applying)));
});
test('Vedic gochara map and Ashtakavarga use real natal signs, never invented houses',()=>{
 const positions=[...AV_GRAHAS].map((name,i)=>({name,sign:i+1}));
 const transit={ephemerisBackend:'verified-SWIEPH',sampledAtUtc:'2026-10-31T12:00:00.000Z',
  planets:AV_GRAHAS.map((name,i)=>({name,sign:i+2,longitude:30*(i+1)}))};
 const evidence=vedicAdvancedEvidence(transit,positions,10,{lord:'Saturn',antardasha:'Venus'});
 assert.equal(evidence.ashtakavarga.total,337);
 assert.equal(evidence.drishti.length,13);
 assert.equal(evidence.gochara[0].houseFromLagna,5);
 assert.equal(evidence.periodContext.lord,'Saturn');
 assert.equal(evidence.periodFactors.length,2);
 assert.equal(evidence.periodFactors[0].lord,'Saturn');
 assert.deepEqual(evidence.periodFactors[0].ruledHouses,[1,2]);
 assert.equal(evidence.periodFactors[0].natalHouse,10);
 assert.equal(evidence.periodFactors[1].lord,'Venus');
 assert.ok(evidence.periodFactors.every(x=>x.strengthModel==='OBSERVED_CONTEXT_NO_QUANTITATIVE_DASHA_WEIGHT'));

 assert.throws(()=>vedicAdvancedEvidence({...transit,ephemerisBackend:'Moshier'},positions,10));
});
test('Western natal sign editorial uses Sun, Moon and Mercury without the old warnings',()=>{
 const one=editorialWesternReading({sunHouse:8,moonHouse:4,mercuryHouse:7});
 assert.match(one.description.uk,/спільн|довір|домашн/i);
 assert.match(one.description.uk,/Меркурій/);
 assert.match(one.goodFor.uk,/Перевір/);
 assert.doesNotMatch(JSON.stringify(one),/не сприймай|не гаранті|символічне загальне|not a prediction/i);
 const other=editorialWesternReading({sunHouse:2,moonHouse:11,mercuryHouse:1});
 assert.notDeepEqual(other,one);
 for(let h=1;h<=12;h++)assert.ok(houseTheme(h).action.uk.length>30);
 assert.throws(()=>houseTheme(13),/Invalid reference house/);
});
test('Synthesis foregrounds actual western transit aspect and independent Vedic house',()=>{
 const western=[{id:'W:1',planet:'Saturn',topic:'responsibility',aspect:'square',target:'Moon'}];
 const vedic=[{id:'V:1',planet:'Saturn',topic:'responsibility',house:4}];
 const synthesis=editorialSynthesis({western,vedic,status:'convergence',
  topic:{uk:'Обов’язки та витримка',en:'Commitments and patience'}});
 assert.match(synthesis.description.uk,/Сатурн/);
 assert.match(synthesis.description.uk,/квадрат/);
 assert.match(synthesis.description.uk,/4-й дім/);
 assert.match(synthesis.description.en,/Western|Saturn/);
 assert.doesNotMatch(JSON.stringify(synthesis),/не вигадуємо|символічне трактування|гарантія подій|not a deterministic/i);
 const different=editorialSynthesis({western,vedic,status:'different_emphases',topic:null});
 assert.notDeepEqual(different.headline,synthesis.headline);
});
test('ASE-3 deterministic reading cites real source signals without calling providers',()=>{
 const input={
  contacts:[{id:'T:Sun:Moon:trine',planet:'Sun',target:'Moon',aspect:'trine',applying:'applying'}],
  gochara:[{graha:'Saturn',houseFromMoon:4,houseFromLagna:8,bav:4,sav:28}],
  periods:[{lord:'Saturn',level:'mahadasha',natalHouse:10,ruledHouses:[1,2]}]
 };
 const first=editorialAdvancedReading(input),second=editorialAdvancedReading(input);
 assert.deepEqual(first,second);
 assert.equal(first.version,'ASE_V3_DETERMINISTIC');
 assert.equal(first.paragraphs.length,3);
 assert.deepEqual(first.paragraphs[0].evidenceIds,['T:Sun:Moon:trine']);
 assert.deepEqual(first.paragraphs[1].evidenceIds,['V:GOCHARA:Saturn']);
 assert.match(first.paragraphs[1].text.uk,/Бхінна-аштакаварга/);
 assert.match(first.paragraphs[2].text.uk,/махадаша/);
 const api=read('apps/api/src/personal.ts'),ui=read('apps/web/app/components/AstrologicalSynthesisPanel.tsx');
 assert.doesNotMatch(api,/horoscope\/synthesis\/reading|generateASE3Reading|selectASEFacts|synthesisAiLimiter/);
 assert.doesNotMatch(ui,/synthesis-ai-v3|aiConsent|horoscope\/synthesis\/reading|AI-провайдер/);
 assert.match(ui,/synthesis-editorial-v3/);
 assert.match(ui,/credentials:'same-origin'/);
});
test('ASE-2/3 private data remain owner scoped and no model is imported by the horoscope engine',()=>{
 const api=read('apps/api/src/personal.ts');
 assert.match(api,/@Get\('horoscope\/synthesis\/advanced'\)/);
 assert.match(api,/owner\(req\)/);
 assert.match(api,/ownerId:uid/);
 const advanced=read('apps/api/src/advanced-synthesis.ts');
 assert.match(advanced,/editorialAdvancedReading/);
 assert.doesNotMatch(advanced,/openai|gemini|groq|openrouter/i);
 const western=read('apps/api/src/western-horoscope.ts');
 assert.match(western,/editorialWesternReading/);
});
