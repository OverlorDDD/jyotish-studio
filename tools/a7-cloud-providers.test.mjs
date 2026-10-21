import test from 'node:test';
import assert from 'node:assert/strict';
import {generateFreeInterpretationDetailed} from '../apps/api/src/free-ai.ts';
const ids=['portrait','configuration','tensions','relationships','career','resources','timing','conclusion'];
const specs=ids.map(id=>({id,title:id,facts:['Verified rule and traditional meaning for '+id]}));
const text='Traditional Jyotish considers these interacting symbols of commitment and measured personal growth. Their counterweights matter, so this reading does not establish a predestined result or guarantee an external event. This theme brings the verified chart evidence into a coherent personal perspective.';
const reply=(providerModel)=>new Response(JSON.stringify({
 model:providerModel,choices:[{message:{content:ids.map(id=>'[['+id+']]\n'+text).join('\n\n')}}],
 usage:{prompt_tokens:100,completion_tokens:1200,total_tokens:1300}
}),{status:200,headers:{'content-type':'application/json'}});
const chart={input:{date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},d1:[],ascendant:{sign:4,signName:'Cancer'},dasha:[]};

test('cloud-only free failover: Gemini HTTP 429 then independent Groq 120B eight-chapter consultation',async()=>{
 const calls=[];
 const result=await generateFreeInterpretationDetailed(chart,'en',{
  order:['gemini','groq','openrouter'],geminiKey:'fake_gemini',geminiEnabled:true,
  groqKey:'fake_groq',groqEnabled:true,key:'fake_router',chapterSpecs:specs,reportMode:true,limit:()=>true,
  fetcher:async(url,init)=>{
   calls.push(url);
   assert.ok(!JSON.stringify(JSON.parse(init.body)).includes('2000-01-01'));
   if(calls.length===1){
    assert.match(url,/generativelanguage\.googleapis/);
    return new Response('{}',{status:429});
   }
   assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');
   assert.equal(JSON.parse(init.body).model,'openai/gpt-oss-120b');
   assert.equal(init.headers.Authorization,'Bearer fake_groq');
   assert.equal(JSON.parse(init.body).response_format,undefined);
   return reply('openai/gpt-oss-120b');
  }
 });
 assert.equal(calls.length,2);
 assert.equal(result.result?.provider,'groq');
 assert.equal(result.result?.chapters?.length,8);
});
test('Groq key alone never enables cloud request until FREE tier is confirmed',async()=>{
 let calls=0;
 const result=await generateFreeInterpretationDetailed(chart,'en',{
  order:['groq'],groqKey:'fake_groq',groqEnabled:false,chapterSpecs:specs,limit:()=>true,
  fetcher:async()=>{calls++;return reply('openai/gpt-oss-120b');}
 });
 assert.equal(calls,0);assert.equal(result.reason,'no_provider');
});
test('unsupported Groq model name cannot enable unexpected paid model',async()=>{
 const result=await generateFreeInterpretationDetailed(chart,'en',{
  order:['groq'],groqKey:'fake_groq',groqEnabled:true,groqModel:'untrusted/paid-model',
  chapterSpecs:specs,reportMode:true,limit:()=>true,
  fetcher:async(_url,init)=>{
   assert.equal(JSON.parse(init.body).model,'openai/gpt-oss-120b');
   return reply('openai/gpt-oss-120b');
  }
 });
 assert.equal(result.result?.provider,'groq');
});
test('cloud-only Groq upstream failure transparently falls through to OpenRouter free model',async()=>{
 const calls=[];
 const result=await generateFreeInterpretationDetailed(chart,'en',{
  order:['groq','openrouter'],groqKey:'fake_groq',groqEnabled:true,key:'fake_router',
  chapterSpecs:specs,reportMode:true,limit:()=>true,
  fetcher:async(url,init)=>{
   calls.push(url);
   if(calls.length===1)return new Response('{}',{status:503});
   assert.match(url,/openrouter\.ai\/api\/v1/);
   const model=JSON.parse(init.body).model;
   assert.equal(model,'openrouter/free');
   return reply(model);
  }
 });
 assert.equal(calls.length,2);
 assert.equal(result.result?.provider,'openrouter');
});


test('legacy Ollama selection cannot initiate a local-network AI request for Jyotish',async()=>{
 let attempts=0;
 const result=await generateFreeInterpretationDetailed(chart,'en',{
  order:['ollama'],ollamaEnabled:true,ollamaModel:'gemma3:1b',limit:()=>true,
  fetcher:async()=>{attempts++;throw Error('Should not access local model');}
 });
 assert.equal(result.reason,'no_provider');
 assert.equal(result.result,null);
 assert.equal(attempts,0);
});
