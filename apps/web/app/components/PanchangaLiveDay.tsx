'use client';
import {useEffect,useMemo,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
import GlossaryText from './GlossaryText';
import PanchangaInfoTip from './PanchangaInfoTip';
import styles from './PanchangaHub.module.css';
import Link from 'next/link';
import {nakshatraSlugByNumber} from '../../lib/nakshatra-slugs';
import {
 CHANGING_ANGAS,calendarDateAt,needsPriorVedicDay,previousCivilDate,
 positionInDay,slicesFor,stateAt,withinVedicDay,
 type ChangingAnga,type Anga,type AngaValues,type LivePanchangaDay,type TimePeriod,
} from '../../lib/panchanga-live';

const VARA_UK:Record<string,string>={
 Ravivara:'Неділя (Сонце)',Somavara:'Понеділок (Місяць)',Mangalavara:'Вівторок (Марс)',
 Budhavara:'Середа (Меркурій)',Guruvara:'Четвер (Юпітер)',Shukravara:'Пʼятниця (Венера)',Shanivara:'Субота (Сатурн)'};
const YOGA_UK=['Вішкумбха','Пріті','Аюшман','Саубхагʼя','Шобхана','Атіганда','Сукарма','Дхріті','Шула','Ганда','Вріддхі','Дхрува','Вʼягхата','Харшана','Ваджра','Сіддхі','Вʼятіпата','Варіяна','Парігха','Шіва','Сіддха','Садхʼя','Шубха','Шукла','Брахма','Індра','Вайдхріті'];
const KARANA_UK:Record<string,string>={Kimstughna:'Кімстугхна',Bava:'Бава',Balava:'Балава',Kaulava:'Каулава',Taitila:'Тайтіла',Garaja:'Гараджа',Vanija:'Ваніджа',Vishti:'Вішті',Shakuni:'Шакуні',Chatushpada:'Чатушпада',Naga:'Нага'};
const NAK_UK=['Ашвіні','Бхарані','Кріттіка','Рохіні','Мрігашіра','Ардра','Пунарвасу','Пушʼя','Ашлеша','Магха','Пурва Пхалгуні','Уттара Пхалгуні','Хаста','Чітра','Сваті','Вішакха','Анурадха','Джʼєштха','Мула','Пурва Ашадха','Уттара Ашадха','Шравана','Дханіштха','Шатабхіша','Пурва Бхадрапада','Уттара Бхадрапада','Реваті'];
const names={
 uk:{tithi:'Тітхі',nakshatra:'Накшатра',vara:'Вара',yoga:'Нітья-йога',karana:'Карана'},
 en:{tithi:'Tithi',nakshatra:'Nakshatra',vara:'Vara',yoga:'Nitya Yoga',karana:'Karana'}
} as const;
const descriptions={
 uk:{tithi:'Місячний день',nakshatra:'Ділянка шляху Місяця',
  vara:'День тижня',yoga:'Положення Сонця й Місяця',karana:'Половина місячного дня'},
 en:{tithi:'Lunar day',nakshatra:'Moon’s position in its lunar path',
  vara:'Weekday',yoga:'Sun and Moon positions',karana:'Half of a lunar day'}
} as const;
const explanations={
 uk:{tithi:'Тітхі — відрізок місячного циклу: кожні 12° різниці довгот Місяця й Сонця. Тривалість не завжди 24 години.',
 nakshatra:'Накшатра — один із 27 секторів сидеричного зодіаку по 13°20′. Визначається положенням Місяця.',
 vara:'Вара — ведичний день тижня від місцевого сходу Сонця до наступного сходу.',
 yoga:'Нітья-йога — календарний показник за сумою сидеричних довгот Сонця й Місяця, поділеною на 27 секторів по 13°20′.',
 karana:'Карана — половина тітхі, кожні 6° різниці довгот Місяця й Сонця.'},
 en:{tithi:'Tithi is a lunar-calendar division: every 12° of Sun–Moon longitude separation. It does not always last 24 hours.',
 nakshatra:'Nakshatra is one of 27 sidereal sectors of 13°20′ each, based on the Moon’s position.',
 vara:'Vara is the traditional weekday from one local sunrise to the next.',
 yoga:'Nitya Yoga divides the sum of the Sun’s and Moon’s sidereal longitudes into 27 sectors of 13°20′.',
 karana:'Karana is half of a tithi: every 6° of Sun–Moon longitude separation.'}
} as const;
const keys=['tithi','nakshatra','vara','yoga','karana'] as const;
function label(kind:Anga,value:AngaValues[Anga],locale:PortalLocale):string{
 const uk=locale==='uk';
 if(kind==='tithi'){
  const v=value as AngaValues['tithi'];
  return (uk?(v.paksha==='Shukla'?'Шукла':'Крішна'):v.paksha)+' '+v.numberWithinPaksha+'/15';
 }
 if(kind==='nakshatra'){
  const v=value as AngaValues['nakshatra'];
  return (uk?NAK_UK[v.number-1]||v.name:v.name);
 }
 if(kind==='vara'){
  const v=value as AngaValues['vara'];
  return uk?VARA_UK[v.name]||v.name:v.name;
 }
 if(kind==='yoga'){
  const v=value as AngaValues['yoga'];
  return uk?YOGA_UK[v.number-1]||v.name:v.name;
 }
 const v=value as AngaValues['karana'];
 return uk?KARANA_UK[v.name]||v.name:v.name;
}
const shortTime=(utc:string,zone:string,locale:PortalLocale)=>new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',
 {timeZone:zone,day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(utc));
const clock=(utc:string,zone:string,locale:PortalLocale)=>new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',
 {timeZone:zone,hour:'2-digit',minute:'2-digit'}).format(new Date(utc));
