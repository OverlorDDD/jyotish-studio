/** P3.5 — bounded 7/30-day Personal Panchanga.
 * A verified sunrise overview, NOT a whole-day P3.2/P3.4 muhurta verdict.
 * Public sunrise batches reuse P2.1 and the canonical Swiss/JHora backend.
 * Owner/selected-chart checks happen in PersonalController, never here.
 */
import {panchangaRange, type RangeInput} from './panchanga-range.ts';
import {createVerifiedSiderealPlanetAt} from './panchanga.ts';
import {verifiedDailyMoonStrength} from '../../../packages/jyotish-core/src/lunar-strength.ts';

const HOUR=3600000, MAX_EVENTS=140;
type Dasha={lord:string;start:string;end:string;antardashas?:{lord:string;start:string;end:string}[]};
export type CalendarNatal={moonLongitude:number;moonSign:number;lagnaSign:number;dasha:Dasha[]};
export type CalendarInput=RangeInput & {start:string;days:7|30;timeZone:string;latitude:number;longitude:number};
type EventKind='moon-sign'|'nakshatra'|'mahadasha'|'antardasha';
type CalendarEvent={atUtc:string;kind:EventKind;from?:number;to?:number;lord?:string};
const stamp=(value:string)=>{const t=Date.parse(value);
 if(!Number.isFinite(t))throw Error('Invalid P3.5 source timestamp');return t;};
const indexed=(angle:number,parts:number)=>Math.floor(angle/(360/parts))+1;
/** Identify true boundary with 3-hour bracketing, adjacent lunar sectors and
 * one-second bisection. No invented time from two daily snapshots. */
export function p35LunarEvents(begin:number,end:number,moon:(utcMs:number)=>number):CalendarEvent[]{
 if(!Number.isSafeInteger(begin)||!Number.isSafeInteger(end)||
  !(end>begin)||end-begin>32*24*HOUR)throw Error('Invalid lunar search period');
 const events:CalendarEvent[]=[],kinds=[
  {kind:'moon-sign' as const,n:12},{kind:'nakshatra' as const,n:27}
 ];
 for(const {kind,n} of kinds){
  let left=begin,prev=indexed(moon(left),n);
  if(prev<1||prev>n)throw Error('Invalid sidereal Moon');
  while(left<end-1000){
   const right=Math.min(left+3*HOUR,end-1);
   if(right<=left)break;
   const next=indexed(moon(right),n);
   if(next<1||next>n)throw Error('Invalid sidereal Moon');
   if(next!==prev){
    if((next-prev+n)%n!==1)throw Error('P3.5 Moon skipped a verified sector');
    let lo=left,hi=right;
    for(let i=0;i<43&&hi-lo>1000;i++){
     const middle=Math.floor((lo+hi)/2);
     if(indexed(moon(middle),n)===prev)lo=middle;else hi=middle;
    }
    const transition=Math.ceil(hi/1000)*1000;
    if(transition>begin&&transition<end)events.push({
     kind,atUtc:new Date(transition).toISOString(),from:prev,to:next});
   }
   left=right;prev=next;
   if(events.length>MAX_EVENTS)throw Error('Too many lunar events');
  }
 }
 return events;
}
function periodAt(dasha:Dasha[],ms:number){
 const major=dasha.find(d=>stamp(d.start)<=ms&&ms<stamp(d.end));
 const minor=major?.antardashas?.find(a=>stamp(a.start)<=ms&&ms<stamp(a.end));
 return major?{lord:major.lord,start:major.start,end:major.end,
  antardasha:minor?{lord:minor.lord,start:minor.start,end:minor.end}:null}:null;
}
export async function buildP35Calendar(input:CalendarInput,natal:CalendarNatal){
 if(![7,30].includes(input.days)||!Number.isInteger(natal.moonSign)||
  natal.moonSign<1||natal.moonSign>12||
  !Number.isInteger(natal.lagnaSign)||natal.lagnaSign<1||natal.lagnaSign>12||
  !Number.isFinite(natal.moonLongitude)||natal.moonLongitude<0||natal.moonLongitude>=360||
  indexed(natal.moonLongitude,12)!==natal.moonSign||
  !Array.isArray(natal.dasha))throw Error('P3.5 verified natal anchors required');
 const range=await panchangaRange(input);
 if(range.days.length!==input.days||range.startDate!==input.start||
  range.observer.timeZone!==input.timeZone||
  range.observer.latitude!==input.latitude||range.observer.longitude!==input.longitude)
  throw Error('P3.5 public source mismatch');
 const planetAt=await createVerifiedSiderealPlanetAt();
 const days=range.days.map(d=>{
  const instant=stamp(d.sunriseUtc),sunriseMoon=planetAt(instant,'Moon');
  const sign=indexed(sunriseMoon.longitude,12),nak=indexed(sunriseMoon.longitude,27);
  if(sign!==d.sunrise.moonSign||nak!==d.sunrise.nakshatra.number||
     !(stamp(d.nextSunriseUtc)>instant)&&true)
    throw Error('P3.5 Moon/public Panchanga contradiction');
  const strength=verifiedDailyMoonStrength(
   {moonLongitude:natal.moonLongitude,moonSign:natal.moonSign},
   {nakshatraNumber:nak,moonSign:sign});
  const transit=['Mercury','Venus','Mars','Jupiter','Saturn'] as const;
  const gochar=transit.map(name=>{
   const longitude=planetAt(instant,name).longitude,s=indexed(longitude,12);
   return {name,sign:s,houseFromMoon:(s-natal.moonSign+12)%12+1,
    houseFromLagna:(s-natal.lagnaSign+12)%12+1};
  });
  return {date:d.date,sampledAtUtc:d.sunriseUtc,transitMoon:{sign,nakshatraNumber:nak},
   tarabala:strength.tarabala,chandrabala:strength.chandrabala,
   period:periodAt(natal.dasha,instant),gochar};
 });
 const start=stamp(range.days[0].sunriseUtc),end=stamp(range.days.at(-1)!.nextSunriseUtc);
 const atMoon=(t:number)=>planetAt(t,'Moon').longitude;
 const events=p35LunarEvents(start,end,atMoon);
 const unique=new Set<string>();
 for(const d of natal.dasha){
  for(const x of [d,...d.antardashas||[]]){
   const kind:EventKind=x===d?'mahadasha':'antardasha';
   for(const iso of [x.start,x.end]){
    const utc=stamp(iso);
    if(utc<start||utc>=end)continue;
    const atUtc=new Date(utc).toISOString(),key=kind+'|'+atUtc;
    if(!unique.has(key)){unique.add(key);events.push({kind,atUtc,lord:x.lord});}
   }
  }
 }
 events.sort((a,b)=>a.atUtc.localeCompare(b.atUtc)||a.kind.localeCompare(b.kind));
 if(events.length>MAX_EVENTS)throw Error('P3.5 excessive verified transitions');
 return {status:'available' as const,version:'personal-panchanga-calendar-p35' as const,
  observation:'OWNER_VERIFIED_SWISS_AT_EACH_LOCAL_SUNRISE' as const,
  scope:'SUNRISE_SNAPSHOTS_WITH_EXACT_LUNAR_AND_DASHA_TRANSITIONS_NOT_FULL_DAY_MUHURTA' as const,
  range,personal:{natal:{moonSign:natal.moonSign,lagnaSign:natal.lagnaSign},days,events}};
}
