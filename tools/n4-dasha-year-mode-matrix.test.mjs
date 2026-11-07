import test from 'node:test';
import assert from 'node:assert/strict';
import {auditN4DashaModeMatrix} from './n4-dasha-year-mode-matrix.mjs';
test('12 year/clock combinations source-bound to original 20 JHora GUI records',()=>{
 const r=auditN4DashaModeMatrix();
 assert.equal(r.status,'N4_JHORA20_YEAR_MODE_HOLDOUT_FORENSICS_COMPLETED');
 assert.equal(r.candidatesByHoldoutScore.length,12);
 assert.equal(r.actualProductionUtc.majorExact,37);
 assert.equal(r.actualProductionUtc.minorExact,294);
 assert.equal(r.actualProductionCapturedLocal.minorExact,293);
 for(const c of r.candidatesByHoldoutScore) {
  assert.equal(c.training.majors,90);
  assert.equal(c.holdout.minors,810);
  assert.equal(c.overall.minors,1620);
  assert.ok(c.holdout.minorExact<=810);
 }
 assert.equal(r.productionDashaDatesCertified,false);
 assert.equal(r.fixedCalendarYearModelAutomaticallyApproved,false);
});
