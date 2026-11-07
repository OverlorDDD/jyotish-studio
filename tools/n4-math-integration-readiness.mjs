/**
 * Research-only integration readiness gate for the ACTUAL natal calculator.
 * Do not confuse 50-case original JHora method-aligned research success with
 * the production Lahiri+Sun/Moon calculator. A genuine release needs separately
 * authenticated external certificates, historical UTC, dates and human approval.
 */
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {VARGA_PROFILE} from '../packages/jyotish-core/src/vargas.ts';
import {DASHA_YEAR_DAYS} from '../packages/jyotish-core/src/index.ts';
import {auditN414AggregateEvidence} from './n4-14-report-gate.mjs';

export const N4_MATH_READINESS_VERSION='n4-math-method-reconciliation-v1';
export function reviewN4MathReadiness(input={}){
 const issues=[];
 if(VARGA_PROFILE!=='parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1')
  throw Error('N4_UNKNOWN_PRODUCTION_VARGA_PROFILE_REVIEW_REQUIRED');
 if(DASHA_YEAR_DAYS!==365.2425)throw Error('N4_PRODUCTION_DASHA_MODE_CHANGED_REVIEW_REQUIRED');
 const verifiedAggregate=input.n414Aggregate?
  auditN414AggregateEvidence(input.n414Aggregate):null;
 if(!verifiedAggregate)issues.push('N414_NATIVE_GRID_RESULT_NOT_SUPPLIED');
 issues.push(
  'D2_PRODUCTION_SUN_MOON_VS_ORIGINAL_JHORA_UMA_SHAMBHU',
  'PRODUCTION_LAHIRI_VS_RESEARCH_TRUE_CITRA_GEOMETRIC',
  'VIMSHOTTARI_JHORA_YEAR_DEFINITION_AND_DATE_NOT_CERTIFIED',
  'HISTORICAL_CIVIL_TIME_LEGAL_OFFSETS_NOT_CERTIFIED',
  'D60_CONTINUOUS_TIME_ENCLOSURES_NOT_CERTIFIED',
  'FINAL_CURRENT_HEAD_FULL_CI_AND_OWNER_APPROVAL_NOT_RECORDED'
 );
 return Object.freeze({
  version:N4_MATH_READINESS_VERSION,
  status:'N4_NATAL_MATH_INTEGRATION_BLOCKED',
  actualCalculator:{ayanamsa:'Lahiri',d2Method:'Sun/Moon Hora',
   vimshottariConstantYearDays:DASHA_YEAR_DAYS,vargaProfile:VARGA_PROFILE},
  originalJHora50Research:{ayanamsa:'True Citra',physicalPositions:'geometric',
   d2Method:'Uma-Shambhu Hora',sameAsActualCalculator:false},
  n414ResearchAggregateValidated:!!verifiedAggregate,
  n414NoContinuousCertification:verifiedAggregate?verifiedAggregate.continuousD60Certified===false:true,
  releaseBlockers:issues,
  userFacingD60TimePrecisionClaimAllowed:false,
  calculatorUiRedesignAuthorizedByMath:false,
  n4EnhancedAiPublicationAuthorizedByMath:false,
  productionReleasePermitted:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  if(process.argv.length>3)throw Error('Usage: node --experimental-strip-types tools/n4-math-integration-readiness.mjs [N414_PRIVATE_AGGREGATE.json]');
  const input=process.argv[2]?{n414Aggregate:JSON.parse(readFileSync(resolve(process.argv[2]),'utf8'))}:{};
  console.log(JSON.stringify(reviewN4MathReadiness(input),null,2));
 }catch(e){console.error(e.message);process.exitCode=2;}
}
