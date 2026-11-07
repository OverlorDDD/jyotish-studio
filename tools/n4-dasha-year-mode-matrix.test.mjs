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

test('original source holdout pins actual 20-case year-length results, no overfitting',()=>{
 const r=auditN4DashaModeMatrix();
 const find=name=>r.candidatesByHoldoutScore.find(x=>x.yearModel===name&&x.clock==='UTC');
 const current=find('current-gregorian-365.2425');
 const sidereal=find('sidereal-365.25636');
 const savana=find('savana-360');
 assert.equal(current.training.minorExact,144);
 assert.equal(current.holdout.minorExact,150);
 assert.equal(current.overall.minorExact,294);
 assert.equal(sidereal.training.minorExact,188);
 assert.equal(sidereal.holdout.minorExact,152);
 assert.equal(sidereal.overall.minorExact,340);
 assert.equal(savana.overall.minorExact,6);
 assert.equal(r.productionDashaDatesCertified,false);
});
