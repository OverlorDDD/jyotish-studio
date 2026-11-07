import test from 'node:test';
import assert from 'node:assert/strict';
import {auditN4DashaYearMode,firstDashaStartMs} from './n4-vimshottari-year-mode-audit.mjs';
const utc='2001-02-03T04:52:00.000Z';
test('nine mahadashas and all 81 minor periods: independent fixed-year invariants',()=>{
 for(const moon of [0,0.123,13.4,120.45,230.2,359.9]){
  const result=auditN4DashaYearMode(moon,utc);
  assert.equal(result.status,'N4_VIMSHOTTARI_FIXED_YEAR_INTERNAL_INVARIANTS_PASS');
  assert.equal(result.existingYearDays,365.2425);
  assert.equal(result.independentCalendarDateCertification,false);
 }
});
test('exact beginning of first nakshatra yields birth instant for first Ketu period',()=>{
 assert.equal(firstDashaStartMs(0,utc,365.2425),Date.parse(utc));
});
test('360-day vs tropical year produces substantial cumulative difference',()=>{
 const r=auditN4DashaYearMode(123.456,utc);
 const savana=r.alternateYearModes.find(x=>x.yearDays===360);
 assert.ok(savana);
 assert.ok(Math.abs(savana.full120YearCycleDifferenceDays)>600);
 assert.equal(r.originalJHoraYearDefinitionMappingConfirmed,false);
});
test('rejects unpinned year mode and invalid UTC with no silent normalization',()=>{
 assert.throws(()=>firstDashaStartMs(0,utc,361),/unpinned/);
 assert.throws(()=>firstDashaStartMs(0,'2024-01-01',365.2425),/unpinned/);
 assert.throws(()=>firstDashaStartMs(360,utc,365.2425),/unpinned/);
});
