/** P3.8.5 exact-source time finder, independent of the interpretation texts.
 * UTC [start,end) half-open windows split at ALL relevant verified boundaries:
 * five-anga calendar, Rahu, sunset, graha ingress, natal dasha and event Lagna.
 * No interpolation of planetary longitude; sampler invokes Swiss each time.
 */
import {p34Boundaries} from '../../web/lib/panchanga-p34-time-guidance.ts';
import type {P32Day} from '../../web/lib/panchanga-p32-engine.ts';
import type {P38ActivityId} from '../../web/lib/panchanga-p38-decision.ts';

export type P385Instant={status:'candidate'|'requires_review'|'excluded'|'undetermined';
 reasonIds:string[];source:'NATIVE_SWISS_SAME_UTC_WITH_CLASSICAL_RULES'};
export type P385Window={startUtc:string;endUtc:string;sampleUtc:string;
 status:P385Instant['status'];reasonIds:string[]};
export type P385TimeFinderResult={
 version:'p385-time-finder-v1';activityId:P38ActivityId;
 startUtc:string;daysRequested:number;
 status:'candidate_found'|'review_only'|'none_in_checked_range';
 scope:'OWNER_NATAL_AND_EVENT_CITY_SAME_VERIFIED_UTC';
 candidate:P385Window|null;review:P385Window|null;
 examined:number;excludedCount:number;unknownCount:number;
 searchThroughUtc:string;complete:true;
};
const MIN_DURATION_MS=15*60000,SAFE_OFFSET_MS=15000;
const MS_PER_MIN=60000;
const PROBE_STEP_MS=2*MS_PER_MIN,MAX_STEP_DEGREES=15;
const mod=(v:number,n=360)=>((v%n)+n)%n;
const epoch=(value:string)=>{
 const t=Date.parse(value);
 if(!Number.isSafeInteger(t)||new Date(t).toISOString()!==value)
  throw Error('P385 exact UTC ISO milliseconds required');
 return t;
};
function goodSample(v:{longitude:number;sign:number}){
 if(!v||!Number.isFinite(v.longitude)||v.longitude<0||v.longitude>=360||
  v.sign!==Math.floor(v.longitude/30)+1)throw Error('P385 invalid Swiss event Lagna sampler');
 return v;
}
/** Ascent over Earth rotation is monotone in supported nonpolar geographic
 * range. Two-minute sampling + <15° step envelope prevents silent sign skips.
 * Reject anomalous/retrograde jump rather than claim complete coverage.
 */
export function findP385LagnaCrossings(begin:number,end:number,
 sample:(ms:number)=>{longitude:number;sign:number},opts:{stepMs?:number}={}):string[]{
 if(!Number.isSafeInteger(begin)||!Number.isSafeInteger(end)||end-begin<60000||
  end-begin>29*3600000)throw Error('P385 requires one bounded sunrise interval');
 const step=opts.stepMs??PROBE_STEP_MS;
 if(!Number.isSafeInteger(step)||step<30000||step>PROBE_STEP_MS)
  throw Error('P385 invalid event Lagna sampling step');
 const found:number[]=[];
 let left=begin,before=goodSample(sample(left));
 while(left<end-1){
  const right=Math.min(left+step,end-1),after=goodSample(sample(right));
  const motion=mod(after.longitude-before.longitude);
  if(motion>MAX_STEP_DEGREES)
   throw Error('P385 event ascendant jump violates Swiss monotonic sampling envelope');
  if(after.sign!==before.sign){
   if(after.sign!==(before.sign%12)+1)
    throw Error('P385 skipped one or more event Lagna signs');
   let lo=left,hi=right;
   // Refine to a millisecond BEFORE rounding up to the first safe full UTC second.
   // Stopping at 1 second and then rounding could shift the true crossing by 2 seconds.
   while(hi-lo>1){
    const mid=Math.floor((lo+hi)/2),v=goodSample(sample(mid));
    if(v.sign===before.sign)lo=mid;
    else if(v.sign===after.sign)hi=mid;
    else throw Error('P385 nonadjacent bisection sign');
   }
   const crossing=Math.ceil(hi/1000)*1000;
   if(crossing>begin&&crossing<end)found.push(crossing);
  }
  left=right;before=after;
 }
 if(found.length>24||found.some((x,i)=>i>0&&x<=found[i-1]))
  throw Error('P385 invalid verified event Lagna crossing order');
 return found.map(x=>new Date(x).toISOString());
}
/** Moon crosses a 3°20' NAKSHATRA PADA several times in one day.
 * Raman's wedding rules exclude particular padas of Magha, Mula, Revati.
 * Splitting only the 27 Nakshatra changes would produce false recommendations.
 * Source is the SAME verified Swiss sidereal Moon position as Panchanga.
 */
