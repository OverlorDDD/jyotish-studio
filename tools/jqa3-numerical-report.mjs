/** A9.0 explicit JHora numerical evidence report. Never manufactures references,
 * hides mismatches or marks independent parity as certified without required proof.
 * Usage: npm run jqa3:diagnose > /tmp/jqa3-report.json
 */
import {auditCorpus} from './jqa3-corpus.mjs';
const audit=auditCorpus({verifyAstronomy:true});
const metrics=['D1','D9','D10','longitude','dasha','nakshatra','pada','retrograde','houseLords'];
const cases=audit.results.map(({id,profileStatus,astronomicalProfileStatus,evidenceStatus,result})=>{
 const checks=Object.fromEntries(metrics.map(k=>[k,result?.[k]??{status:'UNVERIFIED'}]));
 const worst=(result?.details||[]).slice().sort((a,b)=>Math.abs(b.arcseconds)-Math.abs(a.arcseconds))[0];
 const failing=metrics.filter(k=>checks[k].status!=='PASS');
 return {id,profileStatus,astronomicalProfileStatus,evidenceStatus,
  checks:Object.fromEntries(metrics.map(k=>[k,{
   status:checks[k].status,matches:checks[k].matches??null,total:checks[k].total??null,
   antardashaMatches:checks[k].antardashaMatches??null,antardashaTotal:checks[k].antardashaTotal??null
  }])),
  worstLongitude:worst?{body:worst.body,deltaArcsec:worst.arcseconds}:null,
  failing
 };
});
const proof={
 stage:'JQA-3.3',numericStatus:audit.status,
 originalSources:cases.length,
 originalIniCount:cases.filter(c=>c.evidenceStatus==='CAPTURE_EVIDENCE_PRESENT').length,
 fullyComparableIniCount:cases.filter(c=>c.profileStatus==='EXPLICIT_MATCH').length,
 astronomyIniMatchedCount:cases.filter(c=>c.astronomicalProfileStatus==='EXPLICIT_ASTRONOMY_INI').length,
 coveredLagnaSigns:audit.distinctLagnaSigns,
 required:audit.required,
 blockers:audit.blockingConditions,
 checks:metrics.map(k=>({metric:k,
  passed:cases.filter(c=>c.checks[k].status==='PASS').length,
  unverified:cases.filter(c=>c.checks[k].status==='UNVERIFIED').length,
  configOrFail:cases.filter(c=>!['PASS','UNVERIFIED'].includes(c.checks[k].status)).length
 })),
 cases
};
console.log(JSON.stringify(proof,null,2));
if(audit.independentJHoraCharts<20||audit.distinctLagnaSigns!==12)
 process.exitCode=2;
