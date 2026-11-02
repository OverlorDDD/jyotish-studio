'use client';
import {useEffect,useMemo,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
import type {P32Day} from '../../lib/panchanga-p32-engine';
import type {P31Topic} from '../../lib/panchanga-p31-model';
import {buildP34Timeline,type P34PrivateTiming} from '../../lib/panchanga-p34-time-guidance';
import styles from './PanchangaTimeGuidance.module.css';

type Point={date:string;timeZone:string;latitude:string;longitude:string;place:string};
type TimingState='idle'|'loading'|'ready'|'guest'|'no_chart'|'error';
const labels={avoid:{uk:'Не починати',en:'Avoid starting'},
 caution:{uk:'Краще відкласти',en:'Better postpone'},
 neutral:{uk:'Немає переваги',en:'No clear advantage'},
 supported:{uk:'Підтримувальний час',en:'Supportive window'}};
export default function PanchangaTimeGuidance({locale,day,point,topic,now}:{
 locale:PortalLocale;day:P32Day;point:Point;topic:P31Topic;now:number|null
}){
 const uk=locale==='uk';
 const [expanded,setExpanded]=useState(false);
 const [showAll,setShowAll]=useState(false);
 const [state,setState]=useState<TimingState>('idle');
 const [privateData,setPrivateData]=useState<P34PrivateTiming|null>(null);
 const [refresh,setRefresh]=useState(0);
 const key=[point.date,point.timeZone,point.latitude,point.longitude,day.sunriseUtc,day.nextSunriseUtc].join('|');
 useEffect(()=>{
  if(!expanded)return;
  let active=true;const controller=new AbortController();
  setState('loading');setPrivateData(null);
  // One private, never-cached batch per selected observer/day. Topic switches
  // do not trigger extra Swiss requests, and no birth data enters the URL.
  const query=new URLSearchParams({date:point.date,zone:point.timeZone,
   latitude:point.latitude,longitude:point.longitude});
  fetch('/api/v1/personal/panchanga/timing?'+query,{credentials:'same-origin',
   cache:'no-store',signal:controller.signal})
   .then(async response=>{
    if(response.status===401){if(active)setState('guest');return null;}
    if(!response.ok)throw Error('Private time guidance unavailable');
    return response.json();
   }).then(payload=>{
    if(!active||!payload)return;
    if(payload.status==='requires_primary_chart'||payload.status==='requires_verified_chart'){
     setState('no_chart');return;
    }
    if(payload.status!=='available'||payload.version!=='private-time-guidance-p34')
     throw Error('Unverified timing payload');
    // Full validation is repeated below against the independently loaded
    // public Swiss day before anything personal is displayed.
    buildP34Timeline(day,point,topic,payload,day.sunriseUtc);
    if(active){setPrivateData(payload);setState('ready');}
   }).catch(()=>{if(active&&!controller.signal.aborted)setState('error')});
  return()=>{active=false;controller.abort();};
 },[expanded,key,refresh,day,point.date,point.timeZone,point.latitude,point.longitude]);
 const timeline=useMemo(()=>{
  if(!expanded)return null;
  const begin=Date.parse(day.sunriseUtc),end=Date.parse(day.nextSunriseUtc);
  const today=now??begin;
  const available=now!==null&&today>=begin&&today<end?today:
   now!==null&&today>=end?end:begin;
  const from=new Date(available).toISOString();
  try{return buildP34Timeline(day,point,topic,privateData,from);}
  catch{return null;}
 },[expanded,day,point,topic,privateData,now]);
 const format=(iso:string)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{
  timeZone:point.timeZone,day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',
  hourCycle:'h23'
 }).format(new Date(iso));
 const active=timeline?.windows.find(w=>now!==null&&now>=Date.parse(w.startUtc)&&now<Date.parse(w.endUtc));
 return <section className={styles.section} data-testid="p34-timing">
  <div className={styles.header}>
   <div>
    <h4>{uk?'Коли краще починати?':'When is a better time to start?'}</h4>
    <p>{uk?'Від місцевого сходу Сонця до наступного сходу — з урахуванням усіх підтверджених переходів.':
     'Local sunrise to the next sunrise, with every verified transition evaluated.'}</p>
   </div>
   <button type="button" className={styles.toggle} aria-expanded={expanded}
    onClick={()=>setExpanded(x=>!x)}>{expanded?(uk?'Згорнути':'Collapse'):(uk?'Показати години':'Show time windows')}</button>
  </div>
  {expanded&&<div data-testid="p34-expanded">
   {state==='loading'&&<p role="status">{uk?'Перевіряємо персональні переходи… Загальні інтервали вже доступні.':
    'Checking personal transitions… General windows are available.'}</p>}
   {state==='error'&&<p role="alert">{uk?
    'Персональні години не підтверджено. Нижче лише загальні календарні інтервали.':
    'Personal timing could not be verified. Only general calendar windows are shown.'}
    {' '}<button type="button" className={styles.retry} onClick={()=>setRefresh(v=>v+1)}>
     {uk?'Повторити':'Retry'}</button></p>}
   {state==='no_chart'&&<p className={styles.note}>{uk?
    'Для персональних інтервалів оберіть свою перевірену основну натальну карту в «Мій Всесвіт».':
    'Select your own verified primary birth chart in Personal for individualized windows.'}</p>}
   {state==='guest'&&<p className={styles.note}>{uk?
    'Увійдіть у кабінет для натальних поправок. Поки показано загальну Панчангу.':
    'Sign in for natal timing. General Panchanga is shown for now.'}</p>}
   {!timeline?<p role="alert">{uk?
    'Не вдалося підтвердити повну шкалу переходів; часових рекомендацій немає.':
    'Complete transition coverage could not be verified; no hourly recommendations are shown.'}</p>:
    <>
     <p className={styles.note} data-testid="p34-scope">{timeline.personalized?
      (uk?'Персональна шкала: власна перевірена карта, Місяць, п’ять гочар і даші.':
       'Personal timeline: verified owned chart, Moon, five transits and dashas.'):
      (uk?'Загальна шкала: п’ять анг, фаза Місяця і Раху-калам. Не персональна.':
       'General timeline: five limbs, lunar phase and Rahu Kalam. Not personal.')}</p>
     {active&&<p className={styles.now} data-testid="p34-now">
      {uk?'Поточний відрізок: ':'Current interval: '}
      <strong>{format(active.startUtc)} – {format(active.endUtc)}</strong> · {labels[active.status][locale]}
     </p>}
     <div className={styles.alternative} data-testid="p34-alternative">
      {timeline.nextSupported?<>
       <strong>{uk?'Найближче підтримувальне вікно':'Next supportive window'}</strong>
       <p>{format(timeline.nextSupported.startUtc)} – {format(timeline.nextSupported.endUtc)}</p>
       <p>{uk?'Для початку справи доступно щонайменше 15 хвилин підтримувальних умов; не автоматична гарантія результату.':
        'At least 15 minutes of supportive conditions remain for the beginning; not a guarantee of outcome.'}</p>
      </>:<p>{uk?'Підтвердженого підтримувального вікна для цієї справи в обраний ведичний день немає.':
       'No verified supportive window for this activity in the selected Vedic day.'}</p>}
     </div>
     <ol className={styles.timeline} data-testid="p34-windows">
      {(showAll?timeline.windows:timeline.windows.slice(0,10)).map(w=><li key={w.startUtc}
       className={styles.window} data-status={w.status}>
       <div className={styles.windowHead}>
        <strong>{format(w.startUtc)} – {format(w.endUtc)}</strong>
        <span>{labels[w.status][locale]}</span>
       </div>
       <p>{w.reason[locale]}</p>
       <details>
        <summary>{uk?'Причини й переходи':'Reasons and transitions'}</summary>
        {w.changes.length>0&&<p>{uk?'На початку змінилося: ':'At the start: '}{w.changes.join(', ')}</p>}
        <ul>{w.factors.filter(f=>f.tone==='blocks'||f.tone==='cautions'||
         w.status==='supported'&&f.tone==='supports').slice(0,8).map(f=>
         <li key={f.id}>{f.note[locale]}</li>)}</ul>
       </details>
      </li>)}
     </ol>
     {timeline.windows.length>10&&<button type="button" className={styles.toggle}
      onClick={()=>setShowAll(x=>!x)}>{showAll?(uk?'Перші 10':'First 10'):
       (uk?'Показати всі '+timeline.windows.length+' відрізків':'Show all '+timeline.windows.length+' intervals')}</button>}
     <p className={styles.note}>{uk?
      'Межі в місцевому часовому поясі, обчислення — за UTC. Кожен відрізок оцінено окремо; Раху-калам враховано всередині висновків. Це вибір часу за визначеними традиційними правилами, а не повна церемоніальна мухурта.':
      'Local clock times, UTC computation. Every segment is independently evaluated; Rahu Kalam is included in each verdict. This is timing under documented traditional rules, not a complete ceremonial muhurta.'}</p>
    </>}
  </div>}
 </section>;
}
