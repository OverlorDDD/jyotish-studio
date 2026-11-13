/** Panchanga Today: a plain-language plan of the day on top of the verified
 * Swiss /panchanga/day record. Pure functions: no network, no natal data.
 * Everything here is traditional calendar guidance, never a prediction.
 *
 * Hours: Rahu, Yamaganda and Gulika kalas, Vishti (Bhadra) karana,
 * day/night Choghadiya with Vaar Vela, Kaal Vela and Kaal Ratri, and Abhijit
 * (8th of 15 daylight muhurtas, not on Wednesday).
 * Activities reuse the P3.8 activity rules (evaluateP38).
 */
import {calculateTraditionalSlots,type OpportunityDay} from './panchanga-opportunities.ts';
import {evaluateP38,type P38ActivityId} from './panchanga-p38-decision.ts';
import type {P32Day} from './panchanga-p32-engine.ts';

export type HourQuality='best'|'good'|'ok'|'routine'|'avoid';
export type HourReason='abhijit'|'any'|'gain'|'people'|'char'|'vishti'|'chog'|'rahu'|'yama'|'gulika';
export type HourPeriod={q:HourQuality;why:HourReason;startMs:number;endMs:number};
export type TodayActivityId='money'|'work'|'study'|'travel'|'love'|'arts'|'home'|'hair'|'spirit';
export type ActivityStatus='good'|'later'|'ok'|'okLater'|'no';
export type ActivityPlan={id:TodayActivityId;status:ActivityStatus;
 goodFromMs:number|null;goodUntilMs:number|null;okFromMs:number|null;windows:[number,number][]};
export type DayTier='good'|'normal'|'quiet';
export type SunriseAngas=P32Day['sunrise'];

const VAAR_VELA=[4,7,2,5,8,3,6];
const KAAL_VELA:number[][]=[[5],[2],[6],[3],[7],[4],[1,8]];
const KAAL_RATRI:number[][]=[[6],[4],[2],[7],[5],[3],[1,8]];
const GOOD_CHOG:Record<string,HourReason>={Amrit:'any',Labh:'gain',Shubh:'people'};
const BAD_CHOG=new Set(['Udveg','Kaal','Rog']);
const MIN=60000,SLIVER=3*MIN;
const ms=(iso:string)=>{const t=Date.parse(iso);if(!Number.isFinite(t))throw Error('Invalid UTC instant');return t;};

