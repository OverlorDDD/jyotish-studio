import test from 'node:test';
import assert from 'node:assert/strict';
import {buildN4TokenLeanPrompt,N4_TOKEN_LEAN_VERSION} from '../apps/api/src/n4-token-lean.ts';
import {n4SyntheticAuditChart} from './n4-ai-synthetic-profiles.mjs';
import {generateDirectJyotish} from '../apps/api/src/direct-jyotish.ts';

test('TokenLean selects exactly two chart-specific lenses; no raw natal input or D60 is sent',()=>{
 const selected=new Set();
 for(let seed=0;seed<12;seed++)for(const lang of ['uk','en']){
  const p=buildN4TokenLeanPrompt(n4SyntheticAuditChart(seed),lang,'2026-11-04');
  assert.equal(p.version,N4_TOKEN_LEAN_VERSION);
  assert.ok(p.chars<=4200&&p.chars>500);
  assert.equal(p.selectedDivisions.length,2);
  assert.ok(p.system.includes('320-450 word'));
  assert.match(p.user,/D1 lagna s\d+/);
  assert.match(p.user,/D9 lagna s\d+/);
  assert.match(p.user,/D10 lagna s\d+/);
  for(const d of p.selectedDivisions)assert.match(p.user,new RegExp('R-D'+d+' topic='));
  assert.doesNotMatch(p.user,/D60|SYNTHETIC_TEST_ONLY_NEVER_REAL_BIRTH|1994-05-17|08:16|date=1994|longitude=0/);
  assert.doesNotMatch(p.system,/SYNTHETIC_TEST_ONLY_NEVER_REAL_BIRTH|1994-05-17|08:16/);
  selected.add(p.selectedDivisions.join(','));
 }
 assert.ok(selected.size>=3,'theme selection varies across synthetic cases');
});
test('opt-in TokenLean consumes exactly one provider call, even when model exhausts output budget',async()=>{
 const oldA=process.env.N4_VARGA_AI_ENABLED,oldB=process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED;
 try{
  process.env.N4_VARGA_AI_ENABLED='1';
  process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED='1';
  let called=0,request,metrics;
  const result=await generateDirectJyotish(n4SyntheticAuditChart(2),'uk','2026-11-04',{
   order:['groq'],keys:{groq:'SYNTHETIC_TEST_KEY'},freeConfirmed:{groq:true},
   n4TokenLean:true,limit:()=>true,
   fetcher:async(url,init)=>{
    called++;
    request=JSON.parse(init.body);
    return {ok:true,text:async()=>JSON.stringify({
     model:'openai/gpt-oss-20b',choices:[{finish_reason:'length',message:{content:'An incomplete illustrative paragraph.'}}],
     usage:{prompt_tokens:850,completion_tokens:2150,total_tokens:3000,
      prompt_tokens_details:{cached_tokens:320}}
    })};
   },
   onTokenUsage:u=>{metrics=u;}
  });
  assert.equal(called,1,'a truncated response must NEVER trigger an immediate retry');
  assert.equal(result.result,null);
  assert.equal(result.reason,'invalid_response');
  assert.equal(request.messages.length,2);
  assert.ok(request.messages[0].content.includes('320-450 word'));
  assert.ok(request.messages[0].content.length+request.messages[1].content.length<=4200);
  assert.equal(request.max_tokens,2400);
  assert.equal(metrics.promptTokens,850);
  assert.equal(metrics.cachedTokens,320);
  assert.equal(metrics.completionTokens,2150);
 }finally{
  if(oldA===undefined)delete process.env.N4_VARGA_AI_ENABLED;else process.env.N4_VARGA_AI_ENABLED=oldA;
  if(oldB===undefined)delete process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED;else process.env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED=oldB;
 }
});
