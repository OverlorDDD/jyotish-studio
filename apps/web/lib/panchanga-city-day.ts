/** Pure presentation helpers for server-rendered city Panchanga pages.
 * No astronomy is computed here: every value and boundary comes from the
 * verified /api/v1/panchanga/day response. Self-contained for node tests. */
export type CityLocale='uk'|'en';
type Tithi={number:number;paksha:string;numberWithinPaksha:number};
type Nakshatra={number:number;name:string;pada:number};
type Named={number:number;name:string};
type Karana={slot:number;name:string};
type Period<V>={index:number;startUtc:string;endUtc:string;value:V};
type Kala={fromUtc:string;untilUtc:string};
export type CityDay={
 date:string;sunriseUtc:string;sunsetUtc:string;nextSunriseUtc:string;
 location:{timeZone:string;latitude:number;longitude:number};
 sunrise:{tithi:Tithi;nakshatra:Nakshatra;vara:Named;yoga:Named;karana:Karana};
 periods:{tithi:Period<Tithi>[];nakshatra:Period<Nakshatra>[];yoga:Period<Named>[];karana:Period<Karana>[]};
 daytimeKalas?:{rahuKalam:Kala;yamaganda:Kala;gulikaKalam:Kala};
};
export type CityKind='tithi'|'nakshatra'|'vara'|'yoga'|'karana';
export type CityRow={kind:CityKind;name:string;value:string;until:string|null};
export type CityChange={kind:Exclude<CityKind,'vara'>;name:string;value:string;at:string};

const TITHI_EN=['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami',
 'Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi'];
const TITHI_UK=['Пратіпада','Двітія','Трітія','Чатуртхі','Панчамі','Шаштхі','Саптамі','Аштамі',
 'Навамі','Дашамі','Екадаші','Двадаші','Трайодаші','Чатурдаші'];
const NAK_UK=['Ашвіні','Бхарані','Кріттіка','Рохіні','Мрігашіра','Ардра','Пунарвасу','Пуш’я','Ашлеша',
 'Магха','Пурва Пхалгуні','Уттара Пхалгуні','Хаста','Чітра','Сваті','Вішакха','Анурадха','Дж’єштха',
 'Мула','Пурва Ашадха','Уттара Ашадха','Шравана','Дханіштха','Шатабхіша','Пурва Бхадрапада',
 'Уттара Бхадрапада','Реваті'];
const YOGA_UK=['Вішкумбха','Пріті','Аюшман','Саубхаг’я','Шобхана','Атіганда','Сукарма','Дхріті','Шула',
 'Ганда','Вріддхі','Дхрува','В’ягхата','Харшана','Ваджра','Сіддхі','В’ятіпата','Варіяна','Парігха',
 'Шіва','Сіддха','Садх’я','Шубха','Шукла','Брахма','Індра','Вайдхріті'];
const KARANA_UK:Record<string,string>={Kimstughna:'Кімстугхна',Bava:'Бава',Balava:'Балава',Kaulava:'Каулава',
 Taitila:'Тайтіла',Garaja:'Гараджа',Vanija:'Ваніджа',Vishti:'Вішті',Shakuni:'Шакуні',
 Chatushpada:'Чатушпада',Naga:'Нага'};
const VARA:Record<string,{uk:string;en:string}>={
 Ravivara:{uk:'Равівара — неділя, день Сонця',en:'Ravivara — Sunday, day of the Sun'},
 Somavara:{uk:'Сомавара — понеділок, день Місяця',en:'Somavara — Monday, day of the Moon'},
 Mangalavara:{uk:'Мангалавара — вівторок, день Марса',en:'Mangalavara — Tuesday, day of Mars'},
 Budhavara:{uk:'Будхавара — середа, день Меркурія',en:'Budhavara — Wednesday, day of Mercury'},
 Guruvara:{uk:'Гурувара — четвер, день Юпітера',en:'Guruvara — Thursday, day of Jupiter'},
 Shukravara:{uk:'Шукравара — п’ятниця, день Венери',en:'Shukravara — Friday, day of Venus'},
 Shanivara:{uk:'Шанівара — субота, день Сатурна',en:'Shanivara — Saturday, day of Saturn'}
};
export const CITY_ANGA_NAMES={
 uk:{tithi:'Тітхі',nakshatra:'Накшатра',vara:'Вара',yoga:'Нітья-йога',karana:'Карана'},
 en:{tithi:'Tithi',nakshatra:'Nakshatra',vara:'Vara',yoga:'Nitya Yoga',karana:'Karana'}
} as const;

export function tithiLabel(value:Tithi,locale:CityLocale):string{
 const n=value.numberWithinPaksha;
 if(!Number.isInteger(n)||n<1||n>15||(value.paksha!=='Shukla'&&value.paksha!=='Krishna'))
  throw Error('Invalid tithi');
 const uk=locale==='uk',shukla=value.paksha==='Shukla';
 if(n===15)return shukla?(uk?'Пурніма (повня)':'Purnima (full Moon)'):(uk?'Амавасья (новий Місяць)':'Amavasya (new Moon)');
 const paksha=uk?(shukla?'Шукла':'Крішна'):value.paksha;
 return paksha+' '+(uk?TITHI_UK:TITHI_EN)[n-1]+' ('+n+')';
}
export function nakshatraLabel(value:Nakshatra,locale:CityLocale,withPada=true):string{
 if(!Number.isInteger(value.number)||value.number<1||value.number>27)throw Error('Invalid nakshatra');
 const name=locale==='uk'?NAK_UK[value.number-1]:value.name;
 return withPada&&Number.isInteger(value.pada)&&value.pada>=1&&value.pada<=4
  ?name+(locale==='uk'?', пада ':', pada ')+value.pada:name;
}
export const varaLabel=(value:Named,locale:CityLocale)=>VARA[value.name]?.[locale]||value.name;
export const yogaLabel=(value:Named,locale:CityLocale)=>locale==='uk'?YOGA_UK[value.number-1]||value.name:value.name;
export const karanaLabel=(value:Karana,locale:CityLocale)=>locale==='uk'?KARANA_UK[value.name]||value.name:value.name;

