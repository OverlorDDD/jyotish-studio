import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
import {compactJyotishFacts,generateDirectJyotish,acceptDirectJyotishText,DIRECT_JYOTISH_INSTRUCTION,DIRECT_JYOTISH_BACKUP_INSTRUCTION,openRouterRetryAfterMs} from '../apps/api/src/direct-jyotish.ts';
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
test('N501 truncated finish_reason switches providers without consuming same-provider free quota',async()=>{
 const hits=[];
 const output=await generateDirectJyotish(chart,'en','2026-10-22',{
  order:['groq','openrouter'],keys:{groq:'test',openrouter:'test'},freeConfirmed:{groq:true},limit:()=>true,
  fetcher:async(url,init)=>{
   hits.push(url);
   const body=JSON.parse(init.body);
   if(hits.length===1){
    assert.equal(body.max_completion_tokens,3600);
    assert.equal(body.reasoning_effort,'low');
    assert.equal(body.include_reasoning,false);
    assert.equal(body.max_tokens,undefined);
    assert.equal(body.messages[0].content,DIRECT_JYOTISH_BACKUP_INSTRUCTION);
    return new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:prose}}]}),{status:200});
   }
   assert.equal(body.max_tokens,3400);
   assert.match(body.messages[0].content,/210-270 words TOTAL/);
   return success();
  }
 });
 assert.equal(hits.length,2,'Groq truncated response should not cause an immediate 429 retry');
 assert.equal(output.result?.provider,'openrouter');
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

test('N500 corrective retry receives fresh timeout; does not inherit expired first-request clock',async()=>{
 let hits=0;
 const seen=[];
 const result=await generateDirectJyotish(chart,'en','2026-10-22',{
  order:['gemini'],keys:{gemini:'test'},freeConfirmed:{gemini:true},limit:()=>true,
  timeoutMs:180,
  onDiagnostic:event=>seen.push(event),
  fetcher:async(_url,init)=>{
   hits++;
   const n=hits;
   return new Promise((resolve,reject)=>{
    const finish=setTimeout(()=>resolve(success(n===1?'Short reply.':prose)),110);
    init.signal.addEventListener('abort',()=>{clearTimeout(finish);reject(new Error('aborted'))},{once:true});
   });
  }
 });
 assert.equal(hits,2);
 assert.equal(result.result?.provider,'gemini');
 assert.equal(seen.some(x=>x.reason==='timeout'),false);
});

test('N500 Gemini timeout transparently tries next free provider with a fresh clock',async()=>{
 const calls=[];
 const result=await generateDirectJyotish(chart,'en','2026-10-22',{
  order:['gemini','groq'],
  keys:{gemini:'test',groq:'test'},freeConfirmed:{gemini:true,groq:true},
  limit:()=>true,timeoutMs:18,
  fetcher:async(url,init)=>{
   calls.push(url);
   if(url.includes('googleapis'))return new Promise((_,reject)=>{
    init.signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true});
   });
   return success();
  }
 });
 assert.equal(calls.length,2);
 assert.equal(result.result?.provider,'groq');
});

test('N501 Gemini full consultation reserves a reasonable token budget',async()=>{
 let maxTokens=0;
 await generateDirectJyotish(chart,'en','2026-10-22',{
  order:['gemini'],keys:{gemini:'test'},freeConfirmed:{gemini:true},limit:()=>true,
  fetcher:async(_url,init)=>{
   maxTokens=JSON.parse(init.body).max_tokens;
   return success();
  }
 });
 assert.equal(maxTokens,3400);
});

test('N501 backup policy still requires real D1/D9/D10 connections and two additional verified divisions',()=>{
 assert.ok(DIRECT_JYOTISH_BACKUP_INSTRUCTION.length<2400);
 for(const match of ['D1','D9','D10','TWO','D60','380-520'])assert.match(DIRECT_JYOTISH_BACKUP_INSTRUCTION,new RegExp(match));
 assert.match(DIRECT_JYOTISH_BACKUP_INSTRUCTION,/low-risk actions/);
 assert.doesNotMatch(DIRECT_JYOTISH_BACKUP_INSTRUCTION,/guaranteed life outcomes/);
});
test('OpenRouter tries one shorter response after truncation, then moves to the next provider',async()=>{
 const calls=[];
 const result=await generateDirectJyotish(chart,'en','2026-10-22',{
  order:['openrouter','groq'],keys:{openrouter:'test',groq:'test'},freeConfirmed:{groq:true},limit:()=>true,
  fetcher:async(url,request)=>{
   calls.push({url,payload:JSON.parse(request.body)});
   if(url.includes('groq.com'))return success();
   return new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:prose}}]}),{status:200});
  }
 });
 assert.equal(calls.length,3);
 assert.ok(calls.slice(0,2).every(call=>call.url.includes('openrouter.ai')));
 assert.match(calls[0].payload.messages[0].content,/210-270 words TOTAL/);
 assert.match(calls[1].payload.messages[0].content,/200-280 words/);
 assert.equal(calls[1].payload.max_tokens,calls[0].payload.max_tokens);
 assert.equal(result.result?.provider,'groq');
});

