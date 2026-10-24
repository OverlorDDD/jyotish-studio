'use client';
import {useCallback,useEffect,useState} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {Activity,ArrowRight,BookOpen,CalendarDays,CheckCircle2,Compass,Feather,Heart,History,MoonStar,Orbit,RefreshCcw,Settings2,Sparkles,Sun,Wind} from 'lucide-react';
import {readApiJson} from '../../../lib/api-response';
import {portalPath,type PortalLocale} from '../../../lib/brand';
const PersonalJournal=dynamic(()=>import('../PersonalJournal'),{loading:()=>null});
type ChartSummary={id:string;createdAt:string;date:string;place:string;verified:boolean;lagnaSign:number|null;lagnaName:string;moonSign:number|null};
type Transit={date:string;sampledAtUtc:string;timeZone:string;method:string;moon:{sign:number;nakshatra:string;pada:number;houseFromLagna:number;houseFromMoon:number};planets:{name:string;sign:number;houseFromLagna:number;houseFromMoon:number}[]};
type Day={date:string;moon:Transit['moon'];sampledAtUtc:string};
type Overview={
 profile:{primaryChartId:string|null;currentTimeZone:string;preferredLocale:string;favoritePractice:string;newsTopics:string[]};
 charts:ChartSummary[];selected:ChartSummary|null;suggestedChartId:string|null;staleSelectedChart:boolean;
 today:string;activeDasha:null|{lord:string;start:string;end:string;antardasha:null|{lord:string;start:string;end:string}};
 transit:Transit|null;transitStatus:string;
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
  noDasha:'Період ще не визначено',verified:'Розраховано за збереженою перевіреною картою',
  positions:'Планетні положення',method:'Спостереження на 12:00 місцевого часу — не точний момент переходу між знаками.',
  tarot:'Моє Таро',tarotAction:'Зробити розклад',questions:'Приватні запитання тарологу',
  yoga:'Моя практика',practiceAction:'Відкрити дихальні практики',recent:'Остання практика',never:'Ще не було',
  journal:'Мій журнал',openJournal:'Відкрити приватні записи',closeJournal:'Сховати журнал',
  horoscope:'Мій персональний гороскоп',later:'Майбутній модуль — після публічного запуску',news:'Мої новини',
  newsDescription:'Майбутня добірка перевірених матеріалів за обраними темами, з посиланнями на першоджерела. Особисті записи не використовуються для добору.',
  themes:'Цікаві мені теми',settings:'Налаштування Personal',tz:'Мій поточний часовий пояс (IANA)',
  favorite:'Улюблена дихальна практика',saveSettings:'Зберегти налаштування',
  profileSaved:'Налаштування збережено',questionCount:'збережених приватних запитань',account:'Параметри акаунта',
  noTransit:'Потрібна перевірена основна карта для персональних транзитів.',ephUnavailable:'Зараз не вдалося отримати астрономічні дані; інші особисті розділи доступні.',
  signedOut:'Увійди через кнопку у шапці, щоб відкрити свій персональний простір.',
  lastTarot:'Останній розклад',noTarot:'Ти ще не робив розкладів.',error:'Не вдалося завантажити Personal. Перевір API й повтори.',
  retry:'Повторити',moonSign:'Знак Місяця',house:'Дім від лагни',asof:'За календарем Galaxiora',
  noDates:'Оберіть основну карту для календаря.',calendarLoading:'Обчислюємо положення планет…'},
 en:{title:'Your Universe. Your path.',intro:'Your private space for a birth chart, astrological cycles, Tarot and daily practices.',
  start:'Choose your primary birth chart',noChart:'Save a natal chart in GalaxiAstro first, then select it here. Charts for relatives and friends can stay separate.',
  newChart:'Create a birth chart',choose:'My primary chart',select:'Select a saved chart',save:'Save selection',current:'My astrological period',
  moon:'The Moon today',day:'Astrological positions',calendar:'My calendar',seven:'7 days',thirty:'30 days',
  noDasha:'No active period available',verified:'Calculated from a verified saved chart',
  positions:'Planet positions',method:'Observed at 12:00 local time — not an exact sign-ingress time.',
  tarot:'My Tarot',tarotAction:'Draw cards',questions:'Private questions for a reader',
  yoga:'My practice',practiceAction:'Open breathing practices',recent:'Recent practice',never:'Not yet',
  journal:'My journal',openJournal:'Open private notes',closeJournal:'Hide journal',
  horoscope:'My personal horoscope',later:'Future module — after public launch',news:'My news',
  newsDescription:'A future source-linked collection of verified articles based on your chosen topics. Private journal notes never select news.',
  themes:'My interests',settings:'Personal settings',tz:'My current time zone (IANA)',
  favorite:'Favorite breathing practice',saveSettings:'Save preferences',
  profileSaved:'Preferences saved',questionCount:'private saved questions',account:'Account settings',
  noTransit:'A verified primary chart is required for personal transits.',ephUnavailable:'Astronomical data is temporarily unavailable; the other personal tools remain accessible.',
  signedOut:'Sign in using the header to access your private personal space.',
  lastTarot:'Most recent reading',noTarot:'No readings yet.',error:'Could not load Personal. Check your API connection and retry.',
  retry:'Retry',moonSign:'Moon sign',house:'House from Lagna',asof:'According to Galaxiora calendar',
  noDates:'Choose a primary chart for your calendar.',calendarLoading:'Calculating planetary positions…'}
} as const;
const api=async<T,>(url:string,init?:RequestInit)=>readApiJson<T>(await fetch(url,{credentials:'same-origin',cache:'no-store',...init}));
const json=(body:unknown,method='PATCH'):RequestInit=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
export default function PersonalDashboard({locale}:{locale:PortalLocale}){
 const t=copy[locale],uk=locale==='uk';
 const [overview,setOverview]=useState<Overview|null>(null),[loaded,setLoaded]=useState(false),[signedOut,setSignedOut]=useState(false);
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [chartChoice,setChartChoice]=useState(''),[zone,setZone]=useState('UTC'),[practice,setPractice]=useState('box'),[topics,setTopics]=useState<string[]>([]);
 const [days,setDays]=useState<7|30>(7),[calendar,setCalendar]=useState<Day[]>([]),[calendarBusy,setCalendarBusy]=useState(false),[journalOpen,setJournalOpen]=useState(false);
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
  if(!overview?.selected?.verified){setCalendar([]);return;}
  setCalendarBusy(true);setCalendar([]);
  void api<{status:string;days:Day[]}>('/api/v1/personal/calendar?days='+days)
   .then(value=>{if(active)setCalendar(value.days||[]);})
   .catch(()=>{if(active)setCalendar([]);})
   .finally(()=>{if(active)setCalendarBusy(false);});
  return()=>{active=false;};
 },[overview?.profile.primaryChartId,overview?.profile.currentTimeZone,overview?.selected?.verified,days]);
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
 return <section className="gp-layout" data-testid="personal-dashboard" aria-label="Galaxiora Personal">
  <header className="gp-hero">
   <div><span className="gp-eyebrow">GALAXIORA · PERSONAL</span><h1>{t.title}</h1><p>{t.intro}</p>
    {overview&&<small className="gp-hero-date">{overview.today} · {overview.profile.currentTimeZone}</small>}</div>
   <div className="gp-hero-ornament" aria-hidden="true"><Orbit size={100} strokeWidth={.55}/><MoonStar size={31}/></div>
  </header>
  {!loaded?<div className="gp-panel gp-loading" role="status">{uk?'Відкриваємо твій простір…':'Opening your space…'}</div>:null}
  {signedOut?<div className="gp-panel" data-testid="personal-sign-in"><h2>{uk?'Ласкаво просимо':'Welcome'}</h2><p>{t.signedOut}</p></div>:null}
  {error&&<div role="alert" className="gp-error">{error} <button type="button" onClick={()=>void refresh()}><RefreshCcw size={16}/>{t.retry}</button></div>}
  {message&&<p role="status" className="gp-success"><CheckCircle2 size={18}/>{message}</p>}
  {overview&&<>
   <section className="gp-panel gp-primary" aria-label={t.choose}>
    <div className="gp-panel-heading"><div><span className="gp-eyebrow">01 / NATAL</span><h2>{t.choose}</h2></div><Compass size={25}/></div>
    {chosen?<p className="gp-chart-summary"><strong>{chosen.place||chosen.date||t.choose}</strong> · {uk?'Лагна':'Lagna'} {chosen.lagnaName}</p>:<p>{t.noChart}</p>}
    <div className="gp-form-inline">
     <label htmlFor="gp-primary-select">{t.start}
      <select id="gp-primary-select" data-testid="primary-chart-select" value={chartChoice} onChange={e=>setChartChoice(e.target.value)}>
       <option value="">{t.select}</option>
       {overview.charts.map(c=><option key={c.id} value={c.id}>{c.place||c.date||c.id.slice(0,8)} · {c.date}</option>)}
      </select></label>
     <button className="gp-button" type="button" disabled={busy||chartChoice===overview.profile.primaryChartId} onClick={()=>void saveChart()}>{t.save}</button>
    </div>
    <Link href={portalPath(locale,'astrology/jyotish')} className="gp-text-link">{t.newChart} <ArrowRight size={15}/></Link>
    {overview.staleSelectedChart&&<p className="gp-notice">{uk?'Обрану карту видалено. Вибери іншу.':'Your selected chart was removed. Choose another.'}</p>}
   </section>
   <div className="gp-grid">
    <section className="gp-panel" data-testid="current-dasha">
     <div className="gp-panel-heading"><div><span className="gp-eyebrow">VIMSHOTTARI</span><h2>{t.current}</h2></div><Sun size={26}/></div>
     {overview.activeDasha?<><strong className="gp-feature-name">{lord(overview.activeDasha.lord)}</strong>
      <p>{date(overview.activeDasha.start)} — {date(overview.activeDasha.end)}</p>
      {overview.activeDasha.antardasha&&<p className="gp-pill">{lord(overview.activeDasha.antardasha.lord)} · {date(overview.activeDasha.antardasha.start)} — {date(overview.activeDasha.antardasha.end)}</p>}
      <small>{t.asof} · 365.2425 {uk?'днів/рік':'days/year'}</small>
     </>:<p>{t.noDasha}</p>}
     <Link href={portalPath(locale,'astrology/jyotish')+'#timeline'} className="gp-text-link">{uk?'Детальніше про даші':'Explore Dashas'} <ArrowRight size={14}/></Link>
    </section>
    <section className="gp-panel" data-testid="moon-transit">
     <div className="gp-panel-heading"><div><span className="gp-eyebrow">GOCHARA</span><h2>{t.moon}</h2></div><MoonStar size={26}/></div>
     {highlight?<><strong className="gp-feature-name">{sign(highlight.moon.sign)}</strong>
      <p>{highlight.moon.nakshatra} · {uk?'пада':'pada'} {highlight.moon.pada}</p>
      <p className="gp-pill">{t.house}: {highlight.moon.houseFromLagna}</p>
      <small>{t.method}</small></>:<p>{overview.transitStatus==='ephemeris_unavailable'?t.ephUnavailable:t.noTransit}</p>}
    </section>
   </div>
   <section className="gp-panel" data-testid="personal-calendar">
    <div className="gp-panel-heading"><div><span className="gp-eyebrow">LUNAR PATH</span><h2>{t.calendar}</h2></div><CalendarDays size={26}/></div>
    <div className="gp-tabs" role="group" aria-label={t.calendar}>
     {([7,30] as const).map(n=><button type="button" key={n} aria-pressed={days===n} onClick={()=>setDays(n)}>{n===7?t.seven:t.thirty}</button>)}
    </div>
    {calendarBusy?<p role="status">{t.calendarLoading}</p>:!calendar.length?<p>{t.noDates}</p>:
     <div className="gp-calendar-grid">{calendar.map(day=><div className="gp-calendar-day" key={day.date} title={t.method}>
      <small>{day.date.slice(5)}</small><MoonStar size={18}/><strong>{sign(day.moon.sign)}</strong>
      <span>{day.moon.nakshatra}</span>
     </div>)}</div>}
    <p className="gp-microcopy">{t.method}</p>
   </section>
   <div className="gp-grid">
    <section className="gp-panel">
     <div className="gp-panel-heading"><div><span className="gp-eyebrow">TAROT</span><h2>{t.tarot}</h2></div><Sparkles size={26}/></div>
     {overview.recentTarot.length?<p>{t.lastTarot}: {date(overview.recentTarot[0].createdAt)} · {overview.recentTarot[0].spread}</p>:<p>{t.noTarot}</p>}
     <Link href={portalPath(locale,'tarot')} className="gp-text-link">{t.tarotAction} <ArrowRight size={14}/></Link>
     <p className="gp-microcopy">{t.questions}: {overview.privateQuestions} · {uk?'Щоденний ліміт не витрачається автоматично.':'Daily limits are never used automatically.'}</p>
    </section>
    <section className="gp-panel">
     <div className="gp-panel-heading"><div><span className="gp-eyebrow">YOGA</span><h2>{t.yoga}</h2></div><Wind size={26}/></div>
     <p>{t.favorite}: {PRACTICES.find(p=>p[0]===overview.profile.favoritePractice)?.[uk?1:2]}</p>
     <p className="gp-microcopy">{t.recent}: {overview.recentPractices.length?date(overview.recentPractices[0].completedAt):t.never}</p>
     <Link href={portalPath(locale,'yoga/gentle-breath')} className="gp-text-link">{t.practiceAction} <ArrowRight size={14}/></Link>
    </section>
   </div>
   <section className="gp-panel gp-journal-preview">
    <div className="gp-panel-heading"><div><span className="gp-eyebrow">REFLECTION</span><h2>{t.journal}</h2></div><BookOpen size={26}/></div>
    <p>{overview.recentJournal.length?overview.recentJournal.map(x=>x.title).join(' · '):(uk?'Перший запис може початися сьогодні.':'Your first entry can begin today.')}</p>
    <button type="button" className="gp-button" onClick={()=>setJournalOpen(v=>!v)} aria-expanded={journalOpen}>
     {journalOpen?t.closeJournal:t.openJournal}</button>
    {journalOpen&&<PersonalJournal locale={locale}/>}
   </section>
   <div className="gp-grid gp-future-grid">
    <section className="gp-panel gp-future" aria-label={t.horoscope}>
     <div className="gp-panel-heading"><div><span className="gp-eyebrow">GALAXIHOROSCOPE</span><h2>{t.horoscope}</h2></div><Orbit size={25}/></div>
     <p>{t.later}</p><span className="gp-future-status">{uk?'Місце зарезервовано':'Reserved for a future module'}</span>
    </section>
    <section className="gp-panel gp-future">
     <div className="gp-panel-heading"><div><span className="gp-eyebrow">PERSONAL NEWS</span><h2>{t.news}</h2></div><Feather size={25}/></div>
     <p>{t.newsDescription}</p><p className="gp-microcopy">{t.later}</p>
    </section>
   </div>
   <section className="gp-panel gp-settings">
    <div className="gp-panel-heading"><div><span className="gp-eyebrow">PREFERENCES</span><h2>{t.settings}</h2></div><Settings2 size={26}/></div>
    <div className="gp-settings-fields">
     <label htmlFor="gp-zone">{t.tz}<input id="gp-zone" value={zone} maxLength={64} onChange={e=>setZone(e.target.value)} placeholder="Europe/Kyiv"/></label>
     <label htmlFor="gp-practice">{t.favorite}<select id="gp-practice" value={practice} onChange={e=>setPractice(e.target.value)}>
      {PRACTICES.map(p=><option value={p[0]} key={p[0]}>{p[uk?1:2]}</option>)}</select></label>
    </div>
    <fieldset className="gp-interests"><legend>{t.themes}</legend>
     {NEWS.map(([id,ua,en])=><label key={id}><input type="checkbox" checked={topics.includes(id)} onChange={e=>setTopics(v=>e.target.checked?[...v,id]:v.filter(x=>x!==id))}/>{uk?ua:en}</label>)}
    </fieldset>
    <div className="gp-settings-actions"><button type="button" disabled={busy} className="gp-button" onClick={()=>void saveSettings()}>{t.saveSettings}</button>
     <Link href={portalPath(locale,'account')} className="gp-text-link">{t.account} <ArrowRight size={14}/></Link></div>
   </section>
  </>}
 </section>;
}
