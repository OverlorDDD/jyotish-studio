import test from 'node:test';
import assert from 'node:assert/strict';
import {auditN414UtcSensitivity} from './n4-14-sensitivity.mjs';
const BODIES=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const center='2024-01-15T10:00:00.000Z';
const mid=Date.parse(center);
const make=longitude=>Object.fromEntries(BODIES.map((b,i)=>[b,(longitude+i*3+360)%360]));
test('UTC-only pinned-source diagnostic supports 10 bodies and refuses certification',async()=>{
 const r=await auditN414UtcSensitivity({
  centerUtc:center,radiiSeconds:[15,30],
  sampleAtUtc:async()=>make(20.25)
 });
 assert.equal(r.windows.length,2);
 assert.equal(r.windows[0].bodyCount,10);
 assert.equal(r.productionD60Certified,false);
 assert.equal(r.timeZoneIndependentlyVerified,false);
 assert.ok(r.windows.every(w=>!w.continuousTimeWindowCertified));
});
test('native-compatible UTC grid catches a D60 crossing near longitude 360',async()=>{
 const r=await auditN414UtcSensitivity({
  centerUtc:center,radiiSeconds:[15],
  sampleAtUtc:async iso=>make(359.99+(Date.parse(iso)-mid)/1000*0.002)
 });
 const asc=r.windows[0].bodies.find(b=>b.body==='Ascendant');
 assert.ok(asc.sampledSignChanged);
 assert.ok(asc.observedCrossingBrackets.length>0);
 assert.equal(asc.continuousBoundCertified,false);
});
test('same integer-second samples never constitute continuous proof',async()=>{
 const r=await auditN414UtcSensitivity({
  centerUtc:center,radiiSeconds:[15],
  sampleAtUtc:async()=>make(20.25)
 });
 const asc=r.windows[0].bodies.find(b=>b.body==='Ascendant');
 assert.deepEqual(asc.observedCrossingBrackets,[]);
 assert.equal(asc.continuousBoundCertified,false);
 assert.equal(r.status,'N414_SAMPLED_SENSITIVITY_DIAGNOSTIC_ONLY');
});
test('rejects incomplete source UTC and duplicate sample radii',async()=>{
 await assert.rejects(auditN414UtcSensitivity({
  centerUtc:'2024-01-15T10:00:00Z',radiiSeconds:[15],sampleAtUtc:async()=>make(20.2)
 }),/N414_INVALID_UTC/);
 await assert.rejects(auditN414UtcSensitivity({
  centerUtc:center,radiiSeconds:[15,15],sampleAtUtc:async()=>make(20.2)
 }),/N414_INVALID_UTC/);
});
