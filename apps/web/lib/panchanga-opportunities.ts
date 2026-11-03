/**
 * Daily Opportunities v1: public, deterministic electional *starting-time* finder.
 * Solar/lunar data comes exclusively from the verified Swiss-backed Panchanga API.
 * No fake percentage or probability, no general-purpose "wedding muhurta".
 *
 * Conventions:
 * https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html
 * https://www.drikpanchang.com/muhurat/abhijit-muhurat.html
 * Drik: Char is for movement, Labh for gain/education, Shubh for rituals,
 * Amrit is general; undesirable Vaar/Kaal Vela and Kaal Ratri are excluded.
 * Uncertified special elections stay in the separate owner-scoped Time Finder.
 */
import {evaluateP38,type P38ActivityId} from './panchanga-p38-decision.ts';
import {p34Boundaries} from './panchanga-p34-time-guidance.ts';
import type {P32Day} from './panchanga-p32-engine.ts';

export type Chog='Udveg'|'Char'|'Labh'|'Amrit'|'Kaal'|'Shubh'|'Rog';
export type Planet='Sun'|'Venus'|'Mercury'|'Moon'|'Saturn'|'Jupiter'|'Mars';
type Lang={uk:string;en:string};
type Kala={fromUtc:string;untilUtc:string};
export type OpportunityDay=P32Day&{
 daytimeKalas:P32Day['daytimeKalas']&{yamaganda:Kala;gulikaKalam:Kala};
};
export type TraditionalSlot={kind:Chog|Planet;startUtc:string;endUtc:string;half:'day'|'night';index:number};
export type OpportunityKind='study'|'business'|'journey'|'people'|'arts'|'work'|'practice';
export type Opportunity={
 id:string;kind:OpportunityKind;activityId:P38ActivityId|null;
 title:Lang;action:Lang;reason:Lang;startUtc:string;endUtc:string;
 choghadiya:Chog|null;hora:Planet|null;source:string;
 basis:'classical-start'|'daily-practice';personalized:false;
};
const CHOG_SOURCE='https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html';
const DAY_ORDER:Chog[]=['Udveg','Char','Labh','Amrit','Kaal','Shubh','Rog'];
const NIGHT_ORDER:Chog[]=['Shubh','Amrit','Char','Rog','Kaal','Labh','Udveg'];
const DAY_START:Chog[]=['Udveg','Amrit','Rog','Labh','Shubh','Char','Kaal'];
const NIGHT_START:Chog[]=['Shubh','Char','Kaal','Udveg','Amrit','Rog','Labh'];
const HORA_ORDER:Planet[]=['Sun','Venus','Mercury','Moon','Saturn','Jupiter','Mars'];
const DAY_LORD:Planet[]=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
// Daytime Vaar Vela, Kaal Vela and night-time Kaal Ratri, 1-based
// https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html
const VAAR_VELA=[4,7,2,5,8,3,6];
const KAAL_VELA:number[][]=[[5],[2],[6],[3],[7],[4],[1,8]];
const KAAL_RATRI:number[][]=[[6],[4],[2],[7],[5],[3],[1,8]];
const MIN_MS=15*60000;
const LANG=(uk:string,en:string):Lang=>({uk,en});
const CATALOG:readonly {
 kind:OpportunityKind;activityId:P38ActivityId|null;title:Lang;action:Lang;
 chog:readonly Chog[];hora:readonly Planet[];
}[]=[
 {kind:'study',activityId:'education_start',title:LANG('Навчання й нові знання','Learning and new skills'),
  action:LANG('Розпочніть урок, курс або складну тему.','Begin a lesson, course or challenging topic.'),
  chog:['Labh','Amrit'],hora:['Mercury','Jupiter']},
 {kind:'business',activityId:'shop_opening',title:LANG('Початок торгової справи','Starting commerce'),
  action:LANG('Запустіть продаж, оголосіть відкриття або почніть робочий проєкт.','Launch a sale, announce an opening or begin a commercial project.'),
  chog:['Labh','Amrit'],hora:['Mercury','Venus']},
 {kind:'journey',activityId:'short_journey',title:LANG('Поїздка та дорога','Travel and movement'),
  action:LANG('Заплануйте виїзд або почніть коротку поїздку.','Set off on a short journey or start a trip.'),
  chog:['Char','Amrit'],hora:['Mercury','Moon']},
 {kind:'people',activityId:'making_friends',title:LANG('Зустріч і знайомства','Meeting people'),
  action:LANG('Організуйте дружню зустріч або розпочніть нове знайомство.','Arrange a friendly meeting or introduce yourself to someone new.'),
  chog:['Shubh','Amrit'],hora:['Venus','Moon']},
 {kind:'arts',activityId:'arts_start',title:LANG('Мистецтво й творчість','Arts and creativity'),
  action:LANG('Почніть заняття музикою, малюванням або іншим мистецтвом.','Begin music, drawing or another artistic practice.'),
  chog:['Shubh','Amrit'],hora:['Venus','Moon']},
 {kind:'work',activityId:'job_start',title:LANG('Початок роботи','Beginning work'),
  action:LANG('Розпочніть нове робоче завдання або перший робочий день.','Begin a new work assignment or your first working day.'),
  chog:['Labh','Amrit'],hora:['Sun','Mercury']},
 {kind:'practice',activityId:null,title:LANG('Медитація і тиха практика','Meditation and quiet practice'),
  action:LANG('Присвятіть цей час медитації, молитві або спокійній практиці.','Use this time for meditation, prayer or quiet reflection.'),
  chog:['Shubh','Amrit'],hora:['Jupiter','Moon']}
] as const;
const ms=(v:string)=>{const t=Date.parse(v);if(!Number.isFinite(t)||!v.endsWith('Z'))throw Error('Unverified UTC instant');return t;};
const iso=(t:number)=>new Date(t).toISOString();
function assertDay(day:OpportunityDay){
 const a=ms(day.sunriseUtc),s=ms(day.sunsetUtc),b=ms(day.nextSunriseUtc);
 if(!(a<s&&s<b&&b-a>=20*3600000&&b-a<=28*3600000)||
  !/^\d{4}-\d\d-\d\d$/.test(day.date)||
  !Number.isFinite(new Date(day.date+'T12:00:00Z').getTime()))
  throw Error('Missing verified local sunrise and sunset');
 if(!day.daytimeKalas?.rahuKalam||!day.daytimeKalas?.yamaganda||!day.daytimeKalas?.gulikaKalam)
  throw Error('Required local kalas are not calculated');
 if(!day.location?.timeZone)throw Error('IANA observer zone missing');
 new Intl.DateTimeFormat('en',{timeZone:day.location.timeZone});
 // Throws for incomplete/overlapping Swiss transitions, not just missing shapes.
 p34Boundaries(day);
}
function split(from:number,to:number,n:number,types:readonly (Chog|Planet)[],half:'day'|'night'){
 if(!(to>from))throw Error('Non-positive solar half');
 const result:TraditionalSlot[]=[];
 for(let i=0;i<n;i++)result.push({kind:types[i],half,index:i+1,
  startUtc:iso(from+(to-from)*i/n),endUtc:iso(i===n-1?to:from+(to-from)*(i+1)/n)});
 return result;
}
/** Exact day/night unequal solar-hour lengths. Local weekday is the chosen
 * civil date's weekday, not the UTC timestamp of sunrise.
 */
