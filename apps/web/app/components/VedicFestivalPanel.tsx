'use client';
import {useEffect,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
import styles from './VedicFestivalPanel.module.css';
import GlossaryText from './GlossaryText';

type Point={date:string;timeZone:string;latitude:string;longitude:string};
type MonthSystem='amanta'|'purnimanta';
type Observance={id:'ekadashi_sunrise'|'ekadashi_arunodaya'|'pradosha_trayodashi'|
 'purnima_sunrise'|'amavasya_sunrise'|'sankranti'|
 'rama_navami'|'ganesh_chaturthi'|'chaitra_navratri'|'sharad_navratri'|
 'guru_purnima'|'janmashtami'|'maha_shivaratri'|'diwali_amavasya';
 atUtc:string;category:'candidate'|'astronomical_event';rule:string;metadata?:Record<string,string|number|boolean>};
type Window={startUtc:string;endUtc:string;weekdayCaution:string|null};
type FestivalDay={date:string;sunriseUtc:string;sunsetUtc:string;tithi:number;arunodayaTithi:number;
 moonMonth:{name:string|null;amantaName:string|null;lunarMonthStatus:string;purnimantaKrishnaShiftApplied:boolean};
 observances:Observance[];windows:{abhijit:Window}};
type Response={version:string;monthSystem:MonthSystem;days:FestivalDay[];
 observer:{timeZone:string};astronomicalTimeCertifiedByIndependentReference:boolean;
 observanceDayCertifiedByTradition:boolean};
const T={
 uk:{title:'Ведичний календар · 7 днів',intro:'Тітхі на сході Сонця, Екадаші, Прадоша, місячні дні, Санкранті й Абхіджіт-мухурта. Кожна позначка має конкретне правило визначення.',
 amanta:'Аманта (місяць до молодика)',purnimanta:'Пурніманта (місяць до повні)',month:'Місяць за ведичним календарем',
 loading:'Розраховуємо 7 днів за Swiss Ephemeris…',error:'Немає перевірених даних для цього місця й періоду. Перевір час, координати та Swiss Ephemeris.',
 retry:'Повторити',tithi:'Тітхі на сході',none:'Немає позначених особливих днів',abhijit:'Абхіджіт-мухурта',
 wed:'У середу за традицією цей період не рекомендують розглядати як універсально сприятливий',
 ekadashi_sunrise:'Екадаші — тітхі на сході',ekadashi_arunodaya:'Екадаші на арунодаї',
 pradosha_trayodashi:'Прадоша — трайодаші після заходу',
 purnima_sunrise:'Повня — тітхі на сході',amavasya_sunrise:'Амавасья — тітхі на сході',
 sankranti:'Санкранті — вхід Сонця у знак',
 rama_navami:'Рама Навамі · опівдні',ganesh_chaturthi:'Ґанеша Чатуртхі · опівдні',
 chaitra_navratri:'Чайтра Наваратрі · початок',sharad_navratri:'Шарад Наваратрі · початок',
 guru_purnima:'Ґуру Пурніма',janmashtami:'Крішна Джанмаштамі · ніч',
 maha_shivaratri:'Маха Шиваратрі · ніч',diwali_amavasya:'Дівалі · амавасья ввечері',candidate:'Календарна традиція',
 moment:'Астрономічний момент',adhika:'Адхіка-маса',regular:'Звичайний місяць',
 kshaya:'Особливий місяць: назва потребує окремої звірки',
 warning:'Дати ведичних свят залежать від місячного календаря, місцевості й традиції. Для постів і часу парани дотримуйся календаря своєї духовної школи.',
 info:'Аманта й пурніманта використовують ті самі астрономічні дані, але можуть інакше називати темну половину місяця. Межі адхіка-маси визначаються за кількістю сидеричних сонячних переходів між молодиками.'},
 en:{title:'Vedic calendar · 7 days',intro:'Sunrise tithi, Ekadashi, Pradosha, lunar observance indicators, Sankranti and Abhijit Muhurta. Each marker has an explicit calculation rule.',
 amanta:'Amanta (new-moon ending)',purnimanta:'Purnimanta (full-moon ending)',month:'Lunar month',
 loading:'Calculating 7 days using Swiss Ephemeris…',error:'Verified calendar data are unavailable. Check time zone, place and Swiss Ephemeris.',
 retry:'Retry',tithi:'Tithi at sunrise',none:'No special day indicators in this period',abhijit:'Abhijit Muhurta',
 wed:'Traditional caution: Wednesday Abhijit is not a universal auspicious election',
 ekadashi_sunrise:'Ekadashi at sunrise',ekadashi_arunodaya:'Ekadashi at Arunodaya',
 pradosha_trayodashi:'Pradosha — Trayodashi after sunset',
 purnima_sunrise:'Purnima at sunrise',amavasya_sunrise:'Amavasya at sunrise',
 sankranti:'Sankranti — sidereal solar ingress',
 rama_navami:'Rama Navami · midday',ganesh_chaturthi:'Ganesh Chaturthi · midday',
 chaitra_navratri:'Chaitra Navratri · beginning',sharad_navratri:'Sharad Navratri · beginning',
 guru_purnima:'Guru Purnima',janmashtami:'Krishna Janmashtami · night',
 maha_shivaratri:'Maha Shivaratri · night',diwali_amavasya:'Diwali · evening Amavasya',candidate:'Traditional observance',
 moment:'Astronomical instant',adhika:'Adhika month',regular:'Ordinary lunar month',
 kshaya:'Exceptional month: name requires additional reference review',
 warning:`Vedic festival dates vary by place and tradition. For fasting and Parana, follow the calendar of your spiritual community.`,
 info:'Amanta and Purnimanta share the same astronomy but may label the waning fortnight differently. Adhika months are detected from sidereal solar ingresses between consecutive New Moons.'}
} as const;
const monthNames:Record<string,[string,string]>={
 Chaitra:['Чайтра','Chaitra'],Vaishakha:['Вайшакха','Vaishakha'],Jyeshtha:['Джʼєштха','Jyeshtha'],
 Ashadha:['Ашадха','Ashadha'],Shravana:['Шравана','Shravana'],Bhadrapada:['Бхадрапада','Bhadrapada'],
 Ashwina:['Ашвіна','Ashwina'],Kartika:['Картіка','Kartika'],Margashirsha:['Маргашірша','Margashirsha'],
 Pausha:['Пауша','Pausha'],Magha:['Магха','Magha'],Phalguna:['Пхалгуна','Phalguna']};
export default function VedicFestivalPanel({locale,point}:{locale:PortalLocale;point:Point}){
 const t=T[locale],[system,setSystem]=useState<MonthSystem>('amanta');
 const [data,setData]=useState<Response|null>(null),[loading,setLoading]=useState(false),
 [error,setError]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{
  let live=true;const ctl=new AbortController();
  setLoading(true);setError(false);setData(null);
  const q=new URLSearchParams({start:point.date,zone:point.timeZone,days:'7',
   latitude:point.latitude,longitude:point.longitude,monthSystem:system});
  fetch('/api/v1/vedic-calendar/week?'+q,{cache:'no-store',signal:ctl.signal})
   .then(async r=>{if(!r.ok)throw Error('Vedic calendar HTTP '+r.status);return await r.json() as Response;})
   .then(json=>{if(live)setData(json);})
   .catch(()=>{if(live)setError(true);})
   .finally(()=>{if(live)setLoading(false)});
  return()=>{live=false;ctl.abort()};
 },[point.date,point.timeZone,point.latitude,point.longitude,system,retry]);
 const fmt=(iso:string)=>new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',
  {dateStyle:'medium',timeStyle:'short',timeZone:data?.observer.timeZone||point.timeZone}).format(new Date(iso));
 const dateLabel=(date:string)=>new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',
  {weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
 const localMonth=(name:string|null)=>!name?'—':monthNames[name]?.[locale==='uk'?0:1]||name;
 return <section id="vedic-festivals" className={styles.section} data-testid="vedic-festival-panel">
  <header><div className={styles.kicker}>GALAXIORA · AE-P7</div><h2>{t.title}</h2><p><GlossaryText text={t.intro} locale={locale}/></p></header>
  <div className={styles.scheme} role="group" aria-label={t.month}>
   {(['amanta','purnimanta'] as const).map(v=><button type="button" key={v} aria-pressed={system===v}
    onClick={()=>setSystem(v)}>{t[v]}</button>)}
  </div>
  {loading&&<p role="status">{t.loading}</p>}
  {error&&<div role="alert" className={styles.error}>{t.error} <button type="button" onClick={()=>setRetry(x=>x+1)}>{t.retry}</button></div>}
  {!loading&&!error&&data&&<div className={styles.days}>
   {data.days.map(d=><article key={d.date} className={styles.day}>
    <div className={styles.heading}><strong>{dateLabel(d.date)}</strong>
     <span><GlossaryText text={t.month} locale={locale}/>: <GlossaryText text={localMonth(d.moonMonth.name)} locale={locale}/> {d.moonMonth.lunarMonthStatus==='adhika'?'· '+t.adhika:
      d.moonMonth.lunarMonthStatus==='kshaya_review_required'?'· '+t.kshaya:''}</span>
    </div>
    <div className={styles.tithi}><GlossaryText text={t.tithi} locale={locale}/>: {d.tithi} / 30</div>
    <div className={styles.flags}>
     {d.observances.length?d.observances.map((e,i)=><div key={e.id+e.atUtc+i}>
      <strong><GlossaryText text={t[e.id]} locale={locale}/></strong>
      <small>{e.category==='candidate'?t.candidate:t.moment}</small>
      <time dateTime={e.atUtc}>{fmt(e.atUtc)}</time>
     </div>):<p className={styles.quiet}>{t.none}</p>}
    </div>
    <div className={styles.muhurta}><span><GlossaryText text={t.abhijit} locale={locale}/>: </span>
     <time dateTime={d.windows.abhijit.startUtc}>{fmt(d.windows.abhijit.startUtc)} — {fmt(d.windows.abhijit.endUtc)}</time>
     {d.windows.abhijit.weekdayCaution&&<small>{t.wed}</small>}
    </div>
   </article>)}
  </div>}
  <footer><p><GlossaryText text={t.warning} locale={locale}/></p><p><GlossaryText text={t.info} locale={locale}/></p>
   <a href="https://www.drikpanchang.com/faq/ekadashi/about-ekadashi-timings.html" target="_blank" rel="noopener noreferrer">Drik Panchang · Ekadashi ↗</a>
   {' · '}<a href="https://www.drikpanchang.com/vrats/pradoshdates.html" target="_blank" rel="noopener noreferrer">Drik Panchang · Pradosha ↗</a>
  </footer>
 </section>;
}
