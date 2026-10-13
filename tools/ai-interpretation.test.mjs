import test from 'node:test';
import assert from 'node:assert/strict';
import {createHourlyLimiter,astrologicalFacts,generateOpenAiInterpretation,AiProviderError,explainAiFailure} from '../apps/api/src/ai.ts';
import {localInterpretation} from '../apps/api/src/logic.ts';

const p=(name,signName,house)=>({name,signName,house,nakshatra:'Swati',pada:4});
const chart={
 input:{date:'2000-01-01',time:'12:00',timeZone:'Asia/Kolkata',latitude:28.6139,longitude:77.209},
 ascendant:p('Ascendant','Pisces',1),lagnaD9:p('Ascendant','Libra',1),lagnaD10:p('Ascendant','Pisces',1),
 d1:[p('Sun','Sagittarius',10),p('Moon','Libra',8)],
 d9:[{...p('Venus','Libra',2),sign:7}],d10:[{...p('Saturn','Pisces',1),sign:12}],
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
 assert.ok(facts.find(f=>f.id==='dasha').fact.includes('Сатурн'));
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

test('hourly limit is loaded from environment on first live-style request',async()=>{
 const previous=process.env.OPENAI_MAX_CALLS_PER_HOUR;
 process.env.OPENAI_MAX_CALLS_PER_HOUR='1';
 try{
  const send=()=>generateOpenAiInterpretation(chart,'en',{
   key:'fake_local_test',now:Date.parse('2026-10-12'),
   fetcher:async()=>apiReply(successfulBody)
  });
  const result=await send();
  assert.equal(result.provider,'openai');
  await assert.rejects(send(),e=>e instanceof AiProviderError&&e.reason==='limit');
 }finally{
  if(previous===undefined)delete process.env.OPENAI_MAX_CALLS_PER_HOUR;
  else process.env.OPENAI_MAX_CALLS_PER_HOUR=previous;
 }
});

test('local readings are inviting, Ukrainian terminology is fully localized, and source facts remain intact',()=>{
 const demo={...chart,ascendant:{...chart.ascendant,sign:12},d1:[{...chart.d1[0],sign:9},{...chart.d1[1],sign:7}]};
 const uk=localInterpretation(demo,'uk');
 for(const word of ['Риби','Стрілець','Терези','Сваті','D9','D10'])assert.ok(uk.includes(word),'Missing '+word);
 for(const word of ['Pisces','Sagittarius','Libra','Swati','науковий прогноз'])assert.ok(!uk.includes(word),'Unexpected '+word);
 const en=localInterpretation(demo,'en');
 assert.match(en,/ASCENDANT — PERSONAL THEMES/);
 assert.match(en,/Pisces/);
 assert.ok(!en.includes('scientific prediction'));
});

test('safe error messages identify upstream issues without exposing provider text',()=>{
 const cases=[
  ['OpenAI HTTP 401','API key rejected'],
  ['OpenAI HTTP 403','permissions denied'],
  ['OpenAI HTTP 404','model not available'],
  ['OpenAI HTTP 429 insufficient_quota','no available credits'],
  ['OpenAI HTTP 429','request limit'],
  ['OpenAI HTTP 400','structured output settings'],
  ['OpenAI HTTP 503','service error']
 ];
 for(const [err,want] of cases){
  const msg=explainAiFailure(new AiProviderError('upstream',err));
  assert.ok(msg.includes(want),`${err}: ${msg}`);
 }
 assert.match(explainAiFailure(new AiProviderError('format','OpenAI returned a malformed JSON response')),/structured interpretation/);
 assert.match(explainAiFailure(new AiProviderError('timeout','OpenAI request timed out')),/15 seconds/);
 assert.ok(!explainAiFailure(new AiProviderError('upstream','secret token abc')).includes('secret'));
});

test('recognized OpenAI error code is kept, raw provider error text is discarded',async()=>{
 await assert.rejects(
  generateOpenAiInterpretation(chart,'uk',{key:'fake',limit:()=>true,fetcher:async()=>new Response(JSON.stringify({
    error:{code:'insufficient_quota',message:'Private account metadata MUST NOT LEAK'}
  }),{status:429,headers:{'Content-Type':'application/json'}})}),
  e=>e instanceof AiProviderError&&e.message==='OpenAI HTTP 429 insufficient_quota'
 );
});

test('offline report includes actual D1 D9 D10 and dasha period details',()=>{
 const full={...chart,ascendant:{...chart.ascendant,sign:12},d1:[{...chart.d1[0],sign:9},{...chart.d1[1],sign:7}]};
 const ua=localInterpretation(full,'uk');
 for(const term of ['ЛАГНА','РАШІ (D1)','НАВАМША (D9)','ДАШАМША (D10)','ВІМШОТТАРІ ДАША','Сатурн'])assert.ok(ua.includes(term),term);
 const en=localInterpretation(full,'en');
 for(const term of ['RASHI (D1)','NAVAMSA (D9)','DASHAMSA (D10)','VIMSHOTTARI DASHA'])assert.ok(en.includes(term),term);
});
