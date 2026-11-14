/** One GalaxiNews story. Own sky stories are full articles composed from the
 * verified event; world stories are a translated headline, a short teaser,
 * Galaxiora context and a prominent link to the original publisher. */
import Link from 'next/link';
import PortalShell from '../PortalShell';
import NewsArt from './NewsArt';
import NewsThumb from './NewsThumb';
import {NewsTabs,SkyStrip,TodayPanel} from './NewsPortal';
import styles from './News.module.css';
import {TOPIC_COPY,formatKyiv,isOwn,newsTeaser,newsTitle,relativeAge,sourceLabel,storyPath,topicPath,
 type NewsItem,type NewsLocale,type SkyEvent} from '../../../lib/news-public';
import {composeSkyArticle,nextEventFor} from '../../../lib/news-sky';
import {composeRubric,type RubricData} from '../../../lib/news-rubric';
import NewsDiscuss from './NewsDiscuss';

/** Short, honest context per topic: what Galaxiora offers around such news. */
const CONTEXT:Record<string,{uk:string;en:string;links:{href:string;uk:string;en:string}[]}>={
 vedic:{uk:'Свята, пости й добрі дні ведичного календаря Galaxiora розраховує для вашого міста — від тітхі й накшатри до Екадаші та Пурніми.',en:'Galaxiora calculates the festivals, fasts and auspicious days of the Vedic calendar for your city — from tithi and nakshatra to Ekadashi and Purnima.',
  links:[{href:'panchanga',uk:'Панчанга на сьогодні',en:'Today’s Panchanga'},{href:'pedia',uk:'Енциклопедія GalaxiPedia',en:'GalaxiPedia encyclopedia'}]},
 jyotish:{uk:'Ведична астрологія спирається на сидеричний зодіак і накшатри. Подивіться, як ці принципи працюють у вашій власній карті.',en:'Vedic astrology rests on the sidereal zodiac and the nakshatras. See how these principles work in your own chart.',
  links:[{href:'astrology/jyotish',uk:'Натальна карта Джйотиш',en:'Jyotish birth chart'},{href:'nakshatra',uk:'27 накшатр',en:'The 27 nakshatras'}]},
 astrology:{uk:'Galaxiora рахує положення планет у сидеричному зодіаку, тому дати транзитів відрізняються від західних гороскопів приблизно на 24 дні.',en:'Galaxiora calculates planets in the sidereal zodiac, so transit dates differ from Western horoscopes by about 24 days.',
  links:[{href:'horoscope',uk:'Гороскоп за знаком Місяця',en:'Moon-sign horoscope'},{href:'astrology/moon-sign-vs-sun-sign',uk:'Знак Місяця чи Сонця?',en:'Moon sign or Sun sign?'}]},
 astronomy:{uk:'Фази Місяця, затемнення й переходи планет Galaxiora розраховує за Swiss Ephemeris для вашого міста.',en:'Galaxiora calculates Moon phases, eclipses and planetary ingresses with Swiss Ephemeris for your city.',
  links:[{href:'panchanga',uk:'Календар неба',en:'Sky calendar'},{href:'eclipses/2027',uk:'Затемнення 2027',en:'Eclipses 2027'}]},
 tarot:{uk:'У Galaxiora можна витягнути карту дня й зробити розклад безкоштовно, а значення всіх 78 карт зібрані в бібліотеці.',en:'At Galaxiora you can draw a card of the day and do a spread for free; all 78 meanings are in the library.',
  links:[{href:'tarot',uk:'Розклад Таро',en:'Tarot reading'},{href:'tarot/cards',uk:'Значення карт',en:'Card meanings'}]},
 yoga:{uk:'Покрокові практики йоги й дихання з таймером — у розділі Йога.',en:'Step-by-step yoga and breathing practices with a timer are in the Yoga section.',links:[{href:'yoga',uk:'Практики йоги',en:'Yoga practices'}]},
 meditation:{uk:'Короткі практики уважності й медитації з поясненнями — у розділі Йога й медитація.',en:'Short guided mindfulness and meditation practices are in the Yoga section.',links:[{href:'yoga',uk:'Практики медитації',en:'Meditation practices'}]},
 'self-development':{uk:'Почніть із короткої практики уважності — вона займає кілька хвилин.',en:'Start with a short mindfulness practice — it takes a few minutes.',links:[{href:'yoga',uk:'Практики',en:'Practices'}]}
};

