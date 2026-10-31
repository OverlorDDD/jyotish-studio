import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildAstrologicalSynthesis,circularDistance,aspectBetween} from '../apps/api/src/astrological-synthesis.ts';
import {tropicalSkyForDay,tropicalSkyAtUtc} from '../apps/api/src/western-horoscope.ts';
import {dailyTransit} from '../apps/api/src/personal-transits.ts';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const sample='2026-10-31',zone='Europe/Kyiv';
async function inputs(){
 const [western,vedic,natal]=await Promise.all([
  tropicalSkyForDay(sample,zone),
  dailyTransit(sample,zone,4,3),
  tropicalSkyAtUtc('1996-03-27T12:00:00.000Z')
 ]);
 return {date:sample,western,vedic,
  natalWestern:{Sun:natal.sun.longitude,Moon:natal.moon.longitude},
  natalVedic:{moonSign:3,lagnaSign:4}};
}
test('real verified Swiss both coordinate systems and local noon share same sample',async()=>{
 const input=await inputs();
 assert.equal(input.western.sampledAtUtc,input.vedic.sampledAtUtc);
 assert.match(input.vedic.ephemerisBackend,/verified-SWIEPH/);
 assert.equal(input.western.planets.Sun.longitude,input.western.sun.longitude);
 assert.equal(input.western.planets.Moon.longitude,input.western.moon.longitude);
 assert.equal(Object.keys(input.western.planets).length,7);
 const report=buildAstrologicalSynthesis(input);
 assert.equal(report.version,'ASE_V1');
 assert.equal(report.date,sample);
 assert.equal(report.provenance.sampledAtUtc,input.vedic.sampledAtUtc);
 assert.equal(report.western.reference,'TROPICAL_NATAL_SUN_AND_MOON');
 assert.equal(report.vedic.reference,'SIDEREAL_NATAL_MOON_AND_LAGNA');
 assert.ok(report.vedic.signals.length>0);
 assert.ok(report.western.signals.every(s=>s.orbDegrees<=4&&s.source.startsWith('SWISS_TROPICAL')));
 assert.ok(report.vedic.signals.every(s=>s.house>=1&&s.house<=12));
});
test('aspect shortest-arc math handles wraparound 359° ↔ 1°, exact, square and orb cutoffs',()=>{
 assert.equal(circularDistance(359,1),2);
 assert.equal(circularDistance(1,359),2);
 assert.equal(aspectBetween(359,1)?.key,'conjunction');
 assert.equal(aspectBetween(91,1)?.key,'square');
 assert.equal(aspectBetween(60,0)?.key,'sextile');
 assert.equal(aspectBetween(120,0)?.key,'trine');
 assert.equal(aspectBetween(180,0)?.key,'opposition');
 assert.equal(aspectBetween(38,1),null);
 assert.throws(()=>circularDistance(NaN,30));
});
test('genuine shared topic requires signals from BOTH systems, never a manufactured consensus',async()=>{
 const input=await inputs();
 const mercury=input.vedic.planets.find(p=>p.name==='Mercury');
 assert.ok(mercury);
 const lagna=((mercury.sign-3+12)%12)+1;
 const western={...input.western,
  planets:{...input.western.planets,
   Mercury:{longitude:input.natalWestern.Sun,sign:Math.floor(input.natalWestern.Sun/30)+1}}};
 const result=buildAstrologicalSynthesis({...input,western,
  natalVedic:{...input.natalVedic,lagnaSign:lagna}});
 assert.ok(result.western.signals.some(s=>s.planet==='Mercury'&&s.aspect==='conjunction'));
 assert.ok(result.vedic.signals.some(s=>s.planet==='Mercury'&&s.house===3));
 assert.equal(result.status,'convergence');
 assert.ok(result.commonTopics.some(t=>t.key==='communication'));
 const emptyBodies=Object.fromEntries(Object.entries(input.western.planets)
  .map(([name])=>[name,{longitude:52,sign:2}]));
 const noMatch=buildAstrologicalSynthesis({...input,
  western:{...input.western,planets:emptyBodies},
  natalWestern:{Sun:35,Moon:35}});
 assert.equal(noMatch.status,'limited_evidence');
 assert.equal(noMatch.commonTopics.length,0);
 assert.equal(noMatch.western.signals.length,0);
});
test('strictly reject incompatible time zones, mixed sky instants and unverifiable Swiss backend',async()=>{
 const input=await inputs();
 assert.throws(()=>buildAstrologicalSynthesis({...input,date:'2026-11-01'}),/Mismatched/);
 assert.throws(()=>buildAstrologicalSynthesis({...input,
  western:{...input.western,sampledAtUtc:'2026-10-31T14:00:00.000Z'}}),/Mismatched/);
 assert.throws(()=>buildAstrologicalSynthesis({...input,
  vedic:{...input.vedic,ephemerisBackend:'Moshier'}}),/Incomplete/);
 assert.throws(()=>buildAstrologicalSynthesis({...input,
  natalVedic:{moonSign:13,lagnaSign:4}}),/Incomplete/);
});
test('API auth and personal synthesis UI never use guest chart or an LLM to manufacture planetary evidence',()=>{
 const api=source('apps/api/src/personal.ts'),engine=source('apps/api/src/astrological-synthesis.ts');
 const ui=source('apps/web/app/components/HoroscopeHub.tsx'),panel=source('apps/web/app/components/AstrologicalSynthesisPanel.tsx');
 assert.match(api,/@Get\('horoscope\/synthesis'\)/);
 assert.match(api,/const uid=owner\(req\)/);
 assert.match(api,/requires_verified_chart/);
 assert.match(api,/buildAstrologicalSynthesis/);
 assert.match(ui,/synthesis-switch/);
 assert.match(panel,/ASTROLOGICAL_SYNTHESIS_V1/);
 assert.match(panel,/synthesis-evidence-/);
 assert.match(panel,/credentials:'same-origin',cache:'no-store'/);
 assert.doesNotMatch(engine,/import.*(?:openai|gemini|groq|fetch|prisma)/i);
});
