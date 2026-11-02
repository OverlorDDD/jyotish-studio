'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import {P31_TOPICS,type P31Topic} from '../../lib/panchanga-p31-model';
import {buildP35Cards,validateP35Range,validateP35Private,
 type P35Point,type P35Range,type P35Private} from '../../lib/panchanga-p35-calendar';
import styles from './PanchangaPersonalCalendar.module.css';

const topicLabels:Record<P31Topic,{uk:string;en:string}>={
 work:{uk:'Робота',en:'Work'},money:{uk:'Гроші',en:'Money'},
 relationships:{uk:'Стосунки',en:'Relationships'},travel:{uk:'Поїздки',en:'Travel'},
 personal:{uk:'Особисте',en:'Personal'}
};
const statusLabels={
 avoid:{uk:'Сильне обмеження на сході',en:'Hard sunrise restriction'},
 caution:{uk:'Обережність на сході',en:'Sunrise caution'},
 supportive:{uk:'Ранкова підтримка',en:'Sunrise lunar support'},
 neutral:{uk:'Невизначено на сході',en:'Unclear at sunrise'},
 general:{uk:'Загальні дані',en:'General data'}
};
type Status='loading'|'ready'|'no_chart'|'guest'|'error';
export default function PanchangaPersonalCalendar({locale,point,onPick}:{
 locale:PortalLocale;point:P35Point;onPick:(date:string)=>void
}){
 const uk=locale==='uk';
 const [days,setDays]=useState<7|30>(7);
 const [topic,setTopic]=useState<P31Topic>('work');
 const [range,setRange]=useState<P35Range|null>(null);
 const [personal,setPersonal]=useState<P35Private|null>(null);
 const [status,setStatus]=useState<Status>('loading');
 const [refresh,setRefresh]=useState(0);
 const observerKey=[point.date,point.timeZone,point.latitude,point.longitude].join('|');
 useEffect(()=>{
  let active=true;const ctl=new AbortController();
  setRange(null);setPersonal(null);setStatus('loading');
  const q=new URLSearchParams({start:point.date,days:String(days),
   zone:point.timeZone,latitude:point.latitude,longitude:point.longitude});
  const publicRange=async(kind:Status)=>{
   const r=await fetch('/api/v1/panchanga/range?'+q,{cache:'no-store',signal:ctl.signal});
   if(!r.ok)throw Error('Public range unavailable');
   const raw=await r.json() as P35Range;
   validateP35Range(raw,point,days);
   if(active){setRange(raw);setPersonal(null);setStatus(kind);}
  };
  (async()=>{
   const r=await fetch('/api/v1/personal/panchanga/calendar?'+q,{
    credentials:'same-origin',cache:'no-store',signal:ctl.signal});
   if(r.status===401){await publicRange('guest');return;}
   if(!r.ok){await publicRange('error');return;}
   const data=await r.json() as P35Private|{status:string};
   if(data.status==='requires_verified_chart'||data.status==='requires_primary_chart'){
    await publicRange('no_chart');return;
   }
   const verified=validateP35Private(data as P35Private,point,days);
   if(active){setRange(verified.range);setPersonal(verified);setStatus('ready');}
  })().catch(()=>{if(active&&!ctl.signal.aborted){
   setRange(null);setPersonal(null);setStatus('error');
  }});
  return()=>{active=false;ctl.abort();};
 },[days,observerKey,refresh,point.date,point.timeZone,point.latitude,point.longitude]);
 const cards=useMemo(()=>{
  if(!range)return null;
  try{return buildP35Cards(range,point,days,topic,personal);}
  catch{return null;}
 },[range,personal,days,topic,point.date,point.timeZone,point.latitude,point.longitude]);
 const fmt=(iso:string)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{
  timeZone:point.timeZone,day:'2-digit',month:'short',hour:'2-digit',
  minute:'2-digit',hourCycle:'h23'
 }).format(new Date(iso));
 const dayLabel=(date:string)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{
  timeZone:'UTC',weekday:'short',day:'numeric',month:'short'
 }).format(new Date(date+'T12:00:00Z'));
 const details=(event:NonNullable<typeof cards>[number]['events'][number])=>
  event.kind==='moon-sign'?(uk?'Місяць переходить у новий знак':'Moon enters a new sign')+
    ' ('+event.from+' → '+event.to+')':
  event.kind==='nakshatra'?(uk?'Перехід накшатри':'Nakshatra transition')+
    ' ('+event.from+' → '+event.to+')':
  event.kind==='mahadasha'?(uk?'Зміна махадаші':'Mahadasha transition'):
   (uk?'Зміна антардаші':'Antardasha transition');
 return <section className={styles.panel} data-testid="p35-calendar">
  <header className={styles.top}>
   <div><span className={styles.eyebrow}>GALAXIORA · P3.5</span>
    <h2>{uk?'Мій календар 7/30':'My 7/30-day calendar'}</h2>
    <p>{point.timeZone} · {uk?'Місцевий схід Сонця та точні астрономічні переходи':
     'Local sunrise snapshots and exact astronomical transitions'}</p></div>
   <div className={styles.switch} role="group" aria-label={uk?'Тривалість календаря':'Calendar range'}>
    {([7,30] as const).map(n=><button key={n} type="button"
     aria-pressed={days===n} onClick={()=>setDays(n)}>{n} {uk?'днів':'days'}</button>)}
   </div>
  </header>
  <div className={styles.topics} role="group" aria-label={uk?'Тема календаря':'Calendar topic'}>
   {P31_TOPICS.map(x=><button key={x} type="button" aria-pressed={topic===x}
    onClick={()=>setTopic(x)}>{topicLabels[x][locale]}</button>)}
  </div>
  <p className={styles.explain}>{uk?
   'Кожна картка описує лише натальні місячні показники на сході Сонця, а не сприятливість цілої доби. Натисніть на дату, щоб перейти до P3.4 і перевірити точні години, Раху-калам та всі сім чинників.':
   'Each card describes natal lunar indicators at sunrise only, not the whole day. Open a date for P3.4 exact hours, Rahu Kalam and all seven calendar factors.'}</p>
  {status==='loading'&&<p role="status">{uk?'Перевіряємо персональні дані й астрономічні переходи…':
   'Checking private facts and astronomical transitions…'}</p>}
  {status==='guest'&&<p className={styles.notice} data-testid="p35-guest">{uk?
   'Відкритий лише загальний календар. Увійдіть у свій акаунт для особистих натальних показників.':
   'Showing general calendar only. Sign in for private natal indicators.'}</p>}
  {status==='no_chart'&&<p className={styles.notice} data-testid="p35-need-chart">{uk?
   'Для персональних порад оберіть перевірену основну натальну карту в «Мій Всесвіт».':
   'Select your verified primary natal chart in Personal for individualized guidance.'}
   {' '}<Link href={'/'+locale+'/personal'}>{uk?'Відкрити кабінет':'Open Personal'}</Link></p>}
  {status==='error'&&<p role="alert" className={styles.notice}>{uk?
   'Персональний розрахунок недоступний. Показуємо загальні дані, якщо вони є.':
   'Private calculation unavailable. Showing general data if available.'}
   {' '}<button className={styles.retry} type="button" onClick={()=>setRefresh(v=>v+1)}>
    {uk?'Повторити':'Retry'}</button></p>}
  {cards?<><p className={styles.scope} data-testid="p35-scope">
    {personal?(uk?'Персональна оцінка тільки на сході Сонця · обрана перевірена карта':
     'Personal sunrise-only comparison · selected verified chart'):
     (uk?'Загальний астрономічний календар · без натальних висновків':
      'General astronomical calendar · no natal reading')}
   </p>
   <div className={styles.grid} data-testid="p35-days">
    {cards.map(card=><article key={card.date} className={styles.day} data-status={card.status}>
     <div className={styles.dayHead}>
      <time dateTime={card.date}>{dayLabel(card.date)}</time>
      <small>{statusLabels[card.status][locale]}</small>
     </div>
     <h3>{card.title[locale]}</h3>
     <p>{card.reason[locale]}</p>
     <p className={styles.action}>{card.action[locale]}</p>
     <p className={styles.detail}>{uk?'Тітхі':'Tithi'} {card.tithi}
      {' · '}{uk?'Накшатра':'Nakshatra'} {card.nakshatra}
      {' · '}{uk?'Схід':'Sunrise'} {fmt(card.sunriseUtc)}</p>
     {card.events.length>0&&<details className={styles.events}>
      <summary>{uk?'Точні переходи':'Exact transitions'} ({card.events.length})</summary>
      <ul>{card.events.map(e=><li key={e.kind+e.atUtc}>{fmt(e.atUtc)} · {details(e)}</li>)}</ul>
     </details>}
     <button type="button" className={styles.open} onClick={()=>onPick(card.date)}>
      {uk?'Відкрити день і точні години':'Open day and exact hours'}
     </button>
    </article>)}
   </div>
   </>:status!=='loading'?<p role="alert">{uk?
    'Перевіреного календаря немає; припущення не показуємо.':
    'Verified calendar unavailable; no synthetic readings shown.'}</p>:null}
 </section>;
}
