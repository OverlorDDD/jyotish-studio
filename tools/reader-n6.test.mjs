import test from 'node:test';
import assert from 'node:assert/strict';
import {buildN6Brief,parseN6Response,inspectN6Response,n6ProviderPayload,planN6Repair,mergeN6Repair} from '../apps/api/src/reader-n6.ts';
const reader={version:'reader10-plain-1',language:'en',chapters:['self','money','work','love','home','path','timing','summary'].map(id=>({id,title:id,lead:'Original lead for '+id+'.',paragraphs:['Original paragraph for '+id+'.'],details:{paragraphs:['First source fact.','Second source fact.'],basis:'Local basis.',links:[]}}))};
const brief=buildN6Brief(reader);
const output=()=>({chapters:brief.chapters.map(c=>({id:c.id,lead:'A thoughtful interpretation for '+c.id+'.',paragraphs:[{text:'First distinct interpretation for '+c.id+' explains the relevant strengths in ordinary language while keeping the reader’s choices open and acknowledging competing influences.',evidenceIds:[c.evidence[0].id]},{text:'Second distinct interpretation for '+c.id+' develops a separate tension in daily life without inventing events or promising a particular outcome.',evidenceIds:[c.evidence[1].id]}]}))});
test('N6 replaces prose only, preserves local details and does not mutate classic',()=>{
 const original=JSON.stringify(reader),x=parseN6Response(JSON.stringify(output()),reader,brief);
 assert.ok(x);assert.equal(x.chapters.length,8);assert.deepEqual(x.chapters.map(c=>c.details),reader.chapters.map(c=>c.details));assert.ok(x.chapters.every(c=>c.evidenceIds.length===2));assert.equal(JSON.stringify(reader),original);
});
test('N6 rejects incomplete chapters, unknown evidence, technical claims, repeated paragraphs and truncation',()=>{
 for(const mutate of [x=>x.chapters.pop(),x=>x.chapters[0].paragraphs[0].evidenceIds=['work.0'],x=>x.chapters[0].lead='Mercury sits in D9.',x=>x.chapters[1].paragraphs[0].text=x.chapters[0].paragraphs[0].text,x=>x.chapters[0].paragraphs[1].evidenceIds=['self.0']]){
 const x=output();mutate(x);assert.equal(parseN6Response(JSON.stringify(x),reader,brief),null);
 }
 assert.equal(parseN6Response('{',reader,brief),null);
});

test('N6 provider path uses one structured request and falls back without accepting malformed documents',async()=>{
 const {generateDirectJyotish}=await import('../apps/api/src/direct-jyotish.ts');
 const {calculateChart}=await import('../packages/jyotish-core/src/index.ts');
 const chart=calculateChart({date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},{ayanamsa:23.8,ascendant:100,julianDay:2451545,backend:'synthetic',positions:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}))});
 let calls=0;
 const opts={reader10:reader,order:['gemini','groq'],keys:{gemini:'fake',groq:'fake'},freeConfirmed:{gemini:true,groq:true},limit:()=>true,fetcher:async(_u,req)=>{
  calls++;const body=JSON.parse(req.body);assert.match(body.messages[0].content,/Return ONLY JSON/);
  assert.doesNotMatch(JSON.stringify(body),/2000-01-01|latitude|longitude/);
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(output())}}]}));
 }};
 const result=await generateDirectJyotish(chart,'en','2026-11-26',opts);
 assert.equal(calls,1);assert.equal(result.result.provider,'gemini');assert.equal(result.result.reader10.chapters.length,8);
 calls=0;const invalid=await generateDirectJyotish(chart,'en','2026-11-26',{...opts,fetcher:async()=>{calls++;return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'not JSON'}}]}));}});
 assert.ok(calls>=2&&calls<=4);assert.equal(invalid.result,null);assert.equal(invalid.reason,'invalid_response');
});

test('N6.1 accepts a conventional JSON fence and optional context, but rejects missing required IDs and unchanged Reader prose',()=>{
 const x=output();
 assert.ok(parseN6Response('\x60\x60\x60json\n'+JSON.stringify(x)+'\n\x60\x60\x60',reader,brief));
 x.chapters[0].paragraphs[0].evidenceIds=['unknown'];
 assert.equal(inspectN6Response(JSON.stringify(x),reader,brief).reason,'unknown_evidence');
 const b={...brief,context:[{id:'shared.pattern',text:'Verified shared factor.'}]};
 const y=output();y.chapters[0].paragraphs[0].evidenceIds.push('shared.pattern');
 const enriched=parseN6Response(JSON.stringify(y),reader,b);assert.ok(enriched);assert.ok(enriched.chapters[0].details.paragraphs.includes('Verified shared factor.'));
});
test('N6.1 real timing contract requires three substantial paragraphs and both period rulers',()=>{
 const r={...reader,chapters:reader.chapters.map(c=>c.id==='timing'?{...c,details:{...c.details,paragraphs:['Major date.','Minor date.','Major placement.','Minor placement.','Their relationship.']}}:c)};
 const b=buildN6Brief(r),t=b.chapters.find(c=>c.id==='timing');
 assert.equal(t.minWords,85);assert.equal(t.minParagraphs,3);assert.equal(t.required.length,5);
 assert.equal(inspectN6Response(JSON.stringify(output()),r,b).reason,'chapter_shape');
});

