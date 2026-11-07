import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveN414CivilTime,inspectN414D60Envelope} from './n4-14-time-d60.mjs';
test('historical IANA offset: Kyiv winter is UTC+2',()=>{
  const r=resolveN414CivilTime({date:'2024-01-15',time:'12:00',zone:'Europe/Kyiv'});
  assert.equal(r.status,'UNIQUE');
  assert.deepEqual(r.candidatesUtc,['2024-01-15T10:00:00.000Z']);
  assert.equal(r.hostTzdbExternallyCertified,false);
});
test('spring-forward nonexistent local time is a gap',()=>{
  const r=resolveN414CivilTime({date:'2024-03-31',time:'03:30',zone:'Europe/Kyiv'});
  assert.equal(r.status,'GAP'); assert.deepEqual(r.candidatesUtc,[]);
});
test('autumn fallback repeats the same local civil clock',()=>{
  const r=resolveN414CivilTime({date:'2024-10-27',time:'03:30',zone:'Europe/Kyiv'});
  assert.equal(r.status,'FOLD'); assert.equal(r.candidatesUtc.length,2);
  assert.deepEqual(r.candidatesUtc,['2024-10-27T00:30:00.000Z','2024-10-27T01:30:00.000Z']);
});
test('rejects invalid civil days and zones rather than rollover',()=>{
  assert.throws(()=>resolveN414CivilTime({date:'2024-02-30',time:'12:00',zone:'Europe/Kyiv'}),/INVALID_CIVIL_DATE/);
  assert.throws(()=>resolveN414CivilTime({date:'2024-01-01',time:'12:00',zone:'Fake/Zone'}),/INVALID_IANA_TIMEZONE/);
});
test('D60 intervals cannot hide multiple crossings even if endpoints share division',()=>{
  const r=inspectN414D60Envelope({minimum:30.23,nominal:33.23,maximum:36.23});
  assert.equal(r.stableWithoutBoundary,false); assert.equal(r.boundaryCount,12);
  assert.equal(r.firstBoundaryDegrees,30.5); assert.equal(r.lastBoundaryDegrees,36);
});
test('nominal on boundary or an envelope touching it fails closed',()=>{
  assert.equal(inspectN414D60Envelope({minimum:20.1,nominal:20.3,maximum:20.5}).stableWithoutBoundary,false);
  assert.equal(inspectN414D60Envelope({minimum:20.1,nominal:20.2,maximum:20.4}).stableWithoutBoundary,true);
  assert.throws(()=>inspectN414D60Envelope({minimum:3,nominal:2,maximum:4}),/INVALID_CONTINUOUS/);
});
