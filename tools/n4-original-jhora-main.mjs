/**
 * Parse source data copied from the ORIGINAL Jagannatha Hora 8.0 main chart
 * with Ctrl+C. This is NOT a natal calculator and NOT an astrological oracle.
 *
 * The first line of JHora's raw clipboard is often a temporary input path,
 * NOT the name of the chart. Use source DATE/TIME and JHD integrity instead.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {vargaSign,vargaBoundaryDistanceArcseconds} from '../packages/jyotish-core/src/vargas.ts';
import {parseN4OriginalDivisionalClipboard} from './n4-original-jhora-divisionals.mjs';

export const N4_JHORA_MAIN_VERSION='n4-jhora8-original-clipboard-main-v1';
const BODIES=['Lagna','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const CODES=['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];
const sha256=t=>createHash('sha256').update(t).digest('hex');
const assert=(c,m)=>{if(!c)throw Error('N4_JHORA_MAIN_SOURCE_INVALID: '+m);};
const getLine=(s,which)=>s.split(/\r?\n/).find(line=>new RegExp('^'+which+':\\s*','i').test(line))?.replace(new RegExp('^'+which+':\\s*','i'),'').trim()||null;
export function parseN4OriginalJHoraMain(raw,expected=null){
 assert(typeof raw==='string'&&raw.length>=1000&&raw.length<2_000_000,
  'original main chart clipboard too short/long');
 assert(!/Get-Clipboard\s+-Raw|Get-CimInstance|\$env:USERPROFILE|Set-Clipboard/i.test(raw),
  'script accidentally uploaded as JHora source');
 assert(/(?:^|\r?\n)Natal Chart(?:\r?\n|:)/i.test(raw),'Natal Chart heading missing');
 const date=getLine(raw,'Date'),time=getLine(raw,'Time');
 const timezone=getLine(raw,'Time Zone'),place=getLine(raw,'Place');
 assert(date&&time&&timezone&&place,'original source date, time, time zone, place incomplete');
 if(expected){
  if(expected.date)assert(date.toLowerCase()===expected.date.toLowerCase(),'unexpected synthetic birth date');
  if(expected.time)assert(time===expected.time,'unexpected synthetic birth time');
  if(expected.timezone)assert(timezone.toLowerCase()===expected.timezone.toLowerCase(),
   'unexpected original source timezone');
 }
 const am=/^\s*Ayanamsa:\s*(\d{1,2})-(\d{2})-(\d{2}(?:\.\d+)?)\s*$/mi.exec(raw);
 assert(am,'JHora8 numeric Ayanamsa line missing');
 const ayanamsaDegrees=Number(am[1])+Number(am[2])/60+Number(am[3])/3600;
 assert(Number.isFinite(ayanamsaDegrees)&&ayanamsaDegrees>=0&&ayanamsaDegrees<40,
  'invalid JHora Ayanamsa');
 assert(/^\s*Body\s+Longitude\s+Nakshatra/i.test(raw.split(/\r?\n/).find(x=>/^\s*Body\s+Longitude/i.test(x))||''),
  'original main chart graha table header missing');
 const longitudes={};
 for(const label of BODIES){
  const name=label==='Lagna'?'Ascendant':label;
  const rows=raw.split(/\r?\n/);
  const row=rows.find(line=>new RegExp('^\\s*'+label+'\\b(?:\\s|$)','i').test(line));
  assert(row,'missing original JHora D1 '+label);
  const match=new RegExp('\\b(\\d{1,2})\\s+(Ar|Ta|Ge|Cn|Le|Vi|Li|Sc|Sg|Cp|Aq|Pi)\\s+(\\d{1,2})\\x27\\s*(\\d{1,2}(?:\\.\\d+)?)"').exec(row);
  assert(match,'missing exact original JHora arcsecond longitude for '+label);
  const sign=CODES.indexOf(match[2]),d=Number(match[1]),m=Number(match[3]),sec=Number(match[4]);
  assert(sign>=0&&d<30&&m<60&&sec>=0&&sec<60,'invalid JHora source longitude '+label);
  longitudes[name]=sign*30+d+m/60+sec/3600;
 }
 const moon=longitudes.Moon,ketu=longitudes.Ketu;
 assert(Number.isFinite(moon)&&Number.isFinite(ketu),'source longitudes missing');
 return Object.freeze({version:N4_JHORA_MAIN_VERSION,sourceSha256:sha256(raw),
  date,time,timezone,place,ayanamsaDegrees,
  longitudes:Object.freeze(longitudes),numberOfOriginalMainBodies:BODIES.length,
  profileCertainty:'GUI_METHOD_NOT_YET_VERIFIED',originalMathematicalCertification:false});
}
/** Precise original D1 source positions versus the 16 original JHora GUI columns.
 * Method parity and ephemeris equality with Galaxiora are separately required.
 */
export function diagnoseN4OriginalJHoraPair(main,div){
 assert(main?.version===N4_JHORA_MAIN_VERSION&&div?.expectedSigns&&div?.columns?.length===16,
  'expected original chart_data and divisional dump');
 const cases=[];let matched=0,mismatched=0,uncertain=0,alignedMatches=0;
 for(const column of div.columns)for(const label of BODIES){
  const name=label==='Lagna'?'Ascendant':label;
  const longitude=main.longitudes[name],expected=div.expectedSigns['D'+column.division]?.[name];
  const actual=vargaSign(longitude,column.division)+1;
  const edge=vargaBoundaryDistanceArcseconds(longitude,column.division);
  const withinPrecision=edge<=0.05; // source printed 0.01 arcsec; conservative screen rounding
  const methodKnownDifferent=column.division===2&&column.method==='US';
  if(withinPrecision)uncertain++;
  else if(actual===expected)matched++;
  else mismatched++;
  if(!withinPrecision&&!methodKnownDifferent&&actual===expected)alignedMatches++;
  cases.push({division:column.division,name,expected,derivedFromJHoraOriginalD1:actual,
   edgeDistanceArcsec:Number(edge.toFixed(4)),withinD1DisplayPrecision:withinPrecision,
   methodKnownDifferent,match:actual===expected});
 }
 return Object.freeze({status:'ONE_ORIGINAL_JHORA8_CASE_DIAGNOSTIC_NOT_CERTIFIED',
  mainSourceSha256:main.sourceSha256,divisionalsSourceSha256:div.sourceSha256,
  sourcePrecision:'JHora original D1 arcsecond text',
  ayanamsaDegrees:main.ayanamsaDegrees,
  actualOriginalSourceCases:1,mathematicallyCertifiedCases:0,
  total:cases.length,matched,mismatched,withinD1DisplayPrecision:uncertain,
  assumedAlignedMatched:alignedMatches,originalJHora50CaseGate:'NOT_MET',
  details:Object.freeze(cases)});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [mainFile,divisionalsFile]=process.argv.slice(2);
 if(!mainFile||!divisionalsFile)throw Error(
  'Usage: node --experimental-strip-types tools/n4-original-jhora-main.mjs private/chart_data.txt private/divisionals.txt');
 const main=parseN4OriginalJHoraMain(readFileSync(mainFile,'utf8'),{
  date:'January 5, 1990',time:'5:11:00',timezone:'9:00:00 (West of GMT)'
 });
 const div=parseN4OriginalDivisionalClipboard(readFileSync(divisionalsFile,'utf8'));
 console.log(JSON.stringify(diagnoseN4OriginalJHoraPair(main,div),null,2));
}
