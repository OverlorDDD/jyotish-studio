import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAiConsultation,buildAiChapterSpecs,CHAPTER_IDS} from '../apps/api/src/consultation-ai.ts';
import {generateFreeInterpretationDetailed} from '../apps/api/src/free-ai.ts';
const chapters=CHAPTER_IDS.map((id,i)=>({id,title:'Verified topic '+(i+1),facts:['Traditional reading of verified topic '+(i+1)+' with supporting and limiting facts']}));
const paragraph='Traditional Jyotish treats this placement as a meeting of personal responsibility and inner conviction. Read together with the verified counterweight, it can symbolize a patient search for meaning without determining future events. The tension is not fate but a theme of this particular chart.';
const full=chapters.map(c=>'[['+c.id+']]\n'+paragraph).join('\n\n');
const chart={input:{date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},ascendant:{signName:'Cancer'},d1:[],dasha:[]};
const reply=(text,model='qwen/qwen3-32b:free')=>new Response(JSON.stringify({model,choices:[{message:{content:text}}],usage:{prompt_tokens:200,completion_tokens:500,total_tokens:700}}),{status:200,headers:{'content-type':'application/json'}});
test('eight chapter boundaries are parsed and verified individually; no unsupported placements',()=>{
 const items=parseAiConsultation(full,chapters);
 assert.equal(items.length,8);
 assert.deepEqual(items.map(c=>c.id),CHAPTER_IDS);
 const hallucination='The Sun is in Scorpio and will certainly bring a rich spouse. '+paragraph;
 const unsafe=full.replace('[['+CHAPTER_IDS[3]+']]\n'+paragraph,'[['+CHAPTER_IDS[3]+']]\n'+hallucination);
 const verified=parseAiConsultation(unsafe,chapters);
 assert.equal(verified.length,7);
 assert.ok(!verified.some(c=>c.id===CHAPTER_IDS[3]));
});
test('chapter prompt builder never exposes a birth date, place or account and uses only rule evidence',()=>{
 const source={chapters:chapters.map(c=>({id:c.id,title:c.title,evidence:['rule=verified']})),
 findings:[{id:'main',topic:'configuration',ruleId:'RULE_LORD',verifiedEvidence:['rule=verified'],
  traditionalMeaning:'The documented ruler governs a concrete life sphere.',supportingFactors:['support'],counterFactors:[],limitations:['interpretive not guaranteed']}]};
 const result=buildAiChapterSpecs(source);
 assert.equal(result.length,8);
 assert.ok(result.every(c=>c.facts.length>=1));
 assert.ok(!JSON.stringify(result).includes('2000-01-01'));
});
test('HTTP 200 HTML / malformed upstream format fail over to independently configured Gemini',async()=>{
 const calls=[];
 const result=await generateFreeInterpretationDetailed(chart,'uk',{
  order:['openrouter','gemini'],key:'fake_router_key',geminiKey:'fake_gemini_key',geminiEnabled:true,
  chapterSpecs:chapters,reportMode:true,limit:()=>true,
  fetcher:async(url,init)=>{
   calls.push(url);
   const body=JSON.parse(init.body);
   assert.equal(body.response_format,undefined);
   assert.ok(!JSON.stringify(body).includes('2000-01-01'));
   if(calls.length===1)return new Response('<html>upstream unavailable</html>',{status:200,headers:{'content-type':'text/html'}});
   assert.ok(url.includes('generativelanguage.googleapis.com'));
   return reply(full,'gemini-2.5-flash-lite');
  }
 });
 assert.equal(calls.length,2);
 assert.equal(result.result?.provider,'gemini');
 assert.equal(result.result?.chapters?.length,8);
});
test('malformed provider JSON is diagnosed, not accepted or retried on same free router',async()=>{
 let count=0;
 const outcome=await generateFreeInterpretationDetailed(chart,'uk',{
  order:['openrouter'],key:'fake_router_key',chapterSpecs:chapters,reportMode:true,limit:()=>true,
  fetcher:async()=>{count++;return new Response('{broken',{status:200,headers:{'content-type':'application/json'}});}
 });
 assert.equal(count,1);
 assert.equal(outcome.result,null);
 assert.equal(outcome.reason,'invalid_response');
});
test('valid SSE text fragments are adapted but never treated as authority for invented facts',async()=>{
 const half=Math.floor(full.length/2);
 const raw=['data: '+JSON.stringify({model:'openrouter/free',choices:[{delta:{content:full.slice(0,half)}}]}),
  'data: '+JSON.stringify({choices:[{delta:{content:full.slice(half)}}]}),'data: [DONE]'].join('\n\n');
 const outcome=await generateFreeInterpretationDetailed(chart,'en',{
  order:['openrouter'],key:'fake_router_key',chapterSpecs:chapters,reportMode:true,limit:()=>true,
  fetcher:async()=>new Response(raw,{status:200,headers:{'content-type':'text/event-stream'}})
 });
 assert.equal(outcome.result?.chapters?.length,8);
});
test('pinned OpenRouter model can only be a :free slug; non-free override is ignored',async()=>{
 const original=process.env.OPENROUTER_FREE_MODEL;
 try{
  for(const [setting,expected] of [['qwen/qwen3-32b:free','qwen/qwen3-32b:free'],['openai/gpt-4.1-mini','openrouter/free']]){
   process.env.OPENROUTER_FREE_MODEL=setting;
   let used;
   await generateFreeInterpretationDetailed(chart,'en',{
    order:['openrouter'],key:'fake_router_key',chapterSpecs:chapters,reportMode:true,limit:()=>true,
    fetcher:async(_url,opts)=>{used=JSON.parse(opts.body).model;return reply(full);}
   });
   assert.equal(used,expected);
  }
 }finally{
  if(original===undefined)delete process.env.OPENROUTER_FREE_MODEL;
  else process.env.OPENROUTER_FREE_MODEL=original;
 }
});
