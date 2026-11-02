'use client';
import {useEffect,useRef,useState} from 'react';
import {reportGrowthEvent} from '../../lib/growth-metrics';
import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import styles from './PanchangaHub.module.css';
import CitySearch from './CitySearch';
import GlossaryText from './GlossaryText';
import PanchangaRangeView from './PanchangaRangeView';
import PanchangaLiveDay from './PanchangaLiveDay';
import PanchangaDayGuide from './PanchangaDayGuide';
import PanchangaRelatedPanels from './PanchangaRelatedPanels';
import {chooseInitialDay,type CalendarSystem} from '../../lib/panchanga-integration';
import type {LivePanchangaDay} from '../../lib/panchanga-live';

type AngaName={number:number;name:string};
type Day=LivePanchangaDay&{
 version:string;date:string;sunriseUtc:string;sunsetUtc:string;nextSunriseUtc:string;
 location:{timeZone:string;latitude:number;longitude:number};
 sunrise:{tithi:{number:number;paksha:string;numberWithinPaksha:number};nakshatra:AngaName&{pada:number};
 vara:AngaName;yoga:AngaName;karana:{slot:number;name:string};phase:string};
 boundaries:Record<'tithi'|'nakshatra'|'yoga'|'karana',{startUtc:string;endUtc:string}>;
 changes:{kind:'tithi'|'nakshatra'|'yoga'|'karana';atUtc:string;nextIndex:number}[];
 astronomicalEvents:{type:'sunrise'|'sunset'|'new_moon'|'full_moon';atUtc:string}[];
 daytimeKalas:{version:string;rahuKalam:{part:number;fromUtc:string;untilUtc:string};yamaganda:{part:number;fromUtc:string;untilUtc:string};gulikaKalam:{part:number;fromUtc:string;untilUtc:string}};
 astronomyProfile:string;sunriseMethod:string;
 methodology:{referenceFrame:string;boundaryResolutionSeconds:number;referenceCertification:string};
};
type Form={date:string;timeZone:string;latitude:string;longitude:string;place:string};
const presets:{
 [key:string]:{timeZone:string;latitude:string;longitude:string}
}={
 kyiv:{timeZone:'Europe/Kyiv',latitude:'50.4501',longitude:'30.5234'},
 delhi:{timeZone:'Asia/Kolkata',latitude:'28.6139',longitude:'77.209'},
 london:{timeZone:'Europe/London',latitude:'51.5074',longitude:'-0.1278'}
};
const labels={
 uk:{title:'Панчанга',intro:'Пʼять складових ведичного дня, визначених за положеннями Сонця й Місяця на місцевому сході Сонця. Переглянь реальні моменти переходів, а не приблизні прогнози на полудень.',
 subtitle:'Астрономічний календар',date:'Дата',city:'Місцевість',zone:'Часовий пояс (IANA)',lat:'Широта',lon:'Довгота',calculate:'Розрахувати день',busy:'Розраховуємо переходи…',
 unknown:'Немає обчислення',error:'Немає перевірених астрономічних даних для цих умов. Перевір часовий пояс, координати та Swiss Ephemeris, тоді повтори.',
 sunrise:'Схід Сонця',sunset:'Захід Сонця',next:'Наступний схід',titleFive:'Пʼять анг Панчанги',transitions:'Переходи протягом дня',kalas:'Традиційні денні періоди',rahuKalam:'Раху-калам',yamaganda:'Ямаганда',gulikaKalam:'Гуліка-калам',kalaNote:'Вісім рівних частин світлового дня, визначених за місцевим сходом і заходом Сонця. Це традиційні календарні інтервали, не готова персональна мухурта.',events:'Астрономічні події',new_moon:'Молодик',full_moon:'Повня',
 source:'Методика та джерело',started:'Початок',ends:'Закінчення',notProphecy:'Порівнюй календарні періоди, обирай практики та досліджуй ведичну традицію.',
 tithi:'Тітхі',nakshatra:'Накшатра',vara:'Вара',yoga:'Нітья-йога',karana:'Карана',
 shukla:'Шукла',krishna:'Крішна',pada:'пада',
 profile:'Ті самі Swiss Ephemeris / Lahiri / Delta-T, що й у перевірених натальних картах Galaxiora.',
 limits:'Моменти переходів знайдено чисельно з кроком уточнення до секунди. Методика й еталонні зіставлення наведені в технічній документації.',
 cities:{kyiv:'Київ',delhi:'Нью-Делі',london:'Лондон',custom:'Свої координати'}},
 en:{title:'Panchanga',intro:'The five limbs of the Vedic day, calculated from Sun and Moon positions at local sunrise. See real astronomical transition times rather than approximate noon forecasts.',
 subtitle:'Astronomical calendar',date:'Date',city:'Location',zone:'Time zone (IANA)',lat:'Latitude',lon:'Longitude',calculate:'Calculate day',busy:'Calculating transitions…',
 unknown:'No calculation yet',error:'Verified astronomical data are unavailable for this location. Check timezone, coordinates and Swiss Ephemeris, then retry.',
 sunrise:'Sunrise',sunset:'Sunset',next:'Next sunrise',titleFive:'Five Panchanga limbs',transitions:'Transitions during the day',kalas:'Traditional daytime periods',rahuKalam:'Rahu Kalam',yamaganda:'Yamaganda',gulikaKalam:'Gulika Kalam',kalaNote:'Eight equal daylight segments from the local sunrise and sunset. These traditional windows do not constitute a personalized muhurta verdict.',events:'Astronomical events',new_moon:'New Moon',full_moon:'Full Moon',
 source:'Method and source',started:'Started',ends:'Ends',notProphecy:'Explore lunar cycles, traditional observances, and mindful practices.',
 tithi:'Tithi',nakshatra:'Nakshatra',vara:'Vara',yoga:'Nitya Yoga',karana:'Karana',
 shukla:'Shukla',krishna:'Krishna',pada:'pada',profile:'Same Swiss Ephemeris / Lahiri / Delta-T framework as verified Galaxiora natal charts.',
 limits:'Transition instants are numerically isolated to one second. Technical methodology and validation scope are documented separately.',
 cities:{kyiv:'Kyiv',delhi:'New Delhi',london:'London',custom:'Custom coordinates'}}
} as const;
function currentDay(zone='Europe/Kyiv'){
 const parts=new Intl.DateTimeFormat('en',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const get=(k:string)=>parts.find(x=>x.type===k)?.value||'';
 return get('year')+'-'+get('month')+'-'+get('day');
}
export default function PanchangaHub({locale}:{locale:PortalLocale}){
 const t=labels[locale],uk=locale==='uk';
 const initialForm:Form={date:currentDay(),...presets.kyiv,place:uk?'Київ':'Kyiv'};
 const [form,setForm]=useState<Form>(initialForm);
 const [city,setCity]=useState('kyiv'),[requested,setRequested]=useState<Form|null>(null);
 const [result,setResult]=useState<Day|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(false);
 const pendingManualCalculation=useRef(false);
 const [view,setView]=useState<'day'|'week'|'month'>('day');
 const [monthSystem,setMonthSystem]=useState<CalendarSystem>('amanta');
 const [locationSource,setLocationSource]=useState<'checking'|'guest'|'none'|'natal'|'saved'>('checking');
 const [autoSave,setAutoSave]=useState(true);
 const [saveState,setSaveState]=useState<'idle'|'saving'|'saved'|'error'>('idle');
 const saveSequence=useRef(0);
 const saveQueue=useRef<Promise<unknown>>(Promise.resolve());
 useEffect(()=>{
  let live=true;const ctl=new AbortController();
  fetch('/api/v1/personal/panchanga/location',{credentials:'same-origin',cache:'no-store',signal:ctl.signal})
   .then(async r=>{if(r.status===401)return null;if(!r.ok)throw Error(String(r.status));
    return await r.json() as {source:'saved'|'natal'|'none';
     location:{place:string;timeZone:string;latitude:number;longitude:number}|null};})
   .then(data=>{
    if(!live)return;
    const loc=data?.location;
    const next:Form=loc?{date:initialForm.date,place:loc.place,timeZone:loc.timeZone,
     latitude:String(loc.latitude),longitude:String(loc.longitude)}:initialForm;
    next.date=chooseInitialDay(new URLSearchParams(window.location.search).get('date'),next.timeZone);
    setLocationSource(data?.source||'guest');
    if(loc)setCity('custom');
    setForm(next);setRequested(next);
   }).catch(()=>{
    if(!live)return;
    const next={...initialForm,date:chooseInitialDay(
     new URLSearchParams(window.location.search).get('date'),initialForm.timeZone)};
    setLocationSource('guest');setForm(next);setRequested(next);
   });
  return()=>{live=false;ctl.abort()};
 },[]);
 function saveCity(next:Form){
  if(!autoSave||locationSource==='guest'||locationSource==='checking')return;
  const version=++saveSequence.current;
  setSaveState('saving');
  const pending=saveQueue.current.catch(()=>{}).then(async()=>{
   // Skip obsolete queued locations; an already submitted request must finish
   // before its successor, so the final server preference is the latest city.
   if(version!==saveSequence.current)return;
   const r=await fetch('/api/v1/personal/panchanga/location',{method:'PUT',credentials:'same-origin',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({
     place:next.place,timeZone:next.timeZone,latitude:Number(next.latitude),longitude:Number(next.longitude)})});
   if(!r.ok)throw Error(String(r.status));
   if(version===saveSequence.current){setLocationSource('saved');setSaveState('saved');}
  });
  saveQueue.current=pending.catch(()=>{if(version===saveSequence.current)setSaveState('error')});
 }
 async function restoreNatalCity(){
  const version=++saveSequence.current;
  setSaveState('saving');
  try{
   await saveQueue.current.catch(()=>{});
   if(version!==saveSequence.current)return;
   const r=await fetch('/api/v1/personal/panchanga/location',{method:'DELETE',credentials:'same-origin'});
   if(!r.ok)throw Error(String(r.status));
   const data=await r.json() as {source:'saved'|'natal'|'none';
    location:{place:string;timeZone:string;latitude:number;longitude:number}|null};
   const next:Form=data.location?{...form,place:data.location.place,timeZone:data.location.timeZone,
    latitude:String(data.location.latitude),longitude:String(data.location.longitude)}
    :{...form,...presets.kyiv,place:uk?'Київ':'Kyiv'};
   if(version!==saveSequence.current)return;
   setForm(next);setRequested(next);setLocationSource(data.source);setSaveState('idle');
  }catch{if(version===saveSequence.current)setSaveState('error');}
 }
 function selectDay(date:string){const next={...form,date};setForm(next);setRequested(next);setView('day');}
 function selectLocation(next:Form){setForm(next);setRequested(next);void saveCity(next);}
 useEffect(()=>{
  if(!requested||view!=='day')return;
  let live=true;const controller=new AbortController();setLoading(true);setError(false);setResult(null);
  const q=new URLSearchParams({date:requested.date,zone:requested.timeZone,latitude:requested.latitude,longitude:requested.longitude});
  fetch('/api/v1/panchanga/day?'+q,{cache:'no-store',signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error(String(r.status));return await r.json() as Day;})
   .then(d=>{if(live){setResult(d);setError(false);if(pendingManualCalculation.current){pendingManualCalculation.current=false;reportGrowthEvent('panchanga_calculation_completed')}}})
   .catch(()=>{if(live){pendingManualCalculation.current=false;setResult(null);setError(true)}})
   .finally(()=>{if(live)setLoading(false)});
  return()=>{live=false;controller.abort()};
 },[requested,view]);
 const fmt=(iso:string)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{
  timeZone:result?.location.timeZone||form.timeZone,dateStyle:'medium',timeStyle:'short'
 }).format(new Date(iso));
 return <section className={styles.page} data-testid="panchanga-hub">
  <header className={styles.hero}>
   <div className={styles.eyebrow}>GALAXIORA · ASTRONOMY</div>
   <h1><GlossaryText text={t.title} locale={locale}/></h1><p><GlossaryText text={t.intro} locale={locale}/></p>
   <Link href={'/'+locale+'/horoscope'}>{uk?'До гороскопів':'Horoscopes'} ↗</Link>
  </header>
  <nav className={styles.calendarTabs} aria-label={uk?'Період календаря':'Calendar period'}>
   {(['day','week','month'] as const).map(period=><button key={period} type="button"
    aria-current={view===period?'page':undefined} onClick={()=>setView(period)}>
     {period==='day'?(uk?'День':'Day'):period==='week'?(uk?'7 днів':'7 days'):(uk?'Місяць':'Month')}
    </button>)}
  </nav>
  <fieldset className={styles.unifiedSystem} data-testid="panchanga-month-system">
   <legend>{uk?'Система ведичного місяця':'Vedic lunar-month system'}</legend>
   {(['amanta','purnimanta'] as const).map(system=><button type="button" key={system}
    aria-pressed={monthSystem===system} onClick={()=>setMonthSystem(system)}>
    {system==='amanta'?(uk?'Аманта':'Amanta'):(uk?'Пурніманта':'Purnimanta')}
   </button>)}
  </fieldset>
  <form className={styles.form} onSubmit={e=>{
   e.preventDefault();pendingManualCalculation.current=view==='day'; 
   const changed=!requested||['timeZone','latitude','longitude','place'].some(key=>
    form[key as keyof Form]!==requested[key as keyof Form]);
   setRequested({...form});
   if(changed)saveCity(form);
  }}>
   <div className={styles.formGrid}>
    <label>{t.date}<input required type="date" min="1900-01-01" max="2099-12-31" value={form.date} onChange={e=>{const next={...form,date:e.target.value};setForm(next);
     if(/^\\d{4}-\\d{2}-\\d{2}$/.test(next.date))setRequested(next);}}/></label>
    <CitySearch locale={locale} onChoose={c=>{
     setCity('custom');
     selectLocation({...form,timeZone:c.timeZone,latitude:String(c.latitude),longitude:String(c.longitude),
      place:[c.name,c.region,c.country].filter(Boolean).join(', ').slice(0,120)});
    }}/>
    <label>{t.city}<select value={city} onChange={e=>{
     const next=e.target.value;setCity(next);
     if(next!=='custom')selectLocation({...form,...presets[next],place:t.cities[next as 'kyiv'|'delhi'|'london']});
    }}>{Object.entries(t.cities).map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label>
   </div>
   <p className={styles.locationStatus}>{uk?'Місто':'Location'}: <strong>{form.place}</strong> · {form.timeZone}
    {locationSource==='natal'&&(uk?' · із натальної карти':' · from natal chart')}
    {locationSource==='saved'&&(uk?' · збережено в профілі':' · saved in profile')}</p>
   <details className={styles.advanced}><summary>{uk?'Точні координати та часовий пояс':'Advanced settings'}</summary>
    <div className={styles.formGrid}>
    <label>{t.zone}<input required value={form.timeZone} onChange={e=>{setCity('custom');setForm(f=>({...f,timeZone:e.target.value}))}}/></label>
    <label>{t.lat}<input required type="number" step="any" min="-89.999" max="89.999" value={form.latitude} onChange={e=>{setCity('custom');setForm(f=>({...f,latitude:e.target.value}))}}/></label>
    <label>{t.lon}<input required type="number" step="any" min="-180" max="180" value={form.longitude} onChange={e=>{setCity('custom');setForm(f=>({...f,longitude:e.target.value}))}}/></label>
    </div>
   </details>
   <div className={styles.formActions}>
    <button type="submit" disabled={loading}>{loading?t.busy:t.calculate}</button>
    {!['guest','checking'].includes(locationSource)&&<label className={styles.saveCheck}>
     <input type="checkbox" checked={autoSave} onChange={e=>setAutoSave(e.target.checked)}/>
     {uk?'Зберігати місто в профілі':'Save this city to my profile'}</label>}
    {locationSource==='saved'&&<button type="button" className={styles.secondaryButton}
     onClick={()=>void restoreNatalCity()}>{uk?'Повернути місто натальної карти':'Restore natal-chart city'}</button>}
   </div>
   {saveState==='saving'&&<p role="status">{uk?'Зберігаємо місто…':'Saving city…'}</p>}
   {saveState==='saved'&&<p role="status">{uk?'Місто збережено.':'City saved.'}</p>}
   {saveState==='error'&&<p role="alert">{uk?'Помилка збереження міста.':'Could not save city.'}</p>}
  </form>
  {error&&<div role="alert" className={styles.error}>{t.error}</div>}
  {locationSource==='checking'&&<p role="status" className={styles.locationStatus}>
   {uk?'Перевіряємо вашу локацію перед розрахунком…':'Checking your location before calculating…'}</p>}
  {view!=='day'&&requested&&<PanchangaRangeView locale={locale} view={view} point={requested}
   monthSystem={monthSystem} onPick={selectDay}/>}
  {view==='day'&&requested&&loading&&<p role="status" className={styles.empty}>{t.busy}</p>}
  {view==='day'&&requested&&!result&&!loading&&!error&&<div className={styles.empty}>{t.unknown}</div>}
  {view==='day'&&result&&<div className={styles.results}>
   <PanchangaLiveDay day={result} locale={locale}/>
   <section className={styles.sun}><h2>{t.subtitle} · {result.date}</h2>
    <div className={styles.sunGrid}>
     <div><small>{t.sunrise}</small><strong>{fmt(result.sunriseUtc)}</strong></div>
     <div><small>{t.sunset}</small><strong>{fmt(result.sunsetUtc)}</strong></div>
     <div><small>{t.next}</small><strong>{fmt(result.nextSunriseUtc)}</strong></div>
    </div>
   </section>
   {requested&&<PanchangaDayGuide locale={locale} point={requested} day={result} monthSystem={monthSystem}/>}
   <section className={styles.timeline}><h2>{t.kalas}</h2>
    {(['rahuKalam','yamaganda','gulikaKalam'] as const).map(key=><div key={key}>
     <time dateTime={result.daytimeKalas[key].fromUtc}>{fmt(result.daytimeKalas[key].fromUtc)} — {fmt(result.daytimeKalas[key].untilUtc)}</time>
     <strong><GlossaryText text={t[key]} locale={locale}/></strong>
     <span>#{result.daytimeKalas[key].part}/8</span>
    </div>)}
    <p><GlossaryText text={t.kalaNote} locale={locale}/></p>
   </section>

   <aside className={styles.method}><h2>{t.source}</h2>
    <p><GlossaryText text={t.profile} locale={locale}/></p><p><GlossaryText text={result.sunriseMethod} locale={locale}/></p><p><GlossaryText text={t.limits} locale={locale}/></p>
    <p>{t.notProphecy}</p>
    <a href="https://www.astro.com/swisseph/swephprg.htm" target="_blank" rel="noopener noreferrer">Swiss Ephemeris · Programming Documentation ↗</a>
   </aside>
  </div>}
  {view==='day'&&result&&requested&&<PanchangaRelatedPanels locale={locale} point={requested}/>}
 </section>;
}
