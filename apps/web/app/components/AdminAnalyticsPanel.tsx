'use client';
import styles from './AdminAnalyticsPanel.module.css';

export type Traffic={
 status:'ok'|'not_configured'|'unavailable';activeUsers30m:number|null;
 sessions7d:number|null;sessionStatus:'ok'|'unavailable'|'not_configured';
 generatedAt:string;provider:'ga4_data_api';message?:string
};
export type VisitorTraffic={
 status:'ok';source:'server_aggregate';period:string;generatedAt:string;days?:number;
 totals:Record<string,number>;bySection:Record<string,number>;
 daily?:{date:string;count:number}[];bySource?:Record<string,number>;
 sourceAttributionCount?:number;unattributedHistoricCount?:number;caveat:string
};
type Props={
 locale:'uk'|'en';days:7|30;onDaysChange:(value:7|30)=>void;
 visitors:VisitorTraffic|null;traffic:Traffic|null;visitorError:string;trafficError:string
};
const SECTIONS:Record<string,[string,string]>={
 home:['Головна','Home'],astrology:['Астрологія','Astrology'],jyotish:['Джйотіш','Jyotish'],
 tarot:['Таро','Tarot'],tarot_cards:['Карти Таро','Tarot cards'],panchanga:['Панчанга','Panchanga'],
 horoscope:['Гороскопи','Horoscopes'],yoga:['Йога','Yoga'],learn:['GalaxiPedia','GalaxiPedia'],
 news:['Новини','News'],community:['Спільнота','Community'],
 methodology:['Методологія','Methodology'],eclipses:['Затемнення','Eclipses'],about:['Про сайт','About']
};
const SOURCES:Record<string,[string,string]>={
 google:['Google Search','Google Search'],
 other_search:['Інші пошуковики','Other search engines'],
 social:['Соцмережі','Social platforms'],
 partner_tag:['Партнерський UTM','Partner UTM tag'],
 other_referral:['Інші сайти','Other websites'],
 internal:['Переходи всередині сайту','Internal navigation'],
 unknown:['Прямий / невизначений','Direct / unattributed']
};
function numeric(value:unknown,locale:'uk'|'en'){
 return typeof value==='number'&&Number.isFinite(value)?value.toLocaleString(locale==='uk'?'uk-UA':'en-US'):'—';
}
export default function AdminAnalyticsPanel({
 locale,days,onDaysChange,visitors,traffic,visitorError,trafficError
}:Props){
 const uk=locale==='uk';
 const total=visitors?.totals.public_html_request??null;
 const items=[
  {key:'public_html_request',label:uk?'HTML-звернення':'HTML requests',value:total,
   note:uk?'Не унікальні люди':'Not unique visitors'},
  {key:'jyotish_chart_completed',label:uk?'Джйотіш · API':'Jyotish · API',
   value:visitors?.totals.jyotish_chart_completed??null,
   note:uk?'Успішні розрахунки':'Successful calculations'},
  {key:'tarot_spread_completed',label:uk?'Таро · API':'Tarot · API',
   value:visitors?.totals.tarot_spread_completed??null,
   note:uk?'Успішні розклади':'Successful spreads'},
  {key:'panchanga_calculation_completed',label:uk?'Панчанга · API':'Panchanga · API',
   value:visitors?.totals.panchanga_calculation_completed??null,
   note:uk?'Включно з автооновленнями':'Includes automatic loads'}
 ];
 const series=visitors?.days===days?visitors.daily||[]:[];
 const maxDaily=Math.max(1,...series.map(day=>day.count));
 const sections=Object.entries(visitors?.bySection||{}).sort((a,b)=>b[1]-a[1]).slice(0,8);
 const sourceRows=Object.entries(SOURCES).map(([key,label])=>({key,label:label[uk?0:1],count:visitors?.bySource?.[key]??0}));
 const observedSources=sourceRows.reduce((n,x)=>n+x.count,0);
 const historic=visitors?.unattributedHistoricCount??0;
 const sourceTotal=Math.max(1,observedSources+historic);
 const allSources=[...sourceRows,...(historic>0?[{key:'historic',label:uk?'До запуску атрибуції':'Before source tracking',count:historic}]:[])].filter(row=>row.count>0);
 const fmtDate=(date:string)=>new Date(date+'T12:00:00Z').toLocaleDateString(uk?'uk-UA':'en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
 const trafficReady=traffic?.status==='ok';
 const gaStatus=trafficReady?(uk?'Підключено':'Connected'):traffic?.status==='not_configured'?
  (uk?'Не налаштовано':'Not configured'):(uk?'Немає даних':'Unavailable');
 return <section className={styles.wrap} aria-label="Visitor Analytics" data-testid="admin-live-traffic">
  <div className={styles.heading}>
   <div className={styles.headingText}>
    <span className={styles.eyebrow}>{uk?'GALAXIORA · АНАЛІТИКА':'GALAXIORA · ANALYTICS'}</span>
    <h2>{uk?'Активність сайту':'Site activity'}</h2>
    <p>{uk?'Серверні агрегати без ідентифікації відвідувачів. Події інструментів і GA4 не додаються до переглядів.':
     'First-party aggregates without identifying visitors. Tool events and GA4 are separate measurements.'}</p>
   </div>
   <div className={styles.period} role="group" aria-label={uk?'Період статистики':'Reporting period'}>
    {([7,30] as const).map(n=><button type="button" key={n}
      onClick={()=>onDaysChange(n)} aria-pressed={days===n} className={days===n?styles.active:''}>
     {n} {uk?'днів':'days'}
    </button>)}
   </div>
  </div>
  <div className={styles.stats} data-testid="visitor-analytics-metrics">
   {items.map(item=><article className={styles.stat} key={item.key}>
    <div className={styles.statLabel}>{item.label}</div>
    <strong>{numeric(item.value,locale)}</strong>
    <span>{item.note} · {days}{uk?' дн.':' d'}</span>
   </article>)}
  </div>
  {visitorError?<p className={styles.error} role="alert">{uk?'Серверні агрегати недоступні':'Server aggregates unavailable'}: {visitorError}</p>:null}
  <div className={styles.duo}>
   <section className={styles.panel} aria-label={uk?'Активність за днями':'Daily activity'}>
    <div className={styles.panelHeading}>
     <h3>{uk?'Динаміка звернень':'Request trend'}</h3>
     <span>UTC · {days}{uk?' днів':' days'}</span>
    </div>
    {series.length?<div className={styles.chartScroll}>
     <div className={styles.chart} role="img" aria-label={uk?'Графік HTTP-звернень за днями':'Daily public HTML requests'}>
      {series.map((d,i)=><div className={styles.barCell} key={d.date} title={fmtDate(d.date)+': '+d.count}>
       <span className={styles.barValue}>{d.count>0?numeric(d.count,locale):''}</span>
       <div className={styles.barTrack}>
        <div className={styles.bar} style={{height:d.count?Math.max(5,Math.round(d.count/maxDaily*100))+'%':'2px'}}/>
       </div>
       <span className={styles.dayLabel}>{days===7||i===0||i===series.length-1||i%5===0?fmtDate(d.date):'·'}</span>
      </div>)}
     </div>
    </div>:<p className={styles.empty}>{uk?'Історія ще не завантажена':'Daily history not yet available'}</p>}
    <p className={styles.caption}>{uk?'Це кількість придатних HTML-запитів, а не люди чи сесії. Кеш і боти впливають на точність.':
     'Eligible HTML requests, not people or sessions. Cache and bot filtering affect accuracy.'}</p>
   </section>
   <section className={styles.panel} aria-label={uk?'Популярні розділи':'Popular sections'}>
    <div className={styles.panelHeading}>
     <h3>{uk?'Популярні розділи':'Popular sections'}</h3>
     <span>{uk?'HTML-запити':'HTML requests'}</span>
    </div>
    {sections.length?<div className={styles.ranking}>
     {sections.map(([key,value])=><div className={styles.rank} key={key}>
      <div className={styles.rankTop}><span>{SECTIONS[key]?.[uk?0:1]||key}</span><strong>{numeric(value,locale)}</strong></div>
      <div className={styles.rankTrack}><span style={{width:Math.max(2,Math.round(value/Math.max(1,sections[0][1])*100))+'%'}}/></div>
     </div>)}
    </div>:<p className={styles.empty}>{uk?'Немає зарахованих звернень':'No recorded requests'}</p>}
   </section>
  </div>
  <div className={styles.duo}>
   <section className={styles.panel} aria-label={uk?'Джерела переходів':'Traffic sources'}>
    <div className={styles.panelHeading}>
     <h3>{uk?'Звідки приходять запити':'Where requests come from'}</h3>
     <span>{uk?'Орієнтовно':'Approximate'}</span>
    </div>
    {allSources.length?<div className={styles.ranking}>
     {allSources.sort((a,b)=>b.count-a.count).map(row=><div className={styles.rank} key={row.key}>
      <div className={styles.rankTop}><span>{row.label}</span><strong>{numeric(row.count,locale)}</strong></div>
      <div className={styles.rankTrack}><span style={{width:Math.max(2,Math.round(row.count/sourceTotal*100))+'%'}}/></div>
     </div>)}
    </div>:<p className={styles.empty}>{uk?'Чекаємо перші дані після ввімкнення класифікації':'Awaiting attribution data after release'}</p>}
    <p className={styles.caption}>{uk?
     'Групування за Referer або дозволеними UTM. Не підтверджує унікальних відвідувачів; історичні джерела невідомі.':
     'Coarse Referer or allowlisted UTM categories; not verified unique visitors. Historical sources are unknown.'}</p>
   </section>
   <section className={styles.panel} aria-label={uk?'Додаткові дані Google Analytics':'Supplementary Google Analytics'}>
    <div className={styles.panelHeading}>
     <h3>Google Analytics 4</h3><span>{gaStatus}</span>
    </div>
    <p className={styles.caption}>{uk?'Додаткові дані лише від користувачів, які дали згоду. Не підсумовуємо із серверними запитами.':
      'Consent-based supplementary data only. Never summed with first-party request counters.'}</p>
    <div className={styles.gaStats}>
     <div><span>{uk?'Сесії · 7 днів':'Sessions · 7 days'}</span><strong>{traffic?.sessionStatus==='ok'?numeric(traffic.sessions7d,locale):'—'}</strong></div>
     <div><span>{uk?'Активні · 30 хв':'Active · 30 min'}</span><strong data-testid="ga4-active30">{trafficReady?numeric(traffic.activeUsers30m,locale):'—'}</strong></div>
    </div>
    {trafficError?<p role="alert" className={styles.error}>{uk?'GA4 недоступна':'GA4 unavailable'}: {trafficError}</p>:null}
    <p className={styles.caption}>{uk?'Не показуємо нуль там, де Google не повернув дані.':'Unknown values are not presented as zero.'}</p>
   </section>
  </div>
  <p className={styles.footerNote}>{uk?
   'Серверний облік: день UTC × публічний розділ × категорія. Без IP, cookie, особистих даних і повних URL. Джерела починають накопичуватися тільки після відповідного релізу.':
   'Server counts: UTC day × public section × category. No IP, cookies, birth data or raw URLs. Source categorization starts only after the release.'}</p>
 </section>;
}
