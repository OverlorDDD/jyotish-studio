import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyN4BirthCivilTime} from './n4-historical-birth-confidence.mjs';
test('1990 Kyiv fold and 2011 Samoa skipped day are blocked, not defaulted',()=>{
 for(const [zone,date,time,status] of [
  ['Europe/Kyiv','1990-07-01','01:30','BIRTH_TIME_AMBIGUOUS_FOLD'],
  ['Pacific/Apia','2011-12-30','12:00','BIRTH_TIME_NONEXISTENT_GAP']]){
  const r=classifyN4BirthCivilTime({zone,date,time});
  assert.equal(r.status,status);
  assert.equal(r.calculatorMayAssumeOneInstant,false);
  assert.equal(r.legalTimeDocumentCertified,false);
 }
});
test('pre1970 unique zone calculation cannot become legal proof',()=>{
 const r=classifyN4BirthCivilTime({zone:'Europe/London',date:'1930-01-15',time:'12:00'});
 assert.equal(r.status,'PRE_1970_HISTORICAL_EVIDENCE_REQUIRED');
 assert.equal(r.requiresJurisdictionSpecificPrimaryEvidence,true);
 assert.equal(r.d60FullPrecisionEligible,false);
});
test('post1970 unique modern clock remains legal-source unverified',()=>{
 const r=classifyN4BirthCivilTime({zone:'Europe/Kyiv',date:'2024-01-15',time:'12:00'});
 assert.equal(r.status,'IANA_UNIQUE_LEGAL_TIME_NOT_INDEPENDENTLY_CERTIFIED');
 assert.equal(r.legalTimeDocumentCertified,false);
});
test('reject non-IANA timezone and invalid local time',()=>{
 assert.throws(()=>classifyN4BirthCivilTime({zone:'Wrong/Zone',date:'2024-01-15',time:'12:00'}));
 assert.throws(()=>classifyN4BirthCivilTime({zone:'Europe/Kyiv',date:'2024-02-31',time:'12:00'}));
});
