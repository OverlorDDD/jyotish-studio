'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {P38_ACTIVITIES,p38Activity,type P38ActivityId} from '../../lib/panchanga-p38-decision';
import {validateP387Public,validateP387Natal,validateP387Finder,p387Rows,
 type P387Finder,type P387Overview} from '../../lib/panchanga-p387-unified';
import type {P35Days,P35Private} from '../../lib/panchanga-p35-calendar';
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
type Day={date:string;sunriseUtc:string;sunsetUtc:string;nextSunriseUtc:string;sunriseAngas:Sunrise;
 moonMonth:{name:string|null;lunarMonthStatus:string};
 observances:Observation[]};
type Overview=P387Overview&{monthSystem:MonthSystem;days:Day[];phaseEvents:Phase[];
 observanceDayCertifiedByTradition:boolean;
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
export default function PanchangaRangeView({locale,view,point,monthSystem,onPick,
 activity,onActivityChange,canPersonal}:{
 locale:PortalLocale;view:'week'|'month';point:Observer;
 monthSystem:MonthSystem;onPick:(date:string,atUtc?:string)=>void;
 activity:P38ActivityId;onActivityChange:(id:P38ActivityId)=>void;canPersonal:boolean;
}){
 const uk=locale==='uk';
 const [anchor,setAnchor]=useState(point.date);
 const [filter,setFilter]=useState<CalendarFilter>('all');
 const [data,setData]=useState<Overview|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 const [retry,setRetry]=useState(0);
 const [personal,setPersonal]=useState<{key:string;data:P35Private}|null>(null);
 const [privateState,setPrivateState]=useState<'idle'|'loading'|'ready'|'guest'|'no_chart'|'error'>('idle');
 const [finder,setFinder]=useState<{key:string;activity:P38ActivityId;data:P387Finder}|null>(null);
 const [finderState,setFinderState]=useState<'idle'|'loading'|'ready'|'no_chart'|'guest'|'limit'|'error'>('idle');
 const [partnerId,setPartnerId]=useState('');
 const [charts,setCharts]=useState<{id:string;date:string;place?:string}[]>([]);
 const [chartState,setChartState]=useState<'idle'|'loading'|'ready'|'error'>('idle');
 const requestKeyRef=useRef('');
 useEffect(()=>setAnchor(point.date),[point.date,point.latitude,point.longitude,point.timeZone,view]);
 const window=useMemo(()=>calendarWindow(anchor,view),[anchor,view]);
 const valid=validOverviewWindow(window.start,window.days);
 const count=window.days as P35Days;
 const viewPoint=useMemo(()=>({date:window.start,timeZone:point.timeZone,
  latitude:point.latitude,longitude:point.longitude}),
  [window.start,point.timeZone,point.latitude,point.longitude]);
 const viewKey=[window.start,window.days,point.timeZone,point.latitude,
  point.longitude,monthSystem].join('|');
 requestKeyRef.current=viewKey;
 const verifiedPersonal=personal?.key===viewKey?personal.data:null;
 const verifiedFinder=finder?.key===viewKey&&finder.activity===activity?finder.data:null;
 const selectedActivity=p38Activity(activity);
 const needsPartner=selectedActivity.required.includes('partner_chart');
 const rows=useMemo(()=>{
  if(!data||status!=='ready')return null;
  try{return p387Rows(data,viewPoint,count,verifiedPersonal,verifiedFinder,activity);}
  catch{return null;}
 },[data,status,viewKey,verifiedPersonal,verifiedFinder,activity,count,viewPoint]);
 useEffect(()=>{setPrivateState('idle');setFinderState('idle');},[viewKey]);
 useEffect(()=>{setFinderState('idle');setFinder(null)},[activity,partnerId]);
 useEffect(()=>{
  if(!canPersonal||!needsPartner||chartState!=='idle')return;
  const ctl=new AbortController();let active=true;setChartState('loading');
  Promise.all([
   fetch('/api/v1/account/charts',{credentials:'same-origin',cache:'no-store',signal:ctl.signal}),
   fetch('/api/v1/personal/profile',{credentials:'same-origin',cache:'no-store',signal:ctl.signal})
  ]).then(async([r,p])=>{
   if(!r.ok||!p.ok)throw Error('Chart list unavailable');
   const list=await r.json() as {id:string;date:string;place?:string}[];
   const profile=await p.json() as {profile?:{primaryChartId?:string|null}};
   if(!Array.isArray(list))throw Error('Malformed chart list');
   return list.filter(x=>x.id!==profile.profile?.primaryChartId);
  }).then(list=>{if(active){setCharts(list);setChartState('ready')}})
   .catch(()=>{if(active&&!ctl.signal.aborted)setChartState('error')});
  return()=>{active=false;ctl.abort()};
 },[canPersonal,needsPartner,chartState]);
 async function loadPersonal(){
  if(!canPersonal||!data||status!=='ready'||privateState==='loading')return;
  const requestKey=viewKey;setPersonal(null);setPrivateState('loading');
  const q=new URLSearchParams({start:window.start,days:String(count),zone:point.timeZone,
   latitude:point.latitude,longitude:point.longitude});
  try{
   const r=await fetch('/api/v1/personal/panchanga/calendar?'+q,
    {credentials:'same-origin',cache:'no-store'});
   if(requestKeyRef.current!==requestKey)return;
   if(r.status===401){setPrivateState('guest');return;}
   if(!r.ok)throw Error('Private calendar HTTP '+r.status);
   const raw=await r.json() as P35Private|{status:string};
   if(requestKeyRef.current!==requestKey)return;
   if(raw.status==='requires_primary_chart'||raw.status==='requires_verified_chart'){
    setPrivateState('no_chart');return;
   }
   const verified=validateP387Natal(data,viewPoint,count,raw as P35Private);
   setPersonal({key:requestKey,data:verified});setPrivateState('ready');
  }catch{if(requestKeyRef.current===requestKey)setPrivateState('error')}
 }
 async function findWindows(){
  if(!canPersonal||!data||status!=='ready'||finderState==='loading'||selectedActivity.method==='routine'||
   (needsPartner&&!partnerId))return;
  const at=Math.max(Date.now()+120000,Date.parse(data.days[0].sunriseUtc)+60000);
  if(at>=Date.parse(data.days.at(-1)!.nextSunriseUtc)||
   at>Date.now()+5*365.25*86400000)return;
  const startUtc=new Date(at).toISOString(),requestKey=viewKey,chosenActivity=activity;
  setFinder(null);setFinderState('loading');
  try{
   const r=await fetch('/api/v1/personal/panchanga/time-finder',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({activityId:activity,atUtc:startUtc,timeZone:point.timeZone,
     latitude:Number(point.latitude),longitude:Number(point.longitude),
     days:view==='week'?7:30,...(needsPartner?{partnerChartId:partnerId}:{})})
   });
   if(requestKeyRef.current!==requestKey)return;
   if(r.status===401){setFinderState('guest');return;}
   if(r.status===429){setFinderState('limit');return;}
   if(!r.ok)throw Error('Finder HTTP '+r.status);
   const raw=await r.json() as P387Finder|{status:string};
   if(requestKeyRef.current!==requestKey)return;
   if(['requires_primary_chart','requires_verified_chart','requires_partner_chart',
    'requires_verified_partner_chart'].includes(raw.status)){
    setFinderState('no_chart');return;
   }
   const verified=validateP387Finder(raw as P387Finder,viewPoint,chosenActivity);
   if(verified.startUtc!==startUtc)throw Error('Search start mismatch');
   setFinder({key:requestKey,activity:chosenActivity,data:verified});
   setFinderState('ready');
  }catch{if(requestKeyRef.current===requestKey)setFinderState('error')}
 }
 useEffect(()=>{
  if(!valid){setStatus('error');setData(null);return;}
  const ctl=new AbortController();let live=true;setStatus('loading');setData(null);
  const q=new URLSearchParams({start:window.start,days:String(window.days),zone:point.timeZone,
   latitude:point.latitude,longitude:point.longitude,monthSystem});
  fetch('/api/v1/vedic-calendar/overview?'+q,{cache:'no-store',signal:ctl.signal})
   .then(async r=>{if(!r.ok)throw Error('Calendar HTTP '+r.status);return await r.json() as Overview;})
   .then(payload=>{
    if(!live)return;
    validateP387Public(payload,viewPoint,count);
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
  <section className={styles.personalToolbar} data-testid="p387-calendar-personal">
   <header><h3>{uk?'Мої події та час для справ':'My events and times for activities'}</h3>
    <p>{uk?'Особисті показники — лише на місцевому сході Сонця. Події й знайдені часові вікна мають точний UTC-момент і показуються в часовому поясі міста.':
     'Natal indicators apply to local sunrise only. Events and found time windows use exact UTC instants, shown in the city time zone.'}</p></header>
   <div className={styles.personalActions}>
    <label>{uk?'Конкретна справа':'Specific activity'}
     <select value={activity} onChange={e=>onActivityChange(e.target.value as P38ActivityId)}
      data-testid="p387-activity-select">
      {P38_ACTIVITIES.map(a=><option key={a.id} value={a.id}>{a.name[locale]}</option>)}
     </select>
    </label>
    {canPersonal?<button type="button" onClick={()=>void loadPersonal()}
     disabled={status!=='ready'||privateState==='loading'}>
     {privateState==='loading'?(uk?'Перевіряємо події…':'Checking personal events…'):
      (uk?'Показати особисті події':'Show personal events')}</button>:
     <Link href={'/'+locale+'/personal'}>{uk?'Увійти для особистих подій':'Sign in for personal events'}</Link>}
    {canPersonal&&selectedActivity.method!=='routine'&&<button type="button"
     data-testid="p387-find-windows" onClick={()=>void findWindows()}
     disabled={status!=='ready'||finderState==='loading'||(needsPartner&&!partnerId)||
      !data||Date.parse(data.days.at(-1)!.nextSunriseUtc)<=Date.now()+120000}>
     {finderState==='loading'?(uk?'Перевіряємо години…':'Checking intervals…'):
      (uk?'Знайти перевірені години':'Find verified time windows')}</button>}
   </div>
   {needsPartner&&canPersonal&&<label className={styles.personalPartner}>
    {uk?'Друга збережена натальна карта (з дозволом партнера)':'Second saved birth chart (with partner consent)'}
    <select value={partnerId} onChange={e=>setPartnerId(e.target.value)}>
     <option value="">{uk?'Оберіть іншу карту':'Select a different owned chart'}</option>
     {charts.map(ch=><option value={ch.id} key={ch.id}>{[ch.date,ch.place].filter(Boolean).join(' · ')}</option>)}
    </select>
    {chartState==='error'&&<small>{uk?'Не вдалося завантажити карти':'Saved charts unavailable'}</small>}
   </label>}
   {privateState==='loading'&&<p role="status">{uk?'Зіставляємо 5 показників із перевіреною натальною картою…':
    'Matching all five sunrise factors against the verified natal chart…'}</p>}
   {verifiedPersonal&&<p data-testid="p387-personal-scope">
    {uk?'Особисті дані: перевірено всі '+count+' сходів Сонця та відповідність п’яти анг.':
     'Natal overlay: all '+count+' sunrise instants and five limbs reconciled.'}</p>}
   {privateState==='no_chart'&&<p role="status">{uk?'Оберіть перевірену основну натальну карту в кабінеті.':
    'Select your verified primary birth chart in Personal.'}
    {' '}<Link href={'/'+locale+'/personal'}>{uk?'Перейти в кабінет':'Open Personal'}</Link></p>}
   {privateState==='guest'&&<p role="status">{uk?'Потрібен вхід до акаунта.':'Sign-in required.'}</p>}
   {privateState==='error'&&<p role="alert">{uk?'Особисті дані не підтверджено; показуємо лише загальний календар.':
    'Personal source mismatch or unavailable; displaying general calendar only.'}</p>}
   {finderState==='loading'&&<p role="status">{uk?'Шукаємо точні інтервали за перевіреними правилами…':
    'Screening exact times against documented rules…'}</p>}
   {finderState==='no_chart'&&<p role="status">{uk?'Для цього пошуку потрібні перевірені натальні карти.':
    'Verified saved natal charts are required for this search.'}</p>}
   {finderState==='guest'&&<p role="status">{uk?'Увійдіть до акаунта для пошуку часу.':'Sign in to search time windows.'}</p>}
   {finderState==='limit'&&<p role="alert">{uk?'Ліміт пошуку часу вичерпаний. Дані не підмінюємо припущеннями.':
    'Time Finder request limit reached; no times are invented.'}</p>}
   {finderState==='error'&&<p role="alert">{uk?'Часові вікна не вдалося перевірити; результат приховано.':
    'Time windows could not be verified; no results shown.'}</p>}
   {verifiedFinder&&<div data-testid="p387-window-scope" className={styles.windowScope}>
    <strong>{uk?'Результат реального пошуку':'Verified search result'}</strong>
    <p>{eventTime(verifiedFinder.startUtc)} – {eventTime(verifiedFinder.searchThroughUtc)}
     {' · '}{uk?'до двох перших інтервалів на кожну добу від сходу Сонця':
      'first candidate/review interval per sunrise day, up to two per day'}</p>
    {verifiedFinder.status==='none_in_checked_range'&&<p>{uk?'За перевірений проміжок придатних вікон не виявлено. Це не означає, що решта дат несприятливі.':
     'No qualifying windows in the checked horizon. Other dates are not thereby declared unfavorable.'}</p>}
    {verifiedFinder.status==='review_only'&&<p>{uk?'Є лише інтервали для спеціальної перевірки; повна мухурта не сертифікована.':
     'Only reviewable intervals were found; a full Muhurta has not been certified.'}</p>}
   </div>}
  </section>
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
   {data.days.map((d,i)=>{
    const events=eventsFor(d),isMonth=view==='month',overlay=rows?.[i];
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
     {overlay?.personalDay&&<span className={styles.personalBadge} data-testid="p387-sunrise"
      data-status={overlay.personalDay.chandrabala.ashtamaChandra?'restriction':
       overlay.personalDay.tarabala.quality==='supportive'&&
       overlay.personalDay.chandrabala.quality==='supportive'?'support':'mixed'}>
      {uk?'На сході: Тара ':'At sunrise: Tara '}{overlay.personalDay.tarabala.taraNumber}
      {' · '}{uk?'Чандра ':'Chandra '}{overlay.personalDay.chandrabala.houseFromJanmaRashi}
     </span>}
     {overlay&&overlay.personalEvents.length>0&&<span className={styles.personalBadge}>
      {uk?'Особисті переходи':'Personal transitions'}: {overlay.personalEvents.length}
     </span>}
     {overlay&&overlay.windows.length>0&&<span className={styles.windowBadge}
      data-status={overlay.windows[0].status}>
      {uk?'Перевірений інтервал':'Screened interval'} · {eventTime(overlay.windows[0].startUtc)}
     </span>}
    </button>;
   })}
  </div>}
  {verifiedPersonal&&rows&&<details className={styles.p387Details} data-testid="p387-exact-events">
   <summary>{uk?'Точні особисті переходи':'Exact personal transitions'}
    {' · '}{rows.reduce((sum,r)=>sum+r.personalEvents.length,0)}</summary>
   <ul>{rows.flatMap(r=>r.personalEvents.map((e,i)=><li key={r.date+e.kind+e.atUtc+i}>
    <time dateTime={e.atUtc}>{eventTime(e.atUtc)}</time>
    {' · '}{e.kind==='moon-sign'?(uk?'Місяць: знак ':'Moon: sign ')+e.from+' → '+e.to:
     e.kind==='nakshatra'?(uk?'Накшатра ':'Nakshatra ')+e.from+' → '+e.to:
     e.kind==='mahadasha'?(uk?'Махадаша':'Mahadasha'):(uk?'Антардаша':'Antardasha')}
    {e.lord?' · '+e.lord:''}
    {' · '}{uk?'доба від сходу ':'sunrise day '}{r.date}
   </li>))}</ul>
  </details>}
  {verifiedFinder&&rows&&<details className={styles.p387Details} open data-testid="p387-exact-windows">
   <summary>{uk?'Часові вікна, що потрапили до календаря':'Time windows within this calendar'}
    {' · '}{rows.reduce((sum,r)=>sum+r.windows.length,0)}</summary>
   <ul>{rows.flatMap(r=>r.windows.map(w=><li key={w.sunriseDate+w.startUtc+w.status}>
    <span data-status={w.status} className={styles.windowBadge}>
     {w.status==='candidate'?(uk?'Кандидат':'Candidate'):
      (uk?'Потрібна додаткова перевірка':'Further review required')}</span>
    <time dateTime={w.startUtc}>{eventTime(w.startUtc)}</time>
    {' – '}<time dateTime={w.endUtc}>{eventTime(w.endUtc)}</time>
    <button type="button" onClick={()=>onPick(r.date,w.sampleUtc)}>
     {uk?'Відкрити цей момент':'Open this exact moment'}</button>
   </li>))}</ul>
   {verifiedFinder.windows.length>rows.reduce((sum,r)=>sum+r.windows.length,0)&&
    <p>{uk?'Частина вікон лежить поза поточною сторінкою календаря; дати не вигадуємо.':
     'Some results fall outside the displayed calendar; no dates are inferred.'}</p>}
  </details>}
  {verifiedPersonal&&!rows&&<p role="alert" className={styles.smartState}>
   {uk?'Особистий календар не вдалося узгодити з календарем подій.':
    'Personal dates could not be reconciled with public calendar events.'}</p>}
  <p className={styles.smartFootnote}>{uk?
   'П’ять анг — на сході Сонця; фази — на точний момент. Дати свят попередні. Натисни дату для часу переходів.':
   'Five limbs use local sunrise; Moon phases use exact event times. Festival dates are provisional. Select a date for transitions.'}</p>
 </section>;
}
