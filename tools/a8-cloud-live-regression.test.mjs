import test from 'node:test';
import assert from 'node:assert/strict';
import {generateFreeInterpretationDetailed} from '../apps/api/src/free-ai.ts';
import {CHAPTER_IDS} from '../apps/api/src/consultation-ai.ts';

const chart={ascendant:{sign:4,signName:'Cancer'},d1:[],dasha:[],
 input:{date:'2000-01-01',time:'12:00',latitude:0,longitude:0,timeZone:'UTC'}};
const specs=CHAPTER_IDS.map(id=>({id,title:id,facts:['Rule-backed synthetic Jyotish motif for '+id]}));
const prose='The confirmed Jyotish evidence links this distinctive theme with an independent factor, and their interaction can be understood through responsible choices without claiming a fixed future. The competing factor adds nuance to this traditional interpretation.';
const full=CHAPTER_IDS.map(id=>'[['+id+']]\n'+prose).join('\n\n');
const json=(model)=>new Response(JSON.stringify({model,choices:[{message:{content:full}}]}),{status:200,headers:{'content-type':'application/json'}});

test('Gemini 3.1 Flash-Lite is the explicit free-only successor to retired 2.5 Flash-Lite',async()=>{
 let requested='';
 const r=await generateFreeInterpretationDetailed(chart,'en',{
  order:['gemini'],geminiEnabled:true,geminiKey:'synthetic_free_key',
  limit:()=>true,chapterSpecs:specs,reportMode:true,
  fetcher:async(url,init)=>{
   assert.match(url,/generativelanguage\.googleapis\.com/);
   requested=JSON.parse(init.body).model;
   return json(requested);
  }
 });
 assert.equal(requested,'gemini-3.1-flash-lite');
 assert.equal(r.result?.provider,'gemini');
 assert.equal(r.result?.chapters?.length,8);
});
test('Gemini HTTP 404 goes to independently confirmed Groq FREE tier, never paid OpenAI',async()=>{
 const seen=[];
 const r=await generateFreeInterpretationDetailed(chart,'en',{
  order:['gemini','groq','openrouter'],geminiEnabled:true,geminiKey:'synthetic_gemini_key',
  groqEnabled:true,groqKey:'synthetic_groq_key',
  limit:()=>true,chapterSpecs:specs,reportMode:true,
  fetcher:async(url,init)=>{
   seen.push(url);
   if(url.includes('googleapis.com'))return new Response('{}',{status:404});
   assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');
   assert.equal(init.headers.Authorization,'Bearer synthetic_groq_key');
   assert.equal(JSON.parse(init.body).model,'openai/gpt-oss-120b');
   return json('openai/gpt-oss-120b');
  }
 });
 assert.equal(seen.length,2);
 assert.equal(r.result?.provider,'groq');
 assert.equal(r.result?.chapters?.length,8);
 assert.ok(seen.every(x=>!x.includes('api.openai.com')));
});
test('disabled Groq remains safely skipped even with API key configured',async()=>{
 let calls=0;
 const r=await generateFreeInterpretationDetailed(chart,'en',{
  order:['groq'],groqEnabled:false,groqKey:'synthetic_groq_key',
  chapterSpecs:specs,limit:()=>true,
  fetcher:async()=>{calls++;return json('openai/gpt-oss-120b');}
 });
 assert.equal(calls,0);
 assert.equal(r.reason,'no_provider');
});