test('OpenRouter disables reasoning for the explicitly configured free Nemotron Lightning endpoint',async()=>{
 const previous=process.env.OPENROUTER_FREE_MODEL;
 try{
  for(const model of ['nvidia/nemotron-3.5-lightning:free','openrouter/free']){
   process.env.OPENROUTER_FREE_MODEL=model;
   let payload;
   const result=await generateDirectJyotish(chart,'uk','2026-10-22',{
    order:['openrouter'],keys:{openrouter:'test'},limit:()=>true,
    fetcher:async(_url,request)=>{
     payload=JSON.parse(request.body);
     return success();
    }
   });
   assert.equal(result.result?.provider,'openrouter');
   assert.equal(payload.model,model);
   assert.deepEqual(payload.reasoning,model==='openrouter/free'?undefined:{enabled:false});
  }
 }finally{
  if(previous===undefined)delete process.env.OPENROUTER_FREE_MODEL;
  else process.env.OPENROUTER_FREE_MODEL=previous;
 }
});

test('A production operations switch removes OpenRouter from natal fallback',async()=>{
 const configured=['GALAXIORA_NATAL_OPENROUTER_DISABLED','OPENROUTER_API_KEY','FREE_AI_ORDER'];
 const previous=configured.map(name=>process.env[name]);
 try{
  process.env.GALAXIORA_NATAL_OPENROUTER_DISABLED='1';
  process.env.OPENROUTER_API_KEY='mock-key';
  process.env.FREE_AI_ORDER='gemini,groq,openrouter';
  const calls=[];
  const result=await generateDirectJyotish(chart,'uk','2026-10-22',{
   keys:{gemini:'mock',groq:'mock'},freeConfirmed:{gemini:true,groq:true},limit:()=>true,
   fetcher:async url=>{
    calls.push(url);
    return new Response('{}',{status:503});
   }
  });
  assert.equal(result.reason,'provider_unavailable');
  assert.deepEqual(calls,[
   'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
   'https://api.groq.com/openai/v1/chat/completions'
  ]);
 }finally{
  configured.forEach((name,index)=>{
   if(previous[index]===undefined)delete process.env[name];
   else process.env[name]=previous[index];
  });
 }
});

test('OpenRouter free 429 cooldown honors Retry-After without exposing headers or keys',()=>{
 const now=Date.UTC(2026,10,26,12,0,0);
 assert.equal(openRouterRetryAfterMs(new Headers(),now),60000);
 assert.equal(openRouterRetryAfterMs(new Headers({'Retry-After':'120'}),now),120000);
 assert.equal(openRouterRetryAfterMs(new Headers({'Retry-After':'1'}),now),60000);
 assert.equal(openRouterRetryAfterMs(new Headers({'Retry-After':'36000'}),now),1800000);
 assert.equal(openRouterRetryAfterMs(new Headers({'Retry-After':'Thu, 26 Nov 2026 12:03:00 GMT'}),now),180000);
 assert.equal(openRouterRetryAfterMs(new Headers({'Retry-After':'nonsense'}),now),60000);
 assert.equal(openRouterRetryAfterMs(new Headers({'Retry-After':'-12'}),now),60000);
});

test('real fallback order is Gemini 503 then Groq 429 then verified free OpenRouter',async()=>{
 const urls=[],stages=[];
 const out=await generateDirectJyotish(chart,'en','2026-11-26',{
  order:['gemini','groq','openrouter'],
  keys:{gemini:'test',groq:'test',openrouter:'test'},
  freeConfirmed:{gemini:true,groq:true},limit:()=>true,
  onDiagnostic:d=>stages.push(d),
  fetcher:async url=>{
   urls.push(url);
   if(url.includes('googleapis'))return new Response('{}',{status:503});
   if(url.includes('groq.com'))return new Response('{}',{status:429});
   return success();
  }
 });
 assert.equal(urls.length,3);
 assert.deepEqual(stages.filter(x=>x.stage==='http').map(x=>[x.provider,x.httpStatus]),[['gemini',503],['groq',429]]);
 assert.equal(out.result?.provider,'openrouter');
 assert.equal(out.result?.text,prose);
});

test('all three remote providers exhausted returns null with true 429 reason, never fake AI',async()=>{
 const calls=[];
 const out=await generateDirectJyotish(chart,'uk','2026-11-26',{
  order:['gemini','groq','openrouter'],
  keys:{gemini:'test',groq:'test',openrouter:'test'},
  freeConfirmed:{gemini:true,groq:true},limit:()=>true,
  fetcher:async url=>{calls.push(url);return new Response('{}',{status:429});}
 });
 assert.equal(calls.length,3);
 assert.equal(out.result,null);
 assert.equal(out.reason,'rate_limited');
});

test('full and free-backup instructions cover all 15 verified thematic divisions with D60 excluded',()=>{
 const verified=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45];
 for(const instruction of [DIRECT_JYOTISH_INSTRUCTION,DIRECT_JYOTISH_BACKUP_INSTRUCTION]){
  for(const division of verified){
   assert.match(instruction,new RegExp('\\bD'+division+'\\b'),'missing verified D'+division);
  }
  assert.match(instruction,/D60/);
  assert.match(instruction,/do not|Do not|DO NOT/);
  assert.match(instruction,/domain|life area|life sphere|thematic/);
 }
 assert.match(DIRECT_JYOTISH_BACKUP_INSTRUCTION,/children and family/);
 assert.match(DIRECT_JYOTISH_BACKUP_INSTRUCTION,/home and comfort/);
 assert.doesNotMatch(DIRECT_JYOTISH_BACKUP_INSTRUCTION,/FIVE short Markdown/);
});