export function calculateTraditionalSlots(day:OpportunityDay){
 assertDay(day);
 const weekday=new Date(day.date+'T12:00:00Z').getUTCDay();
 const a=ms(day.sunriseUtc),s=ms(day.sunsetUtc),b=ms(day.nextSunriseUtc);
 const ordered=(cycle:readonly Chog[],first:Chog):Chog[]=>{
  const start=cycle.indexOf(first);
  return Array.from({length:8},(_,i)=>cycle[(start+i)%7]);
 };
 const choghadiya=[
  ...split(a,s,8,ordered(DAY_ORDER,DAY_START[weekday]),'day'),
  ...split(s,b,8,ordered(NIGHT_ORDER,NIGHT_START[weekday]),'night')
 ] as TraditionalSlot[];
 const first=HORA_ORDER.indexOf(DAY_LORD[weekday]);
 const planets=Array.from({length:24},(_,i)=>HORA_ORDER[(first+i)%7]);
 const hora=[
  ...split(a,s,12,planets.slice(0,12),'day'),
  ...split(s,b,12,planets.slice(12),'night')
 ] as TraditionalSlot[];
 return {choghadiya,hora,weekday};
}
function contains(slot:TraditionalSlot,t:number){return ms(slot.startUtc)<=t&&t<ms(slot.endUtc);}
function inKala(t:number,kala:Kala){return t>=ms(kala.fromUtc)&&t<ms(kala.untilUtc);}
function excludedVela(chog:TraditionalSlot,weekday:number){
 if(chog.half==='night')return KAAL_RATRI[weekday].includes(chog.index);
 return chog.index===VAAR_VELA[weekday]||KAAL_VELA[weekday].includes(chog.index);
}
const HORA_UK:Record<Planet,string>={Sun:'Сонця',Venus:'Венери',Mercury:'Меркурія',
 Moon:'Місяця',Saturn:'Сатурна',Jupiter:'Юпітера',Mars:'Марса'};
