import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDirectJyotish} from '../apps/api/src/direct-jyotish.ts';
import {n4SyntheticAuditChart} from './n4-ai-synthetic-profiles.mjs';
test('complete-life lab uses one bounded free Groq attempt and covers 14 domains without raw birth metadata',async()=>{
 const before=[process.env.N4_VARGA_AI_ENABLED,process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED];
 process.env.N4_VARGA_AI_ENABLED='1';
 process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED='1';
 try{
  let calls=0,body,usage=[],rejected=null;
  const result=await generateDirectJyotish(n4SyntheticAuditChart(0),'uk','2026-11-05',{
   order:['groq'],keys:{groq:'TEST_ONLY_NOT_AN_API_KEY'},freeConfirmed:{groq:true},
   n4FullLife:true,limit:()=>true,onUsage:e=>usage.push(e),
   onRejectedText:e=>{rejected=e;},
   fetcher:async(_url,opts)=>{
    calls++;body=JSON.parse(opts.body);
    return new Response(JSON.stringify({model:'openai/gpt-oss-20b',
     choices:[{finish_reason:'stop',message:{content:'## Замало даних для достовірного трактування.'}}],
     usage:{prompt_tokens:1100,completion_tokens:120,total_tokens:1220}}),{status:200});
   }
  });
  assert.equal(calls,1);
  assert.equal(result.result,null);
  assert.equal(result.reason,'invalid_response');
  assert.equal(body.max_tokens,4400);
  assert.ok(body.messages[0].content.includes('750-950 words'));
  assert.ok(!body.messages.map(m=>m.content).join(' ').includes('1994-05-17'));
  for(const d of [2,3,4,7,9,10,12,16,20,24,27,30,40,45])
   assert.match(body.messages[1].content,new RegExp('(?:^|\\n)D'+d+'\\s'));
  assert.equal(usage.length,1);
  assert.equal(usage[0].promptTokens,1100);
  assert.equal(usage[0].completionTokens,120);
  assert.equal(usage[0].totalTokens,1220);
  assert.ok(rejected&&rejected.codes.length>=1);
 }finally{
  for(const [key,value] of [['N4_VARGA_AI_ENABLED',before[0]],
    ['N4_VARGA_INDEPENDENT_REFERENCE_APPROVED',before[1]]]){
   if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
 }
});
