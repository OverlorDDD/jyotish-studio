import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewN4MathReadiness} from './n4-math-integration-readiness.mjs';
test('a passing math-lab without production-specific JHora methods cannot certify public 16 cards',()=>{
 const r=reviewN4MathReadiness();
 assert.equal(r.status,'N4_NATAL_MATH_INTEGRATION_BLOCKED');
 assert.equal(r.actualCalculator.d2Method,'Sun/Moon Hora');
 assert.equal(r.originalJHora50Research.d2Method,'Uma-Shambhu Hora');
 assert.equal(r.originalJHora50Research.sameAsActualCalculator,false);
 assert.equal(r.symbolic16VargaRuleEvidence.productionSunMoonIndependentPyJhora8000,true);
 assert.equal(r.symbolic16VargaRuleEvidence.originalJHoraUmaShambhu8000,true);
 assert.ok(!r.releaseBlockers.includes('D2_PRODUCTION_SUN_MOON_VS_ORIGINAL_JHORA_UMA_SHAMBHU'));
 assert.ok(r.releaseBlockers.includes('PRODUCTION_LAHIRI_PHYSICAL_EPHEMERIS_NEEDS_INDEPENDENT_SAME_PROFILE_CLOSURE'));
 assert.equal(r.productionReleasePermitted,false);
 assert.equal(r.calculatorUiRedesignAuthorizedByMath,false);
 assert.equal(r.n4EnhancedAiPublicationAuthorizedByMath,false);
 assert.ok(r.releaseBlockers.includes('VIMSHOTTARI_JHORA_YEAR_DEFINITION_AND_DATE_NOT_CERTIFIED'));
});
test('forged aggregate success is not accepted as full certification',()=>{
 assert.throws(()=>reviewN4MathReadiness({n414Aggregate:{status:'PASS',fullN414CertificateIssued:true}}),
  /N414_AGGREGATE_GATE_BLOCKED/);
});

test('N4 readiness property schema uses exact evidence key and remains fail closed',()=>{
 const result=reviewN4MathReadiness();
 assert.deepEqual(Object.keys(result.symbolic16VargaRuleEvidence).sort(),[
  'originalJHoraPhysicalPositionsDoNotProveProductionLahiri',
  'originalJHoraUmaShambhu8000',
  'productionSunMoonIndependentPyJhora8000',
  'twoDifferentValidD2MethodsAreNotFormulaDefects'
 ].sort());
 assert.equal(result.symbolic16VargaRuleEvidence.productionSunMoonIndependentPyJhora8000,true);
 assert.equal(result.productionReleasePermitted,false);
});