type Choice={kind:Anga;value:AngaValues[Anga];startUtc:string;endUtc:string};
function currentChoices(day:LivePanchangaDay,now:number|null):Choice[]{
 const active=now===null?null:stateAt(day,now);
 return keys.map(kind=>{
  if(kind==='vara')return {kind,value:day.sunrise.vara,startUtc:day.sunriseUtc,endUtc:day.nextSunriseUtc};
  const parts=slicesFor(day,kind);
  const selected=(active?parts.find(p=>Date.parse(p.startUtc)<=now!&&now!<Date.parse(p.endUtc)):null)||parts[0];
  return {kind,value:selected.value,startUtc:selected.startUtc,endUtc:selected.endUtc};
 });
}
export default function PanchangaLiveDay({day,locale}:{day:LivePanchangaDay;locale:PortalLocale}){
 const uk=locale==='uk',zone=day.location.timeZone;
 const [now,setNow]=useState<number|null>(null);
 const [prior,setPrior]=useState<LivePanchangaDay|null>(null);
 const [priorStatus,setPriorStatus]=useState<'idle'|'loading'|'error'>('idle');
 useEffect(()=>{
  setNow(Date.now());
  const timer=setInterval(()=>setNow(Date.now()),30000);
  return()=>clearInterval(timer);
 },[]);
 const needsPrior=now!==null&&needsPriorVedicDay(day,now);
 useEffect(()=>{
  if(!needsPrior){setPrior(null);setPriorStatus('idle');return;}
  const previous=previousCivilDate(day.date),ctl=new AbortController();let alive=true;
  setPrior(null);setPriorStatus('loading');
  const q=new URLSearchParams({date:previous,zone:day.location.timeZone,
   latitude:String(day.location.latitude),longitude:String(day.location.longitude)});
  fetch('/api/v1/panchanga/day?'+q,{cache:'no-store',signal:ctl.signal})
   .then(async r=>{if(!r.ok)throw Error(String(r.status));return await r.json() as LivePanchangaDay})
   .then(result=>{if(alive){setPrior(result);setPriorStatus('idle')}})
   .catch(()=>{if(alive&&!ctl.signal.aborted)setPriorStatus('error')});
  return()=>{alive=false;ctl.abort()};
 },[needsPrior,day.date,day.location.latitude,day.location.longitude,day.location.timeZone]);
 const liveDay=now===null?null:withinVedicDay(day,now)?day:
  needsPrior&&prior&&withinVedicDay(prior,now)?prior:null;
 const shown=liveDay||day;
 const choices=useMemo(()=>currentChoices(shown,liveDay?now:null),[shown,liveDay,now]);
 const next=useMemo(()=>[...day.changes].sort((a,b)=>a.atUtc.localeCompare(b.atUtc)||
  a.kind.localeCompare(b.kind)),[day.changes]);
 const progress=now!==null?positionInDay(day,now):null;
 const sunsetPosition=positionInDay(day,Date.parse(day.sunsetUtc));
 const liveNow=Boolean(liveDay);
 const preSunrise=needsPrior&&priorStatus==='loading';
 const [showTransitions,setShowTransitions]=useState(true);
 const dateMarker=(utc:string)=><time dateTime={utc}>{shortTime(utc,zone,locale)}</time>;
 return <>
  <section data-testid="panchanga-day-experience" className={styles.liveSection}>
   <div className={styles.liveHeading}>
    <div>
     <h2>{liveNow?(uk?'Показники зараз':'Current values'):
      (uk?'П’ять показників на сході Сонця':'Five limbs at sunrise')}</h2>
     <p>{liveNow?(uk?'На поточний момент для обраного міста.':'At this moment in the selected city.'):
      (uk?'Показники на сході Сонця цієї дати.':'Values at sunrise on this date.')}</p>
    </div>
    {liveNow&&<span className={styles.liveChip}>{uk?'Зараз':'Now'} · {clock(new Date(now!).toISOString(),zone,locale)}</span>}
   </div>
   {liveNow&&liveDay?.date!==day.date&&<p className={styles.priorNotice}>
    {uk?'До сходу Сонця триває попередній ведичний день':'Before sunrise, the previous Vedic day continues'}: <strong>{liveDay!.date}</strong>.
    {' '}{uk?'Нижче — переходи для вибраної дати.':'Below are transitions for the selected date.'}
   </p>}
   {preSunrise&&<p role="status">{uk?'Завантажуємо дані до сходу Сонця…':
    'Loading pre-sunrise values…'}</p>}
   {needsPrior&&priorStatus==='error'&&<p role="alert">{uk?'Поточний стан недоступний: немає перевірених даних попереднього дня.':
    'Live status unavailable: verified previous-day data could not be loaded.'}</p>}
   <div className={styles.liveCards} data-testid="panchanga-five-angas">
    {choices.map(item=><article key={item.kind} className={styles.liveCard}
      data-anga={item.kind}>
      <div className={styles.angaName}>
       <small><GlossaryText text={names[locale][item.kind]} locale={locale}/></small>
       <PanchangaInfoTip locale={locale} text={explanations[locale][item.kind]}/>
      </div>
      <strong>{label(item.kind,item.value,locale)}</strong>
      <p>{descriptions[locale][item.kind]}</p>
      {item.kind==='nakshatra'&&nakshatraSlugByNumber((item.value as unknown as {number?:number}).number)&&
       <Link className={styles.angaGuide} data-testid="panchanga-nakshatra-guide"
        href={'/'+locale+'/nakshatra/'+nakshatraSlugByNumber((item.value as unknown as {number?:number}).number)}>
        {uk?'Що означає ця накшатра →':'What this nakshatra means →'}</Link>}
      <div className={styles.liveTimes}>
       <span>{uk?'Від':'From'}: {dateMarker(item.startUtc)}</span>
       <span>{uk?'До':'Until'}: {dateMarker(item.endUtc)}</span>
      </div>
     </article>)}
   </div>
   {liveNow&&<p className={styles.liveFootnote}>{uk?'Час «До» — наступний розрахований перехід.':
    '“Until” is the next calculated transition.'}</p>}
  </section>
  <section className={styles.dayTimeline} data-testid="panchanga-daily-timeline" aria-label={uk?'Хронологія ведичного дня':'Vedic day timeline'}>
   <div className={styles.timelineTitle}>
    <h2>{uk?'Переходи від сходу до наступного сходу':'Transitions from sunrise to sunrise'}</h2>
    <p>{day.date} · {zone}</p>
   </div>
   <div className={styles.timelineAxis}>
    <span>{uk?'Схід':'Sunrise'} · {clock(day.sunriseUtc,zone,locale)}</span>
    <span>{uk?'Захід':'Sunset'} · {clock(day.sunsetUtc,zone,locale)}</span>
    <span>{uk?'Наступний схід':'Next sunrise'} · {clock(day.nextSunriseUtc,zone,locale)}</span>
   </div>
   {sunsetPosition!==null&&<div className={styles.dayNight}>
    <div className={styles.dayNightLegend}>
     <span>{uk?'Денний час':'Daylight'} · {clock(day.sunriseUtc,zone,locale)}–{clock(day.sunsetUtc,zone,locale)}</span>
     <span>{uk?'Ніч':'Night'} · {clock(day.sunsetUtc,zone,locale)}–{clock(day.nextSunriseUtc,zone,locale)}</span>
    </div>
    <div className={styles.dayNightTrack} aria-hidden="true">
     <div className={styles.dayNightLight} style={{width:sunsetPosition+'%'}}/>
     <div className={styles.dayNightDark} style={{width:(100-sunsetPosition)+'%'}}/>
    </div>
   </div>}
   {CHANGING_ANGAS.map(kind=><div className={styles.timelineLane} key={kind} data-testid={'panchanga-lane-'+kind}>
    <div className={styles.laneHeader}>
     <div className={styles.angaName}>
      <strong><GlossaryText text={names[locale][kind]} locale={locale}/></strong>
      <PanchangaInfoTip locale={locale} text={explanations[locale][kind]}/>
     </div>
     <small>{descriptions[locale][kind]}</small>
    </div>
    <div className={styles.laneTrack} role="img" aria-label={names[locale][kind]+': '+
     slicesFor(day,kind).map(p=>label(kind,p.value,locale)+' '+
      shortTime(p.clippedStartUtc,zone,locale)+'–'+shortTime(p.clippedEndUtc,zone,locale)).join('; ')}>
     {slicesFor(day,kind).map((p,i)=><div key={p.startUtc}
      className={styles.laneSegment} data-anga={kind} data-alternate={i%2===1?'true':'false'}
      style={{left:p.leftPercent+'%',width:p.widthPercent+'%'}}
      title={label(kind,p.value,locale)+' · '+shortTime(p.startUtc,zone,locale)+' — '+shortTime(p.endUtc,zone,locale)}/>)}
     {sunsetPosition!==null&&<div className={styles.sunsetMarker}
      style={{left:sunsetPosition+'%'}} aria-hidden="true"/>}
     {progress!==null&&<div className={styles.nowMarker} style={{left:progress+'%'}} aria-hidden="true"/>}
    </div>
    <div className={styles.laneSummary}>{slicesFor(day,kind).map((p,i)=><span key={p.startUtc}>
     {i>0?' · ':''}{label(kind,p.value,locale)}
    </span>)}</div>
   </div>)}
   <p className={styles.timelineExplanation}>{uk?'Шкали: від сходу Сонця до наступного сходу. Період може початися раніше або закінчитися пізніше.':
    'Tracks run from one sunrise to the next. A period may begin earlier or end later.'}</p>
   <button className={styles.transitionToggle} type="button"
    aria-expanded={showTransitions} onClick={()=>setShowTransitions(v=>!v)}>
    {showTransitions?(uk?'Сховати всі переходи':'Hide all transitions'):(uk?'Показати всі переходи':'Show all transitions')}
   </button>
   {showTransitions&&<ol className={styles.transitionList} data-testid="panchanga-named-transitions">
    {next.map((event,i)=>{
     const period=slicesFor(day,event.kind).find(p=>p.startUtc===event.atUtc);
     return <li key={event.kind+event.atUtc+i}>
      {dateMarker(event.atUtc)}
      <span><strong>{names[locale][event.kind]}:</strong> {period?label(event.kind,period.value,locale):
       (uk?'Перехід без назви — перевір дані':'Transition unavailable — verify data')}</span>
     </li>;
    })}
   </ol>}
   <p className={styles.timelineExplanation}>{uk?'Вара змінюється на місцевому сході Сонця.':
    'Vara changes at local sunrise.'}</p>
  </section>
 </>;
}
