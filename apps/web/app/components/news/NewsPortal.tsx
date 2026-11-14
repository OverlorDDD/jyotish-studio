/** GalaxiNews front page and topic hubs (server-rendered, crawlable).
 * Lead = our own sky story nearest to now; then world stories without
 * reading-shop blogs; «Небо найближчих днів» and today's Panchanga come
 * straight from the Swiss Ephemeris endpoints. */
import Link from 'next/link';
import PortalShell from '../PortalShell';
import NewsArt from './NewsArt';
import NewsThumb from './NewsThumb';
import NewsRow,{OwnThumb} from './NewsRow';
import NewsFresh from './NewsFresh';
import NewsMore from './NewsMore';
import NewsTabs from './NewsTabs';
import NewsLive from './NewsLive';
export {NewsTabs};
import styles from './News.module.css';
import {NEWS_TOPICS,TOPIC_COPY,fetchNewsFeed,fetchPanchangaToday,fetchPopular,fetchSkyEvents,formatKyiv,isOwn,kyivDate,
 kyivTime,newsTeaser,newsTitle,relativeAge,sourceLabel,storyPath,topicPath,
 type NewsItem,type NewsLocale,type NewsTopic,type SkyEvent} from '../../../lib/news-public';
import {composeSkyArticle,skyEventLabel} from '../../../lib/news-sky';
import {nakshatraLabel,tithiLabel,varaLabel} from '../../../lib/panchanga-city-day';

const SIGN_UK=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козерозі','Водолії','Рибах'];
const SIGN_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PAGE=16;

/** Own sky stories carry their event; rank by closeness of the event to now. */
function pickLead(own:NewsItem[],now:number){
 const scored=own.filter(i=>i.event&&composeSkyArticle(i.event)).map(i=>{
  const dt=Date.parse(i.event!.atUtc)-now;
  // Just happened (≤36h) or coming within 3 days; recent past wins ties.
  const inWindow=dt>-36*3600000&&dt<72*3600000;
  return {i,inWindow,score:Math.abs(dt)*(dt<0?0.8:1)};
 }).filter(x=>x.inWindow).sort((a,b)=>a.score-b.score);
 return scored.map(x=>x.i);
}
function OwnCard({item,locale,big}:{item:NewsItem;locale:NewsLocale;big?:boolean}){
 const art=item.event?composeSkyArticle(item.event):null;
 const title=art?art.headline[locale]:newsTitle(item,locale)||'';
 const lead=art?art.lead[locale]:newsTeaser(item,locale);
 const topic=TOPIC_COPY[item.topic]||TOPIC_COPY.astronomy;
 const label=(locale==='uk'?'Ілюстрація Galaxiora: ':'Galaxiora illustration: ')+title;
 const meta=<span className={styles.meta}>{'Galaxiora · '+(item.event?formatKyiv(item.event.atUtc,locale,{day:'numeric',month:'long'}):relativeAge(item.publishedAt,locale))}</span>;
 if(big)return <Link href={storyPath(item,locale)} className={styles.leadMain} data-story-id={item.id} data-published={item.publishedAt}>
  {art?<NewsArt art={art.art} id={'lead-'+item.id.slice(0,8)} label={label}/>:<OwnThumb item={item} className={styles.sideThumb}/>}
  <div className={styles.leadBody}>
   <span className={styles.topicDot} style={{color:topic.color}}>{locale==='uk'?'Подія неба':'Sky event'}</span>
   <h2>{title}</h2>{lead&&<p>{lead}</p>}<div style={{marginTop:10}}>{meta}</div>
  </div>
 </Link>;
 return <Link href={storyPath(item,locale)} className={styles.side} data-story-id={item.id} data-published={item.publishedAt}>
  {art?<span className={styles.sideArt}><NewsArt art={art.art} id={'side-'+item.id.slice(0,8)} label={label}/></span>:null}
  <div className={styles.sideBody}>
   <span className={styles.topicDot} style={{color:topic.color}}>{locale==='uk'?'Подія неба':'Sky event'}</span>
   <h3>{title}</h3>{meta}
  </div>
 </Link>;
}
function WorldCard({item,locale,now}:{item:NewsItem;locale:NewsLocale;now:number}){
 const title=newsTitle(item,locale);if(!title)return null;
 const topic=TOPIC_COPY[item.topic]||TOPIC_COPY.astrology;
 const credit=item.imageKind==='publisher'?sourceLabel(item,locale):null;
 const text=<div className={styles.sideBody}>
   <span className={styles.topicDot} style={{color:topic.color}}>{locale==='uk'?topic.uk:topic.en}</span>
   <h3>{title}</h3><span className={styles.meta}>{sourceLabel(item,locale)+' · '+relativeAge(item.publishedAt,locale,now)}</span>
  </div>;
 // Only openly licensed photos may be shown large; a publisher preview stays a thumbnail.
 if(item.imageKind==='licensed')return <Link href={storyPath(item,locale)} className={styles.side} data-story-id={item.id} data-published={item.publishedAt}>
  <NewsThumb src={item.imageUrl} topic={item.topic} seed={item.id} className={styles.sideThumb} locale={locale}/>{text}</Link>;
 return <Link href={storyPath(item,locale)} className={styles.side+' '+styles.sideCompact} data-story-id={item.id} data-published={item.publishedAt}>
  {text}<NewsThumb src={item.thumbUrl} topic={item.topic} seed={item.id} locale={locale} credit={credit}/></Link>;
}

