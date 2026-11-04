/** P2.4: bounded browser-local single-flight cache for the public observer-day
 * overview. React Strict Mode replays mount effects in development, and a user
 * may return to the same date. Share one request; never store personal data.
 * Failed requests are evicted, refresh attempts use a new explicit key.
 */
import type {CalendarSystem,GuideOverview,SourcePoint} from './panchanga-integration';
const TTL=90_000,MAX=8;
type Entry={created:number;pending:Promise<GuideOverview>};
const cache=new Map<string,Entry>();
export function fetchDayOverview(point:SourcePoint,monthSystem:CalendarSystem,attempt=0){
 const qs=new URLSearchParams({start:point.date,days:'1',zone:point.timeZone,
  latitude:point.latitude,longitude:point.longitude,monthSystem});
 const key=qs.toString()+'#'+attempt,now=Date.now();
 const previous=cache.get(key);
 if(previous&&now-previous.created<TTL)return previous.pending;
 // Prune stale promises before adding new entries. Never cache errors.
 for(const [k,value] of cache)if(now-value.created>=TTL)cache.delete(k);
 if(cache.size>=MAX)cache.delete(cache.keys().next().value!);
 const pending=fetch('/api/v1/vedic-calendar/overview?'+qs,{cache:'no-store'})
  .then(async r=>{
   if(!r.ok)throw Error('Swiss overview '+r.status);
   return await r.json() as GuideOverview;
  });
 const entry={created:now,pending};
 cache.set(key,entry);
 pending.catch(()=>{if(cache.get(key)===entry)cache.delete(key)});
 return pending;
}
