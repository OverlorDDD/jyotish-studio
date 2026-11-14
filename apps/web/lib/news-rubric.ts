/** «Тиждень у небі» and «Небо місяця»: pages composed from the rubric data the
 * API recomputes with Swiss Ephemeris (events, Panchanga key days at Kyiv
 * sunrise, eclipses, planets retrograde at the start of the period). */
import type {NewsItem,NewsLocale,SkyEvent} from './news-public.ts';
import {composeSkyArticle,planetName,skyEventLabel,type SkyArticle} from './news-sky.ts';

type L={uk:string;en:string};
export type RubricKind='week'|'month';
export type RubricData={kind:RubricKind;key:string;start:string;end:string;days:number;
 events:(SkyEvent&{localDate?:string})[];keyDays:{date:string;kind:'ekadashi'|'purnima'|'amavasya';paksha:'Shukla'|'Krishna'}[];
 eclipses:{type:string;eclipseKind:string|null;maximumUtc:string;visibleHere:boolean}[];retrogradeAtStart:string[]};
export type RubricEntry={key:string;date:string;time:string|null;text:L;weight:number;href?:string;event?:SkyEvent};
export type RubricArticle={lead:L;facts:{label:L;value:L}[];days:{date:string;label:L;entries:RubricEntry[]}[];
 highlights:{title:L;text:L;href?:string}[];retro:L;art:SkyArticle['art']};

