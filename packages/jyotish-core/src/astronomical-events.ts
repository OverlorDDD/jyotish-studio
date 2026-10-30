/** AE-P5 exact UTC crossings: pure astronomy event finder.
 * Consumers supply real Swiss positions and speeds; no daily noon interpolation.
 * Bounded two-hour detection windows, then bisection to <= 1 second.
 */
export const ASTRONOMICAL_EVENTS_VERSION='astronomical-events-v1';
export const EVENT_BODIES=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'] as const;
export type EventBody=(typeof EVENT_BODIES)[number];
export type EventPosition={longitude:number;longitudeSpeed:number};
export type PlanetAt=(unixMs:number,body:EventBody)=>EventPosition;
export type EventKind='new_moon'|'first_quarter'|'full_moon'|'last_quarter'|
 'sidereal_ingress'|'retrograde_station'|'direct_station';
export type AstronomicalEvent={kind:EventKind;atUtc:string;body?:EventBody;
 fromSign?:number;toSign?:number;motion?:'direct'|'retrograde';
 longitude?:number;sign?:number};
const STEP_MS=2*3600000;
const norm=(x:number,n=360)=>((x%n)+n)%n;
const sign=(lon:number)=>Math.floor(norm(lon)/30)+1;
const phase=(sun:number,moon:number)=>Math.floor(norm(moon-sun)/90);
function validated(at:PlanetAt,ms:number,body:EventBody):EventPosition{
 const p=at(ms,body);
 if(!p||!Number.isFinite(p.longitude)||!Number.isFinite(p.longitudeSpeed)||
   p.longitude<0||p.longitude>=360)throw Error('Verified longitude and speed required: '+body);
 return p;
}
function bisect(left:number,right:number,oldValue:number,getState:(ms:number)=>number){
 let lo=left,hi=right;
 for(let i=0;i<42&&hi-lo>1000;i++){
  const mid=Math.floor((lo+hi)/2);
  if(getState(mid)===oldValue)lo=mid;else hi=mid;
 }
 return hi;
}
function zeroSpeed(left:number,right:number,oldNegative:boolean,speed:(ms:number)=>number){
 let lo=left,hi=right;
 for(let i=0;i<42&&hi-lo>1000;i++){
  const mid=Math.floor((lo+hi)/2);
  if((speed(mid)<0)===oldNegative)lo=mid;else hi=mid;
 }
 return hi;
}
/** [start,end) UTC. Swiss source must include SPEED and attest SWIEPH return flags.
 * No eclipses or apparent visibility are claimed by simple ecliptic syzygies.
 */
export function findAstronomicalEvents(startMs:number,endMs:number,at:PlanetAt):AstronomicalEvent[]{
 if(!Number.isSafeInteger(startMs)||!Number.isSafeInteger(endMs)||
   endMs<=startMs||endMs-startMs>31*86400000)
  throw Error('Astronomical window must be between 1 millisecond and 31 UTC days');
 const events:AstronomicalEvent[]=[];
 const push=(event:AstronomicalEvent)=>{
  if(Date.parse(event.atUtc)<startMs||Date.parse(event.atUtc)>=endMs)return;
  if(events.length>250)throw Error('Astronomical event safety limit exceeded');
  events.push(event);
 };
 for(let lo=startMs;lo<endMs;){
  const hi=Math.min(endMs,lo+STEP_MS);
  const firstPhase=phase(validated(at,lo,'Sun').longitude,validated(at,lo,'Moon').longitude);
  const lastPhase=phase(validated(at,hi,'Sun').longitude,validated(at,hi,'Moon').longitude);
  if(firstPhase!==lastPhase){
   if(lastPhase!==(firstPhase+1)%4)throw Error('Inconsistent lunar phase sampling');
   const moment=bisect(lo,hi,firstPhase,ms=>phase(
    validated(at,ms,'Sun').longitude,validated(at,ms,'Moon').longitude));
   const kinds:EventKind[]=['new_moon','first_quarter','full_moon','last_quarter'];
   push({kind:kinds[lastPhase],atUtc:new Date(moment).toISOString()});
  }
  for(const body of EVENT_BODIES){
   const p0=validated(at,lo,body),p1=validated(at,hi,body);
   const s0=sign(p0.longitude),s1=sign(p1.longitude);
   if(s0!==s1){
    const forward=s1===(s0%12)+1;
    const backward=s1===((s0+10)%12)+1;
    if(!forward&&!backward)throw Error('Unexpected multiple sidereal signs traversed: '+body);
    const moment=bisect(lo,hi,s0,ms=>sign(validated(at,ms,body).longitude));
    const crossing=validated(at,Math.min(endMs,moment+1000),body);
    push({kind:'sidereal_ingress',atUtc:new Date(moment).toISOString(),
     body,fromSign:s0,toSign:s1,motion:forward?'direct':'retrograde',
     longitude:crossing.longitude});
   }
   if(body==='Sun'||body==='Moon')continue;
   const neg0=p0.longitudeSpeed<0,neg1=p1.longitudeSpeed<0;
   if(neg0!==neg1){
    const moment=zeroSpeed(lo,hi,neg0,ms=>validated(at,ms,body).longitudeSpeed);
    const position=validated(at,moment,body);
    push({kind:neg1?'retrograde_station':'direct_station',
     atUtc:new Date(moment).toISOString(),body,longitude:position.longitude,
     sign:sign(position.longitude)});
   }
  }
  lo=hi;
 }
 events.sort((a,b)=>a.atUtc.localeCompare(b.atUtc)||a.kind.localeCompare(b.kind)||
  String(a.body||'').localeCompare(String(b.body||'')));
 return events;
}
