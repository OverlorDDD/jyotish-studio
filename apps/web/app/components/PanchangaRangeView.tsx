'use client';
import {useEffect,useMemo,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
import {calendarWindow,moveCalendar,validOverviewWindow,
 type CalendarFilter} from '../../lib/panchanga-calendar';
import styles from './PanchangaHub.module.css';

type Observer={date:string;timeZone:string;latitude:string;longitude:string};
type MonthSystem='amanta'|'purnimanta';
type Anga={number:number;name:string};
type Sunrise={tithi:{number:number;paksha:string;numberWithinPaksha:number};
 nakshatra:Anga;vara:Anga;yoga:Anga;karana:{slot:number;name:string}};
type Observation={id:string;atUtc:string;category:'candidate'|'astronomical_event';rule:string};
type Phase={kind:'new_moon'|'first_quarter'|'full_moon'|'last_quarter';atUtc:string;localDate:string};
type Day={date:string;sunriseUtc:string;sunsetUtc:string;sunriseAngas:Sunrise;
 moonMonth:{name:string|null;lunarMonthStatus:string};
 observances:Observation[]};
type Overview={version:string;scope:string;monthSystem:MonthSystem;days:Day[];phaseEvents:Phase[];
 observer:{timeZone:string};observanceDayCertifiedByTradition:boolean;
 astronomicalTimeCertifiedByIndependentReference:boolean};
const NAK_UK=['Ашвіні','Бхарані','Кріттіка','Рохіні','Мрігашіра','Ардра','Пунарвасу','Пушʼя','Ашлеша','Магха','Пурва Пхалгуні','Уттара Пхалгуні','Хаста','Чітра','Сваті','Вішакха','Анурадха','Джʼєштха','Мула','Пурва Ашадха','Уттара Ашадха','Шравана','Дханіштха','Шатабхіша','Пурва Бхадрапада','Уттара Бхадрапада','Реваті'];
const YOGA_UK=['Вішкумбха','Пріті','Аюшман','Саубхагʼя','Шобхана','Атіганда','Сукарма','Дхріті','Шула','Ганда','Вріддхі','Дхрува','Вʼягхата','Харшана','Ваджра','Сіддхі','Вʼятіпата','Варіяна','Парігха','Шіва','Сіддха','Садхʼя','Шубха','Шукла','Брахма','Індра','Вайдхріті'];
const VARA_UK:Record<string,string>={
 Ravivara:'Неділя (Сонце)',Somavara:'Понеділок (Місяць)',Mangalavara:'Вівторок (Марс)',
 Budhavara:'Середа (Меркурій)',Guruvara:'Четвер (Юпітер)',Shukravara:'Пʼятниця (Венера)',Shanivara:'Субота (Сатурн)'};
const KARANA_UK:Record<string,string>={Kimstughna:'Кімстугхна',Bava:'Бава',Balava:'Балава',Kaulava:'Каулава',Taitila:'Тайтіла',Garaja:'Гараджа',Vanija:'Ваніджа',Vishti:'Вішті',Shakuni:'Шакуні',Chatushpada:'Чатушпада',Naga:'Нага'};
const MONTHS:Record<string,string>={
 Chaitra:'Чайтра',Vaishakha:'Вайшакха',Jyeshtha:'Джʼєштха',Ashadha:'Ашадха',
 Shravana:'Шравана',Bhadrapada:'Бхадрапада',Ashwina:'Ашвіна',Kartika:'Картіка',
 Margashirsha:'Маргашірша',Pausha:'Пауша',Magha:'Магха',Phalguna:'Пхалгуна'};
const FESTIVALS:Record<string,[string,string]>={
 ekadashi_sunrise:['Екадаші на сході','Ekadashi at sunrise'],ekadashi_arunodaya:['Екадаші на арунодаї','Ekadashi at Arunodaya'],
 pradosha_trayodashi:['Прадоша','Pradosha'],purnima_sunrise:['Пурніма на сході','Purnima at sunrise'],
 amavasya_sunrise:['Амавасья на сході','Amavasya at sunrise'],sankranti:['Санкранті','Sankranti'],
 rama_navami:['Рама Навамі','Rama Navami'],ganesh_chaturthi:['Ґанеша Чатуртхі','Ganesh Chaturthi'],
 chaitra_navratri:['Чайтра Наваратрі','Chaitra Navratri'],sharad_navratri:['Шарад Наваратрі','Sharad Navratri'],
 guru_purnima:['Ґуру Пурніма','Guru Purnima'],janmashtami:['Крішна Джанмаштамі','Krishna Janmashtami'],
 maha_shivaratri:['Маха Шиваратрі','Maha Shivaratri'],diwali_amavasya:['Дівалі','Diwali']};
const PHASES:Record<Phase['kind'],[string,string]>={
 new_moon:['Молодик','New Moon'],first_quarter:['Перша чверть','First Quarter'],
 full_moon:['Повня','Full Moon'],last_quarter:['Остання чверть','Last Quarter']};
const selected=<T,>(pair:[T,T],uk:boolean)=>pair[uk?0:1];
export default function PanchangaRangeView({locale,view,point,monthSystem,onPick}:{
 locale:PortalLocale;view:'week'|'month';point:Observer;
 monthSystem:MonthSystem;onPick:(date:string)=>void;
}){
 const uk=locale==='uk';
 const [anchor,setAnchor]=useState(point.date);
 const [filter,setFilter]=useState<CalendarFilter>('all');
 const [data,setData]=useState<Overview|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 const [retry,setRetry]=useState(0);
 useEffect(()=>setAnchor(point.date),[point.date,point.latitude,point.longitude,point.timeZone,view]);
 const window=useMemo(()=>calendarWindow(anchor,view),[anchor,view]);
 const valid=validOverviewWindow(window.start,window.days);
 useEffect(()=>{
  if(!valid){setStatus('error');setData(null);return;}
  const ctl=new AbortController();let live=true;setStatus('loading');setData(null);
  const q=new URLSearchParams({start:window.start,days:String(window.days),zone:point.timeZone,
   latitude:point.latitude,longitude:point.longitude,monthSystem});
  fetch('/api/v1/vedic-calendar/overview?'+q,{cache:'no-store',signal:ctl.signal})
   .then(async r=>{if(!r.ok)throw Error('Calendar HTTP '+r.status);return await r.json() as Overview;})
   .then(payload=>{
    if(!live)return;
    if(!Array.isArray(payload.days)||payload.days.length!==window.days||
     !Array.isArray(payload.phaseEvents)||payload.monthSystem!==monthSystem||
     payload.days[0]?.date!==window.start||
     payload.days.some(d=>!d.sunriseAngas||!Array.isArray(d.observances)))
     throw Error('Incomplete verified Panchanga overview');
    setData(payload);setStatus('ready');
   }).catch(()=>{if(live&&!ctl.signal.aborted)setStatus('error');});
  return()=>{live=false;ctl.abort();};
 },[window.start,window.days,valid,point.timeZone,point.latitude,point.longitude,monthSystem,retry]);
 const dateLabel=(d:string)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',
  {weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
 const monthLabel=new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',
  {year:'numeric',month:'long',timeZone:'UTC'}).format(new Date(window.start+'T12:00:00Z'));
 const eventTime=(iso:string)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{
  timeZone:point.timeZone,day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
 const values=(d:Day)=>d.sunriseAngas;
 const tithi=(d:Day)=>(uk?(values(d).tithi.paksha==='Shukla'?'Шукла':'Крішна'):values(d).tithi.paksha)+
  ' '+values(d).tithi.numberWithinPaksha;
 const nak=(d:Day)=>uk?NAK_UK[values(d).nakshatra.number-1]||values(d).nakshatra.name:values(d).nakshatra.name;
 const yoga=(d:Day)=>uk?YOGA_UK[values(d).yoga.number-1]||values(d).yoga.name:values(d).yoga.name;
 const vara=(d:Day)=>uk?VARA_UK[values(d).vara.name]||values(d).vara.name:values(d).vara.name;
 const karana=(d:Day)=>uk?KARANA_UK[values(d).karana.name]||values(d).karana.name:values(d).karana.name;
 const month=(d:Day)=>d.moonMonth.name?(uk?MONTHS[d.moonMonth.name]||d.moonMonth.name:d.moonMonth.name):'—';
 const phasesFor=(d:Day)=>data?.phaseEvents.filter(p=>p.localDate===d.date)||[];
 const showFestivals=filter!=='phases',showPhases=filter!=='festivals';
 const eventsFor=(d:Day)=>[
  ...(showPhases?phasesFor(d).map(p=>({key:'phase-'+p.kind+p.atUtc,
   label:selected(PHASES[p.kind],uk),atUtc:p.atUtc,astronomical:true})):[]),
  ...(showFestivals?d.observances.map((o,i)=>({key:o.id+o.atUtc+i,
   label:FESTIVALS[o.id]?selected(FESTIVALS[o.id],uk):o.id,
   atUtc:o.atUtc,astronomical:o.category==='astronomical_event'})):[])
 ].sort((a,b)=>a.atUtc.localeCompare(b.atUtc));
 const before=moveCalendar(anchor,view,-1),after=moveCalendar(anchor,view,1);
 const enabled=(candidate:string)=>{
  try{const w=calendarWindow(candidate,view);return validOverviewWindow(w.start,w.days);}
  catch{return false;}
 };
 const offset=(new Date(window.start+'T12:00:00Z').getUTCDay()+6)%7;
 return <section data-testid="panchanga-calendar-range" className={styles.smartCalendar}>
  <div className={styles.smartTop}>
   <div><h2>{view==='week'?(uk?'Панчанга · 7 днів':'Panchanga · 7 days'):
    (uk?'Панчанга · місяць':'Panchanga · month')}</h2>
    <p>{uk?'П’ять анг на місцевому сході':'Five limbs at local sunrise'} · {point.timeZone}</p></div>
   <div className={styles.smartNav}>
    <button type="button" onClick={()=>setAnchor(before)} disabled={!enabled(before)}
     aria-label={uk?'Попередній період':'Previous period'}>‹</button>
    <strong>{view==='month'?monthLabel:dateLabel(window.start)+' – '+dateLabel(
     new Date(Date.parse(window.start+'T00:00:00Z')+(window.days-1)*86400000).toISOString().slice(0,10))}</strong>
    <button type="button" onClick={()=>setAnchor(after)} disabled={!enabled(after)}
     aria-label={uk?'Наступний період':'Next period'}>›</button>
   </div>
  </div>
  <div className={styles.smartControls}>
   <fieldset><legend>{uk?'Показати події':'Events'}</legend>
    {(['all','festivals','phases'] as const).map(f=><button type="button" key={f} aria-pressed={filter===f}
     onClick={()=>setFilter(f)}>{f==='all'?(uk?'Усі':'All'):f==='festivals'?(uk?'Свята й переходи':'Observances & ingresses'):(uk?'Фази':'Phases')}</button>)}
   </fieldset>
  </div>
  {status==='loading'&&<p role="status" className={styles.smartState}>{uk?'Обчислюємо астрономічний календар…':'Calculating verified calendar…'}</p>}
  {status==='error'&&<p role="alert" className={styles.smartState}>{uk?'Не вдалося розрахувати календар для цієї локації.':
   'Calendar calculation failed for this location.'}
   <button type="button" onClick={()=>setRetry(n=>n+1)} disabled={!valid}>{uk?'Повторити':'Retry'}</button></p>}
  {status==='ready'&&data&&<div className={view==='week'?styles.rangeDays:styles.monthGrid}>
   {view==='month'&&(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const).map((w,i)=><span className={styles.weekLabel} key={w}>
    {uk?['Пн','Вт','Ср','Чт','Пт','Сб','Нд'][i]:w}</span>)}
   {view==='month'&&Array.from({length:offset},(_,i)=><span aria-hidden="true" key={'blank-'+i}/>)}
   {data.days.map(d=>{
    const events=eventsFor(d),isMonth=view==='month';
    return <button key={d.date} type="button" data-testid="panchanga-day-cell"
     className={isMonth?styles.smartDay:styles.smartWeek}
     aria-current={d.date===point.date?'date':undefined}
     aria-label={dateLabel(d.date)+' · '+tithi(d)+' · '+nak(d)+
      (events.length?' · '+events.map(e=>e.label).join(', '):'')}
     onClick={()=>onPick(d.date)}>
     <strong className={styles.smartDate}>{isMonth?Number(d.date.slice(-2)):dateLabel(d.date)}</strong>
     <span className={styles.smartTithi}>{tithi(d)}</span>
     <span className={styles.smartNak}>{nak(d)}</span>

     <span className={styles.smartMonth}>{month(d)}{d.moonMonth.lunarMonthStatus==='adhika'?' · '+(uk?'Адхіка':'Adhika'):
      d.moonMonth.lunarMonthStatus==='kshaya_review_required'?' · '+(uk?'Особливий місяць':'Exceptional month'):''}</span>
     {events.slice(0,isMonth?2:1).map(e=><span className={styles.smartMarker} key={e.key}
      data-type={e.astronomical?'astronomical':'candidate'}>
      {e.label}{!isMonth?' · '+eventTime(e.atUtc):''}
     </span>)}
     {events.length>(isMonth?2:1)&&<small className={styles.smartMore}>+{events.length-(isMonth?2:1)}</small>}
    </button>;
   })}
  </div>}
  <p className={styles.smartFootnote}>{uk?
   'П’ять анг — на сході Сонця; фази — на точний момент. Дати свят попередні. Натисни дату для часу переходів.':
   'Five limbs use local sunrise; Moon phases use exact event times. Festival dates are provisional. Select a date for transitions.'}</p>
 </section>;
}
