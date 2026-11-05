import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeN4LocalUsage} from './n4-ai-usage-summary.mjs';
test('local lab provides admin-compatible numeric counters with no guesswork',()=>{
 const a={provider:'groq',tokenUsage:{promptTokens:690,completionTokens:1240,totalTokens:1930,cachedTokens:150}};
 const b={provider:'groq',tokenUsage:{promptTokens:700,completionTokens:850,totalTokens:1550,cachedTokens:0}};
 const s=summarizeN4LocalUsage([a],[b,{provider:'groq',tokenUsage:null}]);
 assert.equal(s.totalTokensReported,3480);
 assert.equal(s.promptTokensReported,1390);
 assert.equal(s.completionTokensReported,2090);
 assert.equal(s.cachedTokensReported,150);
 assert.equal(s.recordsWithTokenUsage,2);
 assert.equal(s.recordsWithoutTokenUsage,1);
 assert.equal(s.rejectedRecords,2);
 assert.equal(s.scope,'LOCAL_SYNTHETIC_LAB_NOT_PRODUCTION_ADMIN');
 assert.ok(!JSON.stringify(s).includes('rawText'));
});
