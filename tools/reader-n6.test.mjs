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
 assert.equal(n6ProviderPayload(brief,true),n6ProviderPayload(brief,false));
 assert.doesNotMatch(n6ProviderPayload(brief,false),/Original lead|Original paragraph|styleExample/);
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

test('N6.2 Gemini 503 falls back to Groq JSON object mode and preserves the full local validator',async()=>{
 const {generateDirectJyotish}=await import('../apps/api/src/direct-jyotish.ts');
 const {calculateChart}=await import('../packages/jyotish-core/src/index.ts');
 const chart=calculateChart({date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},{ayanamsa:23.8,ascendant:100,julianDay:2451545,backend:'synthetic',positions:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}))});
 const calls=[],events=[];
 const response=(x=output())=>new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(x)}}]}));
 const opts={reader10:reader,order:['gemini','groq'],keys:{gemini:'fake',groq:'fake'},freeConfirmed:{gemini:true,groq:true},limit:()=>true,onDiagnostic:x=>events.push(x),fetcher:async(url,req)=>{
  const b=JSON.parse(req.body);calls.push(b);
  if(String(url).includes('googleapis'))return new Response('{}',{status:503});
  assert.deepEqual(b.response_format,{type:'json_object'});
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
 assert.equal(n,2);assert.equal(malformed.result,null);
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
 const combined=planN6Repair(JSON.stringify(x),reader,brief);assert.deepEqual(combined.ids,['money','work']);
 assert.equal(parseN6Response(JSON.stringify(x),reader,brief),null);
});
test('N6.2 Groq content repair sends only failed chapters, counts calls, and never accepts a bad repair',async()=>{
 const {generateDirectJyotish}=await import('../apps/api/src/direct-jyotish.ts');
 const {calculateChart}=await import('../packages/jyotish-core/src/index.ts');
 const chart=calculateChart({date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},{ayanamsa:23.8,ascendant:100,julianDay:2451545,backend:'synthetic',positions:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}))});
 let calls=0,permits=0;const events=[];
 const x=output();x.chapters[1].paragraphs[0].text+=' D9. PRIVATE_REJECTED_TEXT.';
 const opts={reader10:reader,order:['groq'],keys:{groq:'fake'},freeConfirmed:{groq:true},limit:()=>{permits++;return true;},onDiagnostic:d=>events.push(d),fetcher:async(_url,req)=>{
  calls++;const b=JSON.parse(req.body);
  if(calls===2){assert.match(b.messages[0].content,/money:plain_unknown_division/);assert.match(b.messages[1].content,/only the requested replacement chapters/);assert.deepEqual(b.response_format,{type:'json_object'});assert.doesNotMatch(JSON.stringify(b),/PRIVATE_REJECTED_TEXT/);assert.equal(JSON.parse(b.messages[1].content.split('facts:\n')[1]).chapters.length,1);}
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(calls===1?x:{chapters:[output().chapters[1]]})}}]}));
 }};
 const accepted=await generateDirectJyotish(chart,'en','2026-11-26',opts);
 assert.equal(calls,2);assert.equal(permits,2);assert.equal(accepted.result?.provider,'groq');
 assert.ok(events.some(d=>d.reason==='n6_plain_unknown_division_money'));assert.ok(events.some(d=>d.reason==='n6_repaired_complete'));
 calls=0;const rejected=await generateDirectJyotish(chart,'en','2026-11-26',{...opts,fetcher:async()=>{calls++;return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(calls===1?x:{chapters:[x.chapters[1]]})}}]}));}});
 assert.equal(calls,2);assert.equal(rejected.result,null);
});

