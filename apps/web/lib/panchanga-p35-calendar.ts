/** P3.5 client-side contract: a 7/30 sunrise-only overview plus optional
 * independently verifiable private natal comparisons and exact UTC events.
 * Never upgrade a morning sample to a whole-day P3.4 recommendation.
 */
import type {P31Topic} from './panchanga-p31-model';
type Lang={uk:string;en:string};
export type P35Days=7|28|29|30|31;
export type P35Point={date:string;timeZone:string;latitude:string;longitude:string};
export type P35Range={
 version:'panchanga-range-v1';scope:'five-angas-at-local-sunrise-not-all-day-intervals';
 startDate:string;observer:{timeZone:string;latitude:number;longitude:number};
 astronomyProfile:string;sourceMethod:string;days:{
  date:string;sunriseUtc:string;sunsetUtc:string;nextSunriseUtc:string;
  sunrise:{moonSign:number;tithi:{number:number;paksha:string;numberWithinPaksha:number};
   nakshatra:{number:number;name:string};vara:{number:number;name:string};
   yoga:{number:number;name:string};karana:{slot:number;name:string}};
 }[];
};
type Quality='supportive'|'challenging'|'caution';
type Lunar={
 tarabala:{quality:Quality;taraNumber:number;cycle:number;inclusiveCount:number;
  birthNakshatraIndex:number;transitNakshatraIndex:number};
 chandrabala:{quality:Quality;houseFromJanmaRashi:number;ashtamaChandra:boolean;
  natalMoonSign:number;transitMoonSign:number};
};
export type P35Personal={
 natal:{moonSign:number;lagnaSign:number};
 days:({date:string;sampledAtUtc:string;transitMoon:{sign:number;nakshatraNumber:number};
  period:null|{lord:string;start:string;end:string;antardasha:null|{lord:string;start:string;end:string}};
  gochar:{name:string;sign:number;houseFromMoon:number;houseFromLagna:number}[]} & Lunar)[];
 events:{atUtc:string;kind:'moon-sign'|'nakshatra'|'mahadasha'|'antardasha';
  from?:number;to?:number;lord?:string}[];
};
export type P35Private={
 status:'available';version:'personal-panchanga-calendar-p35';
 observation:'OWNER_VERIFIED_SWISS_AT_EACH_LOCAL_SUNRISE';
 scope:'SUNRISE_SNAPSHOTS_WITH_EXACT_LUNAR_AND_DASHA_TRANSITIONS_NOT_FULL_DAY_MUHURTA';
 range:P35Range;personal:P35Personal;
};
export type P35Status='avoid'|'caution'|'supportive'|'neutral'|'general';
export type P35Card={date:string;sunriseUtc:string;nextSunriseUtc:string;
 status:P35Status;title:Lang;action:Lang;reason:Lang;personalized:boolean;
 tithi:number;nakshatra:number;events:P35Personal['events'];period:string|null};
