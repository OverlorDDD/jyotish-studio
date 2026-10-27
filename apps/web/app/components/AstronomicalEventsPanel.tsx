'use client';
import {useEffect,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
import styles from './AstronomicalEventsPanel.module.css';
import {eventInsight} from '../../../../packages/jyotish-core/src/astro-education.ts';

type Kind='new_moon'|'first_quarter'|'full_moon'|'last_quarter'|'sidereal_ingress'|'retrograde_station'|'direct_station';
type Event={kind:Kind;atUtc:string;localDate:string;body?:string;fromSign?:number;toSign?:number;
 motion?:'direct'|'retrograde';longitude?:number;sign?:number};
type Response={version:string;timeZone:string;startDate:string;days:number;events:Event[];
 referenceFrame:string;independentEventTimeCertified:boolean;eventTimeResolutionSeconds:number};
type Filter='all'|'moon'|'ingresses'|'stations';
const SIGNS={
 uk:['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'],
 en:['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
};
const PLANET_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mercury:'Меркурій',
 Venus:'Венера',Mars:'Марс',Jupiter:'Юпітер',Saturn:'Сатурн'};
const COPY={
 uk:{title:'Астрономічні події',intro:'Точний час місячних фаз, переходів планет між сидеричними знаками та моментів стаціонарності. Події шукаються за ефемеридами, а не за датами зі статичного календаря.',
 seven:'7 днів',thirty:'30 днів',all:'Усі',moon:'Фази Місяця',ingresses:'Переходи знаків',stations:'Ретроградність',
 loading:'Визначаємо точні моменти подій…',
 empty:'Для цього періоду обраних подій немає.',error:'Астрономічний рушій тимчасово недоступний. Перевір Swiss Ephemeris і повтори.',
 refresh:'Повторити',new_moon:'Молодик',first_quarter:'Перша чверть',full_moon:'Повня',last_quarter:'Остання чверть',
 direct_station:'Перехід до прямого руху',retrograde_station:'Початок ретроградного руху',
 ingress:'Перехід до знака',backward:'ретроградно',forward:'прямо',
 source:'Метод: Swiss Ephemeris · Lahiri · геоцентричні координати. Час чисельно уточнений до 1 с; незалежна еталонна сертифікація цих подій ще окрема перевірка. Фази не позначають затемнення.'},
 en:{title:'Astronomical events',intro:'Exact lunar phases, sidereal planetary ingresses and stationary instants, computed from ephemerides rather than static calendar dates.',
 seven:'7 days',thirty:'30 days',all:'All',moon:'Lunar phases',ingresses:'Sign ingresses',stations:'Retrograde stations',
 loading:'Locating astronomical events…',
 empty:'No selected events occur in this period.',error:'The astronomical source is temporarily unavailable. Check Swiss Ephemeris and retry.',
 refresh:'Retry',new_moon:'New Moon',first_quarter:'First Quarter',full_moon:'Full Moon',last_quarter:'Last Quarter',
 direct_station:'Station direct',retrograde_station:'Station retrograde',
 ingress:'Ingress into',backward:'retrograde',forward:'direct',
 source:'Method: Swiss Ephemeris · Lahiri · geocentric coordinates. Event instants are numerically isolated to 1 s; independent reference certification remains separate. Lunar phases do not imply eclipses.'}
} as const;
const phaseKinds:Kind[]=['new_moon','first_quarter','full_moon','last_quarter'];
export default function AstronomicalEventsPanel({locale,start,zone}:{locale:PortalLocale;start:string;zone:string}){
 const t=COPY[locale],uk=locale==='uk';
 const [days,setDays]=useState<7|30>(7),[filter,setFilter]=useState<Filter>('all');
 const [result,setResult]=useState<Response|null>(null),[loading,setLoading]=useState(false),
  [error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const ctrl=new AbortController();let live=true;
  setLoading(true);setError(false);setResult(null);
  const q=new URLSearchParams({start,zone,days:String(days)});
  fetch('/api/v1/astronomy/events?'+q.toString(),{cache:'no-store',signal:ctrl.signal})
   .then(async response=>{if(!response.ok)throw Error('Astronomy HTTP '+response.status);return await response.json() as Response;})
   .then(data=>{if(live)setResult(data);})
   .catch(()=>{if(live)setError(true);})
   .finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;ctrl.abort();};
 },[start,zone,days,attempt]);
 const fmt=(iso:string)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{
  dateStyle:'medium',timeStyle:'short',timeZone:result?.timeZone||zone
 }).format(new Date(iso));
 const desc=(e:Event)=>{
  const planet=uk?(PLANET_UK[e.body||'']||e.body):e.body;
  if(phaseKinds.includes(e.kind))return t[e.kind as 'new_moon'|'first_quarter'|'full_moon'|'last_quarter'];
  if(e.kind==='sidereal_ingress')return planet+' · '+t.ingress+' '+SIGNS[locale][(e.toSign||1)-1]+
   ' ('+(e.motion==='retrograde'?t.backward:t.forward)+')';
  if(e.kind==='retrograde_station')return planet+' · '+t.retrograde_station;
  return planet+' · '+t.direct_station;
 };
 const filtered=(result?.events||[]).filter(e=>filter==='all'||
  filter==='moon'&&phaseKinds.includes(e.kind)||
  filter==='ingresses'&&e.kind==='sidereal_ingress'||
  filter==='stations'&&e.kind.endsWith('_station'));
 return <section className={styles.section} data-testid="astronomical-events-panel">
  <header><div className={styles.kicker}>GALAXIORA · AE-P5</div><h2>{t.title}</h2><p>{t.intro}</p></header>
  <div className={styles.controls}>
   <div className={styles.toggle} aria-label={uk?'Період':'Period'}>
    <button type="button" aria-pressed={days===7} onClick={()=>setDays(7)}>{t.seven}</button>
    <button type="button" aria-pressed={days===30} onClick={()=>setDays(30)}>{t.thirty}</button>
   </div>
   <div className={styles.toggle} aria-label={uk?'Вид подій':'Event category'}>
    {(['all','moon','ingresses','stations'] as const).map(name=>
     <button type="button" key={name} aria-pressed={filter===name} onClick={()=>setFilter(name)}>{t[name]}</button>)}
   </div>
  </div>
  {loading&&<p role="status">{t.loading}</p>}
  {error&&<div role="alert" className={styles.error}>{t.error} <button type="button" onClick={()=>setAttempt(x=>x+1)}>{t.refresh}</button></div>}
  {!loading&&!error&&result&&<>
   <p className={styles.count}>{result.startDate} · {result.days} {uk?'днів':'days'} · {result.timeZone} · {filtered.length} {uk?'подій':'events'}</p>
   {filtered.length===0?<p className={styles.empty}>{t.empty}</p>:<ol className={styles.list}>
    {filtered.map((e,i)=><li key={e.kind+e.atUtc+e.body+i}>
     <time dateTime={e.atUtc}>{fmt(e.atUtc)}</time>
     <strong>{desc(e)}</strong>
     {e.kind==='sidereal_ingress'&&<small>{SIGNS[locale][(e.fromSign||1)-1]} → {SIGNS[locale][(e.toSign||1)-1]}</small>}
     <details style={{gridColumn:'1 / -1',borderTop:'1px solid #45617b',paddingTop:10}}>
      <summary style={{cursor:'pointer',color:'#f4d69b',fontWeight:600}}>{uk?'Що це означає і що можна зробити?':'What does this mean and what can I do?'}</summary>
      <div style={{display:'grid',gap:8,paddingTop:10,lineHeight:1.65}}>
       <p><strong>{uk?'Астрономічний факт':'Astronomical fact'}: </strong>{eventInsight(e.kind,locale).meaning}</p>
       <p><strong>{uk?'У традиції Джйотіш':'In Jyotish tradition'}: </strong>{eventInsight(e.kind,locale).tradition}</p>
       <p><strong>{uk?'Практика':'Practical idea'}: </strong>{eventInsight(e.kind,locale).practice}</p>
       <small>{eventInsight(e.kind,locale).limits}</small>
      </div>
     </details>
    </li>)}
   </ol>}
  </>}
  <p className={styles.source}>{t.source} <a href="https://www.astro.com/swisseph/swephprg.htm" target="_blank" rel="noopener noreferrer">Swiss Ephemeris ↗</a></p>
 </section>;
}
