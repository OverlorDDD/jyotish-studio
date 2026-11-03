'use client';
import {useEffect,useRef,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
import {chooseInitialDay,type CalendarSystem} from '../../lib/panchanga-integration';
import type {LivePanchangaDay} from '../../lib/panchanga-live';
import type {P38ActivityId} from '../../lib/panchanga-p38-decision';
import CitySearch from './CitySearch';
import PanchangaDailyOpportunities from './PanchangaDailyOpportunities';
import type {OpportunityDay} from '../../lib/panchanga-opportunities';
import PanchangaRangeView from './PanchangaRangeView';
import PanchangaLiveDay from './PanchangaLiveDay';
import GlossaryText from './GlossaryText';
import styles from './PanchangaHub.module.css';

type Form={date:string;timeZone:string;latitude:string;longitude:string;place:string};
type Day=LivePanchangaDay&{
 version:string;date:string;sunriseUtc:string;sunsetUtc:string;nextSunriseUtc:string;
 location:{timeZone:string;latitude:number;longitude:number};
 daytimeKalas:{rahuKalam:{part:number;fromUtc:string;untilUtc:string};
 yamaganda:{part:number;fromUtc:string;untilUtc:string};
 gulikaKalam:{part:number;fromUtc:string;untilUtc:string}};
 sunriseMethod:string;
};
const DEFAULT_CITY={place:'Київ',latitude:'50.4501',longitude:'30.5234',timeZone:'Europe/Kyiv'};
const localeDate=(zone:string)=>{
 const p=new Intl.DateTimeFormat('en',{timeZone:zone,year:'numeric',month:'2-digit',
  day:'2-digit'}).formatToParts(new Date());
 const get=(k:string)=>p.find(x=>x.type===k)?.value||'';
 return get('year')+'-'+get('month')+'-'+get('day');
};
export default function PanchangaHub({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const defaultCity={...DEFAULT_CITY,place:uk?'Київ':'Kyiv'};
 const [form,setForm]=useState<Form>({date:localeDate(DEFAULT_CITY.timeZone),...defaultCity});
 const [requested,setRequested]=useState<Form|null>(null);
 const [view,setView]=useState<'day'|'week'|'month'>('day');
 const [activity,setActivity]=useState<P38ActivityId>('job_start');
 const [todayResetSerial,setTodayResetSerial]=useState(0);
 const [monthSystem,setMonthSystem]=useState<CalendarSystem>('amanta');
 const [day,setDay]=useState<Day|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(false);
 const [source,setSource]=useState<'checking'|'guest'|'none'|'natal'|'saved'>('checking');
 const [autoSave,setAutoSave]=useState(true);
 const [saveState,setSaveState]=useState<'idle'|'saving'|'saved'|'error'>('idle');
 const saveSequence=useRef(0),saveQueue=useRef<Promise<unknown>>(Promise.resolve());
 useEffect(()=>{
  const qs=new URLSearchParams(window.location.search);
  if(qs.get('view')==='personal')setView('week'); // retired duplicate 7/30 view
  else if(qs.get('view')==='week'||qs.get('view')==='month')setView(qs.get('view') as 'week'|'month');
  let live=true;const ctl=new AbortController();
  fetch('/api/v1/personal/panchanga/location',{credentials:'same-origin',cache:'no-store',signal:ctl.signal})
   .then(async r=>r.status===401?null:r.ok?await r.json() as {
    source:'saved'|'natal'|'none';location:{place:string;timeZone:string;latitude:number;longitude:number}|null
   }:Promise.reject(Error('location unavailable')))
   .then(profile=>{
    if(!live)return;
    const p=profile?.location;
    const base=p?{place:p.place||'—',timeZone:p.timeZone,
     latitude:String(p.latitude),longitude:String(p.longitude)}:defaultCity;
    const selected={...base,date:chooseInitialDay(qs.get('date'),base.timeZone)};
    setSource(profile?.source||'guest');setForm(selected);setRequested(selected);
   }).catch(()=>{
    if(!live)return;
    const selected={...defaultCity,date:chooseInitialDay(qs.get('date'),DEFAULT_CITY.timeZone)};
    setSource('guest');setForm(selected);setRequested(selected);
   });
  return()=>{live=false;ctl.abort()};
 },[]);
 function saveCity(next:Form){
  if(!autoSave||source==='guest'||source==='checking')return;
  const version=++saveSequence.current;setSaveState('saving');
  const pending=saveQueue.current.catch(()=>{}).then(async()=>{
   if(version!==saveSequence.current)return;
   const response=await fetch('/api/v1/personal/panchanga/location',{
    method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({place:next.place,timeZone:next.timeZone,
     latitude:Number(next.latitude),longitude:Number(next.longitude)})});
   if(!response.ok)throw Error('save city failed');
   if(version===saveSequence.current){setSource('saved');setSaveState('saved');}
  });
  saveQueue.current=pending.catch(()=>{if(version===saveSequence.current)setSaveState('error')});
 }
 function selectLocation(next:Form){
  setForm(next);setRequested(next);setDay(null);
  saveCity(next);
 }
 async function restoreNatalCity(){
  const version=++saveSequence.current;setSaveState('saving');
  try{
   await saveQueue.current.catch(()=>{});
   if(version!==saveSequence.current)return;
   const r=await fetch('/api/v1/personal/panchanga/location',{method:'DELETE',credentials:'same-origin'});
   if(!r.ok)throw Error('restore failed');
   const profile=await r.json() as {source:'natal'|'none';location:{
    place:string;timeZone:string;latitude:number;longitude:number}|null};
   const p=profile.location;
   const next=p?{...form,place:p.place,timeZone:p.timeZone,
    latitude:String(p.latitude),longitude:String(p.longitude)}:{...form,...defaultCity};
   if(version!==saveSequence.current)return;
   setForm(next);setRequested(next);setSource(profile.source);setSaveState('idle');
  }catch{if(version===saveSequence.current)setSaveState('error')}
 }
 function setDate(date:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
  const next={...form,date};setForm(next);setRequested(next);setDay(null);
 }
 function pickDay(date:string){setDate(date);setView('day')}
 function resetToToday(){
  // Use the selected event-city IANA time zone, never browser-local midnight.
  setDate(localeDate(form.timeZone));setView('day');
  setTodayResetSerial(x=>x+1);
 }
 useEffect(()=>{
  if(!requested||view!=='day')return;
  let live=true;const ctl=new AbortController();setLoading(true);setError(false);setDay(null);
  const q=new URLSearchParams({date:requested.date,zone:requested.timeZone,
   latitude:requested.latitude,longitude:requested.longitude});
  fetch('/api/v1/panchanga/day?'+q,{cache:'no-store',signal:ctl.signal})
   .then(async r=>{if(!r.ok)throw Error('Panchanga calculation failed');return await r.json() as Day})
   .then(result=>{if(live)setDay(result)})
   .catch(()=>{if(live&&!ctl.signal.aborted)setError(true)})
   .finally(()=>{if(live)setLoading(false)});
  return()=>{live=false;ctl.abort()};
 },[requested,view]);
 const matches=Boolean(day&&requested&&day.date===requested.date&&
  day.location.timeZone===requested.timeZone&&
  Math.abs(day.location.latitude-Number(requested.latitude))<1e-8&&
  Math.abs(day.location.longitude-Number(requested.longitude))<1e-8);
 const fmt=(iso:string)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{timeZone:form.timeZone,
  dateStyle:'medium',timeStyle:'short'}).format(new Date(iso));
 return <section data-testid="panchanga-hub" className={styles.page}>
  <header className={styles.cleanHero}>
   <span className={styles.eyebrow}>GALAXIORA · {uk?'ВЕДИЧНИЙ КАЛЕНДАР':'VEDIC CALENDAR'}</span>
   <h1>{uk?'Панчанга':'Panchanga'}</h1>
  </header>
  <div className={styles.cleanObserver} data-testid="p386-observer">
   <label className={styles.cleanDate}>{uk?'Дата':'Date'}
    <input type="date" value={form.date} min="1900-01-01" max="2099-12-31"
     onChange={e=>setDate(e.target.value)}/></label>
   <div id="panchanga-place" className={styles.cleanCity}>
    <CitySearch locale={locale} selectedPlace={form.place} onChoose={c=>
     selectLocation({...form,timeZone:c.timeZone,latitude:String(c.latitude),
      longitude:String(c.longitude),
      place:[c.name,c.region,c.country].filter(Boolean).join(', ').slice(0,120)})}/>
   </div>
  </div>
  <nav className={styles.calendarTabs} aria-label={uk?'Період календаря':'Calendar period'}>
   {(['day','week','month'] as const).map(period=><button type="button" key={period}
    aria-current={view===period?'page':undefined} onClick={()=>{setView(period);}}>
    {period==='day'?(uk?'День':'Day'):period==='week'?(uk?'7 днів':'7 days'):(uk?'Місяць':'Month')}
   </button>)}
  </nav>
  {view==='month'&&<details className={styles.monthSettings}>
   <summary>{uk?'Налаштування місячного календаря':'Lunar calendar settings'}</summary>
   <fieldset className={styles.unifiedSystem} data-testid="panchanga-month-system">
    <legend>{uk?'Початок місячного місяця':'Lunar month convention'}</legend>
    {(['amanta','purnimanta'] as const).map(system=><button key={system} type="button"
     aria-pressed={monthSystem===system} onClick={()=>setMonthSystem(system)}>
     {system==='amanta'?(uk?'Аманта':'Amanta'):(uk?'Пурніманта':'Purnimanta')}</button>)}
   </fieldset>
   <p>{uk?'Перемикач змінює назву місячного місяця, а не положення планет чи п’ять показників.':
    'Changes lunar month names, not planets or the five Panchanga limbs.'}</p>
  </details>}
  {source==='checking'&&<p role="status" className={styles.empty}>
   {uk?'Завантажуємо збережене місто…':'Loading your saved city…'}</p>}
  {view==='day'&&requested&&loading&&<p role="status" className={styles.empty}>
   {uk?'Розраховуємо п’ять показників…':'Calculating the five limbs…'}</p>}
  {error&&view==='day'&&<div role="alert" className={styles.error}>
   {uk?'Не вдалося перевірити Панчангу для цього міста і дати.':'Could not verify Panchanga for this city/date.'}
  </div>}
  {view==='day'&&matches&&day&&requested&&<>
   <PanchangaDailyOpportunities key={'opportunities|'+requested.date+'|'+requested.timeZone+'|'+todayResetSerial}
    locale={locale} day={day as unknown as OpportunityDay} point={requested}
    onToday={resetToToday} onTomorrow={()=>setDate(new Date(Date.parse(requested.date+'T12:00:00Z')+86400000).toISOString().slice(0,10))}
    onWeek={()=>setView('week')}/>
  </>}
  {view!=='day'&&requested&&<PanchangaRangeView locale={locale} view={view}
   point={requested} monthSystem={monthSystem} onPick={pickDay}
   activity={activity} onActivityChange={setActivity} canPersonal={source!=='checking'&&source!=='guest'}/>}
  {view==='day'&&matches&&day&&<section className={styles.classicPanchanga}
   data-testid="p31-details" aria-label={uk?'Класична Панчанга':'Classical Panchanga'}>
   <header className={styles.classicHeading}>
    <h2>{uk?'Класична Панчанга':'Classical Panchanga'}</h2>
    <p>{uk?'П’ять показників, точні переходи та денні періоди для вибраного міста.':
     'Five limbs, exact transitions and daylight intervals for the selected city.'}</p>
   </header>
   <div className={styles.technicalContent}>
    <PanchangaLiveDay day={day} locale={locale}/>
    <section className={styles.timeline}>
     <h2>{uk?'Додаткові денні періоди':'Additional daylight intervals'}</h2>
     {(['rahuKalam','yamaganda','gulikaKalam'] as const).map(key=><div key={key}>
      <time>{fmt(day.daytimeKalas[key].fromUtc)} – {fmt(day.daytimeKalas[key].untilUtc)}</time>
      <strong><GlossaryText locale={locale} text={{rahuKalam:'Раху-калам',yamaganda:'Ямаганда',
       gulikaKalam:'Гуліка-калам'}[key]}/></strong>
     </div>)}
    </section>
    <section className={styles.method}>
     <h2>{uk?'Метод розрахунків':'Calculation method'}</h2>
     <p>{uk?'Swiss Ephemeris, сидеричні довготи за Лахірі; моменти переходів уточнено чисельно.':
      'Swiss Ephemeris, Lahiri sidereal longitude; boundaries are numerically refined.'}</p>
     <a href="https://www.astro.com/swisseph/swephprg.htm" rel="noopener noreferrer" target="_blank">
      Swiss Ephemeris ↗</a>
    </section>
   </div>
  </section>}
  {source!=='checking'&&source!=='guest'&&<details className={styles.observerSettings}>
   <summary>{uk?'Налаштування міста':'Location preferences'}</summary>
   <label><input type="checkbox" checked={autoSave}
    onChange={e=>setAutoSave(e.target.checked)}/>
    {uk?'Зберігати вибране місто в профілі':'Save chosen city to profile'}</label>
   {source==='saved'&&<button type="button" onClick={()=>void restoreNatalCity()}>
    {uk?'Повернути місто з натальної карти':'Restore natal-chart city'}</button>}
   {saveState==='saving'&&<span role="status">{uk?'Зберігаємо…':'Saving…'}</span>}
   {saveState==='error'&&<span role="alert">{uk?'Не вдалося зберегти місто':'Could not save city'}</span>}
  </details>}
 </section>;
}
