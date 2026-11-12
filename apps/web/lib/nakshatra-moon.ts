/** Server-only: where the Moon is now, from the verified Panchanga API.
 * Nakshatra boundaries are single instants for the whole Earth; Kyiv is used only
 * as the reference observer the API needs for its sunrise frame. Nothing is estimated here. */
const REF={timeZone:'Europe/Kyiv',latitude:50.4501,longitude:30.5234};
type Period={startUtc:string;endUtc:string;value:{number:number}};
export type MoonNow={number:number;startUtc:string;endUtc:string};
export type SunriseStar={date:string;number:number};
const origin=()=>process.env.INTERNAL_API_ORIGIN||'http://127.0.0.1:4000';
const query=(extra:Record<string,string>)=>new URLSearchParams({...extra,zone:REF.timeZone,
 latitude:String(REF.latitude),longitude:String(REF.longitude)});
const civil=(at:Date)=>{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:REF.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(at);
 const p=(k:string)=>parts.find(x=>x.type===k)?.value||'';
 return p('year')+'-'+p('month')+'-'+p('day');
};
const shift=(day:string,days:number)=>new Date(Date.parse(day+'T00:00:00Z')+days*86400000).toISOString().slice(0,10);
const validPeriod=(p:Period)=>Number.isFinite(Date.parse(p?.startUtc))&&Number.isFinite(Date.parse(p?.endUtc))&&
 Number.isInteger(p?.value?.number)&&p.value.number>=1&&p.value.number<=27;

const periodMemo=new Map<string,Period[]>();
async function periods(date:string):Promise<Period[]|null>{
 const known=periodMemo.get(date);
 if(known)return known;
 try{
  const response=await fetch(origin()+'/api/v1/panchanga/day?'+query({date}),{next:{revalidate:86400},signal:AbortSignal.timeout(20000)});
  if(!response.ok)return null;
  const list=(await response.json() as {date?:string;periods?:{nakshatra?:Period[]}});
  const rows=list?.periods?.nakshatra;
  if(list?.date!==date||!Array.isArray(rows)||rows.length===0||!rows.every(validPeriod))return null;
  if(periodMemo.size>=40)periodMemo.delete(periodMemo.keys().next().value!);
  periodMemo.set(date,rows);
  return rows;
 }catch{return null;}
}
/** The nakshatra interval containing this instant, or null when no verified interval covers it. */
export async function moonNakshatraNow(now=new Date()):Promise<MoonNow|null>{
 const today=civil(now),at=now.getTime();
 for(const date of [today,shift(today,-1)]){
  const hit=(await periods(date))?.find(p=>Date.parse(p.startUtc)<=at&&at<Date.parse(p.endUtc));
  if(hit)return {number:hit.value.number,startUtc:hit.startUtc,endUtc:hit.endUtc};
 }
 return null;
}
const rangeMemo=new Map<string,SunriseStar[]>();
/** Nakshatra at each Kyiv sunrise for the next 30 days (sunrise snapshots, not all-day intervals). */
export async function sunriseNakshatras(now=new Date()):Promise<SunriseStar[]>{
 const start=civil(now),known=rangeMemo.get(start);
 if(known)return known;
 try{
  const response=await fetch(origin()+'/api/v1/panchanga/range?'+query({start,days:'30'}),{next:{revalidate:86400},signal:AbortSignal.timeout(30000)});
  if(!response.ok)return [];
  const data=await response.json() as {days?:{date:string;sunrise?:{nakshatra?:{number:number}}}[]};
  const rows=(data.days||[]).map(d=>({date:d.date,number:d.sunrise?.nakshatra?.number as number}))
   .filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&Number.isInteger(d.number)&&d.number>=1&&d.number<=27);
  if(rows.length===0)return [];
  if(rangeMemo.size>=4)rangeMemo.delete(rangeMemo.keys().next().value!);
  rangeMemo.set(start,rows);
  return rows;
 }catch{return [];}
}
export function moonMoment(utc:string,locale:'uk'|'en'):string{
 const at=new Date(utc);
 return locale==='uk'
  ?new Intl.DateTimeFormat('uk-UA',{timeZone:REF.timeZone,day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(at)+' за Києвом'
  :new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(at)+' UTC';
}
export function moonDate(day:string,locale:'uk'|'en'):string{
 return new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long'})
  .format(new Date(day+'T12:00:00Z'));
}