function reasonFor(chog:Chog,planet:Planet|null):Lang{
 const chogReason:Record<Chog,Lang>={
  Amrit:LANG('Чогхадія Амріт придатна для різних добрих починань.','Amrit Choghadiya supports a broad range of auspicious starts.'),
  Labh:LANG('Чогхадія Лабх пов’язана з навчанням і вигодою.','Labh Choghadiya is associated with learning and gain.'),
  Char:LANG('Чогхадія Чар традиційно відповідає руху й подорожам.','Char Choghadiya traditionally suits movement and travel.'),
  Shubh:LANG('Чогхадія Шубх підтримує добрі зустрічі та духовні починання.','Shubh Choghadiya is used for auspicious and spiritual beginnings.'),
  Udveg:LANG('Чогхадія Удвег.','Udveg Choghadiya.'),
  Rog:LANG('Чогхадія Рог.','Rog Choghadiya.'),
  Kaal:LANG('Чогхадія Каал.','Kaal Choghadiya.')
 };
 const r=chogReason[chog];
 return planet?LANG(r.uk+' Планетарна година '+HORA_UK[planet]+' доповнює цей вибір.',
   r.en+' The '+planet+' planetary hour adds a related traditional emphasis.'):r;
}
function intersect(cuts:Set<number>,value:number,a:number,b:number){if(value>a&&value<b)cuts.add(value);}
function mergeWindows(windows:Opportunity[]):Opportunity[]{
 const merged:Opportunity[]=[];
 for(const w of windows){
  const prev=merged[merged.length-1];
  if(prev&&prev.kind===w.kind&&prev.choghadiya===w.choghadiya&&
   prev.hora===w.hora&&ms(prev.endUtc)===ms(w.startUtc)){
   prev.endUtc=w.endUtc;
  }else merged.push({...w});
 }
 return merged.filter(w=>ms(w.endUtc)-ms(w.startUtc)>=MIN_MS);
}
/** Find real UTC windows after fromUtc. Never run the private Time Finder,
 * infer natal values, or approve a specialist marriage/foundation election.
 * Unknown secondary checks are not labeled as positive; the reason names
 * the exact tradition that supplies the recommendation.
 */
