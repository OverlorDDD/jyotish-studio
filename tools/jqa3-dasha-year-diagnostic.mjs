/**
 * JQA-3 focused diagnostic: isolate JHora Vimshottari calendar conventions.
 *
 * Uses the EXACT original JHora lunar longitude and its 9x9 recorded dates.
 * Compares three declared published year conventions. A best-fitting candidate
 * is NOT a proof that it is the selected JHora YearDefinition=0 3 mode.
 * No candidate is promoted to production or to certification.
 */
import {loadCorpus,verifyReference} from './jqa3-corpus.mjs';
import {nakshatraOf,DASHA_LORDS,DASHA_YEARS} from '../packages/jyotish-core/src/index.ts';
const YEAR_OPTIONS=[365.2425,365.25,365.25636];
function starts(moon,birthUtc,daysPerYear){
 const nak=nakshatraOf(moon),first=nak.index%9;
 let cursor=Date.parse(birthUtc)-daysPerYear*86400000*DASHA_YEARS[first]*nak.fraction;
 const out=new Map();
 for(let i=0;i<9;i++){
  const k=(first+i)%9,lord=DASHA_LORDS[k];
  const end=cursor+daysPerYear*86400000*DASHA_YEARS[k];
  const children=new Map();let sub=cursor;
  for(let j=0;j<9;j++){
   const subK=(k+j)%9;
   children.set(DASHA_LORDS[subK],new Date(sub).toISOString().slice(0,10));
   sub+=daysPerYear*86400000*DASHA_YEARS[k]*DASHA_YEARS[subK]/120;
  }
  out.set(lord,{start:new Date(cursor).toISOString().slice(0,10),children});
  cursor=end;
 }
 return out;
}
const dDate=(a,b)=>Math.abs(Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/86400000;
const records=loadCorpus().records.filter(r=>r.hasOriginalJHoraIni);
const summary=[];
for(const year of YEAR_OPTIONS){
 let major=0,minor=0,worstMajor=0,worstMinor=0;
 for(const record of records){
  const chart=verifyReference(record);
  const out=starts(chart.expected.positions.Moon.longitude,chart.civilTime.birthUtc,year);
  for(const period of chart.expected.vimshottari){
   const generated=out.get(period.lord);
   if(!generated)throw Error('Recorded JHora lord absent '+period.lord);
   const delta=dDate(generated.start,period.start);
   if(delta===0)major++;
   worstMajor=Math.max(worstMajor,delta);
   for(const [lord,date] of Object.entries(period.antardashas)){
    const diff=dDate(generated.children.get(lord),date);
    if(diff===0)minor++;
    worstMinor=Math.max(worstMinor,diff);
   }
  }
 }
 summary.push({yearDays:year,majorDateMatches:major,majorTotal:9*records.length,
  subperiodDateMatches:minor,subperiodTotal:81*records.length,
  worstMajorDifferenceDays:worstMajor,worstSubperiodDifferenceDays:worstMinor});
}
console.log(JSON.stringify({status:'DIAGNOSTIC_ONLY_NO_JHORA_YEAR_OPTION_MAPPING',
 birthMoonSource:'ORIGINAL_JHORA_LONGITUDE',jhoraRecordedYearDefinitionCode:3,
 sourceRecordCount:records.length,sourcePeriodCount:9*records.length,
 possibleYearModels:summary},null,2));
