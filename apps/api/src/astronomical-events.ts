/** AE-P5: stateless, bounded geocentric events from the existing Swiss/Lahiri pipeline. */
import {localToUTC} from '../../../packages/jyotish-core/src/index.ts';
import {ASTRONOMICAL_EVENTS_VERSION,findAstronomicalEvents} from
 '../../../packages/jyotish-core/src/astronomical-events.ts';
import {createVerifiedSiderealPlanetAt,PANCHANGA_ASTRONOMY_PROFILE} from './panchanga.ts';
import {validLocalDay,validTimeZone,localToday} from './personal-transits.ts';

const MAX_DAYS=30,DAY_MS=86400000;
export type EventSearch={start?:string;days?:number;timeZone?:string};
export function validateEventSearch(input:EventSearch){
 const timeZone=input.timeZone??'Europe/Kyiv';
 if(!validTimeZone(timeZone))throw Error('A valid IANA time zone is required');
 const start=input.start??localToday(timeZone);
 if(!validLocalDay(start)||start<'1900-01-01'||start>'2099-11-30')
  throw Error('Astronomical start date must be 1900–2099');
 const days=input.days??7;
 if(!Number.isSafeInteger(days)||days<1||days>MAX_DAYS)
  throw Error('Event search must cover 1–30 local days');
 const end=new Date(Date.parse(start+'T00:00:00Z')+days*DAY_MS).toISOString().slice(0,10);
 if(end>'2099-12-31')throw Error('Astronomical date range outside verified era');
 const startUtc=localToUTC(start,'00:00',timeZone);
 const endUtc=localToUTC(end,'00:00',timeZone);
 if(Date.parse(endUtc)-Date.parse(startUtc)>31*DAY_MS)
  throw Error('Astronomical time range exceeds bounded interval');
 return {start,days,timeZone,end,startUtc,endUtc};
}
const localDate=(iso:string,zone:string)=>{
 const parts=new Intl.DateTimeFormat('en-US',{
  timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'
 }).formatToParts(new Date(iso));
 const part=(kind:string)=>parts.find(p=>p.type===kind)?.value||'';
 return part('year')+'-'+part('month')+'-'+part('day');
};
const cache=new Map<string,{createdAt:number;pending:Promise<Awaited<ReturnType<typeof computeEvents>>>}>();
async function computeEvents(input:ReturnType<typeof validateEventSearch>){
 const at=await createVerifiedSiderealPlanetAt();
 const events=findAstronomicalEvents(Date.parse(input.startUtc),Date.parse(input.endUtc),at);
 return {version:ASTRONOMICAL_EVENTS_VERSION,
  startDate:input.start,endDateExclusive:input.end,days:input.days,
  startUtc:input.startUtc,endUtc:input.endUtc,timeZone:input.timeZone,
  referenceFrame:'APPARENT_GEOCENTRIC_SIDEREAL_LAHIRI',
  astronomyProfile:PANCHANGA_ASTRONOMY_PROFILE,
  eventTimeResolutionSeconds:1,
  independentEventTimeCertified:false,
  phaseConvention:'Geocentric ecliptic Sun-Moon elongation: 0°,90°,180°,270°; not an eclipse test',
  eventKinds:['new_moon','first_quarter','full_moon','last_quarter','sidereal_ingress',
   'retrograde_station','direct_station'],
  events:events.map(event=>({...event,localDate:localDate(event.atUtc,input.timeZone)}))
 };
}
export async function astronomicalEventsWindow(unsafe:EventSearch){
 const input=validateEventSearch(unsafe);
 const key=input.start+'|'+input.days+'|'+input.timeZone;
 const now=Date.now();
 let entry=cache.get(key);
 if(!entry||now-entry.createdAt>5*60*1000){
  entry={createdAt:now,pending:computeEvents(input)};
  if(cache.size>=12)cache.delete(cache.keys().next().value!);
  cache.set(key,entry);
  entry.pending.catch(()=>{if(cache.get(key)===entry)cache.delete(key);});
 }
 return await entry.pending;
}