/** UTC instant of a local wall-clock hour on a civil date in an IANA zone. */
export function zonedMs(date:string,hour:number,zone:string){
 const wall=Date.parse(date+'T'+String(hour).padStart(2,'0')+':00:00Z');
 if(!Number.isFinite(wall))throw Error('Invalid civil date');
 const fmt=new Intl.DateTimeFormat('en-US',{timeZone:zone,hourCycle:'h23',year:'numeric',month:'2-digit',
  day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});
 const offset=(t:number)=>{
  const p=fmt.formatToParts(new Date(t)),g=(k:string)=>Number(p.find(x=>x.type===k)?.value);
  return Date.UTC(g('year'),g('month')-1,g('day'),g('hour'),g('minute'),g('second'))-t;
 };
 const first=wall-offset(wall);
 return wall-offset(first);
}
/** Abhijit muhurta: 8th of 15 equal daylight parts; traditionally not used on Wednesday. */
export function abhijitWindow(day:Pick<OpportunityDay,'date'|'sunriseUtc'|'sunsetUtc'>){
 const a=ms(day.sunriseUtc),part=(ms(day.sunsetUtc)-a)/15;
 if(new Date(day.date+'T12:00:00Z').getUTCDay()===3)return null;
 return {startMs:Math.round(a+7*part),endMs:Math.round(a+8*part)};
}
/** One quality per moment of the waking day, as merged periods. */
export function hourPlan(day:OpportunityDay,untilMs?:number):HourPeriod[]{
 const {choghadiya,weekday}=calculateTraditionalSlots(day);
 const start=ms(day.sunriseUtc),next=ms(day.nextSunriseUtc);
 const wanted=untilMs??zonedMs(day.date,23,day.location.timeZone);
 const end=Math.min(next,Math.max(start+3600000,wanted));
 const kalas:[HourReason,number,number][]=([
  ['rahu',day.daytimeKalas.rahuKalam],['yama',day.daytimeKalas.yamaganda],['gulika',day.daytimeKalas.gulikaKalam]
 ] as const).map(([k,x]):[HourReason,number,number]=>[k,ms(x.fromUtc),ms(x.untilUtc)]);
 const vishti=day.periods.karana.filter(p=>p.value.name==='Vishti').map(p=>[ms(p.startUtc),ms(p.endUtc)] as const);
 const abhijit=abhijitWindow(day);
 const slots=choghadiya.map(c=>({...c,a:ms(c.startUtc),b:ms(c.endUtc)}));
 const quality=(t:number):{q:HourQuality;why:HourReason}=>{
  const k=kalas.find(([,a,b])=>t>=a&&t<b);if(k)return {q:'avoid',why:k[0]};
  if(vishti.some(([a,b])=>t>=a&&t<b))return {q:'routine',why:'vishti'};
  const c=slots.find(s=>t>=s.a&&t<s.b);
  if(!c)return {q:'ok',why:'char'};
  const vela=c.half==='day'?(c.index===VAAR_VELA[weekday]||KAAL_VELA[weekday].includes(c.index))
   :KAAL_RATRI[weekday].includes(c.index);
  if(BAD_CHOG.has(c.kind)||vela)return {q:'routine',why:'chog'};
  if(abhijit&&t>=abhijit.startMs&&t<abhijit.endMs)return {q:'best',why:'abhijit'};
  const good=GOOD_CHOG[c.kind];if(good)return {q:'good',why:good};
  return {q:'ok',why:'char'};
 };
 const cuts=new Set<number>([start,end]);
 const add=(t:number)=>{if(t>start&&t<end)cuts.add(t);};
 for(const s of slots){add(s.a);add(s.b);}
 for(const [,a,b] of kalas){add(a);add(b);}
 for(const [a,b] of vishti){add(a);add(b);}
 if(abhijit){add(abhijit.startMs);add(abhijit.endMs);}
 const edges=[...cuts].sort((x,y)=>x-y);
 let out:HourPeriod[]=[];
 for(let i=0;i<edges.length-1;i++){
  const a=edges[i],b=edges[i+1];if(b<=a)continue;
  const v=quality((a+b)/2),last=out.at(-1);
  if(last&&last.q===v.q&&last.why===v.why)last.endMs=b;else out.push({...v,startMs:a,endMs:b});
 }
 // Different solar subdivisions can leave second-long slivers: fold them into a neighbour.
 out=out.reduce<HourPeriod[]>((acc,p,i)=>{
  if(p.endMs-p.startMs>=SLIVER||out.length===1)acc.push({...p});
  else if(acc.length)acc[acc.length-1].endMs=p.endMs;
  else if(out[i+1])out[i+1]={...out[i+1],startMs:p.startMs};
  return acc;
 },[]);
 return out.reduce<HourPeriod[]>((acc,p)=>{
  const last=acc.at(-1);
  if(last&&last.q===p.q&&last.why===p.why)last.endMs=p.endMs;else acc.push(p);
  return acc;
 },[]);
}
export const periodAt=(plan:HourPeriod[],t:number)=>plan.find(p=>t>=p.startMs&&t<p.endMs)??null;
export const isNewStartFriendly=(q:HourQuality)=>q==='best'||q==='good';

