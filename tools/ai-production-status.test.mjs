import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectFreeAiConfiguration} from './ai-production-status.mjs';
const keys={GEMINI_API_KEY:'private-key',GROQ_API_KEY:'private-key',
 OPENROUTER_API_KEY:'private-key',GEMINI_FREE_TIER_CONFIRMED:'1',
 GROQ_FREE_TIER_CONFIRMED:'1',AI_MODE:'free',FREE_AI_ORDER:'openrouter,gemini,groq'};
test('all three eligible providers with legacy order are reported Gemini first without exposing keys',()=>{
 const r=inspectFreeAiConfiguration(keys);
 assert.equal(r.blocker,null);
 assert.equal(r.readyCount,3);
 assert.deepEqual(r.order,['gemini','groq','openrouter']);
 assert.doesNotMatch(JSON.stringify(r),/private-key/);
});
test('no_provider is explained by missing keys or opt-in, never silently called success',()=>{
 const absent=inspectFreeAiConfiguration({FREE_AI_ORDER:'malformed,ollama'});
 assert.equal(absent.blocker,'NO_ELIGIBLE_PROVIDER');
 assert.ok(absent.providerStates.every(s=>s.state==='MISSING_KEY'));
 const unconfirmed=inspectFreeAiConfiguration({...keys,GEMINI_FREE_TIER_CONFIRMED:'0',
  GROQ_FREE_TIER_CONFIRMED:'0',OPENROUTER_API_KEY:''});
 assert.equal(unconfirmed.blocker,'NO_ELIGIBLE_PROVIDER');
 assert.equal(unconfirmed.providerStates[0].state,'FREE_TIER_NOT_CONFIRMED');
});
test('mode and reader-only switches independently block live AI even with three keys',()=>{
 assert.equal(inspectFreeAiConfiguration({...keys,AI_MODE:'local'}).blocker,'AI_MODE_NOT_FREE');
 assert.equal(inspectFreeAiConfiguration({...keys,GALAXIORA_READER_ONLY:'1'}).blocker,'READER_ONLY_ENABLED');
});
test('at least one eligible backup remains usable while unavailable providers are skipped',()=>{
 const r=inspectFreeAiConfiguration({...keys,GEMINI_API_KEY:'',GROQ_FREE_TIER_CONFIRMED:'0'});
 assert.equal(r.blocker,null);
 assert.equal(r.readyCount,1);
 assert.equal(r.providerStates[2].name,'openrouter');
 assert.equal(r.providerStates[2].state,'READY');
});