test('N6.2 V3 repairs more than three chapters, mixed format/evidence faults and cross-chapter duplicates without accepting unsafe prose',()=>{
 const x=output();
 x.chapters[1].paragraphs[0].text+=' D2.';
 x.chapters[2].paragraphs[0].evidenceIds=['invented'];
 x.chapters[3].paragraphs[0].text+=' Neptune.';
 x.chapters[4].paragraphs[0].text=x.chapters[0].paragraphs[0].text;
 x.chapters[5].paragraphs[0].text+=' D20.';
 assert.equal(parseN6Response(JSON.stringify(x),reader,brief),null);
 const plan=planN6Repair(JSON.stringify(x),reader,brief);
 assert.deepEqual(plan.ids,['money','work','love','home','path']);
 const replacement={chapters:output().chapters.filter(c=>plan.ids.includes(c.id))};
 const merged=mergeN6Repair(JSON.stringify(replacement),plan);
 assert.deepEqual(JSON.parse(merged),output());
 assert.ok(parseN6Response(merged,reader,brief));
 replacement.chapters[1].paragraphs[0].evidenceIds=['invented'];
 assert.equal(parseN6Response(mergeN6Repair(JSON.stringify(replacement),plan),reader,brief),null);
});

test('N6.3 rejects a near-verbatim reflow of classic prose even with valid evidence IDs',()=>{
 const x=output();
 const r={...reader,chapters:reader.chapters.map(c=>c.id==='money'?{...c,lead:x.chapters[1].lead,paragraphs:x.chapters[1].paragraphs.map(p=>p.text)}:c)};
 const b=buildN6Brief(r);
 x.chapters[1].paragraphs[0].text+=' This can be worth considering.';
 const checked=inspectN6Response(JSON.stringify(x),r,b);
 assert.equal(checked.reason,'near_copy');assert.equal(checked.chapter,'money');
 assert.deepEqual(planN6Repair(JSON.stringify(x),r,b).ids,['money']);
});

test('N6.3 removes local copy anchors and keeps all required IDs available in provider input',()=>{
 const b=buildN6Brief(reader);
 for(const compact of [true,false]){
  const payload=JSON.parse(n6ProviderPayload(b,compact));
  for(const chapter of payload.chapters){
   assert.equal(chapter.lead,undefined);assert.equal(chapter.paragraphs,undefined);assert.equal(chapter.styleExample,undefined);
   const allowed=new Set([...chapter.evidence,...payload.context].map(e=>e.id));
   assert.ok(chapter.required.every(id=>allowed.has(id)));
  }
 }
});

test('N631 Groq reflows paragraph counts without losing words or evidence; full validation remains mandatory',async()=>{
 const {reflowGroqN6}=await import('../apps/api/src/direct-jyotish.ts');
 const x=output(),c=x.chapters[0],before=c.paragraphs.map(p=>p.text).join(' ');
 const ids=c.paragraphs.flatMap(p=>p.evidenceIds);
 c.paragraphs=[{text:before,evidenceIds:ids}];
 const raw=JSON.stringify(x),fixed=reflowGroqN6(raw,brief),y=JSON.parse(fixed);
 assert.equal(y.chapters[0].paragraphs.length,2);
 assert.equal(y.chapters[0].paragraphs.map(p=>p.text).join(' '),before);
 assert.deepEqual([...new Set(y.chapters[0].paragraphs.flatMap(p=>p.evidenceIds))],ids);
 assert.ok(parseN6Response(fixed,reader,brief));
 const bad=structuredClone(x);bad.chapters[0].paragraphs[0].evidenceIds=['invented'];assert.equal(parseN6Response(reflowGroqN6(JSON.stringify(bad),brief),reader,brief),null);
 const digit=structuredClone(x);digit.chapters[0].paragraphs[0].text+=' D9.';assert.equal(parseN6Response(reflowGroqN6(JSON.stringify(digit),brief),reader,brief),null);
 const zero=structuredClone(x);zero.chapters[0].paragraphs=[];assert.equal(reflowGroqN6(JSON.stringify(zero),brief),JSON.stringify(zero));
 const many=output();many.chapters[0].paragraphs=Array.from({length:4},(_,i)=>({text:['A distinct first sentence explains a useful theme.','Another sentence offers a different practical perspective.','The next sentence connects responsibility with everyday choices.','The final sentence acknowledges competing influences without promising outcomes.'][i],evidenceIds:[ids[i%ids.length]]}));
 const merged=JSON.parse(reflowGroqN6(JSON.stringify(many),brief));
 assert.equal(merged.chapters[0].paragraphs.length,3);
 assert.equal(merged.chapters[0].paragraphs.map(p=>p.text).join(' '),many.chapters[0].paragraphs.map(p=>p.text).join(' '));
 assert.ok(parseN6Response(JSON.stringify(merged),reader,brief));
});

