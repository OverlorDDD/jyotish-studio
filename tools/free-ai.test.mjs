import test from 'node:test';
import assert from 'node:assert/strict';
import {generateFreeInterpretation,generateFreeInterpretationDetailed} from '../apps/api/src/free-ai.ts';
import {interpretChart} from '../apps/api/src/logic.ts';
import {readFileSync} from 'node:fs';

const p=(name,signName,sign,house)=>({name,signName,sign,house,nakshatra:'Swati',pada:4});
const chart={
 input:{date:'2000-01-01',time:'12:00',timeZone:'Asia/Kolkata',latitude:28.6139,longitude:77.209},
 ascendant:p('Ascendant','Pisces',12,1),lagnaD9:p('Ascendant','Libra',7,1),lagnaD10:p('Ascendant','Pisces',12,1),
 d1:[p('Sun','Sagittarius',9,10),p('Moon','Libra',7,8)],
 d9:[p('Venus','Libra',7,2)],d10:[p('Saturn','Pisces',12,1)],
 dasha:[{lord:'Saturn',start:'2020-01-01',end:'2030-01-01',antardashas:[{lord:'Ketu',start:'2026-01-01',end:'2027-01-01'}]}]
};
const valid={sections:[
 {factId:'lagna',text:'The ascendant is used to frame individual perspectives within Jyotish traditions.'},
 {factId:'moon',text:'The lunar placement offers a thematic lens for relationships with routine.'},
 {factId:'dasha',text:'The named period can serve as a reflection theme, not an event prediction.'}
]};
const completion=()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(valid)}}]}),{status:200,headers:{'Content-Type':'application/json'}});
test('free router always uses zero-priced openrouter/free; payload excludes birth metadata',async()=>{
 let calls=0;
 const result=await generateFreeInterpretation(chart,'uk',{
  key:'test_openrouter_key',ollamaEnabled:false,limit:()=>true,
  fetcher:async(url,init)=>{
   calls++;
   assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
   const body=JSON.parse(init.body);
   assert.equal(body.model,'openrouter/free');
   assert.equal(body.response_format.type,'json_schema');
   const payload=JSON.stringify(body);
   for(const secret of ['2000-01-01','Asia/Kolkata','28.6139','77.209','test_openrouter_key'])assert.ok(!payload.includes(secret),secret);
   return completion();
  }
 });
 assert.equal(calls,1);assert.equal(result.provider,'openrouter');assert.equal(result.model,'openrouter/free');
 assert.match(result.text,/Лагна/);
});
test('429 from OpenRouter switches to local Ollama without forwarding API keys',async()=>{
 const endpoints=[];
 const result=await generateFreeInterpretation(chart,'en',{
  key:'test_openrouter_key',ollamaEnabled:true,ollamaModel:'gemma3:1b',limit:()=>true,
  fetcher:async(url,init)=>{
   endpoints.push(url);
   if(url.includes('openrouter.ai'))return new Response('rate limited',{status:429});
   assert.equal(url,'http://127.0.0.1:11434/v1/chat/completions');
   assert.equal(init.headers.Authorization,undefined);
   assert.equal(JSON.parse(init.body).model,'gemma3:1b');
   return completion();
  }
 });
 assert.equal(endpoints.length,2);
 assert.equal(result.provider,'ollama');
});
test('no API key and Ollama disabled: no network; fallback returns null',async()=>{
 let calls=0;
 const result=await generateFreeInterpretation(chart,'uk',{
  key:'',ollamaEnabled:false,limit:()=>true,fetcher:async()=>{calls++;throw Error('Unexpected network request');}
 });
 assert.equal(result,null);assert.equal(calls,0);
});
test('when both free services fail, no paid model is called',async()=>{
 const calls=[];
 const result=await generateFreeInterpretation(chart,'uk',{
  key:'test_openrouter_key',ollamaEnabled:true,limit:()=>true,
  fetcher:async(url)=>{calls.push(url);return new Response('{}',{status:503});}
 });
 assert.equal(result,null);assert.equal(calls.length,2);
 assert.ok(calls.every(url=>!url.includes('api.openai.com')));
});
test('legacy OpenAI enabled flag cannot force paid calls in default AI_MODE=free',()=>{
 const logic=readFileSync(new URL('../apps/api/src/logic.ts',import.meta.url),'utf8');
 assert.match(logic,/process.env.AI_MODE\|\|'free'/);
 assert.match(logic,/mode==='paid_openai'&&process.env.OPENAI_ENABLED==='1'/);
});
test('explicit local mode always uses deterministic reading without network',async()=>{
 const previous=process.env.AI_MODE;
 process.env.AI_MODE='local';
 try{
  const r=await interpretChart(chart,'uk');
  assert.equal(r.provider,'local');
  assert.match(r.text,/Риби/);
 }finally{if(previous===undefined)delete process.env.AI_MODE;else process.env.AI_MODE=previous;}
});
