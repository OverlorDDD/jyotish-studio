/** JQA-3 Dasha-year forensic diagnostic; NEVER a certification gate.
 * JHora original data is YYYY-MM-DD only. Its YearDefinition=0 3 is
 * independently unmapped and YearLength=0 is not evidence of the active mode.
 * Compare candidate year lengths with BOTH UTC and recorded local offset.
 */
import {readFileSync} from 'node:fs';
import {loadCorpus,verifyReference} from './jqa3-corpus.mjs';
import {nakshatraOf,DASHA_LORDS,DASHA_YEARS} from '../packages/jyotish-core/src/index.ts';
import {parseJHoraRaw} from './jqa3-raw-parser.mjs';
const YEARS=[360,365,365.24219,365.2425,365.25,365.25636],DAY=86400000;
const date=t=>new Date(t).toISOString().slice(0,10);
const dayDiff=(a,b)=>(Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/DAY;
const median=x=>{const a=[...x].sort((a,b)=>a-b),m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2;};
function starts(moon,birthUtc,year,offset){
 const n=nakshatraOf(moon),first=n.index%9;
 let t=Date.parse(birthUtc)-year*DAY*DASHA_YEARS[first]*n.fraction;
 const out=new Map(),fmt=v=>date(v+offset*1000);
 for(let i=0;i<9;i++){
  const k=(first+i)%9,sub=new Map();let cursor=t;
  for(let j=0;j<9;j++){
   const x=(k+j)%9;
   sub.set(DASHA_LORDS[x],fmt(cursor));
   cursor+=year*DAY*DASHA_YEARS[k]*DASHA_YEARS[x]/120;
  }
  out.set(DASHA_LORDS[k],{start:fmt(t),sub});
  t+=year*DAY*DASHA_YEARS[k];
 }
 return out;
}
const corpus=loadCorpus();
const captures=corpus.records.filter(r=>r.hasOriginalJHoraIni).map(record=>{
 const ref=verifyReference(record),root='../'+record.captureDir+'/';
 const chart=readFileSync(new URL(root+'chart_data.txt',import.meta.url),'utf8');
 const div=readFileSync(new URL(root+'divisionals.txt',import.meta.url),'utf8');
 const ini=readFileSync(new URL(root+'jhora.ini',import.meta.url),'utf8');
 if(!/^YearDefinition=0 3\r?$/m.test(ini))throw Error('Unexpected year mode: '+record.id);
 const original=parseJHoraRaw(chart,div);
 if(Math.abs(original.expected.positions.Moon.longitude-ref.expected.positions.Moon.longitude)>1e-9)
  throw Error('Original Moon mismatch: '+record.id);
 return {ref,offset:original.birth.utcOffsetSeconds};
});
const candidates=[];
for(const year of YEARS)for(const clock of ['UTC','JHORA_CAPTURED_LOCAL']){
 let major=0,minor=0,majorDiff=[],minorDiff=[];
 for(const {ref,offset} of captures){
  const out=starts(ref.expected.positions.Moon.longitude,ref.civilTime.birthUtc,year,clock==='UTC'?0:offset);
  for(const period of ref.expected.vimshottari){
   const observed=out.get(period.lord);
   if(!observed)throw Error('Missing JHora lord '+period.lord);
   const a=dayDiff(observed.start,period.start);majorDiff.push(a);if(a===0)major++;
   for(const [lord,day] of Object.entries(period.antardashas)){
    const predicted=observed.sub.get(lord);
    if(!predicted)throw Error('Missing JHora sublord '+period.lord+'/'+lord);
    const d=dayDiff(predicted,day);minorDiff.push(d);if(d===0)minor++;
   }
  }
 }
 candidates.push({yearDays:year,clock,majorDateMatches:major,majorTotal:majorDiff.length,
  subperiodDateMatches:minor,subperiodTotal:minorDiff.length,
  medianMajorSignedDays:median(majorDiff),
  medianMajorAbsoluteDays:median(majorDiff.map(Math.abs)),
  maxMajorAbsoluteDays:Math.max(...majorDiff.map(Math.abs)),
  medianSubperiodAbsoluteDays:median(minorDiff.map(Math.abs)),
  maxSubperiodAbsoluteDays:Math.max(...minorDiff.map(Math.abs))});
}
candidates.sort((a,b)=>b.subperiodDateMatches-a.subperiodDateMatches||b.majorDateMatches-a.majorDateMatches);
console.log(JSON.stringify({status:'DIAGNOSTIC_ONLY_NO_JHORA_YEAR_OPTION_MAPPING',
 source:'PINNED_ORIGINAL_JHORA_8',sourceRecordCount:captures.length,
 jhoraRecordedYearDefinitionCode:3,
 calendarPrecision:'YYYY-MM-DD only: exact Julian instants/rounding are not supplied',
 candidates,
 warning:'Highest match count does not prove the JHora year-option mapping; no production or certification change.'},null,2));