export const TODAY_ACTIVITIES:readonly {id:TodayActivityId;p38:P38ActivityId|null}[]=[
 {id:'money',p38:'major_purchase'},{id:'work',p38:'major_agreement'},{id:'study',p38:'education_start'},
 {id:'travel',p38:'short_journey'},{id:'love',p38:'first_date'},{id:'arts',p38:'arts_start'},
 {id:'home',p38:'repair_start'},{id:'hair',p38:null},{id:'spirit',p38:null}
];
const STEP=15*MIN;
/** Which Choghadiya suits which activity (Drik: Labh gain/education, Shubh people/arts, Char movement, Amrit any). */
const ACTIVITY_FIT:Record<TodayActivityId,HourReason[]>={money:['gain'],work:['gain'],study:['gain'],
 travel:['char'],love:['people'],arts:['people'],home:['gain'],hair:[],spirit:['people']};
/** When is this activity favoured, allowed or better postponed, from fromMs to the end of the plan? */
export function activityPlan(day:OpportunityDay,plan:HourPeriod[],id:TodayActivityId,fromMs:number):ActivityPlan{
 const activity=TODAY_ACTIVITIES.find(a=>a.id===id);
 if(!activity)throw Error('Unknown activity');
 const empty={id,goodFromMs:null,goodUntilMs:null,okFromMs:null,windows:[] as [number,number][]};
 if(id==='hair')return {...empty,status:haircutFriendly(day.sunrise)?'good':'no'};
 if(id==='spirit')return {...empty,status:'good'};
 const start=Math.max(fromMs,plan[0]?.startMs??fromMs),end=plan.at(-1)?.endMs??start;
 // Sample every period and limb boundary (exact edges) plus a 15-minute grid.
 const times=new Set<number>();
 const add=(t:number)=>{if(t>=start&&t<end)times.add(Math.round(t));};
 add(start);
 for(const p of plan)add(p.startMs);
 for(const kind of ['tithi','nakshatra','yoga','karana'] as const)for(const p of day.periods[kind])add(ms(p.startUtc));
 for(let t=Math.ceil(start/STEP)*STEP;t<end;t+=STEP)add(t);
 const samples:{t:number;state:'good'|'ok'|'bad'}[]=[];
 for(const t of [...times].sort((x,y)=>x-y)){
  const period=periodAt(plan,t);if(!period)continue;
  const r=evaluateP38(day,new Date(t).toISOString(),activity.p38!);
  const excluded=r.observations.some(o=>o.polarity==='excludes');
  const blocked=excluded||period.q==='avoid'||period.q==='routine';
  const fits=period.q==='best'||period.why==='any'||ACTIVITY_FIT[id].includes(period.why);
  samples.push({t,state:blocked?'bad':fits?'good':'ok'});
 }
 if(!samples.length)return {...empty,status:'no'};
 const windows:[number,number][]=[];
 for(let i=0;i<samples.length;i++){
  if(samples[i].state!=='good')continue;
  let j=i;while(j<samples.length&&samples[j].state==='good')j++;
  windows.push([samples[i].t,samples[j]?.t??end]);i=j;
 }
 const okAt=samples.find(s=>s.state!=='bad');
 const now=samples[0].state;
 const status:ActivityStatus=now==='good'?'good':windows.length?'later':now==='ok'?'ok':okAt?'okLater':'no';
 return {id,status,goodFromMs:windows[0]?.[0]??null,goodUntilMs:windows[0]?.[1]??null,
  okFromMs:okAt?.t??null,windows};
}
/** Kshaura (haircut) traditions: favourable nakshatras; not Tuesday or Saturday;
 * not Rikta tithis (4, 9, 14 of each half), Purnima or Amavasya. */
const KSHAURA_NAKSHATRAS=new Set([1,5,7,8,13,14,15,18,22,23,24,27]);
const KSHAURA_BAD_TITHI=new Set([4,9,14,19,24,29,15,30]);
export function haircutFriendly(a:Pick<SunriseAngas,'tithi'|'nakshatra'|'vara'>){
 return KSHAURA_NAKSHATRAS.has(a.nakshatra.number)&&a.vara.number!==3&&a.vara.number!==7&&
  !KSHAURA_BAD_TITHI.has(a.tithi.number);
}
const TIER_ACTIVITIES:P38ActivityId[]=['major_purchase','major_agreement','education_start','short_journey',
 'first_date','arts_start','repair_start','house_entry'];
