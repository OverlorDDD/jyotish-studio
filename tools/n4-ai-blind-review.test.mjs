import test from 'node:test';
import assert from 'node:assert/strict';
import {renderN4BlindReview} from './n4-ai-blind-review-html.mjs';
import {n4AuditSampleId,N4_LIVE_AUDIT_CORPUS_VERSION} from './n4-ai-synthetic-profiles.mjs';
import {N4_EDITORIAL_VARIANT_VERSION} from './n4-ai-editorial-variants.mjs';
const fixture=Array.from({length:48},(_,i)=>{
 const x=n4AuditSampleId(i);
 return {...x,corpus:N4_LIVE_AUDIT_CORPUS_VERSION,editorialVersion:N4_EDITORIAL_VARIANT_VERSION,
  provider:'groq',model:'openai/gpt-oss-20b',text:'<script>alert("DO-NOT-EXECUTE")</script> '+('Verified chart reflection. '.repeat(45))};
});
test('blind A/B local review is safe, responsive and never exposes A/B labels to readers',()=>{
 const html=renderN4BlindReview(fixture);
 assert.equal((html.match(/class="pair"/g)||[]).length,24);
 assert.equal((html.match(/class="comparison"/g)||[]).length,24);
 assert.ok(html.includes('max-width:700px'));
 assert.ok(!html.includes('<script>alert("DO-NOT-EXECUTE")</script>'));
 assert.ok(html.includes('&lt;script&gt;alert(&quot;DO-NOT-EXECUTE&quot;)&lt;/script&gt;'));
 assert.ok(!html.includes('N4-SYNTH-01-uk-A')&&!html.includes('N4-SYNTH-01-uk-B'));
 assert.ok(html.includes('Зберегти мої оцінки'));
 assert.equal((html.match(/data-score=/g)||[]).length,24*6);
 assert.equal((html.match(/data-critical/g)||[]).length,24+1);
});
test('review refuses incomplete or unpaired mixed-model corpus',()=>{
 assert.throws(()=>renderN4BlindReview(fixture.slice(0,47)),/48 genuine/);
 const altered=fixture.map(x=>({...x}));
 altered[1].model='different-model';
 assert.throws(()=>renderN4BlindReview(altered),/model mismatch/);
 const fabricated=fixture.map(x=>({...x}));
 fabricated[0].text=null;
 assert.throws(()=>renderN4BlindReview(fabricated),/missing actual provider response/);
});
