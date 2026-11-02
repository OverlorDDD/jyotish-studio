/** P2.1: shared, bounded sunrise snapshots for 7-day and month calendar views.
 * Not a substitute for the detailed /day endpoint's exact anga transitions.
 */
import {createVerifiedSiderealPlanetAt,PANCHANGA_ASTRONOMY_PROFILE,validatePanchangaLocation} from './panchanga.ts';
import {riseSetBatch} from './vedic-calendar.ts';
import {fiveAngas,PANCHANGA_VERSION} from '../../../packages/jyotish-core/src/panchanga.ts';
const DAY=86400000,TTL=5*60*1000;
export type RangeInput={start?:string;days?:number;timeZone?:string;latitude?:number;longitude?:number};
const cache=new Map<string,{at:number;promise:ReturnType<typeof compute>}>();
function localDay(iso:string,zone:string){
 const parts=new Intl.DateTimeFormat('en',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(iso));
 const part=(t:string)=>parts.find(p=>p.type===t)?.value||'';
 return part('year')+'-'+part('month')+'-'+part('day');
}
export function validatePanchangaRange(input:RangeInput){
 const location=validatePanchangaLocation({date:input.start,timeZone:input.timeZone,
  latitude:input.latitude,longitude:input.longitude});
 const days=input.days??7;
 if(!Number.isSafeInteger(days)||days<1||days>31)throw Error('Panchanga range must contain 1–31 days');
 const end=Date.parse(location.date+'T00:00:00Z')+days*DAY;
 if(!Number.isFinite(end)||new Date(end-DAY).getUTCFullYear()>2099)
  throw Error('Panchanga range exceeds supported civil year');
 return {...location,days};
}
async function compute(v:ReturnType<typeof validatePanchangaRange>){
 const batch=await riseSetBatch({start:v.date,days:v.days,timeZone:v.timeZone,
  latitude:v.latitude,longitude:v.longitude});
 const sunrises=new Map<string,string>(),sunsets=new Map<string,string>();
 for(const s of batch.events.sunrise)sunrises.set(localDay(s,v.timeZone),s);
 for(const s of batch.events.sunset)sunsets.set(localDay(s,v.timeZone),s);
 const at=await createVerifiedSiderealPlanetAt();
 const days=[];
 for(let i=0;i<v.days;i++){
  const date=new Date(Date.parse(v.date+'T00:00:00Z')+i*DAY).toISOString().slice(0,10);
  const next=new Date(Date.parse(date+'T00:00:00Z')+DAY).toISOString().slice(0,10);
  const sunriseUtc=sunrises.get(date),sunsetUtc=sunsets.get(date),nextSunriseUtc=sunrises.get(next);
  if(!sunriseUtc||!sunsetUtc||!nextSunriseUtc)throw Error('Incomplete verified observer sunrise/sunset coverage');
  const p=at(Date.parse(sunriseUtc),'Sun'),m=at(Date.parse(sunriseUtc),'Moon');
  const weekday=new Date(date+'T12:00:00Z').getUTCDay();
  days.push({date,sunriseUtc,sunsetUtc,nextSunriseUtc,
   sunrise:fiveAngas({sun:p.longitude,moon:m.longitude},weekday)});
 }
 return {version:'panchanga-range-v1',panchangaCoreVersion:PANCHANGA_VERSION,
  scope:'five-angas-at-local-sunrise-not-all-day-intervals',
  startDate:v.date,observer:{timeZone:v.timeZone,latitude:v.latitude,longitude:v.longitude},
  astronomyProfile:PANCHANGA_ASTRONOMY_PROFILE,sourceMethod:batch.method,
  independentPanchangaTimingCertified:false,days};
}
export async function panchangaRange(input:RangeInput){
 const v=validatePanchangaRange(input);
 const key=[PANCHANGA_VERSION,v.date,v.days,v.timeZone,v.latitude,v.longitude].join('|');
 const now=Date.now(),hit=cache.get(key);
 if(hit&&now-hit.at<TTL)return hit.promise;
 const promise=compute(v);
 if(cache.size>=8)cache.delete(cache.keys().next().value!);
 cache.set(key,{at:now,promise});
 promise.catch(()=>{if(cache.get(key)?.promise===promise)cache.delete(key)});
 return await promise;
}
