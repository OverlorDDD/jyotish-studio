import test from 'node:test';
import assert from 'node:assert/strict';
import {n4AuditSampleId,N4_LIVE_AUDIT_CORPUS_VERSION} from './n4-ai-synthetic-profiles.mjs';
import {n4SyntheticVariantFetcher,N4_EDITORIAL_VARIANT_VERSION,N4_SYNTHETIC_EDITORIAL_FOCUS,auditN4PairedModelIdentity} from './n4-ai-editorial-variants.mjs';
test('48 cases cover 12 synthetic charts, two languages and two variants',()=>{
 const rows=Array.from({length:48},(_,i)=>n4AuditSampleId(i));
 assert.equal(new Set(rows.map(x=>x.id)).size,48);
 assert.equal(new Set(rows.map(x=>x.seed)).size,12);
 assert.equal(rows.filter(x=>x.lang==='uk').length,24);
 assert.equal(rows.filter(x=>x.lang==='en').length,24);
 for(let i=0;i<48;i+=2){
  assert.equal(rows[i].seed,rows[i+1].seed);
  assert.equal(rows[i].lang,rows[i+1].lang);
  assert.equal(rows[i].variant,'A');
  assert.equal(rows[i+1].variant,'B');
 }
 assert.match(N4_LIVE_AUDIT_CORPUS_VERSION,/v2$/);
});
test('A/B transport holds source chart and credentials constant but changes editorial focus',async()=>{
 const base={model:'synthetic-only',messages:[{role:'system',content:'Base Direct Jyotish rules'},{role:'user',content:'Identical verified D1 D9 D10 and selected D facts'}]};
 const captures=[];
 const transport=async(url,init)=>{captures.push({url,headers:init.headers,body:JSON.parse(init.body)});return new Response('{}',{status:200});};
 for(const variant of ['A','B'])await n4SyntheticVariantFetcher(transport,variant)('https://example.test/api',{
  method:'POST',headers:{Authorization:'Bearer TEST-NOT-SECRET'},body:JSON.stringify(base)
 });
 assert.equal(captures.length,2);
 assert.deepEqual(captures[0].headers,captures[1].headers);
 assert.equal(captures[0].url,captures[1].url);
 assert.deepEqual(captures[0].body.messages[1],base.messages[1]);
 assert.deepEqual(captures[1].body.messages[1],base.messages[1]);
 assert.notEqual(captures[0].body.messages[0].content,captures[1].body.messages[0].content);
 for(let i=0;i<2;i++){
  assert.ok(captures[i].body.messages[0].content.startsWith(base.messages[0].content));
  assert.ok(captures[i].body.messages[0].content.includes(N4_EDITORIAL_VARIANT_VERSION));
  assert.ok(captures[i].body.messages[0].content.includes(N4_SYNTHETIC_EDITORIAL_FOCUS[i?'B':'A']));
 }
 assert.throws(()=>n4SyntheticVariantFetcher(transport,'C'),/Invalid synthetic/);
});

test('A/B study rejects a mixed model pair, not a genuine same-model pair',()=>{
 const a={id:'A',seed:0,lang:'uk',variant:'A',provider:'gemini',model:'gemini-3.1-flash-lite'};
 const b={...a,id:'B',variant:'B'};
 assert.deepEqual(auditN4PairedModelIdentity([a,b]),[]);
 const mixed={...b,model:'unrelated-random-router-model'};
 assert.deepEqual(auditN4PairedModelIdentity([a,mixed]),[{id:'B',reasons:['paired_provider_or_model_mismatch']}]);
});
