/**
 * N4 Vimshottari calendar convention audit.
 * Arithmetic invariants are independently recomputable; agreement between
 * internal formulas is NOT original JHora YearDefinition certification.
 */
import {vimshottari,DASHA_YEAR_DAYS,DASHA_YEARS,DASHA_LORDS,nakshatraOf}
 from '../packages/jyotish-core/src/index.ts';

const DAY=86400000;
const candidateModes=Object.freeze([360,365,365.2425,365.25636]);
const fail=m=>{throw Error('N4_VIMSHOTTARI_CONVENTION_BLOCKED: '+m)};
const isValidUtc=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(Date.parse(s)).toISOString()===s;
/** Independent closed-form dasha anchor for an explicit constant-day convention. */
export function firstDashaStartMs(moonLongitude,birthUtc,yearDays){
 if(!Number.isFinite(moonLongitude)||moonLongitude<0||moonLongitude>=360||
    !isValidUtc(birthUtc)||!candidateModes.includes(yearDays))
  fail('invalid synthetic reference or unpinned calendar convention');
 const segment=360/27,idx=Math.floor(moonLongitude/segment);
 const into=(moonLongitude-idx*segment)/segment;
 return Date.parse(birthUtc)-into*DASHA_YEARS[idx%9]*yearDays*DAY;
}
export function auditN4DashaYearMode(moonLongitude,birthUtc){
 const existing=vimshottari(moonLongitude,birthUtc);
 if(existing.length!==9||existing.some(p=>!Array.isArray(p.antardashas)||p.antardashas.length!==9))
  fail('incomplete original 9-by-9 Vimshottari cycle');
 const duration=DASHA_YEARS.reduce((a,b)=>a+b,0);
 if(duration!==120)fail('Vimshottari cycle must be 120 years');
 const n=nakshatraOf(moonLongitude),first=n.index%9;
 if(existing[0].lord!==DASHA_LORDS[first])fail('wrong nakshatra dasa lord');
 const firstMs=Date.parse(existing[0].start);
 const computed=firstDashaStartMs(moonLongitude,birthUtc,DASHA_YEAR_DAYS);
 if(Math.abs(firstMs-computed)>1.5)fail('core start differs from independent fixed-year equation');
 for(let i=0;i<9;i++){
  const p=existing[i],start=Date.parse(p.start),end=Date.parse(p.end);
  if(p.lord!==DASHA_LORDS[(first+i)%9])fail('wrong 9-lord order');
  if(Math.abs((end-start)/DAY-DASHA_YEARS[(first+i)%9]*DASHA_YEAR_DAYS)>1e-7)
   fail('mahadasha duration mismatch');
  if(i&&Math.abs(Date.parse(existing[i-1].end)-start)>1)
   fail('noncontiguous mahadasha schedule');
  let next=start;
  for(let j=0;j<9;j++){
   const sub=p.antardashas[j];
   const a=Date.parse(sub.start),b=Date.parse(sub.end);
   if(sub.lord!==DASHA_LORDS[(first+i+j)%9]||Math.abs(a-next)>1)
    fail('wrong or gapped antardasha');
   if(j===8&&Math.abs(b-end)>1)fail('last antardasha not contiguous');
   next=b;
  }
 }
 return Object.freeze({
  status:'N4_VIMSHOTTARI_FIXED_YEAR_INTERNAL_INVARIANTS_PASS',
  verifiedSyntheticArithmeticOnly:true,
  existingYearDays:DASHA_YEAR_DAYS,
  originalJHoraYearDefinitionMappingConfirmed:false,
  originalJHoraDateAndTimezoneParityConfirmed:false,
  independentCalendarDateCertification:false,
  alternateYearModes:candidateModes.map(mode=>({
   yearDays:mode,
   differenceInFirstDashaAnchorDays:(firstDashaStartMs(moonLongitude,birthUtc,mode)-computed)/DAY,
   full120YearCycleDifferenceDays:120*(mode-DASHA_YEAR_DAYS)
  })),
  productionCalendarAlgorithmUnchanged:true,
  n4TimeSpecificAiPredictionsAllowed:false
 });
}