test('N631 Groq accepts evidence-backed chart labels and ordinary numbers, rejects unknown divisions, D60 and precision claims',()=>{
 const x=output(),b={...brief,chapters:brief.chapters.map(c=>c.id==='money'?{...c,evidence:[{...c.evidence[0],text:'D1 house 2 and D2 Hora.'},c.evidence[1]]}:c)};
 const p=x.chapters[1].paragraphs[0],original=p.text;
 p.text=original+' D2 refines the 2nd house theme.';
 assert.ok(inspectN6Response(JSON.stringify(x),reader,b,false,true).reader);
 assert.equal(inspectN6Response(JSON.stringify(x),reader,b).reason,'plain_digits');
 for(const suffix of [' D99.',' D60.',' Шаштіамша.']){
  p.text=original+suffix;assert.equal(inspectN6Response(JSON.stringify(x),reader,b,false,true).reason,'plain_unknown_division');
 }
 for(const suffix of [' 2026-11-27.',' 50%.',' 20°.', ' $500.']){
  p.text=original+suffix;assert.equal(inspectN6Response(JSON.stringify(x),reader,b,false,true).reason,'plain_numeric_claim');
 }
 p.text=original+' D2 refines the 2nd house theme.';p.evidenceIds=['invented'];
 assert.equal(inspectN6Response(JSON.stringify(x),reader,b,false,true).reason,'unknown_evidence');
});

test('N631 Groq avoids a corrective call that cannot fit the upstream token budget',async()=>{
 const {generateDirectJyotish}=await import('../apps/api/src/direct-jyotish.ts');
 const {calculateChart}=await import('../packages/jyotish-core/src/index.ts');
 const chart=calculateChart({date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},{ayanamsa:23.8,ascendant:100,julianDay:2451545,backend:'synthetic',positions:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}))});
 let calls=0;const events=[],x=output();x.chapters[1].paragraphs[0].text+=' D99.';
 const result=await generateDirectJyotish(chart,'en','2026-11-26',{reader10:reader,order:['groq'],keys:{groq:'fake'},freeConfirmed:{groq:true},limit:()=>true,onDiagnostic:d=>events.push(d),fetcher:async()=>{
  calls++;return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(x)}}]}),{headers:{'x-ratelimit-remaining-tokens':'50'}});
 }});
 assert.equal(calls,1);assert.equal(result.reason,'rate_limited');assert.equal(result.result,null);
 assert.ok(events.some(d=>d.reason==='groq_repair_budget_insufficient'));
});

