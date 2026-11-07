/** Read-only, owner-local authentic JHora8 50 benchmark for ELEVEN
 * NEW shared-method vargas. D2 in this source is Uma-Shambhu, not Sun/Moon.
 * Never log individual source longitudes, never auto-upload the private JSON.
 * This compares symbolic formulas on original True Citra source longitudes,
 * not physical production Lahiri birth-time astronomy.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {vargaSign,vargaBoundaryDistanceArcseconds} from '../packages/jyotish-core/src/vargas.ts';
export const NEW_ORIGINAL_COMMON_11=[3,4,7,12,16,20,24,27,30,40,45];
const NAME=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const SOURCE_SHA='5dcb07d6d71f68199af97696e8ad3ca91493b30f4abc41fdd51350c14e4ff992';
const EXE_SHA='3DDBE5FB0458AD1F0AD91B002C7EFB8BBA9F08891D3F46190ABA97D570B17908';
const PROFILE='n4-jhora8-original-true-citra-truepos-uma-shambhu-v1';
const fail=s=>{throw Error('N4_RC_ORIGINAL_JHORA50_INVALID_'+s)};
const validHash=x=>typeof x==='string'&&/^[a-fA-F0-9]{64}$/.test(x);
const validSign=n=>Number.isInteger(n)&&n>=1&&n<=12;
export function compare11NewAgainstOriginal50(source){
 if(source?.profile!==PROFILE||source.originalJhoraExecutableSha256!==EXE_SHA||
    source.productionEphemerisCertified!==false)fail('PROVENANCE_OR_METHOD');
 if(!Array.isArray(source.cases)||source.cases.length!==50)fail('CASE_COUNT');
 const ids=new Set(),sourceHashes=new Set(),inputHashes=new Set();
 const byDivision=NEW_ORIGINAL_COMMON_11.map(division=>({division,matchedSigns:0,checkedSigns:0}));
 let d2SunMoonSameAsUmaShambhu=0,d2Compared=0;
 for(let i=0;i<50;i++){
  const c=source.cases[i],id='N4-SYNTH-'+String(i+1).padStart(3,'0');
  if(c?.id!==id||ids.has(id))fail('CASE_ID');ids.add(id);
  if(!validHash(c.originalSourceSha256)||!validHash(c.originalJhdSha256))fail('RAW_ORIGINAL_HASH');
  if(sourceHashes.has(c.originalSourceSha256)||inputHashes.has(c.originalJhdSha256))fail('DUPLICATE_ORIGINAL_HASH');
  sourceHashes.add(c.originalSourceSha256);inputHashes.add(c.originalJhdSha256);
  if(c.originalChartMethodLabels?.D2!=='US'||c.originalChartMethodLabels?.D60!=='Trd')fail('D2_OR_D60_ORIGINAL_METHOD');
  if(!Number.isFinite(c.originalAyanamsaDegrees)||c.originalAyanamsaDegrees<=20||
     c.originalAyanamsaDegrees>=27)fail('ORIGINAL_AYANAMSHA');
  if(Object.keys(c.natalLongitudes||{}).length!==10||
     NAME.some(name=>!Number.isFinite(c.natalLongitudes[name])||
      c.natalLongitudes[name]<0||c.natalLongitudes[name]>=360))fail('ORIGINAL_POSITIONS');
  for(const n of NEW_ORIGINAL_COMMON_11){
   const ref=c.expectedSigns?.['D'+n];
   if(!ref||Object.keys(ref).length!==10)fail('MISSING_ORIGINAL_D'+n);
   const counter=byDivision.find(entry=>entry.division===n);
   for(const name of NAME){
    const want=ref[name],lon=c.natalLongitudes[name];
    if(!validSign(want))fail('SOURCE_SIGN');
    if(vargaBoundaryDistanceArcseconds(lon,n)<=0.05)fail('ORIGINAL_PRINT_BOUNDARY_D'+n);
    const actual=vargaSign(lon,n)+1;
    counter.checkedSigns++;
    if(actual!==want)fail('D'+n+'_NONPARITY_'+id+'_'+name);
    counter.matchedSigns++;
   }
  }
  for(const name of NAME){
   const lon=c.natalLongitudes[name],want=c.expectedSigns?.D2?.[name];
   if(!validSign(want))fail('SOURCE_D2_METHOD');
   d2Compared++;
   if(vargaSign(lon,2)+1===want)d2SunMoonSameAsUmaShambhu++;
  }
 }
 if(byDivision.some(d=>d.checkedSigns!==500||d.matchedSigns!==500))fail('INCOMPLETE_SHARED_METHOD');
 if(d2Compared!==500||d2SunMoonSameAsUmaShambhu!==80)fail('PINNED_HORA_METHOD_DISAGREEMENT_CHANGED');
 return Object.freeze({
  status:'N4_RC_ORIGINAL_JHORA8_11_NEW_SHARED_METHOD_5500_OF_5500_PASS',
  originalSourceCases:50,
  originalJhoraVersion:'8.0',
  sourceAyanamsa:'True Citra',
  sourcePositions:'geometric',
  newSharedMethodDivisions:[...NEW_ORIGINAL_COMMON_11],
  checkedSharedMethodSigns:5500,matchedSharedMethodSigns:5500,
  byDivision,d2SourceMethod:'Uma-Shambhu',
  d2ProductionMethod:'Sun/Moon',
  d2MethodOnlyOverlap:d2SunMoonSameAsUmaShambhu,
  d2MethodOnlyCompared:d2Compared,
  d2MethodDifferentOn:500-d2SunMoonSameAsUmaShambhu,
  claimsProductionLahiriPhysicalCertified:false,
  claimsD2OriginalJHoraProductionMethodParity:false,
  productionReleaseAuthorized:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  if(process.argv.length!==3)fail('EXPECTED_PRIVATE_SOURCE_PATH');
  const bytes=readFileSync(resolve(process.argv[2]));
  if(createHash('sha256').update(bytes).digest('hex').toLowerCase()!==SOURCE_SHA)fail('ORIGINAL_SOURCE_SHA');
  console.log(JSON.stringify(compare11NewAgainstOriginal50(JSON.parse(bytes.toString('utf8'))),null,2));
 }catch(e){console.error(e instanceof Error?e.message:String(e));process.exitCode=2}
}
