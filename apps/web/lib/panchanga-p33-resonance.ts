/** P3.3 — pure, private natal synthesis. Does not calculate ephemerides or
 * take birth data from the browser; server supplies owner-verified facts.
 * One decision: hard P3.2 prohibitions and Ashtama cannot be outvoted.
 */
import type {P32Result,P32Day} from './panchanga-p32-engine';
type L={uk:string;en:string};
type Q='supportive'|'challenging'|'caution';
type Topic=P32Result['topic'];
const L=(uk:string,en:string):L=>({uk,en});
export type P33Point={date:string;timeZone:string;latitude:string;longitude:string};
export type P33Report={
 status:'available';version:'personal-resonance-v1';
 observation:'VERIFIED_SWISS_SAME_MOMENT_AND_OWNED_NATAL';
 date:string;timeZone:string;latitude:number;longitude:number;sunriseUtc:string;nextSunriseUtc:string;
 evaluatedAtUtc:string;transitMoon:{sign:number;nakshatraNumber:number};
 natal:{moonSign:number;lagnaSign:number};
 tarabala:{quality:Q;name:string;taraNumber:number;cycle:number;inclusiveCount:number;
  birthNakshatraIndex:number;transitNakshatraIndex:number};
 chandrabala:{quality:Q;houseFromJanmaRashi:number;ashtamaChandra:boolean;
  natalMoonSign:number;transitMoonSign:number};
 period:null|{lord:string;start:string;end:string;
  antardasha:null|{lord:string;start:string;end:string}};
 gochar:{name:string;sign:number;houseFromMoon:number;houseFromLagna:number}[];
};
export type P33Evidence={id:string;category:'lunar'|'gochar'|'dasha'|'calendar';
 verdict:'supports'|'cautions'|'context'|'blocks';note:L};
export type P33Result={version:'personal-resonance-p33';personalized:true;scope:'verified-own-natal';
 status:P32Result['status'];headline:L;action:L;reason:L;atUtc:string;
 evidence:P33Evidence[];sourceCalendarStatus:P32Result['status'];topic:Topic;
 activePeriod:string|null;missing:string[]};
