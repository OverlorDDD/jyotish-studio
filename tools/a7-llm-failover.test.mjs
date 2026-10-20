import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateFreeInterpretationDetailed} from '../apps/api/src/free-ai.ts';
const p=(name,signName,sign,house)=>({name,signName,sign,house,nakshatra:'Swati',pada:4});
const chart={input:{date:'2000-01-01',time:'12:00',timeZone:'Asia/Kolkata',latitude:28,longitude:77},
 ascendant:p('Ascendant','Pisces',12,1),lagnaD9:p('Ascendant','Libra',7,1),lagnaD10:p('Ascendant','Pisces',12,1),
 d1:[p('Sun','Sagittarius',9,10),p('Moon','Libra',7,8)],dasha:[]};
const successful={sections:[
 {factId:'lagna',text:'The ascendant frames a life direction shaped by both purpose and belonging.'},
 {factId:'sun',text:'A desire for meaningful work interacts with the need for self-respect.'},
 {factId:'moon',text:'The inner emotional world gives this path a reflective counterweight.'}
]};
const respond=()=>new Response(JSON.stringify({model:'gemini-2.5-flash-lite',
 choices:[{message:{content:JSON.stringify(successful)}}],
 usage:{prompt_tokens:100,completion_tokens:70,total_tokens:170}}),{status:200});

test('429 primary OpenRouter falls through to independent Gemini using separate key and endpoint',async()=>{
 const calls=[],telemetry=[];
 const output=await generateFreeInterpretationDetailed(chart,'en',{key:'router_fake',geminiKey:'gemini_fake',
  geminiEnabled:true,ollamaEnabled:false,limit:()=>true,onUsage:e=>telemetry.push(e),
  fetcher:async(url,init)=>{
   calls.push(url);
   const body=JSON.parse(init.body);
   assert.ok(!JSON.stringify(body).includes('2000-01-01'));
   assert.ok(!JSON.stringify(body).includes('router_fake'));
   assert.ok(!JSON.stringify(body).includes('gemini_fake'));
   if(calls.length===1){
    assert.equal(body.model,'openrouter/free');assert.equal(init.headers.Authorization,'Bearer router_fake');
    return new Response('{}',{status:429});
   }
   assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
   assert.equal(body.model,'gemini-2.5-flash-lite');assert.equal(init.headers.Authorization,'Bearer gemini_fake');
   return respond();
  }
 });
 assert.equal(output.result?.provider,'gemini');
 assert.equal(output.result?.model,'gemini-2.5-flash-lite');
 assert.equal(calls.length,2);
 assert.equal(telemetry.length,2);
 assert.deepEqual(telemetry.map(t=>t.outcome),['provider_error','returned']);
 assert.ok(!JSON.stringify(output).includes('gemini_fake'));
});
test('Gemini must be opted into its confirmed free tier, a key alone never triggers it',async()=>{
 let hits=0;
 const output=await generateFreeInterpretationDetailed(chart,'en',{
  order:['gemini'],key:'',geminiKey:'gemini_fake',geminiEnabled:false,ollamaEnabled:false,
  limit:()=>true,fetcher:async()=>{hits++;return respond();}
 });
 assert.equal(hits,0);assert.equal(output.reason,'no_provider');assert.equal(output.result,null);
});
test('all remote attempts failing yields a real local fallback without a fictitious provider success',async()=>{
 const output=await generateFreeInterpretationDetailed(chart,'en',{
  key:'router',geminiKey:'gemini',geminiEnabled:true,ollamaEnabled:false,limit:()=>true,
  fetcher:async()=>new Response('{}',{status:503})
 });
 assert.equal(output.result,null);assert.equal(output.reason,'provider_unavailable');
});
test('API and web always distinguish model output from deterministic text and returned cached AI',()=>{
 const nest=readFileSync(new URL('../apps/api/src/nest.ts',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../apps/web/app/components/DetailedReport.tsx',import.meta.url),'utf8');
 assert.match(nest,/source:'llm'/);
 assert.match(nest,/source:'deterministic'/);
 assert.match(nest,/cached:true/);
 assert.match(ui,/data-testid="reading-ai-provenance"/);
 assert.match(ui,/Відповіді від зовнішньої LLM немає/);
 assert.match(ui,/Google Gemini/);
});