test('N6.1 compact backup preserves every evidence and required ID while removing redundant prose',()=>{
 const compact=JSON.parse(n6ProviderPayload(brief,true));
 for(let i=0;i<brief.chapters.length;i++){
  assert.deepEqual(compact.chapters[i].required,brief.chapters[i].required);
  assert.deepEqual(compact.chapters[i].evidence,brief.chapters[i].evidence);
  assert.equal(compact.chapters[i].paragraphs,undefined);
 }
 assert.ok(n6ProviderPayload(brief,true).length<n6ProviderPayload(brief,false).length);
});
test('N6.1 substantive timing output is accepted only with both period facts and their relationship',()=>{
 const r={...reader,chapters:reader.chapters.map(c=>c.id==='timing'?{...c,details:{...c.details,paragraphs:['Major date.','Minor date.','Major placement.','Minor placement.','Their relationship.']}}:c)};
 const b=buildN6Brief(r),x=output(),t=x.chapters.find(c=>c.id==='timing');
 t.paragraphs=[
  {text:'The longer stage is a chance to examine the responsibilities you have accepted over time and to distinguish sustainable commitments from those that repeatedly pull attention away from your priorities.',evidenceIds:['timing.0','timing.2']},
  {text:'The shorter stage brings the immediate question of how you respond to changing needs, especially when your normal routine no longer offers enough room to think through your own choices.',evidenceIds:['timing.1','timing.3']},
  {text:'Rather than treating either theme as a fixed outcome, consider the tension between the two and choose one concrete commitment that leaves sufficient time for reflection and careful communication.',evidenceIds:['timing.4']}
 ];
 assert.ok(parseN6Response(JSON.stringify(x),r,b));
 t.paragraphs[2].evidenceIds=['timing.3'];
 assert.equal(inspectN6Response(JSON.stringify(x),r,b).reason,'missing_required_evidence');
});

test('N6.2 Gemini 503 falls back to Groq strict schema and preserves the full local validator',async()=>{
 const {generateDirectJyotish}=await import('../apps/api/src/direct-jyotish.ts');
 const {calculateChart}=await import('../packages/jyotish-core/src/index.ts');
 const chart=calculateChart({date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},{ayanamsa:23.8,ascendant:100,julianDay:2451545,backend:'synthetic',positions:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}))});
 const calls=[],events=[];
 const response=(x=output())=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(x)}}]}));
 const opts={reader10:reader,order:['gemini','groq'],keys:{gemini:'fake',groq:'fake'},freeConfirmed:{gemini:true,groq:true},limit:()=>true,onDiagnostic:x=>events.push(x),fetcher:async(url,req)=>{
  const b=JSON.parse(req.body);calls.push(b);
  if(String(url).includes('googleapis'))return new Response('{}',{status:503});
  assert.equal(b.response_format.type,'json_schema');assert.equal(b.response_format.json_schema.strict,true);
  const s=b.response_format.json_schema.schema;
  assert.equal(s.additionalProperties,false);assert.deepEqual(s.required,['chapters']);
  assert.deepEqual(s.properties.chapters.items.required,['id','lead','paragraphs']);
  assert.doesNotMatch(JSON.stringify(b),/2000-01-01|latitude|longitude/);
  return response();
 }};
 const ok=await generateDirectJyotish(chart,'en','2026-11-26',opts);
 assert.equal(calls.length,2);assert.equal(ok.result?.provider,'groq');assert.equal(ok.result.reader10.chapters.length,8);
 assert.ok(events.some(x=>x.provider==='gemini'&&x.httpStatus===503));
 calls.length=0;events.length=0;
 let n=0;const recovered=await generateDirectJyotish(chart,'en','2026-11-26',{...opts,order:['groq'],fetcher:async(_url,req)=>{
  const b=JSON.parse(req.body);calls.push(b);n++;
  if(n===1)return new Response(JSON.stringify({error:{code:'json_validate_failed',message:'Failed to generate JSON',failed_generation:'PRIVATE_DO_NOT_LOG'}}),{status:400});
  assert.equal(b.response_format,undefined);assert.match(b.messages[0].content,/groq_json_generation_failed/);return response();
 }});
 assert.equal(calls.length,2);assert.equal(recovered.result?.provider,'groq');
 assert.ok(events.some(x=>x.reason==='groq_json_generation_failed'));assert.doesNotMatch(JSON.stringify(events),/PRIVATE_DO_NOT_LOG|Failed to generate JSON/);
 for(const status of [400,429,401,503]){
  n=0;const rejected=await generateDirectJyotish(chart,'en','2026-11-26',{...opts,order:['groq'],fetcher:async()=>{n++;return new Response(JSON.stringify({error:{code:'arbitrary_secret',message:'PRIVATE_DO_NOT_LOG'}}),{status});}});
  assert.equal(n,1);assert.equal(rejected.result,null);
 }
 n=0;const malformed=await generateDirectJyotish(chart,'en','2026-11-26',{...opts,order:['groq'],fetcher:async()=>{n++;const x=output();x.chapters[0].paragraphs[0].evidenceIds=['invented'];return response(x);}});
 assert.equal(n,1);assert.equal(malformed.result,null);
});

