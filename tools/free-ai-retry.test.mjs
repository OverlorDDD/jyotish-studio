import test from 'node:test';
import assert from 'node:assert/strict';
import {generateFreeInterpretationDetailed} from '../apps/api/src/free-ai.ts';

const p=(name,signName,sign,house)=>({name,signName,sign,house,nakshatra:'Swati',pada:4});
const chart={
 ascendant:p('Ascendant','Pisces',12,1),
 lagnaD9:p('Ascendant','Libra',7,1),
 lagnaD10:p('Ascendant','Pisces',12,1),
 d1:[p('Sun','Sagittarius',9,10),p('Moon','Libra',7,8)],
 dasha:[],
 input:{date:'2000-01-01',time:'12:00',timeZone:'Asia/Kolkata',latitude:28,longitude:77}
};
const good={sections:[
 {factId:'lagna',text:'The ascendant invites reflection on intuition and self-awareness.'},
 {factId:'moon',text:'The Moon position can be considered in emotional reflection.'},
 {factId:'sun',text:'The Sun placement reflects symbolic themes of creative agency.'}
]};
const reply=content=>new Response(JSON.stringify({choices:[{message:{content}}]}),{status:200});
test('invalid JSON schema reply gets one free JSON-prompt retry',async()=>{
 const requests=[];
 const r=await generateFreeInterpretationDetailed(chart,'en',{
  key:'example',ollamaEnabled:false,limit:()=>true,
  fetcher:async(_url,init)=>{
   const body=JSON.parse(init.body);requests.push(body);
   return requests.length===1?reply('not-json'):reply(JSON.stringify(good));
  }
 });
 assert.equal(requests.length,2);
 assert.equal(requests[0].model,'openrouter/free');
 assert.equal(requests[0].response_format.type,'json_schema');
 assert.equal(requests[1].model,'openrouter/free');
 assert.equal(requests[1].response_format,undefined);
 assert.equal(r.result?.provider,'openrouter');
});
test('HTTP 429 stops cloud retries',async()=>{
 let count=0;
 const r=await generateFreeInterpretationDetailed(chart,'en',{
  key:'example',ollamaEnabled:false,limit:()=>true,
  fetcher:async()=>{count++;return new Response('{}',{status:429});}
 });
 assert.equal(count,1);
 assert.equal(r.reason,'rate_limited');
});
test('retry is blocked when free hourly cap is exhausted',async()=>{
 let allowed=0,calls=0;
 const r=await generateFreeInterpretationDetailed(chart,'uk',{
  key:'example',ollamaEnabled:false,limit:()=>++allowed<=1,
  fetcher:async()=>{calls++;return reply('invalid');}
 });
 assert.equal(calls,1);
 assert.equal(r.reason,'hourly_limit');
});

test('Markdown fenced JSON from a free model is accepted without retry',async()=>{
 let count=0;
 const fenced=['```json',JSON.stringify(good),'```'].join('\n');
 const r=await generateFreeInterpretationDetailed(chart,'en',{
  key:'example',ollamaEnabled:false,limit:()=>true,
  fetcher:async()=>{count++;return reply(fenced);}
 });
 assert.equal(count,1);
 assert.equal(r.result?.provider,'openrouter');
});
test('HTTP 400 schema rejection triggers one prompt-only retry',async()=>{
 let count=0;
 const r=await generateFreeInterpretationDetailed(chart,'uk',{
  key:'example',ollamaEnabled:false,limit:()=>true,
  fetcher:async(_url,init)=>{
   count++;
   return count===1?new Response('{}',{status:400}):reply(JSON.stringify(good));
  }
 });
 assert.equal(count,2);
 assert.equal(r.result?.provider,'openrouter');
});
test('unknown fact IDs are rejected after both formats',async()=>{
 let count=0;
 const invalid={sections:[...good.sections.slice(0,2),{
  factId:'invented_event',text:'An unsupported prediction without an input fact identifier.'
 }]};
 const r=await generateFreeInterpretationDetailed(chart,'en',{
  key:'example',ollamaEnabled:false,limit:()=>true,
  fetcher:async()=>{count++;return reply(JSON.stringify(invalid));}
 });
 assert.equal(count,2);
 assert.equal(r.reason,'invalid_response');
});