/** «Тиждень у небі» and «Небо місяця»: newest of each kind (they publish themselves). */
function Rubrics({own,locale}:{own:NewsItem[];locale:NewsLocale}){
 const pick=(kind:'week'|'month')=>own.filter(i=>i.rubric?.kind===kind).sort((a,b)=>a.rubric!.key.localeCompare(b.rubric!.key));
 const today=kyivDate();
 const weeks=pick('week'),months=pick('month');
 // Current period first; the next one appears as soon as it is published.
 const curWeek=[...weeks].reverse().find(i=>i.rubric!.key<=today)||weeks[0];
 const nextWeek=weeks.find(i=>i.rubric!.key>today);
 const curMonth=[...months].reverse().find(i=>i.rubric!.key<=today.slice(0,7))||months[0];
 const nextMonth=months.find(i=>i.rubric!.key>today.slice(0,7));
 const list=[curWeek,nextWeek,curMonth,nextMonth].filter((x,i,all):x is NewsItem=>Boolean(x)&&all.findIndex(y=>y?.id===x!.id)===i);
 if(!list.length)return null;
 return <section className={styles.rubrics} aria-labelledby="news-rubrics">
  <div className={styles.sectionHead}><h2 id="news-rubrics">{locale==='uk'?'Рубрики Galaxiora':'Galaxiora rubrics'}</h2></div>
  <div className={styles.rubricGrid}>{list.map(i=><Link key={i.id} href={storyPath(i,locale)} className={styles.rubricCard} data-story-id={i.id} data-published={i.publishedAt}>
   <OwnThumb item={i}/>
   <div><span className={styles.topicDot} style={{color:'#E7BD72'}}>{i.rubric!.kind==='week'?(locale==='uk'?'Тиждень у небі':'Week in the sky'):(locale==='uk'?'Небо місяця':'Sky this month')}</span>
    <h3>{newsTitle(i,locale)?.replace(/^Тиждень у небі: |^The week in the sky: /,'').replace(/:.*$/,'')}</h3></div>
  </Link>)}</div>
 </section>;
}

export function SkyStrip({events,own,locale,now}:{events:SkyEvent[];own:NewsItem[];locale:NewsLocale;now:number}){
 const list=events.filter(e=>Date.parse(e.atUtc)>now-12*3600000).slice(0,10);
 if(!list.length)return null;
 const today=kyivDate(new Date(now));
 return <section className={styles.sky} aria-labelledby="news-sky">
  <div className={styles.sectionHead}><h2 id="news-sky">{locale==='uk'?'Небо найближчих днів':'The sky in the days ahead'}</h2>
   <Link href={'/'+locale+'/panchanga'}>{locale==='uk'?'Календар Панчанги':'Panchanga calendar'}</Link></div>
  <ol className={styles.skyList}>{list.map(e=>{
   const story=own.find(i=>i.event&&i.event.kind===e.kind&&Math.abs(Date.parse(i.event.atUtc)-Date.parse(e.atUtc))<120000);
   const label=skyEventLabel(e)[locale],isToday=kyivDate(new Date(e.atUtc))===today;
   const when=(isToday?(locale==='uk'?'Сьогодні':'Today'):formatKyiv(e.atUtc,locale,{weekday:'short',day:'numeric',month:'short'}))+' · '+kyivTime(e.atUtc);
   return <li key={e.kind+e.atUtc} className={styles.skyItem+(isToday?' '+styles.skyNow:'')}>
    <time dateTime={e.atUtc}>{when}</time>
    {story?<Link href={storyPath(story,locale)}>{label}</Link>:
     <Link href={'/'+locale+'/panchanga?date='+kyivDate(new Date(e.atUtc))}>{label}</Link>}
   </li>;})}</ol>
 </section>;
}

