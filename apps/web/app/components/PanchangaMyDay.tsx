'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import {p31DaySummary,P31_TOPICS,type P31Topic,type P31Day} from '../../lib/panchanga-p31-model';
import {interpretPanchanga,type P32Day} from '../../lib/panchanga-p32-engine';
import {synthesizePersonalResonance,validateP33Report,type P33Report,type P33Result} from '../../lib/panchanga-p33-resonance';
import PanchangaTimeGuidance from './PanchangaTimeGuidance';
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
 const [resonance,setResonance]=useState<{report:P33Report;atUtc:string;key:string;mode:'live'|'sunrise-snapshot'}|null>(null);
 const [personalState,setPersonalState]=useState<'loading'|'guest'|'no_chart'|'ready'|'error'>('loading');
 const [personalRetry,setPersonalRetry]=useState(0);
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
 // Once per selected observer/date: authenticated private result only; no shared
 // cache, natal birth parameters in URLs, or expensive calls on topic changes.
 useEffect(()=>{
  let active=true;const controller=new AbortController();
  setPersonalState('loading');setResonance(null);
  const current=Date.now();
  const local=new Intl.DateTimeFormat('en-US',{timeZone:point.timeZone,
   year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(current));
  const p=(k:string)=>local.find(x=>x.type===k)?.value||'';
  const civil=p('year')+'-'+p('month')+'-'+p('day');
  const live=civil===point.date&&current>=Date.parse(day.sunriseUtc)&&current<Date.parse(day.nextSunriseUtc);
  const target=live?new Date(current).toISOString():day.sunriseUtc;
  const search=new URLSearchParams({date:point.date,zone:point.timeZone,
   latitude:point.latitude,longitude:point.longitude,at:target});
  fetch('/api/v1/personal/panchanga/resonance?'+search,{credentials:'same-origin',
   cache:'no-store',signal:controller.signal})
   .then(async response=>{
    if(response.status===401){if(active)setPersonalState('guest');return null;}
    if(!response.ok)throw Error('Private resonance unavailable');
    return response.json();
   }).then(payload=>{
    if(!active||!payload)return;
    if(payload.status==='requires_primary_chart'||payload.status==='requires_verified_chart'){
     setPersonalState('no_chart');return;
    }
    validateP33Report(payload as P33Report,point,day as P32Day,target);
    setResonance({report:payload as P33Report,atUtc:target,key:selectedKey,mode:live?'live':'sunrise-snapshot'});
    setPersonalState('ready');
   }).catch(()=>{if(active&&!controller.signal.aborted)setPersonalState('error')});
  return()=>{active=false;controller.abort()};
 },[day,point.date,point.timeZone,point.latitude,point.longitude,selectedKey,personalRetry]);
 const personal=useMemo(():P33Result|null=>{
  if(!resonance||resonance.key!==selectedKey)return null;
  try{
   const at=Date.parse(resonance.atUtc);
   return synthesizePersonalResonance(
    interpretPanchanga(day as P32Day,at,topic,resonance.mode==='live'?'auto':'sunrise-snapshot'),day as P32Day,point,resonance.report,resonance.atUtc);
  }catch{return null;}
 },[day,point,topic,resonance,selectedKey]);
 const calendarEvidence=useMemo(()=>{
  if(!personal||!resonance)return interpretation;
  try{return interpretPanchanga(day as P32Day,Date.parse(resonance.atUtc),topic,
   resonance.mode==='live'?'auto':'sunrise-snapshot');}
  catch{return null;}
 },[day,interpretation,personal,resonance,topic]);
 const decision=personal||interpretation;
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
     <p className={styles.scopeNote}>{uk?'Обрана тема':'Selected topic'}: <strong>{topics[topic][locale]}</strong> · {personal?
      (uk?'Персонально за перевіреною натальною картою':'Personal reading from verified birth chart'):
      (uk?'Загальна Панчанга · без натальної оцінки':'General Panchanga · no natal comparison')}</p>
     <p className={styles.scopeNote}>{uk?'Обрана справа':'Planned activity'}: <strong>{interpretation.subject[locale]}</strong></p>
     <h4 data-testid="p32-headline">{decision?.headline[locale]}</h4>
     <p className={styles.action}>{decision?.action[locale]}</p>
     <p className={styles.scopeNote}>{decision?.reason[locale]}</p>
     {personal&&<div data-testid="p33-personal" className={styles.personalSummary}>
      <p className={styles.scopeNote}>{uk?'Місяць при народженні зіставлено з його поточним положенням, рухом планет і вашим планетарним періодом.':
       'Your birth Moon is compared with its current position, planetary movements and your current planetary period.'} ·
       {' '}{fmt(personal.atUtc,true)}</p>
      <details className={styles.reasonDetails} data-testid="p33-evidence">
       <summary>{uk?'Чому це стосується саме мене?':'Why does this apply to me?'}</summary>
       <ul>{personal.evidence.map(e=><li key={e.id}>{e.note[locale]}</li>)}</ul>
      </details>
     </div>}
     {personalState==='loading'&&!personal&&<p className={styles.scopeNote} role="status">{uk?
      'Перевіряємо натальну карту для персонального висновку…':
      'Checking your birth chart for a personal reading…'}</p>}
     {personalState==='no_chart'&&!personal&&<p className={styles.scopeNote} data-testid="p33-need-chart">{uk?
      'Оберіть основну перевірену натальну карту в «Мій Всесвіт», щоб отримати особисту пораду.':
      'Select a verified primary birth chart in Personal for an individual reading.'}</p>}
     {personalState==='error'&&!personal&&<p className={styles.scopeNote} role="alert">
      {uk?'Персональний розрахунок недоступний; показана лише загальна Панчанга.':
       'Private calculations unavailable; showing the general Panchanga only.'}
      {' '}<button type="button" onClick={()=>setPersonalRetry(v=>v+1)}>
       {uk?'Повторити':'Retry'}</button>
     </p>}
     {personal&&<button type="button" className={styles.resonanceRefresh}
      onClick={()=>setPersonalRetry(v=>v+1)}>{uk?'Оновити персональний розрахунок':'Refresh personal reading'}</button>}
     <p className={styles.scopeNote}>{uk?'Раху-калам, коли за традицією не починають важливих справ':
      'Rahu Kalam, traditionally avoided for new undertakings'}:
      {' '}<strong>{fmt(summary.rahuFromUtc)}–{fmt(summary.rahuUntilUtc)}</strong></p>
     <p className={styles.scopeNote}>{personal?
      (uk?'Персональна оцінка на вказаний точний момент; час інших переходів перевіряється на P3.4.':
       'Personal comparison at the shown exact moment; other timing boundaries are evaluated in P3.4.'):
      interpretation.moment==='live'?
      (uk?'За показниками на поточний момент.':'Based on factors at this moment.'):
      (uk?'Оцінка на схід Сонця обраної дати, не висновок на поточну годину.':
       'Sunrise snapshot for the selected date, not a claim about this hour.')}</p>
     {calendarEvidence?.untilUtc&&<p className={styles.scopeNote}>{uk?'Найближча зміна показника до':'Next evaluated change by'}: <strong>{fmt(calendarEvidence.untilUtc,true)}</strong></p>}
     <details className={styles.reasonDetails} data-testid="p32-evidence">
      <summary>{uk?'Чому така порада? П’ять показників, Місяць і денний період':
       'Why? Five limbs, Moon and daylight interval'}</summary>
      <ol>{(calendarEvidence?.evidence||[]).map(f=><li key={f.id}>
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
    <PanchangaTimeGuidance locale={locale} day={day as P32Day} point={point}
     topic={topic} now={now}/>
    <p className={styles.scopeNote}>{personal?
     (uk?'Детальний вибір годин доступний у часовій шкалі; повна церемоніальна мухурта потребує окремої перевірки.':
      'Hourly windows are available in the timeline; a full ceremonial muhurta requires separate verification.'):
     (uk?'Персональні години доступні з перевіреною натальною картою.':
      'A verified birth chart is required for personalized hours.')}</p>
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
