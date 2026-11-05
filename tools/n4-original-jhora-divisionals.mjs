/**
 * Read-only 16x10 ORIGINAL JHora clipboard-table pilot importer.
 * Never generates original reference values, never accepts script text in place
 * of a source clipboard, and never calls a model or writes to production.
 *
 * Diagnostic ONLY: rounded source D1 longitudes and unaligned GUI method
 * variants cannot certify original JHora mathematical parity.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SHODASHAVARGA,vargaSign,vargaBoundaryDistanceArcseconds} from '../packages/jyotish-core/src/vargas.ts';

export const N4_ORIGINAL_JHORA_PILOT_VERSION='n4-raw-gui-clipboard-pilot-v1';
const LABELS=['Lagna','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const SIGN_CODES=['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];
const coreOrder=[1,9,10,2,3,4,7,12,16,20,24,27,30,40,45,60];
const sha256=text=>createHash('sha256').update(text).digest('hex');
const assert=(condition,msg)=>{if(!condition)throw Error('N4_JHORA_CLIPBOARD_INVALID: '+msg);};

export function validateN4OriginalMainClipboard(source,caseId='N4-SYNTH-001'){
 assert(typeof source==='string'&&source.length>=1000&&source.length<2_000_000,'main original clipboard too small/large');
 assert(!/Get-Clipboard\s+-Raw|Get-CimInstance|Set-Clipboard|(?:\$env:USERPROFILE)/i.test(source),
  'PowerShell source was saved instead of original JHora clipboard');
 assert(/Natal Chart/i.test(source),'Natal Chart heading missing');
 assert(/Ayanamsa\s*:/i.test(source),'JHora Ayanamsa entry missing');
 assert(source.includes(caseId),'wrong or stale original JHora case');
 return Object.freeze({caseId,sha256:sha256(source),sourceType:'ORIGINAL_GUI_CLIPBOARD_NOT_EXTERNAL_CERTIFICATE'});
}
export function parseN4OriginalDivisionalClipboard(raw){
 assert(typeof raw==='string'&&raw.length>=1200&&raw.length<2_000_000,'divisional source too small/large');
 assert(!/Get-Clipboard\s+-Raw|Get-CimInstance|Set-Clipboard/i.test(raw),
  'PowerShell script saved instead of JHora table');
 const lines=raw.replace(/^\uFEFF/,'').split(/\r?\n/);
 const header=lines.find(line=>/^\s*Body\s+D-1\s+D-9\b/.test(line));
 assert(header,'original JHora Body/D-1/D-9 table header absent');
 const cutoff=header.search(/D-10\s+x\s+D-9/i);
 const left=cutoff>=0?header.slice(0,cutoff):header;
 const columns=[...left.matchAll(/\bD-(\d+)(?:\s*\(([^)]+)\))?/g)]
  .map(m=>Object.freeze({division:Number(m[1]),method:(m[2]||'unspecified').trim()}));
 assert(columns.length===16,'expected exactly 16 leading original divisional columns');
 assert(columns.every((c,i)=>c.division===coreOrder[i]),'original GUI 16 chart order is unexpected');
 assert(new Set(columns.map(c=>c.division)).size===16,'duplicate division');
 assert(SHODASHAVARGA.every(n=>columns.some(c=>c.division===n)),'missing Shodashavarga D');
 const start=header.indexOf('D-1');
 const rowMap=new Map();
 for(const line of lines){
  const label=line.slice(0,start).trim();
  if(!LABELS.includes(label))continue;
  assert(!rowMap.has(label),'duplicate '+label+' body row');
  const values=line.slice(start).trim().split(/\s+/);
  assert(values.length>=16,label+' must include all 16 varga cells');
  const cells=values.slice(0,16).map((v,i)=>{
   const m=/^(\d{1,2})(Ar|Ta|Ge|Cn|Le|Vi|Li|Sc|Sg|Cp|Aq|Pi)(\d{2})$/.exec(v);
   assert(m,label+' missing numeric/sign reference in D'+columns[i].division);
   const degree=Number(m[1]),minute=Number(m[3]);
   assert(degree<=29&&minute<=60,'unexpected JHora sign degree/minute in '+label);
   return Object.freeze({raw:v,degree,minute,sign:SIGN_CODES.indexOf(m[2])+1});
  });
  rowMap.set(label,Object.freeze(cells));
 }
 assert(rowMap.size===10,'missing Lagna or one of nine traditional grahas');
 const placements=Object.fromEntries(columns.map((c,i)=>[
  'D'+c.division,Object.freeze(Object.fromEntries(LABELS.map(l=>[l==='Lagna'?'Ascendant':l,rowMap.get(l)[i].sign])))
 ]));
 const roundedNatalLongitude=Object.freeze(Object.fromEntries(LABELS.map(l=>{
  const cell=rowMap.get(l)[0];
  return [l==='Lagna'?'Ascendant':l,(cell.sign-1)*30+cell.degree+cell.minute/60];
 })));
 return Object.freeze({version:N4_ORIGINAL_JHORA_PILOT_VERSION,columns:Object.freeze(columns),
  expectedSigns:Object.freeze(placements),roundedNatalLongitude,
  sourceSha256:sha256(raw),bodyCount:rowMap.size});
}
export function diagnoseN4OriginalDivisionalPilot(parsed){
 assert(parsed?.version===N4_ORIGINAL_JHORA_PILOT_VERSION,'invalid original pilot parser result');
 const byDivision={};let matches=0,mismatches=0,ambiguous=0,assumedAlignedMatches=0,assumedAlignedTotal=0;
 for(const c of parsed.columns){
  const key='D'+c.division;
  const entries=[];
  for(const label of LABELS){
   const name=label==='Lagna'?'Ascendant':label,lon=parsed.roundedNatalLongitude[name];
   const computed=vargaSign(lon,c.division)+1,observed=parsed.expectedSigns[key][name];
   const distanceArcsec=vargaBoundaryDistanceArcseconds(lon,c.division);
   const near=distanceArcsec<=31; // rounded original D1 +/-30 arcsec plus numerical margin
   const same=computed===observed;
   const methodMismatch=c.division===2&&c.method==='US';
   if(near)ambiguous++;
   else if(same)matches++;
   else mismatches++;
   if(!near&&!methodMismatch){assumedAlignedTotal++;if(same)assumedAlignedMatches++;}
   entries.push(Object.freeze({name,computed,observed,nearRoundedBoundary:near,
    methodMismatchKnown:methodMismatch,match:same}));
  }
  byDivision[key]=Object.freeze({method:c.method,entries:Object.freeze(entries),
   comparisonClass:c.division===2&&c.method==='US'?'KNOWN_METHOD_DIFFERENCE_D2_US_VS_SUN_MOON':
    'METHOD_ALIGNMENT_NOT_INDEPENDENTLY_ATTESTED'});
 }
 return Object.freeze({status:'DIAGNOSTIC_ONLY_NOT_ORIGINAL_JHORA_CERTIFIED',
  originalClipboardSha256:parsed.sourceSha256,sourcePrecision:'D1_rounded_to_nearest_arcminute',
  originalCaseCount:1,originalCertifiedCases:0,positions:160,
  matches,mismatches,ambiguous,assumedAlignedMatches,assumedAlignedTotal,byDivision,
  furtherEvidenceNeeded:Object.freeze(['genuine_ctrl_c_main_chart_data_with_Ayanamsa',
   'original_binary_and_INI_hashes','verified_ayanamsa_and_D2_GUI_methods',
   '50_genuine_original_source_exports','exact_D1_longitude_and_D60_time_robustness'])});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const file=process.argv[2];
 if(!file)throw Error('Usage: node --experimental-strip-types tools/n4-original-jhora-divisionals.mjs <private-original-divisionals.txt> [<private-original-chart_data.txt>]');
 const raw=readFileSync(file,'utf8');
 const parsed=parseN4OriginalDivisionalClipboard(raw);
 const output={...diagnoseN4OriginalDivisionalPilot(parsed)};
 if(process.argv[3])output.main=validateN4OriginalMainClipboard(readFileSync(process.argv[3],'utf8'));
 console.log(JSON.stringify(output,null,2));
 console.log('N4_12_ONE_ORIGINAL_GUI_TABLE_DIAGNOSED_NOT_MATH_CERTIFIED');
}
