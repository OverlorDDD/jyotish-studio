/**
 * P3.8.1–P3.8.3: Activity-specific, auditable electional screening.
 * This module REPLACES binary old P3.2/P3.3 verdicts in future P3.8 UI,
 * but does NOT alter P3.7 production until the electional QA gate is green.
 *
 * Rules must describe an exact undertaking (e.g. beginning a journey),
 * not a broad life outcome (e.g. 'love will go well').
 * Lunar geometry, Tithi, Karana and phase must not be independently scored.
 * Incomplete event-Lagna/partner requirements NEVER become 'good muhurta'.
 */
import {p37NakshatraClass,explainClassicalPanchanga} from './panchanga-p37-classical.ts';
import {interpretPanchanga,type P32Day} from './panchanga-p32-engine.ts';
import {p34Boundaries,type P34PrivateTiming} from './panchanga-p34-time-guidance.ts';
import {validateP33Report,type P33Report,type P33Point} from './panchanga-p33-resonance.ts';

type Lang={uk:string;en:string};
const L=(uk:string,en:string):Lang=>({uk,en});
export type P38Category='work'|'finance'|'relationships'|'travel'|'education'|'home'|'spiritual'|'personal';
export type P38ActivityId=
 'job_start'|'job_interview'|'salary_discussion'|'shop_opening'|
 'sale_start'|'borrowing_money'|'major_agreement'|'major_purchase'|
 'making_friends'|'first_date'|'reconciliation'|'engagement'|'wedding'|
 'short_journey'|'long_journey'|'business_journey'|'house_move'|
 'education_start'|'arts_start'|'foundation'|'house_entry'|'repair_start'|
 'daily_meditation'|'hatha_sadhana'|'creative_project';
export type P38Method='direct'|'analogy'|'special_election'|'routine';
export type P38Activity={
 id:P38ActivityId;category:P38Category;name:Lang;method:P38Method;
 // These sets are named traditional choices, not positive numerical weights.
 matchingNakshatra:readonly string[];
 source:string;sourceDetail:string;
 required:readonly ('natal_chart'|'partner_chart'|'event_location'|'election_lagna')[];
};
const STAR_SOURCE='https://www.drikpanchang.com/panchang/nakshatra/classification/nakshatra-seven-category.html';
const RAMAN_SOURCE='https://ved.bz/_jyotish/books/muhurtha.html';
const CHINTAMANI_SOURCE='https://karmasakha.com/texts/muhurta-chintamani';
const C=(id:P38ActivityId,category:P38Category,uk:string,en:string,method:P38Method,
 matchingNakshatra:string[],source:string,sourceDetail:string,required:P38Activity['required']=[]):P38Activity=>
 ({id,category,name:L(uk,en),method,matchingNakshatra,source,sourceDetail,required});
