/** P2.2 presentation-only timeline semantics. UTC instant comparisons are
 * authoritative; the user's timezone only formats labels, never computes boundaries.
 * A Vedic day is the half-open [local sunrise, NEXT local sunrise) interval.
 */
export const CHANGING_ANGAS=['tithi','nakshatra','yoga','karana'] as const;
export type ChangingAnga=typeof CHANGING_ANGAS[number];
export type Anga=ChangingAnga|'vara';
export type Tithi={number:number;paksha:string;numberWithinPaksha:number};
export type Nakshatra={number:number;name:string;pada:number};
export type NamedAnga={number:number;name:string};
export type Karana={slot:number;name:string};
export type AngaValues={tithi:Tithi;nakshatra:Nakshatra;vara:NamedAnga;yoga:NamedAnga;karana:Karana};
export type TimePeriod<K extends ChangingAnga=ChangingAnga>={
 index:number;startUtc:string;endUtc:string;value:AngaValues[K];
};
export type LivePanchangaDay={
 date:string;sunriseUtc:string;sunsetUtc:string;nextSunriseUtc:string;
 location:{timeZone:string;latitude:number;longitude:number};
 sunrise:AngaValues;
 changes:{kind:ChangingAnga;atUtc:string;nextIndex:number}[];
 periods:{[K in ChangingAnga]:TimePeriod<K>[]};
};
export type Slice<K extends ChangingAnga=ChangingAnga>=TimePeriod<K>&{
 clippedStartUtc:string;clippedEndUtc:string;leftPercent:number;widthPercent:number;
};
const dateMs=(s:string)=>Date.parse(s);
function bounds(day:LivePanchangaDay){
 const start=dateMs(day.sunriseUtc),end=dateMs(day.nextSunriseUtc);
 if(!Number.isFinite(start)||!Number.isFinite(end)||end-start<20*3600000||end-start>28*3600000)
  throw Error('Invalid observer-local sunrise range');
 return {start,end,length:end-start};
}
export function calendarDateAt(nowMs:number,zone:string){
 if(!Number.isFinite(nowMs))throw Error('Invalid current instant');
 const parts=new Intl.DateTimeFormat('en-US',{
  timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'
 }).formatToParts(new Date(nowMs));
 const part=(name:string)=>parts.find(p=>p.type===name)?.value||'';
 return part('year')+'-'+part('month')+'-'+part('day');
}
export function previousCivilDate(day:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Invalid local date');
 const ms=Date.parse(day+'T00:00:00Z');
 if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==day)throw Error('Invalid local date');
 return new Date(ms-86400000).toISOString().slice(0,10);
}
export function needsPriorVedicDay(day:LivePanchangaDay,nowMs:number){
 const {start}=bounds(day);
 return nowMs<start&&calendarDateAt(nowMs,day.location.timeZone)===day.date&&day.date>'1900-01-01';
}
export function withinVedicDay(day:LivePanchangaDay,nowMs:number){
 const {start,end}=bounds(day);
 return nowMs>=start&&nowMs<end;
}
export function slicesFor<K extends ChangingAnga>(day:LivePanchangaDay,kind:K):Slice<K>[]{
 const {start,end,length}=bounds(day);
 const periods=day.periods?.[kind] as TimePeriod<K>[]|undefined;
 if(!Array.isArray(periods)||periods.length===0||periods.length>12)
  throw Error('Missing verified '+kind+' periods');
 const result:Slice<K>[]=[];
 let cursor=start;
 for(const period of periods){
  const from=dateMs(period.startUtc),until=dateMs(period.endUtc);
  if(!Number.isFinite(from)||!Number.isFinite(until)||until<=from)throw Error('Invalid '+kind+' interval');
  const a=Math.max(start,from),b=Math.min(end,until);
  if(b<=a)continue;
  if(Math.abs(a-cursor)>1000)throw Error('Gap/overlap in '+kind+' intervals');
  if(!Number.isInteger(period.index)||period.index<1||period.index>(kind==='nakshatra'||kind==='yoga'?27:kind==='karana'?60:30))
   throw Error('Invalid '+kind+' index');
  const valueIndex=kind==='karana'?(period.value as Karana).slot:(period.value as Tithi|Nakshatra|NamedAnga).number;
  if(valueIndex!==period.index)throw Error('Period label/index mismatch');
  result.push({...period,clippedStartUtc:new Date(a).toISOString(),clippedEndUtc:new Date(b).toISOString(),
   leftPercent:(a-start)/length*100,widthPercent:(b-a)/length*100});
  cursor=b;
 }
 if(Math.abs(cursor-end)>1000||!result.length)throw Error('Incomplete '+kind+' sunrise-day coverage');
 return result;
}
/** A state only qualifies as "now" when the actual instant lies in this sunrise
 * day. Never show a sunrise snapshot as if it represented the current moment.
 */
export function stateAt(day:LivePanchangaDay,nowMs:number){
 if(!withinVedicDay(day,nowMs))return null;
 const changing={} as {[K in ChangingAnga]:TimePeriod<K>};
 for(const kind of CHANGING_ANGAS){
  const slices=slicesFor(day,kind);
  const active=slices.find(p=>nowMs>=dateMs(p.startUtc)&&nowMs<dateMs(p.endUtc));
  if(!active)throw Error('No active '+kind+' period for current instant');
  // Dynamic indexed assignment is structurally guarded by the actual source kind.
  (changing as Record<string,TimePeriod>)[kind]=active;
 }
 return {date:day.date,untilSunriseUtc:day.nextSunriseUtc,
  vara:{index:day.sunrise.vara.number,value:day.sunrise.vara,
   startUtc:day.sunriseUtc,endUtc:day.nextSunriseUtc},...changing};
}
export function positionInDay(day:LivePanchangaDay,nowMs:number){
 const {start,end,length}=bounds(day);
 return nowMs>=start&&nowMs<end?(nowMs-start)/length*100:null;
}
