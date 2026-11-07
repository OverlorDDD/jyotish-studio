/** Actual production-Lahiri versus pinned original JHora8 GUI.
 * Research diagnostic, NOT a 50-case physical/method certification.
 */
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {loadCorpus,verifyReference} from './jqa3-corpus.mjs';
import {getEphemeris} from '../apps/api/src/ephemeris.ts';
import {vargaSign} from '../packages/jyotish-core/src/vargas.ts';
const names=['Lagna','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const sign=v=>Math.floor(((v%360)+360)%360/30)+1;
const arcsec=(a,b)=>Math.abs((((a-b+540)%360)-180)*3600);
export function scoreN4OriginalLahiri(rows){
 if(!Array.isArray(rows)||rows.length!==20)throw Error('N4_RC_REQUIRE_20_AUTHENTIC_ORIGINALS');
 const signs={D1:0,D9:0,D10:0};let moonMax=0,lagnaMax=0,moonPass=0,lagnaPass=0;
 const signMismatchCases=[];
 for(const r of rows){
  if(!r?.actual||!r.original||typeof r.id!=='string')throw Error('N4_RC_MISSING_SOURCE');
  let misses=0;
  for(const name of names){
   const c=r.actual[name],ref=r.original[name];
   if(!Number.isFinite(c)||!Number.isFinite(ref?.longitude)||
      !Number.isInteger(ref.d1)||!Number.isInteger(ref.d9)||!Number.isInteger(ref.d10_1_9))
    throw Error('N4_RC_ORIGINAL_SOURCE_METHOD_MISMATCH');
   if(sign(c)===ref.d1)signs.D1++;else misses++;
   if(vargaSign(c,9)+1===ref.d9)signs.D9++;else misses++;
   if(vargaSign(c,10)+1===ref.d10_1_9)signs.D10++;else misses++;
  }
  if(misses)signMismatchCases.push(r.id);
  const m=arcsec(r.actual.Moon,r.original.Moon.longitude);
  const a=arcsec(r.actual.Lagna,r.original.Lagna.longitude);
  moonMax=Math.max(moonMax,m);lagnaMax=Math.max(lagnaMax,a);
  if(m<=1)moonPass++;if(a<=1)lagnaPass++;
 }
 return Object.freeze({
  status:'N4_RC_ORIGINAL_LAHIRI_20_SOURCE_DIAGNOSTIC_COMPLETE',
  originalJHoraCases:20,positions:200,signs,
  maxMoonArcseconds:moonMax,maxLagnaArcseconds:lagnaMax,
  moonWithinOneArcsecond:moonPass,lagnaWithinOneArcsecond:lagnaPass,
  signMismatchCases,
  requiredSameProfileOriginalCases:50,
  authenticatedOriginalFull15VargaCases:0,
  sourceProfilesMatchedForD1D9D10Only:true,
  all20MeetSubArcsecond:moonPass===20&&lagnaPass===20,
  original50CaseExternalReleaseGatePassed:false,
  productionN4Approved:false
 });
}
export async function auditN4RcProductionLahiri(){
 const records=loadCorpus().records.filter(r=>r.hasOriginalJHoraIni);
 if(records.length!==20)throw Error('N4_RC_ORIGINAL_JHORA20_CORPUS_MISSING');
 process.env.ALLOW_PYTHON_SWISSEPH='0';
 const rows=[];
 for(const record of records){
  const ref=verifyReference(record),p=ref.independentSource.capture.profile;
  if(p.ayanamsa!=='SWISS_TRADITIONAL_LAHIRI'||p.nodes!=='MEAN'||
     p.positions!=='APPARENT'||p.observer!=='GEOCENTRIC'||
     p.d10!=='1-9'||p.ephemeris!=='SWISS')
   throw Error('N4_RC_ORIGINAL_JHORA_PROFILE_CHANGED');
  const utc=ref.civilTime.birthUtc;
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:00Z$/.test(utc))
   throw Error('N4_RC_ORIGINAL_SOURCE_NON_MINUTE_UTC');
  const eph=await getEphemeris({
   date:utc.slice(0,10),time:utc.slice(11,16),timeZone:'Etc/UTC',
   latitude:ref.civilTime.latitude,longitude:ref.civilTime.longitude
  });
  if(!eph.backend.includes('verified-SWIEPH'))throw Error('N4_RC_NO_VERIFIED_SWIEPH');
  const actual=Object.fromEntries(eph.positions.map(x=>[x.name,x.longitude]));
  actual.Lagna=eph.ascendant;
  rows.push({id:record.id,original:ref.expected.positions,actual});
 }
 return scoreN4OriginalLahiri(rows);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{console.log(JSON.stringify(await auditN4RcProductionLahiri(),null,2))}
 catch(e){console.error(e instanceof Error?e.message:String(e));process.exitCode=2}
}
