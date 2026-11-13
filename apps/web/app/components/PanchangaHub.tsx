'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,CalendarDays,ChevronLeft,ChevronRight,MapPin,Orbit} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import {chooseInitialDay} from '../../lib/panchanga-integration';
import type {LivePanchangaDay} from '../../lib/panchanga-live';
import type {P38ActivityId} from '../../lib/panchanga-p38-decision';
import type {OpportunityDay} from '../../lib/panchanga-opportunities';
import {activityPlan,dayObservances,dayTier,haircutFriendly,hourPlan,isNewStartFriendly,TODAY_ACTIVITIES,
 type ActivityPlan,type DayTier,type HourPeriod,type SunriseAngas} from '../../lib/panchanga-today';
import CitySearch from './CitySearch';
import PanchangaRangeView from './PanchangaRangeView';
import PanchangaLiveDay from './PanchangaLiveDay';
import GlossaryText from './GlossaryText';
import {ActivityCards,addDays,clock,dayLabel,HoursOfDay,MonthCalendar,observanceShort,Upcoming,Verdict,
 type MonthCell,type UpcomingDay} from './PanchangaTodayParts';
import styles from './PanchangaToday.module.css';
import {reportGrowthEvent,reportPublicToolEvent} from '../../lib/growth-metrics';

type Form={date:string;timeZone:string;latitude:string;longitude:string;place:string};
type Day=LivePanchangaDay&{
 version:string;date:string;sunriseUtc:string;sunsetUtc:string;nextSunriseUtc:string;
 location:{timeZone:string;latitude:number;longitude:number};
 sunrise:LivePanchangaDay['sunrise']&{elongationDegrees?:number};
 daytimeKalas:{rahuKalam:{part:number;fromUtc:string;untilUtc:string};
 yamaganda:{part:number;fromUtc:string;untilUtc:string};
 gulikaKalam:{part:number;fromUtc:string;untilUtc:string}};
 sunriseMethod:string;
};
type OverviewDay=UpcomingDay&{sunriseUtc:string;sunsetUtc:string;nextSunriseUtc:string;
 sunriseAngas:SunriseAngas;moonMonth:{name:string|null;lunarMonthStatus:string};
 windows?:{daytimeKalas?:{rahuKalam?:{fromUtc:string;untilUtc:string}}}};
type Overview={days:OverviewDay[];phaseEvents:{kind:MonthCell['phase'];atUtc:string;localDate:string}[];
 observer:{timeZone:string;latitude:number;longitude:number}};

const CITY={uk:{place:'Київ',latitude:'50.4501',longitude:'30.5234',timeZone:'Europe/Kyiv'},
 en:{place:'New Delhi',latitude:'28.6139',longitude:'77.2090',timeZone:'Asia/Kolkata'}} as const;
const MONTHS:Record<string,[string,string]>={
 Chaitra:['Чайтра','Chaitra'],Vaishakha:['Вайшакха','Vaishakha'],Jyeshtha:['Джʼєштха','Jyeshtha'],
 Ashadha:['Ашадха','Ashadha'],Shravana:['Шравана','Shravana'],Bhadrapada:['Бхадрапада','Bhadrapada'],
 Ashwina:['Ашвіна','Ashwina'],Kartika:['Картіка','Kartika'],Margashirsha:['Маргашірша','Margashirsha'],
 Pausha:['Пауша','Pausha'],Magha:['Магха','Magha'],Phalguna:['Пхалгуна','Phalguna']};
const localeDate=(zone:string)=>{
 const p=new Intl.DateTimeFormat('en',{timeZone:zone,year:'numeric',month:'2-digit',
  day:'2-digit'}).formatToParts(new Date());
 const get=(k:string)=>p.find(x=>x.type===k)?.value||'';
 return get('year')+'-'+get('month')+'-'+get('day');
};
const sameObserver=(a:{timeZone:string;latitude:number;longitude:number}|undefined,f:Form)=>Boolean(a&&
 a.timeZone===f.timeZone&&Math.abs(a.latitude-Number(f.latitude))<1e-5&&Math.abs(a.longitude-Number(f.longitude))<1e-5);
