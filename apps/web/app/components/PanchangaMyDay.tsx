'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import {p31DaySummary,P31_TOPICS,type P31Topic,type P31Day} from '../../lib/panchanga-p31-model';
import {interpretPanchanga,type P32Day} from '../../lib/panchanga-p32-engine';
import styles from './PanchangaMyDay.module.css';

type Point={date:string;timeZone:string;latitude:string;longitude:string;place:string};
type Eclipse={type:'solar'|'lunar';eclipseKind:'total'|'partial'|'annular'|'hybrid'|'penumbral';
 maximumUtc:string;visibleHere:boolean;localMaximumUtc:string|null};
type EclipseResponse={events:Eclipse[];independentVisibilityCertified:boolean};
const topics:Record<P31Topic,{uk:string;en:string}>={
 work:{uk:'Робота',en:'Work'},money:{uk:'Гроші',en:'Money'},
 relationships:{uk:'Стосунки',en:'Relationships'},travel:{uk:'Поїздки',en:'Travel'},
 personal:{uk:'Особисті справи',en:'Personal'}
};
export default function PanchangaMyDay({locale,day,point}:{locale:PortalLocale;day:P31Day;point:Point}){
 const uk=locale==='uk';
 const [topic,setTopic]=useState<P31Topic>('work');
 const [now,setNow]=useState<number|null>(null);
 const [eclipseRequest,setEclipseRequest]=useState<Point|null>(null);
 const [eclipses,setEclipses]=useState<EclipseResponse|null>(null);
 const [skyStatus,setSkyStatus]=useState<'idle'|'loading'|'ready'|'error'>('idle');
 useEffect(()=>{
  const tick=()=>setNow(Date.now());tick();
  const id=setInterval(tick,60000);return()=>clearInterval(id);
 },[]);
 const summary=useMemo(()=>now===null?null:p31DaySummary(day,now,topic),[day,now,topic]);
 const interpretation=useMemo(()=>{
  if(now===null)return null;
  try{return interpretPanchanga(day as P32Day,now,topic);}
  catch{return null;} // Fail closed: never emit a guessed tradition verdict.
 },[day,now,topic]);
 const selectedKey=[point.date,point.timeZone,point.latitude,point.longitude].join('|');
 const queryKey=eclipseRequest?[eclipseRequest.date,eclipseRequest.timeZone,
   eclipseRequest.latitude,eclipseRequest.longitude].join('|'):null;
 const visibleQuery=queryKey===selectedKey;
 useEffect(()=>{
  if(!eclipseRequest)return;
  let live=true;const ctl=new AbortController();
  setSkyStatus('loading');setEclipses(null);
  const qs=new URLSearchParams({start:eclipseRequest.date,days:'366',zone:eclipseRequest.timeZone,
   latitude:eclipseRequest.latitude,longitude:eclipseRequest.longitude});
  fetch('/api/v1/astronomy/eclipses?'+qs,{cache:'no-store',signal:ctl.signal})
   .then(async r=>{if(!r.ok)throw Error(String(r.status));return await r.json() as EclipseResponse})
   .then(payload=>{
    if(!Array.isArray(payload.events)||typeof payload.independentVisibilityCertified!=='boolean'||
      payload.events.some(e=>!['solar','lunar'].includes(e.type)||
       typeof e.visibleHere!=='boolean'||!Number.isFinite(Date.parse(e.maximumUtc))||
       e.visibleHere&&!Number.isFinite(Date.parse(e.localMaximumUtc||''))))
      throw Error('Invalid local eclipse visibility response');
    if(live){setEclipses(payload);setSkyStatus('ready');}
   }).catch(()=>{if(live&&!ctl.signal.aborted)setSkyStatus('error')});
  return()=>{live=false;ctl.abort()};
 },[eclipseRequest]);
 const fmt=(date:string,withDate=false)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{
  timeZone:point.timeZone,...(withDate?{dateStyle:'medium' as const}:{hour:'2-digit' as const,minute:'2-digit' as const}),
  ...(withDate?{timeStyle:'short' as const}:{})
 }).format(new Date(date));
 const visibleEvents=visibleQuery&&eclipses?.events?eclipses.events.filter(e=>e.visibleHere):[];
 return <section className={styles.dashboard} data-testid="p31-my-day">
  <div className={styles.top}>
   <div>
    <span className={styles.eyebrow}>{uk?'МОЯ ПАНЧАНГА · ОБРАНИЙ ДЕНЬ':'MY PANCHANGA · SELECTED DAY'}</span>
    <h2>{uk?'Мій день':'My day'}</h2>
    <p>{point.date} · {point.place} · {point.timeZone}</p>
   </div>
   <span className={styles.scope}>{uk?'Календарні дані':'Calendar data'}</span>
  </div>
  {summary?<div className={styles.summary} data-testid="p31-summary">
   <p className={styles.status}>
    {summary.vedicDay==='live'?(uk?'Зараз триває ведичний день для цього міста':'The Vedic day is active for this city'):
     summary.vedicDay==='pre_sunrise'?(uk?'До сходу Сонця триває попередній ведичний день':'The previous Vedic day continues until sunrise'):
     uk?'Обрана дата — не поточний ведичний день':'Selected date — not the current Vedic day'}
   </p>
   <h3>{summary.moon[locale]} · {uk?'місячний день':'lunar day'} {summary.observedTithi}</h3>
   <p className={styles.moonNote}>{summary.isLive?
     (uk?'Показник на поточний момент.':'Value at this moment.'):
     (uk?'Показник на сході Сонця обраної дати.':'Value at sunrise of the selected date.')}</p>
   <div className={styles.sunTimes}>
    <span>{uk?'Схід':'Sunrise'} <strong>{fmt(summary.sunriseUtc)}</strong></span>
    <span>{uk?'Захід':'Sunset'} <strong>{fmt(summary.sunsetUtc)}</strong></span>
    <span>{uk?'Наступний схід':'Next sunrise'} <strong>{fmt(summary.nextSunriseUtc)}</strong></span>
   </div>
   <div className={styles.advice} data-testid="p31-advice">
    <p className={styles.adviceLabel}>{uk?'Яку справу плануєте?':'What are you planning?'}</p>
    <div className={styles.topicButtons} role="group" aria-label={uk?'Тема поради':'Advice topic'}>
     {P31_TOPICS.map(key=><button key={key} type="button" aria-pressed={topic===key}
      onClick={()=>setTopic(key)}>{topics[key][locale]}</button>)}
    </div>
    {interpretation?<div data-testid="p32-interpretation">
     <p className={styles.scopeNote}>{uk?'Обрана тема':'Selected topic'}: <strong>{topics[topic][locale]}</strong> · {uk?
      'Астрологічна традиція, не персональна натальна оцінка':
      'Traditional calendar, not a natal reading'}</p>
     <h4 data-testid="p32-headline">{interpretation.headline[locale]}</h4>
     <p className={styles.action}>{interpretation.action[locale]}</p>
     <p className={styles.scopeNote}>{interpretation.reason[locale]}</p>
     <p className={styles.scopeNote}>{interpretation.moment==='live'?
      (uk?'За показниками на поточний момент.':'Based on factors at this moment.'):
      (uk?'Оцінка на схід Сонця обраної дати, не висновок на поточну годину.':
       'Sunrise snapshot for the selected date, not a claim about this hour.')}</p>
     {interpretation.untilUtc&&<p className={styles.scopeNote}>{uk?'Найближча зміна показника до':'Next evaluated change by'}: <strong>{fmt(interpretation.untilUtc,true)}</strong></p>}
     <details className={styles.reasonDetails} data-testid="p32-evidence">
      <summary>{uk?'Чому така порада? П’ять показників, Місяць і денний період':
       'Why? Five limbs, Moon and daylight interval'}</summary>
      <ol>{interpretation.evidence.map(f=><li key={f.id}>
       <strong>{f.factor==='tithi'?(uk?'Місячний день':'Lunar day'):
        f.factor==='nakshatra'?(uk?'Накшатра':'Nakshatra'):
        f.factor==='vara'?(uk?'День тижня':'Weekday'):
        f.factor==='yoga'?(uk?'Сонячно-місячна йога':'Sun–Moon Yoga'):
        f.factor==='karana'?(uk?'Карана':'Karana'):
        f.factor==='moon'?(uk?'Фаза Місяця':'Moon phase'):
        (uk?'Раху-калам':'Rahu Kalam')}</strong> — {f.detail[locale]}
      </li>)}</ol>
     </details>
    </div>:<p role="alert">{uk?'Не вдалося перевірити поєднання п’яти показників. Пораду не показано.':
     'Could not verify all five factors. No advice is displayed.'}</p>}
    <p className={styles.scopeNote}>{uk?
     'Для персонального висновку за натальною картою і точного вибору години потрібні наступні розрахунки.':
     'A natal comparison and precise electional hour require further calculations.'}</p>
    <Link className={styles.profileLink} href={'/'+locale+'/personal'}>
     {uk?'Створити або перевірити натальну карту для персонального аналізу':
      'Create or check your birth chart for a personal reading'}
    </Link>
   </div>
  </div>:<p role="status">{uk?'Уточнюємо поточний момент…':'Checking the current moment…'}</p>}
  <section className={styles.sky} data-testid="p31-sky">
   <div>
    <h3>{uk?'Що можна побачити в небі?':'What can you see in the sky?'}</h3>
    <p>{uk?'Перевірте, чи будуть сонячні або місячні затемнення видимі з обраного міста протягом 366 днів.':
     'Check whether solar or lunar eclipses are visible from your city over the next 366 days.'}</p>
   </div>
   <button type="button" onClick={()=>{setEclipseRequest({...point})}} disabled={visibleQuery&&skyStatus==='loading'}>
    {visibleQuery&&skyStatus==='loading'?(uk?'Розраховуємо видимість…':'Checking visibility…'):
     uk?'Перевірити затемнення':'Check eclipses'}
   </button>
   {visibleQuery&&skyStatus==='error'&&<p role="alert">{uk?
    'Зараз не вдалося перевірити видимість. Спробуйте ще раз.':
    'Visibility calculation failed. Please retry.'}</p>}
   {visibleQuery&&skyStatus==='ready'&&eclipses&&<div className={styles.skyResults} role="status">
    {visibleEvents.length?
     <><strong>{uk?'Затемнення, розраховані як видимі з цього міста:':
      'Eclipses calculated as visible from this location:'}</strong>
      <ul>{visibleEvents.slice(0,4).map((e,i)=><li key={e.maximumUtc+e.type+i}>
       {e.type==='solar'?(uk?'Сонячне':'Solar'):(uk?'Місячне':'Lunar')} ·
       {' '}{fmt(e.localMaximumUtc! ,true)} {uk?'(місцевий максимум)':'(local maximum)'}
      </li>)}</ul></>:
      <p>{uk?'У найближчі 366 днів розрахунок не показує видимих тут затемнень.':
       'No eclipses are calculated as visible here in the next 366 days.'}</p>}
    <p className={styles.scopeNote}>{uk?
     'Видимість — за геометрією Swiss Ephemeris; погода не врахована. Сонце спостерігайте лише через сертифікований сонячний фільтр.':
     'Geometric Swiss Ephemeris visibility, weather not included. View the Sun only with a certified solar filter.'}</p>
   </div>}
  </section>
 </section>;
}
