import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {compactJyotishFacts,generateDirectJyotish,acceptDirectJyotishText,DIRECT_JYOTISH_INSTRUCTION} from '../apps/api/src/direct-jyotish.ts';
const input={date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0};
const positions=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
 .map((name,i)=>({name,longitude:[335,72,345,350,255,15,332,120,300][i],speed:1}));
const chart=calculateChart(input,{ayanamsa:23.8,ascendant:100,positions,julianDay:2451545,backend:'synthetic'});
const prose='## Your inner landscape\n\n'+('Your chart combines purpose with a private need for rest, shaping how you balance commitment and meaningful work. ').repeat(14)+'\n\n## Relationships\n\n'+('Relationships thrive when you communicate expectations and respect each person’s inner rhythm. ').repeat(8)+'\n\nThe story continues with practical insight and a concluding perspective.';
const success=(content=prose)=>new Response(JSON.stringify({model:'fake-free-model',choices:[{message:{content}}]}),{status:200});
test('compact facts include real planetary positions but no birth date, time, coordinates or API secrets',()=>{
 const facts=compactJyotishFacts(chart,'2026-10-22');
 assert.ok(facts.includes('D1 lagna:'));
 assert.ok(facts.includes('D9 lagna sign='));
 assert.ok(facts.includes('D10 lagna sign='));
 assert.ok(facts.includes('D1 house rulers:'));
 assert.ok(facts.includes('Mahadasha'));
 assert.ok(!facts.includes('2000-01-01'));
 assert.ok(!facts.includes('latitude'));
 assert.ok(!facts.includes('longitude'));
 assert.ok(facts.length<6000,'Compact payload must stay lean');
 assert.ok(DIRECT_JYOTISH_INSTRUCTION.includes('Only return the completed Markdown consultation'));
});
test('one call, one accepted consultation, no chapter or editor gate',async()=>{
 let requests=0;
 const output=await generateDirectJyotish(chart,'en','2026-10-22',{
  order:['gemini'],keys:{gemini:'fake'},freeConfirmed:{gemini:true},limit:()=>true,
  fetcher:async(_url,request)=>{
   requests++;const body=JSON.parse(request.body);
   assert.equal(body.messages.length,2);
   assert.equal(body.messages[0].content,DIRECT_JYOTISH_INSTRUCTION);
   assert.ok(body.messages[1].content.includes('D1 house rulers:'));
   assert.equal(body.response_format,undefined);
   assert.ok(!JSON.stringify(body).includes('2000-01-01'));
   return success();
  }});
 assert.equal(requests,1);
 assert.equal(output.result?.text,prose);
 assert.equal(output.result?.provider,'gemini');
});
test('a failed provider switches to next free provider without editing a successful reply',async()=>{
 const calls=[];
 const output=await generateDirectJyotish(chart,'uk','2026-10-22',{
  order:['gemini','groq'],keys:{gemini:'fake',groq:'fake'},freeConfirmed:{gemini:true,groq:true},
  limit:()=>true,fetcher:async(url)=>{
   calls.push(url);
   return calls.length===1?new Response('{}',{status:503}):success();
  }});
 assert.deepEqual(calls.length,2);
 assert.equal(output.result?.provider,'groq');
 assert.equal(output.result?.text,prose);
});
test('short or unsupported outer planets are rejected, while full text is accepted',()=>{
 assert.equal(acceptDirectJyotishText('Short answer.').ok,false);
 assert.equal(acceptDirectJyotishText(prose+' Pluto certainly decides your marriage.').ok,false);
 assert.equal(acceptDirectJyotishText(prose).ok,true);
 assert.equal(acceptDirectJyotishText(prose+'**').ok,true,'Markdown emphasis must not disguise a completed final sentence');
});
test('provider exhaustion returns a recoverable code, not a false AI completion',async()=>{
 const output=await generateDirectJyotish(chart,'uk','2026-10-22',{
  order:['gemini','groq'],keys:{gemini:'fake',groq:'fake'},freeConfirmed:{gemini:true,groq:true},
  limit:()=>true,fetcher:async()=>new Response('{}',{status:429})});
 assert.equal(output.result,null);
 assert.equal(output.reason,'rate_limited');
});