const L=(uk:string,en:string):Lang=>({uk,en});
const DAY=86400000;
const validUtc=(s:string)=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(s)&&Number.isFinite(Date.parse(s));
function guard(check:unknown,detail:string):asserts check{if(!check)throw Error('P35 source mismatch: '+detail);}
const number=(n:number,limit:number)=>Number.isInteger(n)&&n>=1&&n<=limit;
const SUPPORT_TARA=new Set([2,4,6,8,9]);
const SUPPORT_HOUSE=new Set([1,3,6,7,10,11]);
const planets=['Mercury','Venus','Mars','Jupiter','Saturn'];
const subjects:Record<P31Topic,{begin:Lang;prepare:Lang}> ={
 work:{begin:L('переговорів про оплату або умови праці','pay or job-term negotiations'),
  prepare:L('Підготуйте три результати роботи та не починайте переговорів у цей ранковий відрізок.',
   'Prepare three work achievements and avoid starting negotiations during this morning interval.')},
 money:{begin:L('підписання фінансової угоди','signing a financial agreement'),
  prepare:L('Перевірте суму й умови договору, а час підписання перенесіть.',
   'Verify amounts and contract terms; reschedule the signing.')},
 relationships:{begin:L('важливої розмови про стосунки','an important relationship discussion'),
  prepare:L('Запишіть два ключові питання, але серйозну розмову почніть пізніше.',
   'Write down two key questions and start the serious conversation later.')},
 travel:{begin:L('відправлення у важливу поїздку','departure on an important trip'),
  prepare:L('Перевірте маршрут і квитки; для відправлення знайдіть інший часовий відрізок.',
   'Check your route and tickets; find another departure interval.')},
 study:{begin:L('початку нового курсу','starting a study course'),
  prepare:L('Підготуйте матеріали; перевірте інший час для першого заняття.','Prepare the materials; check another time for the first lesson.')},
 home:{begin:L('закладання фундаменту','laying the foundation'),
  prepare:L('Перевірте проєкт і дозвільні умови; точний початок робіт заплануйте окремо.','Verify plans and permits; schedule the exact starting time separately.')},
 personal:{begin:L('початку нової особистої справи','starting a new personal project'),
  prepare:L('Завершіть підготовку, а початок справи відкладіть.',
   'Finish the preparation and postpone beginning the project.')}
};
export function validateP35Range(range:P35Range,point:P35Point,days:P35Days){
 guard(range?.version==='panchanga-range-v1'&&
  range.scope==='five-angas-at-local-sunrise-not-all-day-intervals'&&
  range.startDate===point.date&&range.observer?.timeZone===point.timeZone&&
  range.observer.latitude===Number(point.latitude)&&
  range.observer.longitude===Number(point.longitude),'public range or observer');
 guard(typeof range.astronomyProfile==='string'&&range.astronomyProfile.length>8&&
  typeof range.sourceMethod==='string'&&range.sourceMethod.length>3,'Swiss source method');
 guard(Array.isArray(range.days)&&range.days.length===days,'number of days');
 const base=Date.parse(point.date+'T00:00:00Z');
 guard(Number.isFinite(base)&&new Date(base).toISOString().slice(0,10)===point.date,'start');
 range.days.forEach((d,i)=>{
  guard(d.date===new Date(base+i*DAY).toISOString().slice(0,10),'consecutive local dates');
  guard(validUtc(d.sunriseUtc)&&validUtc(d.sunsetUtc)&&validUtc(d.nextSunriseUtc),'UTC source');
  const a=Date.parse(d.sunriseUtc),b=Date.parse(d.nextSunriseUtc),sunset=Date.parse(d.sunsetUtc);
  guard(a<sunset&&sunset<b&&b-a>=20*3600000&&b-a<=28*3600000,'verified sunrise day');
  if(i>0)guard(d.sunriseUtc===range.days[i-1].nextSunriseUtc,'sunrise continuity');
  const p=d.sunrise,t=p?.tithi;
  guard(p&&number(p.moonSign,12)&&number(p.nakshatra?.number,27)&&
   number(p.vara?.number,7)&&number(p.yoga?.number,27)&&
   number(p.karana?.slot,60)&&number(t?.number,30)&&
   number(t?.numberWithinPaksha,15)&&['Shukla','Krishna'].includes(t.paksha)&&
   t.number===(t.paksha==='Shukla'?t.numberWithinPaksha:t.numberWithinPaksha+15),
   'five verified angas');
 });
 return range;
}
export function validateP35Private(privateData:P35Private,point:P35Point,days:P35Days){
 guard(privateData?.status==='available'&&
  privateData.version==='personal-panchanga-calendar-p35'&&
  privateData.observation==='OWNER_VERIFIED_SWISS_AT_EACH_LOCAL_SUNRISE'&&
  privateData.scope==='SUNRISE_SNAPSHOTS_WITH_EXACT_LUNAR_AND_DASHA_TRANSITIONS_NOT_FULL_DAY_MUHURTA',
  'private provenance');
 const range=validateP35Range(privateData.range,point,days);
 const personal=privateData.personal;
 guard(number(personal?.natal?.moonSign,12)&&number(personal?.natal?.lagnaSign,12)&&
  Array.isArray(personal?.days)&&personal.days.length===days&&
  Array.isArray(personal?.events)&&personal.events.length<=140,'private daily coverage');
 personal.days.forEach((p,i)=>{
  const d=range.days[i],t=Date.parse(d.sunriseUtc);
  guard(p.date===d.date&&p.sampledAtUtc===d.sunriseUtc&&
   p.transitMoon?.sign===d.sunrise.moonSign&&
   p.transitMoon?.nakshatraNumber===d.sunrise.nakshatra.number,'same-source lunar position');
  const tara=p.tarabala,cb=p.chandrabala;
  guard(number(tara?.birthNakshatraIndex,27)&&
   tara.transitNakshatraIndex===p.transitMoon.nakshatraNumber,'Tara anchors');
  const count=(tara.transitNakshatraIndex-tara.birthNakshatraIndex+27)%27+1,n=(count-1)%9+1;
  guard(tara.inclusiveCount===count&&tara.taraNumber===n&&
   tara.cycle===Math.floor((count-1)/9)+1&&
   tara.quality===(n===1?'caution':SUPPORT_TARA.has(n)?'supportive':'challenging'),
   'traditional Tara classification');
  const house=(p.transitMoon.sign-personal.natal.moonSign+12)%12+1;
  guard(cb&&cb.natalMoonSign===personal.natal.moonSign&&
   cb.transitMoonSign===p.transitMoon.sign&&cb.houseFromJanmaRashi===house&&
   cb.ashtamaChandra===(house===8)&&
   cb.quality===(SUPPORT_HOUSE.has(house)?'supportive':'challenging'),'Chandra Bala');
  guard(Array.isArray(p.gochar)&&p.gochar.length===5&&
   new Set(p.gochar.map(g=>g.name)).size===5&&
   planets.every(n=>p.gochar.some(g=>g.name===n)),'five planet observations');
  for(const g of p.gochar)guard(number(g.sign,12)&&
   g.houseFromMoon===(g.sign-personal.natal.moonSign+12)%12+1&&
   g.houseFromLagna===(g.sign-personal.natal.lagnaSign+12)%12+1,'gochar houses');
  if(p.period){const period=p.period;
   guard(validUtc(period.start)&&validUtc(period.end)&&
    Date.parse(period.start)<=t&&t<Date.parse(period.end),'active verified Mahadasha');
   if(period.antardasha)guard(validUtc(period.antardasha.start)&&
    validUtc(period.antardasha.end)&&
    Date.parse(period.antardasha.start)<=t&&t<Date.parse(period.antardasha.end)&&
    Date.parse(period.start)<=Date.parse(period.antardasha.start)&&
    Date.parse(period.antardasha.end)<=Date.parse(period.end),'active Antardasha');
  }
 });
 const first=Date.parse(range.days[0].sunriseUtc),last=Date.parse(range.days.at(-1)!.nextSunriseUtc);
 let previous=first-1;const unique=new Set<string>();
 for(const e of personal.events){
  guard(validUtc(e.atUtc)&&['moon-sign','nakshatra','mahadasha','antardasha'].includes(e.kind),
   'event UTC/type');
  const t=Date.parse(e.atUtc);
  guard(t>=first&&t<last&&t>=previous,'event order/bounds');
  previous=t;
  if(e.kind==='moon-sign'||e.kind==='nakshatra'){
   const n=e.kind==='moon-sign'?12:27;
   guard(number(e.from!,n)&&number(e.to!,n)&&
    ((e.to!-e.from!+n)%n)===1,'adjacent lunar transit');
  }
  const id=e.kind+'|'+e.atUtc;
  guard(!unique.has(id),'duplicate event');unique.add(id);
 }
 return privateData;
}
export function buildP35Cards(range:P35Range,point:P35Point,days:P35Days,
 topic:P31Topic,privateData:P35Private|null=null):P35Card[]{
 validateP35Range(range,point,days);
 if(!Object.prototype.hasOwnProperty.call(subjects,topic))throw Error('Invalid P3.5 topic');
 if(privateData){validateP35Private(privateData,point,days);
  guard(privateData.range.days.every((d,i)=>d.sunriseUtc===range.days[i].sunriseUtc&&
   d.nextSunriseUtc===range.days[i].nextSunriseUtc),'independent sunrise identity');}
 const subject=subjects[topic];
 return range.days.map((d,i)=>{
  const p=privateData?.personal.days[i];
  const events=(privateData?.personal.events||[]).filter(e=>
   Date.parse(e.atUtc)>=Date.parse(d.sunriseUtc)&&Date.parse(e.atUtc)<Date.parse(d.nextSunriseUtc));
  const lunar=p?.chandrabala.ashtamaChandra?'avoid':
   p?.tarabala.quality==='challenging'||p?.chandrabala.quality==='challenging'?'caution':
   p?.tarabala.quality==='caution'?'caution':
   p?.tarabala.quality==='supportive'&&p?.chandrabala.quality==='supportive'?'supportive':
   p?'neutral':'general';
  const status=lunar as P35Status;
  const title=status==='avoid'?L('На сході — сильне натальне обмеження','Strong natal restriction at sunrise'):
   status==='caution'?L('На сході — обережність','Caution at sunrise'):
   status==='supportive'?L('На сході — підтримувальні місячні чинники','Supportive lunar factors at sunrise'):
   status==='neutral'?L('На сході немає чіткого підтвердження','No decisive lunar support at sunrise'):
   L('Панчанга на сході Сонця','Panchanga at sunrise');
  const action=!p?L('Виберіть день, щоб переглянути точну Панчангу та часові інтервали.',
   'Open a day for exact Panchanga and hourly windows'):
   status==='avoid'||status==='caution'?subject.prepare:
   status==='supportive'?L('Для '+subject.begin.uk+' відкрийте точні години й перевірте решту семи показників.',
    'For '+subject.begin.en+', open the exact hours and check the full seven-factor guidance.'):
   L('Для '+subject.begin.uk+' оберіть інший час після перевірки повної Панчанги.',
    'For '+subject.begin.en+', select a different time after inspecting the complete Panchanga.');
  const reason=!p?L('Доступний тільки астрономічний знімок на сході Сонця.',
   'Only an astronomical sunrise snapshot is available.'):
   status==='avoid'?L('Місяць у 8-му знаку від вашого натального Місяця (Аштама-чандра).',
    'Transit Moon is eighth from your natal Moon (Ashtama Chandra).'):
   status==='caution'?L('Тарабала та/або Чандрабала на сході вимагають обережності.',
    'Tarabala and/or Chandrabala at sunrise calls for caution.'):
   status==='supportive'?L('Тарабала й Чандрабала підтримують вас на світанку; після переходів висновок зміниться.',
    'Tarabala and Chandrabala support you at sunrise; later transitions may change it.'):
   L('На сході особисті місячні чинники не узгоджуються.',
    'The natal lunar indicators at sunrise do not agree.');
  return {date:d.date,sunriseUtc:d.sunriseUtc,nextSunriseUtc:d.nextSunriseUtc,
   status,title,action,reason,personalized:Boolean(p),
   tithi:d.sunrise.tithi.number,nakshatra:d.sunrise.nakshatra.number,
   events,period:p?.period?.lord||null};
 });
}