export async function TodayPanel({locale}:{locale:NewsLocale}){
 const day=await fetchPanchangaToday(kyivDate());
 if(!day?.sunrise)return null;
 const s=day.sunrise;
 let tithi='',nak='',vara='';
 try{tithi=tithiLabel(s.tithi as never,locale);nak=nakshatraLabel(s.nakshatra as never,locale);vara=varaLabel(s.vara as never,locale);}catch{return null;}
 const moonChange=day.changes?.find(c=>c.kind==='moonSign');
 return <section className={styles.panel+' '+styles.panelGold} aria-labelledby="news-today">
  <h2 id="news-today">{locale==='uk'?'Сьогодні в Києві':'Today in Kyiv'}</h2>
  <dl className={styles.dl}>
   <dt>{locale==='uk'?'Тітхі':'Tithi'}</dt><dd>{tithi}</dd>
   <dt>{locale==='uk'?'Накшатра':'Nakshatra'}</dt><dd>{nak}</dd>
   <dt>{locale==='uk'?'Місяць':'Moon'}</dt><dd>{(locale==='uk'?'у '+SIGN_UK[s.moonSign-1]:'in '+SIGN_EN[s.moonSign-1])+(moonChange?' · '+kyivTime(moonChange.atUtc)+' →':'')}</dd>
   <dt>{locale==='uk'?'День':'Day'}</dt><dd>{vara}</dd>
  </dl>
  <Link className={styles.panelLink} href={'/'+locale+'/panchanga/kyiv'}>{locale==='uk'?'Уся Панчанга дня':'Full Panchanga for today'}</Link>
  <br/><Link className={styles.panelLink} href={'/'+locale+'/horoscope'}>{locale==='uk'?'Гороскоп на сьогодні за знаком Місяця':'Today’s Moon-sign horoscope'}</Link>
 </section>;
}

function AboutPanel({locale}:{locale:NewsLocale}){
 return <section className={styles.panel} aria-labelledby="news-about">
  <h2 id="news-about">{locale==='uk'?'Як працює GalaxiNews':'How GalaxiNews works'}</h2>
  <p>{locale==='uk'?'Події неба ми розраховуємо самі — Swiss Ephemeris, сидеричний зодіак Лахірі. Новини світу добираємо з тематичних видань, перекладаємо й завжди ведемо до першоджерела.':
   'We calculate sky events ourselves — Swiss Ephemeris, Lahiri sidereal zodiac. World stories come from subject publications, translated, always linked to the original.'}</p>
  <Link className={styles.panelLink} href={'/'+locale+'/methodology'}>{locale==='uk'?'Редакційні принципи':'Editorial principles'}</Link>
 </section>;
}

