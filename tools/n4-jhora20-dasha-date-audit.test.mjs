import test from 'node:test';
import assert from 'node:assert/strict';
import {auditN4JHoraOriginal20DashaDates} from './n4-jhora20-dasha-date-audit.mjs';
test('20 authenticated original JHora captures produce separate UTC/local calendar-day evidence',()=>{
 const result=auditN4JHoraOriginal20DashaDates();
 assert.equal(result.status,'N4_ORIGINAL_JHORA20_VIMSHOTTARI_CALENDAR_DAY_AUDIT_COMPLETE');
 assert.equal(result.originalSyntheticCases,20);
 assert.equal(result.actualGalaxioraUtcClock.majorTotal,180);
 assert.equal(result.actualGalaxioraUtcClock.minorTotal,1620);
 assert.equal(result.originalCapturedLocalFixedOffsetClock.minorTotal,1620);
 for(const clock of [result.actualGalaxioraUtcClock,result.originalCapturedLocalFixedOffsetClock]){
  assert.ok(clock.majorMatches>=0&&clock.majorMatches<=180);
  assert.ok(clock.minorMatches>=0&&clock.minorMatches<=1620);
  assert.equal(clock.first20WorstDayDeltas.length,20);
 }
 assert.equal(result.originalJHoraOption3NumericalDefinitionCertified,false);
 assert.equal(result.productionCalendarDatesApproved,false);
});
