'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import styles from './PanchangaHub.module.css';
import AstronomicalEventsPanel from './AstronomicalEventsPanel';
import PersonalPanchanga from './PersonalPanchanga';
import EclipsePanel from './EclipsePanel';
import VedicFestivalPanel from './VedicFestivalPanel';
import CitySearch from './CitySearch';
import GlossaryText from './GlossaryText';

type AngaName={number:number;name:string};
type Day={
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
type Form={date:string;timeZone:string;latitude:string;longitude:string};
const presets:{
 [key:string]:{timeZone:string;latitude:string;longitude:string}
}={
 kyiv:{timeZone:'Europe/Kyiv',latitude:'50.4501',longitude:'30.5234'},
 delhi:{timeZone:'Asia/Kolkata',latitude:'28.6139',longitude:'77.209'},
 london:{timeZone:'Europe/London',latitude:'51.5074',longitude:'-0.1278'}
};
const limbKeys=['tithi','nakshatra','vara','yoga','karana'] as const;
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
const VARA_UK:Record<string,string>={
 Ravivara:'Неділя (Сонце)',Somavara:'Понеділок (Місяць)',Mangalavara:'Вівторок (Марс)',
 Budhavara:'Середа (Меркурій)',Guruvara:'Четвер (Юпітер)',Shukravara:'Пʼятниця (Венера)',Shanivara:'Субота (Сатурн)'};
const YOGA_UK=['Вішкумбха','Пріті','Аюшман','Саубхагʼя','Шобхана','Атіганда','Сукарма','Дхріті','Шула','Ганда','Вріддхі','Дхрува','Вʼягхата','Харшана','Ваджра','Сіддхі','Вʼятіпата','Варіяна','Парігха','Шіва','Сіддха','Садхʼя','Шубха','Шукла','Брахма','Індра','Вайдхріті'];
const KARANA_UK:Record<string,string>={Kimstughna:'Кімстугхна',Bava:'Бава',Balava:'Балава',Kaulava:'Каулава',Taitila:'Тайтіла',Garaja:'Гараджа',Vanija:'Ваніджа',Vishti:'Вішті',Shakuni:'Шакуні',Chatushpada:'Чатушпада',Naga:'Нага'};
const NAK_UK=['Ашвіні','Бхарані','Кріттіка','Рохіні','Мрігашіра','Ардра','Пунарвасу','Пушʼя','Ашлеша','Магха','Пурва Пхалгуні','Уттара Пхалгуні','Хаста','Чітра','Сваті','Вішакха','Анурадха','Джʼєштха','Мула','Пурва Ашадха','Уттара Ашадха','Шравана','Дханіштха','Шатабхіша','Пурва Бхадрапада','Уттара Бхадрапада','Реваті'];
function currentDay(){
 const parts=new Intl.DateTimeFormat('en',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const get=(k:string)=>parts.find(x=>x.type===k)?.value||'';
 return get('year')+'-'+get('month')+'-'+get('day');
}
export default function PanchangaHub({locale}:{locale:PortalLocale}){
 const t=labels[locale],uk=locale==='uk';
 const initialForm={date:currentDay(),...presets.kyiv};
 const [form,setForm]=useState<Form>(initialForm);
 const [city,setCity]=useState('kyiv'),[requested,setRequested]=useState<Form|null>(initialForm);
 const [result,setResult]=useState<Day|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(false);
 // First-party GalaxiNews stories deep-link to their authentic event day.
 useEffect(()=>{
  const day=new URLSearchParams(window.location.search).get('date');
  if(!day||!/^\\d{4}-\\d{2}-\\d{2}$/.test(day)||
   new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day||
   day<'1900-01-01'||day>'2099-12-31')return;
  setForm(f=>({...f,date:day}));
  setRequested(f=>({...initialForm,...(f||{}),date:day}));
 },[]);
 useEffect(()=>{
  if(!requested)return;
  let live=true;const controller=new AbortController();setLoading(true);setError(false);
  const q=new URLSearchParams({date:requested.date,zone:requested.timeZone,latitude:requested.latitude,longitude:requested.longitude});
  fetch('/api/v1/panchanga/day?'+q,{cache:'no-store',signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error(String(r.status));return await r.json() as Day;})
   .then(d=>{if(live){setResult(d);setError(false)}})
   .catch(()=>{if(live){setResult(null);setError(true)}})
   .finally(()=>{if(live)setLoading(false)});
  return()=>{live=false;controller.abort()};
 },[requested]);
 const fmt=(iso:string)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{
  timeZone:result?.location.timeZone||form.timeZone,dateStyle:'medium',timeStyle:'short'
 }).format(new Date(iso));
 const angaText=(key:typeof limbKeys[number]):string=>{
  if(!result)return '';
  const a=result.sunrise;
  if(key==='tithi')return (uk?t[a.tithi.paksha.toLowerCase() as 'shukla'|'krishna']:a.tithi.paksha)+' '+a.tithi.numberWithinPaksha+' / 15';
  if(key==='nakshatra')return (uk?NAK_UK[a.nakshatra.number-1]:a.nakshatra.name)+' · '+t.pada+' '+a.nakshatra.pada;
  if(key==='vara')return uk?VARA_UK[a.vara.name]||a.vara.name:a.vara.name;
  if(key==='yoga')return uk?YOGA_UK[a.yoga.number-1]:a.yoga.name;
  return uk?KARANA_UK[a.karana.name]||a.karana.name:a.karana.name;
 };
 return <section className={styles.page} data-testid="panchanga-hub">
  <header className={styles.hero}>
   <div className={styles.eyebrow}>GALAXIORA · ASTRONOMY</div>
   <h1><GlossaryText text={t.title} locale={locale}/></h1><p><GlossaryText text={t.intro} locale={locale}/></p>
   <Link href={'/'+locale+'/horoscope'}>{uk?'До гороскопів':'Horoscopes'} ↗</Link>
  </header>
  <form className={styles.form} onSubmit={e=>{e.preventDefault();setRequested({...form});}}>
   <div className={styles.formGrid}>
    <label>{t.date}<input required type="date" min="1900-01-01" max="2099-12-31" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></label>
    <CitySearch locale={locale} onChoose={c=>{
     setCity('custom');
     setForm(f=>({...f,timeZone:c.timeZone,latitude:String(c.latitude),longitude:String(c.longitude)}));
    }}/>
    <label>{t.city}<select value={city} onChange={e=>{
     const next=e.target.value;setCity(next);
     if(next!=='custom')setForm(f=>({...f,...presets[next]}));
    }}>{Object.entries(t.cities).map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label>
    <label>{t.zone}<input required value={form.timeZone} onChange={e=>{setCity('custom');setForm(f=>({...f,timeZone:e.target.value}))}}/></label>
    <label>{t.lat}<input required type="number" step="any" min="-89.999" max="89.999" value={form.latitude} onChange={e=>{setCity('custom');setForm(f=>({...f,latitude:e.target.value}))}}/></label>
    <label>{t.lon}<input required type="number" step="any" min="-180" max="180" value={form.longitude} onChange={e=>{setCity('custom');setForm(f=>({...f,longitude:e.target.value}))}}/></label>
   </div><button type="submit" disabled={loading}>{loading?t.busy:t.calculate}</button>
  </form>
  {error&&<div role="alert" className={styles.error}>{t.error}</div>}
  <AstronomicalEventsPanel locale={locale} start={requested?.date??form.date} zone={requested?.timeZone??form.timeZone}/>
  <PersonalPanchanga locale={locale} point={requested??form}/>
  <VedicFestivalPanel locale={locale} point={requested??form}/>
  <EclipsePanel locale={locale} point={requested??form}/>
  {!result&&!loading&&!error&&<div className={styles.empty}>{t.unknown}</div>}
  {result&&<div className={styles.results}>
   <section className={styles.sun}><h2>{t.subtitle} · {result.date}</h2>
    <div className={styles.sunGrid}>
     <div><small>{t.sunrise}</small><strong>{fmt(result.sunriseUtc)}</strong></div>
     <div><small>{t.sunset}</small><strong>{fmt(result.sunsetUtc)}</strong></div>
     <div><small>{t.next}</small><strong>{fmt(result.nextSunriseUtc)}</strong></div>
    </div>
   </section>
   <section className={styles.timeline}><h2>{t.events}</h2>
    {result.astronomicalEvents.map((event,i)=><div key={event.type+event.atUtc+i}>
     <time dateTime={event.atUtc}>{fmt(event.atUtc)}</time>
     <strong>{event.type==='sunrise'?t.sunrise:event.type==='sunset'?t.sunset:t[event.type]}</strong>
    </div>)}
   </section>
   <section className={styles.timeline}><h2>{t.kalas}</h2>
    {(['rahuKalam','yamaganda','gulikaKalam'] as const).map(key=><div key={key}>
     <time dateTime={result.daytimeKalas[key].fromUtc}>{fmt(result.daytimeKalas[key].fromUtc)} — {fmt(result.daytimeKalas[key].untilUtc)}</time>
     <strong><GlossaryText text={t[key]} locale={locale}/></strong>
     <span>#{result.daytimeKalas[key].part}/8</span>
    </div>)}
    <p><GlossaryText text={t.kalaNote} locale={locale}/></p>
   </section>
   <section><h2>{t.titleFive}</h2>
    <div className={styles.cards} data-testid="panchanga-five-angas">
     {limbKeys.map(key=><article key={key}>
      <small><GlossaryText text={t[key]} locale={locale}/></small><h3><GlossaryText text={angaText(key)} locale={locale}/></h3>
      {key!=='vara'&&<div className={styles.times}>
       <span>{t.started}: {fmt(result.boundaries[key].startUtc)}</span>
       <span>{t.ends}: {fmt(result.boundaries[key].endUtc)}</span>
      </div>}
     </article>)}
    </div>
   </section>
   <section className={styles.timeline}><h2>{t.transitions}</h2>
    {result.changes.map((event,i)=><div key={event.kind+event.atUtc+i}>
     <time dateTime={event.atUtc}>{fmt(event.atUtc)}</time>
     <strong><GlossaryText text={t[event.kind]} locale={locale}/></strong>
     <span>#{event.nextIndex}</span>
    </div>)}
   </section>
   <aside className={styles.method}><h2>{t.source}</h2>
    <p><GlossaryText text={t.profile} locale={locale}/></p><p><GlossaryText text={result.sunriseMethod} locale={locale}/></p><p><GlossaryText text={t.limits} locale={locale}/></p>
    <p>{t.notProphecy}</p>
    <a href="https://www.astro.com/swisseph/swephprg.htm" target="_blank" rel="noopener noreferrer">Swiss Ephemeris · Programming Documentation ↗</a>
   </aside>
  </div>}
 </section>;
}