export default async function NewsPortal({locale,topic}:{locale:NewsLocale;topic?:NewsTopic}){
 const now=Date.now(),today=kyivDate(new Date(now));
 const [top,latest,own,events,band,popular]=await Promise.all([
  fetchNewsFeed({locale,topic,limit:24,sort:'relevance'}),
  fetchNewsFeed({locale,topic,limit:PAGE,sort:'latest'}),
  !topic||topic==='astronomy'||topic==='astrology'||topic==='jyotish'?fetchNewsFeed({locale,scope:'own',limit:24,sort:'latest'}):Promise.resolve({items:[],total:0}),
  !topic||topic==='astronomy'||topic==='astrology'||topic==='jyotish'?fetchSkyEvents(today,14):Promise.resolve([] as SkyEvent[]),
  topic?Promise.resolve({items:[],total:0}):fetchNewsFeed({locale,topic:'vedic',limit:6,sort:'latest'}),
  topic?Promise.resolve([] as NewsItem[]):fetchPopular(locale)
 ]);
 const visibleEvents=events.filter(e=>!(e.kind==='sidereal_ingress'&&e.body==='Moon'));
 const leads=pickLead(own.items,now);
 const world=top.items.filter(i=>!isOwn(i)&&newsTitle(i,locale));
 const leadItem=leads[0]||null;
 const sideOwn=leads.slice(1,2);
 const sideWorld=[...world.filter(i=>i.thumbUrl),...world.filter(i=>!i.thumbUrl)].slice(0,3-sideOwn.length);
 const shown=new Set([leadItem?.id,...sideOwn.map(i=>i.id),...sideWorld.map(i=>i.id)].filter(Boolean) as string[]);
 const rows=latest.items.filter(i=>!shown.has(i.id)&&newsTitle(i,locale));
 const bandItems=band.items.filter(i=>!shown.has(i.id)&&!rows.slice(0,8).some(r=>r.id===i.id)&&newsTitle(i,locale)).slice(0,4);
 const copy=topic?TOPIC_COPY[topic]:null;
 const scan=latest.lastScan?.createdAt||top.lastScan?.createdAt;
 return <PortalShell locale={locale} active="news" languagePath={topic?'news/'+topic:'news'}>
  <div className={styles.wrap}>
   <header className={styles.masthead}>
    <div>
     {topic&&<nav className={styles.crumbs} aria-label={locale==='uk'?'Хлібні крихти':'Breadcrumbs'}><Link href={'/'+locale+'/news'}>GalaxiNews</Link></nav>}
     <h1>{copy?(locale==='uk'?copy.uk:copy.en):'GalaxiNews'}</h1>
     <p>{copy?(locale==='uk'?copy.leadUk:copy.leadEn):(locale==='uk'?'Новини неба, Джйотиш, Таро, йоги й ведичної традиції — щодня.':'Daily news of the sky, Jyotish, Tarot, yoga and the Vedic tradition.')}</p>
    </div>
    <div className={styles.status}>
     {scan&&<span className={styles.live}>{(locale==='uk'?'Оновлено ':'Updated ')+relativeAge(scan,locale,now)}</span>}
     <NewsFresh locale={locale}/>
     <NewsLive locale={locale} topic={topic} newestAt={latest.items[0]?.publishedAt}/>
    </div>
   </header>
   <NewsTabs locale={locale} active={topic||'all'}/>

   {(leadItem||sideWorld.length>0)&&<section className={styles.lead} aria-label={locale==='uk'?'Головне':'Top stories'}>
    {leadItem?<OwnCard item={leadItem} locale={locale} big/>:sideWorld[0]?<WorldCard item={sideWorld[0]} locale={locale} now={now}/>:null}
    <div className={styles.leadSide}>
     {sideOwn.map(i=><OwnCard key={i.id} item={i} locale={locale}/>)}
     {(leadItem?sideWorld:sideWorld.slice(1)).map(i=><WorldCard key={i.id} item={i} locale={locale} now={now}/>)}
    </div>
   </section>}

   <SkyStrip events={visibleEvents} own={own.items} locale={locale} now={now}/>
   {(!topic||topic==='astrology'||topic==='jyotish'||topic==='astronomy')&&<Rubrics own={own.items} locale={locale}/>}

   <div className={styles.cols}>
    <section className={styles.colMain} aria-labelledby="news-latest">
     <div className={styles.sectionHead}><h2 id="news-latest">{locale==='uk'?'Останнє':'Latest'}</h2></div>
     {rows.length?<ul className={styles.list}>{rows.map(i=><NewsRow key={i.id} item={i} locale={locale} now={now}/>)}</ul>:
      <p className={styles.empty}>{locale==='uk'?'Свіжих матеріалів у цій темі поки немає. Загляньте в інші теми або поверніться пізніше.':'No fresh stories in this topic yet. Try another topic or come back later.'}</p>}
     <NewsMore locale={locale} topic={topic} startPage={1} pageSize={PAGE} total={latest.total} seen={[...shown,...rows.map(r=>r.id)]}/>
    </section>
    <aside className={styles.colSide} aria-label={locale==='uk'?'Додатково':'More'}>
     <TodayPanel locale={locale}/>
     {popular.length>=3&&<section className={styles.panel} aria-labelledby="news-popular">
      <h2 id="news-popular">{locale==='uk'?'Найчитаніше за тиждень':'Most read this week'}</h2>
      <ol className={styles.mini+' '+styles.popular}>{popular.map(i=><li key={i.id}><Link href={storyPath(i,locale)}>{(isOwn(i)&&i.event?composeSkyArticle(i.event)?.headline[locale]:null)||newsTitle(i,locale)}</Link>
       <span>{sourceLabel(i,locale)}</span></li>)}</ol>
     </section>}
     {!topic&&<section className={styles.panel} aria-labelledby="news-topics">
      <h2 id="news-topics">{locale==='uk'?'Теми':'Topics'}</h2>
      <ul className={styles.mini}>{NEWS_TOPICS.map(t=><li key={t}><Link href={topicPath(t,locale)}>{locale==='uk'?TOPIC_COPY[t].uk:TOPIC_COPY[t].en}</Link>
       <span>{locale==='uk'?TOPIC_COPY[t].leadUk:TOPIC_COPY[t].leadEn}</span></li>)}</ul>
     </section>}
     <AboutPanel locale={locale}/>
    </aside>
   </div>

   {bandItems.length>=2&&<section className={styles.band} aria-labelledby="news-vedic">
    <div className={styles.sectionHead}><h2 id="news-vedic">{locale==='uk'?'Ведична традиція':'Vedic tradition'}</h2>
     <Link href={topicPath('vedic',locale)}>{locale==='uk'?'Усі матеріали':'All stories'}</Link></div>
    <div className={styles.cards}>{bandItems.map(i=><Link key={i.id} href={storyPath(i,locale)} className={styles.card} data-story-id={i.id} data-published={i.publishedAt}>
     <span className={styles.meta}>{sourceLabel(i,locale)}</span><h3>{newsTitle(i,locale)}</h3>
     <span className={styles.meta}>{relativeAge(i.publishedAt,locale,now)}</span></Link>)}</div>
   </section>}
  </div>
 </PortalShell>;
}
