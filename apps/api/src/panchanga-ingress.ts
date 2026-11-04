/** P3.6: conservative Swiss sidereal sign-ingress enumeration.
 * Observed longitude AND speed drive adaptive subdivision near a sign edge.
 * Unlike simple endpoint-difference sampling, this can detect a near-station
 * cross-and-return inside a 30-minute bin. When source uncertainty cannot be
 * bounded at one-second resolution, FAIL CLOSED rather than invent completeness.
 *
 * "Exhaustive" is relative to the stated speed-envelope assumption, NOT an
 * independently certified commercial Muhurta calendar.
 */
export type IngressPoint={longitude:number;longitudeSpeed:number};
export type SignIngress={atUtc:string;from:number;to:number};
const HOUR=3600000;
const sign=(longitude:number)=>Math.floor(longitude/30)+1;
const edgeDistance=(longitude:number)=>{
 const phase=((longitude%30)+30)%30;
 return Math.min(phase,30-phase);
};
const adjacent=(before:number,after:number)=>
 (after-before+12)%12===1||(before-after+12)%12===1;
export function findVerifiedSignIngresses(startUtcMs:number,endUtcMs:number,
 at:(ms:number)=>IngressPoint,opts:{stepMinutes?:number;maxSamples?:number}={}):SignIngress[]{
 if(!Number.isSafeInteger(startUtcMs)||!Number.isSafeInteger(endUtcMs)||
  !(endUtcMs>startUtcMs)||endUtcMs-startUtcMs>29*HOUR)
  throw Error('P36 requires one bounded verified sunrise interval');
 const step=opts.stepMinutes??30,maximum=opts.maxSamples??16000;
 if(!Number.isSafeInteger(step)||step<1||step>30||!Number.isSafeInteger(maximum)||
  maximum<30||maximum>20000)throw Error('Invalid P36 sampling budget');
 const cache=new Map<number,IngressPoint>(),found=new Map<number,SignIngress>();
 const sample=(t:number)=>{
  const cached=cache.get(t);if(cached)return cached;
  if(cache.size>=maximum)throw Error('P36 ingress evidence budget exceeded');
  const p=at(t);
  if(!p||!Number.isFinite(p.longitude)||p.longitude<0||p.longitude>=360||
   !Number.isFinite(p.longitudeSpeed)||Math.abs(p.longitudeSpeed)>25)
   throw Error('P36 invalid Swiss longitude/speed');
  cache.set(t,p);return p;
 };
 function scan(a:number,b:number,depth=0):void{
  if(b<=a)return;
  const x=sample(a),y=sample(b),sx=sign(x.longitude),sy=sign(y.longitude);
  if(b-a<=1000){
   if(sx!==sy){
    if(!adjacent(sx,sy))throw Error('P36 nonadjacent sidereal signs');
    const boundary=Math.ceil(b/1000)*1000;
    if(boundary>startUtcMs&&boundary<endUtcMs){
     const existing=found.get(boundary);
     if(existing&&(existing.from!==sx||existing.to!==sy))
      throw Error('P36 ambiguous ingress at one-second precision');
     found.set(boundary,{atUtc:new Date(boundary).toISOString(),from:sx,to:sy});
    }
   }
   return;
  }
  // The speed envelope combines a 1.5x factor and 0.25 deg/day guard
  // for curvature near stationary/retrograde turns. A bin is skipped only
  // when every observed longitude is demonstrably far from a 30° boundary
  // relative to this conservative interval envelope.
  const middle=Math.floor((a+b)/2),z=sample(middle),sz=sign(z.longitude);
  const maxSpeed=Math.max(Math.abs(x.longitudeSpeed),Math.abs(y.longitudeSpeed),
   Math.abs(z.longitudeSpeed));
  const possibleTravel=(maxSpeed*1.5+0.25)*(b-a)/86400000;
  if(sx===sy&&sy===sz&&
   Math.min(edgeDistance(x.longitude),edgeDistance(y.longitude),edgeDistance(z.longitude))>
    possibleTravel)return;
  if(depth>22)throw Error('P36 cannot certify ambiguous near-boundary motion');
  scan(a,middle,depth+1);scan(middle,b,depth+1);
 }
 const full=step*60000;
 for(let left=startUtcMs;left<endUtcMs-1;left+=full){
  scan(left,Math.min(left+full,endUtcMs-1));
 }
 const list=[...found.values()].sort((a,b)=>a.atUtc.localeCompare(b.atUtc));
 if(list.length>16)throw Error('P36 excessive sign changes in one sunrise day');
 for(let i=1;i<list.length;i++){
  if(list[i].atUtc===list[i-1].atUtc)throw Error('P36 ambiguous duplicate transitions');
 }
 return list;
}
