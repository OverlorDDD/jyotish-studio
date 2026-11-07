import test from 'node:test';
import assert from 'node:assert/strict';
import {auditN414Sensitivity,N414_RADII_SECONDS} from './n4-14-sensitivity.mjs';
const BODIES=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const positions=longitude=>Object.fromEntries(BODIES.map((b,i)=>[b,longitude+i*3]));
test('gaps and folds block even a hypothetical sampler',async()=>{
 for(const [date,time,status] of [
  ['2024-03-31','03:30','BLOCKED_CIVIL_TIME_GAP'],
  ['2024-10-27','03:30','BLOCKED_CIVIL_TIME_FOLD']
 ]){
  let called=0;
  const r=await auditN414Sensitivity({date,time,zone:'Europe/Kyiv',
   sampleAtUtc:async()=>{called++;return positions(20.25)}});
  assert.equal(r.status,status);assert.equal(called,0);
  assert.equal(r.productionD60Certified,false);
 }
});
test('one-second D60 sweep detects crossing at ±15s and never certifies',async()=>{
 const mid=Date.parse('2024-01-15T10:00:00.000Z');
 const r=await auditN414Sensitivity({
  date:'2024-01-15',time:'12:00',zone:'Europe/Kyiv',
  radiiSeconds:[15,30,60],
  sampleAtUtc:async iso=>positions(20.49+(Date.parse(iso)-mid)/1000*.002)
 });
 assert.equal(r.windows.length,3);
 assert.ok(r.windows[0].sampledChangedBodies.includes('Ascendant'));
 assert.equal(r.windows[0].continuousTimeWindowCertified,false);
 assert.equal(r.continuousBoundsVerified,false);
 assert.equal(r.productionD60Certified,false);
});
test('constant synthetic positions are stable only on sample grid',async()=>{
 const r=await auditN414Sensitivity({
  date:'2024-01-15',time:'12:00',zone:'Europe/Kyiv',
  radiiSeconds:[15],sampleAtUtc:async()=>positions(20.25)
 });
 assert.deepEqual(r.windows[0].sampledChangedBodies,[]);
 assert.equal(r.status,'N414_SAMPLED_SENSITIVITY_DIAGNOSTIC_ONLY');
 assert.equal(r.windows[0].bodies.length,10);
 assert.equal(r.windows[0].bodies[0].continuousBoundCertified,false);
});
test('malformed native payload never produces favorable output',async()=>{
 await assert.rejects(auditN414Sensitivity({
  date:'2024-01-15',time:'12:00',zone:'Europe/Kyiv',
  radiiSeconds:[15],sampleAtUtc:async()=>({Ascendant:22})
 }),/N414_MISSING_OR_INVALID_NATIVE_POSITIONS/);
});
test('expected radius policy remains 15s,30s,1m,2m,5m',()=>{
 assert.deepEqual(N414_RADII_SECONDS,[15,30,60,120,300]);
});
