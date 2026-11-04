/**
 * Import REAL, original JHoraKit clipboard exports into N4's fail-closed oracle.
 *
 * Usage: node --experimental-strip-types tools/n4-jhorakit-import.mjs <manifest.json> <sanitized-output.json>
 *
 * Manifest (PRIVATE; never commit it or original JHoraKit captures):
 * {
 *   "profile":"parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1",
 *   "source":"Original Jagannatha Hora 8.0 via JHoraKit raw clipboard extracts",
 *   "sourceVersion":"8.0.0.0",
 *   "referenceSettings":"Detailed per-varga calculation settings and a pinned ini hash",
 *   "cases":[{"id":"N4-SYNTH-001","synthetic":true,"export":"captures/001/chart.json"}, ...50]
 * }
 * This converter NEVER invents reference signs. It refuses real names,
 * incomplete charts, duplicate IDs and unsafe file paths. It strips birth metadata.
 */
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname,sep} from 'node:path';
import {VARGA_PROFILE,SHODASHAVARGA} from '../packages/jyotish-core/src/vargas.ts';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const BODIES=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const sha256=text=>createHash('sha256').update(text).digest('hex');
const load=p=>readFileSync(p,'utf8');
const parse=(s,p)=>{try{return JSON.parse(s)}catch{throw Error('Invalid JSON: '+p)}};
export function importJHoraKitExport(record,{id,profile,referenceSettings}){
 if(profile!==VARGA_PROFILE)throw Error('Mismatched varga method profile');
 if(!/^N4-SYNTH-\d{3,4}$/.test(id))throw Error('Only documented synthetic chart case IDs are supported');
 if(typeof referenceSettings!=='string'||referenceSettings.length<40)
  throw Error('Pinned JHora 8.0 calculation preferences are required');
 if(record?.meta?.chart_type!=='Natal Chart'||record.meta.name!==id)
  throw Error('Export is not a matching synthetic JHora natal chart');
 if(!record.planets||typeof record.planets!=='object'||!record.divisionals)
  throw Error('Original JHora raw export lacks natal/divisional data');
 const longitudes={};
 for(const name of BODIES){
  const key=name==='Ascendant'?'Lagna':name;
  const value=record.planets[key]?.longitude;
  if(!Number.isFinite(value)||value<0||value>=360)throw Error(id+': missing D1 longitude of '+key);
  longitudes[name]=value;
 }
 const expectedSigns={};
 for(const division of SHODASHAVARGA){
  const suffix='(D'+division+')';
  const found=Object.entries(record.divisionals).filter(([key])=>key.endsWith(suffix));
  if(found.length!==1)throw Error(id+': missing or ambiguous JHora D'+division+' table');
  const results={};
  for(const name of BODIES){
   const key=name==='Ascendant'?'Lagna':name;
   const sign=found[0][1]?.[key]?.sign;
   const index=SIGNS.indexOf(sign);
   if(index<0)throw Error(id+': missing or unknown JHora '+key+' sign in D'+division);
   results[name]=index+1;
  }
  expectedSigns['D'+division]=results;
 }
 return {id,referenceTool:'Jagannatha Hora 8.0',referenceSettings,isRealPerson:false,
  natalLongitudes:longitudes,expectedSigns};
}
const manifestPath=process.argv[2],outputPath=process.argv[3];
if(!manifestPath&&!outputPath){
 // Safe for test imports. No side effects until CLI parameters are supplied.
}else{
 if(!manifestPath||!outputPath)throw Error('Provide manifest path and sanitized output path');
 const base=dirname(resolve(manifestPath)),manifest=parse(load(manifestPath),manifestPath);
 if(manifest.profile!==VARGA_PROFILE||manifest.sourceVersion!=='8.0.0.0'||
    !String(manifest.source||'').includes('JHoraKit'))
  throw Error('Original JHora 8.0/JHoraKit provenance and exact method profile required');
 if(!Array.isArray(manifest.cases)||manifest.cases.length!==50)throw Error('Exactly 50 source exports required');
 const ids=new Set(),out=[];
 for(const c of manifest.cases){
  if(c.synthetic!==true||typeof c.export!=='string'||typeof c.id!=='string'||ids.has(c.id))
   throw Error('Each case requires unique explicitly synthetic id and export path');
  ids.add(c.id);
  const abs=resolve(base,c.export);
  if(!abs.startsWith(base+sep))throw Error('Export path escapes private corpus folder');
  const raw=load(abs),record=parse(raw,c.export);
  out.push({...importJHoraKitExport(record,{id:c.id,profile:manifest.profile,referenceSettings:manifest.referenceSettings}),
   referenceSourceSha256:sha256(raw)});
 }
 const result={profile:VARGA_PROFILE,cases:out};
 const target=resolve(outputPath);
 if(target.startsWith(base+sep)&&target===resolve(manifestPath))
  throw Error('Never overwrite original manifest');
 writeFileSync(target,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log('N4_JHORA_CORPUS_IMPORTED: '+out.length+' sanitized original-source charts');
 console.log('NEXT: node --experimental-strip-types tools/n4-external-varga-gate.mjs '+target);
 console.log('IMPORTANT: Original raw captures and manifest must stay private; do NOT commit them');
}