function Related({items,locale,now}:{items:NewsItem[];locale:NewsLocale;now:number}){
 const list=items.filter(i=>newsTitle(i,locale)).slice(0,5);
 if(!list.length)return null;
 return <section className={styles.panel} aria-labelledby="story-related">
  <h2 id="story-related">{locale==='uk'?'Читайте також':'Read next'}</h2>
  <ul className={styles.mini}>{list.map(i=><li key={i.id}><Link href={storyPath(i,locale)}>{newsTitle(i,locale)}</Link>
   <span>{sourceLabel(i,locale)+' · '+relativeAge(i.publishedAt,locale,now)}</span></li>)}</ul>
 </section>;
}

export default function NewsStory({item,related,events,ownItems,locale,jsonLd,shareUrl,rubricData}:{item:NewsItem;related:NewsItem[];events:SkyEvent[];ownItems:NewsItem[];locale:NewsLocale;jsonLd:string|null;shareUrl:string;rubricData?:RubricData|null}){
 const now=Date.now(),own=isOwn(item),topic=TOPIC_COPY[item.topic]||TOPIC_COPY.astrology;
 const article=own&&item.event?composeSkyArticle(item.event,nextEventFor(item.event,events),now):null;
 const storyFor=(e:SkyEvent)=>{const hit=ownItems.find(i=>i.event&&i.event.kind===e.kind&&Math.abs(Date.parse(i.event.atUtc)-Date.parse(e.atUtc))<120000);return hit?storyPath(hit,locale):undefined;};
 const rubric=own&&item.rubric&&rubricData?composeRubric(rubricData,storyFor,now):null;
 const title=article?article.headline[locale]:newsTitle(item,locale)||item.title;
 const crumbs=<nav className={styles.crumbs} aria-label={locale==='uk'?'Хлібні крихти':'Breadcrumbs'}>
  <Link href={'/'+locale+'/news'}>GalaxiNews</Link> <span aria-hidden="true">/</span> <Link href={topicPath(item.topic,locale)}>{locale==='uk'?topic.uk:topic.en}</Link></nav>;
 const tg='https://t.me/share/url?url='+encodeURIComponent(shareUrl)+'&text='+encodeURIComponent(title);
 const visibleEvents=events.filter(e=>!(e.kind==='sidereal_ingress'&&e.body==='Moon'));
 return <PortalShell locale={locale} active="news" languagePath={storyPath(item,locale).slice(locale.length+2)}>
  {jsonLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>}
  <div className={styles.wrap}>
   <NewsTabs locale={locale} active={item.topic}/>
   <div className={styles.story}>
    <article className={styles.article}>
     {crumbs}
     <span className={styles.topicDot} style={{color:topic.color}}>{own&&item.rubric?(item.rubric.kind==='week'?(locale==='uk'?'Рубрика · Тиждень у небі':'Rubric · Week in the sky'):(locale==='uk'?'Рубрика · Небо місяця':'Rubric · Sky this month')):own?(locale==='uk'?'Подія неба · Galaxiora':'Sky event · Galaxiora'):(locale==='uk'?topic.uk+' · Світ':topic.en+' · World')}</span>
     <h1>{title}</h1>
     {rubric&&item.rubric?<>
      <p className={styles.standfirst}>{rubric.lead[locale]}</p>
      <div className={styles.byline}>
       <span><b>{locale==='uk'?'Редакція Galaxiora':'Galaxiora editors'}</b></span>
       <time dateTime={item.publishedAt}>{formatKyiv(item.publishedAt,locale,{day:'numeric',month:'long',year:'numeric'})}</time>
       <span className={styles.share}><a href={tg} target="_blank" rel="noopener noreferrer">{locale==='uk'?'Поділитися в Telegram':'Share on Telegram'}</a></span>
      </div>
      <figure className={styles.figure}>
       <NewsArt art={rubric.art} id={'rubric-'+item.id.slice(0,8)} label={(locale==='uk'?'Календар неба: ':'Sky calendar: ')+title}/>
       <figcaption>{locale==='uk'?'Ілюстрація Galaxiora.':'Galaxiora illustration.'}</figcaption>
      </figure>
      <section className={styles.facts} aria-labelledby="story-facts">
       <h2 id="story-facts">{locale==='uk'?'Коротко':'At a glance'}</h2>
       <dl>{rubric.facts.map(f=><div key={f.label.en} style={{display:'contents'}}><dt>{f.label[locale]}</dt><dd>{f.value[locale]}</dd></div>)}</dl>
      </section>
      <h2>{item.rubric.kind==='week'?(locale==='uk'?'День за днем':'Day by day'):(locale==='uk'?'Календар місяця':'Month calendar')}</h2>
      <div className={styles.calendar}>{rubric.days.map(d=><section key={d.date} aria-label={d.label[locale]}>
       <h3>{d.label[locale]}</h3>
       <ul>{d.entries.map(e=><li key={e.key} data-weight={e.weight}>
        {e.time&&<time>{e.time}</time>}
        {e.href?<Link href={e.href}>{e.text[locale]}</Link>:<span>{e.text[locale]}</span>}
       </li>)}</ul>
      </section>)}</div>
      <h2>{locale==='uk'?'Ретроградні планети':'Retrograde planets'}</h2>
      <p>{rubric.retro[locale]}</p>
      {rubric.highlights.length>0&&<><h2>{locale==='uk'?'Що це означає':'What it means'}</h2>
       {rubric.highlights.map(h=><section key={h.title.en} className={styles.highlight}>
        <h3>{h.href?<Link href={h.href}>{h.title[locale]}</Link>:h.title[locale]}</h3><p>{h.text[locale]}</p></section>)}</>}
      <section className={styles.cta} aria-labelledby="story-cta">
       <div><h2 id="story-cta">{locale==='uk'?'Панчанга для вашого міста':'Panchanga for your city'}</h2><p>{locale==='uk'?'Час Екадаші, тітхі й добрі години залежать від місця — відкрийте календар для свого міста.':'Ekadashi timing, tithi and auspicious hours depend on place — open the calendar for your city.'}</p></div>
       <Link className={styles.button} href={'/'+locale+'/panchanga'}>{locale==='uk'?'Відкрити Панчангу':'Open Panchanga'}</Link>
      </section>
      <NewsDiscuss locale={locale} title={title} path={storyPath(item,locale)} topic={item.topic}/>
      <p className={styles.method}>{locale==='uk'?'Рубрика оновлюється автоматично: усі дати й час розраховані Swiss Ephemeris (сидеричний зодіак, айанамша Лахірі) для Києва; дні Панчанги — за тітхі на світанку. ':'This rubric updates automatically: dates and times are calculated with Swiss Ephemeris (sidereal, Lahiri) for Kyiv; Panchanga days by the tithi at sunrise. '}
       <Link href={'/'+locale+'/methodology'}>{locale==='uk'?'Як ми працюємо':'How we work'}</Link></p>
     </>:article?<>
      <p className={styles.standfirst}>{article.lead[locale]}</p>
      <div className={styles.byline}>
       <span><b>{locale==='uk'?'Редакція Galaxiora':'Galaxiora editors'}</b></span>
       <time dateTime={item.publishedAt}>{formatKyiv(item.publishedAt,locale,{day:'numeric',month:'long',year:'numeric'})}</time>
       <span className={styles.share}><a href={tg} target="_blank" rel="noopener noreferrer">{locale==='uk'?'Поділитися в Telegram':'Share on Telegram'}</a></span>
      </div>
      <figure className={styles.figure}>
       <NewsArt art={article.art} id={'story-'+item.id.slice(0,8)} label={(locale==='uk'?'Схема події: ':'Event diagram: ')+title}/>
       <figcaption>{locale==='uk'?'Схема події неба. Ілюстрація Galaxiora.':'Diagram of the sky event. Galaxiora illustration.'}</figcaption>
      </figure>
      <section className={styles.facts} aria-labelledby="story-facts">
       <h2 id="story-facts">{locale==='uk'?'Коротко':'At a glance'}</h2>
       <dl>{article.facts.map(f=><div key={f.label.en} style={{display:'contents'}}><dt>{f.label[locale]}</dt><dd>{f.value[locale]}</dd></div>)}</dl>
      </section>
      {article.sections.map(sec=><section key={sec.title.en}>
       <h2>{sec.title[locale]}</h2>
       {sec.paragraphs.map((p,i)=><p key={i}>{p[locale]}</p>)}
       {sec.bullets&&<>
        <h2>{locale==='uk'?'Що можна зробити':'What you can do'}</h2>
        <ul>{sec.bullets.map((b,i)=><li key={i}>{b[locale]}</li>)}</ul></>}
      </section>)}
      <section className={styles.cta} aria-labelledby="story-cta">
       <div><h2 id="story-cta">{article.cta.title[locale]}</h2><p>{article.cta.text[locale]}</p></div>
       <Link className={styles.button} href={'/'+locale+'/'+article.cta.href}>{article.cta.label[locale]}</Link>
      </section>
      <NewsDiscuss locale={locale} title={title} path={storyPath(item,locale)} topic={item.topic}/>
      <p className={styles.method}>{locale==='uk'?'Розрахунок: Swiss Ephemeris, сидеричний зодіак, айанамша Лахірі; час — київський. Тлумачення — за традицією Джйотиш і не є передбаченням конкретних подій. ':'Calculation: Swiss Ephemeris, sidereal zodiac, Lahiri ayanamsha; Kyiv time. Interpretation follows the Jyotish tradition and does not predict specific events. '}
       <Link href={'/'+locale+'/methodology'}>{locale==='uk'?'Як ми працюємо':'How we work'}</Link></p>
     </>:own?<>
      {newsTeaser(item,locale)&&<p className={styles.standfirst}>{newsTeaser(item,locale)}</p>}
      <p>{locale==='uk'?(item.summaryUk||''):(item.summaryEn||item.summary||'')}</p>
      <p className={styles.method}><Link href={'/'+locale+'/panchanga'}>{locale==='uk'?'Відкрити календар Панчанги':'Open the Panchanga calendar'}</Link></p>
     </>:<>
      <div className={styles.sourceBox}>
       <span><b>{sourceLabel(item,locale)}</b><br/>{formatKyiv(item.publishedAt,locale,{day:'numeric',month:'long',year:'numeric'})}{item.publishedAccuracy==='observed'?(locale==='uk'?' (дата індексації)':' (date indexed)'):''}</span>
       <span style={{marginLeft:'auto',maxWidth:340}}>{locale==='uk'?'Заголовок і короткий виклад переклала редакція Galaxiora. Повний текст — у першоджерелі.':'Headline and short summary translated by Galaxiora. The full text is at the original source.'}</span>
      </div>
      <div className={styles.summaryRow}>
       {item.thumbUrl&&<figure>
        <NewsThumb src={item.thumbUrl} topic={item.topic} seed={item.id} className={styles.thumb} locale={locale}/>
        <figcaption>{item.imageKind==='licensed'?(item.imageCredit||''):(locale==='uk'?'Фото: ':'Photo: ')+sourceLabel(item,locale)}</figcaption>
       </figure>}
       <div className={styles.summaryText}>
        {newsTeaser(item,locale)?<p>{newsTeaser(item,locale)}</p>:
         <p>{locale==='uk'?'Короткого опису від видання немає — прочитайте матеріал у першоджерелі.':'The publisher provides no summary — read the story at the source.'}</p>}
       </div>
      </div>
      <a className={styles.button} href={item.url} target="_blank" rel="noopener">{(locale==='uk'?'Читати повністю на ':'Read the full story at ')+sourceLabel(item,locale)}
       <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3h7v7M13 3L4 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></a>
      {CONTEXT[item.topic]&&<section className={styles.context} aria-labelledby="story-context">
       <h2 id="story-context">{locale==='uk'?'Контекст від Galaxiora':'Galaxiora context'}</h2>
       <p>{CONTEXT[item.topic][locale]}</p>
       <p>{CONTEXT[item.topic].links.map((l,i)=><span key={l.href}>{i?' · ':''}<Link href={'/'+locale+'/'+l.href}>{l[locale]}</Link></span>)}</p>
      </section>}
      <p className={styles.method}>{locale==='uk'?'GalaxiNews добирає новини зі світових тематичних видань, перекладає заголовки й короткі описи та завжди веде до першоджерела. Права на текст і фото належать виданню. ':'GalaxiNews selects stories from subject publications worldwide, translates headlines and short summaries, and always links to the original. Text and photo rights belong to the publisher. '}
       <Link href={'/'+locale+'/methodology'}>{locale==='uk'?'Редакційні принципи':'Editorial principles'}</Link></p>
     </>}
    </article>
    <aside className={styles.aside} aria-label={locale==='uk'?'Пов’язане':'Related'}>
     {own&&visibleEvents.length>0&&<SkyStrip events={visibleEvents} own={ownItems} locale={locale} now={now}/>}
     {!own&&<TodayPanel locale={locale}/>}
     <Related items={related} locale={locale} now={now}/>
    </aside>
   </div>
  </div>
 </PortalShell>;
}
