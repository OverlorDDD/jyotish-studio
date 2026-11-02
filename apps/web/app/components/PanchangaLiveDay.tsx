'use client';
import {useEffect,useMemo,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
import GlossaryText from './GlossaryText';
import styles from './PanchangaHub.module.css';
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
 uk:{tithi:'Місячний день',nakshatra:'Ділянка неба, де перебуває Місяць',
  vara:'День тижня за місцевим сходом Сонця',yoga:'Комбінація положень Сонця й Місяця',karana:'Половина тітхі'},
 en:{tithi:'Lunar day',nakshatra:'Lunar mansion of the Moon',
  vara:'Weekday at local sunrise',yoga:'Combined Sun and Moon positions',karana:'Half of a tithi'}
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
     <h2>{liveNow?(uk?'Зараз у ведичному дні':'Active right now'):
      (uk?'П’ять показників на сході Сонця':'Five limbs at sunrise')}</h2>
     <p>{liveNow?(uk?'За поточним часом пристрою, для обраного міста.':'Based on device time in the selected location.'):
      (uk?'Це значення на сході Сонця, а не прогноз поточного стану.':'These are local-sunrise values, not a live-current claim.')}</p>
    </div>
    {liveNow&&<span className={styles.liveChip}>{uk?'Зараз':'Now'} · {clock(new Date(now!).toISOString(),zone,locale)}</span>}
   </div>
   {liveNow&&liveDay?.date!==day.date&&<p className={styles.priorNotice}>
    {uk?'До нового сходу Сонця ще триває ведичний день':'Before the next sunrise, the previous Vedic day is still active'}: <strong>{liveDay!.date}</strong>.
    {' '}{uk?'Нижче показана шкала обраної календарної дати.':'The timeline below describes your selected calendar date.'}
   </p>}
   {preSunrise&&<p role="status">{uk?'Уточнюємо поточний ведичний день за попереднім сходом Сонця…':
    'Checking the previous sunrise day before showing live values…'}</p>}
   {needsPrior&&priorStatus==='error'&&<p role="alert">{uk?'Поточний стан недоступний: немає перевірених даних попереднього дня.':
    'Live status unavailable: verified previous-day data could not be loaded.'}</p>}
   <div className={styles.liveCards} data-testid="panchanga-five-angas">
    {choices.map(item=><article key={item.kind} className={styles.liveCard}
      data-anga={item.kind}>
      <small><GlossaryText text={names[locale][item.kind]} locale={locale}/></small>
      <strong>{label(item.kind,item.value,locale)}</strong>
      <p>{descriptions[locale][item.kind]}</p>
      <div className={styles.liveTimes}>
       <span>{uk?'Від':'From'}: {dateMarker(item.startUtc)}</span>
       <span>{uk?'До':'Until'}: {dateMarker(item.endUtc)}</span>
      </div>
     </article>)}
   </div>
   {liveNow&&<p className={styles.liveFootnote}>{uk?'Час завершення кожного показника обчислено за реальним наступним переходом.':
    'Each ending time is tied to the next calculated transition.'}</p>}
  </section>
  <section className={styles.dayTimeline} data-testid="panchanga-daily-timeline" aria-label={uk?'Хронологія ведичного дня':'Vedic day timeline'}>
   <div className={styles.timelineTitle}>
    <h2>{uk?'Хронологія від сходу до сходу':'Sunrise-to-sunrise timeline'}</h2>
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
     <strong><GlossaryText text={names[locale][kind]} locale={locale}/></strong>
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
   <p className={styles.timelineExplanation}>{uk?'Шкали охоплюють саме проміжок між двома місцевими сходами. Кожна межа обчислена окремо; періоди можуть тривати за межами зображеного дня.':
    'Tracks cover the exact interval between local sunrises. Every boundary is computed independently; a period can continue beyond the displayed day.'}</p>
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
   <p className={styles.timelineExplanation}>{uk?'Вара залишається однаковою від сходу до наступного сходу.':
    'Vara is fixed from local sunrise to the following sunrise.'}</p>
  </section>
 </>;
}