export function dailyOpportunities(day:OpportunityDay,fromUtc:string=day.sunriseUtc):Opportunity[]{
 const {choghadiya,hora,weekday}=calculateTraditionalSlots(day);
 const a=ms(day.sunriseUtc),b=ms(day.nextSunriseUtc),after=ms(fromUtc);
 const cuts=new Set<number>([a,b]);
 for(const slot of [...choghadiya,...hora]){
  intersect(cuts,ms(slot.startUtc),a,b);intersect(cuts,ms(slot.endUtc),a,b);
 }
 for(const limb of ['tithi','nakshatra','yoga','karana'] as const)
  for(const p of day.periods[limb]){
   intersect(cuts,ms(p.startUtc),a,b);intersect(cuts,ms(p.endUtc),a,b);
  }
 for(const kala of [day.daytimeKalas.rahuKalam,day.daytimeKalas.yamaganda,
  day.daytimeKalas.gulikaKalam]){
  intersect(cuts,ms(kala.fromUtc),a,b);intersect(cuts,ms(kala.untilUtc),a,b);
 }
 intersect(cuts,after,a,b);
 const segments=[...cuts].sort((x,y)=>x-y);
 const found:Opportunity[]=[];
 for(let i=0;i<segments.length-1;i++){
  const start=segments[i],end=segments[i+1];
  if(end<=after||end-start<1000)continue;
  const test=start+Math.min(1000,Math.floor((end-start)/2));
  const c=choghadiya.find(x=>contains(x,test)),h=hora.find(x=>contains(x,test));
  if(!c||!h)throw Error('Uncovered verified Choghadiya/Hora interval');
  if(excludedVela(c,weekday)||[day.daytimeKalas.rahuKalam,
   day.daytimeKalas.yamaganda,day.daytimeKalas.gulikaKalam].some(k=>inKala(test,k)))continue;
  const ck=c.kind as Chog,planet=h.kind as Planet;
  for(const rule of CATALOG){
   if(!rule.chog.includes(ck))continue;
   // An unsupported Hora does not become a negative vote. When relevant,
   // disclose the complementary hour; otherwise name only Choghadiya.
   const compatible=rule.hora.includes(planet);
   if(rule.activityId){
    const screened=evaluateP38(day,iso(test),rule.activityId);
    if(screened.observations.some(x=>x.polarity==='excludes'))continue;
   }
   found.push({id:rule.kind+'-'+start,kind:rule.kind,activityId:rule.activityId,
    title:rule.title,action:rule.action,reason:reasonFor(ck,compatible?planet:null),
    startUtc:iso(start),endUtc:iso(end),choghadiya:ck,hora:compatible?planet:null,
    source:CHOG_SOURCE,basis:rule.activityId?'classical-start':'daily-practice',personalized:false});
  }
 }
 // Collapse only adjacent identical verified conditions (never across a kala,
 // Nakshatra/Tithi/Yoga/Karana switch carrying different P38 exclusions).
 const groups=new Map<OpportunityKind,Opportunity[]>();
 for(const w of found)groups.set(w.kind,[...(groups.get(w.kind)||[]),w]);
 const candidates=[...groups.values()].flatMap(w=>mergeWindows(w));
 return candidates.sort((x,y)=>ms(x.startUtc)-ms(y.startUtc)||
  Number(Boolean(y.hora))-Number(Boolean(x.hora))||x.kind.localeCompare(y.kind));
}
export function featuredOpportunities(all:readonly Opportunity[],count=3):Opportunity[]{
 const selected:Opportunity[]=[];
 const seen=new Set<OpportunityKind>();
 // The next matching Hora is useful, but must not hide a nearer valid start.
 for(const w of all){
  if(seen.has(w.kind))continue;
  if(selected.some(s=>Math.abs(ms(s.startUtc)-ms(w.startUtc))<15*60000 &&
   s.choghadiya===w.choghadiya&&s.hora===w.hora))continue;
  selected.push(w);seen.add(w.kind);
  if(selected.length>=count)break;
 }
 return selected;
}
export function brahmaMuhurta(day:OpportunityDay):Opportunity{
 // The last two 1/15-night Muhurtas belong to the vedic day which
 // ends at next sunrise. Variable length follows the actual local night.
 const sunset=ms(day.sunsetUtc),sunrise=ms(day.nextSunriseUtc);
 const nightMuhurta=(sunrise-sunset)/15;
 if(!(nightMuhurta>=20*60000&&nightMuhurta<=90*60000))
  throw Error('Unverified astronomical night for Brahma Muhurta');
 return {id:'brahma-'+day.date,kind:'practice',activityId:null,
  title:LANG('Медитація до сходу Сонця','Pre-sunrise meditation'),
  action:LANG('Приділіть час медитації чи молитві перед сходом Сонця.','Meditate or pray in the quiet before sunrise.'),
  reason:LANG('Брахма-мухурта: дві нічні мухурти перед наступним сходом Сонця; тривалість обчислено з цієї місцевої ночі.',
   'Brahma Muhurta: the final two 1/15-night units before the next sunrise, using the local night length.'),
  startUtc:iso(sunrise-2*nightMuhurta),endUtc:iso(sunrise-nightMuhurta),
  choghadiya:null,hora:null,source:'https://www.drikpanchang.com/panchang/day-panchang.html',
  basis:'daily-practice',personalized:false};
}
export function abhijitWindow(day:OpportunityDay):{startUtc:string;endUtc:string}|null{
 const weekday=new Date(day.date+'T12:00:00Z').getUTCDay();
 if(weekday===3)return null; // Wednesday exception: never assert auspiciousness.
 const sunrise=ms(day.sunriseUtc),sunset=ms(day.sunsetUtc);
 return {startUtc:iso(sunrise+(sunset-sunrise)*7/15),endUtc:iso(sunrise+(sunset-sunrise)*8/15)};
}