export const P38_ACTIVITIES:readonly P38Activity[]=[
 C('job_start','work','Початок роботи','Starting a job','direct',['fixed','gentle'],STAR_SOURCE,'Fixed Nakshatra: starting service'),
 C('job_interview','work','Співбесіда','Job interview','analogy',[],RAMAN_SOURCE,'Chapter III: interviewing superiors, short elections'),
 C('salary_discussion','work','Переговори про оплату','Salary discussion','analogy',[],RAMAN_SOURCE,'Chapter III: interviewing superiors'),
 C('shop_opening','work','Відкриття магазину','Opening a shop','direct',['swift'],STAR_SOURCE,'Short Nakshatra: starting a shop'),
 C('sale_start','finance','Початок продажів','Starting sales','direct',['swift'],STAR_SOURCE,'Short Nakshatra: selling'),
 C('borrowing_money','finance','Позика коштів','Borrowing money','special_election',[],RAMAN_SOURCE,'Chapter XVII: Borrowing Money', ['natal_chart','event_location','election_lagna']),
 C('major_agreement','finance','Фінансова угода','Financial agreement','special_election',[],RAMAN_SOURCE,'Chapter XVII: business elections', ['natal_chart','event_location','election_lagna']),
 C('major_purchase','finance','Велика покупка','Major purchase','special_election',[],RAMAN_SOURCE,'Chapter XVII: Buying for Business', ['natal_chart','event_location','election_lagna']),
 C('making_friends','relationships','Знайомство й дружня зустріч','Meeting people and making friends','direct',['gentle'],STAR_SOURCE,'Gentle Nakshatra: making friends'),
 C('first_date','relationships','Перше побачення','First date','analogy',['gentle'],STAR_SOURCE,'Gentle Nakshatra: making friends (modern analogy, not an ancient date rule)'),
 C('reconciliation','relationships','Примирення','Reconciliation','analogy',['gentle'],STAR_SOURCE,'Gentle Nakshatra: friendship, peaceful dealings'),
 C('engagement','relationships','Заручини','Engagement','special_election',[],RAMAN_SOURCE,'Chapter IX: Marriage preliminaries', ['natal_chart','partner_chart','event_location','election_lagna']),
 C('wedding','relationships','Весілля','Wedding','special_election',[],CHINTAMANI_SOURCE,'Adhyaya 6: Vivaha Prakaranam; verify event Lagna', ['natal_chart','partner_chart','event_location','election_lagna']),
 C('short_journey','travel','Коротка поїздка','Short journey','direct',['movable','swift'],STAR_SOURCE,'Movable Nakshatra: journeys; Short Nakshatra inherits movable'),
 C('long_journey','travel','Далека подорож','Long-distance travel','special_election',['movable','swift'],RAMAN_SOURCE,'Chapter XIV: travel, election Lagna', ['natal_chart','event_location','election_lagna']),
 C('business_journey','travel','Ділове відрядження','Business journey','special_election',['movable','swift'],RAMAN_SOURCE,'Chapter XIV: Business Journeys', ['natal_chart','event_location','election_lagna']),
 C('house_move','travel','Переїзд','Moving residence','special_election',[],RAMAN_SOURCE,'Chapter XVII: shifting from place to place', ['natal_chart','event_location','election_lagna']),
 C('education_start','education','Початок навчання','Beginning a course','direct',['swift'],STAR_SOURCE,'Short Nakshatra: starting education'),
 C('arts_start','education','Заняття мистецтвом','Beginning art or music training','direct',['gentle','swift'],STAR_SOURCE,'Gentle and Short Nakshatra: arts and learning'),
 C('foundation','home','Закладання фундаменту','Laying a foundation','special_election',['fixed','gentle'],RAMAN_SOURCE,'Chapter XII: House Building; event Lagna', ['natal_chart','event_location','election_lagna']),
 C('house_entry','home','Новосілля','House entry','special_election',[],RAMAN_SOURCE,'Chapter X: Entering a new house', ['natal_chart','event_location','election_lagna']),
 C('repair_start','home','Початок ремонту','Beginning house repairs','special_election',[],RAMAN_SOURCE,'Chapter XII: Repairing Houses', ['natal_chart','event_location','election_lagna']),
 C('daily_meditation','spiritual','Щоденна медитація','Daily meditation','routine',[],RAMAN_SOURCE,'Chapter III: elections apply to beginnings; no ban on continuing daily practice'),
 C('hatha_sadhana','spiritual','Початок хатха-йога садхани','Beginning Hatha Yoga sadhana','direct',['sharp'],STAR_SOURCE,'Ferocious Nakshatra: Sadhana and Hatha Yoga (specific practice)'),
 C('creative_project','personal','Творчий проєкт','Creative project','analogy',['gentle','swift'],STAR_SOURCE,'Gentle/Short Nakshatra: fine arts and learning')
] as const;
const REGISTRY=new Map(P38_ACTIVITIES.map(a=>[a.id,a]));
if(REGISTRY.size!==P38_ACTIVITIES.length)throw Error('P38 activity id collision');
export function p38Activity(id:P38ActivityId):P38Activity{
 const found=REGISTRY.get(id);if(!found)throw Error('P38 unknown activity');return found;
}
export type P38Observation={
 id:string;polarity:'supports'|'excludes'|'context'|'cautions';
 domain:'nakshatra'|'tithi'|'yoga'|'karana'|'vara'|'rahu'|'tarabala'|'chandrabala';
 description:Lang;source:string;scope:'activity'|'general_election'|'personal';
};
export type P38Verdict='candidate'|'avoid'|'needs_full_election'|'mixed'|'undetermined'|'routine';
export type P38Moment={
 version:'p38-election-screening-v1';activityId:P38ActivityId;
 date:string;atUtc:string;sunriseUtc:string;nextSunriseUtc:string;
 verdict:P38Verdict;personalized:boolean;activityMethod:P38Method;
 matchedNakshatraClass:string;observations:P38Observation[];
 missingRequirements:readonly P38Activity['required'][number][];
 // Important: calendar screening is not a final complete muhurta.
 certification:'calendar-screening-only';
};
const GUARD=(ok:unknown,msg:string):asserts ok=>{if(!ok)throw Error('P38 source identity: '+msg);};
const STAR_RESTRICTIONS_FOR_TRAVEL=new Set([2,3]); // Bharani, Krittika: Raman Ch XIV.
const BORROW_RESTRICTED_STARS=new Set([3,7,19,23]); // Raman Ch XVII + natal star separately.
const STANDARD_BAD_YOGAS=new Set([6,9,10,17,27]); // Raman Ch V: Panchanga Suddhi.
const GENERAL_TITHI_CAUTION=new Set([4,6,8,14,15]); // Raman Ch II/V: 15 = full/new Moon
const IMPORTANT_TITHI_CAUTION=new Set([12]); // Raman Ch II explicitly notes an exception if other limbs are strong
const GENERAL_ELECTION=new Set<P38Method>(['direct','analogy','special_election']);
function active<K extends keyof P32Day['periods']>(day:P32Day,key:K,t:number){
 const p=day.periods[key].filter(i=>Date.parse(i.startUtc)<=t&&t<Date.parse(i.endUtc));
 if(p.length!==1)throw Error('P38 missing/overlapping verified '+key);
 return p[0].value;
}
export function evaluateP38(day:P32Day,timeUtc:string,activityId:P38ActivityId,
 privateInput?:{point:P33Point;report:P33Report}):P38Moment{
 const activity=p38Activity(activityId),time=Date.parse(timeUtc),start=Date.parse(day.sunriseUtc),end=Date.parse(day.nextSunriseUtc);
 if(!Number.isFinite(time)||!Number.isFinite(start)||!Number.isFinite(end)||
   time<start||time>=end||new Date(time).toISOString()!==timeUtc)
  throw Error('P38 sample outside verified UTC sunrise day');
 // Reuse canonical sunrise, Swiss period, weekday, tithi, Yoga and Karana
 // validation; DO NOT reuse its simplistic supported/caution status or action.
 const validatedCalendar=interpretPanchanga(day,time,activity.category==='finance'?'money':
  activity.category==='education'?'study':activity.category==='relationships'?'relationships':
  activity.category==='home'?'home':activity.category==='travel'?'travel':
  activity.category==='work'?'work':'personal','at-instant');
 explainClassicalPanchanga(day,validatedCalendar); // verify names, indexes, five matching active UTC limbs
 const nk=active(day,'nakshatra',time) as P32Day['sunrise']['nakshatra'];
 const tithi=active(day,'tithi',time) as P32Day['sunrise']['tithi'];
 const yoga=active(day,'yoga',time) as P32Day['sunrise']['yoga'];
 const karana=active(day,'karana',time) as P32Day['sunrise']['karana'];
 // A Karana is a half-Tithi: slot and Tithi must refer to the SAME solar–lunar
 // elongation. P3.2 checks names but did not cross-check this invariant.
 if(Math.ceil(karana.slot/2)!==tithi.number)
  throw Error('P38 impossible Tithi/Karana angular combination');
 const cls=p37NakshatraClass(nk.number);
 const result:P38Observation[]=[];
 const push=(id:string,polarity:P38Observation['polarity'],
  domain:P38Observation['domain'],description:Lang,source:string,scope:P38Observation['scope'])=>{
   result.push({id,polarity,domain,description,source,scope});
 };
 const important=activity.method==='special_election';
 const definedNewStart=activity.method==='direct'||activity.method==='special_election';
 if(activity.matchingNakshatra.includes(cls))push('CLASS_'+cls.toUpperCase(),'supports','nakshatra',
  L('Клас накшатри відповідає виду починання.','This Nakshatra class matches the chosen undertaking.'),
  activity.source,'activity');
 else if(activity.matchingNakshatra.length>0)push('CLASS_NO_POSITIVE_MATCH','context','nakshatra',
  L('Цей клас не зазначений як особливо придатний для цієї дії.','This class is not named as a preferred class for this activity.'),
  activity.source,'activity');
 if(activity.category==='travel'&&STAR_RESTRICTIONS_FOR_TRAVEL.has(nk.number))
  push('RAMAN_TRAVEL_STAR','excludes','nakshatra',
   L('Для початку подорожі Раман виключає Бхарані й Кріттіку.','Raman excludes Bharani and Krittika for starting journeys.'),
   RAMAN_SOURCE,'activity');
 if(activity.category==='travel'&&[8,9].includes(tithi.numberWithinPaksha))
  push('RAMAN_TRAVEL_TITHI','excludes','tithi',
   L('Для початку подорожі Раман виключає 8-му й 9-ту тітхі.','Raman excludes the 8th and 9th tithis for the start of a journey.'),
   RAMAN_SOURCE,'activity');
 if(activityId==='borrowing_money'&&BORROW_RESTRICTED_STARS.has(nk.number))
  push('RAMAN_BORROW_STAR','excludes','nakshatra',
   L('Для позики Раман називає цю накшатру невідповідною.','Raman lists this nakshatra as unsuitable for borrowing.'),
   RAMAN_SOURCE,'activity');
 if(activity.method!=='routine'){
  const rahu=day.daytimeKalas.rahuKalam;
  if(time>=Date.parse(rahu.fromUtc)&&time<Date.parse(rahu.untilUtc))
   push('RAHU_START',definedNewStart?'excludes':'context','rahu',
    L('Момент початку припадає на місцевий Раху-калам.','The start falls within local Rahu Kalam.'),
    RAMAN_SOURCE,'general_election');
  if(karana.name==='Vishti')push('VISHTI_AUSPICIOUS_START',definedNewStart?'excludes':'context','karana',
   L('Вішті (Бхадра) не обирають для сприятливих нових починань.','Vishti (Bhadra) is avoided for auspicious beginnings.'),
   RAMAN_SOURCE,'general_election');
  if(STANDARD_BAD_YOGAS.has(yoga.number))
   push('RAMAN_YOGA_'+yoga.number,'cautions','yoga',
    L('Для важливих починань Раман називає цю нітья-йогу несприятливою.','Raman flags this Nitya Yoga for important new beginnings.'),
    RAMAN_SOURCE,'general_election');
  if(GENERAL_TITHI_CAUTION.has(tithi.numberWithinPaksha))
   push('RAMAN_TITHI_CAUTION','cautions','tithi',
    L('Для початку важливої нової справи ця тітхі потребує перевірки умов і винятків.',
      'This tithi calls for additional review before a major new beginning.'),
    RAMAN_SOURCE,'general_election');
  if(important&&IMPORTANT_TITHI_CAUTION.has(tithi.numberWithinPaksha))
   push('RAMAN_IMPORTANT_TITHI','cautions','tithi',
    L('Для великої церемонії ця тітхі потребує додаткової перевірки.','For an important ceremony this tithi needs additional review.'),
    RAMAN_SOURCE,'general_election');
 }
 if(privateInput){
  validateP33Report(privateInput.report,privateInput.point,day,timeUtc);
  const report=privateInput.report;
  const tara=report.tarabala.taraNumber,cycle=report.tarabala.cycle,
   chandra=report.chandrabala.houseFromJanmaRashi;
  if(tara===1)push('TARA_JANMA','context','tarabala',
   L('Джанма-тара: '+cycle+'-й цикл. Вимоги залежать від виду справи.',
    'Janma Tara in cycle '+cycle+'. Suitability depends on the undertaking.'),
   RAMAN_SOURCE,'personal');
  else if([2,4,6,8,9].includes(tara))push('TARA_SUPPORT','supports','tarabala',
   L('Тара '+tara+' у '+cycle+'-му циклі — підтримувальне традиційне зіставлення.',
    'Tara '+tara+' in cycle '+cycle+' is traditionally supportive.'),
   RAMAN_SOURCE,'personal');
  else if(cycle===1)push('TARA_FIRST_CYCLE','cautions','tarabala',
   L('Тара '+tara+' в першому циклі потребує перевірки традиційних винятків.',
    'Tara '+tara+' in the first cycle requires checking traditional exceptions.'),
   RAMAN_SOURCE,'personal');
  else push('TARA_CYCLE_EXCEPTION','context','tarabala',
   L('Для Тари '+tara+' у '+cycle+'-му циклі діють окремі традиційні винятки; не встановлюємо автоматичну заборону.',
    'Tara '+tara+' in cycle '+cycle+' has traditional cycle exceptions, so no automatic ban is applied.'),
   RAMAN_SOURCE,'personal');
  if([1,3,6,7,10,11].includes(chandra))push('CHANDRA_SUPPORT','supports','chandrabala',
   L('Чандрабала: '+chandra+'-й знак від натального Місяця — підтримувальне положення за обраною таблицею.',
    'Chandrabala: '+chandra+'th from natal Moon is supportive under the selected convention.'),
   CHINTAMANI_SOURCE,'personal');
  else push(chandra===8?'CHANDRA_ASHTAMA':'CHANDRA_OTHER','cautions','chandrabala',
   L('Чандрабала: '+chandra+'-й знак від натального Місяця, особисте застереження для важливого початку.',
    'Chandrabala: '+chandra+'th from natal Moon, a personal caution for an important beginning.'),
   CHINTAMANI_SOURCE,'personal');
  if(activityId==='borrowing_money'&&report.tarabala.birthNakshatraIndex===nk.number)
   push('RAMAN_BORROW_JANMA','excludes','nakshatra',
    L('Раман окремо виключає натальну накшатру для початку позики.',
     'Raman also excludes the birth nakshatra for the beginning of borrowing.'),
    RAMAN_SOURCE,'personal');
 }
 const excluded=result.some(e=>e.polarity==='excludes');
 const cautioned=result.some(e=>e.polarity==='cautions');
 const directClass=result.some(e=>e.polarity==='supports'&&e.domain==='nakshatra');
 const taraSupport=result.some(e=>e.id==='TARA_SUPPORT');
 const lunarSupport=result.some(e=>e.id==='CHANDRA_SUPPORT');
 // There is NO generic unfavorable default. Absence of a positive star is not
 // a prohibition. Mixed lunar readings do not automatically ban every action.
 const personalCompatible=privateInput?taraSupport&&lunarSupport:true;
 let verdict:P38Verdict=activity.method==='routine'?'routine':
  excluded?'avoid':
  important?'needs_full_election':
  directClass&&!cautioned&&personalCompatible?'candidate':
  directClass||cautioned?'mixed':'undetermined';
 // Analogy remains explanatory: it cannot certify a traditional muhurta.
 if(activity.method==='analogy'&&verdict==='candidate')verdict='mixed';
 const required=[...activity.required];
 if(activity.method==='special_election'&&!required.includes('election_lagna'))throw Error('P38 missing event lagna gate');
 return {version:'p38-election-screening-v1',activityId,date:day.date,atUtc:timeUtc,
  sunriseUtc:day.sunriseUtc,nextSunriseUtc:day.nextSunriseUtc,verdict,
  personalized:!!privateInput,activityMethod:activity.method,
  matchedNakshatraClass:cls,observations:result,missingRequirements:required,
  certification:'calendar-screening-only'};
}
export type P38Window={fromUtc:string;untilUtc:string;sampleUtc:string;verdict:P38Verdict;reasonIds:string[]};
export type P38Windows={version:'p38-window-screening-v1';date:string;activityId:P38ActivityId;
 personalized:boolean;windows:P38Window[];nextCandidate:P38Window|null;};
