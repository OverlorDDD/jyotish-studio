/** AE-P1 Swiss-backed Panchanga service: same natal Lahiri + historical Delta-T profile.
 * Pure Panchanga calculation is in jyotish-core; this adapter owns astronomy and clocks.
 */
import {spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {jhora8SiderealLongitude,localToUTC} from '../../../packages/jyotish-core/src/index.ts';
import {jhora8HistoricalJulianDay,JHORA8_DELTA_T_GRID_ID} from '../../../packages/jyotish-core/src/jhora8-delta-t-grid.ts';
import {buildPanchangaSunrise,type SunMoonAt} from '../../../packages/jyotish-core/src/panchanga.ts';
import {assertSwissReturnFlags} from './swiss-backend-policy.ts';
import {validLocalDay,validTimeZone,localToday} from './personal-transits.ts';

export const PANCHANGA_ASTRONOMY_PROFILE='JHora8-20201-mean-Lahiri / '+JHORA8_DELTA_T_GRID_ID+' / verified SWIEPH';
type Location={date:string;timeZone:string;latitude:number;longitude:number};
const isoDay=(iso:string,zone:string)=>{
 const parts=new Intl.DateTimeFormat('en-US',{
  timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'
 }).formatToParts(new Date(iso));
 const read=(k:string)=>parts.find(p=>p.type===k)?.value||'';
 return read('year')+'-'+read('month')+'-'+read('day');
};
export function validatePanchangaLocation(input:Partial<Location>):Location{
 const zone=input.timeZone??'Europe/Kyiv';
 const day=input.date??localToday(zone);
 const lat=input.latitude??50.4501,lon=input.longitude??30.5234;
 if(!validTimeZone(zone)||!validLocalDay(day)||day<'1900-01-01'||day>'2099-12-31')
  throw Error('Date must be 1900–2099 and time zone a valid IANA identifier');
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<=-90||lat>=90||lon< -180||lon>180)
  throw Error('Invalid latitude/longitude');
 return {date:day,timeZone:zone,latitude:lat,longitude:lon};
}
function riseSet(location:Location){
 const {date,timeZone,latitude,longitude}=location;
 const noonUtc=localToUTC(date,'12:00',timeZone);
 const script=resolve(dirname(fileURLToPath(import.meta.url)),'../../../tools/panchanga-sunrise.py');
 const exe=process.env.PYTHON_BIN||(process.platform==='win32'?'py':'python3');
 const args=[...(exe==='py'?['-3']:[]),script];
 const processResult=spawnSync(exe,args,{input:JSON.stringify({noonUtc,latitude,longitude}),
  encoding:'utf8',timeout:15000,maxBuffer:24000,windowsHide:true});
 if(processResult.status!==0)
  throw Error('Local sunrise unavailable; install pyswisseph and official Swiss ephemeris files. '+(processResult.error?.message||''));
 let data:{rise:string[];set:string[];method:string};
 try{data=JSON.parse(processResult.stdout);}catch{throw Error('Invalid Swiss rise/set response');}
 if(!Array.isArray(data.rise)||!Array.isArray(data.set)||data.rise.length<2)throw Error('Incomplete sunrise source');
 const nextDay=new Date(Date.parse(date+'T00:00:00Z')+86400000).toISOString().slice(0,10);
 const find=(items:string[],wanted:string)=>items.find(iso=>isoDay(iso,timeZone)===wanted);
 const sunriseUtc=find(data.rise,date),nextSunriseUtc=find(data.rise,nextDay);
 const sunsetUtc=find(data.set,date);
 if(!sunriseUtc||!nextSunriseUtc||!sunsetUtc)throw Error('Sunrise/sunset not found for local day (polar regions unsupported)');
 return {sunriseUtc,nextSunriseUtc,sunsetUtc,sunriseMethod:data.method};
}
export async function createPanchangaSunMoonAt():Promise<SunMoonAt>{
 const swiss=await import('@swisseph/node');
 swiss.setSiderealMode(swiss.SiderealMode.Lahiri);
 const flags=swiss.CalculationFlag.SwissEphemeris|swiss.CalculationFlag.Speed|65536;
 const cache=new Map<number,{sun:number;moon:number}>();
 return (ms:number)=>{
  const key=Math.floor(ms);const hit=cache.get(key);if(hit)return hit;
  const jd=key/86400000+2440587.5;
  const year=new Date(key).getUTCFullYear();
  const effectiveJd=year>=1900&&year<=2200?jhora8HistoricalJulianDay(jd):jd;
  const sun=swiss.calculatePosition(effectiveJd,swiss.Planet.Sun,flags);
  const moon=swiss.calculatePosition(effectiveJd,swiss.Planet.Moon,flags);
  assertSwissReturnFlags(sun.flags,'Panchanga.Sun');
  assertSwissReturnFlags(moon.flags,'Panchanga.Moon');
  const positions={sun:jhora8SiderealLongitude(sun.longitude),moon:jhora8SiderealLongitude(moon.longitude)};
  if(cache.size>640)cache.clear();
  cache.set(key,positions);return positions;
 };
}
export async function calculatePanchangaDay(unsafe:Partial<Location>){
 const location=validatePanchangaLocation(unsafe);
 const rise=riseSet(location);
 const at=await createPanchangaSunMoonAt();
 const result=buildPanchangaSunrise(location.date,rise.sunriseUtc,rise.nextSunriseUtc,at);
 // Astronomical Events v1: sunrise/sunset and geocentric 0°/180° lunations.
 // These are not eclipse predictions; lunar latitude is not part of the test.
 const astronomicalEvents=[
  {type:'sunrise',atUtc:rise.sunriseUtc},
  {type:'sunset',atUtc:rise.sunsetUtc},
  ...result.changes.filter(x=>x.kind==='tithi'&&(x.nextIndex===1||x.nextIndex===16))
   .map(x=>({type:x.nextIndex===1?'new_moon':'full_moon',atUtc:x.atUtc}))
 ].sort((a,b)=>a.atUtc.localeCompare(b.atUtc));
 return {...result,astronomicalEvents,location:{timeZone:location.timeZone,latitude:location.latitude,longitude:location.longitude},
  sunsetUtc:rise.sunsetUtc,astronomyProfile:PANCHANGA_ASTRONOMY_PROFILE,
  sunriseMethod:rise.sunriseMethod,
  methodology:{referenceFrame:'Lahiri sidereal, apparent geocentric Sun & Moon',
   boundaryResolutionSeconds:1,observations:'Five angas at local sunrise; subsequent transitions independently located',
   historicalCompatibility:'JHora 8 Swiss 2.02.01 Delta-T/Lahiri profile',
   referenceCertification:'Panchanga times require separate independent Drik comparison; JQA-3 natal certificate does not certify them'}};
}
