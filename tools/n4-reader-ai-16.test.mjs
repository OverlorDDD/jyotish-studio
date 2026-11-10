import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {makeN4RcPayload,N4_RC_DIVISIONS} from '../apps/api/src/n4-rc-contract.ts';
import {makeN4D60Candidate} from '../apps/api/src/n4-d60-candidate.ts';
import {buildN4VargaReadings,compactN4VargaFacts,verifiedVargaSource,N4_VARGA_READER_VERSION} from '../apps/api/src/reader-varga-n4.ts';
import {buildDetailedReport} from '../apps/api/src/report.ts';
import {compactJyotishFacts,generateDirectJyotish,validateN4ConsultationReferences,DIRECT_JYOTISH_INSTRUCTION,productionDirectAiOrder} from '../apps/api/src/direct-jyotish.ts';
import {astrologicalFacts} from '../apps/api/src/ai.ts';
import {buildReaderV7,compactReaderV7ForAi,READER_V7_VERSION} from '../apps/api/src/reader-v7.ts';

const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const birth={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,longitude:30.52};
const fixed=(seed=0)=>({
 ayanamsa:23.8,ascendant:11.713+seed*5,
 julianDay:2451545,backend:'synthetic-test-N4-reader',
 positions:names.map((name,i)=>({name,longitude:(i*33.17+7+seed*19)%360,speed:i%3===0?-.1:.3}))
});
function fixture(seed=0){
 const chart=calculateChart(birth,fixed(seed));
 const proof={version:'jyotish-integrity-v3',status:'verified_internal',digest:(seed%2?'b':'a').repeat(64),
  externalReferenceChecked:false,checks:['synthetic_unit_source']};
 const n4=makeN4RcPayload(chart,proof);
 const n4D60=makeN4D60Candidate(chart,proof);
 return {...chart,verification:proof,n4,n4D60};
}
test('N4 Reader covers 15 source-bound charts plus a noninterpretive D60 notice in both languages',()=>{
 const chart=fixture();
 for(const lang of ['uk','en']){
  const reading=buildN4VargaReadings(chart,lang);
  assert.equal(reading.version,N4_VARGA_READER_VERSION);
  assert.equal(reading.status,'available');
  assert.deepEqual(reading.readings.map(r=>r.division),[...N4_RC_DIVISIONS]);
  assert.equal(reading.readings.length,15);
  assert.ok(reading.readings.every(r=>r.summary.length>100&&r.practice.length>60&&r.evidence.length>=6));
  assert.ok(reading.readings.every(r=>r.scope==='internal_verified_D1_derivation'));
  assert.equal(reading.d60.status,'provisional_no_individual_interpretation');
  assert.match(reading.d60.message,/D60/);
  assert.ok(!reading.readings.some(r=>r.division===60));
  const d27=reading.readings.find(r=>r.division===27);
  assert.ok(d27.title.includes(lang==='uk'?'Сильні':'Strengths'));
  assert.match(d27.summary,/D1.*D27/);
 }
 const report=buildDetailedReport(chart,'uk','2026-11-07');
 assert.equal(report.editorial.chapters.length,8,'preserve 8 authored Reader v6 chapters');
 assert.equal(report.vargaReadings.status,'available');
 assert.equal(report.vargaReadings.readings.length,15);
});
test('Different verified horoscopes yield distinct thematic narratives, not a generic repeated template',()=>{
 const a=buildN4VargaReadings(fixture(0),'en');
 const b=buildN4VargaReadings(fixture(1),'en');
 assert.notEqual(a.readings.find(r=>r.division===24).summary,b.readings.find(r=>r.division===24).summary);
 assert.notEqual(a.readings.find(r=>r.division===27).summary,b.readings.find(r=>r.division===27).summary);
 for(const r of a.readings){
  const d1Ruler=r.evidence.find(e=>e.startsWith('D1.house-lord.')).split('=')[1];
  assert.ok(r.evidence.includes('D'+r.division+'.'+d1Ruler+'.house='+a.readings.find(e=>e.division===r.division).evidence.find(e=>e.startsWith('D'+r.division+'.'+d1Ruler+'.house=')).split('=')[1]));
 }
});
test('Missing, mismatched, or forged N4 evidence fails closed in Reader and AI',()=>{
 const v=fixture();
 for(const bad of [
  {...v,n4:undefined},
  {...v,n4:{...v.n4,sourceDigest:'f'.repeat(64)}},
  {...v,n4:{...v.n4,d60Excluded:false}},
  {...v,n4:{...v.n4,d2Method:'unsupported'}},
  {...v,n4:{...v.n4,charts:v.n4.charts.map((c,i)=>i===2?{...c,lagnaSign:13}:c)}},
  {...v,verification:{...v.verification,status:'unverified'}}
 ]){
  assert.equal(verifiedVargaSource(bad),null);
  assert.equal(buildN4VargaReadings(bad,'uk').status,'unavailable');
  assert.equal(buildN4VargaReadings(bad,'uk').readings.length,0);
  assert.match(compactN4VargaFacts(bad),/unavailable/);
  assert.doesNotMatch(compactN4VargaFacts(bad),/D27\.Moon\.house=/);
 }
});
test('Compact LLM material contains source-bound D2/D24/D27/D30 but never birth identifiers or D60 placements',()=>{
 const chart=fixture();
 const facts=compactN4VargaFacts(chart),all=compactJyotishFacts(chart,'2026-11-07');
 for(const div of [2,3,4,7,12,16,20,24,27,30,40,45])assert.match(facts,new RegExp('D'+div+' focus='));
 assert.match(facts,/D60: METHOD_ONLY/);
 assert.doesNotMatch(facts,/D60\.(?:Sun|Moon|Saturn|lagna)\.sign=/);
 assert.ok(all.length<12500,'bounded, anonymized prompt, not 16 nine-planet inventories');
 assert.match(all,/Classical Reader 8/);
 assert.ok(!all.includes('2000-01-01')&&!all.includes('50.45')&&!all.includes('30.52'),'birth privacy');
 assert.match(DIRECT_JYOTISH_INSTRUCTION,/two|TWO/);
 assert.match(DIRECT_JYOTISH_INSTRUCTION,/D60/);
 const short=astrologicalFacts(chart,'en',Date.UTC(2026,10,7));
 assert.ok(short.some(f=>f.id==='n4-vargas'));
 const legacy=astrologicalFacts(calculateChart(birth,fixed()),'en',Date.UTC(2026,10,7));
 assert.ok(!legacy.some(f=>f.id==='n4-vargas'));
});
test('AI reference review rejects D60/fantasy D5, and fails if new vargas are ignored',()=>{
 const v=fixture();
 assert.equal(validateN4ConsultationReferences('D9 and D10 only',v).reason,'missing_n4_cross_varga_synthesis');
 assert.equal(validateN4ConsultationReferences('D1 / D9 / D27 / D24',v).ok,true);
 assert.equal(validateN4ConsultationReferences('Д27 і Д24 — нові тематичні карти',v).ok,true);
 assert.equal(validateN4ConsultationReferences('D4 and D60 predict past lives',v).reason,'unsupported_divisional_chart');
 assert.equal(validateN4ConsultationReferences('D27 and D5',v).reason,'unsupported_divisional_chart');
 const plain=calculateChart(birth,fixed());
 assert.equal(validateN4ConsultationReferences('D9 and D10',plain).ok,true);
 assert.equal(validateN4ConsultationReferences('D27 D24',plain).ok,false);
});


