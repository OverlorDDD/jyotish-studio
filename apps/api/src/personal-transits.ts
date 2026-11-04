/** Personal transit observations, never invented event times or forecasts.
 * Planet positions use the SAME Swiss/Lahiri implementation as natal calculations.
 * One sample at 12:00 in the selected current IANA time zone; not an ingress instant.
 */
import {getEphemeris} from './ephemeris.ts';
import {localToUTC,nakshatraOf,signIndex,type EphemerisData} from '../../../packages/jyotish-core/src/index.ts';
const MS_DAY=86400000;
const nonPersonalCache=new Map<string,Promise<EphemerisData>>();
export const TRANSIT_METHOD='Swiss Ephemeris / Lahiri sidereal / local-noon-sample-v1';
export function validLocalDay(day:string){
 return /^\d{4}-\d{2}-\d{2}$/.test(day)&&!Number.isNaN(Date.parse(day+'T00:00:00Z'))&&
  new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day;
}
export function validTimeZone(zone:string){
 if(!zone||zone.length>64)return false;
 try{new Intl.DateTimeFormat('en',{timeZone:zone}).format(0);return true;}catch{return false;}
}
export function localToday(zone:string,when=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(when);
 const v=(key:string)=>parts.find(p=>p.type===key)!.value;
 return v('year')+'-'+v('month')+'-'+v('day');
}
export function calendarDays(start:string,count:7|30){
 if(!validLocalDay(start))throw Error('Invalid calendar start date');
 const base=Date.parse(start+'T00:00:00Z');
 return Array.from({length:count},(_,i)=>new Date(base+i*MS_DAY).toISOString().slice(0,10));
}
async function sampleEphemeris(utc:string){
 let cached=nonPersonalCache.get(utc);
 if(!cached){
  // Geocentric planet positions do not depend on the latitude/longitude used
  // solely to compute an unused rising point.
  const date=utc.slice(0,10),time=utc.slice(11,16);
  cached=getEphemeris({date,time,timeZone:'UTC',latitude:0,longitude:0});
  nonPersonalCache.set(utc,cached);
  if(nonPersonalCache.size>128)nonPersonalCache.delete(nonPersonalCache.keys().next().value!);
  cached.catch(()=>{if(nonPersonalCache.get(utc)===cached)nonPersonalCache.delete(utc);});
 }
 return cached;
}
export async function dailyTransit(day:string,zone:string,lagnaSign?:number|null,moonSign?:number|null){
 if(!validLocalDay(day)||!validTimeZone(zone))throw Error('Invalid local day or time zone');
 if((lagnaSign!=null&&(!Number.isInteger(lagnaSign)||lagnaSign<1||lagnaSign>12))||
  (moonSign!=null&&(!Number.isInteger(moonSign)||moonSign<1||moonSign>12)))throw Error('Invalid natal anchor');
 const utc=localToUTC(day,'12:00',zone);
 const eph=await sampleEphemeris(utc);
 const moon=eph.positions.find(p=>p.name==='Moon');
 if(!moon||!Number.isFinite(moon.longitude))throw Error('Swiss Moon unavailable');
 const nak=nakshatraOf(moon.longitude);
 const moonTransitSign=signIndex(moon.longitude)+1;
 const houseFrom=(origin:number,sign:number)=>((sign-origin+12)%12)+1;
 const planets=eph.positions.filter(p=>['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Rahu','Ketu'].includes(p.name)).map(p=>{
  const sign=signIndex(p.longitude)+1;
  return {name:p.name,sign,longitude:p.longitude,
   houseFromLagna:lagnaSign==null?null:houseFrom(lagnaSign,sign),
   houseFromMoon:moonSign==null?null:houseFrom(moonSign,sign)};
 });
 return {
  date:day,sampledAtUtc:utc,timeZone:zone,method:TRANSIT_METHOD,
  ephemerisBackend:eph.backend,
  personalized:lagnaSign!=null&&moonSign!=null,
  observationType:'SIDEREAL_GEOCENTRIC_POSITION_AT_LOCAL_NOON',
  moon:{longitude:moon.longitude,sign:moonTransitSign,nakshatra:nak.name,pada:nak.pada,
   houseFromLagna:lagnaSign==null?null:houseFrom(lagnaSign,moonTransitSign),
   houseFromMoon:moonSign==null?null:houseFrom(moonSign,moonTransitSign)},
  planets
 };
}