const monthLength=(month:string)=>new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate();
const shiftMonth=(month:string,delta:number)=>{
 const d=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7))-1+delta,1));
 return d.toISOString().slice(0,7);
};
async function getJson<T>(url:string,signal:AbortSignal){
 const r=await fetch(url,{cache:'no-store',signal});
 if(!r.ok)throw Error('HTTP '+r.status);
 return await r.json() as T;
}
const dayUrl=(f:Form,date:string)=>'/api/v1/panchanga/day?'+new URLSearchParams({date,zone:f.timeZone,latitude:f.latitude,longitude:f.longitude});
const overviewUrl=(f:Form,start:string,days:number)=>'/api/v1/vedic-calendar/overview?'+new URLSearchParams({start,days:String(days),
 zone:f.timeZone,latitude:f.latitude,longitude:f.longitude,monthSystem:'amanta'});
function safe<T>(fn:()=>T,fallback:T){try{return fn()}catch{return fallback}}

export default function PanchangaHub({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const defaultCity=CITY[locale];
 const [form,setForm]=useState<Form>({date:localeDate(defaultCity.timeZone),...defaultCity});
 const [requested,setRequested]=useState<Form|null>(null);
 const [day,setDay]=useState<Day|null>(null),[nextDay,setNextDay]=useState<Day|null>(null);
 const [loading,setLoading]=useState(false),[error,setError]=useState(false);
 const [upcoming,setUpcoming]=useState<Overview|null>(null);
 const [month,setMonth]=useState<string>(form.date.slice(0,7));
 const [monthData,setMonthData]=useState<Overview|null>(null);
 const [now,setNow]=useState<number|null>(null);
 const [personalOpen,setPersonalOpen]=useState(false);
 const [activity,setActivity]=useState<P38ActivityId>('job_start');
 const [source,setSource]=useState<'checking'|'guest'|'none'|'natal'|'saved'>('checking');
 const [autoSave,setAutoSave]=useState(true);
 const [saveState,setSaveState]=useState<'idle'|'saving'|'saved'|'error'>('idle');
 const saveSequence=useRef(0),saveQueue=useRef<Promise<unknown>>(Promise.resolve());
 // The initial automatic city/day fetch is not a user-initiated completion.
 const manualDayRequest=useRef(false);
 useEffect(()=>{setNow(Date.now());const t=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(t);},[]);
 useEffect(()=>{
  const qs=new URLSearchParams(window.location.search);
  let live=true;const ctl=new AbortController();
  // A link from a city landing page preselects that allowlisted city; it is never saved to the profile.
  const slug=qs.get('city');
  const preset=slug&&/^[a-z][a-z-]{1,39}$/.test(slug)
   ?import('../../lib/panchanga-cities').then(m=>m.panchangaCityBySlug(slug)).catch(()=>null):Promise.resolve(null);
  const profileRequest=fetch('/api/v1/personal/panchanga/location',{credentials:'same-origin',cache:'no-store',signal:ctl.signal})
   .then(async r=>r.status===401?null:r.ok?await r.json() as {
    source:'saved'|'natal'|'none';location:{place:string;timeZone:string;latitude:number;longitude:number}|null
   }:Promise.reject(Error('location unavailable')))
   .catch(()=>null);
  Promise.all([profileRequest,preset]).then(([profile,city])=>{
    if(!live)return;
    const p=profile?.location;
    const base=city?{place:city.name[locale],timeZone:city.timeZone,
     latitude:String(city.latitude),longitude:String(city.longitude)}
     :p?{place:p.place||'—',timeZone:p.timeZone,
     latitude:String(p.latitude),longitude:String(p.longitude)}:defaultCity;
    const selected={...base,date:chooseInitialDay(qs.get('date'),base.timeZone)};
    setSource(profile?.source||'guest');setForm(selected);setRequested(selected);setMonth(selected.date.slice(0,7));
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
  manualDayRequest.current=true;
  setForm(next);setRequested(next);
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
   manualDayRequest.current=true;
   setForm(next);setRequested(next);setSource(profile.source);setSaveState('idle');
  }catch{if(version===saveSequence.current)setSaveState('error')}
 }
 function setDate(date:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
  manualDayRequest.current=true;
  const next={...form,date};setForm(next);setRequested(next);setMonth(date.slice(0,7));
 }
 function resetToToday(){
  // Use the selected event-city IANA time zone, never browser-local midnight.
  setDate(localeDate(form.timeZone));
 }
 // Selected day and the following day: exact Swiss limbs and kalas.
 useEffect(()=>{
  if(!requested)return;
  const explicit=manualDayRequest.current;
  manualDayRequest.current=false;
  if(explicit)reportPublicToolEvent('public_tool_started','panchanga');
  let live=true;const ctl=new AbortController();setLoading(true);setError(false);setDay(null);setNextDay(null);
  const tomorrow=addDays(requested.date,1);
  getJson<Day>(dayUrl(requested,requested.date),ctl.signal)
   .then(result=>{
    if(live&&result?.date===requested.date&&sameObserver(result.location,requested)){
      setDay(result);
      // Legacy event counts all successful loads, including the default day.
       reportGrowthEvent('panchanga_calculation_completed');
       // Qualified user-action completion must NOT include automatic prefetch.
       if(explicit)reportPublicToolEvent('public_tool_completed','panchanga');
    }else if(live)throw Error('Mismatched observer');
   })
   .catch(()=>{if(live&&!ctl.signal.aborted){setError(true);if(explicit)reportPublicToolEvent('public_tool_failed','panchanga');}})
   .finally(()=>{if(live)setLoading(false)});
  getJson<Day>(dayUrl(requested,tomorrow),ctl.signal)
   .then(result=>{if(live&&result?.date===tomorrow&&sameObserver(result.location,requested))setNextDay(result);})
   .catch(()=>{});
  return()=>{live=false;ctl.abort()};
 },[requested]);
 // Next 31 days: festivals, the next good haircut day and the lunar month name.
 useEffect(()=>{
  if(!requested)return;
  let live=true;const ctl=new AbortController();setUpcoming(null);
  getJson<Overview>(overviewUrl(requested,requested.date,31),ctl.signal)
   .then(o=>{if(live&&sameObserver(o.observer,requested)&&o.days?.[0]?.date===requested.date)setUpcoming(o);})
   .catch(()=>{});
  return()=>{live=false;ctl.abort()};
 },[requested]);
 // The displayed calendar month.
 useEffect(()=>{
  if(!requested)return;
  let live=true;const ctl=new AbortController();setMonthData(null);
  const start=month+'-01';
  if(start>='1900-01-01'&&start<='2099-11-01')getJson<Overview>(overviewUrl(requested,start,monthLength(month)),ctl.signal)
   .then(o=>{if(live&&sameObserver(o.observer,requested)&&o.days?.[0]?.date===start)setMonthData(o);})
   .catch(()=>{});
  return()=>{live=false;ctl.abort()};
 },[requested?.timeZone,requested?.latitude,requested?.longitude,month]);

 const zone=requested?.timeZone??form.timeZone;
 const today=now===null?null:localeDate(zone);
 const isToday=Boolean(day&&today===day.date);
 const plan=useMemo(()=>day?safe(()=>hourPlan(day as unknown as OpportunityDay),null):null,[day]);
 const nextPlan=useMemo(()=>nextDay?safe(()=>hourPlan(nextDay as unknown as OpportunityDay),null):null,[nextDay]);
 const from=isToday&&now!==null?now:plan?.[0]?.startMs??0;
 const nowBucket=isToday&&now!==null?Math.floor(now/300000):0;
 const activities=useMemo<ActivityPlan[]|null>(()=>day&&plan?safe(()=>TODAY_ACTIVITIES.map(a=>
  activityPlan(day as unknown as OpportunityDay,plan,a.id,from)),null):null,[day,plan,nowBucket]);
 const nextActivities=useMemo<ActivityPlan[]|null>(()=>nextDay&&nextPlan?safe(()=>TODAY_ACTIVITIES.map(a=>
  activityPlan(nextDay as unknown as OpportunityDay,nextPlan,a.id,nextPlan[0].startMs)),null):null,[nextDay,nextPlan]);
 const tier=useMemo<DayTier|null>(()=>day?safe(()=>dayTier({date:day.date,timeZone:day.location.timeZone,
  sunriseUtc:day.sunriseUtc,sunsetUtc:day.sunsetUtc,nextSunriseUtc:day.nextSunriseUtc,sunrise:day.sunrise as SunriseAngas,
  rahuKalam:day.daytimeKalas.rahuKalam}),null):null,[day]);
 const monthCells=useMemo<MonthCell[]|null>(()=>monthData?monthData.days.map(d=>({date:d.date,
  tier:safe(()=>dayTier({date:d.date,timeZone:monthData.observer.timeZone,sunriseUtc:d.sunriseUtc,sunsetUtc:d.sunsetUtc,
   nextSunriseUtc:d.nextSunriseUtc,sunrise:d.sunriseAngas,rahuKalam:d.windows?.daytimeKalas?.rahuKalam}),null),
  tag:(()=>{const o=dayObservances(d.observances)[0];return o?observanceShort(o.kind,locale):null;})(),
  phase:monthData.phaseEvents.find(p=>p.localDate===d.date&&(p.kind==='new_moon'||p.kind==='full_moon'))?.kind??null
 })):null,[monthData,locale]);
 const nextHaircut=useMemo(()=>{
  const d=upcoming?.days.find(x=>x.date>(day?.date??'')&&safe(()=>haircutFriendly(x.sunriseAngas),false));
  return d?dayLabel(d.date,locale):null;
 },[upcoming,day,locale]);
 const lunarMonth=(()=>{
  const name=upcoming?.days[0]?.moonMonth?.name;
  return name&&MONTHS[name]?MONTHS[name][uk?0:1]:null;
 })();
 const spiritWindow=useMemo(()=>{
  const pickRun=(p:HourPeriod[]|null,start:number)=>p?.find(x=>x.endMs>start&&isNewStartFriendly(x.q)&&
   (x.why==='any'||x.why==='people'||x.q==='best'))??null;
  const a=plan?pickRun(plan,from):null;
  if(a)return {when:isToday?(uk?'сьогодні':'today'):'',from:Math.max(a.startMs,from),until:a.endMs};
  const b=nextPlan?pickRun(nextPlan,nextPlan[0].startMs):null;
  return b?{when:isToday?(uk?'завтра':'tomorrow'):(uk?'наступного дня':'next day'),from:b.startMs,until:b.endMs}:null;
 },[plan,nextPlan,from,isToday,uk]);
 const tithiEnd=day?(()=>{
  const sr=Date.parse(day.sunriseUtc),nx=Date.parse(day.nextSunriseUtc);
  const p=day.periods.tithi.find(x=>Date.parse(x.startUtc)<=sr&&Date.parse(x.endUtc)>sr);
  const end=p?Date.parse(p.endUtc):NaN;
  return Number.isFinite(end)&&end<nx?end:null;
 })():null;
 const prev=addDays(form.date,-1),next=addDays(form.date,1);
 const signedIn=source==='natal'||source==='saved';
 const account=signedIn||source==='none';

 return <section data-testid="panchanga-hub" className={styles.page}>
  <header className={styles.head}>
   <div>
    <span className={styles.eyebrow}>{uk?'ВЕДИЧНИЙ КАЛЕНДАР ДНЯ':'VEDIC CALENDAR OF THE DAY'}</span>
    <h1>{uk?'Панчанга на сьогодні':'Panchang today'}</h1>
   </div>
   <Link className={styles.eclipseShortcut} href={'/'+locale+'/eclipses/2027'}>
    {uk?'Календар затемнень 2027':'2027 eclipse calendar'} <ArrowUpRight size={14} aria-hidden="true"/>
   </Link>
  </header>
  <div className={styles.observer} data-testid="p386-observer">
   <div id="panchanga-place" className={styles.city}>
    <MapPin size={18} aria-hidden="true"/>
    <CitySearch locale={locale} selectedPlace={form.place} onChoose={c=>
     selectLocation({...form,timeZone:c.timeZone,latitude:String(c.latitude),
      longitude:String(c.longitude),
      place:[c.name,c.region,c.country].filter(Boolean).join(', ').slice(0,120)})}/>
    {source==='saved'&&<button type="button" className={styles.chip} onClick={()=>void restoreNatalCity()}>
     <Orbit size={15} aria-hidden="true"/>{uk?'Місто з моєї карти':'City from my chart'}</button>}
    {source==='natal'&&<span className={styles.cityNote}><Orbit size={14} aria-hidden="true"/>{uk?'Місто з вашої натальної карти':'City from your birth chart'}</span>}
   </div>
   <div className={styles.dateBar}>
    <button type="button" className={styles.chip} onClick={()=>setDate(prev)} aria-label={uk?'Попередній день':'Previous day'}>
     <ChevronLeft size={16} aria-hidden="true"/>{dayLabel(prev,locale,'short')}</button>
    <strong>{dayLabel(form.date,locale)}</strong>
    <button type="button" className={styles.chip} onClick={()=>setDate(next)} aria-label={uk?'Наступний день':'Next day'}>
     {dayLabel(next,locale,'short')}<ChevronRight size={16} aria-hidden="true"/></button>
    <label className={styles.chip}><CalendarDays size={15} aria-hidden="true"/><span>{uk?'Обрати дату':'Pick a date'}</span>
     <input type="date" value={form.date} min="1900-01-01" max="2099-11-30" aria-label={uk?'Дата':'Date'}
     onClick={e=>{try{e.currentTarget.showPicker?.()}catch{}}} onChange={e=>setDate(e.target.value)}/></label>
    {today&&form.date!==today&&<button type="button" className={styles.chip} onClick={resetToToday}>{uk?'Сьогодні':'Today'}</button>}
   </div>
  </div>
  {(source==='checking'||(loading&&!day))&&<p role="status" className={styles.muted}>
   {source==='checking'?(uk?'Визначаємо місто…':'Finding your city…'):(uk?'Рахуємо день для вашого міста…':'Calculating the day for your city…')}</p>}
  {error&&<div role="alert" className={styles.error}>
   {uk?'Не вдалося розрахувати Панчангу для цього міста і дати.':'Could not calculate Panchanga for this city and date.'}
  </div>}
  {day&&plan&&<>
   <Verdict locale={locale} zone={zone} plan={plan} nextPlan={nextPlan} now={isToday?now:null} tier={tier}
    elongation={day.sunrise.elongationDegrees??0} sunriseMs={Date.parse(day.sunriseUtc)} sunsetMs={Date.parse(day.sunsetUtc)}
    tithi={day.sunrise.tithi.number} tithiEndMs={tithiEnd} lunarMonth={lunarMonth}/>
   <div className={styles.personal} data-testid="p410-personal">
    <p><Orbit size={18} aria-hidden="true"/>{signedIn
     ?(uk?'Покажемо, як дні місяця діють саме на вас — за вашою натальною картою.':'See how the days of the month work for you, from your birth chart.')
     :(uk?'Маєте натальну карту? Покажемо, як дні діють саме на вас.':'Have a birth chart? See how each day works for you personally.')}</p>
    {signedIn?<button type="button" className={styles.chipGold} aria-expanded={personalOpen} onClick={()=>setPersonalOpen(x=>!x)}>
     {personalOpen?(uk?'Сховати мій календар':'Hide my calendar'):(uk?'Показати мій календар':'Show my calendar')}</button>
     :<Link className={styles.chipGold} href={'/'+locale+'/astrology/jyotish'}>{uk?'Побудувати карту':'Create my chart'}</Link>}
   </div>
   {signedIn&&personalOpen&&requested&&<div className={styles.card}>
    <PanchangaRangeView locale={locale} view="month" point={requested} monthSystem="amanta"
     onPick={date=>{setDate(date);setPersonalOpen(false);}} activity={activity} onActivityChange={setActivity} canPersonal/>
   </div>}
   <HoursOfDay locale={locale} zone={zone} now={now}
    days={[{date:day.date,plan,isToday},...(nextDay&&nextPlan?[{date:nextDay.date,plan:nextPlan,isToday:false}]:[])]}/>
   {activities&&<ActivityCards locale={locale} zone={zone} plans={activities} nextPlans={nextActivities} isToday={isToday}
    nextHaircut={nextHaircut} spiritWindow={spiritWindow}/>}
  </>}
  {requested&&<div className={styles.cols}>
   <MonthCalendar locale={locale} month={month} cells={monthCells} selected={form.date} today={today}
    onPick={setDate} onMonth={delta=>setMonth(m=>shiftMonth(m,delta))}/>
   <Upcoming locale={locale} from={requested.date} today={today} days={upcoming?.days??null}/>
  </div>}
  {day&&<details className={styles.details} data-testid="p31-details">
   <summary>{uk?'Повна Панчанга дня: пʼять показників, точні переходи, Раху-кала':'Full Panchanga: five limbs, exact transitions, Rahu Kalam'}</summary>
   <div className={styles.detailsBody}>
    <h2>{uk?'Класична Панчанга':'Classical Panchanga'}</h2>
    <PanchangaLiveDay day={day} locale={locale}/>
    <section className={styles.kalas}>
     <h3>{uk?'Денні періоди':'Daytime periods'}</h3>
     {(['rahuKalam','yamaganda','gulikaKalam'] as const).map(key=><p key={key}>
      <strong><GlossaryText locale={locale} text={uk?{rahuKalam:'Раху-калам',yamaganda:'Ямаганда',gulikaKalam:'Гуліка-калам'}[key]
       :{rahuKalam:'Rahu Kalam',yamaganda:'Yamaganda',gulikaKalam:'Gulika Kalam'}[key]}/></strong>
      <time>{clock(Date.parse(day.daytimeKalas[key].fromUtc),zone)}–{clock(Date.parse(day.daytimeKalas[key].untilUtc),zone)}</time>
     </p>)}
     {lunarMonth&&<p><strong>{uk?'Місяць за ведичним календарем':'Vedic lunar month'}</strong>
      <span>{lunarMonth} · {uk?'рахунок від молодика до молодика (аманта)':'counted new moon to new moon (amanta)'}</span></p>}
    </section>
    <p className={styles.small}>{uk?'Розрахунок: Swiss Ephemeris, сидеричні довготи за Лахірі, місцевий схід Сонця; моменти переходів уточнено чисельно.':
     'Calculation: Swiss Ephemeris, Lahiri sidereal longitudes, local sunrise; transition moments are numerically refined.'}</p>
   </div>
  </details>}
  {account&&<details className={styles.settings}>
   <summary>{uk?'Налаштування міста':'Location preferences'}</summary>
   <label><input type="checkbox" checked={autoSave}
    onChange={e=>setAutoSave(e.target.checked)}/>
    {uk?'Зберігати вибране місто в профілі':'Save chosen city to profile'}</label>
   {saveState==='saving'&&<span role="status">{uk?'Зберігаємо…':'Saving…'}</span>}
   {saveState==='error'&&<span role="alert">{uk?'Не вдалося зберегти місто':'Could not save city'}</span>}
  </details>}
 </section>;
}
