/** P3.8.7 — one proven sunrise-day identity for public, natal and election layers.
 * Sources: P2.1 / P3.5 shared Swiss riseSetBatch; P3.8.5 native Swiss windows.
 * Unknown/unchecked election rules never imply favorable or unfavorable days.
 */
import {validateP35Private,type P35Days,type P35Personal,type P35Point,
 type P35Private} from './panchanga-p35-calendar.ts';
import type {P38ActivityId} from './panchanga-p38-decision';

export type P387Overview={
 version:string;scope:string;startDate:string;astronomyProfile:string;sourceMethod:string;
 observer:{timeZone:string;latitude:number;longitude:number};
 days:{date:string;sunriseUtc:string;nextSunriseUtc:string;
  sunriseAngas:{tithi:{number:number};nakshatra:{number:number};vara:{number:number};
   yoga:{number:number};karana:{slot:number}}}[];
};
export type P387Window={startUtc:string;endUtc:string;sampleUtc:string;
 sunriseDate:string;status:'candidate'|'requires_review';reasonIds:string[]};
export type P387Finder={
 version:'p385-time-finder-v1';scope:'OWNER_NATAL_AND_EVENT_CITY_SAME_VERIFIED_UTC';
 activityId:P38ActivityId;startUtc:string;searchThroughUtc:string;daysRequested:number;
 observer:{latitude:number;longitude:number;timeZone:string};
 complete:true;status:'candidate_found'|'review_only'|'none_in_checked_range';
 candidate:P387Window|null;review:P387Window|null;windows:P387Window[];
 selectionPolicy:'FIRST_CANDIDATE_AND_REVIEW_PER_LOCAL_SUNRISE_DAY';
};
export type P387Row={date:string;personalDay:P35Personal['days'][number]|null;
 personalEvents:P35Personal['events'];windows:P387Window[]};
const validIso=(s:string)=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(Date.parse(s)).toISOString()===s;
function check(condition:unknown,message:string):asserts condition{
 if(!condition)throw Error('P387 verified timeline mismatch: '+message);
}
const sameObserver=(a:{timeZone:string;latitude:number;longitude:number},point:P35Point)=>
 a.timeZone===point.timeZone&&a.latitude===Number(point.latitude)&&
 a.longitude===Number(point.longitude);
