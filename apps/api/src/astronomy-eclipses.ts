/** AE-P6 observer eclipse searches via official Swiss Ephemeris algorithms.
 * Ephemeris operation is bounded, fail-closed, and location is not persisted.
 */
import {spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {localToUTC} from '../../../packages/jyotish-core/src/index.ts';
import {localToday,validLocalDay,validTimeZone} from './personal-transits.ts';
export type EclipseRequest={start?:string;days?:number;timeZone?:string;latitude?:number;longitude?:number;altitudeM?:number};
const DAY_MS=86400000;
export function validateEclipseRequest(v:EclipseRequest){
 const timeZone=v.timeZone??'Europe/Kyiv';
 if(!validTimeZone(timeZone))throw Error('Valid IANA time zone required');
 const start=v.start??localToday(timeZone),days=v.days??366;
 if(!validLocalDay(start)||start<'1900-01-01'||start>'2098-12-31')throw Error('Invalid eclipse date (1900–2098)');
 if(!Number.isSafeInteger(days)||days<1||days>366)throw Error('Eclipse horizon must be 1–366 local days');
 const latitude=v.latitude??50.4501,longitude=v.longitude??30.5234,altitudeM=v.altitudeM??0;
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||!Number.isFinite(altitudeM)||
 latitude<=-90||latitude>=90||longitude<-180||longitude>180||altitudeM<0||altitudeM>5000)
  throw Error('Invalid eclipse observing location');
 const end=new Date(Date.parse(start+'T00:00:00Z')+days*DAY_MS).toISOString().slice(0,10);
 if(end>'2099-12-31')throw Error('Date outside configured ephemeris range');
 const startUtc=localToUTC(start,'00:00',timeZone),endUtc=localToUTC(end,'00:00',timeZone);
 return {start,days,end,timeZone,startUtc,endUtc,latitude,longitude,altitudeM};
}
type Validated=ReturnType<typeof validateEclipseRequest>;
type Eclipses={source:string;independentVisibilityCertified:boolean;
 events:{type:'solar'|'lunar';eclipseKind:string;maximumUtc:string;
  visibleHere:boolean;localMaximumUtc:string|null}[]};
const cache=new Map<string,{at:number,promise:Promise<ReturnType<typeof eclipseWindow>>}>();
async function eclipseWindow(v:Validated){
 const script=resolve(dirname(fileURLToPath(import.meta.url)),'../../../tools/astronomy-eclipses.py');
 const exe=process.env.PYTHON_BIN||(process.platform==='win32'?'py':'python3');
 const cmd=spawnSync(exe,[...(exe==='py'?['-3']:[]),script],{
  input:JSON.stringify(v),encoding:'utf8',timeout:25000,maxBuffer:512000,windowsHide:true
 });
 if(cmd.status!==0)throw Error('Swiss eclipse backend failed: '+(cmd.stderr||cmd.error?.message||'unavailable').slice(0,200));
 let parsed:Eclipses;
 try{parsed=JSON.parse(cmd.stdout) as Eclipses;}
 catch{throw Error('Invalid Swiss eclipse response');}
 if(!Array.isArray(parsed.events)||parsed.events.length>24||
  parsed.events.some(e=>!['solar','lunar'].includes(e.type)||!Number.isFinite(Date.parse(e.maximumUtc))||
   typeof e.visibleHere!=='boolean'||(e.localMaximumUtc!==null&&
    !Number.isFinite(Date.parse(e.localMaximumUtc)))))
  throw Error('Unverified eclipse data from Python');
 const start=Date.parse(v.startUtc),end=Date.parse(v.endUtc);
 if(parsed.events.some(e=>Date.parse(e.maximumUtc)<start||Date.parse(e.maximumUtc)>=end))
  throw Error('Eclipse instant outside query window');
 return {version:'verified-swiss-eclipses-v1',startDate:v.start,endDateExclusive:v.end,
  timeZone:v.timeZone,days:v.days,observer:{latitude:v.latitude,longitude:v.longitude,altitudeM:v.altitudeM},
  visibilityConvention:'Swiss local eclipse functions, geometric horizon, nominal atmospheric model',
  independentVisibilityCertified:false,source:parsed.source,events:parsed.events};
}
export async function observerEclipses(input:EclipseRequest){
 const validated=validateEclipseRequest(input);
 const key=[validated.start,validated.days,validated.timeZone,validated.latitude,validated.longitude,validated.altitudeM].join('|');
 const now=Date.now(),existing=cache.get(key);
 if(existing&&now-existing.at<5*60*1000)return existing.promise;
 const promise=eclipseWindow(validated);
 if(cache.size>=8)cache.delete(cache.keys().next().value!);
 cache.set(key,{at:now,promise});
 promise.catch(()=>{if(cache.get(key)?.promise===promise)cache.delete(key);});
 return promise;
}