const tag=(locale:CityLocale)=>locale==='uk'?'uk-UA':'en-GB';
export function cityClock(utc:string,zone:string,locale:CityLocale):string{
 const at=new Date(utc);
 if(!Number.isFinite(at.getTime()))throw Error('Invalid instant');
 return new Intl.DateTimeFormat(tag(locale),{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(at);
}
/** Local civil date (YYYY-MM-DD) of an instant in the city's zone. */
export function cityCivilDate(at:Date,zone:string):string{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(at);
 const p=(k:string)=>parts.find(x=>x.type===k)?.value||'';
 return p('year')+'-'+p('month')+'-'+p('day');
}
export function nextCivilDate(day:string):string{
 const ms=Date.parse(day+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(ms))throw Error('Invalid local date');
 return new Date(ms+86400000).toISOString().slice(0,10);
}
export function cityLongDate(day:string,locale:CityLocale):string{
 return new Intl.DateTimeFormat(tag(locale),{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'})
  .format(new Date(day+'T12:00:00Z'));
}
/** Clock time, with the day and month added when the instant is not on the page's civil date. */
export function cityMoment(utc:string,day:CityDay,locale:CityLocale):string{
 const zone=day.location.timeZone,clock=cityClock(utc,zone,locale);
 if(cityCivilDate(new Date(utc),zone)===day.date)return clock;
 const date=new Intl.DateTimeFormat(tag(locale),{timeZone:zone,day:'numeric',month:'long'}).format(new Date(utc));
 return clock+', '+date;
}
function label(kind:Exclude<CityKind,'vara'>,value:unknown,locale:CityLocale):string{
 if(kind==='tithi')return tithiLabel(value as Tithi,locale);
 if(kind==='nakshatra')return nakshatraLabel(value as Nakshatra,locale);
 if(kind==='yoga')return yogaLabel(value as Named,locale);
 return karanaLabel(value as Karana,locale);
}
const CHANGING=['tithi','nakshatra','yoga','karana'] as const;
function inDay(day:CityDay,kind:typeof CHANGING[number]){
 const start=Date.parse(day.sunriseUtc),end=Date.parse(day.nextSunriseUtc);
 const list=day.periods?.[kind] as Period<unknown>[]|undefined;
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||!Array.isArray(list))throw Error('Invalid Panchanga day');
 const visible=list.filter(p=>Date.parse(p.endUtc)>start&&Date.parse(p.startUtc)<end)
  .sort((a,b)=>Date.parse(a.startUtc)-Date.parse(b.startUtc));
 if(visible.length===0||Date.parse(visible[0].startUtc)>start)throw Error('Missing verified '+kind+' at sunrise');
 return {visible,end};
}
/** Five limbs at local sunrise with the moment each one hands over, if it does before the next sunrise. */
export function citySunriseRows(day:CityDay,locale:CityLocale):CityRow[]{
 const names=CITY_ANGA_NAMES[locale];
 const row=(kind:typeof CHANGING[number]):CityRow=>{
  const {visible,end}=inDay(day,kind),first=visible[0],until=Date.parse(first.endUtc);
  return {kind,name:names[kind],value:label(kind,first.value,locale),
   until:until<end?cityMoment(first.endUtc,day,locale):null};
 };
 return [row('tithi'),row('nakshatra'),
  {kind:'vara',name:names.vara,value:varaLabel(day.sunrise.vara,locale),until:null},
  row('yoga'),row('karana')];
}
/** Chronological list of every limb that begins after sunrise and before the next sunrise. */
export function cityChanges(day:CityDay,locale:CityLocale):CityChange[]{
 const names=CITY_ANGA_NAMES[locale];
 return CHANGING.flatMap(kind=>inDay(day,kind).visible.slice(1).map(p=>({kind,name:names[kind],
  value:label(kind,p.value,locale),at:p.startUtc})))
  .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))
  .map(item=>({...item,at:cityMoment(item.at,day,locale)}));
}
/** Guard against a response for another date or place being rendered under this city. */
export function cityDayMatches(day:unknown,date:string,city:{timeZone:string;latitude:number;longitude:number}):day is CityDay{
 const d=day as CityDay|null;
 return !!d&&d.date===date&&d.location?.timeZone===city.timeZone&&
  Math.abs(d.location.latitude-city.latitude)<1e-6&&Math.abs(d.location.longitude-city.longitude)<1e-6&&
  typeof d.sunriseUtc==='string'&&typeof d.sunsetUtc==='string'&&typeof d.nextSunriseUtc==='string'&&
  !!d.sunrise&&!!d.periods;
}
