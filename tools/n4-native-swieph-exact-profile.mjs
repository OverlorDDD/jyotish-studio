#!/usr/bin/env node
/**
 * N4.13: SEPARATE research-only JHora8 True-Citra geometric profile.
 * Uses the SAME native @swisseph/node dependency as the API, but NEVER
 * mutates apps/api/src/ephemeris.ts, existing JQA3 Lahiri profile, or site flags.
 *
 * smoke: actual SWIEPH native file/flag readiness; NOT 50-case certification.
 * reference: private genuine JHora8 50-case sanitized original-source dataset.
 * The dataset must remain private; never copy it into the public repository.
 */
import {readFileSync,existsSync,statSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {SHODASHAVARGA,vargaSign} from '../packages/jyotish-core/src/vargas.ts';
import {n4UmaShambhuHoraSign} from '../packages/jyotish-core/src/hora-uma-shambhu.ts';
import {n4SyntheticJHoraCase} from './n4-jhora8-windows-prepare.mjs';
import {auditN4JHora50MethodAwareReference} from './n4-original-jhora50-reference-gate.mjs';

export const N413_PROFILE='n4.13-separate-original-jhora8-true-citra-geometric-swieph-v1';
export const N413_THRESHOLDS_ARCSEC=Object.freeze({Ascendant:0.50,Sun:0.50,Moon:3.0,
 Mars:2.0,Mercury:2.0,Jupiter:2.0,Venus:2.0,Saturn:2.0,Rahu:0.50,Ketu:0.50,
 Ayanamsa:0.50});
const names=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const fail=m=>{throw Error('N413_SWIEPH_BLOCKED: '+m)};
const mod=(x,n)=>((x%n)+n)%n;
const delta=(x,y)=>((x-y+540)%360-180)*3600;
const assert=(v,m)=>{if(!v)fail(m)};
const SWIEPH=2;
const mask=7;
function strictBackend(p,name){
 assert(Number.isFinite(p?.longitude)&&Number.isFinite(p?.longitudeSpeed),name+' invalid longitude or speed');
 assert(Number.isInteger(p?.flags)&&(p.flags&mask)===SWIEPH,
  name+' returned backend '+String(p?.flags)+'; demanded SWIEPH=2, never MOSEPH=4');
}
export function checkedJhoraSyntheticCivilTime(record,index){
 const synthetic=n4SyntheticJHoraCase(index);
 assert(record?.id===synthetic.id,'unexpected source case ID '+record?.id);
 const local=new Date(synthetic.date+'T'+synthetic.time+':00.000Z').getTime();
 const birth=new Date(record.birthUtc).getTime();
 assert(Number.isFinite(local)&&Number.isFinite(birth)&&birth===local-synthetic.timezoneHours*3600000,
  synthetic.id+' original UTC differs from pinned synthetic local time/timezone');
 return {...synthetic,birthUtc:new Date(birth).toISOString()};
}
function normalizedSidereal(sw,jd,lat,lon){
 assert(sw?.SiderealMode?.TrueCitra===27,'@swisseph/node TrueCitra enum is not 27');
 const f=sw.CalculationFlag;
 assert(f?.SwissEphemeris===2&&f.TruePositions===16&&f.NoNutation===64&&f.Sidereal===65536,
  'native Swiss flag constants differ from verified upstream API');
 assert(sw.LunarPoint?.MeanNode===10,'native mean lunar node enum differs');
 sw.setSiderealMode(sw.SiderealMode.TrueCitra);
 const planetFlags=f.SwissEphemeris|f.Speed|f.Sidereal|f.TruePositions;
 // This special fixed-star True Citra ayanamsha is explicitly evaluated
 // with TRUEPOS + NONUT for the tropical ASC-to-sidereal Lagna transformation.
 // Do NOT call sidereal-house helpers or mix this with historical JQA3 Lahiri.
 const ayanamsa=sw.getAyanamsaExUt(jd,f.SwissEphemeris|f.TruePositions|f.NoNutation);
 assert(Number.isFinite(ayanamsa)&&ayanamsa>10&&ayanamsa<35,'non-numeric TrueCitra ayanamsha');
 const houses=sw.calculateHouses(jd,lat,lon,sw.HouseSystem.Placidus);
 assert(Number.isFinite(houses?.ascendant),'native Swiss tropical ascendant missing');
 const natalLongitudes={Ascendant:mod(houses.ascendant-ayanamsa,360)};
 for(const [name,body] of [
  ['Sun',sw.Planet.Sun],['Moon',sw.Planet.Moon],['Mars',sw.Planet.Mars],
  ['Mercury',sw.Planet.Mercury],['Jupiter',sw.Planet.Jupiter],
  ['Venus',sw.Planet.Venus],['Saturn',sw.Planet.Saturn],
  ['Rahu',sw.LunarPoint.MeanNode]
 ]){
  const p=sw.calculatePosition(jd,body,planetFlags);
  strictBackend(p,name);
  natalLongitudes[name]=mod(p.longitude,360);
 }
 natalLongitudes.Ketu=mod(natalLongitudes.Rahu+180,360);
 return {ayanamsa,natalLongitudes,backend:'returned-SWIEPH-2-on-eight-body-calculations',
  ayanamshaBackendCaveat:'getAyanamsaExUt native wrapper returns a number, not its internal return flags'};
}
export function nativeN413Case(sw,source,index){
 const c=checkedJhoraSyntheticCivilTime(source,index);
 const d=new Date(c.birthUtc),hour=d.getUTCHours()+d.getUTCMinutes()/60+d.getUTCSeconds()/3600;
 const jd=sw.julianDay(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),hour);
 assert(Number.isFinite(jd)&&jd>2000000,'invalid Swiss UT julian day');
 const result=normalizedSidereal(sw,jd,c.latitude,c.longitude);
 return {id:c.id,utc:c.birthUtc,latitude:c.latitude,longitude:c.longitude,
  julianDayUt:jd,...result};
}
export function compareN413AgainstSource(source,calculated){
 assert(Array.isArray(source?.cases)&&source.cases.length===50&&calculated?.length===50,
  'require 50 original GUI sources and 50 real SWIEPH calculations');
 const byBody={},byDivision={},exceptions=[],mostSevere=[];
 let matched=0,checked=0,angularViolations=0;
 for(const name of [...names,'Ayanamsa'])byBody[name]={maxAbsArcsec:0,failures:0,failCase:null};
 for(const d of SHODASHAVARGA)byDivision['D'+d]={matched:0,mismatched:0};
 for(let i=0;i<50;i++){
  const ref=source.cases[i],cal=calculated[i];
  assert(ref.id===cal.id,'SWIEPH order/source case mismatch #'+(i+1));
  const positions={...cal.natalLongitudes,Ayanamsa:cal.ayanamsa};
  const expected={...ref.natalLongitudes,Ayanamsa:ref.originalAyanamsaDegrees};
  for(const name of Object.keys(positions)){
   const abs=Math.abs(delta(positions[name],expected[name])),rec=byBody[name];
   if(abs>rec.maxAbsArcsec){rec.maxAbsArcsec=abs;rec.failCase=ref.id;}
   if(abs>N413_THRESHOLDS_ARCSEC[name]){rec.failures++;angularViolations++;
    if(exceptions.length<30)exceptions.push({case:ref.id,body:name,errorArcsec:+abs.toFixed(5),
     thresholdArcsec:N413_THRESHOLDS_ARCSEC[name]});}
  }
  for(const d of SHODASHAVARGA){
   for(const name of names){
    const actual=(d===2?n4UmaShambhuHoraSign(cal.natalLongitudes[name]):
     vargaSign(cal.natalLongitudes[name],d))+1;
    const exp=ref.expectedSigns['D'+d][name],row=byDivision['D'+d];
    if(actual===exp){matched++;row.matched++;}
    else{row.mismatched++;
     if(exceptions.length<30)exceptions.push({case:ref.id,division:d,body:name,expectedSign:exp,actualSign:actual});}
    checked++;
   }
  }
 }
 const status=checked===8000&&matched===8000&&angularViolations===0?
  'N413_NATIVE_SWIEPH_PRIVATE_50_CASE_DIAGNOSTIC_PASS':
  'N413_NATIVE_SWIEPH_PRIVATE_50_CASE_DIAGNOSTIC_FAIL';
 return {status,profile:N413_PROFILE,originalCases:50,checkedVargaSigns:checked,
  matchingVargaSigns:matched,signMismatches:checked-matched,angularViolations,
  thresholdsArcsec:N413_THRESHOLDS_ARCSEC,byBody,byDivision,first30Exceptions:exceptions,
  originalJHoraMathAlignmentOnly:true,existingProductionProfileUnchanged:true,
  productionReleasePermitted:false,independentD60TimeAccuracyCertified:false,
  originalAyanamsaReturnFlagsNotExposedByNativeWrapper:true};
}
function configuredEpheDir(override){
 const root=override?resolve(override):resolve(process.cwd(),'node_modules/@swisseph/node/ephemeris');
 const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
 const hashes={};
 for(const file of ['sepl_18.se1','semo_18.se1']){
  const full=join(root,file);
  assert(existsSync(full)&&statSync(full).size>100000,'ephemeris file missing/suspicious: '+full);
  hashes[file]={sha256:sha(full),bytes:statSync(full).size};
 }
 return {path:root,hashes};
}
async function nativeLibrary(){
 const sw=await import('@swisseph/node');
 for(const fn of ['setSiderealMode','calculatePosition','calculateHouses','julianDay','getAyanamsaExUt','setEphemerisPath'])
  assert(typeof sw[fn]==='function','@swisseph/node missing method '+fn);
 return sw;
}
export async function runN413(options){
 const ephe=configuredEpheDir(options?.epheDir);
 const sw=await nativeLibrary();
 sw.setEphemerisPath(ephe.path);
 const c=n4SyntheticJHoraCase(0),stamp=new Date(c.date+'T'+c.time+':00Z').getTime()-
  c.timezoneHours*3600000;
 const smoke=nativeN413Case(sw,{id:c.id,birthUtc:new Date(stamp).toISOString()},0);
 assert(Object.keys(smoke.natalLongitudes).length===10,'native SWIEPH missing a body');
 const header={profile:N413_PROFILE,ephemerisFiles:ephe.hashes,nativePackage:'@swisseph/node',
  nativeSmoke:{sourceCase:c.id,checkedBodies:10,backend:smoke.backend,
   ayanamsa:smoke.ayanamsa,originalReferenceCompared:false}};
 if(!options.reference)return {status:'N413_NATIVE_SWIEPH_FILE_AND_RETURNED_FLAGS_SMOKE_PASS',
  ...header,full50CaseOriginalEvidenceAvailable:false,productionReleasePermitted:false};
 const input=JSON.parse(readFileSync(resolve(options.reference),'utf8'));
 auditN4JHora50MethodAwareReference(input); // 50 genuine source-derived positions, all source formulas
 const records=input.cases.map((r,i)=>nativeN413Case(sw,r,i));
 return {...header,...compareN413AgainstSource(input,records)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const args=process.argv.slice(2),arg=k=>{const p=args.indexOf(k);return p<0?null:args[p+1]};
  assert(args.includes('--smoke')!==!!arg('--reference'),
   'use exactly one of --smoke or --reference PRIVATE_REFERENCE.json');
  if(args.includes('--reference')&&!arg('--reference'))fail('reference file missing');
  const out=await runN413({reference:arg('--reference'),epheDir:arg('--ephe')});
  const formatted=JSON.stringify(out,null,2)+'\n';
  if(arg('--output')){const path=resolve(arg('--output'));mkdirSync(dirname(path),{recursive:true});
   writeFileSync(path,formatted,{flag:'wx',mode:0o600});}
  console.log(formatted);
  if(out.status==='N413_NATIVE_SWIEPH_PRIVATE_50_CASE_DIAGNOSTIC_FAIL')process.exitCode=2;
 }catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=2;}
}