test('N631 source packets require an actual chapter-local model citation; no fabricated evidence',async()=>{
 const {packGroqN6,expandGroqPackets}=await import('../apps/api/src/reader-n6.ts');
 const b={...brief,context:[{id:'shared.cluster9',text:'D1 related concentration.'}],chapters:brief.chapters.map(c=>c.id==='self'?{...c,required:[...c.required,'shared.cluster9']}:c)};
 const p=packGroqN6(b);
 assert.deepEqual(p.brief.chapters[0].required,['self.core']);
 assert.match(p.brief.chapters[0].evidence[0].text,/First source fact.*Second source fact.*D1 related concentration/);
 const x=output();
 assert.equal(inspectN6Response(expandGroqPackets(JSON.stringify(x),p.packets),reader,b).reason,'missing_required_evidence');
 x.chapters[0].paragraphs[0].evidenceIds=['self.core'];
 assert.ok(inspectN6Response(expandGroqPackets(JSON.stringify(x),p.packets),reader,b).reader);
 x.chapters[1].paragraphs[0].evidenceIds=['self.core'];
 assert.equal(inspectN6Response(expandGroqPackets(JSON.stringify(x),p.packets),reader,b).reason,'unknown_evidence');
 x.chapters[1].paragraphs[0].evidenceIds=['invented'];
 assert.equal(inspectN6Response(expandGroqPackets(JSON.stringify(x),p.packets),reader,b).reason,'unknown_evidence');
 const r=packGroqN6({...b,chapters:[b.chapters[0]]},true);
 assert.equal(r.brief.context.length,0);
 assert.match(r.brief.chapters[0].evidence[0].text,/D1 related concentration/);
});
test('N631 token reset durations are parsed strictly and bounded',async()=>{
 const {parseGroqTokenReset}=await import('../apps/api/src/direct-jyotish.ts');
 assert.equal(parseGroqTokenReset('7.66s'),7660);
 assert.equal(parseGroqTokenReset('1m0.5s'),60500);
 for(const value of [null,'','nonsense','2m59.56s','-1s','1.0','9999999999m'])assert.equal(parseGroqTokenReset(value),null);
});

test('N631 incident: 400 JSON generation, 3489 tokens, 33.832s reset; admitted full request recovers once, no quota bypass',async()=>{
 const {generateDirectJyotish}=await import('../apps/api/src/direct-jyotish.ts');
 const {calculateChart}=await import('../packages/jyotish-core/src/index.ts');
 const chart=calculateChart({date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},{ayanamsa:23.8,ascendant:100,julianDay:2451545,backend:'synthetic',positions:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}))});
 const calls=[],waits=[],events=[];
 const headers={'x-ratelimit-limit-tokens':'8000','x-ratelimit-remaining-tokens':'3489','x-ratelimit-reset-tokens':'33.832s','x-ratelimit-remaining-requests':'999'};
 const result=await generateDirectJyotish(chart,'en','2026-11-26',{reader10:reader,order:['groq'],keys:{groq:'fake'},freeConfirmed:{groq:true},limit:()=>true,onDiagnostic:d=>events.push(d),groqTestWait:async ms=>{waits.push(ms);},fetcher:async(_url,req)=>{
  const body=JSON.parse(req.body);calls.push(body);
  if(calls.length===1){assert.deepEqual(body.response_format,{type:'json_object'});return new Response(JSON.stringify({error:{code:'json_validate_failed',message:'Failed to generate JSON'}}),{status:400,headers});}
  assert.equal(body.response_format,undefined);assert.equal(body.messages[1].content,calls[0].messages[1].content);
  assert.equal(body.max_completion_tokens,calls[0].max_completion_tokens);
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(output())}}]}));
 }});
 assert.equal(calls.length,2);assert.equal(waits.length,1);assert.ok(waits[0]>=33000&&waits[0]<=35332);
 assert.ok(events.some(e=>e.reason==='groq_json_generation_failed'&&e.httpStatus===400));
 assert.equal(result.result?.provider,'groq');
 // A real upstream 429 still never triggers a second request.
 let count=0;
 const blocked=await generateDirectJyotish(chart,'en','2026-11-26',{reader10:reader,order:['groq'],keys:{groq:'fake'},freeConfirmed:{groq:true},limit:()=>true,fetcher:async()=>{count++;return new Response('{}',{status:429,headers});}});
 assert.equal(count,1);assert.equal(blocked.reason,'rate_limited');assert.equal(blocked.result,null);
});

