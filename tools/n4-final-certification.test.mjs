import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditN4FinalDecision,runN4FinalDecision} from './n4-final-certification.mjs';
import {auditN4ScopedEvidence} from './n4-math-scope-ledger.mjs';
import {reviewN4MathReadiness} from './n4-math-integration-readiness.mjs';

const verified=()=>{
 const ledger=JSON.parse(readFileSync(new URL('./n4-final-evidence-ledger.json',import.meta.url),'utf8'));
 // Production gates are intentionally Object.freeze()-ed. Test mutations
 // must target copies so an expected N4_FINAL rejection is actually tested,
 // not a TypeError from JavaScript trying to edit a frozen object.
 const scope=auditN4ScopedEvidence(),ready=reviewN4MathReadiness();
 return {ledger,scoped:{...scope},readiness:{
  ...ready,actualCalculator:{...ready.actualCalculator},
  releaseBlockers:[...ready.releaseBlockers]
 }};
};
const mutate=fn=>{
 const input=verified();
 fn(input);
 return ()=>auditN4FinalDecision(input);
};
test('N4 original owner-reported research evidence is closed at explicit per-method scope',()=>{
 const x=runN4FinalDecision();
 assert.equal(x.status,'N4_RESEARCH_CYCLE_CLOSED_SCOPED_PRODUCTION_NOT_CERTIFIED');
 assert.equal(x.researchCycleClosed,true);
 assert.equal(x.noFurtherOneDayFittingRequired,true);
 assert.equal(x.mathematicalScopes.shodashavargaSymbolicRules,'METHOD_SCOPED_8000_OF_8000_PER_INDEPENDENT_PROFILE');
 assert.equal(x.mathematicalScopes.trueSiderealSolarYearCalendar,'1619_OF_1620_PRINTED_DATES_ONE_PRINT_PRECISION_AMBIGUITY');
 assert.equal(x.existingProductionVimshottariYearDays,365.2425);
 assert.equal(x.productionN4MathCertified,false);
 assert.equal(x.fullCurrentHeadCIPassAttested,false);
 assert.equal(x.publicSixteenChartDisplayAuthorized,false);
 assert.equal(x.n4EnhancedAiAuthorized,false);
 assert.equal(x.productionN4ReleasePermitted,false);
});
test('last JHora calendar date cannot be silently recast as 1620/1620',()=>{
 assert.throws(mutate(x=>{x.ledger.evidence[2].minorCalendarMatches=1620}),/N4_FINAL_EVIDENCE_FAIL_CLOSED/);
});
test('source precision does not independently prove the unrounded JHora Moon',()=>{
 assert.throws(mutate(x=>{x.ledger.evidence[3].sourceRoundingProvenActualCause=true}),/N4_FINAL_EVIDENCE_FAIL_CLOSED/);
});
test('evidence hashes prevent silent replacement of original owner-provided N418 and native N414 reports',()=>{
 assert.throws(mutate(x=>{x.ledger.evidence[3].ownerProvidedSha256='0'.repeat(64)}),/N4_FINAL_EVIDENCE_FAIL_CLOSED/);
 assert.throws(mutate(x=>{x.ledger.evidence[1].ownerProvidedSha256='0'.repeat(64)}),/N4_FINAL_EVIDENCE_FAIL_CLOSED/);
});
test('original JHora method profile must not be equated with production Lahiri/SunMoon',()=>{
 assert.throws(mutate(x=>{x.ledger.symbolic.methodPairEquivalence=true}),/N4_FINAL_EVIDENCE_FAIL_CLOSED/);
 assert.throws(mutate(x=>{x.ledger.evidence[0].productionLahiriProven=true}),/N4_FINAL_EVIDENCE_FAIL_CLOSED/);
});
test('D60, legal historical birth time, and public UI switches cannot be invented as certified',()=>{
 for(const key of ['continuousD60Certified','historicalLegalLocalTimeCertified',
   'productionN4ReleasePermitted','productionN4FeatureFlagsAllowed','currentHeadFullCIGreenAttested']){
  assert.throws(mutate(x=>{x.ledger.release[key]=true}),/N4_FINAL_EVIDENCE_FAIL_CLOSED/,key);
 }
});
test('actual existing 365.2425-day production mode cannot be switched by report alone',()=>{
 assert.throws(mutate(x=>{x.ledger.actualProduction.dashaYearDays=365.25636}),/N4_FINAL_EVIDENCE_FAIL_CLOSED/);
 assert.throws(mutate(x=>{x.readiness.actualCalculator.vimshottariConstantYearDays=365.25636}),/N4_FINAL_EVIDENCE_FAIL_CLOSED/);
});
test('scoped independent evidence must remain source authenticated and production gate closed',()=>{
 assert.throws(mutate(x=>{x.scoped.productionReleasePermitted=true}),/N4_FINAL_EVIDENCE_FAIL_CLOSED/);
 assert.throws(mutate(x=>{x.readiness.productionReleasePermitted=true}),/N4_FINAL_EVIDENCE_FAIL_CLOSED/);
});
