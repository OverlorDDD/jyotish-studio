'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Moon,Sun,ArrowRight,BookOpen,Compass,CalendarDays,RefreshCw} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import styles from './HoroscopeHub.module.css';
import GlossaryText from './GlossaryText';
type L={uk:string;en:string};
type Reading={headline:L;description:L;goodFor:L;caution:L;reflection?:L;action?:L;evidence:Record<string,string|number|null|undefined>};
type SignReading=Reading&{referenceSign:number;house:number};
type Sky={events:{kind:string;atUtc:string;localDate:string;practice:L;meaning:L;tradition:L}[];
 observances:{id:string;atUtc:string;rule:string;category:string}[];
 referenceLocation:{name:string}|null;observanceDayCertifiedByTradition:false};
type PublicData={date:string;zone:string;sampledAtUtc:string;sun?:{sign:number;longitude:number};moon:{sign:number;nakshatra?:string;pada?:number};signs:SignReading[];reference:'SIDEREAL_MOON_SIGN'|'TROPICAL_SUN_SIGN';sky?:Sky};
type PublicWeek={startDate:string;zone:string;reference:'SIDEREAL_MOON_SIGN'|'TROPICAL_SUN_SIGN';days:{date:string;sampledAtUtc:string;sun?:{sign:number;longitude:number};moon:{sign:number;nakshatra?:string;pada?:number};signs:SignReading[]}[]};
type Overview={profile?:{currentTimeZone?:string};selected?:{id:string;verified:boolean;recoveryStatus?:string;moonSign?:number|null;lagnaSign?:number|null;westernSunSign?:number|null}|null;journey?:{daily:Reading|null;horoscope:Reading|null}};
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
 const [selected,setSelected]=useState(1),[tradition,setTradition]=useState<'western'|'vedic'>('western'),[personal,setPersonal]=useState<Overview|null>(null),
 [week,setWeek]=useState<PersonalCalendar|null>(null),[mode,setMode]=useState<'signs'|'mine'>('signs');
 const [loading,setLoading]=useState(true),[reload,setReload]=useState(0);
 const [period,setPeriod]=useState<'day'|'week'>('day');
 const [publicWeek,setPublicWeek]=useState<PublicWeek|null>(null),[weekBusy,setWeekBusy]=useState(false),[weekError,setWeekError]=useState(false);
 useEffect(()=>{
  // Shareable canonical public sign deep links, with validation against
  // exactly twelve signs. Private natal selection remains independent.
  const params=new URLSearchParams(window.location.search);
  if(params.get('system')==='vedic')setTradition('vedic');
  const slug=params.get('sign')||'';
  const index=SIGN_SLUGS.indexOf(slug.toLowerCase() as typeof SIGN_SLUGS[number]);
  if(index>=0)setSelected(index+1);
 },[]);
 useEffect(()=>{let live=true;
  setLoading(true);
  Promise.allSettled([get<PublicData>(tradition==='western'?'/api/v1/horoscope/western/today':'/api/v1/horoscope/today'),get<Overview>('/api/v1/personal/overview')])
   .then(async results=>{
    if(!live)return;
    if(results[0].status==='fulfilled'){setData(results[0].value);setError(false)}
    else setError(true);
    if(results[1].status==='fulfilled'&&results[1].value.selected?.verified){
     setPersonal(results[1].value);
     // Choose the visitor's own reference sign, unless a shareable link
     // explicitly requested a different sign.
     if(!new URLSearchParams(window.location.search).has('sign')){
      const candidate=tradition==='western'?results[1].value.selected.westernSunSign:results[1].value.selected.moonSign;
      if(typeof candidate==='number'&&candidate>=1&&candidate<=12)setSelected(candidate);
     }
     try{const calendar=await get<PersonalCalendar>('/api/v1/personal/calendar?days=7');
      if(live)setWeek(calendar);}catch{if(live)setWeek(null)}
    }else{setPersonal(null);setWeek(null)}
   }).finally(()=>{if(live)setLoading(false)});
  return()=>{live=false};
 },[reload,tradition]);
 useEffect(()=>{
  if(mode!=='signs'||period!=='week'||(publicWeek&&publicWeek.reference===(tradition==='western'?'TROPICAL_SUN_SIGN':'SIDEREAL_MOON_SIGN')))return;
  let live=true;setWeekBusy(true);setWeekError(false);
  get<PublicWeek>(tradition==='western'?'/api/v1/horoscope/western/week':'/api/v1/horoscope/week')
   .then(result=>{if(live)setPublicWeek(result)})
   .catch(()=>{if(live)setWeekError(true)})
   .finally(()=>{if(live)setWeekBusy(false)});
  return()=>{live=false};
 },[mode,period,publicWeek,reload,tradition]);
 const natalMoon=personal?.selected?.moonSign;
 const natalSun=personal?.selected?.westernSunSign;
 const westernName=typeof natalSun==='number'&&natalSun>=1&&natalSun<=12?SIGNS[locale][natalSun-1]:null;
 const selectedNatal=tradition==='western'?natalSun:natalMoon;
 const selectedNatalName=tradition==='western'?westernName:(typeof natalMoon==='number'&&natalMoon>=1&&natalMoon<=12?SIGNS[locale][natalMoon-1]:null);
 const changeTradition=(next:'western'|'vedic')=>{
  setTradition(next);setPublicWeek(null);setError(false);
  const n=next==='western'?natalSun:natalMoon;
  if(typeof n==='number'&&n>=1&&n<=12)setSelected(n);
 };
 const natalLagna=personal?.selected?.lagnaSign;
 const natalName=typeof natalMoon==='number'&&natalMoon>=1&&natalMoon<=12?SIGNS[locale][natalMoon-1]:null;
 const differs=Boolean(selectedNatalName&&selectedNatal!==selected);
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
  const westernReading=facts.kind==='PUBLIC_TROPICAL_SOLAR_REFERENCE';
  const zone=publicReading?(data?.zone||'Europe/Kyiv'):(personal?.profile?.currentTimeZone||'UTC');
  const date=typeof facts.sampledAtUtc==='string'?
   new Date(facts.sampledAtUtc).toLocaleString(uk?'uk-UA':'en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:zone}):
   String(facts.day??facts.date??'—');
  const moonSign=(publicReading||westernReading)?data?.moon.sign:facts.sign;
  const lunarName=typeof moonSign==='number'?SIGNS[locale][moonSign-1]:undefined;
  const nakshatra=publicReading?data?.moon.nakshatra:facts.nakshatra;
  const pada=publicReading?data?.moon.pada:facts.pada;
  return <details className={styles.evidence}>
   <summary>{uk?'Астрологічна основа прогнозу':'Astrological basis of the reading'}</summary>
   <p>{String(facts.method||'Swiss Ephemeris / Lahiri')} · {date} ({zone})</p>
   {westernReading&&typeof facts.sunSign==='number'&&<p>{uk?'Тропічне Сонце: ':'Tropical Sun: '}{SIGNS[locale][facts.sunSign-1]} · {uk?'Сонячний дім: ':'Solar house: '}{String(facts.sunHouse)}</p>}
   {lunarName&&<p>{uk?(westernReading?'Тропічний Місяць: ':'Транзитний Місяць: '):(westernReading?'Tropical Moon: ':'Transiting Moon: ')}{lunarName}
    {nakshatra?' · '+nakshatra:''}{pada?' · '+(uk?'пада ':'pada ')+pada:''}</p>}
   {facts.house!=null&&<p>{uk?'Дім транзиту: ':'Transit house: '}{String(facts.house)}
    {westernReading?(uk?' від обраного тропічного знака Сонця':' from the selected tropical Sun sign'):
     publicReading||facts.kind==='PERSONAL_JANMA_RASHI'?(uk?' від натального знака Місяця':' from the natal Moon sign'):
     (uk?' від натальної лагни':' from natal Lagna')}</p>}
   {!publicReading&&typeof facts.natalMoonSign==='number'&&<p>
    {uk?'Натальний Місяць: ':'Natal Moon: '}{SIGNS[locale][facts.natalMoonSign-1]}</p>}
   {(facts.major||facts.minor)&&<p>{uk?'Махадаша / антардаша':'Mahadasha / Antardasha'}:
    {' '+String(facts.major||'—')} / {String(facts.minor||'—')}</p>}

  </details>;
 }
 function detail(g:Reading){
  return <article className={styles.reading} data-testid="horoscope-reading">
   <h2><GlossaryText text={t(g.headline)} locale={locale}/></h2>
   <p className={styles.story}><GlossaryText text={t(g.description)} locale={locale}/></p>
   <div className={styles.highlights}>
    <section><strong>{uk?'Спробуй сьогодні':'Try this today'}</strong><p><GlossaryText text={t(g.goodFor)} locale={locale}/></p></section>
    <section><strong>{uk?'Пам’ятай':'Keep in mind'}</strong><p><GlossaryText text={t(g.caution)} locale={locale}/></p></section>
   </div>
   <div className={styles.reflection}><strong>{g.reflection?(uk?'Запитання для себе':'A question for yourself'):
     (uk?'Практичний крок':'One practical step')}</strong>
    <p><GlossaryText text={t(g.reflection||g.action||g.goodFor)} locale={locale}/></p>
   </div>
   {g.evidence.kind==='PUBLIC_JANMA_RASHI_REFERENCE'&&data?.sky&&<section data-testid="horoscope-sky-context" style={{padding:'14px 0',borderTop:'1px solid #536a82'}}>
    <h3>{uk?'Астрономічні та ведичні події':'Astronomical and Vedic calendar context'}</h3>
    {data.sky.events.slice(0,2).map((e,i)=><p key={e.kind+e.atUtc+i}>
     <strong>{e.localDate}: </strong><GlossaryText text={t(e.meaning)} locale={locale}/> <span><GlossaryText text={t(e.practice)} locale={locale}/></span>
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
   <p>{uk?'Два різні підходи: звичний західний знак Сонця та ведичний знак Місяця. Обери традицію або відкрий глибоке персональне читання за натальною картою.':
    'Two distinct traditions: your familiar Western Sun sign and Vedic Moon sign. Choose a method or explore a deeper reading grounded in your verified birth chart.'}</p>
   <div className={styles.traditions} role="group" aria-label={uk?'Астрологічна традиція':'Astrology tradition'}>
    <button type="button" aria-pressed={tradition==='western'} onClick={()=>changeTradition('western')}>{uk?'Західний · Сонце':'Western · Sun'}</button>
    <button type="button" aria-pressed={tradition==='vedic'} onClick={()=>changeTradition('vedic')}>{uk?'Ведичний · Місяць':'Vedic · Moon'}</button>
   </div>
   <p className={styles.traditionInfo}>{tradition==='western'?
    (uk?'Західний тропічний зодіак. Для прогнозу обирай свій звичний знак за Сонцем. Транзити Сонця й Місяця обчислені незалежно від Джйотіш.':
    'Western tropical zodiac. Choose your familiar Sun sign. Sun and Moon transits are computed independently of Jyotish.'):
    (uk?'Джйотіш / Лахірі. Для прогнозу обирай свій натальний сидеричний знак Місяця (Джанма-раші), а не західний знак Сонця.':
    'Jyotish / Lahiri. Choose your natal sidereal Moon sign (Janma Rashi), not your Western Sun sign.')}</p>
   <div className={styles.mode} role="group" aria-label={uk?'Тип гороскопу':'Horoscope view'}>
    <button type="button" aria-pressed={mode==='signs'} onClick={()=>setMode('signs')}>{tradition==='western'?<Sun size={17}/>:<Moon size={17}/>} {uk?'Усі 12 знаків':'All 12 signs'}</button>
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
    {uk?'Прогноз на ':'Reading for '}{data.date} · {tradition==='western'?
     (uk?'Тропічне Сонце та Місяць, опівдні за Києвом.':'Tropical Sun and Moon at Kyiv noon.'):
     (uk?'Сидеричний Місяць, спостереження опівдні за Києвом.':'Sidereal Moon at Kyiv noon.')}
   </div>
   <div className={styles.signs} role="group" aria-label={tradition==='western'?(uk?'Тропічний знак Сонця':'Tropical Sun sign'):(uk?'Сидеричний місячний знак':'Sidereal Moon sign')}>
    {SIGNS[locale].map((name,i)=><button type="button" key={name}
     aria-pressed={selected===i+1} onClick={()=>setSelected(i+1)}>{name}</button>)}
   </div>
   <div className={styles.signExplanation} data-testid="lunar-sign-explanation">
    <div><strong>{uk?'Обраний знак: ':'Selected sign: '}{SIGNS[locale][selected-1]}</strong>
     <p>{tradition==='western'?
      (uk?'Це загальний західний гороскоп за тропічним знаком Сонця. Він не підміняє особистий аналіз натальної карти й не використовує ведичну лагну або дашу.':
       'This is a general Western tropical Sun-sign reading, not a personal natal interpretation. It does not use Vedic Lagna or Dasha.'):
      (uk?'Це ведичний гороскоп за натальним Місяцем, а не за звичним сонячним знаком. Для двох систем можуть бути різні знаки.':
       'This Vedic reading uses your natal Moon sign, not the familiar Sun sign. The two methods can give different signs.')}</p>
     {selectedNatalName&&<p><strong>{tradition==='western'?
      (uk?'Твій західний знак Сонця: ':'Your tropical natal Sun: '):
      (uk?'Твій ведичний знак Місяця: ':'Your sidereal natal Moon: ')}{selectedNatalName}.</strong>
      {differs?' '+(uk?'Обраний вручну знак не змінює твою натальну карту.':'Manual selection never changes your natal chart.') :null}</p>}
    </div>
    {selectedNatalName&&<button type="button" className={styles.useNatal} onClick={()=>setSelected(selectedNatal!)}>
      {tradition==='western'?(uk?'Показати мій знак Сонця':'Use my Sun sign'):(uk?'Показати мій знак Місяця':'Use my Moon sign')}: {selectedNatalName}
    </button>}
    {!selectedNatalName&&<Link href={'/'+locale+'/astrology/jyotish'}>
     {tradition==='western'?(uk?'Розрахувати точний знак Сонця':'Calculate my exact Sun sign'):(uk?'Визначити натальний знак Місяця':'Calculate my natal Moon sign')} →</Link>}
   </div>
   {tradition==='vedic'&&<p className={styles.signGuideLink}>
    <Link href={'/'+locale+'/horoscope/'+SIGN_SLUGS[selected-1]}>
     {uk?'Про знак Місяця ':'About the Moon sign '}{SIGNS[locale][selected-1]} · {uk?'значення й особливості':'meaning and characteristics'} ↗
    </Link>
   </p>}
   {period==='day'&&reading&&detail({...reading,evidence:{...reading.evidence,house:reading.house}})}
   {period==='week'&&<section className={styles.week} data-testid="public-horoscope-week">
    <h2>{uk?'Тижневий ритм для знака ':'Weekly outlook for '}{SIGNS[locale][selected-1]}</h2>
    <p className={styles.note}>{tradition==='western'?
     (uk?'Західний тропічний прогноз: теми Сонця та Місяця згруповано за місячними домами від обраного знака Сонця. Це не точні моменти переходів.':
      'Western tropical reading: daily Sun and Moon themes grouped by lunar house relative to the chosen Sun sign, not exact ingress times.'):
     (uk?'Теми згруповано за місячними положеннями опівдні; межі не є точними моментами переходу.':
      'Themes are grouped by noon Moon positions, not exact sign-ingress times.')}</p>
    {weekBusy&&<p role="status">{uk?'Звіряємо сім днів ефемерид…':'Checking seven days of ephemerides…'}</p>}
    {weekError&&<div role="alert" className={styles.error}>
     {uk?'Не вдалося отримати астрономічні дані на тиждень.':'Weekly astronomical data is unavailable.'}
     <button type="button" onClick={()=>{setPublicWeek(null);setReload(x=>x+1)}}>{uk?'Повторити':'Retry'}</button>
    </div>}
    {weekPhases.map(phase=><article key={phase.start} className={styles.weekPhase}>
     <time>{dayLabel(phase.start)}{phase.end!==phase.start?' — '+dayLabel(phase.end):''}</time>
     <h3><GlossaryText text={t(phase.entry.headline)} locale={locale}/></h3><p><GlossaryText text={t(phase.entry.description)} locale={locale}/></p>
     <p><strong>{uk?'Спробуй: ':'Try this: '}</strong><GlossaryText text={t(phase.entry.goodFor)} locale={locale}/></p>
     {evidence({...phase.entry,evidence:{...phase.entry.evidence,house:phase.entry.house}})}
    </article>)}
   </section>}
   <p className={styles.note}>{uk?'Для глибшого читання за натальною картою відкрий «Мій персональний».':
    'For a deeper reading grounded in your natal chart, open My personal reading.'}</p>
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
      <p>{uk?'Західне Сонце':'Western Sun'}: <b>{westernName||'—'}</b>
       {' · '}{uk?'Ведичний Місяць':'Vedic Moon'}: <b>{natalName||'—'}</b>
       {' · '}{uk?'Лагна':'Ascendant'}: <b>{typeof natalLagna==='number'&&natalLagna>=1&&natalLagna<=12?SIGNS[locale][natalLagna-1]:'—'}</b></p>
      {westernName&&<button type="button" className={styles.useNatal} onClick={()=>{changeTradition('western');setSelected(natalSun!);setMode('signs')}}>{uk?'Відкрити західний гороскоп за Сонцем':'Open my Western Sun-sign reading'}: {westernName}</button>}
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
       <p><GlossaryText text={t(x.guidance!.description)} locale={locale}/></p>
       {x.guidance!.action&&<p><strong>{uk?'Практичний крок: ':'Practical step: '}</strong><GlossaryText text={t(x.guidance!.action)} locale={locale}/></p>}
      </article>)}
     </section>}
     <Link href={'/'+locale+'/personal'} className={styles.toPersonal}>
       {uk?'Мій Всесвіт: натальна карта й календар':'Your Universe: birth chart and calendar'} <ArrowRight size={16}/>
     </Link>
    </>}
  </div>}
  <footer className={styles.sources}><BookOpen size={18}/><div>
   <strong>{uk?'Метод і джерела':'Method and sources'}</strong>
   {tradition==='western'&&mode==='signs'?<p>{uk?'Західний режим: прямі тропічні довготи Сонця й Місяця за Swiss Ephemeris; традиційні цілознакові доми від сонячного знака. Редакційні поради є загальними символічними тлумаченнями, а не гарантіями подій.':
    'Western mode: direct Swiss Ephemeris tropical Sun and Moon longitudes; traditional whole-sign houses from the Sun sign. Editorial guidance is symbolic and not an event prediction.'}</p>:
    <><p>{uk?'Астрономічна основа: Swiss Ephemeris, сидеричний зодіак Лагірі. Тлумачення транзитів спираються на традицію Джйотіш, зокрема «Пхаладіпіку», розділ 26.':
    'Astronomical basis: Swiss Ephemeris, Lahiri sidereal zodiac. Transit interpretations draw on classical Jyotish, including Phaladipika, chapter 26.'}</p>
   <a href="https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621598.html" target="_blank" rel="noopener noreferrer">{uk?'Читати першоджерело':'Classical source'}</a></>}
   </div>
  </footer>
 </section>;
}
