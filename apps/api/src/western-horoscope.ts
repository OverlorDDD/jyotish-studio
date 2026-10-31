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
type Body={longitude:number;sign:number};
type TropicalSky={sampledAtUtc:string;sun:Body;moon:Body;method:string};
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
   return {sampledAtUtc:utc,sun:compute(sw.Planet.Sun,'Sun'),
    moon:compute(sw.Planet.Moon,'Moon'),method:TROPICAL_METHOD};
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
const caution=[
 l('Не поспішай робити висновок лише за настроєм дня.','Do not draw sweeping conclusions from a passing mood.'),
 l('Не перенось чужі очікування у власні плани.','Do not let others’ expectations quietly become your plan.'),
 l('Пам’ятай: астрологічний образ не замінює реальних обставин.','Remember that an astrological symbol does not replace real circumstances.'),
 l('Не сприймай загальний прогноз як гарантію події.','Do not treat a general forecast as a promise of an event.')
] as const;
const dayTags=[
 l('Тема дня','Today's theme'),
 l('Новий погляд','A fresh angle'),
 l('Свій ритм','Your pace'),
 l('Малий крок','A small step')
] as const;
const variations=[
 l('Зверни увагу на практичну сторону цього питання.','Look at the practical side of this theme.'),
 l('Подивись, що можна змінити без зайвого поспіху.','Consider what can change without rushing.'),
 l('Намагайся відрізнити справді важливе від другорядного.','Try to distinguish what matters from what can wait.'),
 l('Почни з маленького спостереження, а не великого висновку.','Begin with a small observation rather than a big conclusion.')
] as const;
export function westernSignReading(referenceSign:number,sky:TropicalSky,date:string){
 if(!Number.isInteger(referenceSign)||referenceSign<1||referenceSign>12||
    !validLocalDay(date))throw Error('Invalid tropical sign reading');
 const sunHouse=((sky.sun.sign-referenceSign+12)%12)+1;
 const moonHouse=((sky.moon.sign-referenceSign+12)%12)+1;
 const solar=solarHouses[sunHouse-1],lunar=lunarFocus[moonHouse-1];
 const dayNumber=Math.floor(Date.parse(date+'T00:00:00Z')/86400000);
 const v=((dayNumber%4)+4)%4;
 return {
  referenceSign,house:moonHouse,
  headline:l(solar.name.uk+' · '+dayTags[v].uk,solar.name.en+' · '+dayTags[v].en),
  description:l(
   'У західній тропічній традиції Сонце зараз проходить '+sunHouse+'-й дім від обраного сонячного знака. Символічний акцент цього періоду — '+solar.focus.uk+'. Місячний транзит через '+moonHouse+'-й дім додає запитання: '+lunar.uk+'? '+variations[v].uk,
   'In the Western tropical whole-sign approach, today’s Sun falls in house '+sunHouse+' counted from the selected Sun sign. The traditional theme is '+solar.focus.en+'. The Moon in house '+moonHouse+' adds a question: '+lunar.en+'? '+variations[v].en
  ),
  goodFor:l(solar.step.uk+' '+variations[v].uk,solar.step.en+' '+variations[v].en),
  caution:caution[v],
  reflection:l('Який крок у цій темі буде доречним саме для твоїх обставин?','What small step would fit your actual circumstances?'),
  evidence:{
   kind:'PUBLIC_TROPICAL_SOLAR_REFERENCE',method:TROPICAL_METHOD,
   sampledAtUtc:sky.sampledAtUtc,day:date,
   sunSign:sky.sun.sign,sunLongitude:sky.sun.longitude,
   moonSign:sky.moon.sign,moonLongitude:sky.moon.longitude,
   sunHouse,house:moonHouse,referenceSign,editorialCycle:v
  }
 };
}
export const WESTERN_HOROSCOPE_SOURCES={
 astronomy:'Swiss Ephemeris tropical-of-date; verified SWIEPH backend',
 interpretation:'Western whole-sign Sun-sign and Moon-transit symbolism; editorial themes, not event predictions',
 individualBirthChart:false
} as const;
