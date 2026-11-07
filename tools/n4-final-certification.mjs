/**
 * N4 final research-cycle closeout. A CLOSED RESEARCH CYCLE is NOT a math or
 * production release certificate. Integrity checks are pinned to the owner's
 * original uploaded summaries and the existing independently scoped source
 * ledger. They do not independently re-run JHora or prove original sub-day time.
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {auditN4ScopedEvidence} from './n4-math-scope-ledger.mjs';
import {reviewN4MathReadiness} from './n4-math-integration-readiness.mjs';

export const N4_FINAL_VERSION='n4-final-scope-and-release-decision-20261107-v1';
const fail=message=>{throw Error('N4_FINAL_EVIDENCE_FAIL_CLOSED: '+message)};
const expectedHashes=Object.freeze({
 N413:'c8c7acc9dd7153260b52b29717ac76483a497c6ab50bba31752387d8d8696a0a',
 N414:'5dcf016927c82b8e05a1b35e36c17d697d9db90334dab7f1fee7f7514a907881',
 N417:'f735986849bd709fdf04374f34f51c0c5ab68e90f6e94514e2209702cabe20c7',
 N418:'a10240fdafc22a39646fbd4b3d36d6911cd2096813bd7d8f64962e321453adff'
});
const expectedStatuses=Object.freeze({
 N413:'N413_NATIVE_SWIEPH_PRIVATE_50_CASE_DIAGNOSTIC_PASS',
 N414:'N414_PRIVATE_NATIVE_SWIEPH_50_CASE_GRID_DIAGNOSTIC_PASS',
 N417:'N4_JHORA20_NATIVE_SOLAR_LONGITUDE_DASHA_DIAGNOSTIC_COMPLETED',
 N418:'N418_SOURCE_PRINT_PRECISION_DAY_BOUNDARY_SPANNED_STRICT_SWIEPH_PASS'
});
const requireFalse=(obj,keys,scope)=>{
 if(!obj||keys.some(k=>obj[k]!==false))fail('prohibited or unknown '+scope+' release/certification flags');
};
const requireEvidence=(x,id)=>{
 if(!x||x.id!==id||x.observedStatus!==expectedStatuses[id]||
    x.ownerProvidedSha256!==expectedHashes[id])
  fail('source evidence hash/status '+id);
};
export function auditN4FinalDecision({
 ledger,
 scoped,
 readiness
}={}){
 if(!ledger||ledger.version!=='n4-final-research-evidence-20261107-v1'||
    ledger.scope!=='USER_SUPPLIED_AGGREGATES_AND_PINNED_INDEPENDENT_SOURCES_NOT_PRODUCTION_CERTIFICATE'||
    ledger.originalJHoraSourceSha256!=='5dcb07d6d71f68199af97696e8ad3ca91493b30f4abc41fdd51350c14e4ff992'||
    ledger.originalJHoraTwentyRecords!==20||
    !Array.isArray(ledger.evidence)||ledger.evidence.length!==4)
  fail('source-ledger identity');
 for(let i=0;i<4;i++)requireEvidence(ledger.evidence[i],Object.keys(expectedHashes)[i]);
 const [n413,n414,n417,n418]=ledger.evidence;
 if(n413.sampleOriginalSyntheticCases!==50||
    n413.originalJhoraAlignedTrueCitraUmaShambhuOnly!==true||
    n413.productionLahiriProven!==false||
    n414.sampleOriginalSyntheticCases!==50||n414.observedOneSecondEpochs!==30050||
    n414.refinedObservedBoundaryBrackets!==253||
    n414.continuousAllIntervalCertified!==false||
    n414.historicalBirthTimeProven!==false)
  fail('original JHora profile or D60 source scope');
 if(n417.majorCalendarMatches!==180||n417.majorCalendarTotal!==180||
    n417.minorCalendarMatches!==1619||n417.minorCalendarTotal!==1620||
    n417.holdoutMinorCalendarMatches!==810||n417.holdoutMinorCalendarTotal!==810||
    n417.calendarPrecisionAmbiguousSourceCase!=='JQA3-02'||
    n417.unroundedOriginalMoonKnown!==false||
    n418.nativeSwissEphemerisCalls!==6150||
    n418.sourceMoonPrintedPrecisionArcseconds!==0.01||
    n418.calculatedHalfStepSensitivitySeconds!==32.8730724||
    n418.calculatedWholeCellSpanSeconds!==63.7686064453125||
    n418.sourceRoundingCanExplainDisagreement!==true||
    n418.sourceRoundingProvenActualCause!==false||
    n418.actualJHoraYearOptionMapped!==false||
    n418.verifiedOriginalSubdayTransition!==false)
  fail('calendar research evidence or source precision claim');
 if(ledger.symbolic?.methodScopedPyJhora8000Matches!==8000||
    ledger.symbolic?.methodScopedOriginalJhora8000Matches!==8000||
    ledger.symbolic?.sourceGitBlob!=='3a4f2dec84a0ed13cb692f52a76612e0de1306e6'||
    ledger.symbolic?.methodPairEquivalence!==false)
  fail('method-scoped symbolic evidence');
 if(ledger.actualProduction?.ayanamsa!=='Lahiri'||
    ledger.actualProduction?.d2Method!=='Sun/Moon Hora'||
    ledger.actualProduction?.dashaYearDays!==365.2425||
    ledger.actualProduction?.fullPhysicalProfileParityCertified!==false)
  fail('production method drift or unapproved dasha mode switch');
 requireFalse(ledger.release,[
  'historicalLegalLocalTimeCertified','continuousD60Certified',
  'originalJhoraYearMenuCodeCertified','currentHeadFullCIGreenAttested',
  'manualOwnerApprovalRecorded','productionN4FeatureFlagsAllowed',
  'productionN4ReleasePermitted'
 ],'final ledger');
 if(scoped?.status!=='N4_SYMBOLIC_RULES_SCOPED_EXTERNAL_EVIDENCE_VALIDATED'||
    scoped.productionSunMoonVargaRulesAtPinnedBlob!==true||
    scoped.independentPyjhora8000ComparisonEvidence!==true||
    scoped.originalJHoraUmaShambhu8000ComparisonEvidence!==true||
    scoped.sourceMethodsDiffer!==true||scoped.productionReleasePermitted!==false)
  fail('actual symbolic ledger not verified');
 if(readiness?.status!=='N4_NATAL_MATH_INTEGRATION_BLOCKED'||
    readiness?.actualCalculator?.ayanamsa!=='Lahiri'||
    readiness.actualCalculator.d2Method!=='Sun/Moon Hora'||
    readiness.actualCalculator.vimshottariConstantYearDays!==365.2425||
    readiness.productionReleasePermitted!==false||
    readiness.calculatorUiRedesignAuthorizedByMath!==false||
    !Array.isArray(readiness.releaseBlockers)||
    !readiness.releaseBlockers.includes('PRODUCTION_LAHIRI_PHYSICAL_EPHEMERIS_NEEDS_INDEPENDENT_SAME_PROFILE_CLOSURE')||
    !readiness.releaseBlockers.includes('VIMSHOTTARI_JHORA_YEAR_DEFINITION_AND_DATE_NOT_CERTIFIED')||
    !readiness.releaseBlockers.includes('D60_CONTINUOUS_TIME_ENCLOSURES_NOT_CERTIFIED'))
  fail('live calculator/readiness gates mismatch');
 return Object.freeze({
  version:N4_FINAL_VERSION,
  status:'N4_RESEARCH_CYCLE_CLOSED_SCOPED_PRODUCTION_NOT_CERTIFIED',
  evidenceSnapshot:'OWNER_SUPPLIED_SHA256_PINNED_AGGREGATES_NOT_RAW_JHORA_REPLAY',
  mathematicalScopes:Object.freeze({
   shodashavargaSymbolicRules:'METHOD_SCOPED_8000_OF_8000_PER_INDEPENDENT_PROFILE',
   trueCitraOriginalJhoraNative:'50_CASES_8000_OF_8000_RESEARCH_ONLY',
   trueSiderealSolarYearCalendar:'1619_OF_1620_PRINTED_DATES_ONE_PRINT_PRECISION_AMBIGUITY',
   originalPrintedMoonResolution:'0.01_ARCSEC_INTERVAL_STRADDLES_MIDNIGHT',
   historicalLegalTime:'NOT_CERTIFIED_REQUIRE_PROVENANCE_PER_ACTUAL_BIRTH',
   d60ContinuousStability:'NOT_CERTIFIED_HIDE_UNQUALIFIED_CLAIMS',
   productionLahiriSameMethodPhysical:'NOT_CERTIFIED',
   originalJhoraSubdayYearMode:'NOT_CERTIFIED'
  }),
  researchCycleClosed:true,
  noFurtherOneDayFittingRequired:true,
  existingProductionVimshottariYearDays:365.2425,
  experimentalTrueSolarYearEnabledInProduction:false,
  remainingProductionGates:Object.freeze([...readiness.releaseBlockers]),
  productionN4MathCertified:false,
  fullCurrentHeadCIPassAttested:false,
  publicSixteenChartDisplayAuthorized:false,
  n4EnhancedAiAuthorized:false,
  productionN4ReleasePermitted:false,
  recommendation:'Close N4 math research evidence now. Keep N4 feature flags OFF. A separate owner-authorized release needs same-profile production Lahiri proof, exact year mode/subday evidence, historical UTC provenance or per-user uncertainty restrictions, safe D60, CI and editorial QA.'
 });
}
export function runN4FinalDecision(){
 const ledger=JSON.parse(readFileSync(new URL('./n4-final-evidence-ledger.json',import.meta.url),'utf8'));
 return auditN4FinalDecision({ledger,scoped:auditN4ScopedEvidence(),readiness:reviewN4MathReadiness()});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{console.log(JSON.stringify(runN4FinalDecision(),null,2))}
 catch(error){console.error(error.message);process.exitCode=2}
}