const MIN_WINDOW=15*60*1000;
/** Reuses P3.4 exact ingress segmentation, no synthetic noon/24h assumptions.
 * Personal reports MUST be verified at each identical private sample, otherwise
 * no personal candidate is claimed. Full election activities remain gated.
 */
export function screenP38Day(day:P32Day,point:P33Point,activityId:P38ActivityId,
 fromUtc:string=day.sunriseUtc,privateTiming:P34PrivateTiming|null=null):P38Windows{
 if(day.date!==point.date||day.location.timeZone!==point.timeZone)throw Error('P38 observer mismatch');
 const boundaries=p34Boundaries(day,privateTiming?.events.map(e=>e.atUtc)||[]);
 const from=Date.parse(fromUtc),start=Date.parse(day.sunriseUtc),end=Date.parse(day.nextSunriseUtc);
 if(!Number.isFinite(from)||from<start||from>end)throw Error('P38 invalid from moment');
 if(privateTiming){
  if(privateTiming.status!=='available'||privateTiming.version!=='private-time-guidance-p34'||
    privateTiming.observation!=='VERIFIED_SWISS_BOUNDARIES_AND_OWNED_NATAL'||
    privateTiming.date!==day.date||privateTiming.timeZone!==point.timeZone||
    privateTiming.sunriseUtc!==day.sunriseUtc||privateTiming.nextSunriseUtc!==day.nextSunriseUtc||
    privateTiming.latitude!==Number(point.latitude)||privateTiming.longitude!==Number(point.longitude)||
    privateTiming.samples.length!==boundaries.length-1)
    throw Error('P38 private timing identity or completeness mismatch');
 }
 const windows:P38Window[]=[];
 for(let i=0;i<boundaries.length-1;i++){
  const a=boundaries[i],b=boundaries[i+1],sample=a+Math.min(1000,Math.floor((b-a)/2));
  const at=new Date(sample).toISOString();
  if(privateTiming&&privateTiming.samples[i].atUtc!==at)throw Error('P38 stale private moment');
  const current=evaluateP38(day,at,activityId,privateTiming?{point,report:privateTiming.samples[i].report}:undefined);
  windows.push({fromUtc:new Date(a).toISOString(),untilUtc:new Date(b).toISOString(),
   sampleUtc:at,verdict:current.verdict,reasonIds:current.observations.map(e=>e.id)});
 }
 const nextCandidate=windows.find(w=>w.verdict==='candidate'&&
  Math.max(Date.parse(w.fromUtc),from)+MIN_WINDOW<=Date.parse(w.untilUtc))||null;
 return {version:'p38-window-screening-v1',date:day.date,activityId,
  personalized:!!privateTiming,windows,nextCandidate};
}
