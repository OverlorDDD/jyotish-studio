'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Moon,ArrowRight,BookOpen,Compass,CalendarDays,RefreshCw} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import styles from './HoroscopeHub.module.css';
type L={uk:string;en:string};
type Reading={headline:L;description:L;goodFor:L;caution:L;reflection?:L;action?:L;evidence:Record<string,string|number|null|undefined>};
type SignReading=Reading&{referenceSign:number;house:number};
type PublicData={date:string;zone:string;sampledAtUtc:string;moon:{sign:number;nakshatra:string;pada:number};signs:SignReading[];reference:string};
type PublicWeek={startDate:string;zone:string;reference:string;days:{date:string;sampledAtUtc:string;moon:{sign:number;nakshatra:string;pada:number};signs:SignReading[]}[]};
type Overview={profile?:{currentTimeZone?:string};selected?:{id:string;verified:boolean;recoveryStatus?:string}|null;journey?:{daily:Reading|null}};
type PersonalCalendar={horoscopeStatus:string;horoscopes:{date:string;guidance:Reading|null}[]};
const SIGNS={
 uk:['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'],
 en:['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
};
async function get<T>(path:string):Promise<T>{
 const response=await fetch(path,{credentials:'same-origin',cache:'no-store'});
 if(!response.ok)throw Error(String(response.status));return response.json() as Promise<T>;
}
export default function HoroscopeHub({locale}:{locale:PortalLocale}){
 const uk=locale==='uk',t=(x:L)=>x[locale];
 const [data,setData]=useState<PublicData|null>(null),[error,setError]=useState(false);
 const [selected,setSelected]=useState(1),[personal,setPersonal]=useState<Overview|null>(null),
 [week,setWeek]=useState<PersonalCalendar|null>(null),[mode,setMode]=useState<'signs'|'mine'>('signs');
 const [loading,setLoading]=useState(true),[reload,setReload]=useState(0);
 const [period,setPeriod]=useState<'day'|'week'>('day');
 const [publicWeek,setPublicWeek]=useState<PublicWeek|null>(null),[weekBusy,setWeekBusy]=useState(false),[weekError,setWeekError]=useState(false);
 useEffect(()=>{let live=true;
  setLoading(true);
  Promise.allSettled([get<PublicData>('/api/v1/horoscope/today'),get<Overview>('/api/v1/personal/overview')])
   .then(async results=>{
    if(!live)return;
    if(results[0].status==='fulfilled'){setData(results[0].value);setError(false)}
    else setError(true);
    if(results[1].status==='fulfilled'&&results[1].value.selected?.verified){
     setPersonal(results[1].value);
     try{const calendar=await get<PersonalCalendar>('/api/v1/personal/calendar?days=7');
      if(live)setWeek(calendar);}catch{if(live)setWeek(null)}
    }else{setPersonal(null);setWeek(null)}
   }).finally(()=>{if(live)setLoading(false)});
  return()=>{live=false};
 },[reload]);
 useEffect(()=>{
  if(mode!=='signs'||period!=='week'||publicWeek)return;
  let live=true;setWeekBusy(true);setWeekError(false);
  get<PublicWeek>('/api/v1/horoscope/week')
   .then(result=>{if(live)setPublicWeek(result)})
   .catch(()=>{if(live)setWeekError(true)})
   .finally(()=>{if(live)setWeekBusy(false)});
  return()=>{live=false};
 },[mode,period,publicWeek,reload]);
 const reading=data?.signs[selected-1];
 // Combine consecutive noon samples in the same house: a coherent weekly arc,
 // not seven copies of the same paragraph or made-up exact ingress times.
 const weekPhases=(publicWeek?.days||[]).reduce<{start:string;end:string;entry:SignReading}[]>((acc,day)=>{
  const entry=day.signs[selected-1];if(!entry)return acc;
  const last=acc[acc.length-1];
  if(last&&last.entry.house===entry.house){last.end=day.date;return acc;}
  acc.push({start:day.date,end:day.date,entry});return acc;
 },[]);
 const dayLabel=(day:string)=>new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{day:'numeric',month:'short',timeZone:'UTC'})
  .format(new Date(day+'T12:00:00Z'));
 function evidence(g:Reading){
  const facts=g.evidence,publicReading=facts.kind==='PUBLIC_JANMA_RASHI_REFERENCE';
  const zone=publicReading?(data?.zone||'Europe/Kyiv'):(personal?.profile?.currentTimeZone||'UTC');
  const date=typeof facts.sampledAtUtc==='string'?
   new Date(facts.sampledAtUtc).toLocaleString(uk?'uk-UA':'en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:zone}):
   String(facts.day??facts.date??'—');
  const moonSign=publicReading?data?.moon.sign:facts.sign;
  const lunarName=typeof moonSign==='number'?SIGNS[locale][moonSign-1]:undefined;
  const nakshatra=publicReading?data?.moon.nakshatra:facts.nakshatra;
  const pada=publicReading?data?.moon.pada:facts.pada;
  return <details className={styles.evidence}>
   <summary>{uk?'Астрологічна основа прогнозу':'Astrological basis of the reading'}</summary>
   <p>{String(facts.method||'Swiss Ephemeris / Lahiri')} · {date} ({zone})</p>
   {lunarName&&<p>{uk?'Транзитний Місяць: ':'Transiting Moon: '}{lunarName}
    {nakshatra?' · '+nakshatra:''}{pada?' · '+(uk?'пада ':'pada ')+pada:''}</p>}
   {facts.house!=null&&<p>{uk?'Дім транзиту: ':'Transit house: '}{String(facts.house)}
    {publicReading?(uk?' від обраного місячного знака':' from the selected Moon sign'):
     (uk?' від натальної лагни':' from natal Lagna')}</p>}
   {!publicReading&&typeof facts.natalMoonSign==='number'&&<p>
    {uk?'Натальний Місяць: ':'Natal Moon: '}{SIGNS[locale][facts.natalMoonSign-1]}</p>}
   {(facts.major||facts.minor)&&<p>{uk?'Махадаша / антардаша':'Mahadasha / Antardasha'}:
    {' '+String(facts.major||'—')} / {String(facts.minor||'—')}</p>}
   <p>{uk?'Традиційна інтерпретація розрахованих чинників; без тверджень про наперед визначені події.':
    'Traditional interpretation of calculated factors; no claims of predetermined events.'}</p>
  </details>;
 }
 function detail(g:Reading){
  return <article className={styles.reading} data-testid="horoscope-reading">
   <h2>{t(g.headline)}</h2>
   <p className={styles.story}>{t(g.description)}</p>
   <div className={styles.highlights}>
    <section><strong>{uk?'На що звернути увагу':'What deserves attention'}</strong><p>{t(g.goodFor)}</p></section>
    <section><strong>{uk?'Що важливо не перебільшувати':'What not to overstate'}</strong><p>{t(g.caution)}</p></section>
   </div>
   <div className={styles.reflection}><strong>{g.reflection?(uk?'Запитання для себе':'A question for yourself'):
     (uk?'Практичний крок':'One practical step')}</strong>
    <p>{t(g.reflection||g.action||g.goodFor)}</p>
   </div>
   {evidence(g)}
  </article>;
 }
 return <section className={styles.page} data-testid="horoscope-hub">
  <header className={styles.hero}><span className={styles.kicker}>GALAXIORA · JYOTISH</span>
   <h1>{uk?'Гороскопи':'Horoscopes'}</h1>
   <p>{uk?'Місячні транзити, традиція Джйотіш і пояснення, які допомагають розібратися у власному ритмі. Обери свій сидеричний знак Місяця або відкрий персональне читання за натальною картою.':
    'Lunar transits and classical Jyotish interpretations. Choose your sidereal Moon sign or explore a reading grounded in your saved birth chart.'}</p>
   <div className={styles.mode} role="group" aria-label={uk?'Тип гороскопу':'Horoscope view'}>
    <button type="button" aria-pressed={mode==='signs'} onClick={()=>setMode('signs')}><Moon size={17}/>{uk?'Усі 12 знаків':'All 12 signs'}</button>
    <button type="button" aria-pressed={mode==='mine'} onClick={()=>setMode('mine')}><Compass size={17}/>{uk?'Мій персональний':'My personal reading'}</button>
   </div>
   <div className={styles.period} role="group" aria-label={uk?'Період прогнозу':'Reading period'}>
    <button type="button" aria-pressed={period==='day'} onClick={()=>setPeriod('day')}>
     {uk?'Сьогодні':'Today'}</button>
    <button type="button" aria-pressed={period==='week'} onClick={()=>setPeriod('week')}>
     {uk?'Цей тиждень':'This week'}</button>
   </div>
  </header>
  {loading&&!data&&<p role="status">{uk?'Звіряємо положення Місяця…':'Checking the Moon position…'}</p>}
  {error&&<div role="alert" className={styles.error}>
    {uk?'Астрономічні дані зараз недоступні. Ми не створюємо гороскоп без перевірених положень.':
     'Astronomical data is unavailable. No reading is generated without verified positions.'}
    <button type="button" onClick={()=>setReload(x=>x+1)}><RefreshCw size={15}/>{uk?'Спробувати ще':'Retry'}</button></div>}
  {data&&mode==='signs'&&<>
   <div className={styles.info}><CalendarDays size={18}/>
    {uk?'Прогноз на ':'Reading for '}{data.date} · {uk?'Місяць на 12:00 за Києвом. Не момент переходу між знаками.':
      'Lunar position at noon Kyiv time, not an exact ingress moment.'}
   </div>
   <div className={styles.signs} role="group" aria-label={uk?'Сидеричний місячний знак':'Sidereal Moon sign'}>
    {SIGNS[locale].map((name,i)=><button type="button" key={name}
     aria-pressed={selected===i+1} onClick={()=>setSelected(i+1)}>{name}</button>)}
   </div>
   {period==='day'&&reading&&detail({...reading,evidence:{...reading.evidence,house:reading.house}})}
   {period==='week'&&<section className={styles.week} data-testid="public-horoscope-week">
    <h2>{uk?'Тижневий ритм для знака ':'Weekly outlook for '}{SIGNS[locale][selected-1]}</h2>
    <p className={styles.note}>{uk?'Теми згруповано за місячними положеннями на полудень кожного дня; межі періодів не є точними моментами переходу Місяця.':
     'Themes are grouped by daily noon lunar positions, not exact sign-ingress times.'}</p>
    {weekBusy&&<p role="status">{uk?'Звіряємо сім днів ефемерид…':'Checking seven days of ephemerides…'}</p>}
    {weekError&&<div role="alert" className={styles.error}>
     {uk?'Не вдалося отримати астрономічні дані на тиждень.':'Weekly astronomical data is unavailable.'}
     <button type="button" onClick={()=>{setPublicWeek(null);setReload(x=>x+1)}}>{uk?'Повторити':'Retry'}</button>
    </div>}
    {weekPhases.map(phase=><article key={phase.start} className={styles.weekPhase}>
     <time>{dayLabel(phase.start)}{phase.end!==phase.start?' — '+dayLabel(phase.end):''}</time>
     <h3>{t(phase.entry.headline)}</h3><p>{t(phase.entry.description)}</p>
     <p><strong>{uk?'Сприятлива увага: ':'Worth focusing on: '}</strong>{t(phase.entry.goodFor)}</p>
     {evidence({...phase.entry,evidence:{...phase.entry.evidence,house:phase.entry.house}})}
    </article>)}
   </section>}
   <p className={styles.note}>{uk?'Це загальне читання для знака Місяця у ведичному сидеричному зодіаку, а не для сонячного знака західного гороскопа. Для розбору лагни, даш і власних періодів обери персональний прогноз.':
    'This is a general Jyotish reading by sidereal Moon sign, not a Western Sun-sign horoscope. Your birth-chart Lagna and Dasha require a personal reading.'}</p>
  </>}
  {mode==='mine'&&<div className={styles.personal}>
   {!personal?<div className={styles.empty}><h2>{uk?'Твій особистий гороскоп':'Your personal horoscope'}</h2>
    <p>{uk?'Для справді персонального трактування потрібна збережена та перевірена натальна карта. Без неї не будемо вигадувати твої доми, дашу чи події.':
      'A saved and verified birth chart is needed for personal house and Dasha readings. We will not fabricate them.'}</p>
    <Link href={'/'+locale+'/personal'}>{uk?'Перейти до «Мого Всесвіту»':'Open Your Universe'} <ArrowRight size={16}/></Link></div>:
    <><div className={styles.personalHeading}><h2>{uk?'Сьогодні у твоєму гороскопі':'Your reading for today'}</h2>
      <span>{uk?'За перевіреною натальною картою':'From your verified birth chart'}</span></div>
     {period==='day'&&(personal.journey?.daily?detail(personal.journey.daily):<p>{uk?'Поточне персональне трактування недоступне.':'Current personal reading unavailable.'}</p>)}
     {period==='week'&&!week&&<p role="status">{uk?'Персональний тижневий прогноз недоступний.':'Personal weekly reading is currently unavailable.'}</p>}
     {period==='week'&&week?.horoscopeStatus==='personalized'&&<section className={styles.week}>
      <h2>{uk?'Наступні сім днів':'The next seven days'}</h2>
      {week.horoscopes.filter(x=>x.guidance).map(x=><article key={x.date}>
       <time dateTime={x.date}>{x.date}</time><h3>{t(x.guidance!.headline)}</h3>
       <p>{t(x.guidance!.description)}</p><small>{uk?'Фокус: ':'Focus: '}{t(x.guidance!.goodFor)}</small>
      </article>)}
     </section>}
     <Link href={'/'+locale+'/personal'} className={styles.toPersonal}>
       {uk?'Мій Всесвіт: натальна карта й календар':'Your Universe: birth chart and calendar'} <ArrowRight size={16}/>
     </Link>
    </>}
  </div>}
  <footer className={styles.sources}><BookOpen size={18}/><div>
   <strong>{uk?'Метод і джерела':'Method and sources'}</strong>
   <p>{uk?'Астрономічні положення — Swiss Ephemeris, сидеричний зодіак Лагірі. Традиційні теми транзитів — Phaladīpikā, розділ 26. Персональний прогноз використовує лише збережені перевірені факти. Поради є редакційними інтерпретаціями традиції; ми не вигадуємо зустрічі, фінансові події чи доленосні обіцянки.':
    'Astronomical positions: Swiss Ephemeris/Lahiri. Classical transit themes: Phaladipika chapter 26. Personal readings use verified saved facts only; no invented meetings, windfalls or assured events.'}</p>
   <a href="https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621598.html" target="_blank" rel="noopener noreferrer">
    {uk?'Читати першоджерело':'Classical source'}</a>
   </div>
  </footer>
 </section>;
}
