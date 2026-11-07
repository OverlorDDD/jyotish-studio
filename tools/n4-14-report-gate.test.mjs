import test from 'node:test';
import assert from 'node:assert/strict';
import {auditN414AggregateEvidence} from './n4-14-report-gate.mjs';
const full={
 status:'N414_PRIVATE_NATIVE_SWIEPH_50_CASE_GRID_DIAGNOSTIC_PASS',
 sampleResolutionSeconds:1,originalSyntheticCases:50,sampledUtcInstants:30050,positionsPerSample:10,
 sourceReferenceSha256:'5dcb07d6d71f68199af97696e8ad3ca91493b30f4abc41fdd51350c14e4ff992',
 exactProfile:'n4.13-separate-original-jhora8-true-citra-geometric-swieph-v1',
 ephemerisFiles:{
 'sepl_18.se1':{sha256:'0b7e416e3c1be9e6a0dd1d711dae7f7685793a0e7df13f76363a493dc27b6ea1'},
 'semo_18.se1':{sha256:'ecfa54dbf5bc0b5a9bc3e04ed28629a821e98625eacae38f4070593bba0e2980'}},
 returnedSwissEphemerisFlagsCheckedOnEightBodies:true,sourceCivilTimeIsFixedOffsetOnly:true,
 sourceHistoricalIanaZoneNamesAvailable:false,nativeHouseAndAyanamsaFlagsIndependentlyExposed:false,
 continuousD60IntervalCertified:false,historicalLocalTimeCertified:false,
 productionReleasePermitted:false,fullN414CertificateIssued:false,
 byRadius:[15,30,60,120,300].map((radiusSeconds,i)=>({
  radiusSeconds,originalSyntheticCases:50,observedCasesWithAscendantSignChange:[11,25,46,50,50][i],
  observedCasesWithAnyBodySignChange:[11,25,46,50,50][i],sampledBodyChangeCount:[11,25,47,51,58][i],
  observedAdjacentSecondCrossingBrackets:[11,25,49,102,253][i],
  exactContinuousSignStabilityCertified:false
 }))
};
test('original sample aggregate is consistent and no N4 release is permitted',()=>{
 const r=auditN414AggregateEvidence(full);
 assert.equal(r.status,'N414_AGGREGATE_EVIDENCE_INTEGRITY_PASS');
 assert.equal(r.totalSampledPoints,300500);
 assert.equal(r.observed[2].observedPercent,92);
 assert.equal(r.productionReleasePermitted,false);
});
test('rejects counterfeit production certification',()=>{
 assert.throws(()=>auditN414AggregateEvidence({...full,productionReleasePermitted:true}),/unverified claim/);
});
test('rejects undercounted source cases or swapped radius order',()=>{
 assert.throws(()=>auditN414AggregateEvidence({...full,originalSyntheticCases:49}),/source\/profile/);
 assert.throws(()=>auditN414AggregateEvidence({...full,byRadius:[...full.byRadius].reverse()}),/radius identity/);
});
test('rejects fabricated SHA, SWIEPH files and inconsistent crossings',()=>{
 assert.throws(()=>auditN414AggregateEvidence({...full,sourceReferenceSha256:'0'.repeat(64)}),/source\/profile/);
 assert.throws(()=>auditN414AggregateEvidence({...full,ephemerisFiles:{}}),/wrong SWIEPH/);
 const rows=full.byRadius.map(x=>({...x}));
 rows[0].observedCasesWithAnyBodySignChange=1;
 assert.throws(()=>auditN414AggregateEvidence({...full,byRadius:rows}),/inconsistent/);
});
