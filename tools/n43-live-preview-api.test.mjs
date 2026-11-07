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
   assert.equal(report.readerV7.version,'reader-v8.0.0-n44');
   assert.equal(report.readerV7.status,'available');
   assert.equal(report.readerV7.insights.length,15);
   assert.equal(report.readerV7.highlights.length,3);
   assert.equal(report.readerV7.d60Notice.includes('D60'),true);
   assert.equal(report.readerV8.version,'reader-v8.0.0-n44');
   assert.equal(report.readerV8.status,'available');
   assert.equal(report.readerV8.insights.length,15);
   assert.ok(report.readerV8.insights.find(i=>i.division===10).ruleIds.includes('BJ-X-1-NAVAMSA-VOCATION'));
   assert.equal(report.ai.source,'deterministic');
   assert.equal(report.ai.fallbackReason,'reader_only');
  }
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
