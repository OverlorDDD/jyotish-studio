'use client';
import {useEffect,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
import {verifyIntegratedOverview,type CalendarSystem,type ExactDay,
 type SourcePoint,type GuidePhase,type GuideObservance} from '../../lib/panchanga-integration';
import {fetchDayOverview} from '../../lib/panchanga-overview-client';
import styles from './PanchangaHub.module.css';

const FESTIVAL_NAMES:Record<string,[string,string]>={
 ekadashi_sunrise:['Екадаші — тітхі на сході','Ekadashi at sunrise'],
 ekadashi_arunodaya:['Екадаші — арунодая','Ekadashi at Arunodaya'],
 pradosha_trayodashi:['Прадоша','Pradosha'],
 purnima_sunrise:['Пурніма на сході','Purnima at sunrise'],
 amavasya_sunrise:['Амавасья на сході','Amavasya at sunrise'],
 sankranti:['Санкранті','Sankranti'],
 rama_navami:['Рама Навамі','Rama Navami'],
 ganesh_chaturthi:['Ґанеша Чатуртхі','Ganesh Chaturthi'],
 chaitra_navratri:['Чайтра Наваратрі','Chaitra Navratri'],
 sharad_navratri:['Шарад Наваратрі','Sharad Navratri'],
 guru_purnima:['Ґуру Пурніма','Guru Purnima'],
 janmashtami:['Крішна Джанмаштамі','Krishna Janmashtami'],
 maha_shivaratri:['Маха Шиваратрі','Maha Shivaratri'],
 diwali_amavasya:['Дівалі','Diwali']};
const LUNAR_MONTHS:Record<string,[string,string]>={
 Chaitra:['Чайтра','Chaitra'],Vaishakha:['Вайшакха','Vaishakha'],
 Jyeshtha:['Джʼєштха','Jyeshtha'],Ashadha:['Ашадха','Ashadha'],
 Shravana:['Шравана','Shravana'],Bhadrapada:['Бхадрапада','Bhadrapada'],
 Ashwina:['Ашвіна','Ashwina'],Kartika:['Картіка','Kartika'],
 Margashirsha:['Маргашірша','Margashirsha'],Pausha:['Пауша','Pausha'],
 Magha:['Магха','Magha'],Phalguna:['Пхалгуна','Phalguna']};
const PHASE_NAMES:Record<string,[string,string]>={
 new_moon:['Молодик','New Moon'],first_quarter:['Перша чверть','First Quarter'],
 full_moon:['Повня','Full Moon'],last_quarter:['Остання чверть','Last Quarter']};
type Event={key:string;name:string;atUtc:string;category:'phase'|'candidate'|'astronomical';note:string};
const t=(dict:Record<string,[string,string]>,key:string,uk:boolean)=>dict[key]?.[uk?0:1]||key;
const dateFormat=(date:string,zone:string,locale:PortalLocale)=>
 new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',
  {dateStyle:'medium',timeStyle:'short',timeZone:zone}).format(new Date(date));
