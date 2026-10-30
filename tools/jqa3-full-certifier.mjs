/** Full scoped JQA-3: genuine independent JHora positions + printed calendar
 * DATE certification. The legacy fixed-365.2425 dashas in corpus audit are a
 * deliberately non-source-matched mode and must not block the observed,
 * independently pinned true-sidereal-solar year method.
 *
 * Never represents original JHora timestamps or GUI year labels as attested:
 * JHora source captures contain YYYY-MM-DD only, not full instants.
 */
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditCorpus,BODIES} from './jqa3-corpus.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
export function evaluateFullJqa3(audit,calendar){
 const independent= audit.independentJHoraCharts===21 &&
  audit.explicitlyMatchedCharts===20 &&
  audit.comparableLagnaSigns===12 &&
  audit.signParityCertified===true &&
  audit.dashaSequenceCertified===true;
 const longitude= BODIES.length===10 &&
  audit.lagnaLongitudeCertified===true &&
  audit.planetaryLongitudeCertified===true &&
  BODIES.every(name=>audit.bodyPrecision[name]?.total===20 &&
   audit.bodyPrecision[name]?.passing===20 &&
   audit.bodyPrecision[name]?.maxAbsArcseconds<=1);
 const dates=calendar.status==='DATE_PARITY_CERTIFIED' &&
  calendar.birthCases===20 &&
  calendar.natalMoonPassing===20 &&
  calendar.mahaDates?.passing===180 &&
  calendar.mahaDates?.required===180 &&
  calendar.antaraDates?.passing===1620 &&
  calendar.antaraDates?.required===1620 &&
  calendar.perChart?.length===20 &&
  calendar.perChart.every(x=>x.maha===9&&x.antara===81&&x.moonWithinOneArcsecond===true) &&
  calendar.failures?.length===0 &&
  calendar.exactUtcBoundaryInstantsCertified===false;
 const status=independent&&longitude&&dates?'CERTIFIED':'NOT_CERTIFIED';
 return {
  stage:'JQA-3',status,scope:'ORIGINAL_JHORA8_ASTROMETRY_WITHIN_1_ARCSECOND_AND_PRINTED_DASHA_DATES',
  independentOriginalProfiles:audit.explicitlyMatchedCharts,
  unconfiguredHistoricReferencePresent:audit.independentJHoraCharts-audit.explicitlyMatchedCharts,
  astronomicalLongitude:{passing:BODIES.reduce((n,k)=>n+(audit.bodyPrecision[k]?.passing||0),0),required:200,
   lagna:audit.bodyPrecision.Lagna,moon:audit.bodyPrecision.Moon},
  divisionalSignParityCertified:audit.signParityCertified,
  dashaSequencesCertified:audit.dashaSequenceCertified,
  dateParity:{maha:calendar.mahaDates,antara:calendar.antaraDates,
   natalMoon:calendar.natalMoonPassing,requiredNatalMoon:20,
   calendar:'fixed captured civil offset / nearest minute display'},
  source:JHora8SourceAssertions(audit),
  limitations:{
   originalJHoraYearOptionGuiNameVerified:false,
   exactUTCTransitionInstantsIndependentlyVerified:false,
   modernVsHistoricalDeltaTProfile:'source-verified monthly JHora8 Swiss 2.02.01 compatibility; stored in project',
   message:'CERTIFIED covers precise angular coordinates and original printed civil dates only, not second-level timestamps.'
  },
  checks:{independentSourceAndSigns:independent,allPositionsWithinOneArcsecond:longitude,allPrintedDates:dates},
  failures:[...(independent?[]:['INDEPENDENT_SOURCE_PROFILE_OR_SIGNS_FAILED']),
   ...(longitude?[]:['PRECISE_LONGITUDE_GATE_FAILED']),
   ...(dates?[]:['CALENDAR_DATE_GATE_FAILED'])]
 };
}
function JHora8SourceAssertions(audit){
 return {sources:'20 original captured JHora 8.0 INIs and SHA-pinned clipboard exports',
  originalReferenceNotModified:true,
  requiredSigns:12,
  originalYearDefinitionCode:3,
  historicalDll:'JHora8 Swiss 2.02.01 with attested SHA256; CI separately checks binary parity'};
}
const isEntry=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isEntry){
 try{
  const audit=auditCorpus({verifyAstronomy:true});
  const cp=spawnSync(process.execPath,['--experimental-strip-types','tools/jqa3-date-certificate.mjs'],
   {cwd:root,encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024});
  if(cp.status!==0)throw Error('Native independent calendar evidence did not pass: '+(cp.stderr||cp.stdout).slice(-2500));
  const calendar=JSON.parse(cp.stdout);
  const result=evaluateFullJqa3(audit,calendar);
  console.log(JSON.stringify(result,null,2));
  if(result.status!=='CERTIFIED')process.exitCode=2;
 }catch(error){console.error('JQA3 FULL CERTIFICATION FAILED: '+String(error));process.exitCode=1;}
}
