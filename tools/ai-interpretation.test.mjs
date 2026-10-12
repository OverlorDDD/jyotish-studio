import test from 'node:test';
import assert from 'node:assert/strict';
import {createHourlyLimiter,astrologicalFacts,generateOpenAiInterpretation,AiProviderError} from '../apps/api/src/ai.ts';

const p=(name,signName,house)=>({name,signName,house,nakshatra:'Swati',pada:4});
const chart={
 input:{date:'2000-01-01',time:'12:00',timeZone:'Asia/Kolkata',latitude:28.6139,longitude:77.209},
 ascendant:p('Ascendant','Pisces',1),lagnaD9:p('Ascendant','Libra',1),lagnaD10:p('Ascendant','Pisces',1),
 d1:[p('Sun','Sagittarius',10),p('Moon','Libra',8)],
 dasha:[{lord:'Saturn',start:'2020-01-01T00:00:00.000Z',end:'2030-01-01T00:00:00.000Z',antardashas:[{lord:'Mercury',start:'2025-01-01T00:00:00.000Z',end:'2027-01-01T00:00:00.000Z'}]}]
};
const successfulBody={sections:[{factId:'lagna',text:'This is a symbolic interpretation of the ascendant under the stated tradition.'},{factId:'moon',text:'This is a symbolic interpretation of the Moon under the stated tradition.'},{factId:'dasha',text:'The period can be considered within the traditional framework, not as a prediction.'}]};
const apiReply=obj=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(obj)}}]}),{status:200,headers:{'Content-Type':'application/json'}});

test('per-process hourly limiter resets and enforces budget',()=>{
 const permit=createHourlyLimiter(2);
 assert.equal(permit(100000),true);assert.equal(permit(100001),true);assert.equal(permit(100002),false);assert.equal(permit(3700001),true);
});
test('facts include only calculated placements and no birth metadata',()=>{
 const facts=astrologicalFacts(chart,'uk',Date.parse('2026-10-12'));
 assert.equal(facts.length,6);
 assert.ok(facts.find(f=>f.id==='dasha').fact.includes('Saturn'));
 assert.ok(!JSON.stringify(facts).includes('2000-01-01'));
});
test('OpenAI receives no raw date, coordinates or timezone; output is fact-linked',async()=>{
 let calls=0;
 const result=await generateOpenAiInterpretation(chart,'en',{key:'fake_test_key',now:Date.parse('2026-10-12'),limit:()=>true,fetcher:async(url,init)=>{
  calls++;
  assert.equal(url,'https://api.openai.com/v1/chat/completions');
  const parsed=JSON.parse(init.body);
  assert.equal(parsed.response_format.type,'json_schema');
  const text=JSON.stringify(parsed);
  for(const forbidden of ['Asia/Kolkata','28.6139','77.209','2000-01-01','fake_test_key'])assert.ok(!text.includes(forbidden),`Unnecessary personal data: ${forbidden}`);
  assert.equal(init.headers.Authorization,'Bearer fake_test_key');
  return apiReply(successfulBody);
 }});
 assert.equal(calls,1);assert.equal(result.provider,'openai');assert.ok(result.text.includes('Ascendant: Pisces'));
});
test('reject unknown fact IDs and duplicate sections',async()=>{
 for(const body of [
  {sections:[...successfulBody.sections.slice(0,2),{factId:'future_event',text:'Invented event prediction which should never be accepted by our code.'}]},
  {sections:[successfulBody.sections[0],successfulBody.sections[0],successfulBody.sections[1]]}
 ]){
  await assert.rejects(generateOpenAiInterpretation(chart,'uk',{key:'fake',limit:()=>true,fetcher:async()=>apiReply(body)}),e=>e instanceof AiProviderError&&e.reason==='format');
 }
});
test('provider failures and rate limits never masquerade as a successful OpenAI response',async()=>{
 await assert.rejects(generateOpenAiInterpretation(chart,'en',{key:'fake',limit:()=>false,fetcher:async()=>{throw Error('Should never call provider');}}),e=>e.reason==='limit');
 await assert.rejects(generateOpenAiInterpretation(chart,'en',{key:'fake',limit:()=>true,fetcher:async()=>new Response('{}',{status:429})}),e=>e.reason==='upstream');
});
