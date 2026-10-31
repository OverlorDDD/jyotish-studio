/** Western tropical astrology — separate from Lahiri/Jyotish.
 * Native Swiss Ephemeris returns TROPICAL longitudes directly (no sidereal
 * flag; no JHora historical ayanamsa adjustment). Reject Moshier fallback.
 * Interpretive tradition: whole-sign transits relative to a tropical natal
 * Sun-sign reference, NOT a personalized natal chart or causal prediction.
 */
import {assertSwissReturnFlags} from './swiss-backend-policy.ts';
import {localToUTC,signIndex} from '../../../packages/jyotish-core/src/index.ts';
import {validLocalDay,validTimeZone} from './personal-transits.ts';
type L={uk:string;en:string};
const l=(uk:string,en:string):L=>({uk,en});
export type Body={longitude:number;sign:number};
export type TropicalPlanet='Sun'|'Moon'|'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn';
export type TropicalSky={sampledAtUtc:string;sun:Body;moon:Body;planets:Record<TropicalPlanet,Body>;method:string};
export const TROPICAL_METHOD='Swiss Ephemeris / tropical-of-date / whole-sign-from-natal-Sun / local-noon-sample-v1';
const memo=new Map<string,Promise<TropicalSky>>();
export async function tropicalSkyAtUtc(utc:string):Promise<TropicalSky>{
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(utc)||
    !Number.isFinite(Date.parse(utc)))throw Error('Invalid UTC birth instant');
 let cached=memo.get(utc);
 if(!cached){
  cached=(async()=>{
   const sw=await import('@swisseph/node');
   const dt=new Date(utc);
   const hour=dt.getUTCHours()+dt.getUTCMinutes()/60+dt.getUTCSeconds()/3600+
    dt.getUTCMilliseconds()/3600000;
   const jd=sw.julianDay(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate(),hour);
   const flags=sw.CalculationFlag.SwissEphemeris|sw.CalculationFlag.Speed;
   const compute=(planet:number,name:string):Body=>{
    const p=sw.calculatePosition(jd,planet,flags);
    assertSwissReturnFlags(p.flags,'Tropical '+name);
    if(!Number.isFinite(p.longitude))throw Error('Invalid tropical '+name+' longitude');
    const longitude=((p.longitude%360)+360)%360;
    return {longitude,sign:signIndex(longitude)+1};
   };
   const planets={
    Sun:compute(sw.Planet.Sun,'Sun'),Moon:compute(sw.Planet.Moon,'Moon'),
    Mercury:compute(sw.Planet.Mercury,'Mercury'),Venus:compute(sw.Planet.Venus,'Venus'),
    Mars:compute(sw.Planet.Mars,'Mars'),Jupiter:compute(sw.Planet.Jupiter,'Jupiter'),
    Saturn:compute(sw.Planet.Saturn,'Saturn')
   };
   return {sampledAtUtc:utc,sun:planets.Sun,moon:planets.Moon,planets,method:TROPICAL_METHOD};
  })();
  memo.set(utc,cached);
  if(memo.size>96)memo.delete(memo.keys().next().value!);
  cached.catch(()=>{if(memo.get(utc)===cached)memo.delete(utc)});
 }
 return cached;
}
export async function tropicalSkyForDay(date:string,zone:string):Promise<TropicalSky>{
 if(!validLocalDay(date)||!validTimeZone(zone))throw Error('Invalid day or IANA time zone');
 return tropicalSkyAtUtc(localToUTC(date,'12:00',zone));
}
const solarHouses=[
 {name:l('Особистий напрям','Identity and direction'),focus:l('власні рішення та ініціативу','personal choices and initiative'),step:l('Назви одну справу, яку справді хочеш почати, і зроби перший невеликий крок.','Name one thing you actually want to start and take a small first step.')},
 {name:l('Цінності та ресурси','Values and resources'),focus:l('особисті пріоритети й повсякденні ресурси','personal priorities and everyday resources'),step:l('Перевір одну регулярну витрату часу чи грошей — чи вона досі варта уваги?','Review one recurring use of time or money: is it still worth it?')},
 {name:l('Розмови та навчання','Communication and learning'),focus:l('розмови, запитання й навчання через дію','conversations, questions and learning by doing'),step:l('Уточни питання, яке довго залишалося без відповіді.','Clarify one question that has been left unanswered.')},
 {name:l('Дім та відновлення','Home and restoration'),focus:l('простір дому та відчуття опори','home and a sense of grounding'),step:l('Зроби свій простір трохи зручнішим для відпочинку.','Make a small change that helps your space feel more restful.')},
 {name:l('Творчість і радість','Creativity and joy'),focus:l('творчість, гру та щирий інтерес','creativity, play and genuine interest'),step:l('Виділи час на заняття, яке приносить радість без змагання.','Make time for an activity you enjoy without measuring results.')},
 {name:l('Звички й порядок','Routines and care'),focus:l('розпорядок дня та корисні звички','daily routines and practical habits'),step:l('Полегши одну частину свого розкладу замість додавати нові справи.','Simplify one part of your schedule instead of adding tasks.')},
 {name:l('Співпраця','Partnership and balance'),focus:l('домовленості та вміння слухати','agreements and reciprocal listening'),step:l('Домовся про одну річ чітко, без здогадів за іншу людину.','Clarify one agreement without guessing what the other person wants.')},
 {name:l('Спільні ресурси та зміни','Shared matters and change'),focus:l('спільні зобов’язання й обдумані зміни','shared responsibilities and considered change'),step:l('Спокійно переглянь один спільний обов’язок або домовленість.','Calmly revisit one shared responsibility or agreement.')},
 {name:l('Обрії та знання','Perspective and study'),focus:l('нові знання й ширший погляд','learning and a broader perspective'),step:l('Знайди надійне джерело для питання, яке хочеш вивчити глибше.','Find one reliable source for a topic you want to understand better.')},
 {name:l('Мета й відповідальність','Goals and responsibility'),focus:l('довгострокові цілі та обов’язки','long-term goals and responsibilities'),step:l('Визнач реалістичний наступний крок для важливої мети.','Define a realistic next step toward an important goal.')},
 {name:l('Спільнота та плани','Community and plans'),focus:l('дружні зв’язки та спільні ініціативи','friendships and shared initiatives'),step:l('Поговори з кимось про ідею, яка могла б принести користь обом.','Talk with someone about an idea that could benefit you both.')},
 {name:l('Тиша та осмислення','Rest and perspective'),focus:l('відпочинок та підсумки','rest and thoughtful closure'),step:l('Залиши час без зайвих повідомлень, щоб завершити незакінчене.','Set aside quiet time to finish one lingering task.')}
] as const;
const lunarFocus=[
 l('який темп зараз підходить саме тобі','which pace works for you now'),
 l('які ресурси насправді доступні','which resources are actually available'),
 l('яку розмову варто прояснити','which conversation deserves clarity'),
 l('що допоможе відчути затишок','what might make home more comfortable'),
 l('де є місце для творчості','where there is room for creativity'),
 l('яку буденну справу можна спростити','which ordinary task can be simplified'),
 l('що потребує взаємної уваги','what calls for mutual attention'),
 l('які межі в спільних справах важливі','which boundaries matter in shared matters'),
 l('яка ідея розширює світогляд','which idea broadens your perspective'),
 l('яка відповідальність на часі','which responsibility matters today'),
 l('який зв’язок хочеться підтримати','which connection you want to nurture'),
 l('що краще завершити або відкласти','what may be worth finishing or postponing')
] as const;
export function westernSignReading(referenceSign:number,sky:TropicalSky,date:string){
 if(!Number.isInteger(referenceSign)||referenceSign<1||referenceSign>12||
    !validLocalDay(date))throw Error('Invalid tropical sign reading');
 const sunHouse=((sky.sun.sign-referenceSign+12)%12)+1;
 const moonHouse=((sky.moon.sign-referenceSign+12)%12)+1;
 const solar=solarHouses[sunHouse-1],lunar=lunarFocus[moonHouse-1];
 return {
  referenceSign,house:moonHouse,
  // Do not invent a day-to-day change when the tropical bodies occupy the
  // same whole-sign houses. Sky-derived themes may correctly recur.
  headline:l(solar.name.uk+' · місячний дім '+moonHouse,
   solar.name.en+' · lunar house '+moonHouse),
  description:l(
   'У західній тропічній традиції Сонце на момент спостереження перебуває у '+sunHouse+'-му цілознаковому домі від обраного сонячного знака. Його традиційна тема — '+solar.focus.uk+'. Місяць перебуває у '+moonHouse+'-му домі; його тема — '+lunar.uk+'. Це символічне загальне трактування, а не передбачення конкретних подій.',
   'In the Western tropical framework, the observed Sun occupies whole-sign house '+sunHouse+' relative to the selected Sun sign. Its traditional theme is '+solar.focus.en+'. The Moon occupies house '+moonHouse+', associated with '+lunar.en+'. These are general symbolic themes, not predictions of specific events.'
  ),
  goodFor:solar.step,
  caution:l('Не сприймай загальний опис транзитів як гарантію подій чи доказ особистих обставин.',
   'A general transit interpretation cannot guarantee events or establish personal circumstances.'),
  reflection:l('Подумай, '+lunar.uk+'.','Consider '+lunar.en+'.'),
  evidence:{
   kind:'PUBLIC_TROPICAL_SOLAR_REFERENCE',method:TROPICAL_METHOD,
   sampledAtUtc:sky.sampledAtUtc,day:date,
   sunSign:sky.sun.sign,sunLongitude:sky.sun.longitude,
   moonSign:sky.moon.sign,moonLongitude:sky.moon.longitude,
   sunHouse,house:moonHouse,referenceSign,
   editorialPolicy:'SKY_DERIVED_WHOLE_SIGN_HOUSE_THEMES_NOT_EVENT_PREDICTION'
  }
 };
}
export const WESTERN_HOROSCOPE_SOURCES={
 astronomy:'Swiss Ephemeris tropical-of-date; verified SWIEPH backend',
 interpretation:'Western whole-sign Sun-sign and Moon-transit symbolism; editorial themes, not event predictions',
 individualBirthChart:false
} as const;