test('N6.2 normalizes harmless prose typography without dropping technical claims',()=>{
 const x=output(),p=x.chapters[0].paragraphs[0];
 const original=p.text;
 p.text=' \n '+original.replace(/\.$/,'')+' \t ';
 assert.equal(parseN6Response(JSON.stringify(x),reader,brief).chapters[0].paragraphs[0],original);
 for(const [suffix,reason] of [[' D9.','plain_digits'],[' <b>bold</b>.','plain_markup'],[' Neptune.','plain_unsupported_planet'],[' unfinished,','plain_ending']]){
  p.text=original+suffix;
  const checked=inspectN6Response(JSON.stringify(x),reader,brief);
  assert.equal(checked.reason,reason);assert.equal(checked.chapter,'self');
 }
});
test('N6.2 repairs only failed chapters and revalidates the complete document',()=>{
 const x=output();x.chapters[1].paragraphs[0].text+=' D9.';
 const plan=planN6Repair(JSON.stringify(x),reader,brief);
 assert.deepEqual(plan.ids,['money']);assert.deepEqual(plan.issues,['money:plain_digits']);
 assert.equal(plan.brief.chapters.length,1);
 const repaired=mergeN6Repair(JSON.stringify({chapters:[output().chapters[1]]}),plan);
 assert.deepEqual(JSON.parse(repaired),output());
 assert.ok(parseN6Response(repaired,reader,brief));
 assert.equal(mergeN6Repair(JSON.stringify({chapters:[output().chapters[0]]}),plan),null);
 x.chapters[2].paragraphs[0].evidenceIds=['invented'];
 assert.equal(planN6Repair(JSON.stringify(x),reader,brief),null);
});
test('N6.2 Groq content repair sends only failed chapters, counts calls, and never accepts a bad repair',async()=>{
 const {generateDirectJyotish}=await import('../apps/api/src/direct-jyotish.ts');
 const {calculateChart}=await import('../packages/jyotish-core/src/index.ts');
 const chart=calculateChart({date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},{ayanamsa:23.8,ascendant:100,julianDay:2451545,backend:'synthetic',positions:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}))});
 let calls=0,permits=0;const events=[];
 const x=output();x.chapters[1].paragraphs[0].text+=' D9. PRIVATE_REJECTED_TEXT.';
 const opts={reader10:reader,order:['groq'],keys:{groq:'fake'},freeConfirmed:{groq:true},limit:()=>{permits++;return true;},onDiagnostic:d=>events.push(d),fetcher:async(_url,req)=>{
  calls++;const b=JSON.parse(req.body);
  if(calls===2){assert.match(b.messages[0].content,/money:plain_digits/);assert.doesNotMatch(JSON.stringify(b),/PRIVATE_REJECTED_TEXT/);assert.equal(JSON.parse(b.messages[1].content.split('facts:\n')[1]).chapters.length,1);}
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(calls===1?x:{chapters:[output().chapters[1]]})}}]}));
 }};
 const accepted=await generateDirectJyotish(chart,'en','2026-11-26',opts);
 assert.equal(calls,2);assert.equal(permits,2);assert.equal(accepted.result?.provider,'groq');
 assert.ok(events.some(d=>d.reason==='n6_plain_digits_money'));assert.ok(events.some(d=>d.reason==='n6_repaired_complete'));
 calls=0;const rejected=await generateDirectJyotish(chart,'en','2026-11-26',{...opts,fetcher:async()=>{calls++;return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(calls===1?x:{chapters:[x.chapters[1]]})}}]}));}});
 assert.equal(calls,2);assert.equal(rejected.result,null);
});
