import test from 'node:test';
import assert from 'node:assert/strict';
import {refineN414ObservedCrossings} from './n4-14-crossing-refinement.mjs';
const bodies=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const start='2024-01-15T10:00:00.000Z',t0=Date.parse(start);
const sample=x=>Object.fromEntries(bodies.map((b,i)=>[b,((x+i*7)%360+360)%360]));
const record=brackets=>({status:'N414_SAMPLED_SENSITIVITY_DIAGNOSTIC_ONLY',centerUtc:start,
 windows:[{radiusSeconds:15,bodies:bodies.map((body,i)=>({body,observedCrossingBrackets:i===0?brackets:[]}))}]});
test('refines observed D60 Lagna crossing to <=125 ms, never certifies',async()=>{
 const r=await refineN414ObservedCrossings({observed:record([[0,1]]),sampleAtUtc:async iso=>
  sample(20.49+(Date.parse(iso)-t0)/1000*.02)});
 assert.equal(r.observedBrackets,1);
 assert.equal(r.refinedBrackets,1);
 assert.equal(r.blockedBrackets,0);
 assert.ok(r.maximumRefinedWidthMs<=125);
 assert.equal(r.productionReleasePermitted,false);
 assert.equal(r.roots[0].continuousUniquenessCertified,false);
});
test('handles true 360-degree D60 crossing',async()=>{
 const r=await refineN414ObservedCrossings({observed:record([[0,1]]),sampleAtUtc:async iso=>
  sample(359.99+(Date.parse(iso)-t0)/1000*.02)});
 assert.equal(r.refinedBrackets,1);
 assert.ok(r.maximumRefinedWidthMs<=125);
});
test('rejects overfast/multi-sector interval rather than false precision',async()=>{
 const r=await refineN414ObservedCrossings({observed:record([[0,1]]),sampleAtUtc:async iso=>
  sample(20.2+(Date.parse(iso)-t0)/1000*.9)});
 assert.equal(r.refinedBrackets,0);assert.equal(r.blockedBrackets,1);
});
test('rejects malformed diagnostic interval rather than producing a root',async()=>{
 await assert.rejects(refineN414ObservedCrossings({observed:record([[0,2]]),
  sampleAtUtc:async()=>sample(20.2)}),/N414_REFINEMENT_INVALID_SECOND_BRACKET/);
});
test('no observed crossing does not certify stability',async()=>{
 const r=await refineN414ObservedCrossings({observed:record([]),sampleAtUtc:async()=>sample(20.2)});
 assert.equal(r.observedBrackets,0);assert.equal(r.independentContinuousDynamicsCertified,false);
});
