/** AE-P1: deterministic five-anga Panchanga. No HTTP, timezone or ephemeris dependency.
 * Caller must provide validated, consistently sidereal Swiss Sun/Moon positions.
 * Boundaries are found from fresh samples, never inferred from daily snapshots.
 */
import {NAKSHATRAS} from './index.ts';

export const PANCHANGA_VERSION='panchanga-five-anga-v1';
export type PanchangaAngles={sun:number;moon:number};
export type AngaKind='tithi'|'nakshatra'|'yoga'|'karana';
export type SunMoonAt=(unixMs:number)=>PanchangaAngles;
const HOUR=3600000, STEP=3*HOUR, LIMIT=60*HOUR;
const NAK=360/27;
const mod=(x:number,n=360)=>((x%n)+n)%n;
export const YOGAS=[
 'Vishkumbha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma',
 'Dhriti','Shoola','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra',
 'Siddhi','Vyatipata','Variyana','Parigha','Shiva','Siddha','Sadhya',
 'Shubha','Shukla','Brahma','Indra','Vaidhriti'
] as const;
export const MOVABLE_KARANAS=['Bava','Balava','Kaulava','Taitila','Garaja','Vanija','Vishti'] as const;
export const VARAS=['Ravivara','Somavara','Mangalavara','Budhavara','Guruvara','Shukravara','Shanivara'] as const;
export function karanaName(zeroBasedSlot:number):string{
 if(!Number.isInteger(zeroBasedSlot)||zeroBasedSlot<0||zeroBasedSlot>=60)throw Error('Invalid karana slot');
 if(zeroBasedSlot===0)return 'Kimstughna';
 if(zeroBasedSlot===57)return 'Shakuni';
 if(zeroBasedSlot===58)return 'Chatushpada';
 if(zeroBasedSlot===59)return 'Naga';
 return MOVABLE_KARANAS[(zeroBasedSlot-1)%7];
}
function angles(value:PanchangaAngles){
 if(!value||!Number.isFinite(value.sun)||!Number.isFinite(value.moon)||
   value.sun<0||value.sun>=360||value.moon<0||value.moon>=360)
   throw Error('Verified Sun/Moon longitudes in [0,360) required');
 return value;
}
export function angaPosition(kind:AngaKind,positions:PanchangaAngles){
 const {sun,moon}=angles(positions);
 switch(kind){
  case 'tithi':return {angle:mod(moon-sun),width:12,total:30};
  case 'nakshatra':return {angle:moon,width:NAK,total:27};
  case 'yoga':return {angle:mod(sun+moon),width:NAK,total:27};
  case 'karana':return {angle:mod(moon-sun),width:6,total:60};
 }
}
export function angaIndex(kind:AngaKind,positions:PanchangaAngles):number{
 const v=angaPosition(kind,positions);
 return Math.min(v.total-1,Math.floor(v.angle/v.width));
}
export function fiveAngas(positions:PanchangaAngles,weekday:number){
 if(!Number.isInteger(weekday)||weekday<0||weekday>6)throw Error('Invalid sunrise weekday');
 const t=angaIndex('tithi',positions),n=angaIndex('nakshatra',positions);
 const y=angaIndex('yoga',positions),k=angaIndex('karana',positions);
 const p=angaPosition('tithi',positions);
 return {
  tithi:{number:t+1,paksha:t<15?'Shukla':'Krishna',numberWithinPaksha:t%15+1},
  nakshatra:{number:n+1,name:NAKSHATRAS[n],pada:Math.min(4,Math.floor(mod(positions.moon,NAK)/(NAK/4))+1)},
  vara:{number:weekday+1,name:VARAS[weekday]},
  yoga:{number:y+1,name:YOGAS[y]},
  karana:{slot:k+1,name:karanaName(k)},
  elongationDegrees:p.angle,phase: p.angle<180?'waxing':'waning'
 };
}
/** Find the previous/next crossing, using 3-hour bracketing then 1-second
 * bisection; all evaluations come from the SAME ephemeris adapter.
 * No fixed day interpolations; two transitions in a sunrise day are possible.
 */
export function findAngaBoundary(startMs:number,kind:AngaKind,at:SunMoonAt,direction:1|-1){
 if(!Number.isFinite(startMs)||!Number.isInteger(startMs)||Math.abs(startMs)>8.64e15)
  throw Error('Invalid UTC epoch');
 const first=angaIndex(kind,at(startMs));
 let outer=startMs,found=false;
 for(let delta=STEP;delta<=LIMIT;delta+=STEP){
  const candidate=startMs+direction*delta;
  if(angaIndex(kind,at(candidate))!==first){outer=candidate;found=true;break;}
 }
 if(!found)throw Error('No '+kind+' transition within 60 hours: astronomical source unavailable or inconsistent');
 let lo=Math.min(startMs,outer),hi=Math.max(startMs,outer);
 for(let j=0;j<40&&hi-lo>1000;j++){
  const mid=Math.floor((lo+hi)/2);
  const same=angaIndex(kind,at(mid))===first;
  // Forward crossing: near side is lo. Backward crossing: near side is hi.
  if(direction===1){if(same)lo=mid;else hi=mid;}
  else {if(same)hi=mid;else lo=mid;}
 }
 return new Date(direction===1?hi:hi).toISOString();
}
export function buildPanchangaSunrise(date:string,sunriseUtc:string,nextSunriseUtc:string,at:SunMoonAt){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||
   new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('Invalid Panchanga date');
 const begin=Date.parse(sunriseUtc),end=Date.parse(nextSunriseUtc);
 if(!Number.isFinite(begin)||!Number.isFinite(end)||end-begin<20*HOUR||end-begin>28*HOUR)
  throw Error('Invalid sunrise-to-sunrise interval');
 const dayOfWeek=new Date(date+'T12:00:00Z').getUTCDay();
 const sunrise=fiveAngas(at(begin),dayOfWeek);
 const bounds={} as Record<AngaKind,{startUtc:string;endUtc:string}>;
 for(const kind of ['tithi','nakshatra','yoga','karana'] as const){
  bounds[kind]={
   startUtc:findAngaBoundary(begin,kind,at,-1),
   endUtc:findAngaBoundary(begin,kind,at,1)
  };
  if(Date.parse(bounds[kind].startUtc)>begin||Date.parse(bounds[kind].endUtc)<=begin)
   throw Error('Invalid '+kind+' boundaries');
 }
 // Enumerate ALL changes during the sunrise day, not just the first one.
 const changes: {kind:AngaKind;atUtc:string;nextIndex:number}[]=[];
 for(const kind of ['tithi','nakshatra','yoga','karana'] as const){
  let cursor=begin;
  for(let i=0;i<8;i++){
   const t=findAngaBoundary(cursor,kind,at,1),ms=Date.parse(t);
   if(ms>=end)break;
   if(ms<=cursor)throw Error('Non-progressing '+kind+' transition');
   changes.push({kind,atUtc:t,nextIndex:angaIndex(kind,at(ms+2000))+1});
   cursor=ms+2000;
  }
 }
 changes.sort((a,b)=>a.atUtc.localeCompare(b.atUtc)||a.kind.localeCompare(b.kind));
 return {version:PANCHANGA_VERSION,date,sunriseUtc,nextSunriseUtc,
  observation:'GEOCENTRIC_SIDEREAL_SUN_MOON_AT_LOCAL_SUNRISE',
  sunrise,boundaries:bounds,changes};
}
