/**
 * Original JHora8 50-source method-aware arithmetic GATE, read-only.
 *
 * Accepts a SANITIZED corpus derived from 50 private, genuine original GUI
 * Ctrl+C dumps. SHA values can bind it to external private raw sources, but
 * this script cannot authenticate those sources from JSON alone.
 * Critically, it does NOT certify independent planetary astronomy, mean
 * vs true ayanamsha, historical UTC, D60 time certainty or production release.
 *
 * Usage: node --experimental-strip-types tools/n4-original-jhora50-reference-gate.mjs <private-sanitized-reference.json>
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SHODASHAVARGA,vargaSign,vargaBoundaryDistanceArcseconds} from '../packages/jyotish-core/src/vargas.ts';
import {n4UmaShambhuHoraSign} from '../packages/jyotish-core/src/hora-uma-shambhu.ts';

export const N4_JHORA8_ORIGINAL_50_PROFILE='n4-jhora8-original-true-citra-truepos-uma-shambhu-v1';
const BODIES=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const PINNED_EXE_SHA256='3DDBE5FB0458AD1F0AD91B002C7EFB8BBA9F08891D3F46190ABA97D570B17908';
const SHA=/^[a-f0-9]{64}$/i;
const assert=(condition,message)=>{if(!condition)throw Error('N4_JHORA50_METHOD_GATE_BLOCKED: '+message)};
const keysEq=(obj,keys)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&
 Object.keys(obj).length===keys.length&&keys.every(k=>Object.hasOwn(obj,k));
export function auditN4JHora50MethodAwareReference(source){
 assert(source?.profile===N4_JHORA8_ORIGINAL_50_PROFILE,'wrong original JHora8 method profile');
 assert(source.originalJhoraExecutableSha256===PINNED_EXE_SHA256,
  'this benchmark was recorded with another or unknown original JHora binary');
 assert(source.productionEphemerisCertified===false,
  'sanitized original chart-sign vectors must never self-certify production astronomy');
 assert(Array.isArray(source.cases)&&source.cases.length===50,
  'need exactly 50 distinct original-source case records');
 const divisions=[...SHODASHAVARGA].map(d=>'D'+d),sourceHashes=new Set(),inputHashes=new Set();
 let checked=0;
 for(let i=0;i<50;i++){
  const c=source.cases[i],id='N4-SYNTH-'+String(i+1).padStart(3,'0');
  assert(c?.id===id,'unexpected, absent or out-of-order original case '+id);
  assert(SHA.test(c.originalSourceSha256||'')&&!sourceHashes.has(c.originalSourceSha256.toLowerCase()),
   id+' source SHA missing or repeated');
  sourceHashes.add(c.originalSourceSha256.toLowerCase());
  assert(SHA.test(c.originalJhdSha256||'')&&!inputHashes.has(c.originalJhdSha256.toLowerCase()),
   id+' JHD SHA missing or repeated');
  inputHashes.add(c.originalJhdSha256.toLowerCase());
  assert(Number.isFinite(c.originalAyanamsaDegrees)&&c.originalAyanamsaDegrees>20&&c.originalAyanamsaDegrees<27,
   id+' numeric original ayanamsha missing');
  assert(c.originalChartMethodLabels?.D2==='US'&&c.originalChartMethodLabels?.D60==='Trd',
   id+' original D2 (US) and D60 (Trd) were not attested');
  assert(keysEq(c.natalLongitudes,BODIES),id+' ten exact original D1 source longitudes required');
  assert(keysEq(c.expectedSigns,divisions),id+' all 16 original symbolic chart references required');
  for(const d of SHODASHAVARGA){
   const key='D'+d,reference=c.expectedSigns[key];
   assert(keysEq(reference,BODIES),id+' '+key+' missing one or more original bodies');
   for(const name of BODIES){
    const lon=c.natalLongitudes[name],expected=reference[name];
    assert(Number.isFinite(lon)&&lon>=0&&lon<360,id+' invalid D1 position of '+name);
    assert(Number.isInteger(expected)&&expected>=1&&expected<=12,
     id+' '+key+' '+name+' missing original chart sign');
    assert(vargaBoundaryDistanceArcseconds(lon,d)>0.05,
     id+' '+key+' '+name+' source printed to 0.01 arcsec near a sector boundary; cannot certify');
    const actual=(d===2?n4UmaShambhuHoraSign(lon):vargaSign(lon,d))+1;
    assert(actual===expected,id+' '+key+' '+name+
     ' original JHora sign '+expected+' differs from method-aligned rule '+actual);
    checked++;
   }
  }
 }
 assert(checked===8000,'exactly 8000 source formulas must be matched');
 return Object.freeze({status:'ORIGINAL_JHORA8_50_SOURCE_METHOD_ALIGNED_SIGN_PARITY_PASS',
  sourceCases:sourceHashes.size,checkedSigns:checked,d2:'Uma-Shambhu (US)',
  d60:'Traditional (Trd)',independentPhysicalEphemerisCertified:false,
  productionReleasePermitted:false,notes:'Requires separately authenticated original private source hashes and independent production SWIEPH astronomy'});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  assert(process.argv.length===3,'Usage: node --experimental-strip-types tools/n4-original-jhora50-reference-gate.mjs <sanitized-original-source.json>');
  const input=JSON.parse(readFileSync(process.argv[2],'utf8'));
  console.log(JSON.stringify(auditN4JHora50MethodAwareReference(input),null,2));
 }catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=2;}
}
