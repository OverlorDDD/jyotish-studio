'use client';
import {useEffect,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
import styles from './EclipsePanel.module.css';
type Point={date:string;timeZone:string;latitude:string;longitude:string};
type Eclipse={type:'solar'|'lunar';eclipseKind:'total'|'partial'|'annular'|'hybrid'|'penumbral';
 maximumUtc:string;visibleHere:boolean;localMaximumUtc:string|null};
type Data={version:string;timeZone:string;days:number;events:Eclipse[];
 independentVisibilityCertified:boolean};
const labels={
 uk:{title:'Затемнення · астрономічна видимість',intro:'Сонячні й місячні затемнення на Землі протягом року. Видимість перевіряється окремо для обраних координат за Swiss Ephemeris.',
 find:'Знайти затемнення на рік',loading:'Перевіряємо геометрію затемнень і локальну видимість…',
 error:'Не вдалося отримати перевірені дані затемнень. Перевір Python Swiss Ephemeris.',retry:'Спробувати ще раз',
 solar:'Сонячне',lunar:'Місячне',total:'повне',partial:'часткове',annular:'кільцеподібне',
 hybrid:'гібридне',penumbral:'напівтіньове',yes:'Видиме в цій місцевості',no:'Не видиме з цих координат',
 local:'Місцевий максимум',global:'Глобальний максимум',none:'На обраний період затемнень немає.',
 note:'Глобальне затемнення не обовʼязково видиме тут. Для спостереження Сонця потрібні сертифіковані захисні фільтри; звичайні окуляри непридатні. Часові й локальні умови розраховані Swiss Ephemeris, незалежну сертифікацію видимості ще не завершено.'},
 en:{title:'Eclipses · local visibility',intro:'Solar and lunar eclipses occurring on Earth over the next year. Visibility for your selected coordinates is independently checked by Swiss Ephemeris.',
 find:'Find eclipses for a year',loading:'Checking eclipse geometry and local visibility…',
 error:'Verified eclipse data are unavailable. Check Python Swiss Ephemeris.',retry:'Retry',
 solar:'Solar',lunar:'Lunar',total:'total',partial:'partial',annular:'annular',
 hybrid:'hybrid',penumbral:'penumbral',yes:'Visible from this location',no:'Not visible from these coordinates',
 local:'Local maximum',global:'Global maximum',none:'No eclipses in the selected time window.',
 note:'A global eclipse need not be visible here. Solar observations require certified solar filters; ordinary sunglasses are unsafe. Calculated times and local visibility use Swiss Ephemeris, with independent observational certification still separate.'}
} as const;
export default function EclipsePanel({locale,point}:{locale:PortalLocale;point:Point}){
 const t=labels[locale];
 const [query,setQuery]=useState<Point|null>(null),[data,setData]=useState<Data|null>(null);
 const [status,setStatus]=useState<'idle'|'loading'|'done'|'error'>('idle');
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  if(!query)return;
  let live=true;const ctl=new AbortController();
  setStatus('loading');setData(null);
  const q=new URLSearchParams({start:query.date,days:'366',zone:query.timeZone,
   latitude:query.latitude,longitude:query.longitude});
  fetch('/api/v1/astronomy/eclipses?'+q,{cache:'no-store',signal:ctl.signal})
   .then(async response=>{if(!response.ok)throw Error(String(response.status));return await response.json() as Data;})
   .then(json=>{if(live){setData(json);setStatus('done')}})
   .catch(()=>{if(live)setStatus('error')});
  return()=>{live=false;ctl.abort()};
 },[query,retry]);
 const fmt=(iso:string)=>new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',{
  dateStyle:'medium',timeStyle:'short',timeZone:query?.timeZone||point.timeZone
 }).format(new Date(iso));
 return <section className={styles.section} data-testid="eclipse-panel">
  <h2>{t.title}</h2><p>{t.intro}</p>
  <button type="button" onClick={()=>{setQuery({...point});setRetry(v=>v+1)}} disabled={status==='loading'}>
   {status==='loading'?t.loading:t.find}
  </button>
  {status==='error'&&<div role="alert">{t.error} <button type="button" onClick={()=>setRetry(v=>v+1)}>{t.retry}</button></div>}
  {status==='done'&&data&&(data.events.length===0?<p>{t.none}</p>:<ol className={styles.list}>
   {data.events.map((e,i)=><li key={e.maximumUtc+e.type+i}>
    <div><strong>{t[e.type]} · {t[e.eclipseKind]}</strong>
     <span>{e.visibleHere?t.yes:t.no}</span></div>
    <div className={styles.when}><small>{t.global}: {fmt(e.maximumUtc)}</small>
     {e.localMaximumUtc&&<small>{t.local}: {fmt(e.localMaximumUtc)}</small>}</div>
   </li>)}
  </ol>)}
  <p className={styles.note}>{t.note} <a href="https://eclipse.gsfc.nasa.gov/OH/OH2027.html" target="_blank" rel="noopener noreferrer">NASA · Eclipse Canon ↗</a></p>
 </section>;
}