test('N64 review is advisory, records specific missing contrasts and generic praise without triggering generation',async()=>{
 const {reviewN64Report}=await import('../apps/api/src/reader-n6.ts');
 const b={...brief,context:[{id:'shared.lagnaChain',text:'Mercury debilitated.'}],chapters:brief.chapters.map(c=>c.id==='work'?{...c,evidence:[...c.evidence,{id:'work.v24',text:'D24 dignity contrast.'}]}:c)};
 const x=output();x.chapters[0].paragraphs[0].text+=' You can overcome any challenge.';
 const r=inspectN6Response(JSON.stringify(x),reader,b);
 assert.ok(r.reader);
 const flags=reviewN64Report(r.reader,b);
 assert.ok(flags.includes('self_dispositor_dignity_unmentioned'));assert.ok(flags.includes('work_contrast_unmentioned'));assert.ok(flags.includes('self_stock_phrase'));
});

test('N64 named D60 is rejected without eligible evidence in both presentation modes',()=>{
 const x=output();
 x.chapters[5].paragraphs[0].text+=' Shashtiamsha shows this.';
 for(const groq of [false,true])assert.equal(inspectN6Response(JSON.stringify(x),reader,brief,false,groq).reason,'plain_unknown_division');
});

test('N641 repair requires exact unique requested IDs and preserves final validation',async()=>{
 const {inspectN6RepairResponse,n6OutputContract}=await import('../apps/api/src/reader-n6.ts');
 const x=output();
 x.chapters[1].paragraphs[0].text+=' D99.';
 x.chapters[4].paragraphs[0].evidenceIds=['invented'];
 const plan=planN6Repair(JSON.stringify(x),reader,brief);
 assert.deepEqual(plan.ids,['money','home']);
 const replacement=output().chapters.filter(c=>plan.ids.includes(c.id)).reverse();
 const repaired=inspectN6RepairResponse(JSON.stringify({chapters:replacement}),plan);
 assert.equal(repaired.reason,'ok');
 assert.deepEqual(JSON.parse(repaired.merged),output());
 assert.ok(parseN6Response(repaired.merged,reader,brief));
 assert.equal(inspectN6RepairResponse('{',plan).reason,'json_syntax');
 assert.equal(inspectN6RepairResponse(JSON.stringify(output()),plan).reason,'chapter_count');
 assert.equal(inspectN6RepairResponse(JSON.stringify({chapters:[replacement[0],replacement[0]]}),plan).reason,'chapter_ids');
 assert.equal(inspectN6RepairResponse(JSON.stringify({chapters:[replacement[0],output().chapters[0]]}),plan).reason,'chapter_ids');
 replacement[0].paragraphs[0].evidenceIds=['invented'];
 assert.equal(parseN6Response(mergeN6Repair(JSON.stringify({chapters:replacement}),plan),reader,brief),null);
 const prompt=n6OutputContract(plan.brief);
 assert.match(prompt,/exactly 2 chapter objects in this order: money, home/);
 assert.match(prompt,/Do not mention D60/);
 const withD60={...brief,chapters:brief.chapters.map(c=>c.id==='path'?{...c,evidence:[...c.evidence,{id:'path.v60',text:'D60 conditional sign comparison.'}]}:c)};
 assert.match(n6OutputContract(withD60),/Only path may discuss/);
});

