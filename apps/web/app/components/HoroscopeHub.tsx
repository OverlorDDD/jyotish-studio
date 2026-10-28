'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Moon,ArrowRight,BookOpen,Compass,CalendarDays,RefreshCw} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import styles from './HoroscopeHub.module.css';
type L={uk:string;en:string};
type Reading={headline:L;description:L;goodFor:L;caution:L;reflection?:L;action?:L;evidence:Record<string,string|number|null|undefined>};
type SignReading=Reading&{referenceSign:number;house:number};
type Sky={events:{kind:string;atUtc:string;localDate:string;practice:L;meaning:L;tradition:L}[];
 observances:{id:string;atUtc:string;rule:string;category:string}[];
 referenceLocation:{name:string}|null;observanceDayCertifiedByTradition:false};
type PublicData={date:string;zone:string;sampledAtUtc:string;moon:{sign:number;nakshatra:string;pada:number};signs:SignReading[];reference:string;sky?:Sky};
type PublicWeek={startDate:string;zone:string;reference:string;days:{date:string;sampledAtUtc:string;moon:{sign:number;nakshatra:string;pada:number};signs:SignReading[]}[]};
type Overview={profile?:{currentTimeZone?:string};selected?:{id:string;verified:boolean;recoveryStatus?:string;moonSign?:number|null;lagnaSign?:number|null}|null;journey?:{daily:Reading|null;horoscope:Reading|null}};
type PersonalCalendar={horoscopeStatus:string;horoscopes:{date:string;guidance:Reading|null}[]};
const SIGN_SLUGS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'] as const;
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
 useEffect(()=>{
  // Shareable canonical public sign deep links, with validation against
  // exactly twelve signs. Private natal selection remains independent.
  const slug=new URLSearchParams(window.location.search).get('sign')||'';
  const index=SIGN_SLUGS.indexOf(slug.toLowerCase() as typeof SIGN_SLUGS[number]);
  if(index>=0)setSelected(index+1);
 },[]);
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
 const natalMoon=personal?.selected?.moonSign;
 const natalLagna=personal?.selected?.lagnaSign;
 const natalName=typeof natalMoon==='number'&&natalMoon>=1&&natalMoon<=12?SIGNS[locale][natalMoon-1]:null;
 const differs=Boolean(natalName&&natalMoon!==selected);
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
    {publicReading||facts.kind==='PERSONAL_JANMA_RASHI'?(uk?' від натального знака Місяця':' from the natal Moon sign'):
     (uk?' від натальної лагни':' from natal Lagna')}</p>}
   {!publicReading&&typeof facts.natalMoonSign==='number'&&<p>
    {uk?'Натальний Місяць: ':'Natal Moon: '}{SIGNS[locale][facts.natalMoonSign-1]}</p>}
   {(facts.major||facts.minor)&&<p>{uk?'Махадаша / антардаша':'Mahadasha / Antardasha'}:
    {' '+String(facts.major||'—')} / {String(facts.minor||'—')}</p>}

  </details>;
 }
 function detail(g:Reading){
  return <article className={styles.reading} data-testid="horoscope-reading">
   <h2>{t(g.headline)}</h2>
   <p className={styles.story}>{t(g.description)}</p>
   <div className={styles.highlights}>
    <section><strong>{uk?'Спробуй сьогодні':'Try this today'}</strong><p>{t(g.goodFor)}</p></section>
    <section><strong>{uk?'Пам’ятай':'Keep in mind'}</strong><p>{t(g.caution)}</p></section>
   </div>
   <div className={styles.reflection}><strong>{g.reflection?(uk?'Запитання для себе':'A question for yourself'):
     (uk?'Практичний крок':'One practical step')}</strong>
    <p>{t(g.reflection||g.action||g.goodFor)}</p>
   </div>
   {g.evidence.kind==='PUBLIC_JANMA_RASHI_REFERENCE'&&data?.sky&&<section data-testid="horoscope-sky-context" style={{padding:'14px 0',borderTop:'1px solid #536a82'}}>
    <h3>{uk?'Астрономічні та ведичні події':'Astronomical and Vedic calendar context'}</h3>
    {data.sky.events.slice(0,2).map((e,i)=><p key={e.kind+e.atUtc+i}>
     <strong>{e.localDate}: </strong>{t(e.meaning)} <span>{t(e.practice)}</span>
    </p>)}
    {data.sky.observances.map((e,i)=><p key={e.id+e.atUtc+i}>
     <strong>{uk?'Календарна позначка':'Calendar observance'}: </strong>{e.id.replaceAll('_',' ')}.
     <small> {uk?'Час святкування може відрізнятися залежно від місцевої традиції.':'Observance times vary with local tradition.'}</small>
    </p>)}
    {data.sky.referenceLocation&&<small>{uk?'Святкові позначки розраховані для Києва; для іншого міста відкрий Панчангу.':'Observance reference city: Kyiv; open Panchanga for other locations.'}</small>}
   </section>}
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
    {uk?'Сьогоднішні ефемериди тимчасово недоступні. Онови сторінку трохи пізніше.':
     'Today’s ephemeris data is temporarily unavailable. Please retry shortly.'}
    <button type="button" onClick={()=>setReload(x=>x+1)}><RefreshCw size={15}/>{uk?'Спробувати ще':'Retry'}</button></div>}
  {data&&mode==='signs'&&<>
   <div className={styles.info}><CalendarDays size={18}/>
    {uk?'Прогноз на ':'Reading for '}{data.date} · {uk?'Сидеричний Місяць, спостереження о 12:00 (Київ).':'Sidereal Moon, observed at noon (Kyiv).'}
   </div>
   <div className={styles.signs} role="group" aria-label={uk?'Сидеричний місячний знак':'Sidereal Moon sign'}>
    {SIGNS[locale].map((name,i)=><button type="button" key={name}
     aria-pressed={selected===i+1} onClick={()=>setSelected(i+1)}>{name}</button>)}
   </div>
   <div className={styles.signExplanation} data-testid="lunar-sign-explanation">
    <div><strong>{uk?'Зараз обрано: ':'Selected lunar sign: '}{SIGNS[locale][selected-1]}</strong>
     <p>{uk?'Це прогноз за місячним знаком Джйотіш, а не за звичним сонячним знаком. Положення Місяця у твоїй натальній карті може відповідати іншому знаку.':
      'This Jyotish reading uses the natal Moon sign, not the familiar Sun sign. Your birth-chart Moon may be in a different sign.'}</p>
     {natalName&&<p><strong>{uk?'Твій місячний знак за натальною картою: ':'Your verified natal Moon sign: '}{natalName}.</strong>
      {differs?' '+(uk?' Головна персональна порада додатково враховує лагну, дашу та планети; нижче є окремий гороскоп саме за натальним Місяцем.':' The main personal guidance also uses your ascendant, dasha and verified planets; the Moon-sign horoscope is shown separately.') :null}</p>}
    </div>
    {natalName&&<button type="button" className={styles.useNatal} onClick={()=>setSelected(natalMoon!)}>
      {uk?'Обрати мій місячний знак':'Use my natal Moon sign'}: {natalName}
    </button>}
    {!natalName&&<Link href={'/'+locale+'/astrology/jyotish'}>{uk?'Дізнатися свій місячний знак за натальною картою':'Find your natal Moon sign'} →</Link>}
   </div>
   <p className={styles.signGuideLink}>
    <Link href={'/'+locale+'/horoscope/'+SIGN_SLUGS[selected-1]}>
     {uk?'Про знак Місяця ':'About the Moon sign '}{SIGNS[locale][selected-1]} · {uk?'значення й особливості':'meaning and characteristics'} ↗
    </Link>
   </p>
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
     <p><strong>{uk?'Спробуй: ':'Try this: '}</strong>{t(phase.entry.goodFor)}</p>
     {evidence({...phase.entry,evidence:{...phase.entry.evidence,house:phase.entry.house}})}
    </article>)}
   </section>}
   <p className={styles.note}>{uk?'Для особистої карти з лагною, дашею та твоїм натальним Місяцем відкрий «Мій персональний».':
    'For your own Ascendant, Dasha and natal Moon, open My personal reading.'}</p>
  </>}
  {mode==='mine'&&<div className={styles.personal}>
   {!personal?<div className={styles.empty}><h2>{uk?'Твій особистий гороскоп':'Your personal horoscope'}</h2>
    <p>{uk?'Збережи власну натальну карту та обери її основною в «Моєму Всесвіті», щоб побачити гороскоп за своїми положеннями планет і періодами.':
      'Save your birth chart and select it in Your Universe to read a forecast based on your actual planetary positions and periods.'}</p>
    <Link href={'/'+locale+'/personal'}>{uk?'Перейти до «Мого Всесвіту»':'Open Your Universe'} <ArrowRight size={16}/></Link></div>:
    <><div className={styles.personalHeading}><h2>{uk?'Твій персональний гороскоп':'Your personal horoscope'}</h2>
      <span>{uk?'За підтвердженою натальною картою':'From your verified birth chart'}</span></div>
     <div className={styles.signExplanation} data-testid="personal-sign-basis">
      <strong>{uk?'Вихідні дані твоєї карти':'Your birth-chart reference signs'}</strong>
      <p>{uk?'Натальний Місяць':'Natal Moon'}: <b>{natalName||'—'}</b>
       {' · '}{uk?'Лагна':'Ascendant'}: <b>{typeof natalLagna==='number'&&natalLagna>=1&&natalLagna<=12?SIGNS[locale][natalLagna-1]:'—'}</b></p>
      <p>{uk?'Тут використовується твій справжній натальний місячний знак, поточний транзит і, для основної поради, лагна й даша. Обраний вручну знак у загальній вкладці на цей розрахунок не впливає.':
       'This view uses your saved natal Moon, current transit and, in the main guidance, ascendant and Dasha. Manually choosing a public sign never changes the personal result.'}</p>
     </div>
     {period==='day'&&<>
      <section data-testid="personal-moon-reading"><h3>{uk?'Гороскоп за твоїм місячним знаком':'Reading for your natal Moon sign'}</h3>
       <p>{uk?'Саме цей блок можна порівнювати із загальним гороскопом, обравши там свій натальний знак Місяця.':'Compare this section with the public reading after selecting your true natal Moon sign.'}</p>
       {personal.journey?.horoscope?detail(personal.journey.horoscope):<p>{uk?'Сьогоднішнє читання Місяця недоступне.':'Moon-sign reading is temporarily unavailable.'}</p>}
      </section>
      {personal.journey?.daily&&<details data-testid="personal-daily-core" className={styles.signExplanation}>
       <summary style={{cursor:'pointer',fontWeight:700}}>{uk?'Поглиблена персональна порада · лагна, даша й транзити':'Deeper personal guidance · ascendant, dasha and transits'}</summary>
       {detail(personal.journey.daily)}
      </details>}
     </>}
     {period==='week'&&!week&&<p role="status">{uk?'Персональний тижневий прогноз недоступний.':'Personal weekly reading is currently unavailable.'}</p>}
     {period==='week'&&week?.horoscopeStatus==='personalized'&&<section className={styles.week}>
      <h2>{uk?'Наступні сім днів':'The next seven days'}</h2>
      {week.horoscopes.filter(x=>x.guidance).map(x=><article key={x.date}>
       <time dateTime={x.date}>{x.date}</time>
       <h3>{t(x.guidance!.goodFor)}</h3>
       <small>{uk?'Тема транзиту: ':'Transit theme: '}{t(x.guidance!.headline)}</small>
       <p>{t(x.guidance!.description)}</p>
       {x.guidance!.action&&<p><strong>{uk?'Практичний крок: ':'Practical step: '}</strong>{t(x.guidance!.action)}</p>}
      </article>)}
     </section>}
     <Link href={'/'+locale+'/personal'} className={styles.toPersonal}>
       {uk?'Мій Всесвіт: натальна карта й календар':'Your Universe: birth chart and calendar'} <ArrowRight size={16}/>
     </Link>
    </>}
  </div>}
  <footer className={styles.sources}><BookOpen size={18}/><div>
   <strong>{uk?'Метод і джерела':'Method and sources'}</strong>
   <p>{uk?'Астрономічна основа: Swiss Ephemeris, сидеричний зодіак Лагірі. Тлумачення транзитів спираються на традицію Джйотіш, зокрема «Пхаладіпіку», розділ 26.':
    'Astronomical basis: Swiss Ephemeris, Lahiri sidereal zodiac. Transit interpretations draw on classical Jyotish, including Phaladipika, chapter 26.'}</p>
   <a href="https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621598.html" target="_blank" rel="noopener noreferrer">
    {uk?'Читати першоджерело':'Classical source'}</a>
   </div>
  </footer>
 </section>;
}
