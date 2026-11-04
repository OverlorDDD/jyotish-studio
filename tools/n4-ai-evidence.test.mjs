import test from 'node:test';
import assert from 'node:assert/strict';
import {compactN4VargaFacts,n4AiEligible,N4_EVIDENCE_VERSION,N4_AI_INSTRUCTION}
 from '../apps/api/src/n4-varga-evidence.ts';
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const sample={
 ascendant:{longitude:22.514},
 d1:names.map((name,i)=>({name,longitude:9+i*29.355,retrograde:false})),
 input:{date:'1980-02-17',time:'03:33',latitude:12.34,longitude:56.78,timeZone:'Europe/Kyiv'}
};
test('N4 AI is disabled unless BOTH explicit operational approvals exist',()=>{
 assert.equal(n4AiEligible({}),false);
 assert.equal(n4AiEligible({N4_VARGA_AI_ENABLED:'1'}),false);
 assert.equal(n4AiEligible({N4_VARGA_INDEPENDENT_REFERENCE_APPROVED:'1'}),false);
 assert.equal(n4AiEligible({N4_VARGA_AI_ENABLED:'1',N4_VARGA_INDEPENDENT_REFERENCE_APPROVED:'1'}),true);
});
test('N4 annex is bounded machine facts only; no raw natal metadata, no unsupported D60',()=>{
 const a=compactN4VargaFacts(sample),b=compactN4VargaFacts(sample);
 assert.equal(a,b);
 assert.match(a,new RegExp(N4_EVIDENCE_VERSION));
 for(const name of ['D2','D3','D4','D7','D12','D16','D20','D24','D27','D30','D40','D45'])
  assert.match(a,new RegExp('^'+name+' ','m'));
 assert.doesNotMatch(a,/^D60 .* lagna=/m);
 for(const detail of ['1980-02-17','03:33','12.34','56.78','Europe/Kyiv'])assert.ok(!a.includes(detail));
 assert.ok(a.length<3800);
 assert.match(N4_AI_INSTRUCTION,/D1, D9 and D10 remain the basis/);
});
