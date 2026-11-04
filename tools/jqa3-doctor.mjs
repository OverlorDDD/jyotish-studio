/** JQA-3.5 failure-forensic runner: never changes independent raw evidence.
 * A successful diagnostic run is NOT a positive precision/date certificate.
 */
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {auditCorpus} from './jqa3-corpus.mjs';
const python=process.env.PYTHON_BIN||(process.platform==='win32'?'python':'python3');
const pythonArgs=python==='py'?['-3']:[];
function invoke(command,args){
 const run=spawnSync(command,args,{cwd:resolve('.'),encoding:'utf8',timeout:120000,maxBuffer:10*1024*1024});
 if(run.status!==0)throw Error('Diagnostic failed: '+(run.stderr||run.error?.message||run.stdout).slice(0,3000));
 return JSON.parse(run.stdout);
}
const audit=auditCorpus();
assert.equal(audit.explicitlyMatchedCharts,20,'original attested JHora cohort changed');
const precision=invoke(python,[...pythonArgs,'tools/jqa3-precision-doctor.py']);
assert.equal(precision.rows.length,20);
assert.equal(precision.ascendantCandidates.production_tropical_asc_minus_mean_lahiri.passing,
 audit.bodyPrecision.Lagna.passing,'independent diagnostic ascendant must agree with certifier');
assert.equal(precision.moonCandidates.production_geocentric_apparent_sidereal.passing,
 audit.bodyPrecision.Moon.passing,'independent diagnostic Moon must agree with certifier');
const dasha=invoke(process.execPath,['--experimental-strip-types','tools/jqa3-dasha-year-diagnostic.mjs']);
assert.equal(dasha.sourceRecordCount,20);
assert.equal(dasha.status,'DIAGNOSTIC_ONLY_NO_JHORA_YEAR_OPTION_MAPPING');
const noProof=dasha.candidates.every(x=>x.status!=='CERTIFIED');
assert.ok(noProof,'candidate scan cannot self-certify a selected JHora year mode');
const blockers={
 lagna:precision.ascendantCandidates.production_tropical_asc_minus_mean_lahiri.failingCases,
 moon:precision.moonCandidates.production_geocentric_apparent_sidereal.failingCases,
 jhoraDashaYearDefinition:dasha.jhoraRecordedYearDefinitionCode,
 jhoraDashaYearDefinitionMapping:'UNVERIFIED_EXTERNAL_JHORA_OPTION',
 jhoraDashaCalendarData:'ORIGINAL_YYYY_MM_DD_ONLY_NO_BOUNDARY_INSTANTS',
 requestedExternalProof:[
  'Original JHora 8.0 swedll32.dll hash/version and controlled raw Lagna/Moon run for cases 12/03/04',
  'JHora GUI/help mapping of YearDefinition=3 and independent source export with exact local/UTC transition instants'
 ]
};
const summary={
 stage:'JQA-3.5',status:audit.status,signParityCertified:audit.signParityCertified,
 precisionCertified:audit.precisionCertified,fullCertificateIssued:audit.status==='CERTIFIED',
 lagna:{passing:audit.bodyPrecision.Lagna.passing,total:20,maxAbsArcseconds:audit.bodyPrecision.Lagna.maxAbsArcseconds},
 moon:{passing:audit.bodyPrecision.Moon.passing,total:20,maxAbsArcseconds:audit.bodyPrecision.Moon.maxAbsArcseconds},
 candidateAscendantMethods:precision.ascendantCandidates,
 candidateMoonMethods:precision.moonCandidates,
 backendFallbackCases:precision.fallbackCases,
 vimshottari:{sequenceCertified:audit.dashaSequenceCertified,calendarCertified:
  audit.results.filter(x=>x.profileStatus==='EXPLICIT_MATCH').every(x=>x.result?.dasha?.status==='PASS'),
  comparisonCandidates:dasha.candidates,
  independentYearOptionProof:'MISSING'},
 blockingConditions:audit.blockingConditions,blockers,
 methodology:'All source JHora fixtures are read-only and SHA-pinned; candidate modes are diagnostics only.'
};
if(process.argv.includes('--json'))console.log(JSON.stringify(summary,null,2));
else{
 console.log('JQA-3.5 diagnostic (not certification): '+summary.status);
 console.log('Lagna: '+summary.lagna.passing+'/20; Moon: '+summary.moon.passing+'/20; Vimshottari date mode: UNATTESTED');
 console.log('Lagna misses: '+JSON.stringify(blockers.lagna));
 console.log('Moon misses: '+JSON.stringify(blockers.moon));
 console.log('Candidate year modes: '+dasha.candidates.length+' (none self-certifying)');
 console.log('Run npm run jqa3:doctor:json for machine-readable evidence.');
}
