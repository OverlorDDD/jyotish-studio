#!/usr/bin/env node
/**
 * N4.14: PRIVATE 50-case native Swiss one-second sensitivity audit.
 * Source cases are 50 synthetic original JHora captures; source input and
 * raw positions remain local and private. This is a DIAGNOSTIC, not a
 * mathematically complete D60 interval/timezone certificate.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {auditN4JHora50MethodAwareReference} from './n4-original-jhora50-reference-gate.mjs';
import {checkedJhoraSyntheticCivilTime,createN414NativeResearchSampler} from './n4-native-swieph-exact-profile.mjs';
import {n4SyntheticJHoraCase} from './n4-jhora8-windows-prepare.mjs';
import {auditN414UtcSensitivity,N414_RADII_SECONDS} from './n4-14-sensitivity.mjs';

const PINNED_SOURCE_SHA='5dcb07d6d71f68199af97696e8ad3ca91493b30f4abc41fdd51350c14e4ff992';
const FILE_HASHES={
 'sepl_18.se1':'0b7e416e3c1be9e6a0dd1d711dae7f7685793a0e7df13f76363a493dc27b6ea1',
 'semo_18.se1':'ecfa54dbf5bc0b5a9bc3e04ed28629a821e98625eacae38f4070593bba0e2980'
};
const fail=message=>{throw Error('N414_PRIVATE_NATIVE_BLOCKED: '+message)};
const sha=b=>createHash('sha256').update(b).digest('hex');
function assertFiles(native){
 for(const [name,expected] of Object.entries(FILE_HASHES))
  if(native.ephemerisFiles?.[name]?.sha256!==expected)
   fail('wrong native ephemeris file hash: '+name);
}
function aggregate(results){
 if(results.length!==50||results.some(r=>r.status!=='N414_SAMPLED_SENSITIVITY_DIAGNOSTIC_ONLY'))
  fail('incomplete private SWIEPH case set');
 const byRadius=N414_RADII_SECONDS.map(radiusSeconds=>{
  const rows=results.map(r=>r.windows.find(w=>w.radiusSeconds===radiusSeconds));
  if(rows.some(r=>!r||r.bodies.length!==10))fail('incomplete D60 window '+radiusSeconds);
  return {
   radiusSeconds,
   originalSyntheticCases:rows.length,
   observedCasesWithAscendantSignChange:rows.filter(w=>w.sampledChangedBodies.includes('Ascendant')).length,
   observedCasesWithAnyBodySignChange:rows.filter(w=>w.sampledChangedBodies.length>0).length,
   sampledBodyChangeCount:rows.reduce((sum,w)=>sum+w.sampledChangedBodies.length,0),
   observedAdjacentSecondCrossingBrackets:rows.reduce((sum,w)=>
    sum+w.bodies.reduce((n,b)=>n+b.observedCrossingBrackets.length,0),0),
   exactContinuousSignStabilityCertified:false
  };
 });
 return {
  status:'N414_PRIVATE_NATIVE_SWIEPH_50_CASE_GRID_DIAGNOSTIC_PASS',
  sampleResolutionSeconds:1,originalSyntheticCases:50,
  sampledUtcInstants:50*(2*Math.max(...N414_RADII_SECONDS)+1),
  positionsPerSample:10,byRadius,
  sourceHistoricalIanaZoneNamesAvailable:false,
  sourceCivilTimeIsFixedOffsetOnly:true,
  returnedSwissEphemerisFlagsCheckedOnEightBodies:true,
  nativeHouseAndAyanamsaFlagsIndependentlyExposed:false,
  continuousD60IntervalCertified:false,
  historicalLocalTimeCertified:false,productionReleasePermitted:false,
  fullN414CertificateIssued:false
 };
}
export async function runN414Private({reference,epheDir,smoke=false}={}){
 const native=await createN414NativeResearchSampler({epheDir});
 assertFiles(native);
 if(smoke){
  if(reference)fail('do not mix private source with smoke');
  const c=n4SyntheticJHoraCase(0);
  const utc=new Date(Date.parse(c.date+'T'+c.time+':00.000Z')-
   c.timezoneHours*3600000).toISOString();
  const positions=native.atUtc({utc,latitude:c.latitude,longitude:c.longitude});
  if(Object.keys(positions).length!==10)fail('missing SWIEPH body');
  return {status:'N414_NATIVE_SWIEPH_ONE_CASE_SMOKE_PASS',
   ephemerisFiles:native.ephemerisFiles,
   full50CaseOriginalEvidenceAvailable:false,fullN414CertificateIssued:false};
 }
 if(typeof reference!=='string'||!reference)fail('private original source JSON required');
 const raw=readFileSync(resolve(reference));
 if(sha(raw)!==PINNED_SOURCE_SHA)fail('50-case original source SHA-256 mismatch');
 const source=JSON.parse(raw.toString('utf8'));
 auditN4JHora50MethodAwareReference(source);
 const results=[];
 for(let i=0;i<50;i++){
  const c=checkedJhoraSyntheticCivilTime(source.cases[i],i);
  const report=await auditN414UtcSensitivity({
   centerUtc:c.birthUtc,
   sampleAtUtc:utc=>native.atUtc({utc,latitude:c.latitude,longitude:c.longitude})
  });
  results.push(report);
  if((i+1)%10===0)console.error('N414_DIAGNOSTIC_CASES='+String(i+1)+'/50');
 }
 return {...aggregate(results),sourceReferenceSha256:PINNED_SOURCE_SHA,
  ephemerisFiles:native.ephemerisFiles,exactProfile:native.profile};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const args=process.argv.slice(2),arg=k=>{
   const idx=args.indexOf(k);return idx<0?null:args[idx+1];
  };
  const smoke=args.includes('--smoke'),reference=arg('--reference'),output=arg('--output');
  if(smoke===Boolean(reference)||(!smoke&&!output))fail(
   'use --smoke OR --reference PRIVATE.json --output PRIVATE_RESULT.json');
  const result=await runN414Private({reference,epheDir:arg('--ephe'),smoke});
  const formatted=JSON.stringify(result,null,2)+'\n';
  if(output){
   const target=resolve(output);
   mkdirSync(dirname(target),{recursive:true});
   writeFileSync(target,formatted,{flag:'wx',mode:0o600});
  }
  console.log(formatted);
 }catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=2;}
}
