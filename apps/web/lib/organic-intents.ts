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
  intro:{en:'Start with an accurate birth time and place. Compare the Moon and Ascendant in D1 before exploring the narrower D9 and D10 divisional views. A changed time zone or location can change the rising degree.',uk:'Почни з точних часу й місця народження. Спершу розглянь Місяць та Лагну в D1, а потім деталізацію D9 і D10. Помилка часового поясу чи міста може змінити градус асцендента.'},
  steps:[
   {en:'Enter the correct local birth time and birthplace; check the historical time zone.',uk:'Введи місцевий час і місце народження, перевір історичний часовий пояс.'},
   {en:'Review the D1 Moon sign, Lagna and Nakshatra before moving to D9 or D10.',uk:'Перевір місячний знак, Лагну й накшатру в D1, перш ніж перейти до D9 або D10.'},
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
  intro:{en:'Tithi follows the Moon–Sun angle, while calendar dates, sunrise and displayed clock times depend on your location. A daily label cannot replace a real transition time.',uk:'Тітхі визначається кутом між Місяцем і Сонцем, а світанок та відображений час залежать від місця. Назва дня не замінює точного моменту переходу.'},
  steps:[
   {en:'Choose your city and calendar date; confirm that the time zone matches your location.',uk:'Обери місто й дату, перевір місцевий часовий пояс.'},
   {en:'Inspect Tithi and Nakshatra transitions, rather than assuming they change at midnight.',uk:'Переглянь переходи тітхі й накшатри, а не припускай, що вони змінюються опівночі.'},
   {en:'Use the activity guidance as a traditional interpretation; verify specialized Muhurta rules separately.',uk:'Використовуй поради щодо справ як традиційне тлумачення; спеціальні правила мухурти перевіряються окремо.'}
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
