/** The 12 signs for the public horoscope (UA/EN), with Western (tropical) and
 * approximate Vedic (sidereal Lahiri) Sun date ranges. Exact ingress dates
 * shift by about a day year to year; the «Зоряний паспорт» computes exactly. */
export type HoroLocale='uk'|'en';
export type HoroSystem='western'|'vedic';
export type HoroPeriod='today'|'tomorrow'|'week'|'month'|'year';
/** The yearly forecast currently published (URL segment /2027). Keep in sync with the API's YEAR_ECLIPSES. */
export const HORO_YEAR=2027;
type L={uk:string;en:string};
export type SignInfo={n:number;slug:string;uk:string;en:string;gen:string;glyph:string;element:L;ruler:L;quality:L;
 western:L;vedic:L;sanskrit:string;traits:L};
const l=(uk:string,en:string):L=>({uk,en});
const FIRE=l('вогонь','fire'),EARTH=l('земля','earth'),AIR=l('повітря','air'),WATER=l('вода','water');
const CARD=l('рухомий','cardinal'),FIXED=l('сталий','fixed'),MUT=l('змінний','mutable');
export const SIGNS:SignInfo[]=[
 {n:1,slug:'aries',uk:'Овен',en:'Aries',gen:'Овна',glyph:'♈',element:FIRE,ruler:l('Марс','Mars'),quality:CARD,western:l('21 березня – 19 квітня','21 March – 19 April'),vedic:l('14 квітня – 14 травня','14 April – 14 May'),sanskrit:'Меша',traits:l('сміливість, ініціатива й прямота','courage, initiative and directness')},
 {n:2,slug:'taurus',uk:'Телець',en:'Taurus',gen:'Тельця',glyph:'♉',element:EARTH,ruler:l('Венера','Venus'),quality:FIXED,western:l('20 квітня – 20 травня','20 April – 20 May'),vedic:l('15 травня – 14 червня','15 May – 14 June'),sanskrit:'Врішабха',traits:l('стійкість, смак до життя й вірність','steadiness, a taste for life and loyalty')},
 {n:3,slug:'gemini',uk:'Близнюки',en:'Gemini',gen:'Близнюків',glyph:'♊',element:AIR,ruler:l('Меркурій','Mercury'),quality:MUT,western:l('21 травня – 20 червня','21 May – 20 June'),vedic:l('15 червня – 15 липня','15 June – 15 July'),sanskrit:'Мітхуна',traits:l('цікавість, дотепність і легкість у спілкуванні','curiosity, wit and ease with words')},
 {n:4,slug:'cancer',uk:'Рак',en:'Cancer',gen:'Рака',glyph:'♋',element:WATER,ruler:l('Місяць','Moon'),quality:CARD,western:l('21 червня – 22 липня','21 June – 22 July'),vedic:l('16 липня – 16 серпня','16 July – 16 August'),sanskrit:'Карка',traits:l('турбота, пам’ять серця й любов до дому','care, a long memory of the heart and love of home')},
 {n:5,slug:'leo',uk:'Лев',en:'Leo',gen:'Лева',glyph:'♌',element:FIRE,ruler:l('Сонце','Sun'),quality:FIXED,western:l('23 липня – 22 серпня','23 July – 22 August'),vedic:l('17 серпня – 16 вересня','17 August – 16 September'),sanskrit:'Сімха',traits:l('щедрість, творчість і гідність','generosity, creativity and dignity')},
 {n:6,slug:'virgo',uk:'Діва',en:'Virgo',gen:'Діви',glyph:'♍',element:EARTH,ruler:l('Меркурій','Mercury'),quality:MUT,western:l('23 серпня – 22 вересня','23 August – 22 September'),vedic:l('17 вересня – 16 жовтня','17 September – 16 October'),sanskrit:'Канья',traits:l('уважність, практичність і бажання допомагати','attentiveness, practicality and a wish to help')},
 {n:7,slug:'libra',uk:'Терези',en:'Libra',gen:'Терезів',glyph:'♎',element:AIR,ruler:l('Венера','Venus'),quality:CARD,western:l('23 вересня – 22 жовтня','23 September – 22 October'),vedic:l('17 жовтня – 15 листопада','17 October – 15 November'),sanskrit:'Тула',traits:l('гармонія, такт і відчуття справедливості','harmony, tact and a sense of fairness')},
 {n:8,slug:'scorpio',uk:'Скорпіон',en:'Scorpio',gen:'Скорпіона',glyph:'♏',element:WATER,ruler:l('Марс','Mars'),quality:FIXED,western:l('23 жовтня – 21 листопада','23 October – 21 November'),vedic:l('16 листопада – 15 грудня','16 November – 15 December'),sanskrit:'Врішчіка',traits:l('глибина, пристрасть і сила волі','depth, passion and willpower')},
 {n:9,slug:'sagittarius',uk:'Стрілець',en:'Sagittarius',gen:'Стрільця',glyph:'♐',element:FIRE,ruler:l('Юпітер','Jupiter'),quality:MUT,western:l('22 листопада – 21 грудня','22 November – 21 December'),vedic:l('16 грудня – 13 січня','16 December – 13 January'),sanskrit:'Дхану',traits:l('оптимізм, свобода й пошук сенсу','optimism, freedom and the search for meaning')},
 {n:10,slug:'capricorn',uk:'Козоріг',en:'Capricorn',gen:'Козорога',glyph:'♑',element:EARTH,ruler:l('Сатурн','Saturn'),quality:CARD,western:l('22 грудня – 19 січня','22 December – 19 January'),vedic:l('14 січня – 12 лютого','14 January – 12 February'),sanskrit:'Макара',traits:l('витримка, відповідальність і довгі плани','endurance, responsibility and long plans')},
 {n:11,slug:'aquarius',uk:'Водолій',en:'Aquarius',gen:'Водолія',glyph:'♒',element:AIR,ruler:l('Сатурн','Saturn'),quality:FIXED,western:l('20 січня – 18 лютого','20 January – 18 February'),vedic:l('13 лютого – 13 березня','13 February – 13 March'),sanskrit:'Кумбха',traits:l('незалежність, ідеї й відданість спільноті','independence, ideas and devotion to community')},
 {n:12,slug:'pisces',uk:'Риби',en:'Pisces',gen:'Риб',glyph:'♓',element:WATER,ruler:l('Юпітер','Jupiter'),quality:MUT,western:l('19 лютого – 20 березня','19 February – 20 March'),vedic:l('14 березня – 13 квітня','14 March – 13 April'),sanskrit:'Міна',traits:l('уява, співчуття й тонке чуття','imagination, compassion and fine intuition')}
];
export const signBySlug=(slug:string)=>SIGNS.find(s=>s.slug===slug);
export const signByN=(n:number)=>SIGNS[n-1];
/** Text presentation of the zodiac glyph (never the colour emoji). */
export const glyph=(s:SignInfo)=>s.glyph+'︎';
export const PERIODS:HoroPeriod[]=['today','tomorrow','week','month'];
export const isPeriod=(x:string):x is HoroPeriod=>(PERIODS as string[]).includes(x);
/** URL segment → period: «week», «month» … or the published year «2027». */
export const periodFromSegment=(x:string|undefined):HoroPeriod|null=>!x?'today':x===String(HORO_YEAR)?'year':isPeriod(x)?x:null;
export function signPath(locale:HoroLocale,system:HoroSystem,slug:string,period:HoroPeriod='today'){
 return '/'+locale+'/horoscope/'+(system==='vedic'?'vedic/':'')+slug+(period==='today'?'':'/'+(period==='year'?HORO_YEAR:period));
}
export const hubPath=(locale:HoroLocale,system:HoroSystem)=>'/'+locale+'/horoscope'+(system==='vedic'?'/vedic':'');
const MONTH_GEN_UK=['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
const MONTH_NOM_UK=['січень','лютий','березень','квітень','травень','червень','липень','серпень','вересень','жовтень','листопад','грудень'];
const MONTH_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
export function dayLabel(date:string,locale:HoroLocale){
 const [y,m,d]=date.split('-').map(Number);
 return locale==='uk'?d+' '+MONTH_GEN_UK[m-1]+' '+y:d+' '+MONTH_EN[m-1]+' '+y;
}
export function shortDay(date:string,locale:HoroLocale){
 const [,m,d]=date.split('-').map(Number);
 return locale==='uk'?d+' '+MONTH_GEN_UK[m-1]:d+' '+MONTH_EN[m-1];
}
/** «4, 5 і 12 листопада» — compact list of days grouped by month. */
export function dayList(dates:string[],locale:HoroLocale){
 const groups:{m:number;days:number[]}[]=[];
 for(const date of [...dates].sort()){
  const [,m,d]=date.split('-').map(Number);
  const last=groups[groups.length-1];
  if(last&&last.m===m)last.days.push(d);else groups.push({m,days:[d]});
 }
 const and=locale==='uk'?' і ':' and ';
 return groups.map(g=>{
  const nums=g.days.length>1?g.days.slice(0,-1).join(', ')+and+g.days[g.days.length-1]:String(g.days[0]);
  return locale==='uk'?nums+' '+MONTH_GEN_UK[g.m-1]:MONTH_EN[g.m-1]+' '+nums;
 }).join('; ');
}
export function monthLabel(date:string,locale:HoroLocale){
 const [y,m]=date.split('-').map(Number);
 return locale==='uk'?MONTH_NOM_UK[m-1]+' '+y:MONTH_EN[m-1]+' '+y;
}
export function weekdayLabel(date:string,locale:HoroLocale,style:'long'|'short'='short'){
 return new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',{timeZone:'UTC',weekday:style}).format(new Date(date+'T12:00:00Z'));
}
export function kyivToday(at=new Date()){
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(at);
}
export const addDays=(d:string,n:number)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export function monthSpan(today:string){
 const [y,m]=today.split('-').map(Number);
 const start=today.slice(0,8)+'01',end=new Date(Date.UTC(y,m,1)).toISOString().slice(0,10);
 return {start,days:Math.round((Date.parse(end)-Date.parse(start))/86400000)};
}