const kyiv=(iso:string,locale:NewsLocale,o:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',{timeZone:'Europe/Kyiv',...o}).format(new Date(iso)).replace(/\s*р\.$/,'');
const kyivDate=(iso:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));
const hhmm=(iso:string)=>kyiv(iso,'uk',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
/** A civil date (YYYY-MM-DD) shown as a Kyiv calendar day. */
const dayName=(date:string,locale:NewsLocale,o:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',{timeZone:'UTC',...o}).format(new Date(date+'T12:00:00Z')).replace(/\s*р\.$/,'');
const cap=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1);
/** Mid-sentence: common nouns (phases, eclipse kinds) go lower-case; planet
 * names and Panchanga days stay capitalised. */
const midUk=(s:string)=>/^(Перша|Остання|Повня|Молодик|Повне|Кільцеподібне|Часткове|Напівтіньове|Гібридне|Сонячне|Місячне)\b/.test(s)?s.charAt(0).toLowerCase()+s.slice(1):s;
const KEY_DAY:Record<string,L>={ekadashi:{uk:'Екадаші',en:'Ekadashi'},purnima:{uk:'Пурніма',en:'Purnima'},amavasya:{uk:'Амавасья',en:'Amavasya'}};
const PAKSHA:Record<string,L>={Shukla:{uk:'Шукла',en:'Shukla'},Krishna:{uk:'Крішна',en:'Krishna'}};

function weightOf(e:SkyEvent){
 if(e.kind==='sidereal_ingress')return e.body==='Moon'?1:['Jupiter','Saturn'].includes(e.body||'')?6:e.body==='Sun'?4:3;
 if(e.kind.endsWith('_station'))return 5;
 if(e.kind==='full_moon'||e.kind==='new_moon')return 4;
 if(e.kind.endsWith('_quarter'))return 2;
 return 1;
}
/** `ownStories` link entries to our individual event stories when they exist. */
export function composeRubric(data:RubricData,storyHref:(e:SkyEvent)=>string|undefined,now=Date.now()):RubricArticle{
 const week=data.kind==='week';
 const entries:RubricEntry[]=[];
 for(const e of data.events){
  if(!week&&e.kind==='sidereal_ingress'&&e.body==='Moon')continue; // a month of Moon ingresses is noise
  entries.push({key:e.kind+e.atUtc,date:kyivDate(e.atUtc),time:hhmm(e.atUtc),text:skyEventLabel(e),weight:weightOf(e),href:storyHref(e),event:e});
 }
 for(const x of data.eclipses){
  const ev:SkyEvent={kind:x.type+'-eclipse',atUtc:x.maximumUtc,eclipseKind:x.eclipseKind||undefined,visibleHere:x.visibleHere};
  const a=composeSkyArticle(ev,null,now);
  entries.push({key:'ecl'+x.maximumUtc,date:kyivDate(x.maximumUtc),time:hhmm(x.maximumUtc),
   text:{uk:(a?.headline.uk.replace(/ \d.*$/,'')||'Затемнення')+(x.visibleHere?'':' (у Києві не видно)'),en:(a?.headline.en.replace(/ on \d.*$/,'')||'Eclipse')+(x.visibleHere?'':' (not visible from Kyiv)')},
   weight:7,href:storyHref(ev),event:ev});
 }
 for(const k of data.keyDays){
  // Purnima/Amavasya coincide with the Full/New Moon events: list them only on weeks.
  if(!week&&k.kind!=='ekadashi')continue;
  entries.push({key:k.kind+k.date,date:k.date,time:null,text:{uk:KEY_DAY[k.kind].uk+(k.kind==='ekadashi'?' ('+PAKSHA[k.paksha].uk+')':''),en:KEY_DAY[k.kind].en+(k.kind==='ekadashi'?' ('+PAKSHA[k.paksha].en+')':'')},
   weight:k.kind==='ekadashi'?3:2});
 }
 entries.sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'00:00').localeCompare(b.time||'00:00'));
 const byDay=new Map<string,RubricEntry[]>();
 for(const e of entries){if(!byDay.has(e.date))byDay.set(e.date,[]);byDay.get(e.date)!.push(e);}
 const days=[...byDay.entries()].map(([date,list])=>({date,entries:list,
  label:{uk:cap(dayName(date,'uk',{weekday:'long',day:'numeric',month:'long'})),en:dayName(date,'en',{weekday:'long',day:'numeric',month:'long'})}}));
 const top=[...entries].filter(e=>e.weight>=3).sort((a,b)=>b.weight-a.weight||a.date.localeCompare(b.date)).slice(0,3)
  .sort((a,b)=>a.date.localeCompare(b.date));
 const dShort=(date:string,l:NewsLocale)=>dayName(date,l,{day:'numeric',month:'long'});
 const lead:L=top.length?{uk:(week?'Головне цього тижня: ':'Головне цього місяця: ')+top.map(e=>dShort(e.date,'uk')+' — '+midUk(e.text.uk)).join('; ')+'.',
  en:(week?'This week’s highlights: ':'This month’s highlights: ')+top.map(e=>dShort(e.date,'en')+' — '+e.text.en).join('; ')+'.'}:
  {uk:week?'Спокійний тиждень на небі: без розворотів планет і великих фаз.':'Спокійний місяць на небі.',en:week?'A quiet week in the sky.':'A quiet month in the sky.'};
 const phases=data.events.filter(e=>/moon$|quarter$/.test(e.kind));
 const ekadashi=data.keyDays.filter(k=>k.kind==='ekadashi');
 const stations=data.events.filter(e=>e.kind.endsWith('_station'));
 const retroNames=(l:NewsLocale)=>data.retrogradeAtStart.map(b=>planetName(b,l));
 const retro:L={
  uk:(data.retrogradeAtStart.length?'На початку '+(week?'тижня':'місяця')+' ретроградні: '+retroNames('uk').join(', ')+'.':'На початку '+(week?'тижня':'місяця')+' жодна з планет від Меркурія до Сатурна не ретроградна.')+
   (stations.length?' Розвороти: '+stations.map(e=>dShort(kyivDate(e.atUtc),'uk')+' — '+midUk(skyEventLabel(e).uk)).join('; ')+'.':''),
  en:(data.retrogradeAtStart.length?'Retrograde at the start of the '+(week?'week':'month')+': '+retroNames('en').join(', ')+'.':'No planet from Mercury to Saturn is retrograde at the start of the '+(week?'week':'month')+'.')+
   (stations.length?' Stations: '+stations.map(e=>dShort(kyivDate(e.atUtc),'en')+' — '+skyEventLabel(e).en).join('; ')+'.':'')};
 const highlights=[...entries].filter(e=>e.event&&e.weight>=4).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,week?3:6)
  .map(e=>{const a=composeSkyArticle(e.event!,null,now);return a?{title:a.headline,text:a.lead,href:e.href}:null;})
  .filter((x):x is {title:L;text:L;href:string|undefined}=>Boolean(x));
 const range:L={uk:dayName(data.start,'uk',{day:'numeric',month:'long'})+' – '+dayName(addDay(data.end,-1),'uk',{day:'numeric',month:'long',year:'numeric'}),
  en:dayName(data.start,'en',{day:'numeric',month:'long'})+' – '+dayName(addDay(data.end,-1),'en',{day:'numeric',month:'long',year:'numeric'})};
 return {lead,days,highlights,retro,
  facts:[{label:{uk:'Період',en:'Period'},value:range},
   ...(phases.length?[{label:{uk:'Фази Місяця',en:'Moon phases'},value:{uk:phases.map(e=>skyEventLabel(e).uk.toLowerCase()+' '+dShort(kyivDate(e.atUtc),'uk')).join(', '),en:phases.map(e=>skyEventLabel(e).en+' '+dShort(kyivDate(e.atUtc),'en')).join(', ')}}]:[]),
   ...(ekadashi.length?[{label:{uk:'Екадаші',en:'Ekadashi'},value:{uk:ekadashi.map(k=>dShort(k.date,'uk')).join(', '),en:ekadashi.map(k=>dShort(k.date,'en')).join(', ')}}]:[]),
   {label:{uk:'Ретроградні',en:'Retrograde'},value:data.retrogradeAtStart.length?{uk:retroNames('uk').join(', '),en:retroNames('en').join(', ')}:{uk:'немає',en:'none'}},
   {label:{uk:'Розрахунок',en:'Calculation'},value:{uk:'Swiss Ephemeris, сидеричний зодіак (Лахірі); Панчанга — на світанку в Києві',en:'Swiss Ephemeris, sidereal zodiac (Lahiri); Panchanga at Kyiv sunrise'}}],
  art:{kind:'calendar',count:data.days}};
}
function addDay(date:string,n:number){return new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);}
export const isRubric=(item:NewsItem)=>Boolean(item.rubric);
