/** P3.4 Time Guidance — deterministic sunrise-to-sunrise electional windows.
 * Never assume a sunrise/noon snapshot describes the whole day. Split at
 * every verified calendar, Rahu, daylight, and optional private transit/dasha
 * transition, then re-evaluate P3.2 + P3.3 at the exact segment's UTC instant.
 * No weighted luck score, LLM, estimated ingress, or fabricated natal facts.
 */
import {interpretPanchanga,type P32Day,type P32Result} from './panchanga-p32-engine.ts';
import {synthesizePersonalResonance,type P33Point,type P33Report} from './panchanga-p33-resonance.ts';

type Lang={uk:string;en:string};
type Status=P32Result['status'];
export type P34PrivateTiming={
 status:'available';version:'private-time-guidance-p34';
 observation:'VERIFIED_SWISS_BOUNDARIES_AND_OWNED_NATAL';
 date:string;timeZone:string;latitude:number;longitude:number;
 sunriseUtc:string;nextSunriseUtc:string;
 events:{atUtc:string;kind:'moon-sign'|'planet-sign'|'mahadasha'|'antardasha'}[];
 samples:{atUtc:string;report:P33Report}[];
};
export type P34Window={
 startUtc:string;endUtc:string;sampleUtc:string;status:Status;personalized:boolean;
 reason:Lang;action:Lang;factors:{id:string;tone:'blocks'|'cautions'|'supports'|'context';note:Lang}[];
 changes:string[];durationMinutes:number;
};
export type P34Result={
 version:'time-guidance-p34';date:string;timeZone:string;topic:P32Result['topic'];
 personalized:boolean;scope:'verified-own-natal'|'traditional-calendar-only';
 sunriseUtc:string;nextSunriseUtc:string;windows:P34Window[];
 nextSupported:P34Window|null;availableFromUtc:string;
 completeness:'all-verified-calendar-boundaries'|'calendar-and-private-transit-boundaries';
};
const clock=(s:string)=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(s)&&Number.isFinite(Date.parse(s));
const ms=(s:string)=>{if(!clock(s))throw Error('P34 invalid verified UTC timestamp');return Date.parse(s);};
function guard(ok:unknown,why:string):asserts ok{if(!ok)throw Error('P34 incomplete timing evidence: '+why);}
const LIMIT=128,MIN_RECOMMEND_MS=15*60000;
const addInside=(set:Set<number>,value:number,start:number,end:number)=>{
 if(value>start&&value<end)set.add(value);
};
export function p34Boundaries(day:P32Day,extra:readonly string[]=[]){
 const start=ms(day.sunriseUtc),end=ms(day.nextSunriseUtc),set=new Set<number>([start,end]);
 guard(end>start&&end-start>=20*3600000&&end-start<=28*3600000,'sunrise duration');
 guard(ms(day.sunsetUtc)>start&&ms(day.sunsetUtc)<end,'sunset');
 addInside(set,ms(day.sunsetUtc),start,end);
 const rahu=day.daytimeKalas?.rahuKalam;
 guard(rahu&&ms(rahu.fromUtc)>=start&&ms(rahu.untilUtc)<=ms(day.sunsetUtc)&&
   ms(rahu.fromUtc)<ms(rahu.untilUtc),'Rahu window');
 addInside(set,ms(rahu.fromUtc),start,end);addInside(set,ms(rahu.untilUtc),start,end);
 for(const limb of ['tithi','nakshatra','yoga','karana'] as const){
  const periods=day.periods?.[limb];
  guard(Array.isArray(periods)&&periods.length>0&&periods.length<=12,'missing '+limb);
  const sorted=[...periods].sort((a,b)=>ms(a.startUtc)-ms(b.startUtc));
  let cursor=start;
  for(const p of sorted){
   const a=ms(p.startUtc),b=ms(p.endUtc);
   guard(b>a,'non-positive '+limb+' interval');
   if(b<=start||a>=end)continue;
   guard(Math.max(a,start)===cursor&&b>cursor,'gap or overlap in '+limb+' intervals');
   cursor=b;addInside(set,a,start,end);addInside(set,b,start,end);
  }
  guard(cursor>=end,'last '+limb+' interval ends before next sunrise');
 }
 guard(extra.length<=LIMIT,'too many private events');
 for(const x of extra){const t=ms(x);guard(t>start&&t<end,'private boundary outside sunrise day');set.add(t);}
 const sorted=[...set].sort((a,b)=>a-b);
 guard(sorted.length>=2&&sorted.length<=LIMIT,'excessive/missing boundaries');
 return sorted;
}
function boundaryCauses(day:P32Day,extra:P34PrivateTiming|undefined,start:number){
 const reasons:string[]=[];
 for(const limb of ['tithi','nakshatra','yoga','karana'] as const)
  if(day.periods[limb].some(p=>ms(p.startUtc)===start))reasons.push(limb);
 if(start===ms(day.daytimeKalas.rahuKalam.fromUtc))reasons.push('rahu-start');
 if(start===ms(day.daytimeKalas.rahuKalam.untilUtc))reasons.push('rahu-end');
 if(start===ms(day.sunsetUtc))reasons.push('sunset');
 for(const e of extra?.events||[])if(ms(e.atUtc)===start)reasons.push(e.kind);
 return reasons;
}
/** No private data is accepted unless EVERY window has a matching exact
 * same-user verified Swiss sample; any mismatch discards the entire private
 * timeline instead of leaking a partially personalized forecast.
 */