async function n641SyntheticChart(){
 const {calculateChart}=await import('../packages/jyotish-core/src/index.ts');
 return calculateChart({date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},{ayanamsa:23.8,ascendant:100,julianDay:2451545,backend:'synthetic',positions:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}))});
}
test('N641 Gemini missing mandatory timing evidence recovers using an explicit cited packet',async()=>{
 const {generateDirectJyotish}=await import('../apps/api/src/direct-jyotish.ts');
 const chart=await n641SyntheticChart();
 const r={...reader,chapters:reader.chapters.map(c=>c.id==='timing'?{...c,details:{...c.details,paragraphs:['Major period.','Minor period.','Major placement.','Minor placement.','Their relationship.']}}:c)};
 const x=output(),t=x.chapters.find(c=>c.id==='timing');
 t.paragraphs=[
  {text:'The longer stage is a chance to examine the responsibilities you have accepted over time and to distinguish sustainable commitments from those that repeatedly pull attention away from your priorities.',evidenceIds:['timing.0','timing.2']},
  {text:'The shorter stage brings the immediate question of how you respond to changing needs, especially when your normal routine no longer offers enough room to think through your own choices.',evidenceIds:['timing.1','timing.3']},
  {text:'Rather than treating either theme as a fixed outcome, consider the tension between the two and choose one concrete commitment that leaves sufficient time for reflection and careful communication.',evidenceIds:['timing.3']}
 ];
 let calls=0;const events=[];
 const result=await generateDirectJyotish(chart,'en','2026-11-26',{reader10:r,order:['gemini'],keys:{gemini:'fake'},freeConfirmed:{gemini:true},limit:()=>true,onDiagnostic:d=>events.push(d),fetcher:async(_url,req)=>{
  calls++;const body=JSON.parse(req.body),p=JSON.parse(body.messages[1].content.split('facts:\n')[1]);
  const timing=p.chapters.find(c=>c.id==='timing');
  assert.deepEqual(timing.required,['timing.core']);
  assert.match(timing.evidence.find(e=>e.id==='timing.core').text,/Major period.*Minor period.*Their relationship/);
  if(calls===2){
   assert.equal(p.chapters.length,1);
   assert.match(body.messages[0].content,/exactly 1 chapter objects in this order: timing/);
  }
  const fixed=structuredClone(t);
  fixed.paragraphs.forEach(row=>{row.evidenceIds=['timing.core'];});
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(calls===1?x:{chapters:[fixed]})}}]}));
 }});
 assert.equal(calls,2);
 assert.equal(result.result?.provider,'gemini');
 assert.ok(events.some(d=>d.reason==='n6_missing_required_evidence_timing'));
 assert.ok(events.some(d=>d.reason==='n6_repaired_complete'));
 assert.ok(result.result.reader10.chapters.find(c=>c.id==='timing').evidenceIds.flat().includes('timing.4'));
});
test('N641 Groq all-chapter numeric rejection uses one full regeneration and still rejects unsafe prose',async()=>{
 const {generateDirectJyotish}=await import('../apps/api/src/direct-jyotish.ts');
 const chart=await n641SyntheticChart();
 const bad=output();for(const c of bad.chapters)c.paragraphs[0].text+=' '+c.id+'.0.';
 for(const unsafe of [false,true]){
  let calls=0,permits=0;const events=[];
  const result=await generateDirectJyotish(chart,'en','2026-11-26',{reader10:reader,order:['groq'],keys:{groq:'fake'},freeConfirmed:{groq:true},limit:()=>{permits++;return true;},onDiagnostic:d=>events.push(d),fetcher:async(_url,req)=>{
   calls++;const body=JSON.parse(req.body);
   if(calls===2){
    assert.match(body.messages[0].content,/Regenerate the complete consultation/);
    assert.doesNotMatch(body.messages[0].content,/Return only replacement chapters/);
    assert.match(body.messages[1].content,/requested full consultation/);
    assert.equal(body.max_completion_tokens,3400);
    assert.equal(JSON.parse(body.messages[1].content.split('facts:\n')[1]).chapters.length,8);
   }
   const replacement=output();replacement.chapters.reverse();
   if(unsafe)replacement.chapters[0].paragraphs[0].text+=' 50%.';
   return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(calls===1?bad:replacement)}}]}));
  }});
  assert.equal(calls,2);assert.equal(permits,2);
  assert.ok(events.some(d=>d.reason==='n6_repair_self_money_work_love_home_path_timing_summary'));
  if(unsafe)assert.equal(result.result,null);
  else assert.equal(result.result?.provider,'groq');
 }
});
