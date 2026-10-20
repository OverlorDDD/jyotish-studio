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


test('A7 detailed report requests safer fact-linked prose before trying fragile JSON',async()=>{
 const paragraphs=[
  'In the Jyotish tradition, the lunar need for emotional space meets a strong desire to serve. Together they describe a meaningful tension between privacy and commitment. Neither theme alone decides the person’s life.',
  'The emphasis on purposeful work interacts with the need to make room for family ties. Responsible choices here carry weight because both duties can matter at once. This is a traditional interpretive theme rather than a guaranteed event.',
  'The planetary period offers a perspective on patience and a developing sense of responsibility. Its effect is read alongside the other verified factors and does not establish a fixed outcome.'
 ];
 let calls=0;
 const outcome=await generateFreeInterpretationDetailed(chart,'en',{key:'example',ollamaEnabled:false,limit:()=>true,
  reportMode:true,fetcher:async(_url,init)=>{
   calls++;const payload=JSON.parse(init.body);
   assert.equal(payload.response_format,undefined);
   assert.match(payload.messages[0].content,/plain prose/);
   assert.ok(!JSON.stringify(payload).includes('2000-01-01'));
   return reply(paragraphs.join('\n\n'));
  }
 });
 assert.equal(calls,1);
 assert.equal(outcome.result?.provider,'openrouter');
 assert.match(outcome.result?.text,/lunar need for emotional space/i);
});

test('A7 unsafe prose is rejected and retries as fact-linked JSON, never as fabricated insight',async()=>{
 let count=0;
 const unsafe='The Sun is in Scorpio and absolutely guarantees wealth and marriage. The coming year is predetermined.';
 const result=await generateFreeInterpretationDetailed(chart,'en',{key:'example',ollamaEnabled:false,limit:()=>true,
  reportMode:true,fetcher:async(_url,init)=>{
   count++;
   const body=JSON.parse(init.body);
   if(count===1){
    assert.equal(body.response_format,undefined);
    return reply([unsafe,unsafe].join('\n\n'));
   }
   assert.equal(body.response_format,undefined);
   assert.match(body.messages[0].content,/sections array/);
   return reply(JSON.stringify(good));
  }
 });
 assert.equal(count,2);
 assert.equal(result.result?.provider,'openrouter');
 assert.doesNotMatch(result.result.text,/guarantees wealth/);
});
