'use client';
import {useCallback,useEffect,useState} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import styles from './PersonalDashboard.module.css';
import {Activity,ArrowRight,BookOpen,CalendarDays,CheckCircle2,Compass,Feather,Heart,History,MoonStar,Orbit,RefreshCcw,Settings2,Sparkles,Sun,Wind} from 'lucide-react';
import {readApiJson} from '../../../lib/api-response';
import {portalPath,type PortalLocale} from '../../../lib/brand';
import {calendarDayLabel} from '../../../lib/personal-date-label';
const PersonalJournal=dynamic(()=>import('../PersonalJournal'),{loading:()=>null});
type ChartSummary={id:string;createdAt:string;date:string;place:string;verified:boolean;recoveryStatus?:'current'|'recovered'|'needs_review'|'temporarily_unavailable';lagnaSign:number|null;lagnaName:string;moonSign:number|null};
type Transit={date:string;sampledAtUtc:string;timeZone:string;method:string;moon:{sign:number;nakshatra:string;pada:number;houseFromLagna:number|null;houseFromMoon:number|null};planets:{name:string;sign:number;houseFromLagna:number|null;houseFromMoon:number|null}[]};
type Day={date:string;moon:Transit['moon'];sampledAtUtc:string};
type TimelineEvent={type:'MAHADASHA_START'|'ANTARDASHA_START';lord:string;atUtc:string;date:string};
type Localized={uk:string;en:string};
type Guidance={headline:Localized;description:Localized;action:Localized;goodFor:Localized;caution:Localized;evidence:{kind:string;method:string;sampledAtUtc?:string;house?:number|null}};
type WeekHighlight={date:string;kind:string;headline:Localized;summary:Localized;action:Localized;goodFor:Localized;caution:Localized;evidence:{method:string;sampledAtUtc?:string}};
type Overview={
 profile:{primaryChartId:string|null;currentTimeZone:string;preferredLocale:string;favoritePractice:string;newsTopics:string[]};
 charts:ChartSummary[];selected:ChartSummary|null;suggestedChartId:string|null;staleSelectedChart:boolean;
 today:string;activeDasha:null|{lord:string;start:string;end:string;antardasha:null|{lord:string;start:string;end:string}};
 transit:Transit|null;transitStatus:string;journey?:{period:Guidance|null;daily:Guidance|null};
 recentTarot:{id:string;createdAt:string;spread:string;question:string|null}[];
 recentJournal:{id:string;kind:string;title:string;createdAt:string}[];
 recentPractices:{id:string;practiceId:string;durationSeconds:number;completedAt:string}[];
 privateQuestions:number;horoscope:{status:string};news:{status:string;topics:string[]};
};
const SIGNS={
 uk:['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'],
 en:['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
};
const PLANETS:Record<string,[string,string]>={Sun:['Сонце','Sun'],Moon:['Місяць','Moon'],Mercury:['Меркурій','Mercury'],Venus:['Венера','Venus'],Mars:['Марс','Mars'],Jupiter:['Юпітер','Jupiter'],Saturn:['Сатурн','Saturn'],Rahu:['Раху','Rahu'],Ketu:['Кету','Ketu']};
const NEWS=[['astronomy','Астрономія','Astronomy'],['jyotish','Джйотіш','Jyotish'],['tarot','Таро','Tarot'],['yoga','Йога','Yoga'],['vedic-traditions','Ведична традиція','Vedic traditions'],['academy','Академія','Academy']] as const;
const PRACTICES=[['box','Квадратне дихання','Box breathing'],['equal','Рівномірне дихання','Equal breathing'],['extended','Подовжений видих','Extended exhale']] as const;
const copy={
 uk:{title:'Твій Всесвіт. Твій шлях.',intro:'Особистий простір твоєї натальної карти, астрологічних циклів, Таро та щоденних практик.',
  start:'Обери головну натальну карту',noChart:'Спочатку збережи свою натальну карту в GalaxiAstro, а потім обери її тут. Карти близьких можна зберігати окремо.',
  newChart:'Створити натальну карту',choose:'Моя основна карта',select:'Обери збережену карту',save:'Зберегти вибір',current:'Мій астрологічний період',
  moon:'Місяць сьогодні',day:'Астрологічні позиції',calendar:'Мій календар',seven:'7 днів',thirty:'30 днів',
  noDasha:'Обери основну карту, щоб побачити свою дашу.',outOfRange:'Поточна дата поза доступним діапазоном даш.',
  recovered:'Карту перевірено повторно. Оригінал залишився без змін.',
  review:'Старий розрахунок відрізняється від актуального. Створи нову карту для оновленого методу.',
  recoveryUnavailable:'Перевірка карти тимчасово недоступна. Повтори пізніше.',verified:'Розраховано за збереженою перевіреною картою',
  positions:'Планетні положення',method:'Спостереження на 12:00 місцевого часу — не точний момент переходу між знаками.',
  tarot:'Моє Таро',tarotAction:'Зробити розклад',questions:'Приватні запитання тарологу',
  yoga:'Моя практика',practiceAction:'Відкрити дихальні практики',recent:'Остання практика',never:'Ще не було',
  journal:'Мій журнал',openJournal:'Відкрити приватні записи',closeJournal:'Сховати журнал',
  horoscope:'Мій персональний гороскоп',later:'Незабаром у Galaxiora',news:'Мої новини',
  newsDescription:'Майбутня добірка перевірених матеріалів за обраними темами, з посиланнями на першоджерела. Особисті записи не використовуються для добору.',
  themes:'Цікаві мені теми',settings:'Налаштування Personal',tz:'Мій поточний часовий пояс (IANA)',
  favorite:'Улюблена дихальна практика',saveSettings:'Зберегти налаштування',
  foundation:'Моя астрологічна основа',goodFor:'Сприятливий фокус',caution:'Не поспішай із',step:'Що зробити сьогодні',todayTitle:'Астрологічний орієнтир на сьогодні',todayLink:'Читати одну пораду на сьогодні',periodDetail:'Як читати свій життєвий цикл',weekFocus:'Сьогодні — в основному орієнтирі; далі — зміни від твоєї натальної карти',weekEmpty:'Немає нових акцентів на цей тиждень.',
  profileSaved:'Налаштування збережено',questionCount:'збережених приватних запитань',account:'Параметри акаунта',
  noTransit:'Це загальні положення Місяця. Для персональних домів обери основну перевірену карту.',ephUnavailable:'Зараз не вдалося отримати астрономічні дані; інші особисті розділи доступні.',
  signedOut:'Увійди через кнопку у шапці, щоб відкрити свій персональний простір.',
  lastTarot:'Останній розклад',noTarot:'Ти ще не робив розкладів.',error:'Не вдалося завантажити Personal. Перевір API й повтори.',
  retry:'Повторити',moonSign:'Знак Місяця',house:'Дім від лагни',asof:'За календарем Galaxiora',
  path:'Мій астрологічний шлях',pathIntro:'Життєвий цикл і сьогоднішній ритм неба — дві опори для щоденної практики.',
   pathPeriod:'Мій життєвий цикл',pathDaily:'Мій орієнтир на сьогодні',
   pathMissing:'Для особистого орієнтиру спочатку обери перевірену натальну карту. Без неї ми показуємо лише астрономічний календар, а не персональні поради.',
   pathDailyMissing:'Положення Місяця сьогодні тимчасово недоступне.',
   advice:'Порада дня',reflect:'Записати спостереження',observe:'Традиційне тлумачення за астрологічними даними, не гарантія майбутніх подій.',
   weekTitle:'Астрологічні акценти тижня',weekSub:'Зміни між полуденними спостереженнями та переходи даш.',
   weekMissing:'Цього тижня нових акцентів не виявлено.',weeklyAction:'Що спробувати',
   noDates:'Календар поки недоступний.',calendarLoading:'Обчислюємо положення планет…',calendarError:'Не вдалося отримати календар. Повтори запит.',general:'Загальні положення Місяця; персональні події з’являться після вибору основної карти.'},
 en:{title:'Your Universe. Your path.',intro:'Your private space for a birth chart, astrological cycles, Tarot and daily practices.',
  start:'Choose your primary birth chart',noChart:'Save a natal chart in GalaxiAstro first, then select it here. Charts for relatives and friends can stay separate.',
  newChart:'Create a birth chart',choose:'My primary chart',select:'Select a saved chart',save:'Save selection',current:'My astrological period',
  moon:'The Moon today',day:'Astrological positions',calendar:'My calendar',seven:'7 days',thirty:'30 days',
  noDasha:'Choose a primary chart to view your Dasha.',outOfRange:'Today is outside the available Dasha timeline.',
  recovered:'Chart reverified; the original is unchanged.',
  review:'This legacy chart differs from the current calculation. Create a new chart to use the latest method.',
  recoveryUnavailable:'Chart verification is temporarily unavailable. Please retry.',verified:'Calculated from a verified saved chart',
  positions:'Planet positions',method:'Observed at 12:00 local time — not an exact sign-ingress time.',
  tarot:'My Tarot',tarotAction:'Draw cards',questions:'Private questions for a reader',
  yoga:'My practice',practiceAction:'Open breathing practices',recent:'Recent practice',never:'Not yet',
  journal:'My journal',openJournal:'Open private notes',closeJournal:'Hide journal',
  horoscope:'My personal horoscope',later:'Coming soon to Galaxiora',news:'My news',
  newsDescription:'A future source-linked collection of verified articles based on your chosen topics. Private journal notes never select news.',
  themes:'My interests',settings:'Personal settings',tz:'My current time zone (IANA)',
  favorite:'Favorite breathing practice',saveSettings:'Save preferences',
  foundation:'My astrological foundation',goodFor:'Useful focus',caution:'Be careful about',step:'What to do today',todayTitle:'Today’s astrological orientation',todayLink:'Open today’s single reading',periodDetail:'Understand your life cycle',weekFocus:'Today has one reading above; upcoming shifts use your saved chart',weekEmpty:'No new highlights for the coming week.',
  profileSaved:'Preferences saved',questionCount:'private saved questions',account:'Account settings',
  noTransit:'These are general Moon positions. Select a verified chart for personalized houses.',ephUnavailable:'Astronomical data is temporarily unavailable; the other personal tools remain accessible.',
  signedOut:'Sign in using the header to access your private personal space.',
  lastTarot:'Most recent reading',noTarot:'No readings yet.',error:'Could not load Personal. Check your API connection and retry.',
  retry:'Retry',moonSign:'Moon sign',house:'House from Lagna',asof:'According to Galaxiora calendar',
  path:'My astrological path',pathIntro:'Your life cycle and the daily sky — two perspectives for meaningful practice.',
   pathPeriod:'My life-cycle theme',pathDaily:'My orientation for today',
   pathMissing:'Select a verified primary birth chart for your personal reading. Without one, we show astronomical calendar positions only, not personal advice.',
   pathDailyMissing:'Today’s lunar positions are temporarily unavailable.',
   advice:'Today’s suggestion',reflect:'Record an observation',observe:'A traditional interpretation grounded in astrological facts, not a guarantee of future events.',
   weekTitle:'Astrological highlights of the week',weekSub:'Changes between noon observations and Dasha transitions.',
   weekMissing:'No new highlighted transitions this week.',weeklyAction:'Something to try',
   noDates:'Calendar temporarily unavailable.',calendarLoading:'Calculating planetary positions…',calendarError:'Could not load the calendar. Please retry.',general:'General Moon positions; personal events appear after selecting a verified primary chart.'}
} as const;
const api=async<T,>(url:string,init?:RequestInit)=>readApiJson<T>(await fetch(url,{credentials:'same-origin',cache:'no-store',...init}));
const json=(body:unknown,method='PATCH'):RequestInit=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
export default function PersonalDashboard({locale}:{locale:PortalLocale}){
 const t=copy[locale],uk=locale==='uk';
 const [overview,setOverview]=useState<Overview|null>(null),[loaded,setLoaded]=useState(false),[signedOut,setSignedOut]=useState(false);
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [chartChoice,setChartChoice]=useState(''),[zone,setZone]=useState('UTC'),[practice,setPractice]=useState('box'),[topics,setTopics]=useState<string[]>([]);
 const [days,setDays]=useState<7|30>(7),[calendar,setCalendar]=useState<Day[]>([]),[events,setEvents]=useState<TimelineEvent[]>([]),[weekHighlights,setWeekHighlights]=useState<WeekHighlight[]>([]),[calendarError,setCalendarError]=useState(''),[calendarStatus,setCalendarStatus]=useState(''),[calendarRetry,setCalendarRetry]=useState(0),[calendarBusy,setCalendarBusy]=useState(false),[journalOpen,setJournalOpen]=useState(false);
 const refresh=useCallback(async()=>{
  setError('');setLoaded(false);
  try{
   const result=await api<Overview>('/api/v1/personal/overview');
   setOverview(result);setSignedOut(false);
   setChartChoice(result.profile.primaryChartId||result.suggestedChartId||'');
   setZone(result.profile.currentTimeZone);setPractice(result.profile.favoritePractice);setTopics(result.profile.newsTopics);
  }catch(e){
   if(e instanceof Error&&/\b401\b|sign in|unauthorized/i.test(e.message)){setSignedOut(true);setOverview(null);}
   else setError(e instanceof Error?e.message:t.error);
  }finally{setLoaded(true);}
 },[t.error]);
 useEffect(()=>{void refresh();const onAuth=()=>{setOverview(null);setCalendar([]);void refresh();};window.addEventListener('galaxiora:auth-changed',onAuth);return()=>window.removeEventListener('galaxiora:auth-changed',onAuth);},[refresh]);
 useEffect(()=>{
  let active=true;
  if(!overview){setCalendar([]);setEvents([]);setWeekHighlights([]);setCalendarError('');return;}
  setCalendarBusy(true);setCalendar([]);setCalendarError('');
  void api<{status:string;days:Day[];events:TimelineEvent[];weekHighlights:WeekHighlight[]}>('/api/v1/personal/calendar?days='+days)
   .then(value=>{if(active){setCalendar(value.days||[]);setEvents(value.events||[]);setWeekHighlights(value.weekHighlights||[]);setCalendarStatus(value.status);}})
   .catch(()=>{if(active){setCalendar([]);setEvents([]);setWeekHighlights([]);setCalendarError(t.calendarError);}})
   .finally(()=>{if(active)setCalendarBusy(false);});
  return()=>{active=false;};
 },[overview?.profile.primaryChartId,overview?.profile.currentTimeZone,overview?.selected?.verified,overview?.selected?.recoveryStatus,overview?.today,days,calendarRetry,t.calendarError]);
 const removePractice=async(id:string)=>{
  if(!confirm(uk?'Видалити запис про завершену практику?':'Delete this completed-practice record?'))return;
  setBusy(true);setError('');
  try{await api('/api/v1/personal/practices/'+encodeURIComponent(id),{method:'DELETE'});await refresh();}
  catch(e){setError(e instanceof Error?e.message:t.error)}
  finally{setBusy(false);}
 };
 const saveChart=async()=>{
  setBusy(true);setError('');setMessage('');
  try{await api('/api/v1/personal/primary-chart',json({chartId:chartChoice||null},'PUT'));await refresh();setMessage(t.profileSaved);}
  catch(e){setError(e instanceof Error?e.message:t.error)}finally{setBusy(false);}
 };
 const saveSettings=async()=>{
  setBusy(true);setError('');setMessage('');
  try{await api('/api/v1/personal/profile',json({currentTimeZone:zone,preferredLocale:locale,favoritePractice:practice,newsTopics:topics}));await refresh();setMessage(t.profileSaved);}
  catch(e){setError(e instanceof Error?e.message:t.error)}finally{setBusy(false);}
 };
 const date=(value:string)=>new Date(value).toLocaleDateString(uk?'uk-UA':'en-US',{day:'numeric',month:'short',year:'numeric',timeZone:overview?.profile.currentTimeZone||'UTC'});
 const sign=(value:number)=>SIGNS[locale][value-1]||'—';
 const lord=(name:string)=>PLANETS[name]?.[uk?0:1]||name;
 const highlight=overview?.transit,chosen=overview?.selected;
 return <section className={styles['gp-layout']} data-testid="personal-dashboard" aria-label="Galaxiora Personal">
  <header className={styles['gp-hero']}>
   <div><span className={styles['gp-eyebrow']}>GALAXIORA · PERSONAL</span><h1>{t.title}</h1><p>{t.intro}</p>
    {overview&&<small className={styles['gp-hero-date']}>{overview.today} · {overview.profile.currentTimeZone}</small>}</div>
   <div className={styles['gp-hero-ornament']} aria-hidden="true"><Sparkles size={88} strokeWidth={.8}/></div>
  </header>
  {!loaded?<div className={[styles['gp-panel'],styles['gp-loading']].join(' ')} role="status">{uk?'Відкриваємо твій простір…':'Opening your space…'}</div>:null}
  {signedOut?<div className={styles['gp-panel']} data-testid="personal-sign-in"><h2>{uk?'Ласкаво просимо':'Welcome'}</h2><p>{t.signedOut}</p></div>:null}
  {error&&<div role="alert" className={styles['gp-error']}>{error} <button type="button" onClick={()=>void refresh()}><RefreshCcw size={16}/>{t.retry}</button></div>}
  {message&&<p role="status" className={styles['gp-success']}><CheckCircle2 size={18}/>{message}</p>}
  {overview&&<>

   <div className={styles['gp-overview-grid']} data-testid="personal-overview-grid">
    <section className={[styles['gp-panel'],styles['gp-primary'],styles['gp-foundation']].join(' ')} data-testid="personal-foundation" aria-label={t.foundation}>
     <div className={styles['gp-panel-heading']}><div><span className={styles['gp-eyebrow']}>NATAL · VIMSHOTTARI · GOCHARA</span><h2>{t.foundation}</h2></div><Compass size={25}/></div>
     <div className={styles['gp-foundation-grid']}>
      <div className={styles['gp-foundation-part']}>
       {chosen?<p className={styles['gp-chart-summary']}><strong>{chosen.place||chosen.date||t.choose}</strong>{uk?'Лагна':'Lagna'}: {chosen.lagnaName}</p>:<p>{t.noChart}</p>}
       <label htmlFor="gp-primary-select">{t.start}
        <select id="gp-primary-select" data-testid="primary-chart-select" value={chartChoice} onChange={e=>setChartChoice(e.target.value)}>
         <option value="">{t.select}</option>
         {overview.charts.map(chart=><option key={chart.id} value={chart.id}>{chart.place||chart.date||chart.id.slice(0,8)} · {chart.date}</option>)}
        </select>
       </label>
       <div className={styles['gp-foundation-actions']}>
        <button className={styles['gp-button']} type="button" disabled={busy||chartChoice===overview.profile.primaryChartId} onClick={()=>void saveChart()}>{t.save}</button>
        <Link href={portalPath(locale,'astrology/jyotish')} className={styles['gp-text-link']}>{t.newChart}<ArrowRight size={14}/></Link>
       </div>
      </div>
      <div className={styles['gp-foundation-part']} data-testid="current-dasha">
       <span className={styles['gp-eyebrow']}>VIMSHOTTARI</span>
       {overview.activeDasha?<><strong className={styles['gp-foundation-value']}>{lord(overview.activeDasha.lord)}{overview.activeDasha.antardasha?' · '+lord(overview.activeDasha.antardasha.lord):''}</strong>
        <small>{date(overview.activeDasha.start)} — {date(overview.activeDasha.end)}</small>
        <Link href={portalPath(locale,'learn/vimshottari-life-cycle')} className={styles['gp-text-link']}>{t.periodDetail}<ArrowRight size={14}/></Link>
       </>:<p>{chosen?(chosen.recoveryStatus==='needs_review'?t.review:chosen.recoveryStatus==='temporarily_unavailable'?t.recoveryUnavailable:chosen.verified?t.outOfRange:t.noDasha):t.noDasha}</p>}
      </div>
      <div className={styles['gp-foundation-part']} data-testid="moon-transit">
       <span className={styles['gp-eyebrow']}>GOCHARA · {overview.today}</span>
       {highlight?<><strong className={styles['gp-foundation-value']}>{sign(highlight.moon.sign)}</strong>
        <small>{highlight.moon.nakshatra} · {uk?'пада':'pada'} {highlight.moon.pada}{highlight.moon.houseFromLagna!=null?' · '+t.house+': '+highlight.moon.houseFromLagna:''}</small>
        <a href="#astrological-path" className={styles['gp-text-link']}>{t.todayTitle}<ArrowRight size={14}/></a>
       </>:<p>{overview.transitStatus==='ephemeris_unavailable'?t.ephUnavailable:t.noTransit}</p>}
      </div>
     </div>
     {chosen?.recoveryStatus==='recovered'&&<small>{t.recovered}</small>}
     {chosen?.recoveryStatus==='needs_review'&&<p role="status" className={styles['gp-notice']}>{t.review}</p>}
     {chosen?.recoveryStatus==='temporarily_unavailable'&&<p role="status" className={styles['gp-notice']}>{t.recoveryUnavailable}</p>}
     {overview.staleSelectedChart&&<p className={styles['gp-notice']}>{uk?'Обрану карту видалено. Вибери іншу.':'Your selected chart was removed. Choose another.'}</p>}
    </section>
   </div>
   <section id="astrological-path" className={[styles['gp-panel'],styles['gp-path']].join(' ')} data-testid="astrological-path" aria-label={t.path}>
    <div className={styles['gp-panel-heading']}><div><span className={styles['gp-eyebrow']}>TODAY · GOCHARA</span><h2>{t.todayTitle}</h2></div><MoonStar size={27}/></div>
    <article className={styles['gp-daily-focus']} data-testid="journey-daily">
     {overview.journey?.daily?<><h3>{overview.journey.daily.headline[locale]}</h3>
      <p>{overview.journey.daily.description[locale]}</p>
      <div className={styles['gp-daily-matrix']} data-testid="daily-advice">
       <div><span>{t.goodFor}</span><p>{overview.journey.daily.goodFor[locale]}</p></div>
       <div><span>{t.caution}</span><p>{overview.journey.daily.caution[locale]}</p></div>
       <div className={styles['gp-daily-step']}><span>{t.step}</span><p>{overview.journey.daily.action[locale]}</p></div>
      </div>
      <a href="#personal-journal" className={styles['gp-text-link']} onClick={()=>setJournalOpen(true)}>{t.reflect}<ArrowRight size={15}/></a>
     </>:<p>{!chosen?.verified?t.pathMissing:t.pathDailyMissing}</p>}
    </article>
    {overview.journey?.period&&<details className={styles['gp-period-detail']} data-testid="journey-period">
     <summary>{t.periodDetail} · {overview.journey.period.headline[locale]}</summary>
     <p>{overview.journey.period.description[locale]}</p>
    </details>}
   </section>
   <section className={styles['gp-panel']} data-testid="personal-calendar">
    <div className={styles['gp-panel-heading']}><div><span className={styles['gp-eyebrow']}>LUNAR PATH</span><h2>{t.calendar}</h2></div><CalendarDays size={26}/></div>
    <div className={styles['gp-tabs']} role="group" aria-label={t.calendar}>
     {([7,30] as const).map(n=><button type="button" key={n} aria-pressed={days===n} onClick={()=>setDays(n)}>{n===7?t.seven:t.thirty}</button>)}
    </div>
    {calendarBusy?<p role="status">{t.calendarLoading}</p>:calendarError?<p role="alert">{calendarError} <button type="button" onClick={()=>setCalendarRetry(x=>x+1)}>{t.retry}</button></p>:!calendar.length?<p>{t.noDates}</p>:
     <div className={styles['gp-calendar-grid']}>{calendar.map(day=><div className={[styles['gp-calendar-day'],day.date===overview.today?styles['gp-calendar-today']:''].filter(Boolean).join(' ')} key={day.date} data-today={day.date===overview.today?'true':undefined} aria-current={day.date===overview.today?'date':undefined} title={t.method}>
      <small>{calendarDayLabel(day.date,overview.today,locale)}</small><MoonStar size={18}/><strong>{sign(day.moon.sign)}</strong>
      <span>{day.moon.nakshatra}</span>
      {events.filter(e=>e.date===day.date).map((e,i)=><em className={styles['gp-event-tag']} key={e.type+i}>{e.type==='MAHADASHA_START'?(uk?'Махадаша':'Major period'):(uk?'Антардаша':'Subperiod')} · {lord(e.lord)}</em>)}
     </div>)}</div>}

 
   {!calendarBusy&&!calendarError&&calendar.length>0&&<section className={styles['gp-week-section']} data-testid="week-highlights" aria-label={t.weekTitle}>
    <div className={styles['gp-week-heading']}><h3>{t.weekTitle}</h3><small>{t.weekFocus}</small></div>
    {weekHighlights.length?<ol className={styles['gp-week-list']}>{weekHighlights.map((h,i)=><li key={h.date+h.kind+i}>
     <time dateTime={h.date} className={h.date===overview.today?styles['gp-week-today']:undefined}>{calendarDayLabel(h.date,overview.today,locale)}</time>
     {h.date===overview.today?<div data-testid="week-today-link">
       <strong>{h.headline[locale]}</strong>
       <a href="#astrological-path" className={styles['gp-text-link']}>{t.todayLink}<ArrowRight size={15}/></a>
      </div>:<div>
       <strong>{h.headline[locale]}</strong><p>{h.summary[locale]}</p>
       {h.kind==='DASHA_START'?<p className={styles['gp-microcopy']}>{uk?'Перехід даші за перевіреною картою.':'Dasha transition according to your verified chart.'}</p>:
        <div className={styles['gp-week-insights']}><p><b>{t.goodFor}: </b>{h.goodFor[locale]}</p><p><b>{t.caution}: </b>{h.caution[locale]}</p></div>}
       {h.kind!=='DASHA_START'&&<small><b>{uk?'Ідея на цей день':'An idea for this day'}: </b>{h.action[locale]}</small>}
      </div>}
    </li>)}</ol>:<p>{!chosen?.verified?t.pathMissing:t.weekEmpty}</p>}
   </section>}
   <p className={styles['gp-microcopy']}>{calendarStatus==='general'?t.general:t.method}</p>
   </section>
   <div className={styles['gp-grid']}>
    <section className={styles['gp-panel']}>
     <div className={styles['gp-panel-heading']}><div><span className={styles['gp-eyebrow']}>TAROT</span><h2>{t.tarot}</h2></div><Sparkles size={26}/></div>
     {overview.recentTarot.length?<ul className={styles['gp-reading-list']}>{overview.recentTarot.map(x=><li key={x.id}>
       <span className={styles['gp-reading-meta']}>{x.spread} · {date(x.createdAt)}</span>{x.question&&<strong>{x.question}</strong>}</li>)}</ul>:<p>{t.noTarot}</p>}
     <Link href={portalPath(locale,'tarot')} className={styles['gp-text-link']}>{t.tarotAction} <ArrowRight size={14}/></Link>
     <p className={styles['gp-microcopy']}>{t.questions}: {overview.privateQuestions} · {uk?'Щоденний ліміт не витрачається автоматично.':'Daily limits are never used automatically.'}</p>
    </section>
    <section className={styles['gp-panel']}>
     <div className={styles['gp-panel-heading']}><div><span className={styles['gp-eyebrow']}>YOGA</span><h2>{t.yoga}</h2></div><Wind size={26}/></div>
     <p className={styles['gp-practice-feature']}>{PRACTICES.find(p=>p[0]===overview.profile.favoritePractice)?.[uk?1:2]||t.never}</p>
     <p className={styles['gp-microcopy']}>{t.recent}: {overview.recentPractices.length?date(overview.recentPractices[0].completedAt):t.never}</p>
     {overview.recentPractices.length>0&&<ul className={styles['gp-practice-list']}>{overview.recentPractices.map(s=>
      <li key={s.id}><span>{s.practiceId} · {Math.round(s.durationSeconds/60)} {uk?'хв':'min'} · {date(s.completedAt)}</span>
       <button type="button" disabled={busy} aria-label={uk?'Видалити запис практики':'Delete practice record'} onClick={()=>void removePractice(s.id)}>{uk?'Видалити':'Delete'}</button></li>)}</ul>}
     <Link href={portalPath(locale,'yoga/gentle-breath')} className={styles['gp-text-link']}>{t.practiceAction} <ArrowRight size={14}/></Link>
    </section>
   </div>
   <section id="personal-journal" className={[styles['gp-panel'],styles['gp-journal-preview']].join(' ')}>
    <div className={styles['gp-panel-heading']}><div><span className={styles['gp-eyebrow']}>REFLECTION</span><h2>{t.journal}</h2></div><BookOpen size={26}/></div>
    <p>{overview.recentJournal.length?overview.recentJournal.map(x=>x.title).join(' · '):(uk?'Перший запис може початися сьогодні.':'Your first entry can begin today.')}</p>
    <button type="button" className={styles['gp-button']} onClick={()=>setJournalOpen(v=>!v)} aria-expanded={journalOpen}>
     {journalOpen?t.closeJournal:t.openJournal}</button>
    {journalOpen&&<PersonalJournal locale={locale}/>}
   </section>
   <div className={[styles['gp-grid'],styles['gp-future-grid']].join(' ')}>
    <section className={[styles['gp-panel'],styles['gp-future']].join(' ')} aria-label={t.horoscope}>
     <div className={styles['gp-panel-heading']}><div><span className={styles['gp-eyebrow']}>GALAXIHOROSCOPE</span><h2>{t.horoscope}</h2></div><Orbit size={25}/></div>
     <p>{t.later}</p><span className={styles['gp-future-status']}>{uk?'Місце зарезервовано':'Reserved for a future module'}</span>
    </section>
    <section className={[styles['gp-panel'],styles['gp-future']].join(' ')}>
     <div className={styles['gp-panel-heading']}><div><span className={styles['gp-eyebrow']}>PERSONAL NEWS</span><h2>{t.news}</h2></div><Feather size={25}/></div>
     <p>{t.newsDescription}</p><p className={styles['gp-microcopy']}>{t.later}</p>
    </section>
   </div>
   <details className={[styles['gp-panel'],styles['gp-settings']].join(' ')} data-testid="personal-settings">
    <summary className={styles['gp-panel-heading']}><div><span className={styles['gp-eyebrow']}>PREFERENCES</span><h2>{t.settings}</h2></div><Settings2 size={26}/></summary>
    <div className={styles['gp-settings-fields']}>
     <label htmlFor="gp-zone">{t.tz}<input id="gp-zone" value={zone} maxLength={64} onChange={e=>setZone(e.target.value)} placeholder="Europe/Kyiv"/></label>
     <label htmlFor="gp-practice">{t.favorite}<select id="gp-practice" value={practice} onChange={e=>setPractice(e.target.value)}>
      {PRACTICES.map(p=><option value={p[0]} key={p[0]}>{p[uk?1:2]}</option>)}</select></label>
    </div>
    <fieldset className={styles['gp-interests']}><legend>{t.themes}</legend>
     {NEWS.map(([id,ua,en])=><label key={id}><input type="checkbox" checked={topics.includes(id)} onChange={e=>setTopics(v=>e.target.checked?[...v,id]:v.filter(x=>x!==id))}/>{uk?ua:en}</label>)}
    </fieldset>
    <div className={styles['gp-settings-actions']}><button type="button" disabled={busy} className={styles['gp-button']} onClick={()=>void saveSettings()}>{t.saveSettings}</button>
     <Link href={portalPath(locale,'account')} className={styles['gp-text-link']}>{t.account} <ArrowRight size={14}/></Link></div>
   </details>
  </>}
 </section>;
}
