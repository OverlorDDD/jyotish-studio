/** P2.4: fail-closed adapter for one observer, one calendar date and two
 * existing verified read-only API contracts (exact /day + compact /overview).
 * This module does NOT produce astronomical facts or decide fasting dates.
 */
export type SourcePoint={date:string;timeZone:string;latitude:string;longitude:string};
export type CalendarSystem='amanta'|'purnimanta';
export type GuideObservance={id:string;atUtc:string;date:string;category:'candidate'|'astronomical_event';rule:string};
export type GuidePhase={kind:'new_moon'|'first_quarter'|'full_moon'|'last_quarter';atUtc:string;localDate:string};
export type GuideDay={date:string;sunriseUtc:string;sunsetUtc:string;
 sunriseAngas:Record<string,unknown>;
 moonMonth:{name:string|null;lunarMonthStatus:string};observances:GuideObservance[]};
export type GuideOverview={monthSystem:CalendarSystem;observer:{timeZone:string;latitude:number;longitude:number};
 days:GuideDay[];phaseEvents:GuidePhase[];
 astronomicalTimeCertifiedByIndependentReference:boolean;
 observanceDayCertifiedByTradition:boolean};
export type ExactDay={date:string;sunriseUtc:string;sunsetUtc:string;
 location:{timeZone:string;latitude:number;longitude:number};
 sunrise:Record<string,unknown>};
const angi=['tithi','nakshatra','vara','yoga','karana'] as const;
const phaseNames=['new_moon','first_quarter','full_moon','last_quarter'];
const parse=(iso:string)=>{
 const n=Date.parse(iso);
 if(typeof iso!=='string'||!Number.isFinite(n)||!iso.endsWith('Z'))
  throw Error('Invalid verified UTC instant');
 return n;
};
const equalCoords=(a:number,b:number)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-5;
export function verifyIntegratedOverview(overview:GuideOverview,day:ExactDay,point:SourcePoint,system:CalendarSystem){
 if(!overview||!day||!point||!['amanta','purnimanta'].includes(system)||
  !Array.isArray(overview.days)||overview.days.length!==1||!Array.isArray(overview.phaseEvents))
  throw Error('Incomplete verified daily overview');
 const item=overview.days[0];
 if(item.date!==point.date||day.date!==point.date||overview.monthSystem!==system||
  overview.observer?.timeZone!==point.timeZone||day.location?.timeZone!==point.timeZone||
  !equalCoords(overview.observer?.latitude,Number(point.latitude))||
  !equalCoords(day.location?.latitude,Number(point.latitude))||
  !equalCoords(overview.observer?.longitude,Number(point.longitude))||
  !equalCoords(day.location?.longitude,Number(point.longitude))||
  item.sunriseUtc!==day.sunriseUtc||item.sunsetUtc!==day.sunsetUtc)
  throw Error('Observer or sunrise mismatch: cannot join calendar data');
 const sunrise=parse(item.sunriseUtc),sunset=parse(item.sunsetUtc);
 if(sunrise>=sunset||!item.moonMonth||!Array.isArray(item.observances))
  throw Error('Incomplete verified astronomy record');
 for(const key of angi){
  if(JSON.stringify(item.sunriseAngas?.[key])!==JSON.stringify(day.sunrise?.[key]))
   throw Error('Mismatched sunrise anga: '+key);
 }
 if(overview.astronomicalTimeCertifiedByIndependentReference!==false||
  overview.observanceDayCertifiedByTradition!==false)
  throw Error('Missing observational certification scope');
 for(const event of item.observances){
  if(event.date!==point.date||!['candidate','astronomical_event'].includes(event.category)||
   !event.id||!event.rule||!Number.isFinite(parse(event.atUtc)))
   throw Error('Unverified festival candidate');
 }
 for(const phase of overview.phaseEvents){
  if(phase.localDate!==point.date||!phaseNames.includes(phase.kind)||!Number.isFinite(parse(phase.atUtc)))
   throw Error('Unverified observer-local lunar phase');
 }
 return {day:item,phases:overview.phaseEvents};
}
export function dateIsSupported(date:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<'1900-01-01'||date>'2099-11-30')return false;
 const ms=Date.parse(date+'T00:00:00Z');
 return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===date;
}
export function chooseInitialDay(candidate:string|null,timeZone:string,now=new Date()){
 if(candidate&&dateIsSupported(candidate))return candidate;
 const parts=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const p=(key:string)=>parts.find(x=>x.type===key)?.value||'';
 return p('year')+'-'+p('month')+'-'+p('day');
}
