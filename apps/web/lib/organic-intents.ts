/**
 * G3.2.3: small, reviewed, original topic bridges. No page factory or dynamic
 * city/date routes; every destination already exists in the main sitemap.
 */
export type OrganicLocale='uk'|'en';
export type OrganicKind='jyotish'|'panchanga'|'tarot';
export type Localized={uk:string;en:string};
export type OrganicIntent={
 id:OrganicKind;toolPath:string;keywords:readonly string[];
 heading:Localized;intro:Localized;steps:readonly Localized[];
 guides:readonly {path:string;label:Localized}[];
};
export const ORGANIC_INTENTS:readonly OrganicIntent[]=[
 {
  id:'jyotish',toolPath:'astrology/jyotish',
  keywords:['vedic birth chart','birth chart','kundli','lagna','ascendant','navamsha','dasha','jyotish','джйотіш','натальна карта','лагна','накшатра'],
  heading:{en:'Read your Vedic chart, not just your zodiac label',uk:'Як читати натальну карту, а не лише назву знака'},
  intro:{en:'Start with an accurate birth time and place. Begin with the Moon and Ascendant in D1, then explore any of the 15 other Shodashavarga divisions according to your question; D60 natal houses remain provisional. A changed time zone or location can change the rising degree.',uk:'Почни з точних часу й місця народження. Почни з Місяця й Лагни у D1, а потім досліджуй будь-яку з решти 15 варг відповідно до свого запитання; доми D60 залишаються попередніми. Помилка часового поясу чи міста може змінити градус асцендента.'},
  steps:[
   {en:'Enter the correct local birth time and birthplace; check the historical time zone.',uk:'Введи місцевий час і місце народження, перевір історичний часовий пояс.'},
   {en:'Review the D1 Moon sign, Lagna and Nakshatra, then choose the relevant chart from all 16 divisions.',uk:'Перевір місячний знак, Лагну й накшатру в D1, а потім обери потрібну з 16 варг.'},
   {en:'Use the calculated positions and stated method when comparing two websites.',uk:'Порівнюючи два сайти, зістав вихідні дані, розраховані положення та методику.'}
  ],
  guides:[
   {path:'pedia/vedic-ascendant-birth-time',label:{en:'Why the Ascendant needs an accurate birth time',uk:'Чому Лагна потребує точного часу'}},
   {path:'pedia/how-to-read-vedic-d1-chart',label:{en:'A practical guide to the D1 chart',uk:'Практичний посібник із карти D1'}}
  ]
 },
 {
  id:'panchanga',toolPath:'panchanga',
  keywords:['panchang','panchanga','tithi','nakshatra','rahu kalam','sunrise','vedic calendar','панчанга','тітхі','накшатра','раху-калам','місячний календар'],
  heading:{en:'Find today’s Panchanga for your city — and read its timing',uk:'Дізнайся Панчангу для свого міста та зрозумій час подій'},
  intro:{en:'Panchanga is the Vedic calendar of the day. It reads the day through the lunar cycle and the Moon’s position and, by traditional rules, shows when to begin new things and when to keep to routine. Sunrise and every transition depend on the place, so we calculate them for your city.',uk:'Панчанга — ведичний календар дня. Він описує день за місячним циклом і положенням Місяця та за давніми правилами підказує, коли краще починати нове, а коли зайнятися звичними справами. Час сходу Сонця й усі переходи залежать від міста, тому ми рахуємо їх для вашого.'},
  steps:[
   {en:'Choose your city, or take it from your birth chart.',uk:'Оберіть місто або візьміть його з натальної карти.'},
   {en:'Read the verdict and the hours of the day: green is a good time, rose means do not start anything important.',uk:'Подивіться вердикт і години дня: зелене — добрий час, рожеве — не починайте важливого.'},
   {en:'Plan ahead with the month calendar and the upcoming festivals.',uk:'Плануйте наперед за календарем місяця й найближчими святами.'}
  ],
  guides:[
   {path:'pedia/panchanga-time-by-city',label:{en:'Why Panchanga times differ by city',uk:'Чому час Панчанги відрізняється між містами'}},
   {path:'pedia/what-is-tithi-lunar-day',label:{en:'How a Tithi is calculated',uk:'Як обчислюють тітхі'}}
  ]
 },
 {
  id:'tarot',toolPath:'tarot',
  keywords:['tarot','tarot reading','tarot spread','tarot cards','rider waite','major arcana','таро','розклад таро','значення карт','аркани'],
  heading:{en:'Understand the cards before drawing a Tarot spread',uk:'Розберися зі значеннями карт перед розкладом Таро'},
  intro:{en:'A Tarot card is interpreted in the context of its position and the other cards, not as one universal prediction. The GalaxiTarot library can be explored openly; creating and saving a personal reading requires signing in.',uk:'Значення карти Таро залежить від її позиції та сусідніх карт, а не від одного універсального прогнозу. Бібліотека GalaxiTarot відкрита для читання; власний розклад і збереження потребують входу.'},
  steps:[
   {en:'Read the upright and reversed symbolism in the card library.',uk:'Прочитай прямі та перевернуті значення в бібліотеці карт.'},
   {en:'Choose a one-, three- or ten-card spread for the level of context you want.',uk:'Обери розклад на одну, три або десять карт залежно від запитання.'},
   {en:'Sign in before starting a personal draw; keep the question private.',uk:'Увійди перед персональним розкладом; не публікуй особисте запитання.'}
  ],
  guides:[
   {path:'tarot/cards',label:{en:'Browse the 78 Tarot cards',uk:'Переглянути 78 карт Таро'}},
   {path:'tarot/cards/moon',label:{en:'The Moon card: symbolism and context',uk:'Карта Місяць: символіка та контекст'}}
  ]
 }
];
export function organicIntentForQuery(query:string):OrganicKind|null{
 if(typeof query!=='string'||query.length>200)return null;
 const normalized=query.toLocaleLowerCase().replace(/[\u2010-\u2015]/g,'-').trim();
 for(const entry of ORGANIC_INTENTS){
  if(entry.keywords.some(k=>normalized.includes(k)))return entry.id;
 }
 return null;
}