const dateTime=(s:string)=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(s)&&Number.isFinite(Date.parse(s));
const bounded=(n:number,max:number)=>Number.isInteger(n)&&n>=1&&n<=max;
function guard(ok:boolean,issue:string):asserts ok{if(!ok)throw Error('P33 verified data mismatch: '+issue);}
const FAVORABLE_TARA=new Set([2,4,6,8,9]);
const FAVORABLE_HOUSES=new Set([1,3,6,7,10,11]);
const DANGER_HOUSES=new Set([4,8,12]);
const NAMES=new Set(['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']);
const activity:Record<Topic,{noun:L;prepare:L;consider:L}>={
 work:{noun:L('переговорів про оплату','pay negotiations'),
  prepare:L('Підготуйте три результати своєї роботи та відкладіть початок переговорів.','List three results of your work and postpone opening the negotiation.'),
  consider:L('Підготуйте аргументи й можете планувати розмову про оплату.','Prepare your case and consider scheduling the pay discussion.')},
 money:{noun:L('фінансової угоди','a financial agreement'),
  prepare:L('Перевірте суму, строки й умови та відкладіть укладання нової угоди.','Check the sum, dates and terms; postpone entering a new agreement.'),
  consider:L('Перевірте умови й можете планувати нову фінансову домовленість.','Review the terms and consider planning the financial agreement.')},
 relationships:{noun:L('важливої розмови','an important conversation'),
  prepare:L('Запишіть два головні питання, але важливу розмову почніть пізніше.','Write your two key questions, but start the important conversation later.'),
  consider:L('Сформулюйте свою мету й можете планувати відкриту розмову.','Clarify your purpose and consider planning the conversation.')},
 travel:{noun:L('початку поїздки','starting a journey'),
  prepare:L('Перевірте маршрут і квитки, але перенесіть початок нової поїздки.','Check the route and tickets, but postpone the start of a new trip.'),
  consider:L('Перевірте маршрут і можете розглядати виїзд.','Check the route and consider a departure.')},
 personal:{noun:L('нової особистої справи','a new personal undertaking'),
  prepare:L('Завершіть підготовку й перенесіть початок нової справи.','Finish preparations and postpone starting the new undertaking.'),
  consider:L('Складіть план і можете розглядати початок нової справи.','Write a plan and consider starting the new project.')}
};
export function validateP33Report(report:P33Report,point:P33Point,day:P32Day,expectedAtUtc:string){
 guard(report?.status==='available'&&report.version==='personal-resonance-v1'&&
  report.observation==='VERIFIED_SWISS_SAME_MOMENT_AND_OWNED_NATAL','private verification');
 guard(report.date===point.date&&report.timeZone===point.timeZone&&
  Number.isFinite(report.latitude)&&Number.isFinite(report.longitude)&&
  Math.abs(report.latitude-Number(point.latitude))<1e-5&&
  Math.abs(report.longitude-Number(point.longitude))<1e-5,'observer identity');
 guard(report.date===day.date&&report.timeZone===day.location.timeZone&&
  report.sunriseUtc===day.sunriseUtc&&report.nextSunriseUtc===day.nextSunriseUtc,
  'same verified astronomical day');
 guard(dateTime(expectedAtUtc)&&dateTime(report.evaluatedAtUtc)&&
  report.evaluatedAtUtc===expectedAtUtc,'exact evaluation moment');
 const time=Date.parse(report.evaluatedAtUtc);
 guard(time>=Date.parse(day.sunriseUtc)&&time<Date.parse(day.nextSunriseUtc),'sunrise window');
 guard(bounded(report.natal?.moonSign,12)&&bounded(report.natal?.lagnaSign,12)&&
  bounded(report.transitMoon?.sign,12)&&bounded(report.transitMoon?.nakshatraNumber,27),
  'natal or current Moon');
 const active=day.periods?.nakshatra?.filter(p=>
  time>=Date.parse(p.startUtc)&&time<Date.parse(p.endUtc));
 guard(active?.length===1&&active[0].value.number===report.transitMoon.nakshatraNumber,
  'Moon nakshatra differs from public Swiss calculation');
 if(time===Date.parse(day.sunriseUtc)){
  const sunriseSign=(day.sunrise as {moonSign?:number}).moonSign;
  guard(sunriseSign===report.transitMoon.sign,'Moon sign differs at sunrise');
 }
 const tara=report.tarabala,cb=report.chandrabala;
 guard(tara&&cb&&bounded(tara.birthNakshatraIndex,27)&&
  tara.transitNakshatraIndex===report.transitMoon.nakshatraNumber,'Tara anchors');
 const count=(tara.transitNakshatraIndex-tara.birthNakshatraIndex+27)%27+1;
 const number=(count-1)%9+1;
 guard(tara.inclusiveCount===count&&tara.taraNumber===number&&
  tara.cycle===Math.floor((count-1)/9)+1&&
  tara.quality===(number===1?'caution':FAVORABLE_TARA.has(number)?'supportive':'challenging'),
  'Tara quality');
 const h=(report.transitMoon.sign-report.natal.moonSign+12)%12+1;
 guard(cb.natalMoonSign===report.natal.moonSign&&
  cb.transitMoonSign===report.transitMoon.sign&&
  cb.houseFromJanmaRashi===h&&cb.ashtamaChandra===(h===8)&&
  cb.quality===(FAVORABLE_HOUSES.has(h)?'supportive':'challenging'),
  'Chandra quality');
 guard(Array.isArray(report.gochar)&&report.gochar.length===5&&
  new Set(report.gochar.map(p=>p.name)).size===5&&
  ['Mercury','Venus','Mars','Jupiter','Saturn'].every(n=>report.gochar.some(x=>x.name===n)),
  'planet coverage');
 for(const p of report.gochar){
  guard(bounded(p.sign,12)&&p.houseFromMoon===(p.sign-report.natal.moonSign+12)%12+1&&
   p.houseFromLagna===(p.sign-report.natal.lagnaSign+12)%12+1,'gochar house');
 }
 if(report.period!==null){
  const d=report.period;
  guard(d&&NAMES.has(d.lord)&&dateTime(d.start)&&dateTime(d.end)&&
   Date.parse(d.start)<=time&&time<Date.parse(d.end),'active Mahadasha');
  if(d.antardasha){
   const a=d.antardasha;
   guard(NAMES.has(a.lord)&&dateTime(a.start)&&dateTime(a.end)&&
    Date.parse(a.start)<=time&&time<Date.parse(a.end)&&
    Date.parse(d.start)<=Date.parse(a.start)&&Date.parse(a.end)<=Date.parse(d.end),
    'active Antardasha');
  }
 }
 return report;
}
export function synthesizePersonalResonance(calendar:P32Result,day:P32Day,point:P33Point,
 report:P33Report,expectedAtUtc:string):P33Result{
 validateP33Report(report,point,day,expectedAtUtc);
 guard(calendar.topic in activity&&calendar.date===point.date&&
  calendar.timeZone===point.timeZone,'calendar topic/date');
 const at=Date.parse(expectedAtUtc);
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:point.timeZone,
  year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(at));
 const read=(k:string)=>parts.find(x=>x.type===k)?.value||'';
 const localDay=read('year')+'-'+read('month')+'-'+read('day');
 guard(calendar.moment==='sunrise-snapshot'&&at===Date.parse(day.sunriseUtc)||
  calendar.moment==='live'&&at>=Date.parse(day.sunriseUtc)&&at<Date.parse(day.nextSunriseUtc)&&localDay===day.date,
  'calendar time scope');
 const evidence:P33Evidence[]=[];
 const add=(id:string,category:P33Evidence['category'],verdict:P33Evidence['verdict'],note:L)=>{
  evidence.push({id,category,verdict,note});
 };
 const tara=report.tarabala.quality,moon=report.chandrabala.quality;
 add('TARABALA_'+report.tarabala.taraNumber,'lunar',
  tara==='supportive'?'supports':tara==='challenging'?'cautions':'context',
  tara==='supportive'?L('Накшатра Місяця сприятливо поєднується з натальною.',
   'The Moon’s nakshatra traditionally aligns well with your birth nakshatra.'):
  tara==='challenging'?L('Накшатра Місяця напружено поєднується з натальною.',
   'The Moon’s nakshatra traditionally conflicts with your birth nakshatra.'):
  L('Місяць у групі Джанма: для початку важливих справ потрібна обережність.',
   'The Moon is in a Janma cycle: exercise caution with new undertakings.'));
 add('CHANDRABALA_'+report.chandrabala.houseFromJanmaRashi,'lunar',
  moon==='supportive'?'supports':'cautions',
  moon==='supportive'?L('Місяць у підтримувальному знаку від вашого натального Місяця.',
   'The Moon is in a supportive sign counted from your birth Moon.'):
  L('Місяць у напруженому знаку від вашого натального Місяця.',
   'The Moon is in a challenging sign counted from your birth Moon.'));
 const ashtama=report.chandrabala.ashtamaChandra;
 if(ashtama)add('ASHTAMA_CHANDRA','lunar','blocks',L(
  'Аштама-чандра: Місяць у 8-му знаку від натального; за традиційним правилом уникають важливих починань.',
  'Ashtama Chandra: the Moon is eighth from the natal Moon; important beginnings are traditionally avoided.'));
 const jupiter=report.gochar.find(x=>x.name==='Jupiter')!;
 const saturn=report.gochar.find(x=>x.name==='Saturn')!;
 const mars=report.gochar.find(x=>x.name==='Mars')!;
 const venus=report.gochar.find(x=>x.name==='Venus')!;
 const mercury=report.gochar.find(x=>x.name==='Mercury')!;
 // House-based gochar: exact sidereal positions at the SAME UTC instant.
 // No aspects/dignities are inferred and transit alone cannot guarantee an event.
 const jupSupport=[2,5,7,9,11].includes(jupiter.houseFromMoon);
 add('JUPITER_FROM_NATAL_MOON','gochar',jupSupport?'supports':'context',
  jupSupport?L('Юпітер у '+jupiter.houseFromMoon+'-му знаку від натального Місяця — традиційний підтримувальний транзит.',
   'Jupiter is '+jupiter.houseFromMoon+' signs from the natal Moon — a traditionally supportive transit.'):
  L('Юпітер у '+jupiter.houseFromMoon+'-му знаку від натального Місяця; сам по собі не визначає результат.',
   'Jupiter is '+jupiter.houseFromMoon+' signs from the birth Moon; this alone cannot decide the outcome.'));
 const saturnSensitive=[12,1,2].includes(saturn.houseFromMoon);
 add('SATURN_FROM_NATAL_MOON','gochar',saturnSensitive?'cautions':'context',
  saturnSensitive?L('Сатурн у '+saturn.houseFromMoon+'-му знаку від натального Місяця: період Саде-саті за традиційною класифікацією. Плануйте зобов’язання уважно.',
   'Saturn is '+saturn.houseFromMoon+' signs from the natal Moon: a traditional Sade Sati phase. Review obligations carefully.'):
  L('Сатурн у '+saturn.houseFromLagna+'-му знаку від лагни: враховуйте довгострокові обов’язки.',
   'Saturn is '+saturn.houseFromLagna+' signs from the ascendant: account for long-term obligations.'));
 const marsSensitive=mars.houseFromMoon===8;
 add('MARS_FROM_NATAL_MOON','gochar',marsSensitive?'cautions':'context',
  marsSensitive?L('Марс у 8-му знаку від натального Місяця: за традицією не поспішайте з конфліктними діями.',
   'Mars is eighth from the natal Moon: traditionally avoid rushed confrontational actions.'):
  L('Марс у '+mars.houseFromLagna+'-му знаку від лагни; показує контекст ініціативи, не гарантований результат.',
   'Mars is '+mars.houseFromLagna+' signs from the ascendant; this is context for initiative, not an outcome guarantee.'));
 const topic=calendar.topic;
 const guidePlanet=topic==='work'||topic==='money'?mercury:topic==='relationships'?venus:
  topic==='travel'?mars:jupiter;
 add('TOPIC_PLANET_'+guidePlanet.name.toUpperCase(),'gochar','context',L(
  'Планета, пов’язана з темою, у '+guidePlanet.houseFromLagna+'-му знаку від лагни. Положення враховано без вигаданих аспектів.',
  'A planet associated with the topic is '+guidePlanet.houseFromLagna+' signs from the ascendant. No uncomputed aspects are assumed.'));
 const major=report.period?.lord||null,minor=report.period?.antardasha?.lord||null;
 if(major)add('ACTIVE_VIMSHOTTARI','dasha','context',L(
  'Активна махадаша '+major+(minor?' та антардаша '+minor:'')+'. Саме по собі ім’я планети не означає успіх або невдачу.',
  'Current Mahadasha '+major+(minor?' and Antardasha '+minor:'')+'. The ruling planet alone does not prove success or failure.'));
 else add('DASHA_UNAVAILABLE','dasha','context',L('На цю дату активний період Вімшоттарі не підтверджено.',
  'No verified active Vimshottari period for this date.'));
 const moonMixed=tara==='supportive'&&moon==='challenging'||tara==='challenging'&&moon==='supportive';
 const cautions=tara==='challenging'||tara==='caution'||moon==='challenging'||saturnSensitive||marsSensitive;
 const status:P33Result['status']=calendar.status==='avoid'||ashtama?'avoid':
  calendar.status==='caution'||cautions?'caution':
  calendar.status==='supported'&&tara==='supportive'&&moon==='supportive'?'supported':'neutral';
 const subj=activity[topic];
 const headline=status==='avoid'?L('Для вас це несприятливий час починати','This is an unfavourable time for you to start'):
  status==='caution'?L('Для вас є причини відкласти початок','Personal factors favour postponing the start'):
  status==='supported'?L('День підтримує ваш задум','The day supports your plan'):
  L('Особисті показники не дають чіткого дозволу','Personal factors give no clear go-ahead');
 const action=status==='avoid'||status==='caution'?subj.prepare:status==='supported'?
  subj.consider:L('Для '+subj.noun.uk+' перевірте інший час; точна персональна мухурта ще не розрахована.',
   'For '+subj.noun.en+', check another time; a precise personal muhurta has not been calculated.');
 const reason=calendar.status==='avoid'?L(
  'Загальне сильне обмеження Панчанги діє незалежно від сприятливих натальних показників.',
  'A strong Panchanga exclusion remains in force even if natal indicators are supportive.'):
  ashtama?L('Аштама-чандра має пріоритет над сприятливими ознаками для початку нових справ.',
   'Ashtama Chandra takes priority over supportive factors for new beginnings.'):
  moonMixed?L(
   'Різні показники Місяця дають протилежні сигнали: за накшатрою '+(tara==='supportive'?'підтримка':'напруга')+', за знаком '+(moon==='supportive'?'підтримка':'напруга')+'.',
   'The lunar factors conflict: nakshatra '+(tara==='supportive'?'supports':'cautions')+', Moon sign '+(moon==='supportive'?'supports':'cautions')+'.'):
  calendar.status==='caution'?L('Загальний календар уже містить застереження; натальна карта його не скасовує.',
   'The general calendar already carries a caution; the birth chart does not erase it.'):
  cautions?L('Положення поточного Місяця або важливий транзит напружений для вашої карти.',
   'The current Moon or a relevant transit is challenging relative to your chart.'):
  L('Загальні календарні та місячні натальні показники узгоджуються.',
   'General calendar and natal lunar indicators agree.');
 const missing:string[]=['PRECISE_PERSONAL_MUHURTA_P34'];
 if(!major)missing.push('VERIFIED_ACTIVE_VIMSHOTTARI');
 return {version:'personal-resonance-p33',personalized:true,scope:'verified-own-natal',
  status,headline,action,reason,atUtc:expectedAtUtc,
  sourceCalendarStatus:calendar.status,topic,
  activePeriod:major,missing,
  evidence};
}
