import test from 'node:test';
import assert from 'node:assert/strict';
import {SuccessfulConsultationCache} from '../apps/api/src/consultation-replay.ts';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {reviewGeneratedConsultation,polishConsultationText} from '../apps/api/src/consultation-prose-review.ts';
import {DIRECT_JYOTISH_INSTRUCTION} from '../apps/api/src/direct-jyotish.ts';
const input={date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0};
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const lons=[255,72,345,350,15,220,18,120,300];
const chart=calculateChart(input,{ayanamsa:23.8,ascendant:335,
 positions:names.map((name,i)=>({name,longitude:lons[i],speed:1})),
 julianDay:2451545,backend:'synthetic'});
test('simultaneous identical consultations share exactly one upstream request',async()=>{
 let calls=0,now=1000;
 const cache=new SuccessfulConsultationCache(60000,4,()=>now);
 const work=async()=>{calls++;await Promise.resolve();return {result:{provider:'gemini',text:'Verified report.'}};};
 const [a,b,c]=await Promise.all([cache.obtain('chart:lang:2026:direct-v2',work),cache.obtain('chart:lang:2026:direct-v2',work),cache.obtain('chart:lang:2026:direct-v2',work)]);
 assert.equal(calls,1);
 assert.equal(a.reused,false);
 assert.equal(b.reused,true);
 assert.equal(c.reused,true);
 assert.equal(a.outcome.result.text,'Verified report.');
 const d=await cache.obtain('chart:lang:2026:direct-v2',work);
 assert.equal(d.reused,true);assert.equal(calls,1);
 now=62000;
 const e=await cache.obtain('chart:lang:2026:direct-v2',work);
 assert.equal(e.reused,false);assert.equal(calls,2);
});
test('failed consultations are not cached, and different keys are independent',async()=>{
 const cache=new SuccessfulConsultationCache();
 let tries=0;
 await cache.obtain('A',async()=>{tries++;return {result:null,reason:'rate_limited'};});
 const second=await cache.obtain('A',async()=>{tries++;return {result:{text:'OK'}};});
 assert.equal(tries,2);assert.equal(second.reused,false);
 let b=0;
 await cache.obtain('B',async()=>{b++;return {result:{text:'B'}};});
 assert.equal(b,1);
});
test('upstream exceptions do not poison next retry',async()=>{
 const cache=new SuccessfulConsultationCache();
 await assert.rejects(()=>cache.obtain('A',async()=>{throw Error('network');}));
 const good=await cache.obtain('A',async()=>({result:{text:'Recovered'}}));
 assert.equal(good.outcome.result.text,'Recovered');
});
test('review detects missing D9/D10 and investment absolutes without rejecting useful text',()=>{
 const text='## Мій шлях\n\nВаш Юпітер визначає напрямок вашої професії. Це не час для великих інвестицій. Ваш Місяць пов’язаний із внутрішнім життям.';
 const check=reviewGeneratedConsultation(text,chart,'uk','2026-10-22');
 assert.ok(check.codes.includes('missing_d9_analysis'));
 assert.ok(check.codes.includes('missing_d10_analysis'));
 assert.ok(check.codes.includes('unsupported_financial_directive'));
 assert.ok(check.codes.includes('short_consultation'));
 assert.ok(Array.isArray(check.codes));
});
test('review recognizes varga coverage and does not over-claim text verification',()=>{
 const s='## Моя карта\n\nЛагна D9 доповнює розуміння партнерства. В D10 Сонце вказує на особливості роботи. '+('Детальна інформація про управителів дозволяє зіставляти вміння з відповідальністю. ').repeat(90);
 const q=reviewGeneratedConsultation(s,chart,'uk','2026-10-22');
 assert.equal(q.d9Mentioned,true);
 assert.equal(q.d10Mentioned,true);
 assert.ok(!q.codes.includes('missing_d9_analysis'));
 assert.ok(!q.codes.includes('missing_d10_analysis'));
});
test('safe UA grammatical polish does not alter planet numbers or EN text',()=>{
 const raw='Ваша Місяць у 8-му домі. Ваша десята хапа — єдиний мірило успіху.';
 const polished=polishConsultationText(raw,'uk');
 assert.match(polished,/Ваш Місяць/);
 assert.match(polished,/десятий дім/);
 assert.match(polished,/єдине мірило/);
 assert.equal(polishConsultationText(raw,'en'),raw);
});
test('prompt requests varga distinctions, no fixed investment decisions and retains single-call narrative',()=>{
 assert.match(DIRECT_JYOTISH_INSTRUCTION,/AT LEAST ONE VERIFIED placement from EACH of D9 and D10/);
 assert.match(DIRECT_JYOTISH_INSTRUCTION,/Never prescribe whether the reader should make, sell, stop or postpone a financial investment/);
 assert.doesNotMatch(DIRECT_JYOTISH_INSTRUCTION,/8 required chapters|call the editor|second model/i);
});