/** Day colour for a month grid from the five sunrise limbs (one snapshot per day). */
export function dayTier(input:{date:string;timeZone:string;sunriseUtc:string;sunsetUtc:string;nextSunriseUtc:string;
 sunrise:SunriseAngas;rahuKalam?:{fromUtc:string;untilUtc:string}}):DayTier{
 const a=ms(input.sunriseUtc),next=ms(input.nextSunriseUtc);
 const rahu=input.rahuKalam??{fromUtc:new Date(a+3600000).toISOString(),untilUtc:new Date(a+7200000).toISOString()};
 const span=<V,>(value:V)=>[{startUtc:new Date(a-3600000).toISOString(),endUtc:new Date(next+3600000).toISOString(),value}];
 const s=input.sunrise;
 const day:P32Day={date:input.date,location:{timeZone:input.timeZone},sunriseUtc:input.sunriseUtc,
  sunsetUtc:input.sunsetUtc,nextSunriseUtc:input.nextSunriseUtc,sunrise:s,
  periods:{tithi:span(s.tithi),nakshatra:span(s.nakshatra),yoga:span(s.yoga),karana:span(s.karana)},
  daytimeKalas:{rahuKalam:rahu}};
 let at=a+3*3600000;
 const r0=ms(rahu.fromUtc),r1=ms(rahu.untilUtc);
 if(at>=r0&&at<r1)at=r1+MIN;
 at=Math.floor(at/1000)*1000;
 let ex=0,sup=0;
 for(const id of TIER_ACTIVITIES){
  const r=evaluateP38(day,new Date(at).toISOString(),id);
  if(r.observations.some(o=>o.polarity==='excludes'))ex++;
  else if(r.observations.some(o=>o.polarity==='supports'))sup++;
 }
 return ex>=5?'quiet':sup>=2&&ex<=1?'good':'normal';
}
export type ObservanceKind='ekadashi'|'pradosha'|'purnima'|'amavasya'|'sankranti'|'rama_navami'|
 'ganesh_chaturthi'|'chaitra_navratri'|'sharad_navratri'|'guru_purnima'|'janmashtami'|'maha_shivaratri'|'diwali';
export function observanceKind(id:string):ObservanceKind|null{
 if(id.startsWith('ekadashi'))return 'ekadashi';
 if(id.startsWith('pradosha'))return 'pradosha';
 if(id==='purnima_sunrise')return 'purnima';
 if(id==='amavasya_sunrise')return 'amavasya';
 if(id==='diwali_amavasya')return 'diwali';
 return (['sankranti','rama_navami','ganesh_chaturthi','chaitra_navratri','sharad_navratri','guru_purnima',
  'janmashtami','maha_shivaratri'] as const).find(k=>k===id)??null;
}
/** Named festivals outrank generic monthly markers on the same date. */
const RANK:Record<ObservanceKind,number>={diwali:0,maha_shivaratri:0,janmashtami:0,rama_navami:0,ganesh_chaturthi:0,
 chaitra_navratri:0,sharad_navratri:0,guru_purnima:0,sankranti:1,ekadashi:2,purnima:3,amavasya:3,pradosha:4};
export function dayObservances(observances:{id:string;metadata?:Record<string,unknown>}[]){
 const seen=new Map<ObservanceKind,{kind:ObservanceKind;toSign:number|null}>();
 for(const o of observances){
  const kind=observanceKind(o.id);if(!kind||seen.has(kind))continue;
  const sign=Number(o.metadata?.toSign);
  seen.set(kind,{kind,toSign:Number.isInteger(sign)&&sign>=1&&sign<=12?sign:null});
 }
 return [...seen.values()].sort((a,b)=>RANK[a.kind]-RANK[b.kind]);
}
/** Waxing/waning and illuminated fraction from the Sun–Moon elongation. */
export function moonLight(elongationDegrees:number){
 const e=((elongationDegrees%360)+360)%360;
 return {waxing:e<180,illumination:(1-Math.cos(e*Math.PI/180))/2,elongation:e};
}