export function buildP34Timeline(day:P32Day,point:P33Point,topic:P32Result['topic'],
 privateTiming:P34PrivateTiming|null=null,fromUtc:string=day.sunriseUtc):P34Result{
 guard(day.date===point.date&&day.location.timeZone===point.timeZone,'observer/day');
 const begin=ms(day.sunriseUtc),end=ms(day.nextSunriseUtc);
 const threshold=ms(fromUtc);guard(threshold>=begin&&threshold<=end,'search start');
 const personalized=privateTiming!==null;
 if(privateTiming){
  guard(privateTiming.status==='available'&&privateTiming.version==='private-time-guidance-p34'&&
   privateTiming.observation==='VERIFIED_SWISS_BOUNDARIES_AND_OWNED_NATAL','private source');
  guard(privateTiming.date===point.date&&privateTiming.timeZone===point.timeZone&&
   privateTiming.sunriseUtc===day.sunriseUtc&&privateTiming.nextSunriseUtc===day.nextSunriseUtc,
   'private sunrise/zone');
  guard(Number.isFinite(privateTiming.latitude)&&Number.isFinite(privateTiming.longitude)&&
   Math.abs(privateTiming.latitude-Number(point.latitude))<1e-5&&
   Math.abs(privateTiming.longitude-Number(point.longitude))<1e-5,'private observer coordinates');
  guard(Array.isArray(privateTiming.events)&&Array.isArray(privateTiming.samples),'private samples');
  guard(privateTiming.events.every(e=>['moon-sign','planet-sign','mahadasha','antardasha'].includes(e.kind)),'private event type');
 }
 const boundaries=p34Boundaries(day,privateTiming?.events.map(e=>e.atUtc)||[]);
 guard(!personalized||privateTiming!.samples.length===boundaries.length-1,'private segment coverage');
 const windows:P34Window[]=[];
 for(let i=0;i<boundaries.length-1;i++){
  const a=boundaries[i],b=boundaries[i+1],width=b-a;
  guard(width>0,'zero-width segment');
  // A 1-second precision crossing is re-evaluated just AFTER the boundary.
  const sample=a+Math.min(1000,Math.floor(width/2));
  guard(sample>=a&&sample<b,'invalid evaluation instant');
  const atUtc=new Date(sample).toISOString();
  const calendar=interpretPanchanga(day,sample,topic,'at-instant');
  guard(calendar.evaluatedAtUtc===atUtc&&calendar.moment==='interval','exact P3.2 sampling');
  let status=calendar.status,reason=calendar.reason,action=calendar.action;
  let factors=calendar.evidence.map(e=>({id:e.id,tone:e.tone==='blocks'?'blocks' as const:
   e.tone==='cautions'?'cautions' as const:e.tone==='supports'?'supports' as const:'context' as const,
   note:e.detail}));
  if(privateTiming){
   const item=privateTiming.samples[i];
   guard(item?.atUtc===atUtc,'private sample/boundary disagreement');
   const personal=synthesizePersonalResonance(calendar,day,point,item.report,atUtc);
   status=personal.status;reason=personal.reason;action=personal.action;
   factors=[...factors,...personal.evidence.map(e=>({id:e.id,tone:e.verdict,note:e.note}))];
  }
  windows.push({startUtc:new Date(a).toISOString(),endUtc:new Date(b).toISOString(),
   sampleUtc:atUtc,status,personalized,reason,action,
   factors,changes:boundaryCauses(day,privateTiming||undefined,a),durationMinutes:width/60000});
 }
 // A supported interval is useful for a real beginning only if >=15 minutes
 // of supportive time remain from the requested instant. Do not extend a
 // positive verdict across a transition or into an unsupported short slot.
 const nextSupported=windows.find(w=>w.status==='supported'&&
   Math.max(ms(w.startUtc),threshold)+MIN_RECOMMEND_MS<=ms(w.endUtc))||null;
 return {version:'time-guidance-p34',date:day.date,timeZone:point.timeZone,topic,
  personalized,scope:personalized?'verified-own-natal':'traditional-calendar-only',
  sunriseUtc:day.sunriseUtc,nextSunriseUtc:day.nextSunriseUtc,
  windows,nextSupported,availableFromUtc:fromUtc,
  completeness:personalized?'calendar-and-private-transit-boundaries':'all-verified-calendar-boundaries'};
}