test('Reader 7 is concrete, multilingual, source-bound and free of unexplained chart jargon',()=>{
 for(let seed=0;seed<2;seed++){
  const chart=fixture(seed),ua=buildReaderV7(chart,'uk'),en=buildReaderV7(chart,'en');
  assert.equal(ua.version,READER_V7_VERSION);
  assert.equal(ua.status,'available');
  assert.equal(en.status,'available');
  assert.equal(ua.insights.length,15);
  assert.equal(en.insights.length,15);
  assert.equal(ua.highlights.length,3);
  assert.equal(ua.insights.find(i=>i.division===27).title,'Сильні сторони');
  for(const item of ua.insights){
   assert.ok(item.headline.length>40&&item.strength.length>80&&item.challenge.length>90&&item.step.length>90);
   assert.ok(item.proof.length>=8);
   assert.doesNotMatch(item.strength+item.challenge+item.step,/накшатра|антардаша|лагна|йогакарака|управител[ья]|\bD\d+/iu);
   assert.doesNotMatch(item.step,/медичн|фінансов.{0,10}порад/iu);
  }
  for(const item of en.insights)assert.doesNotMatch(item.strength+item.challenge+item.step,/nakshatra|antardasha|yogakaraka|house lord/iu);
  assert.ok(!ua.insights.some(i=>i.division===60));
  assert.ok(ua.d60Notice.includes('D60'));
  assert.match(compactReaderV7ForAi(chart),/D27/);
  assert.doesNotMatch(compactReaderV7ForAi(chart),/date:2000|latitude|longitude|D60\.Moon\.house/i);
 }
 assert.notEqual(buildReaderV7(fixture(0),'uk').insights.find(i=>i.division===10).headline,
  buildReaderV7(fixture(1),'uk').insights.find(i=>i.division===10).headline);
 const unverified=calculateChart(birth,fixed());
 assert.equal(buildReaderV7(unverified,'uk').status,'unavailable');
});
test('Reader 7 stops on forged digest/method, rather than presenting synthetic personality findings',()=>{
 const v=fixture();
 for(const bad of [{...v,n4:{...v.n4,sourceDigest:'b'.repeat(64)}},{...v,n4:{...v.n4,d2Method:'other'}}]){
  const reading=buildReaderV7(bad,'en');
  assert.equal(reading.status,'unavailable');assert.equal(reading.insights.length,0);
 }
});
test('AI rejects repeated filler and fabricated literal D27 graha houses, but allows correct facts',()=>{
 const v=fixture();
 assert.equal(validateN4ConsultationReferences('D27 D24 '+('Same long sentence repeated to fill space. ').repeat(4),v).reason,'repetitive_ai_filler');
 const d27=v.n4.charts.find(d=>d.division===27),actual=d27.planets.find(p=>p.name==='Mars');
 assert.equal(validateN4ConsultationReferences('D27 Mars house '+((actual.house%12)+1)+' and D24',v).reason,'fabricated_varga_placement');
 assert.equal(validateN4ConsultationReferences('D27 Mars house '+actual.house+' and D24',v).ok,true);
});

