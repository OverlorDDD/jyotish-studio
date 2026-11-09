import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createN43PreviewServer} from './n43-live-preview-api.mjs';
const birth={date:'2000-01-01',time:'12:00',timeZone:'Etc/UTC',latitude:50.45,
 longitude:30.52,place:'SYNTHETIC_PREVIEW_TEST_ONLY'};
const send=(url,input)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
test('N4.3 isolated HTTP preview uses real native Swiss calc + real Reader 7 without any database',async()=>{
 const server=createN43PreviewServer();
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const port=server.address().port,base='http://127.0.0.1:'+port;
 try{
  const runtime=await fetch(base+'/api/v1/jyotish/runtime');
  assert.equal(runtime.status,200);
  const meta=await runtime.json();
  assert.equal(meta.readerEdition,'reader-v8.0.0-n44');
  assert.equal(meta.editorialEdition,'n48-poetic-evidence-1.0.0');
  assert.equal(meta.interpretationEdition,'n49-unified-evidence-v1');
  assert.equal(meta.presentationEdition,'n492-meaning-first-16-v1');
  assert.equal(meta.previewOnly,true);
  assert.equal(meta.productionAuthorized,false);
  assert.equal(meta.verificationContract,'jyotish-integrity-v3');
  const chartResponse=await send(base+'/api/v1/charts/calculate',birth);
  assert.equal(chartResponse.status,200);
  assert.equal(chartResponse.headers.get('cache-control'),'private, no-store');
  const chart=await chartResponse.json();
  assert.equal(chart.verification.status,'verified_internal');
  assert.equal(chart.n4.charts.length,15);
  assert.equal(chart.n4D60.division,60);
  assert.ok(!JSON.stringify(chart).includes('SYNTHETIC_PREVIEW_TEST_ONLY_UNEXPECTED'));
  for(const lang of ['uk','en']){
   const r=await send(base+'/api/v1/reports',{...birth,lang,preferred:'local',asOf:'2026-11-07'});
   assert.equal(r.status,200);
   const report=await r.json();
   assert.equal(report.verification.status,'verified_internal');
   assert.equal(report.readerV7.version,'reader-v7.0.0-n43');
   assert.equal(report.readerV7.status,'available');
   assert.equal(report.readerV7.insights.length,15);
   assert.equal(report.readerV7.highlights.length,3);
   assert.equal(report.readerV7.d60Notice.includes('D60'),true);
   assert.equal(report.readerV8.version,'reader-v8.0.0-n44');
   assert.equal(report.readerV8.editorialVersion,'n48-poetic-evidence-1.0.0');
   assert.equal(report.readerV8.status,'available');
   assert.equal(report.readerV8.insights.length,15);
   assert.equal(report.readerV8.compactCards.length,15);
   assert.equal(report.readerV8.meaningReader.version,'n492-meaning-first-16-v1');
   assert.deepEqual(report.readerV8.meaningReader.cards.map(c=>c.division),[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60]);
   assert.equal(report.readerV8.meaningReader.takeaways.length,3);
   assert.equal(report.readerV8.synthesis?.version,'n48-evidence-poetic-v1');
   assert.equal(report.readerV8.integrated?.version,'n49-unified-evidence-v1');
   assert.equal(report.readerV8.integrated.links.length,15);
   assert.equal(report.readerV8.integrated.threads.length,5);
   assert.ok(report.readerV8.synthesis.opening.length>120);
   assert.equal(report.readerV8.d60Preview?.version,'d60-conditional-signs-n47-v1');
   assert.equal(report.readerV8.d60Preview.status,'conditional_signs');
   assert.equal(report.readerV8.d60Preview.allPlanets.length,9);
   assert.ok(report.readerV8.d60Preview.factors.length>0);
   assert.ok(report.readerV8.d60Preview.factors.every(x=>x.boundaryDistanceArcseconds>=90));

   const careerRules=report.readerV8.insights.find(i=>i.division===10).ruleIds;
   const fallbackRules=careerRules.filter(id=>id.startsWith('BJ-X-1-NAVAMSA-VOCATION-'));
   assert.ok(fallbackRules.length===0||fallbackRules.length===3,
    'Brihat Jataka X.1 fallback must be either absent or cover all three origins');
   assert.equal(report.ai.source,'deterministic');
   assert.equal(report.ai.fallbackReason,'reader_only');
  }
  const approximate=await send(base+'/api/v1/reports',
   {...birth,lang:'uk',preferred:'local',minutesUncertain:true,asOf:'2026-11-07'});
  assert.equal(approximate.status,200);
  const approximateReader=(await approximate.json()).readerV8;
  assert.equal(approximateReader.status,'available');
  assert.equal(approximateReader.insights.length,15);
  assert.equal(approximateReader.d60Preview.status,'unavailable');
  assert.equal(approximateReader.d60Preview.factors.length,0);
  assert.equal(approximateReader.d60Preview.allPlanets.length,0);
  const invalid=await send(base+'/api/v1/reports',{...birth,time:'12:XX',lang:'uk',preferred:'local'});
  assert.equal(invalid.status,400);
  const denied=await fetch(base+'/api/admin');
  assert.equal(denied.status,404);
 }finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
test('N4.3 preview distinguishes real-provider-shaped response from deterministic fallback',async()=>{
 const server=createN43PreviewServer({ai:async()=>({result:{
  provider:'gemini',model:'synthetic-provider-only',text:'TEST MOCK. Never shown as a real AI certification.'}})});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const base='http://127.0.0.1:'+server.address().port;
 const prior=process.env.AI_MODE;process.env.AI_MODE='free';
 try{
  const res=await send(base+'/api/v1/reports',{...birth,lang:'en',preferred:'auto',asOf:'2026-11-07'});
  assert.equal(res.status,200);
  const report=await res.json();
  assert.equal(report.ai.source,'llm');
  assert.equal(report.ai.provider,'gemini');
  assert.equal(report.readerV7.insights.length,15);
  assert.equal(report.readerV8.insights.length,15);
 }finally{
  if(prior===undefined)delete process.env.AI_MODE;else process.env.AI_MODE=prior;
  await new Promise(resolve=>server.close(resolve));
 }
});
console.log('N43_PREVIEW_API_INTEGRATION_TEST_REGISTERED');
