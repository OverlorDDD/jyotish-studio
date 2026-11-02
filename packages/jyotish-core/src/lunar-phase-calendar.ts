/** P2.3: pure Swiss-supplied Sun/Moon phase crossings in a bounded civil-date
 * window. This is phase geometry, never eclipse or religious date certification.
 */
export type LunarPhaseKind='new_moon'|'first_quarter'|'full_moon'|'last_quarter';
export type LunarPhaseEvent={kind:LunarPhaseKind;atUtc:string};
type Angles={sun:number;moon:number};
const PHASES=['new_moon','first_quarter','full_moon','last_quarter'] as const;
const HOUR=3600000,MAX=32*86400000;
const mod=(x:number,n=360)=>((x%n)+n)%n;
function quadrant(p:Angles){
 if(!p||![p.sun,p.moon].every(Number.isFinite)||p.sun<0||p.sun>=360||p.moon<0||p.moon>=360)
  throw Error('Verified Swiss Sun and Moon longitude required');
 return Math.floor(mod(p.moon-p.sun)/90);
}
/** Exact [start,end) crossings, numerical resolution <=1 second. */
export function lunarPhaseEvents(startMs:number,endMs:number,at:(ms:number)=>Angles):LunarPhaseEvent[]{
 if(!Number.isSafeInteger(startMs)||!Number.isSafeInteger(endMs)||endMs<=startMs||
  endMs-startMs>MAX)throw Error('Lunar phases require a 1–32 day UTC interval');
 const events:LunarPhaseEvent[]=[];
 let prev=quadrant(at(startMs));
 for(let left=startMs;left<endMs;){
  const right=Math.min(endMs,left+2*HOUR),current=quadrant(at(right));
  if(current!==prev){
   if(current!==(prev+1)%4)throw Error('Unphysical phase jump or reversed orbit');
   let lo=left,hi=right;
   for(let i=0;i<42&&hi-lo>1000;i++){
    const mid=Math.floor((lo+hi)/2);
    if(quadrant(at(mid))===prev)lo=mid;else hi=mid;
   }
   if(hi<endMs)events.push({kind:PHASES[current],atUtc:new Date(hi).toISOString()});
  }
  prev=current;left=right;
 }
 return events;
}
