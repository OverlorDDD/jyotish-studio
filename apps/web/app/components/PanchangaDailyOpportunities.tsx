'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,CalendarDays,Clock3,Compass,Info,Sun,BookOpen,Star} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import {validateP33Report,type P33Report} from '../../lib/panchanga-p33-resonance';
import {
 abhijitWindow,brahmaMuhurta,calculateTraditionalSlots,dailyOpportunities,
 featuredOpportunities,type Opportunity,type OpportunityDay,type Planet
} from '../../lib/panchanga-opportunities';
import styles from './PanchangaDailyOpportunities.module.css';

type Point={date:string;timeZone:string;latitude:string;longitude:string;place:string};
type PersonalStatus='loading'|'guest'|'no-chart'|'ready'|'unavailable';
type Props={locale:PortalLocale;day:OpportunityDay;point:Point;
 onTomorrow:()=>void;onToday:()=>void;onWeek:()=>void;onAdvanced:()=>void};
const nameOf=(iso:string,zone:string,locale:PortalLocale)=>{
 return new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',{
  timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'shortOffset'
 }).format(new Date(iso));
};
const dateOf=(zone:string)=>{
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',
  day:'2-digit'}).formatToParts(new Date());
 const v=(kind:string)=>p.find(x=>x.type===kind)?.value||'';
 return v('year')+'-'+v('month')+'-'+v('day');
};
const icsValue=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/[,;]/g,c=>'\\'+c);
function calendarFile(opp:Opportunity,locale:PortalLocale,location:string){
 const start=opp.startUtc.replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const end=opp.endUtc.replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const name=opp.title[locale],reason=opp.reason[locale];
 const content=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Galaxiora//Daily Opportunities//EN',
  'CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+opp.id+'@galaxiora.com',
  'DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),
  'DTSTART:'+start,'DTEND:'+end,'SUMMARY:'+icsValue(name),
  'DESCRIPTION:'+icsValue(opp.action[locale]+' '+reason+' Galaxiora: calendar screening, not a certified election.'),
  'LOCATION:'+icsValue(location),'END:VEVENT','END:VCALENDAR'].join('\r\n')+'\r\n';
 return 'data:text/calendar;charset=utf-8,'+encodeURIComponent(content);
}
const HORA_NAME:Record<Planet,{uk:string;en:string}>={
 Sun:{uk:'Сонце',en:'Sun'},Venus:{uk:'Венера',en:'Venus'},Mercury:{uk:'Меркурій',en:'Mercury'},
 Moon:{uk:'Місяць',en:'Moon'},Saturn:{uk:'Сатурн',en:'Saturn'},Jupiter:{uk:'Юпітер',en:'Jupiter'},Mars:{uk:'Марс',en:'Mars'}
};
const DISPLAY_CHOG:Record<string,{uk:string;en:string}>={
 Udveg:{uk:'Удвег',en:'Udveg'},Char:{uk:'Чар',en:'Char'},
 Labh:{uk:'Лабх',en:'Labh'},Amrit:{uk:'Амріт',en:'Amrit'},
 Kaal:{uk:'Каал',en:'Kaal'},Shubh:{uk:'Шубх',en:'Shubh'},Rog:{uk:'Рог',en:'Rog'}
};
export default function PanchangaDailyOpportunities({locale,day,point,
 onTomorrow,onToday,onWeek,onAdvanced}:Props){
 const uk=locale==='uk';
 const [now,setNow]=useState<number|null>(null);
 const [personal,setPersonal]=useState<P33Report|null>(null);
 const [priorDay,setPriorDay]=useState<OpportunityDay|null>(null);
 const [personalStatus,setPersonalStatus]=useState<PersonalStatus>('loading');
 useEffect(()=>{setNow(Date.now())},[day.date,point.timeZone]);
 const today=now!==null&&point.date===dateOf(point.timeZone);
 // Before local sunrise, the still-current Vedic night belongs to
 // yesterday's sunrise date. Fetch its exact Swiss day; never apply
 // the new civil day's weekday or choghadiya to post-midnight hours.
 useEffect(()=>{
  if(!today||now===null||now>=Date.parse(day.sunriseUtc)){
   setPriorDay(null);return;
  }
  let live=true;const ctl=new AbortController();setPriorDay(null);
  const prevDate=new Date(Date.parse(point.date+'T12:00:00Z')-86400000).toISOString().slice(0,10);
  const q=new URLSearchParams({date:prevDate,zone:point.timeZone,
   latitude:point.latitude,longitude:point.longitude});
  fetch('/api/v1/panchanga/day?'+q,{cache:'no-store',signal:ctl.signal})
   .then(r=>r.ok?r.json():Promise.reject(Error('Previous sunrise not verified')))
   .then((previous:OpportunityDay)=>{
    if(!live)return;
    if(previous.nextSunriseUtc!==day.sunriseUtc||previous.location?.timeZone!==point.timeZone)return;
    setPriorDay(previous);
   }).catch(()=>{}); // Fail closed: never invent the previous night.
  return()=>{live=false;ctl.abort()};
 },[today,now,day.sunriseUtc,point.date,point.timeZone,point.latitude,point.longitude]);
 const starting=now!==null&&today&&now>Date.parse(day.sunriseUtc)&&
  now<Date.parse(day.nextSunriseUtc)?new Date(now).toISOString():day.sunriseUtc;
 const computed=useMemo(()=>{
  try{
   const all=dailyOpportunities(day,starting);
   if(today&&now!==null&&now<Date.parse(day.sunriseUtc)&&priorDay){
    const prevStart=new Date(Math.max(now,Date.parse(priorDay.sunriseUtc))).toISOString();
    all.push(...dailyOpportunities(priorDay,prevStart));
   }
   const preDawn=brahmaMuhurta(day);
   // This day's night culminates in tomorrow's sunrise; the last two
   // nighttime muhurtas vary seasonally with the verified sunset.
   // Brahma is for spiritual practice, never a blanket wedding election.
   if(!today||now===null||Date.parse(preDawn.endUtc)>now)all.push(preDawn);
   if(today&&now!==null&&now<Date.parse(day.sunriseUtc)&&priorDay){
    const dawnToday=brahmaMuhurta(priorDay);
    if(Date.parse(dawnToday.endUtc)>now)all.push(dawnToday);
   }
   all.sort((a,b)=>Date.parse(a.startUtc)-Date.parse(b.startUtc));
   return {all,featured:featuredOpportunities(all),periods:calculateTraditionalSlots(day),
    abhijit:abhijitWindow(day),error:false};
  }catch{
   return {all:[] as Opportunity[],featured:[] as Opportunity[],
    periods:null,abhijit:null,error:true};
  }
 },[day,starting,today,now,priorDay]);
 // Only a single owner-scoped, no-store query; the public result never
 // contains natal data. Validation prevents mixing different cities or dates.
 const privateAt=useMemo(()=>{
  const first=computed.featured.find(w=>Date.parse(w.startUtc)>=Date.parse(day.sunriseUtc));
  return first?new Date(Math.min(Date.parse(first.startUtc)+1000,
   Date.parse(day.nextSunriseUtc)-1000)).toISOString():
   new Date(Date.parse(day.sunriseUtc)+60000).toISOString();
 },[computed.featured,day.sunriseUtc,day.nextSunriseUtc]);
 useEffect(()=>{
  let active=true;const ctl=new AbortController();
  setPersonal(null);setPersonalStatus('loading');
  const q=new URLSearchParams({date:point.date,zone:point.timeZone,
   latitude:point.latitude,longitude:point.longitude,at:privateAt});
  fetch('/api/v1/personal/panchanga/resonance?'+q,{cache:'no-store',
   credentials:'same-origin',signal:ctl.signal})
   .then(async r=>{
    if(r.status===401)return {status:'guest'};
    if(!r.ok)throw Error('Private report unavailable');
    return r.json();
   }).then(report=>{
    if(!active)return;
    if(report.status==='guest'){setPersonalStatus('guest');return}
    if(report.status==='requires_primary_chart'||report.status==='requires_verified_chart'){
     setPersonalStatus('no-chart');return;
    }
    validateP33Report(report as P33Report,point,day,privateAt);
    setPersonal(report as P33Report);setPersonalStatus('ready');
   }).catch(()=>{if(active&&!ctl.signal.aborted)setPersonalStatus('unavailable')});
  return()=>{active=false;ctl.abort()};
 },[day,point.date,point.timeZone,point.latitude,point.longitude,privateAt]);
 const top=computed.featured;
 const method=uk?'Часи розраховано за місцевим сходом Сонця, Чогхадією, Hora й точними переходами Панчанги. Підтверджені обмеження для початку справи вилучено. Це традиційний календарний відбір, а не повна персональна мухурта.':
  'Times use local sunrise, Choghadiya, Hora and verified Panchanga transitions. Confirmed start-time exclusions are removed. This is traditional calendar screening, not a complete personal Muhurta.';
 return <section className={styles.root} data-testid="p410-opportunities">
  <div className={styles.heading}>
   <div>
    <span className={styles.overline}><Sun size={15} aria-hidden="true"/> {uk?'ВАШ ЩОДЕННИЙ ПОРАДНИК':'YOUR DAILY GUIDE'}</span>
    <h2>{uk?'Що краще робити сьогодні й коли?':'What is good to do today — and when?'}</h2>
    <p>{uk?'Конкретні заняття й місцеві години за ведичною традицією. Почніть із найближчої можливості.':
     'Practical activities and local times from Vedic tradition. Start with the next opportunity.'}</p>
   </div>
   <button type="button" onClick={onToday} className={styles.today}>{uk?'Сьогодні':'Today'}</button>
  </div>
  {computed.error?<div role="alert" className={styles.empty}>
    {uk?'Немає перевіреного набору астрономічних даних для цих рекомендацій. Не показуємо приблизні години.':
     'Verified astronomical data is incomplete; no approximate times are shown.'}
   </div>:top.length?<div className={styles.cards}>
    {top.map((opp,i)=><article className={i===0?styles.lead:styles.card} key={opp.id}
      data-testid="p410-opportunity">
     <div className={styles.cardHeader}>
      <span className={styles.tag}>{i===0?(uk?'Найближча можливість':'Next opportunity'):
       (uk?'Ще одна можливість':'Another opportunity')}</span>
      <span className={styles.period}><Clock3 size={15} aria-hidden="true"/>
       {nameOf(opp.startUtc,point.timeZone,locale)} – {nameOf(opp.endUtc,point.timeZone,locale)}</span>
     </div>
     <h3>{opp.title[locale]}</h3>
     <p className={styles.action}>{opp.action[locale]}</p>
     <p className={styles.reason}>{opp.reason[locale]}</p>
     <div className={styles.cardActions}>
      <a href={calendarFile(opp,locale,point.place)} download={'galaxiora-'+opp.id+'.ics'}
       className={styles.calendarLink}><CalendarDays size={16} aria-hidden="true"/>
       {uk?'Додати в календар':'Add to calendar'}</a>
      <a href={opp.source} target="_blank" rel="noreferrer" className={styles.source}>
       {uk?'Правило':'Method'} <ArrowRight size={14} aria-hidden="true"/></a>
     </div>
    </article>)}
   </div>:<div className={styles.empty} data-testid="p410-empty">
    {uk?'На решту цього дня перевірених можливостей для нового початку не знайдено. Перегляньте наступний день — без вигаданих «зелених годин».':
     'No verified new-start opportunities remain today. Check tomorrow — no invented green hours.'}
   </div>}
  <div className={styles.navigator}>
   <button type="button" onClick={onTomorrow}>{uk?'А що завтра?':'What about tomorrow?'} <ArrowRight size={16}/></button>
   <button type="button" onClick={onWeek}>{uk?'Переглянути 7 днів':'Explore 7 days'} <CalendarDays size={16}/></button>
  </div>
  <div className={styles.below}>
   <aside className={styles.personal} data-testid="p410-personal">
    <div className={styles.blockTitle}><Star size={18}/><h3>{uk?'Особистий акцент':'Personal lunar context'}</h3></div>
    {personalStatus==='ready'&&personal?<p>{uk?
     'Ваша Тарабала: '+personal.tarabala.name+' (Тара '+personal.tarabala.taraNumber+'). Чандрабала: '+personal.chandrabala.houseFromJanmaRashi+'-й знак від натального Місяця.':
     'Your Tarabala: '+personal.tarabala.name+' (Tara '+personal.tarabala.taraNumber+'). Chandrabala: '+personal.chandrabala.houseFromJanmaRashi+'th sign from natal Moon.'}
     {' '}{uk?'Це приватний контекст моменту, а не автоматичне схвалення всіх подій.':
      'Private context for this moment, not automatic approval of every event.'}</p>:
     personalStatus==='loading'?<p role="status">{uk?'Перевіряємо натальну карту…':'Checking natal context…'}</p>:
     personalStatus==='unavailable'?<p>{uk?'Персональна перевірка зараз недоступна. Загальні години залишаються чинними.':
      'Personal checks are unavailable; general calendar times remain available.'}</p>:
     <p>{uk?'Створіть натальну карту, щоб доповнити загальні можливості Тарабалою та Чандрабалою.':
      'Create a birth chart to add Tarabala and Chandrabala to these general opportunities.'}
      {' '}<Link href={'/'+locale+'/personal'}>{uk?'Моя натальна карта':'My birth chart'}</Link></p>}
   </aside>
   <aside className={styles.facts}>
    <div className={styles.blockTitle}><Compass size={18}/><h3>{uk?'Астрономія й традиція':'Sky and tradition'}</h3></div>
    <p>{uk?'Схід Сонця: ':'Sunrise: '}{nameOf(day.sunriseUtc,point.timeZone,locale)}.
     {computed.abhijit&&<> {uk?'Абхіджит: ':'Abhijit: '}
      {nameOf(computed.abhijit.startUtc,point.timeZone,locale)} – {nameOf(computed.abhijit.endUtc,point.timeZone,locale)}.</>}</p>
    <p>{uk?'Брахма-мухурта перед наступним сходом: ':'Brahma Muhurta before the next sunrise: '}
     {nameOf(brahmaMuhurta(day).startUtc,point.timeZone,locale)} – {nameOf(brahmaMuhurta(day).endUtc,point.timeZone,locale)}.</p>
    {day.astronomicalEvents?.filter(e=>e.type==='new_moon'||e.type==='full_moon')
      .map(e=><p key={e.type+e.atUtc} data-testid="p410-lunar-event">
       <strong>{e.type==='new_moon'?(uk?'Молодик':'New Moon'):(uk?'Повня':'Full Moon')}:</strong>
       {' '}{nameOf(e.atUtc,point.timeZone,locale)}.
      </p>)}
    <small>{uk?'Ці два періоди показано як традиційні орієнтири, а не як дозволи на будь-яку церемонію.':
     'These are traditional reference windows, not permission for every type of ceremony.'}</small>
   </aside>
  </div>
  <details className={styles.method}>
   <summary><Info size={16} aria-hidden="true"/> {uk?'Чому саме ці години? Переглянути розрахунок':'Why these times? View the calculation'}</summary>
   <p>{method}</p>
   {computed.periods&&<div className={styles.periodGrid}>
    <div><h4>{uk?'Чогхадія · день і ніч':'Choghadiya · day and night'}</h4>
     <ol>{computed.periods.choghadiya.map((v,i)=><li key={i}>
      <span>{nameOf(v.startUtc,point.timeZone,locale)} – {nameOf(v.endUtc,point.timeZone,locale)}</span>
      <strong>{DISPLAY_CHOG[v.kind][locale]}</strong>
     </li>)}</ol>
    </div>
    <div><h4>{uk?'Планетарні години · Hora':'Planetary hours · Hora'}</h4>
     <ol>{computed.periods.hora.map((v,i)=><li key={i}>
      <span>{nameOf(v.startUtc,point.timeZone,locale)} – {nameOf(v.endUtc,point.timeZone,locale)}</span>
      <strong>{HORA_NAME[v.kind as Planet][locale]}</strong>
     </li>)}</ol>
    </div>
   </div>}
   <p><a href="https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html"
    target="_blank" rel="noreferrer">{uk?'Таблиці Чогхадії · Drik Panchang':'Choghadiya tables · Drik Panchang'}</a></p>
  </details>
  <button type="button" className={styles.special} onClick={onAdvanced}>
   <BookOpen size={18} aria-hidden="true"/>
   {uk?'Складні події: персональний Time Finder і попередня мухурта':
    'Special events: personal Time Finder and preliminary Muhurta'}
   <ArrowRight size={16} aria-hidden="true"/>
  </button>
 </section>;
}