test('short but otherwise usable free reply triggers exactly one evidence-grounded corrective retry',async()=>{
 let attempts=0;
 const output=await generateDirectJyotish(chart,'uk','2026-10-22',{
  order:['groq'],keys:{groq:'test'},freeConfirmed:{groq:true},limit:()=>true,
  fetcher:async(_url,req)=>{
   attempts++;
   const body=JSON.parse(req.body);
   assert.ok(body.messages[1].content.includes('D9 lagna sign='));
   if(attempts===1)return success('This response is unfinished');
   assert.ok(body.messages[0].content.includes('corrective attempt'));
   return success(prose);
  }
 });
 assert.equal(attempts,2);
 assert.equal(output.result?.provider,'groq');
 assert.equal(output.result?.text,prose);
});
test('token-limit output is retried once even if its last sentence ends with punctuation',async()=>{
 let attempts=0;
 const output=await generateDirectJyotish(chart,'en','2026-10-22',{
  order:['gemini'],keys:{gemini:'test'},freeConfirmed:{gemini:true},limit:()=>true,
  fetcher:async()=>{
   attempts++;
   return new Response(JSON.stringify({choices:[{finish_reason:attempts===1?'length':'stop',message:{content:prose}}]}),{status:200});
  }
 });
 assert.equal(attempts,2);
 assert.equal(output.result?.text,prose);
});
test('an explicit 429 never retries the same provider and falls back to the next free provider',async()=>{
 const calls=[];
 const output=await generateDirectJyotish(chart,'en','2026-10-22',{
  order:['groq','openrouter'],keys:{groq:'test',openrouter:'test'},freeConfirmed:{groq:true},
  limit:()=>true,fetcher:async url=>{
   calls.push(url);
   return calls.length===1?new Response('{}',{status:429}):success(prose);
  }
 });
 assert.equal(calls.length,2);
 assert.equal(output.result?.provider,'openrouter');
});
test('an unsupported western planet cannot be salvaged by retries',async()=>{
 let attempts=0;
 const output=await generateDirectJyotish(chart,'en','2026-10-22',{
  order:['groq'],keys:{groq:'test'},freeConfirmed:{groq:true},limit:()=>true,
  fetcher:async()=>{
   attempts++;return success(prose+' Pluto determines your marriage.');
  }
 });
 assert.equal(attempts,1);
 assert.equal(output.reason,'invalid_response');
 assert.equal(output.result,null);
});

test('live diagnostic exposes safe upstream numeric status per provider and no private response body',async()=>{
 const events=[];
 const calls=[];
 const output=await generateDirectJyotish(chart,'uk','2026-10-22',{
  order:['groq','gemini','openrouter'],
  keys:{groq:'secret_groq',gemini:'secret_gemini',openrouter:'secret_router'},
  freeConfirmed:{groq:true,gemini:true},
  limit:()=>true,
  onDiagnostic:event=>events.push(event),
  fetcher:async url=>{
   calls.push(url);
   const status=[403,503,400][calls.length-1];
   return new Response('SENSITIVE_NOT_TO_BE_LOGGED',{status});
  }
 });
 assert.equal(output.result,null);
 assert.equal(calls.length,3);
 assert.deepEqual(events.map(e=>[e.provider,e.stage,e.httpStatus]),[
  ['groq','http',403],['gemini','http',503],['openrouter','http',400]
 ]);
 const safe=JSON.stringify(events);
 assert.ok(!safe.includes('SENSITIVE_NOT_TO_BE_LOGGED'));
 assert.ok(!safe.includes('secret_'));
});
test('single-provider live mode cannot contact the two other free providers',async()=>{
 const calls=[];
 const output=await generateDirectJyotish(chart,'uk','2026-10-22',{
  order:['gemini'],
  keys:{gemini:'test',groq:'test',openrouter:'test'},
  freeConfirmed:{gemini:true,groq:true},limit:()=>true,
  fetcher:async url=>{calls.push(url);return success(prose);}
 });
 assert.equal(calls.length,1);
 assert.ok(calls[0].includes('generativelanguage.googleapis.com'));
 assert.equal(output.result?.provider,'gemini');
});
