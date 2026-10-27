/** AE-P7 live Swiss service: no static holiday dates, no natal/user reads.
 * Seven observer-local civil days; batch rise/set in a nonblocking Python worker.
 * Festival candidates and lunar month names are independent of raw ephemerides.
 */
import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {localToUTC} from '../../../packages/jyotish-core/src/index.ts';
import {validLocalDay,validTimeZone,localToday} from './personal-transits.ts';
import {createVerifiedSiderealPlanetAt,PANCHANGA_ASTRONOMY_PROFILE} from './panchanga.ts';
import {daytimeKalas} from '../../../packages/jyotish-core/src/daytime-kalas.ts';
import {VEDIC_CALENDAR_VERSION,tithiNumber,monthAtSunrise,
 sunriseObservances,namedFestivalCandidates,solarSankrantis,abhijitMuhurta,type MonthSystem,
 type NewMoonRecord} from '../../../packages/jyotish-core/src/vedic-calendar.ts';
const DAY=86400000,HOUR=3600000;
export type VedicCalendarInput={start?:string;days?:number;timeZone?:string;
 latitude?:number;longitude?:number;monthSystem?:MonthSystem};
const localDate=(utc:string,zone:string)=>{
 const parts=new Intl.DateTimeFormat('en-US',{
  timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'
 }).formatToParts(new Date(utc));
 const get=(k:string)=>parts.find(p=>p.type===k)?.value||'';
 return get('year')+'-'+get('month')+'-'+get('day');
};
export function validateVedicCalendar(v:VedicCalendarInput){
 const timeZone=v.timeZone??'Europe/Kyiv';
 if(!validTimeZone(timeZone))throw Error('Valid IANA time zone required');
 const start=v.start??localToday(timeZone),days=v.days??7;
 if(!validLocalDay(start)||start<'1900-01-01'||start>'2099-11-01')
  throw Error('Gregorian date outside verified 1900–2099 period');
 if(!Number.isSafeInteger(days)||days<1||days>7)throw Error('Calendar limited to 1–7 local dates');
 const latitude=v.latitude??50.4501,longitude=v.longitude??30.5234;
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||
 latitude<=-90||latitude>=90||longitude<-180||longitude>180)throw Error('Invalid observer coordinates');
 const monthSystem=v.monthSystem??'amanta';
 if(monthSystem!=='amanta'&&monthSystem!=='purnimanta')throw Error('Select amanta or purnimanta');
 const end=new Date(Date.parse(start+'T00:00:00Z')+days*DAY).toISOString().slice(0,10);
 return {start,days,timeZone,latitude,longitude,monthSystem,end};
}
let activeWorkers=0;
async function riseSetBatch(v:ReturnType<typeof validateVedicCalendar>){
 if(activeWorkers>=2)throw Error('Vedic calendar worker capacity exceeded');
 activeWorkers++;
 try{
  const script=resolve(dirname(fileURLToPath(import.meta.url)),'../../../tools/vedic-calendar-rises.py');
  const exe=process.env.PYTHON_BIN||(process.platform==='win32'?'py':'python3');
  const json=JSON.stringify({localStartNoonUtc:localToUTC(v.start,'12:00',v.timeZone),
   latitude:v.latitude,longitude:v.longitude,days:v.days});
  return await new Promise<{events:{sunrise:string[];sunset:string[]};method:string}>((resolvePromise,reject)=>{
   const child=spawn(exe,[...(exe==='py'?['-3']:[]),script],{stdio:['pipe','pipe','pipe'],windowsHide:true});
   let out='',error='',settled=false;
   const timeout=setTimeout(()=>{child.kill();done(new Error('Swiss observer batch timed out'));},20000);
   function done(err?:Error){
    if(settled)return;settled=true;clearTimeout(timeout);
    if(err){reject(err);return;}
    try{
     const parsed=JSON.parse(out) as {events:{sunrise:string[];sunset:string[]};method:string};
     if(!parsed.events||!Array.isArray(parsed.events.sunrise)||!Array.isArray(parsed.events.sunset)||
      !parsed.method||parsed.events.sunrise.length>20||parsed.events.sunset.length>20)
      throw Error('Invalid Swiss sunrise/sunset batch');
     resolvePromise(parsed);
    }catch(e){reject(e);}
   }
   child.on('error',(err:Error)=>done(err));
   child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
   child.stdout.on('data',(part:string)=>{
    out+=part;if(out.length>32000){child.kill();done(new Error('Oversized rise/set data'));}
   });
   child.stderr.on('data',(part:string)=>{error=(error+part).slice(-1000);});
   child.stdin.on('error',(err:Error)=>done(err));
   child.on('close',(code:number|null)=>done(code===0?undefined:new Error('Swiss rise/set batch unavailable: '+error.slice(0,200))));
   child.stdin.end(json);
  });
 }finally{activeWorkers--;}
}
function findNewMoons(firstMs:number,lastMs:number,at:(ms:number)=>{sun:number;moon:number}):NewMoonRecord[]{
 // Source samples < 6h apart and result bracketed to 1 second.
 // The 360° wrap at geocentric conjunction is treated explicitly.
 const step=6*HOUR,result:NewMoonRecord[]=[];
 const elongation=(ms:number)=>{
  const p=at(ms);return ((p.moon-p.sun)%360+360)%360;
 };
 let before=elongation(firstMs);
 for(let left=firstMs;left<lastMs;left+=step){
  const right=Math.min(lastMs,left+step),after=elongation(right);
  if(before>300&&after<60){
   let lo=left,hi=right;
   for(let j=0;j<42&&hi-lo>1000;j++){
    const mid=Math.floor((lo+hi)/2);
    if(elongation(mid)>180)lo=mid;else hi=mid;
   }
   result.push({atUtc:new Date(hi).toISOString(),sunLongitude:at(hi).sun});
  }else if(Math.abs(after-before)>180)
   throw Error('Unphysical synodic longitude discontinuity near New Moon');
  before=after;
 }
 if(result.length<3)throw Error('Incomplete verified New Moon month boundary coverage');
 return result;
}
const cache=new Map<string,{created:number;promise:ReturnType<typeof compute>}>();
async function compute(v:ReturnType<typeof validateVedicCalendar>){
 const batch=await riseSetBatch(v);
 const startMs=Date.parse(localToUTC(v.start,'00:00',v.timeZone));
 const endMs=Date.parse(localToUTC(v.end,'00:00',v.timeZone));
 const sunMoon=await createVerifiedSiderealPlanetAt();
 const at=(ms:number)=>({sun:sunMoon(ms,'Sun').longitude,moon:sunMoon(ms,'Moon').longitude});
 const moons=findNewMoons(startMs-40*DAY,endMs+75*DAY,at);
 const sunriseMap=new Map<string,string>(),sunsetMap=new Map<string,string>();
 for(const s of batch.events.sunrise){
  if(!Number.isFinite(Date.parse(s)))throw Error('Invalid Swiss rise UTC instant');
  sunriseMap.set(localDate(s,v.timeZone),s);
 }
 for(const s of batch.events.sunset){
  if(!Number.isFinite(Date.parse(s)))throw Error('Invalid Swiss set UTC instant');
  sunsetMap.set(localDate(s,v.timeZone),s);
 }
 const days=[];
 for(let i=0;i<v.days;i++){
  const date=new Date(Date.parse(v.start+'T00:00:00Z')+i*DAY).toISOString().slice(0,10);
  const nextDate=new Date(Date.parse(date+'T00:00:00Z')+DAY).toISOString().slice(0,10);
  const sunriseUtc=sunriseMap.get(date),sunsetUtc=sunsetMap.get(date),nextSunriseUtc=sunriseMap.get(nextDate);
  if(!sunriseUtc||!sunsetUtc||!nextSunriseUtc)throw Error('Swiss rise/set missing for observer-local date');
  const sunrise=Date.parse(sunriseUtc),sunset=Date.parse(sunsetUtc);
  const tithi=tithiNumber(at(sunrise));
  const weekday=new Date(date+'T12:00:00Z').getUTCDay();
  const sample={date,sunriseUtc,sunsetUtc,nextSunriseUtc,tithi,
   arunodayaTithi:tithiNumber(at(sunrise-96*60000)),
   pradoshaTithi:tithiNumber(at(sunset)),
   pradoshaEndTithi:tithiNumber(at(sunset+90*60000)),
   sunLongitude:at(sunrise).sun};
  const moonMonth=monthAtSunrise(sunriseUtc,tithi,moons,v.monthSystem);
  const observed=sunriseObservances(sample);
  observed.push(...namedFestivalCandidates({
   date,sunriseUtc,sunsetUtc,nextSunriseUtc,sunriseTithi:tithi,
   madhyahnaTithi:tithiNumber(at(Math.round((sunrise+sunset)/2))),
   sunsetTithi:sample.pradoshaTithi,
   nightMidTithi:tithiNumber(at(Math.round((sunset+Date.parse(nextSunriseUtc))/2))),
   amantaMonth:moonMonth.amantaName,monthStatus:moonMonth.lunarMonthStatus
  }));
  const windows={abhijit:abhijitMuhurta(sunriseUtc,sunsetUtc,weekday),
   daytimeKalas:daytimeKalas(sunriseUtc,sunsetUtc,weekday)};
  days.push({...sample,moonMonth,observances:observed,windows});
 }
 const solarChanges=solarSankrantis(startMs,endMs,ms=>at(ms).sun);
 for(const change of solarChanges){
  const date=localDate(change.atUtc,v.timeZone);
  const record=days.find(x=>x.date===date);
  if(record)record.observances.push({
   id:'sankranti',date,atUtc:change.atUtc,category:'astronomical_event',
   tradition:'sidereal_solar',
   rule:'Actual geocentric sidereal Sun 30° rashi ingress; ritual assignment may differ by local punyakala',
   metadata:{fromSign:change.fromSign,toSign:change.toSign}
  });
 }
 // The API and UI always expose events in actual UTC chronology, including
 // late-added solar Sankranti. Stable ordering makes cross-day comparisons
 // and calendar export deterministic without changing observance policy.
 for(const day of days){
  day.observances.sort((a,b)=>a.atUtc.localeCompare(b.atUtc)||a.id.localeCompare(b.id));
 }
 return {version:VEDIC_CALENDAR_VERSION,policy:'explicit-amanta-purnimanta-v1',
  scope:'calculated-observance-indications-not-definitive-religious-fasting-dates',
  observer:{latitude:v.latitude,longitude:v.longitude,timeZone:v.timeZone},
  startDate:v.start,endDateExclusive:v.end,days,monthSystem:v.monthSystem,
  astronomyProfile:PANCHANGA_ASTRONOMY_PROFILE,
  astronomicalTimeCertifiedByIndependentReference:false,
  observanceDayCertifiedByTradition:false,
  sourceMethod:batch.method,
  rules:{
   ekadashi:'Local sunrise candidate; arunodaya comparison 96 minutes before local sunrise, not full Smarta/Vaishnava/Parana adjudication',
   pradosha:'Trayodashi at sunset or 90min post-sunset',
   namedFestivals:'Sunrise, daylight midpoint, sunset or night midpoint indicators; no final regional fasting or puja priority rules',
   abhijit:'8th daytime muhurta of 15; Wednesday flagged for traditional caution',
   months:'New Moon-to-New Moon solar sign mapping, 0-ingress adhika, 2-ingress kshaya fail closed for month naming'
  }};
}
export async function vedicCalendarWindow(raw:VedicCalendarInput){
 const v=validateVedicCalendar(raw),key=[v.start,v.days,v.timeZone,v.latitude,v.longitude,v.monthSystem].join('|');
 const prev=cache.get(key),now=Date.now();
 if(prev&&now-prev.created<5*60000)return prev.promise;
 const promise=compute(v);
 if(cache.size>=8)cache.delete(cache.keys().next().value!);
 cache.set(key,{created:now,promise});
 promise.catch(()=>{if(cache.get(key)?.promise===promise)cache.delete(key);});
 return await promise;
}