export function validateP387Public(overview:P387Overview,point:P35Point,count:P35Days){
 check(overview&&typeof overview.version==='string'&&
  overview.scope==='calculated-observance-indications-not-definitive-religious-fasting-dates'&&
  overview.startDate===point.date&&sameObserver(overview.observer,point),'public provenance/observer');
 check(typeof overview.astronomyProfile==='string'&&overview.astronomyProfile.length>8&&
  typeof overview.sourceMethod==='string'&&overview.sourceMethod.length>3,'Swiss method');
 check(Array.isArray(overview.days)&&overview.days.length===count,'calendar day coverage');
 const base=Date.parse(point.date+'T00:00:00Z');
 check(Number.isFinite(base),'civil start date');
 for(let i=0;i<count;i++){
  const d=overview.days[i];
  check(d?.date===new Date(base+i*86400000).toISOString().slice(0,10)&&
   validIso(d.sunriseUtc)&&validIso(d.nextSunriseUtc),'consecutive sunrise date');
  const from=Date.parse(d.sunriseUtc),to=Date.parse(d.nextSunriseUtc);
  check(to>from&&to-from>=20*3600000&&to-from<=28*3600000,
   'observer-local sunrise span (DST tolerant)');
  if(i)check(overview.days[i-1].nextSunriseUtc===d.sunriseUtc,'sunrise continuity');
  const a=d.sunriseAngas;
  check(a&&Number.isInteger(a.tithi?.number)&&a.tithi.number>=1&&a.tithi.number<=30&&
   Number.isInteger(a.nakshatra?.number)&&a.nakshatra.number>=1&&a.nakshatra.number<=27&&
   Number.isInteger(a.vara?.number)&&a.vara.number>=1&&a.vara.number<=7&&
   Number.isInteger(a.yoga?.number)&&a.yoga.number>=1&&a.yoga.number<=27&&
   Number.isInteger(a.karana?.slot)&&a.karana.slot>=1&&a.karana.slot<=60,
   'five sunrise limbs');
 }
 return overview;
}
export function validateP387Natal(overview:P387Overview,point:P35Point,count:P35Days,
 privateData:P35Private){
 validateP387Public(overview,point,count);
 const verified=validateP35Private(privateData,point,count);
 check(verified.range.astronomyProfile===overview.astronomyProfile&&
  verified.range.sourceMethod===overview.sourceMethod,
  'independent Swiss method/profile mismatch');
 for(let i=0;i<count;i++){
  const publicDay=overview.days[i],privateDay=verified.range.days[i];
  const a=publicDay.sunriseAngas,b=privateDay.sunrise;
  check(publicDay.date===privateDay.date&&publicDay.sunriseUtc===privateDay.sunriseUtc&&
   publicDay.nextSunriseUtc===privateDay.nextSunriseUtc,
   'public/private local sunrise identity');
  check(a.tithi.number===b.tithi.number&&a.nakshatra.number===b.nakshatra.number&&
   a.vara.number===b.vara.number&&a.yoga.number===b.yoga.number&&
   a.karana.slot===b.karana.slot,
   'public/private five-limb parity');
 }
 return verified;
}
export function validateP387Finder(finder:P387Finder,point:P35Point,
 activityId:P38ActivityId){
 check(finder?.version==='p385-time-finder-v1'&&
  finder.scope==='OWNER_NATAL_AND_EVENT_CITY_SAME_VERIFIED_UTC'&&
  finder.complete===true&&finder.activityId===activityId&&
  finder.selectionPolicy==='FIRST_CANDIDATE_AND_REVIEW_PER_LOCAL_SUNRISE_DAY'&&
  sameObserver(finder.observer,point),'Time Finder signed observer/activity');
 check(validIso(finder.startUtc)&&validIso(finder.searchThroughUtc)&&
  Date.parse(finder.searchThroughUtc)>Date.parse(finder.startUtc)&&
  [7,30].includes(finder.daysRequested),'search horizon');
 check(['candidate_found','review_only','none_in_checked_range'].includes(finder.status)&&
  Array.isArray(finder.windows)&&finder.windows.length<=2*finder.daysRequested,
  'bounded first-per-day coverage');
 const status=finder.candidate?'candidate_found':finder.review?'review_only':'none_in_checked_range';
 check(status===finder.status,'nearest window status');
 let last=Date.parse(finder.startUtc)-1;const unique=new Set<string>();
 for(const w of finder.windows){
  const a=Date.parse(w.startUtc),b=Date.parse(w.endUtc);
  check(validIso(w.startUtc)&&validIso(w.endUtc)&&w.sampleUtc===w.startUtc&&
   w.startUtc>=finder.startUtc&&w.endUtc<=finder.searchThroughUtc&&
   b-a>=15*60000&&a>=last&&
   /^\d{4}-\d\d-\d\d$/.test(w.sunriseDate)&&
   ['candidate','requires_review'].includes(w.status)&&
   Array.isArray(w.reasonIds)&&w.reasonIds.every(r=>typeof r==='string'),
   'exact future verified window');
  check(!unique.has(w.sunriseDate+'|'+w.status),'more than one window per sunrise day');
  unique.add(w.sunriseDate+'|'+w.status);
  last=a;
 }
 for(const [w,kind] of [[finder.candidate,'candidate'],[finder.review,'requires_review']] as const){
  if(w)check(finder.windows.some(x=>x.sunriseDate===w.sunriseDate&&x.startUtc===w.startUtc&&
   x.endUtc===w.endUtc&&x.status===kind),'earliest interval must be in verified list');
 }
 return finder;
}
/** Exact instants are attached to their SOURCE sunrise-day interval, not
 * naively to the civil date of a late-night transition. */
export function p387Rows(overview:P387Overview,point:P35Point,count:P35Days,
 personal:P35Private|null,finder:P387Finder|null,activityId:P38ActivityId):P387Row[]{
 validateP387Public(overview,point,count);
 const verified=personal?validateP387Natal(overview,point,count,personal):null;
 const chosen=finder?validateP387Finder(finder,point,activityId):null;
 // A window whose timestamp falls in a displayed sunrise day but claims
 // another sunriseDate is an invalid source join, never an event to silently hide.
 for(const window of chosen?.windows||[]){
  const start=Date.parse(window.startUtc),end=Date.parse(window.endUtc);
  const localDay=overview.days.find(d=>start>=Date.parse(d.sunriseUtc)&&
   start<Date.parse(d.nextSunriseUtc));
  if(localDay)check(localDay.date===window.sunriseDate&&
   end<=Date.parse(localDay.nextSunriseUtc),'search window/source day contradiction');
  else check(!overview.days.some(d=>d.date===window.sunriseDate),
   'claimed source date missing from currently verified sunrise coverage');
 }
 return overview.days.map((day,i)=>{
  const start=Date.parse(day.sunriseUtc),end=Date.parse(day.nextSunriseUtc);
  const events=verified?.personal.events.filter(e=>{
   const ms=Date.parse(e.atUtc);return ms>=start&&ms<end;
  })||[];
  const windows=chosen?.windows.filter(w=>{
   const a=Date.parse(w.startUtc),b=Date.parse(w.endUtc);
   if(w.sunriseDate!==day.date)return false;
   check(a>=start&&b<=end,'time interval crosses a sunrise/observer day');
   return true;
  })||[];
  // Any window with a matching DATE but conflicting UTC day is rejected;
  // a window outside this calendar view is retained only in the search report.
  return {date:day.date,personalDay:verified?.personal.days[i]||null,
   personalEvents:events,windows};
 });
}