export function findP385MoonPadaCrossings(begin:number,end:number,
 at:(ms:number)=>{longitude:number;longitudeSpeed:number}):string[]{
 if(!Number.isSafeInteger(begin)||!Number.isSafeInteger(end)||
  end-begin<60000||end-begin>29*3600000)throw Error('P385 lunar pada search needs one sunrise day');
 const STEP=10*60000,WIDTH=360/108,found:number[]=[];
 const v=(ms:number)=>{
  const p=at(ms);
  if(!p||!Number.isFinite(p.longitude)||p.longitude<0||p.longitude>=360||
    !Number.isFinite(p.longitudeSpeed)||p.longitudeSpeed<=0||p.longitudeSpeed>25)
   throw Error('P385 requires verified prograde Swiss Moon for pada search');
  return {longitude:p.longitude,index:Math.floor(p.longitude/WIDTH)};
 };
 let left=begin,before=v(left);
 while(left<end-1){
  const right=Math.min(left+STEP,end-1),after=v(right);
  const motion=mod(after.longitude-before.longitude);
  if(motion>1.0)throw Error('P385 Moon moved beyond verified 10-minute pada sweep envelope');
  if(before.index!==after.index){
   if(after.index!==(before.index+1)%108)
    throw Error('P385 missed multiple lunar padas in one verified sweep');
   let lo=left,hi=right;
   while(hi-lo>1){
    const mid=Math.floor((lo+hi)/2),p=v(mid);
    if(p.index===before.index)lo=mid;
    else if(p.index===after.index)hi=mid;
    else throw Error('P385 unexpected pada during Swiss bisection');
   }
   const crossed=Math.ceil(hi/1000)*1000;
   if(crossed>begin&&crossed<end)found.push(crossed);
  }
  left=right;before=after;
 }
 if(found.length>12||found.some((x,i)=>i>0&&x<=found[i-1]))
  throw Error('P385 impossible lunar pada crossing count');
 return found.map(t=>new Date(t).toISOString());
}

/** Evaluate only windows long enough to start an activity. Every sample is
 * 15 sec inside the interval, never at an ambiguous planetary/lagna edge.
 */
export async function findP385Windows(args:{
 activityId:P38ActivityId;days:readonly P32Day[];fromUtc:string;
 extraBoundaries:(day:P32Day)=>Promise<readonly string[]>|readonly string[];
 evaluate:(day:P32Day,sampleUtc:string)=>Promise<P385Instant>;
 maxExamined?:number;
}):Promise<P385TimeFinderResult>{
 const {activityId,days,fromUtc}=args,from=epoch(fromUtc);
 if(!days.length||days.length>30)throw Error('P385 one to thirty exact days required');
 const bound=args.maxExamined??6000;
 if(!Number.isSafeInteger(bound)||bound<1||bound>10000)throw Error('P385 evaluation budget invalid');
 let candidate:P385Window|null=null,review:P385Window|null=null;
 let examined=0,excludedCount=0,unknownCount=0;
 for(let i=0;i<days.length;i++){
  const day=days[i],start=epoch(day.sunriseUtc),end=epoch(day.nextSunriseUtc);
  if(i&&day.sunriseUtc!==days[i-1].nextSunriseUtc)
   throw Error('P385 day series must be consecutive same-observer sunrises');
  if(i&&day.location.timeZone!==days[0].location.timeZone)
   throw Error('P385 observer timezone drift across range');
  if(i===0&&(from<start||from>=end))
   throw Error('P385 search must start within first sunrise day');
  const extra=await args.extraBoundaries(day);
  if(!Array.isArray(extra)||extra.length>400)throw Error('P385 boundary budget exceeded');
  const unique=[...new Set(extra)].filter(x=>epoch(x)>start&&epoch(x)<end);
  const boundaries=p34Boundaries(day,unique);
  for(let j=0;j<boundaries.length-1;j++){
   const a=boundaries[j],b=boundaries[j+1];
   const current=Math.max(a,from)+SAFE_OFFSET_MS;
   if(current+MIN_DURATION_MS>b)continue;
   if(++examined>bound)throw Error('P385 source-verified time-window budget exceeded');
   const at=new Date(current).toISOString();
   const item=await args.evaluate(day,at);
   if(item.source!=='NATIVE_SWISS_SAME_UTC_WITH_CLASSICAL_RULES'||
     !['candidate','requires_review','excluded','undetermined'].includes(item.status)||
     !Array.isArray(item.reasonIds)||item.reasonIds.some(x=>typeof x!=='string'))
    throw Error('P385 time window must have signed source-scoped evidence');
   // Show the FIRST actually evaluated safe moment, never an untested
   // boundary instant 15 seconds earlier (which could be a different Lagna).
   const w:P385Window={startUtc:at,
    endUtc:new Date(b).toISOString(),sampleUtc:at,
    status:item.status,reasonIds:[...new Set(item.reasonIds)]};
   if(item.status==='candidate'&&!candidate)candidate=w;
   else if(item.status==='requires_review'&&!review)review=w;
   else if(item.status==='excluded')excludedCount++;
   else if(item.status==='undetermined')unknownCount++;
  }
 }
 return {version:'p385-time-finder-v1',activityId,startUtc:fromUtc,
  daysRequested:days.length,status:candidate?'candidate_found':review?'review_only':'none_in_checked_range',
  scope:'OWNER_NATAL_AND_EVENT_CITY_SAME_VERIFIED_UTC',
  candidate,review,examined,excludedCount,unknownCount,
  searchThroughUtc:days[days.length-1].nextSunriseUtc,complete:true};
}
