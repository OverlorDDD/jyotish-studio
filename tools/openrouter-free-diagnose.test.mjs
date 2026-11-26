import test from 'node:test';
import assert from 'node:assert/strict';
import {openRouterLimitSource,openRouterLimitClass} from '../apps/api/src/openrouter-rate-limit.ts';
import {isFreeModel,safeModelCandidates} from './openrouter-free-diagnose.mjs';
test('OpenRouter error metadata distinguishes account quota from overloaded model capacity',()=>{
 const account={error:{metadata:{limit_source:'openrouter_free_tier_per_minute',raw:'sk-or-private'}}};
 const upstream={error:{metadata:{limit_source:'upstream_provider_shared_pool',raw:'do not log this'}}};
 assert.equal(openRouterLimitClass(openRouterLimitSource(account)),'account_minute');
 assert.equal(openRouterLimitClass(openRouterLimitSource(upstream)),'provider_pool');
 assert.equal(openRouterLimitClass(openRouterLimitSource({error:{metadata:{limit_source:'openrouter_free_tier_daily'}}})),'account_daily');
 assert.equal(openRouterLimitSource({error:{metadata:{limit_source:'PRIVATE_SECRET'}}}),'unknown');
 assert.equal(openRouterLimitClass('unknown'),'other');
});
test('OpenRouter doctor enumerates only explicit zero-priced free chat models',()=>{
 assert.equal(isFreeModel('google/gemma-4-26b-a4b-it:free'),true);
 assert.equal(isFreeModel('openrouter/free'),false);
 assert.equal(isFreeModel('openai/gpt-oss-120b'),false);
 const models=[
 {id:'nvidia/nemotron-3-ultra:free',pricing:{prompt:'0',completion:'0'},context_length:30000,architecture:{output_modalities:['text']}},
 {id:'provider/paid',pricing:{prompt:'1',completion:'1'},context_length:100000,architecture:{output_modalities:['text']}},
 {id:'provider/rerank:free',pricing:{prompt:'0',completion:'0'},context_length:100000,architecture:{output_modalities:['embedding']}},
 {id:'provider/tiny:free',pricing:{prompt:'0',completion:'0'},context_length:2000,architecture:{output_modalities:['text']}}
 ];
 assert.deepEqual(safeModelCandidates(models),[{model:'nvidia/nemotron-3-ultra:free',contextTokens:30000}]);
});
