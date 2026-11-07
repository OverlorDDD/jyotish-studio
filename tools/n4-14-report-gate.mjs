/**
 * N4.14 source-bound aggregate evidence gate: verifies research provenance,
 * counts and fail-closed claims. Never approves production or historical time.
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const expectedHash='5dcb07d6d71f68199af97696e8ad3ca91493b30f4abc41fdd51350c14e4ff992';
const expectedFiles={
 'sepl_18.se1':'0b7e416e3c1be9e6a0dd1d711dae7f7685793a0e7df13f76363a493dc27b6ea1',
 'semo_18.se1':'ecfa54dbf5bc0b5a9bc3e04ed28629a821e98625eacae38f4070593bba0e2980'
};
const radii=[15,30,60,120,300];
const fail=m=>{throw Error('N414_AGGREGATE_GATE_BLOCKED: '+m)};
export function auditN414AggregateEvidence(r){
 if(r?.status!=='N414_PRIVATE_NATIVE_SWIEPH_50_CASE_GRID_DIAGNOSTIC_PASS'||
  r.sampleResolutionSeconds!==1||r.originalSyntheticCases!==50||
  r.sampledUtcInstants!==30050||r.positionsPerSample!==10||
  r.sourceReferenceSha256!==expectedHash||
  r.exactProfile!=='n4.13-separate-original-jhora8-true-citra-geometric-swieph-v1')
  fail('source/profile/sampling mismatch');
 for(const [name,sha] of Object.entries(expectedFiles))
  if(r.ephemerisFiles?.[name]?.sha256!==sha)fail('wrong SWIEPH dataset '+name);
 if(r.returnedSwissEphemerisFlagsCheckedOnEightBodies!==true||
  r.sourceCivilTimeIsFixedOffsetOnly!==true||
  r.sourceHistoricalIanaZoneNamesAvailable!==false||
  r.nativeHouseAndAyanamsaFlagsIndependentlyExposed!==false||
  r.continuousD60IntervalCertified!==false||
  r.historicalLocalTimeCertified!==false||
  r.productionReleasePermitted!==false||r.fullN414CertificateIssued!==false)
  fail('unverified claim or missing fail-closed flag');
 if(!Array.isArray(r.byRadius)||r.byRadius.length!==radii.length)
  fail('radius count');
 let prevCount=0,prevBrackets=0;
 const summary=r.byRadius.map((x,i)=>{
  if(x.radiusSeconds!==radii[i]||x.originalSyntheticCases!==50||
   x.exactContinuousSignStabilityCertified!==false)fail('radius identity/claim');
  const ints=['observedCasesWithAscendantSignChange','observedCasesWithAnyBodySignChange',
   'sampledBodyChangeCount','observedAdjacentSecondCrossingBrackets'];
  if(ints.some(key=>!Number.isInteger(x[key])||x[key]<0))fail('missing sample counts');
  if(x.observedCasesWithAscendantSignChange>50||
   x.observedCasesWithAscendantSignChange>x.observedCasesWithAnyBodySignChange||
   x.observedCasesWithAnyBodySignChange>50||
   x.sampledBodyChangeCount<x.observedCasesWithAnyBodySignChange||
   x.observedAdjacentSecondCrossingBrackets<x.observedCasesWithAnyBodySignChange||
   x.observedCasesWithAscendantSignChange<prevCount||
   x.observedAdjacentSecondCrossingBrackets<prevBrackets)
   fail('inconsistent or nonmonotone observations');
  prevCount=x.observedCasesWithAscendantSignChange;
  prevBrackets=x.observedAdjacentSecondCrossingBrackets;
  return {radiusSeconds:x.radiusSeconds,ascendantChanged:x.observedCasesWithAscendantSignChange,
   count:50,observedPercent:2*x.observedCasesWithAscendantSignChange,
   observedSecondBrackets:x.observedAdjacentSecondCrossingBrackets};
 });
 return Object.freeze({
  status:'N414_AGGREGATE_EVIDENCE_INTEGRITY_PASS',
  sourceCaseCount:50,totalSampledPoints:30050*10,
  observed:summary,sourceIsSynthetic:true,
  historicalIanaCertified:false,continuousD60Certified:false,
  statisticalPopulationInferencePermitted:false,productionReleasePermitted:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  if(process.argv.length!==3)fail('usage: node tools/n4-14-report-gate.mjs PRIVATE_AGGREGATE.json');
  console.log(JSON.stringify(auditN414AggregateEvidence(JSON.parse(readFileSync(resolve(process.argv[2]),'utf8'))),null,2));
 }catch(e){console.error(e.message);process.exitCode=2;}
}
