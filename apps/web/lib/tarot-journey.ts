/** Browser-only Tarot habit data: card of the day, weekly streak, cards met, guest spread counter.
 * Lives in localStorage on the visitor's device; never sent to the server. */
export type TarotJourney={v:1;daily:{date:string;id:string;reversed:boolean}|null;days:string[];
 seen:Record<string,number>;guest:{date:string;count:number}};
const KEY='gx-tarot-journey-v1';
export const GUEST_DAILY_SPREADS=3;
const empty=():TarotJourney=>({v:1,daily:null,days:[],seen:{},guest:{date:'',count:0}});
export function localDay(now=new Date()){
 const y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,'0'),d=String(now.getDate()).padStart(2,'0');
 return y+'-'+m+'-'+d;
}
export function readJourney():TarotJourney{
 try{
  const raw=window.localStorage.getItem(KEY);if(!raw)return empty();
  const j=JSON.parse(raw) as TarotJourney;
  if(j?.v!==1||!Array.isArray(j.days)||typeof j.seen!=='object')return empty();
  return {...empty(),...j};
 }catch{return empty();}
}
export function writeJourney(j:TarotJourney){
 try{window.localStorage.setItem(KEY,JSON.stringify({...j,days:j.days.slice(-120)}));}catch{/* private mode */}
}
export function markSeen(j:TarotJourney,ids:readonly string[]):TarotJourney{
 const seen={...j.seen};for(const id of ids)seen[id]=(seen[id]??0)+1;
 return {...j,seen};
}
/** Uniform pick from the 78 ids with a 1-in-4 reversal, using the browser CSPRNG when present. */
export function pickDaily(ids:readonly string[]){
 const rnd=(n:number)=>{
  if(typeof crypto!=='undefined'&&crypto.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n;}
  return Math.floor(Math.random()*n);
 };
 return {id:ids[rnd(ids.length)],reversed:rnd(4)===0};
}
/** Monday-first week of the given day, as local YYYY-MM-DD strings. */
export function weekDays(today:string){
 const d=new Date(today+'T12:00:00');const shift=(d.getDay()+6)%7;
 return Array.from({length:7},(_,i)=>{const x=new Date(d);x.setDate(d.getDate()-shift+i);return localDay(x);});
}
export function streak(days:readonly string[],today:string){
 const set=new Set(days);let n=0;const d=new Date(today+'T12:00:00');
 if(!set.has(today))d.setDate(d.getDate()-1);
 while(set.has(localDay(d))){n++;d.setDate(d.getDate()-1);}
 return n;
}
export function guestLeft(j:TarotJourney,today:string){return j.guest.date===today?Math.max(0,GUEST_DAILY_SPREADS-j.guest.count):GUEST_DAILY_SPREADS;}
export function countGuestSpread(j:TarotJourney,today:string):TarotJourney{
 return {...j,guest:{date:today,count:(j.guest.date===today?j.guest.count:0)+1}};
}
/** Ukrainian plural for days: 1 день, 2–4 дні, 5+ днів. */
export function daysUk(n:number){return n%10===1&&n%100!==11?'день':[2,3,4].includes(n%10)&&![12,13,14].includes(n%100)?'дні':'днів';}
export function favouriteCard(j:TarotJourney){
 return Object.entries(j.seen).sort((a,b)=>b[1]-a[1])[0]?.[0]??null;
}
