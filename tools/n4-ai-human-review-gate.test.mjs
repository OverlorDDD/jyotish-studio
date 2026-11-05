import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateN4HumanEditorialReviews,N4_HUMAN_REVIEW_VERSION} from './n4-ai-human-review-gate.mjs';
const make=()=>({schema:N4_HUMAN_REVIEW_VERSION,reviewedAt:'2026-11-05T00:00:00Z',
 rows:Array.from({length:12},(_,i)=>['uk','en'].map(lang=>({
  pair:'n4-'+String(i+1).padStart(2,'0')+'-'+lang,preferred:'left',
  critical:false,scores:[4,4,4,4,4,4],notes:''
 }))).flat()});
test('human review scores are a manual signoff prerequisite, not proof of provider or separate humans',()=>{
 const r=evaluateN4HumanEditorialReviews([make(),make()]);
 assert.equal(r.status,'ELIGIBLE_FOR_MANUAL_EDITOR_SIGNOFF');
 assert.equal(r.pairs,24);
 assert.equal(r.observations,48);
 assert.equal(r.independentReviewersVerified,false);
 assert.equal(r.actualProviderCorpusVerifiedHere,false);
});
test('fail-closed for invented facts, vague quality, partial reviews and reviewer disagreement on safety',()=>{
 const a=make(),b=make();b.rows[0].critical=true;b.rows[1].scores[4]=2;
 const r=evaluateN4HumanEditorialReviews([a,b]);
 assert.equal(r.status,'EDITORIAL_HUMAN_GATES_NOT_MET');
 assert.ok(r.issues.some(x=>x.reason==='critical_factual_or_privacy_failure'));
 assert.ok(r.issues.some(x=>x.reason==='one_or_more_rubric_scores_below_three'));
 assert.throws(()=>evaluateN4HumanEditorialReviews([make(),{...b,rows:b.rows.slice(1)}]),/review set/);
 const c=make();c.rows[0].pair=c.rows[1].pair;
 assert.throws(()=>evaluateN4HumanEditorialReviews([make(),c]),/duplicated/);
});
