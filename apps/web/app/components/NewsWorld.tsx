'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,BookOpen,Check,ChevronDown,Compass,Heart,HeartOff,MoonStar,RefreshCw,Sparkles,Tags,Orbit} from 'lucide-react';
import PortalShell from './PortalShell';
import styles from './NewsWorld.module.css';
import type {PortalLocale} from '../../lib/brand';

const TOPICS=['jyotish','astrology','tarot','yoga','meditation','vedic','self-development','astronomy'] as const;
type Topic=typeof TOPICS[number];
type Story={id:string;url:string;title:string;source:string;language:string;topic:Topic;tags:Topic[];publishedAt:string;relevance:number;publishedAccuracy?:'observed'|'published';summary?:string|null;summaryKind?:string;summaryUk?:string|null;summaryEn?:string|null};
type Feed={items:Story[];total:number;lastScan:{createdAt:string;errors:number;sources:number}|null;intervalMinutes:number};
type View='all'|'latest'|'mine';
type Vote='yes'|'no';
const LABELS:Record<Topic,{uk:string;en:string}>={
 jyotish:{uk:'Джйотіш',en:'Jyotish'},astrology:{uk:'Астрологія',en:'Astrology'},tarot:{uk:'Таро',en:'Tarot'},
 yoga:{uk:'Йога',en:'Yoga'},meditation:{uk:'Медитація',en:'Meditation'},
 vedic:{uk:'Ведична традиція',en:'Vedic traditions'},
 'self-development':{uk:'Саморозвиток',en:'Self-development'},astronomy:{uk:'Астрономія',en:'Astronomy'}
};
const COPY={
 uk:{
  kicker:'GALAXIORA · DISCOVER',title:'GalaxiNews',subtitle:'Живий світ астрології, Таро та духовних традицій.',
  intro:'Відкривай нові матеріали з усього світу. Обирай теми, знаходь першоджерела та формуй стрічку, яка цікава саме тобі.',
  all:'Головне',latest:'Найсвіжіше',mine:'Для мене',topics:'Хмара твоїх інтересів',
  topicsHint:'Обери кілька тегів — вони стануть основою твоєї добірки. Поки що вибір зберігається лише в цьому браузері.',
  allTopics:'Усі теми',aside:'Окрема категорія: астрономія',asideInfo:'Астрономічні матеріали не змішуються з астрологічними трактуваннями автоматично.',
  update:'Перевірка джерел приблизно кожні 15 хвилин',last:'Остання перевірка',
  world:'Світові матеріали',select:'Обери теми вище, щоб сформувати добірку.',
  zero:'Поки немає підтверджених матеріалів за цим фільтром.',
  bootstrap:'Стрічка ще наповнюється перевіреними джерелами. Ми не створюємо вигаданих заголовків.',
  offline:'Не вдалося завантажити стрічку. Перевір з’єднання й спробуй знову.',
  more:'Показати ще',retry:'Спробувати ще раз',original:'Читати в першоджерелі',observed:'Знайдено',sourceExcerpt:'Опис джерела',titleBased:'Орієнтир за заголовком',refresh:'Оновити стрічку',
  interesting:'Вам цікава ця публікація?',yes:'Так, цікаво',no:'Не для мене',thanks:'Враховано у вашій локальній добірці',
  chosen:'Обрані теми',reset:'Очистити вибір',external:'Зовнішня публікація',
  attribution:'Заголовки належать відповідним видавцям. Galaxiora показує посилання на першоджерела; текст статті залишається на сайті автора.',
  yourFeed:'Добірка за твоїми інтересами',noPersonal:'Обери хоча б один тег, щоб налаштувати стрічку.',
  nothingPersonal:'За обраними тегами ще немає публікацій. Спробуй інші теми.',
  newest:'За часом публікації',relevant:'За релевантністю'
 },
 en:{
  kicker:'GALAXIORA · DISCOVER',title:'GalaxiNews',subtitle:'A living world of astrology, Tarot and spiritual traditions.',
  intro:'Discover new material from around the world. Choose topics, explore original sources, and shape a feed that matters to you.',
  all:'Highlights',latest:'Latest',mine:'For me',topics:'Your constellation of interests',
  topicsHint:'Choose a few tags to shape your reading. For now, your choices stay in this browser only.',
  allTopics:'All topics',aside:'Separate category: astronomy',asideInfo:'Astronomy stories are never automatically treated as astrological interpretations.',
  update:'Sources checked approximately every 15 minutes',last:'Last checked',
  world:'Stories around the world',select:'Choose topics above to create your collection.',
  zero:'No verified source articles match this filter yet.',
  bootstrap:'The feed is still collecting verified sources. We never invent headlines.',
  offline:'The news feed could not load. Check your connection and try again.',
  more:'Load more',retry:'Try again',original:'Read original story',observed:'Discovered',sourceExcerpt:'Source description',titleBased:'Headline-based preview',refresh:'Refresh feed',
  interesting:'Was this publication interesting?',yes:'Yes, interested',no:'Not for me',thanks:'Applied to your browser-only feed',
  chosen:'Selected topics',reset:'Clear selection',external:'External publication',
  attribution:'Headlines belong to their publishers. Galaxiora links to original sources; article bodies remain with their authors.',
  yourFeed:'Stories based on your interests',noPersonal:'Choose at least one tag to personalize this feed.',
  nothingPersonal:'No articles match your selected tags yet. Try another topic.',
  newest:'Publication time',relevant:'Relevance'
 }
} as const;
const STORAGE='galaxiora:news-world:v1';
const validTag=(t:unknown):t is Topic=>typeof t==='string'&&(TOPICS as readonly string[]).includes(t);
function safeLink(link:string){try{const u=new URL(link);return u.protocol==='https:'?u.href:null;}catch{return null;}}
export default function NewsWorld({locale}:{locale:PortalLocale}){
 const t=COPY[locale],[view,setView]=useState<View>('all'),[category,setCategory]=useState<string>('all');
 const [selected,setSelected]=useState<Topic[]>([]),[votes,setVotes]=useState<Record<string,Vote>>({});
 const [ready,setReady]=useState(false),[items,setItems]=useState<Story[]>([]),[total,setTotal]=useState(0);
 const [lastScan,setLastScan]=useState<Feed['lastScan']>(null),[page,setPage]=useState(1);
 const [busy,setBusy]=useState(true),[error,setError]=useState(false),[reload,setReload]=useState(0);
 useEffect(()=>{
  try{
   const saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');
   if(Array.isArray(saved.tags))setSelected(saved.tags.filter(validTag));
   if(saved.votes&&typeof saved.votes==='object'&&!Array.isArray(saved.votes))
    setVotes(Object.fromEntries(Object.entries(saved.votes).filter(([key,value])=>key.length<160&&['yes','no'].includes(String(value))).slice(-200)) as Record<string,Vote>);
  }catch{}
  setReady(true);
 },[]);
 useEffect(()=>{
  if(!ready)return;
  try{localStorage.setItem(STORAGE,JSON.stringify({tags:selected,votes}));}catch{}
 },[ready,selected,votes]);
 useEffect(()=>{
  const controller=new AbortController();
  setBusy(true);setError(false);
  const params=new URLSearchParams({limit:'48',page:String(page),sort:view==='latest'?'latest':'relevance'});
  if(category!=='all')params.set('topic',category);
  if(view==='mine'&&selected.length)params.set('tags',selected.join(','));
  const url='/api/v1/news/feed?'+params.toString();
  void fetch(url,{signal:controller.signal,cache:'no-store'})
   .then(async r=>{if(!r.ok)throw Error(String(r.status));return await r.json() as Feed;})
   .then(data=>{
    if(controller.signal.aborted)return;
    setItems(old=>page===1?data.items:[...old,...data.items.filter(x=>!old.some(o=>o.id===x.id))]);
    setTotal(data.total);setLastScan(data.lastScan);
   })
   .catch(()=>{if(!controller.signal.aborted)setError(true);})
   .finally(()=>{if(!controller.signal.aborted)setBusy(false);});
  return()=>controller.abort();
 },[category,page,reload,view,selected]);
 const resetCategory=(value:string)=>{setCategory(value);setPage(1);setItems([]);};
 const toggleTag=(tag:Topic)=>setSelected(old=>old.includes(tag)?old.filter(t=>t!==tag):[...old,tag]);
 const answer=(story:Story,vote:Vote)=>{
  setVotes(old=>({...old,[story.id]:vote}));
  if(vote==='yes')setSelected(old=>old.includes(story.topic)?old:[...old,story.topic]);
 };
 const visible=useMemo(()=>{
  let list=items.filter(story=>!(view==='mine'&&votes[story.id]==='no'));
  if(view==='mine')list=selected.length?list.filter(story=>story.tags.some(tag=>selected.includes(tag))):[];
  if(view==='latest')list=[...list].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
  return list;
 },[items,view,selected,votes]);
 useEffect(()=>{
  const timer=setInterval(()=>{if(document.visibilityState==='visible'){
   setPage(1);setReload(x=>x+1);
  }},15*60*1000);
  return()=>clearInterval(timer);
 },[]);
 const canMore=items.length<total&&page<20;
 const date=(iso:string)=>{const d=new Date(iso);return Number.isFinite(d.getTime())?
  new Intl.DateTimeFormat(locale==='uk'?'uk-UA':'en-GB',{day:'numeric',month:'short',year:'numeric'}).format(d):'';};
 const preview=(story:Story)=>{
  if(story.summaryKind==='source_excerpt'&&story.summary)return story.summary;
  if(locale==='uk')return story.summaryUk||'Матеріал джерела «'+story.source+'» присвячений темі «'+LABELS[story.topic][locale]+
   '» та питанню, винесеному в заголовок: «'+story.title+'». Детальні пояснення містяться в оригінальній публікації.';
  return story.summaryEn||story.summary||'This publication by '+story.source+' covers '+
   LABELS[story.topic][locale].toLowerCase()+' and the subject in its headline: “'+story.title+
   '”. Read the original article for details and context.';
 };
 const art=(topic:Topic)=>topic==='tarot'?'✦':topic==='yoga'?'ॐ':topic==='jyotish'?'☾':topic==='meditation'?'◉':topic==='vedic'?'❂':topic==='astronomy'?'✧':'✺';
 return <PortalShell locale={locale} active="news">
  <div className={styles.world} data-testid="galaxinews-world">
   <header className={styles.hero}>
    <div className={styles.heroCopy}>
     <span className={styles.eyebrow}><Sparkles size={13}/>{t.kicker}</span>
     <h1>{t.title}</h1><h2>{t.subtitle}</h2><p>{t.intro}</p>
     <span className={styles.update}><RefreshCw size={14}/>{t.update}</span>
    </div>
    <div className={styles.cosmos} aria-hidden="true"><div className={styles.orbit1}/><div className={styles.orbit2}/><MoonStar size={84} strokeWidth={0.75}/><i className={styles.star1}/><i className={styles.star2}/></div>
   </header>
   <nav className={styles.views} aria-label={locale==='uk'?'Тип стрічки':'Feed type'}>
    {(['all','latest','mine'] as const).map(v=><button key={v} type="button" className={view===v?styles.active:''}
     aria-pressed={view===v} onClick={()=>{setView(v);setPage(1);setItems([]);}}>{v==='mine'?<Heart size={15}/>:v==='latest'?<Compass size={15}/>:<Orbit size={15}/>} {t[v]}</button>)}
   </nav>
   <section className={styles.tagSection} aria-label={t.topics}>
    <div className={styles.sectionTitle}><span><Tags size={18}/>{t.topics}</span><small>{t.topicsHint}</small></div>
    <div className={styles.tags}>
     {TOPICS.filter(x=>x!=='astronomy').map(tag=><button type="button" key={tag} onClick={()=>toggleTag(tag)}
      className={selected.includes(tag)?styles.tagActive:styles.tag} aria-pressed={selected.includes(tag)}>
       {selected.includes(tag)&&<Check size={13}/>} {LABELS[tag][locale]}</button>)}
    </div>
    <div className={styles.astronomy}><button className={selected.includes('astronomy')?styles.tagActive:styles.tag}
      onClick={()=>toggleTag('astronomy')} aria-pressed={selected.includes('astronomy')} type="button">
      {selected.includes('astronomy')&&<Check size={13}/>} {LABELS.astronomy[locale]}</button>
      <small>{t.asideInfo}</small></div>
    {selected.length>0&&<div className={styles.selected}><span>{t.chosen}: {selected.length}</span>
      <button onClick={()=>setSelected([])} type="button">{t.reset}</button></div>}
   </section>
   <div className={styles.feedLayout}>
    <section className={styles.feed} aria-label={view==='mine'?t.yourFeed:t.world}>
     <div className={styles.feedHeader}>
      <div><small>{view==='mine'?t.yourFeed:t.world}</small><h2>{view==='latest'?t.newest:t[view]}</h2></div>
      <button className={styles.refreshButton} type="button" onClick={()=>{setPage(1);setReload(x=>x+1);}} aria-label={t.refresh} title={t.refresh}><RefreshCw size={17}/></button>
      <div className={styles.filters}><label htmlFor="news-topic-filter">{t.allTopics}</label>
       <select id="news-topic-filter" value={category} onChange={e=>resetCategory(e.target.value)}>
        <option value="all">{t.allTopics}</option>{TOPICS.map(x=><option key={x} value={x}>{LABELS[x][locale]}</option>)}
       </select><ChevronDown size={14} aria-hidden="true"/></div>
     </div>
     {error?<div className={styles.empty} role="alert"><p>{t.offline}</p><button type="button" onClick={()=>setReload(x=>x+1)}>{t.retry}</button></div>:
      busy&&page===1?<div className={styles.empty} role="status"><RefreshCw size={24}/><p>{t.update}</p></div>:
      view==='mine'&&!selected.length?<div className={styles.empty}><Tags size={28}/><p>{t.noPersonal}</p></div>:
      visible.length===0?<div className={styles.empty}><BookOpen size={28}/><p>{view==='mine'?t.nothingPersonal:lastScan?t.zero:t.bootstrap}</p></div>:
      <div className={styles.cards}>
       {visible.map((story,i)=>{const url=safeLink(story.url),v=votes[story.id];
        return <article className={i===0&&view!=='mine'?styles.lead:styles.card} key={story.id}>
         <div className={styles.illustration} data-topic={story.topic} aria-hidden="true">
          <span>{art(story.topic)}</span><i/></div>
         <div className={styles.story}>
          <div className={styles.meta}><span>{LABELS[story.topic]?.[locale]||story.topic}</span><span>·</span>
           <time dateTime={story.publishedAt}>{story.publishedAccuracy==='observed'?t.observed+' · ':''}{date(story.publishedAt)}</time></div>
          <h3>{story.title}</h3>
          <p className={styles.summary} data-testid="news-summary">{preview(story)}</p>
          <p className={styles.source}>{story.source} · {story.summaryKind==='source_excerpt'?t.sourceExcerpt:t.titleBased}</p>
          <div className={styles.storyEnd}>
           {url&&<a href={url} target="_blank" rel="noopener noreferrer" aria-label={t.original+': '+story.title}>
            {t.original}<ArrowUpRight size={16}/></a>}
           {v&&<span className={styles.voteMarked}>{v==='yes'?<Heart size={13}/>:<HeartOff size={13}/>} {t.thanks}</span>}
          </div>
         </div>
         {(i+1)%5===0&&<div className={styles.feedback} data-testid="news-feedback">
          <p>{t.interesting}</p><div><button type="button" aria-pressed={v==='yes'} onClick={()=>answer(story,'yes')}><Heart size={14}/>{t.yes}</button>
           <button type="button" aria-pressed={v==='no'} onClick={()=>answer(story,'no')}><HeartOff size={14}/>{t.no}</button></div>
         </div>}
        </article>;
       })}
      </div>}
     {canMore&&!error&&<button className={styles.more} type="button" disabled={busy} onClick={()=>setPage(x=>x+1)}>
       {busy?t.update:t.more}<ChevronDown size={16}/></button>}
    </section>
    <aside className={styles.sidebar}>
     <div className={styles.asideBox}><MoonStar size={25}/><h3>{t.topics}</h3><p>{t.topicsHint}</p>
      <div className={styles.asideTags}>{selected.map(x=><span key={x}>{LABELS[x][locale]}</span>)}</div></div>
     <div className={styles.asideBox}><RefreshCw size={22}/><h3>{t.update}</h3>
      <p>{lastScan?t.last+': '+date(lastScan.createdAt):t.bootstrap}</p></div>
    </aside>
   </div>
   <footer className={styles.footnote}>{t.attribution}</footer>
  </div>
 </PortalShell>;
}