test('Cloud AI input carries new N4 evidence and accepts only grounded multi-varga synthesis',async()=>{
 const chart=fixture();
 const prose='## Grounded Jyotish overview\\n\\n'+
  'D27 gives a contextual view of resilience when compared with the D1 thematic house ruler, while D24 refines learning. '+
  Array.from({length:12},(_,i)=>'Practical observation '+(i+1)+': compare a distinct choice in the fields of relationships, learning, work, recovery and boundaries with the verified themes; note what changes when conditions shift. ').join('')+
  'A practical response is to compare the two themes in a real choice and observe which habits support long-term learning.';
 let payload;
 const result=await generateDirectJyotish(chart,'en','2026-11-07',{
  order:['gemini'],keys:{gemini:'test'},freeConfirmed:{gemini:true},limit:()=>true,
  fetcher:async(_url,request)=>{
   payload=JSON.parse(request.body);
   return new Response(JSON.stringify({model:'fake-gemini',choices:[{finish_reason:'stop',message:{content:prose}}]}),{status:200});
  }
 });
 assert.ok(payload.messages[1].content.includes('D27 focus='));
 assert.ok(payload.messages[1].content.includes('D24 focus='));
 assert.ok(!payload.messages[1].content.includes(birth.date));
 assert.equal(result.result?.provider,'gemini');
 assert.equal(result.result?.text,prose);
});
test('Cloud AI refuses a confident D60 claim and retains deterministic Reader fallback',async()=>{
 const chart=fixture();
 const prose='## Claimed prediction\\n\\n'+('D60 guarantees a past-life outcome with certainty. ').repeat(40);
 const result=await generateDirectJyotish(chart,'en','2026-11-07',{
  order:['groq'],keys:{groq:'test'},freeConfirmed:{groq:true},limit:()=>true,
  fetcher:async()=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:prose}}]}),{status:200})
 });
 assert.equal(result.result,null);
 assert.equal(result.reason,'invalid_response');
});

test('N499 Gemini is always first; old or malformed order never disables free backup providers',()=>{
 assert.deepEqual(productionDirectAiOrder(''),['gemini','groq','openrouter']);
 assert.deepEqual(productionDirectAiOrder('openrouter,gemini,groq'),['gemini','openrouter','groq']);
 assert.deepEqual(productionDirectAiOrder('OLLAMA,wrong-value'),['gemini','groq','openrouter']);
 assert.deepEqual(productionDirectAiOrder('groq,groq,openrouter'),['gemini','groq','openrouter']);
});