function eventsFor(phases:GuidePhase[],observances:GuideObservance[],uk:boolean):Event[]{
 return [
  ...phases.map((p,i)=>({key:'phase-'+p.atUtc+i,name:t(PHASE_NAMES,p.kind,uk),atUtc:p.atUtc,
   category:'phase' as const,note:uk?'Точний астрономічний момент':'Exact astronomical instant'})),
  ...observances.map((e,i)=>({key:e.id+e.atUtc+i,name:t(FESTIVAL_NAMES,e.id,uk),atUtc:e.atUtc,
   category:e.category==='astronomical_event'?'astronomical' as const:'candidate' as const,
   note:uk?(e.category==='candidate'?'Календарний кандидат, не підтверджена дата посту':'Точний сидеричний перехід'):
    (e.category==='candidate'?'Calendar candidate, not a certified fasting date':'Exact sidereal transition')}))
 ].sort((a,b)=>a.atUtc.localeCompare(b.atUtc)||a.name.localeCompare(b.name));
}
export default function PanchangaDayGuide({locale,point,day,monthSystem}:{
 locale:PortalLocale;point:SourcePoint;day:ExactDay;monthSystem:CalendarSystem;
}){
 const uk=locale==='uk';
 const [data,setData]=useState<ReturnType<typeof verifyIntegratedOverview>|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 const [retry,setRetry]=useState(0);
 const [kind,setKind]=useState<'all'|'phases'|'observances'>('all');
 useEffect(()=>{
  let alive=true;setStatus('loading');setData(null);
  fetchDayOverview(point,monthSystem,retry)
   .then(payload=>verifyIntegratedOverview(payload,day,point,monthSystem))
   .then(result=>{if(alive){setData(result);setStatus('ready')} })
   .catch(()=>{if(alive)setStatus('error')});
  return()=>{alive=false};
 },[point.date,point.timeZone,point.latitude,point.longitude,day,monthSystem,retry]);
 const events=data?eventsFor(data.phases,data.day.observances,uk).filter(event=>
  kind==='all'||kind==='phases'&&event.category==='phase'||
  kind==='observances'&&event.category!=='phase'):[];
 const monthName=data?.day.moonMonth.name?
  t(LUNAR_MONTHS,data.day.moonMonth.name,uk):null;
 return <section className={styles.guideSection} data-testid="panchanga-integrated-day">
  <header className={styles.guideHeader}>
   <div><h2>{uk?'Події обраного дня':'Events for selected date'}</h2>
    <p>{uk?'У тому самому місці та часовому поясі, що й Панчанга вище':
     'Same observer and time zone as the Panchanga above'} · {point.date} · {point.timeZone}</p>
   </div>
  </header>
  {status==='loading'&&<p role="status" className={styles.guideFeedback}>
   {uk?'Звіряємо фази й календарні події з розрахунком сходу Сонця…':
    'Cross-checking phases and observances against local sunrise…'}</p>}
  {status==='error'&&<div role="alert" className={styles.guideFeedback}>
   {uk?'Не вдалося узгодити календарні дані з цим днем. Події не показуємо, щоб не ввести в оману.':
    'Could not verify calendar events against this day. No unverified events are shown.'}
   <button type="button" onClick={()=>setRetry(n=>n+1)}>{uk?'Повторити':'Retry'}</button>
  </div>}
  {status==='ready'&&data&&<>
   <div className={styles.guideSummary}>
    <span>{uk?'Ведичний місяць':'Vedic month'}: <strong>{monthName??(uk?'Назва потребує звірки':'Name requires review')}</strong></span>
    {data.day.moonMonth.lunarMonthStatus==='adhika'&&<span>{uk?'Адхіка-маса':'Adhika month'}</span>}
    {data.day.moonMonth.lunarMonthStatus==='kshaya_review_required'&&
     <span>{uk?'Особливий місяць — перевірка традиції':'Exceptional month — tradition review'}</span>}
   </div>
   <div className={styles.guideFilters} role="group" aria-label={uk?'Фільтр календарних подій':'Calendar event filter'}>
    {(['all','phases','observances'] as const).map(f=><button type="button" key={f}
     aria-pressed={kind===f} onClick={()=>setKind(f)}>{f==='all'?(uk?'Усі':'All'):
      f==='phases'?(uk?'Фази Місяця':'Moon phases'):(uk?'Свята та переходи':'Observances and ingresses')}</button>)}
   </div>
   {events.length?<ol className={styles.guideEvents}>
    {events.map(e=><li key={e.key} data-kind={e.category}>
     <div><strong>{e.name}</strong><small>{e.note}</small></div>
     <time dateTime={e.atUtc}>{dateFormat(e.atUtc,point.timeZone,locale)}</time>
    </li>)}
   </ol>:<p className={styles.guideFeedback}>{uk?
    'Для цього дня немає подій обраної категорії. П’ять анг на сході Сонця наведені вище.':
    'No events of this category on this date. The five sunrise limbs are shown above.'}</p>}
   <p className={styles.guideFootnote}>{uk?
    'Фази — точні астрономічні моменти за Swiss Ephemeris. Свята позначено як календарні кандидати: їхні остаточні дати, пости та парана залежать від традиції. Показники п’яти анг вище відповідають місцевому сходу Сонця; після опівночі ведичний день може ще тривати.':
    'Moon phases are exact Swiss Ephemeris instants. Festival dates are calendar candidates; final dates, fasts and Parana vary by tradition. Sunrise limbs above refer to local sunrise; the Vedic day can continue past midnight.'}</p>
  </>}
 </section>;
}
