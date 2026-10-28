'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,BookOpen,Check,ChevronDown,Compass,Heart,HeartOff,MoonStar,RefreshCw,Sparkles,Tags,Orbit,Search,X,Settings2,Download,Trash2,Undo2,ShieldCheck} from 'lucide-react';
import PortalShell from './PortalShell';
import styles from './NewsWorld.module.css';
import type {PortalLocale} from '../../lib/brand';

const TOPICS=['jyotish','astrology','tarot','yoga','meditation','vedic','self-development','astronomy'] as const;
type Topic=typeof TOPICS[number];
const EXTRA_INTEREST_TAGS=['natal-charts','nakshatras','mantras','pranayama'] as const;
const INTEREST_TAGS=[...TOPICS,...EXTRA_INTEREST_TAGS] as const;
type InterestTag=typeof INTEREST_TAGS[number];
type Story={id:string;url:string;title:string;source:string;language:string;topic:Topic;tags:InterestTag[];publishedAt:string;relevance:number;publishedAccuracy?:'observed'|'published';summary?:string|null;summaryKind?:string;summaryUk?:string|null;summaryEn?:string|null;titleUk?:string|null;imageUrl?:string|null;imageCredit?:string|null;imagePageUrl?:string|null;imageLicense?:string|null;imageLicenseUrl?:string|null;personalReason?:'selected_topic'|'similar_to_liked'|'fresh_discovery'|'world_highlight';matchingTag?:InterestTag|null};
type Feed={items:Story[];total:number;articleCount:number;lastScan:{createdAt:string;errors:number;sources:number}|null};
type View='all'|'latest'|'mine';
type Vote='yes'|'no';
type GuestNewsHint={topic:Topic;tags:InterestTag[];title:string};
type ReactionRow={articleId:string;vote:'YES'|'NO';updatedAt:string;article:{title:string;titleUk?:string|null;url:string;source:string;topic:string}};
const LABELS:Record<InterestTag,{uk:string;en:string}>={
 jyotish:{uk:'Джйотіш',en:'Jyotish'},astrology:{uk:'Астрологія',en:'Astrology'},tarot:{uk:'Таро',en:'Tarot'},
 yoga:{uk:'Йога',en:'Yoga'},meditation:{uk:'Медитація',en:'Meditation'},
 vedic:{uk:'Ведична традиція',en:'Vedic traditions'},
 'self-development':{uk:'Саморозвиток',en:'Self-development'},astronomy:{uk:'Астрономія',en:'Astronomy'},
 'natal-charts':{uk:'Натальні карти',en:'Natal charts'},nakshatras:{uk:'Накшатри',en:'Nakshatras'},
 mantras:{uk:'Мантри',en:'Mantras'},pranayama:{uk:'Пранаяма',en:'Pranayama'}
};
const COPY={
 uk:{
  kicker:'GALAXIORA · DISCOVER',title:'GalaxiNews',subtitle:'Живий світ астрології, Таро та духовних традицій.',
  intro:'Відкривай нові матеріали з усього світу. Обирай теми, знаходь першоджерела та формуй стрічку, яка цікава саме тобі.',
  all:'Головне',latest:'Найсвіжіше',mine:'Для мене',topics:'Хмара твоїх інтересів',articles:'статей',
  allTopics:'Усі теми',
  loading:'Завантажуємо новини…',
  world:'Світові матеріали',select:'Обери теми вище, щоб сформувати добірку.',
  zero:'Поки немає підтверджених матеріалів за цим фільтром.',
  bootstrap:'Нові матеріали з’являються в міру оновлення джерел. Переглянь інші цікаві теми.',
  offline:'Новини зараз недоступні. Спробуй оновити стрічку трохи пізніше.',
  more:'Показати ще',retry:'Спробувати ще раз',original:'Читати в першоджерелі',observed:'Знайдено',refresh:'Оновити стрічку',
  interesting:'Вам цікава ця публікація?',yes:'Так, цікаво',no:'Не для мене',thanks:'Враховано у твоїй стрічці',
  feedbackSaved:'Реакцію збережено в кабінеті',feedbackLocal:'Враховано в цьому браузері',
  feedbackError:'Не вдалося зберегти реакцію. Повтори спробу.',
  reasonChosen:'За обраним інтересом',reasonLiked:'Схоже на те, що тобі сподобалося',
  reasonFresh:'Нова тема для відкриття',reasonWorld:'Важлива світова публікація',
  chosen:'Обрані теми',reset:'Очистити вибір',external:'Зовнішня публікація',
  attribution:'Заголовки належать відповідним видавцям. Galaxiora показує посилання на першоджерела; текст статті залишається на сайті автора.',
  yourFeed:'Добірка за твоїми інтересами',noPersonal:'Обери хоча б один тег, щоб налаштувати стрічку.',
  nothingPersonal:'За обраними тегами ще немає публікацій. Спробуй інші теми.',
  newest:'За часом публікації',relevant:'За релевантністю',search:'Пошук новин',searchPlaceholder:'Таро, ретроградна Венера, йога…',clearSearch:'Очистити пошук',searchResults:'Результати пошуку',
  saveAccount:'Зберегти інтереси в кабінеті',savedAccount:'Інтереси збережено',
  guestLocal:'Увійди, щоб синхронізувати інтереси.',
  saveFailed:'Не вдалося синхронізувати інтереси. Спробуй ще раз.',
  importGuest:'Додати теми з цього браузера',
  manage:'Керування рекомендаціями',manageNote:'Обирай, які інтереси й реакції зберігати.',
  personalizedOn:'Персоналізацію увімкнено',personalizedOff:'Персоналізацію вимкнено',
  offNote:'Ти бачитимеш світові новини без персональних рекомендацій.',
  history:'Історія реакцій',noHistory:'Ще немає оцінених публікацій.',
  undo:'Скасувати',moreHistory:'Показати ще',historyLimit:'Показано останні 1000 реакцій. Повну історію можна експортувати.',
  clearHistory:'Очистити реакції',resetAll:'Скинути новинні налаштування',
  exportData:'Експортувати дані',confirmClear:'Видалити всі реакції?',
  confirmReset:'Очистити інтереси й реакції GalaxiNews? Натальні карти й інші дані залишаться.',
  confirmYes:'Так, видалити',cancel:'Назад',settingsError:'Не вдалося виконати дію. Спробуй ще раз.',
  guestClear:'Очистити локальні реакції'
 },
 en:{
  kicker:'GALAXIORA · DISCOVER',title:'GalaxiNews',subtitle:'A living world of astrology, Tarot and spiritual traditions.',
  intro:'Discover new material from around the world. Choose topics, explore original sources, and shape a feed that matters to you.',
  all:'Highlights',latest:'Latest',mine:'For me',topics:'Your constellation of interests',articles:'articles',
  allTopics:'All topics',
  loading:'Loading stories…',
  world:'Stories around the world',select:'Choose topics above to create your collection.',
  zero:'No verified source articles match this filter yet.',
  bootstrap:'Explore new stories and original sources as the news feed updates.',
  offline:'News are temporarily unavailable. Please try refreshing shortly.',
  more:'Load more',retry:'Try again',original:'Read original story',observed:'Discovered',refresh:'Refresh feed',
  interesting:'Was this publication interesting?',yes:'Yes, interested',no:'Not for me',thanks:'Taken into account',
  feedbackSaved:'Reaction saved to account',feedbackLocal:'Applied in this browser',
  feedbackError:'Could not save reaction. Try again.',
  reasonChosen:'Based on your selected interest',reasonLiked:'Similar to stories you liked',
  reasonFresh:'Discover something new',reasonWorld:'World highlight',
  chosen:'Selected topics',reset:'Clear selection',external:'External publication',
  attribution:'Headlines belong to their publishers. Galaxiora links to original sources; article bodies remain with their authors.',
  yourFeed:'Stories based on your interests',noPersonal:'Choose at least one tag to personalize this feed.',
  nothingPersonal:'No articles match your selected tags yet. Try another topic.',
  newest:'Publication time',relevant:'Relevance',search:'Search news',searchPlaceholder:'Tarot, Venus retrograde, yoga…',clearSearch:'Clear search',searchResults:'Search results',
  saveAccount:'Save interests to my account',savedAccount:'Interests saved to account',
  guestLocal:'Sign in to sync your interests.',
  saveFailed:'Could not sync interests. Please try again.',
  importGuest:'Add topics from this browser',
  manage:'Manage recommendations',manageNote:'Choose the interests and reactions you keep.',
  personalizedOn:'Personalization on',personalizedOff:'Personalization off',
  offNote:'World headlines are shown without personalized recommendations.',
  history:'Reaction history',noHistory:'No reactions recorded yet.',
  undo:'Undo',moreHistory:'Show more',historyLimit:'Showing the latest 1000 reactions; export for the full history.',
  clearHistory:'Clear reactions',resetAll:'Reset news settings',
  exportData:'Export data',confirmClear:'Delete all news reactions?',
  confirmReset:'Clear GalaxiNews interests and feedback? Other account data remains intact.',
  confirmYes:'Yes, delete',cancel:'Back',settingsError:'Unable to complete the action. Try again.',
  guestClear:'Clear local reactions'
 }
} as const;
const STORAGE='galaxiora:news-world:v1';
const validTag=(t:unknown):t is InterestTag=>typeof t==='string'&&(INTEREST_TAGS as readonly string[]).includes(t);
function guestSimilar(story:Story,hint:GuestNewsHint){
 if(story.topic!==hint.topic)return false;
 if(story.tags.some(tag=>!TOPICS.includes(tag as Topic)&&hint.tags.includes(tag)))return true;
 const words=(value:string)=>new Set((value.toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]{4,}/gu)||[])
  .filter(word=>!['tarot','yoga','jyotish','astrology','астрологія','таро','йога','джйотіш','today','world'].includes(word)));
 const a=words(story.titleUk||story.title),b=words(hint.title);
 if(a.size<2||b.size<2)return false;
 const common=[...a].filter(word=>b.has(word)).length;
 return common>=2&&common/Math.min(a.size,b.size)>=0.6;
}
function safeLink(link:string){try{const u=new URL(link);return u.protocol==='https:'?u.href:null;}catch{return null;}}
/** An authorized publisher thumbnail; broken external images fall back to site artwork. */
function StoryArtwork({imageUrl,credit,title,topic,art,sourceUrl,licenseUrl,license}:{imageUrl?:string|null;credit?:string|null;title:string;topic:Topic;art:string;sourceUrl?:string|null;licenseUrl?:string|null;license?:string|null}){
 const [broken,setBroken]=useState(false);
 useEffect(()=>setBroken(false),[imageUrl]);
 let allowed=false;
 try{const u=new URL(imageUrl||'');allowed=u.protocol==='https:';}catch{}
 return <div className={styles.illustration} data-topic={topic}>
  {allowed&&!broken?<img className={styles.storyImage} src={imageUrl!} alt={sourceUrl?"Ілюстративне фото за темою: "+title:title} loading="lazy"
   referrerPolicy="no-referrer" onError={()=>setBroken(true)}/>:
   <div className={styles.fallbackArt} aria-hidden="true"><span>{art}</span><i/></div>}
  {allowed&&!broken&&credit&&<small className={styles.imageCredit}>
   {sourceUrl&&sourceUrl.startsWith('https://commons.wikimedia.org/')?
    <a href={sourceUrl} target="_blank" rel="noopener noreferrer" title="Photo source and author">{credit}</a>:credit}
   {sourceUrl&&licenseUrl&&licenseUrl.startsWith('https://creativecommons.org/')&&
    <a href={licenseUrl} target="_blank" rel="noopener noreferrer" title="Creative Commons license">
     {' · '+(license||'CC license')}
    </a>}
  </small>}
 </div>;
}
export default function NewsWorld({locale}:{locale:PortalLocale}){
 const t=COPY[locale],[view,setView]=useState<View>('all'),[category,setCategory]=useState<string>('all');
 const [selected,setSelected]=useState<InterestTag[]>([]),[votes,setVotes]=useState<Record<string,Vote>>({});
 const [guestDismissed,setGuestDismissed]=useState<Record<string,GuestNewsHint>>({});
 const [votePending,setVotePending]=useState<string|null>(null);
 const [voteError,setVoteError]=useState<string|null>(null);
 const [ready,setReady]=useState(false),[items,setItems]=useState<Story[]>([]),[total,setTotal]=useState(0);
 const [lastScan,setLastScan]=useState<Feed['lastScan']>(null),[page,setPage]=useState(1);
 const [articleCount,setArticleCount]=useState<number|null>(null);
 const [busy,setBusy]=useState(true),[error,setError]=useState(false),[reload,setReload]=useState(0);
 const [search,setSearch]=useState(''),[query,setQuery]=useState('');
 const [accountStatus,setAccountStatus]=useState<'loading'|'guest'|'member'>('loading');
 const [accountTags,setAccountTags]=useState<InterestTag[]>([]);
 const [syncing,setSyncing]=useState(false),[syncError,setSyncError]=useState(false);
 const guestTopics=useRef<InterestTag[]>([]);
 const guestVotes=useRef<Record<string,Vote>>({});
 const [pendingGuest,setPendingGuest]=useState<InterestTag[]>([]);
 const [personalEnabled,setPersonalEnabled]=useState(true);
 const [history,setHistory]=useState<ReactionRow[]>([]),[historyTotal,setHistoryTotal]=useState(0);
 const [historyShown,setHistoryShown]=useState(8),[manageOpen,setManageOpen]=useState(false);
 const [privacyBusy,setPrivacyBusy]=useState(false),[privacyError,setPrivacyError]=useState(false);
 const [confirmMode,setConfirmMode]=useState<'clear'|'reset'|'guest'|null>(null);
 // Only a changed search term may start a new feed request.
 // Never clear fetched stories from a timer: on the initial mount that raced
 // with the API response and left the page empty until the manual refresh.
 useEffect(()=>{
  const timer=setTimeout(()=>{
   const next=search.trim();
   setQuery(previous=>previous===next?previous:next);
   setPage(1);
  },320);
  return()=>clearTimeout(timer);
 },[search]);
 useEffect(()=>{
  try{
   const saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');
   if(Array.isArray(saved.tags)){const tags=saved.tags.filter(validTag);guestTopics.current=tags;setSelected(tags);}
   if(saved.dismissedHints&&typeof saved.dismissedHints==='object'&&!Array.isArray(saved.dismissedHints)){
    const hints=Object.entries(saved.dismissedHints as Record<string,unknown>).filter(([id,value])=>{
     if(id.length>160||!value||typeof value!=='object')return false;
     const v=value as GuestNewsHint;
     return TOPICS.includes(v.topic)&&Array.isArray(v.tags)&&typeof v.title==='string'&&v.title.length<300;
    }).slice(-200);
    setGuestDismissed(Object.fromEntries(hints) as Record<string,GuestNewsHint>);
   }
   if(saved.votes&&typeof saved.votes==='object'&&!Array.isArray(saved.votes)){
    const guest=Object.fromEntries(Object.entries(saved.votes).filter(([key,value])=>key.length<160&&['yes','no'].includes(String(value))).slice(-200)) as Record<string,Vote>;
    guestVotes.current=guest;setVotes(guest);
   }
  }catch{}
  setReady(true);
 },[]);
 useEffect(()=>{
  if(!ready)return;
  if(accountStatus!=='guest')return;
  try{localStorage.setItem(STORAGE,JSON.stringify({tags:selected,votes,dismissedHints:guestDismissed}));}catch{}
 },[ready,selected,votes,guestDismissed,accountStatus]);
 useEffect(()=>{
  if(!ready)return;
  const controller=new AbortController();
  void fetch('/api/v1/news/interests',{
   credentials:'same-origin',cache:'no-store',signal:controller.signal
  }).then(async response=>{
   if(response.status===401){setAccountStatus('guest');setVotes(guestVotes.current);setHistory([]);setHistoryTotal(0);return;}
   if(!response.ok)throw Error('News account interests HTTP '+response.status);
   const data=await response.json() as {tags?:unknown;enabled?:boolean};
   if(controller.signal.aborted)return;
   const saved=Array.isArray(data.tags)?data.tags.filter(validTag):[];
   // The account's votes are private and must never reuse another account's local votes.
   const feedbackResponse=await fetch('/api/v1/news/reactions',{
    credentials:'same-origin',cache:'no-store',signal:controller.signal
   });
   if(!feedbackResponse.ok)throw Error('News reactions HTTP '+feedbackResponse.status);
   const feedback=await feedbackResponse.json() as {items?:ReactionRow[];total?:number};
   if(controller.signal.aborted)return;
   setVotes(Object.fromEntries((feedback.items||[]).filter(x=>x.articleId&&['YES','NO'].includes(x.vote))
    .map(x=>[x.articleId,x.vote==='YES'?'yes':'no'])) as Record<string,Vote>);
   setHistory(feedback.items||[]);
   setHistoryTotal(feedback.total??(feedback.items||[]).length);
   setPersonalEnabled(data.enabled!==false);
   setAccountTags(saved);
   setAccountStatus('member');
   // Stored account preferences win on sign-in. Guest choices remain optional.
   setPendingGuest(guestTopics.current.filter(tag=>!saved.includes(tag)));
   setSelected(saved);
  }).catch(()=>{if(!controller.signal.aborted){
   // Fail closed: do not mistake an account API error for permission to upload guest votes.
   setAccountStatus('loading');setVotes({});setHistory([]);setHistoryTotal(0);
  }});
  return()=>controller.abort();
 },[ready]);
 const accountTagsDiffer=selected.length!==accountTags.length||
  selected.some(tag=>!accountTags.includes(tag));
 const saveAccountInterests=async()=>{
  if(accountStatus!=='member'||syncing)return;
  setSyncing(true);setSyncError(false);
  try{
   const response=await fetch('/api/v1/news/interests',{
    method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({tags:selected})
   });
   if(response.status===401){setAccountStatus('guest');setSelected(guestTopics.current);setVotes(guestVotes.current);setHistory([]);throw Error('Signed out');}
   if(!response.ok)throw Error('News interests HTTP '+response.status);
   const updated=await response.json() as {tags?:unknown};
   if(Array.isArray(updated.tags))setAccountTags(updated.tags.filter(validTag));
  }catch{setSyncError(true);}
  finally{setSyncing(false);}
 };

 useEffect(()=>{
  const controller=new AbortController();
  setBusy(true);setError(false);
  const params=new URLSearchParams({limit:'48',page:String(page),
   sort:view==='latest'?'latest':view==='mine'&&accountStatus==='member'?'personal':'relevance'});
  if(category!=='all')params.set('topic',category);
  if(view==='mine'&&selected.length)params.set('tags',selected.join(','));
  if(query.length>=2)params.set('q',query);
  const url='/api/v1/news/feed?'+params.toString();
  void fetch(url,{signal:controller.signal,cache:'no-store'})
   .then(async r=>{if(!r.ok)throw Error(String(r.status));return await r.json() as Feed;})
   .then(data=>{
    if(controller.signal.aborted)return;
    setItems(old=>page===1?data.items:[...old,...data.items.filter(x=>!old.some(o=>o.id===x.id))]);
    setTotal(data.total);setLastScan(data.lastScan);
    if(Number.isInteger(data.articleCount)&&data.articleCount>=0)setArticleCount(data.articleCount);
   })
   .catch(()=>{if(!controller.signal.aborted)setError(true);})
   .finally(()=>{if(!controller.signal.aborted)setBusy(false);});
  return()=>controller.abort();
 },[category,page,reload,view,selected,query,accountStatus]);
 const resetCategory=(value:string)=>{setCategory(value);setPage(1);setItems([]);};
 const toggleTag=(tag:InterestTag)=>setSelected(old=>old.includes(tag)?old.filter(t=>t!==tag):[...old,tag]);

 const refreshHistory=async()=>{
  const response=await fetch('/api/v1/news/reactions',{credentials:'same-origin',cache:'no-store'});
  if(!response.ok)throw Error('Could not load reactions');
  const data=await response.json() as {items:ReactionRow[];total:number};
  setHistory(data.items);setHistoryTotal(data.total);
 };
 const savePrivacySwitch=async()=>{
  if(accountStatus!=='member'||privacyBusy)return;
  setPrivacyBusy(true);setPrivacyError(false);
  try{
   const r=await fetch('/api/v1/news/settings',{method:'PUT',credentials:'same-origin',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:!personalEnabled})});
   if(!r.ok)throw Error('Settings update failed');
   const data=await r.json() as {enabled:boolean};
   setPersonalEnabled(data.enabled);setPage(1);setReload(n=>n+1);
  }catch{setPrivacyError(true);}finally{setPrivacyBusy(false);}
 };
 const exportNewsData=async()=>{
  if(accountStatus!=='member'||privacyBusy)return;
  setPrivacyBusy(true);setPrivacyError(false);
  try{
   const response=await fetch('/api/v1/news/privacy/export',{credentials:'same-origin',cache:'no-store'});
   if(!response.ok)throw Error('Export failed');
   const data=await response.json();
   const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
   const link=document.createElement('a');
   link.href=url;link.download='galaxiora-news-'+new Date().toISOString().slice(0,10)+'.json';
   document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),3000);
  }catch{setPrivacyError(true);}finally{setPrivacyBusy(false);}
 };
 const undoHistory=async(id:string)=>{
  if(privacyBusy||accountStatus!=='member')return;
  setPrivacyBusy(true);setPrivacyError(false);
  try{
   const r=await fetch('/api/v1/news/reactions/'+encodeURIComponent(id),{
    method:'DELETE',credentials:'same-origin'});
   if(!r.ok)throw Error('Undo failed');
   setVotes(old=>{const next={...old};delete next[id];return next;});
   setHistory(old=>old.filter(x=>x.articleId!==id));
   setHistoryTotal(n=>Math.max(0,n-1));
   if(view==='mine')setReload(n=>n+1);
  }catch{setPrivacyError(true);}finally{setPrivacyBusy(false);}
 };
 const confirmedDelete=async()=>{
  if(privacyBusy||!confirmMode)return;
  const target=confirmMode;
  setPrivacyBusy(true);setPrivacyError(false);
  try{
   if(target==='guest'){
    guestVotes.current={};setVotes({});setGuestDismissed({});
   }else{
    if(accountStatus!=='member')throw Error('No session');
    const path=target==='reset'?'/api/v1/news/privacy/reset':'/api/v1/news/reactions';
    const response=await fetch(path,{method:'DELETE',credentials:'same-origin'});
    if(!response.ok)throw Error('Delete failed');
    setVotes({});setHistory([]);setHistoryTotal(0);
    if(target==='reset'){setSelected([]);setAccountTags([]);setPendingGuest([]);setPersonalEnabled(true);}
    setReload(n=>n+1);
   }
   setConfirmMode(null);
  }catch{setPrivacyError(true);}finally{setPrivacyBusy(false);}
 };

 const answer=async(story:Story,vote:Vote)=>{
  if(votePending===story.id||accountStatus==='loading'||(accountStatus==='member'&&!personalEnabled))return;
  const before=votes[story.id];
  const next=before===vote?undefined:vote;
  setVoteError(null);setVotePending(story.id);
  setVotes(old=>{const changed={...old};if(next)changed[story.id]=next;else delete changed[story.id];return changed;});
  if(accountStatus==='member'){
   try{
    const response=await fetch('/api/v1/news/reactions/'+encodeURIComponent(story.id),{
     method:next?'PUT':'DELETE',credentials:'same-origin',
     ...(next?{headers:{'Content-Type':'application/json'},
      body:JSON.stringify({vote:next==='yes'?'YES':'NO'})}:{})
    });
    if(!response.ok)throw Error('Vote HTTP '+response.status);
    try{await refreshHistory();}catch{
     // The vote was committed; a failed history refresh must not undo it locally.
     setHistory(previous=>previous.filter(x=>x.articleId!==story.id));
    }
    if(view==='mine'){setPage(1);setReload(x=>x+1);}
   }catch{
    setVotes(old=>{const recovered={...old};if(before)recovered[story.id]=before;else delete recovered[story.id];return recovered;});
    setVoteError(story.id);
   }
  }
  if(accountStatus==='guest'){
   setGuestDismissed(old=>{const nextHints={...old};
    if(next==='no')nextHints[story.id]={topic:story.topic,tags:story.tags,title:story.titleUk||story.title};
    else delete nextHints[story.id];
    return nextHints;
   });
   guestVotes.current={...votes};
   if(next)guestVotes.current[story.id]=next;else delete guestVotes.current[story.id];}
  setVotePending(null);
 };
 const visible=useMemo(()=>{
  let list=items.filter(story=>!(view==='mine'&&
   (accountStatus!=='member'||personalEnabled)&&votes[story.id]==='no'));
  if(view==='mine'&&accountStatus!=='member')
   list=selected.length?list.filter(story=>
    story.tags.some(tag=>selected.includes(tag))&&
    !Object.values(guestDismissed).some(hint=>guestSimilar(story,hint))):[];
  // The authenticated personal feed already applies ranked interests + discoveries server-side.
  if(view==='latest')list=[...list].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
  return list;
 },[items,view,selected,votes,guestDismissed,accountStatus,personalEnabled]);
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
  const candidate=locale==='uk'?(story.summaryUk||((story.language==='uk'||story.language==='uk-UA')?story.summary:null)):(story.summaryEn||story.summary);
  if(!candidate||/Це орієнтир за назвою|Публікація джерела|Матеріал джерела|Орієнтир за заголовком|Read the original article|This publication by|This article from/i.test(candidate))return null;
  return candidate;
 };
 const art=(topic:Topic)=>topic==='tarot'?'✦':topic==='yoga'?'ॐ':topic==='jyotish'?'☾':topic==='meditation'?'◉':topic==='vedic'?'❂':topic==='astronomy'?'✧':'✺';
 return <PortalShell locale={locale} active="news">
  <div className={styles.world} data-testid="galaxinews-world" data-release="world-v1.8">
   <header className={styles.hero}>
    <div className={styles.heroCopy}>
     <span className={styles.eyebrow}><Sparkles size={13}/>{t.kicker}</span>
     <h1>{t.title}</h1><h2>{t.subtitle}</h2><p>{t.intro}</p>
    </div>
    <div className={styles.cosmos} aria-hidden="true"><div className={styles.orbit1}/><div className={styles.orbit2}/><MoonStar size={84} strokeWidth={0.75}/><i className={styles.star1}/><i className={styles.star2}/></div>
   </header>
   <nav className={styles.views} aria-label={locale==='uk'?'Тип стрічки':'Feed type'}>
    {(['all','latest','mine'] as const).map(v=><button key={v} type="button" className={view===v?styles.active:''}
     aria-pressed={view===v} onClick={()=>{setView(v);setPage(1);setItems([]);}}>{v==='mine'?<Heart size={15}/>:v==='latest'?<Compass size={15}/>:<Orbit size={15}/>} {t[v]}</button>)}
    <div className={styles.tabSearch} data-testid="news-tabs-search" role="search" aria-label={t.search}>
     <Search size={18} aria-hidden="true"/>
     <label className={styles.searchLabel} htmlFor="galaxinews-search">{t.search}</label>
     <input id="galaxinews-search" type="search" value={search} maxLength={80}
      onChange={e=>setSearch(e.target.value)} placeholder={t.search} autoComplete="off"/>
     {search&&<button type="button" className={styles.clearSearch} onClick={()=>setSearch('')}
       title={t.clearSearch} aria-label={t.clearSearch}><X size={16}/></button>}
    </div>
    <span className={styles.articleCount} data-testid="news-article-count" role="status" aria-live="polite">
     <BookOpen size={16} aria-hidden="true"/>
     {articleCount===null?'—':new Intl.NumberFormat(locale==='uk'?'uk-UA':'en-GB').format(articleCount)} {t.articles}
    </span>
   </nav>
   <section className={styles.tagSection} aria-label={t.topics}>
    <div className={styles.sectionTitle}><span><Tags size={18}/>{t.topics}</span></div>
    <div className={styles.tags} data-testid="news-all-interest-tags">
     {INTEREST_TAGS.map(tag=><button type="button" key={tag} onClick={()=>toggleTag(tag)}
      className={selected.includes(tag)?styles.tagActive:styles.tag} aria-pressed={selected.includes(tag)}>
       {selected.includes(tag)&&<Check size={13}/>} {LABELS[tag][locale]}</button>)}
    </div>
    {selected.length>0&&<div className={styles.selected}><span>{t.chosen}: {selected.length}</span>
      <button onClick={()=>setSelected([])} type="button">{t.reset}</button></div>}
    {accountStatus==='member'&&pendingGuest.length>0&&
     <div className={styles.accountSync} data-testid="news-import-guest">
      <button type="button" onClick={()=>{
       setSelected(old=>[...new Set([...old,...pendingGuest])]);
       setPendingGuest([]);
      }}>{t.importGuest} ({pendingGuest.length})</button>
     </div>}
    {accountStatus==='member'&&(accountTagsDiffer||selected.length>0)&&
     <div className={styles.accountSync} data-testid="news-account-sync">
      {accountTagsDiffer?
       <button type="button" onClick={()=>void saveAccountInterests()} disabled={syncing}>
        {syncing?'…':t.saveAccount}</button>:
       <span><Check size={15}/>{t.savedAccount}</span>}
      {syncError&&<small role="alert">{t.saveFailed}</small>}
     </div>}
    {accountStatus==='guest'&&selected.length>0&&
     <small className={styles.localHint}>{t.guestLocal}</small>}
    <div className={styles.privacyControls} data-testid="news-privacy-controls">
     <button type="button" className={styles.manageToggle}
      aria-expanded={manageOpen} onClick={()=>setManageOpen(v=>!v)}>
      <Settings2 size={16}/>{t.manage}<ChevronDown size={15}/>
     </button>
     {manageOpen&&<div className={styles.managePanel}>
      <p className={styles.manageNote}>{t.manageNote}</p>
      {accountStatus==='member'?<>
       <button type="button" role="switch" aria-checked={personalEnabled}
        disabled={privacyBusy} onClick={()=>void savePrivacySwitch()}>
        <ShieldCheck size={16}/>{personalEnabled?t.personalizedOn:t.personalizedOff}
       </button>
       {!personalEnabled&&<p className={styles.manageNote}>{t.offNote}</p>}
       <div className={styles.manageActions}>
        <button type="button" onClick={()=>void exportNewsData()} disabled={privacyBusy}>
         <Download size={15}/>{t.exportData}</button>
        <button type="button" onClick={()=>setConfirmMode('clear')} disabled={privacyBusy}>
         <Trash2 size={15}/>{t.clearHistory}</button>
        <button type="button" onClick={()=>setConfirmMode('reset')} disabled={privacyBusy}>{t.resetAll}</button>
       </div>
       <h3>{t.history} ({historyTotal})</h3>
       {history.length===0?<p className={styles.manageNote}>{t.noHistory}</p>:
        <ul className={styles.historyList}>
         {history.slice(0,historyShown).map(row=><li key={row.articleId}>
          <span>{row.vote==='YES'?<Heart size={14}/>:<HeartOff size={14}/>}
           {safeLink(row.article.url)?<a href={row.article.url} target="_blank" rel="noopener noreferrer">
            {locale==='uk'&&row.article.titleUk||row.article.title}</a>:
            (locale==='uk'&&row.article.titleUk||row.article.title)}
           <small>{row.article.source}</small></span>
          <button type="button" disabled={privacyBusy} onClick={()=>void undoHistory(row.articleId)}>
           <Undo2 size={14}/>{t.undo}</button>
         </li>)}
        </ul>}
       {historyShown<history.length&&<button type="button"
        onClick={()=>setHistoryShown(history.length)}>{t.moreHistory} ({history.length-historyShown})</button>}
       {historyTotal>history.length&&<p className={styles.manageNote}>{t.historyLimit}</p>}
      </>:<button type="button" disabled={!Object.keys(votes).length}
       onClick={()=>setConfirmMode('guest')}><Trash2 size={15}/>{t.guestClear}</button>}
      {confirmMode&&<div className={styles.confirmStrip} role="group" aria-label={t.confirmYes}>
       <p>{confirmMode==='reset'?t.confirmReset:
        confirmMode==='guest'?t.guestClear+'?':t.confirmClear}</p>
       <button type="button" disabled={privacyBusy} onClick={()=>void confirmedDelete()}>{t.confirmYes}</button>
       <button type="button" disabled={privacyBusy} onClick={()=>setConfirmMode(null)}>{t.cancel}</button>
      </div>}
      {privacyError&&<small role="alert" className={styles.manageError}>{t.settingsError}</small>}
     </div>}
    </div>
   </section>

   <div className={styles.feedLayout}>
    <section className={styles.feed} aria-label={view==='mine'?t.yourFeed:t.world}>
     <div className={styles.feedHeader}>
      <div><small>{view==='mine'?t.yourFeed:t.world}</small><h2>{query.length>=2?t.searchResults:view==='latest'?t.newest:t[view]}</h2></div>
      <button className={styles.refreshButton} type="button" onClick={()=>{setPage(1);setReload(x=>x+1);}} aria-label={t.refresh} title={t.refresh}><RefreshCw size={17}/></button>
      <div className={styles.filters}><label htmlFor="news-topic-filter">{t.allTopics}</label>
       <select id="news-topic-filter" value={category} onChange={e=>resetCategory(e.target.value)}>
        <option value="all">{t.allTopics}</option>{TOPICS.map(x=><option key={x} value={x}>{LABELS[x][locale]}</option>)}
       </select><ChevronDown size={14} aria-hidden="true"/></div>
     </div>
     {error?<div className={styles.empty} role="alert"><p>{t.offline}</p><button type="button" onClick={()=>setReload(x=>x+1)}>{t.retry}</button></div>:
      busy&&page===1?<div className={styles.empty} role="status"><RefreshCw size={24}/><p>{t.loading}</p></div>:
      view==='mine'&&!selected.length&&accountStatus!=='member'?<div className={styles.empty}><Tags size={28}/><p>{t.noPersonal}</p></div>:
      visible.length===0?<div className={styles.empty}><BookOpen size={28}/><p>{view==='mine'?t.nothingPersonal:lastScan?t.zero:t.bootstrap}</p></div>:
      <div className={styles.cards}>
       {visible.map((story,i)=>{const url=safeLink(story.url),v=votes[story.id];
        return <article className={i===0&&view!=='mine'?styles.lead:styles.card} key={story.id}>
         <StoryArtwork imageUrl={story.imageUrl} credit={story.imageCredit} sourceUrl={story.imagePageUrl} licenseUrl={story.imageLicenseUrl} license={story.imageLicense} title={locale==='uk'&&story.titleUk||story.title} topic={story.topic} art={art(story.topic)}/>
         <div className={styles.story}>
          <div className={styles.meta}><span>{LABELS[story.topic]?.[locale]||story.topic}</span><span>·</span>
           <time dateTime={story.publishedAt}>{story.publishedAccuracy==='observed'?t.observed+' · ':''}{date(story.publishedAt)}</time></div>
          <h3>{locale==='uk'&&story.titleUk?story.titleUk:story.title}</h3>
          {preview(story)&&<p className={styles.summary} data-testid="news-summary">{preview(story)}</p>}
          <p className={styles.source}>{story.source}</p>
          {view==='mine'&&accountStatus==='member'&&story.personalReason&&
           <small className={styles.personalReason} data-testid="news-why">
            {story.personalReason==='selected_topic'?t.reasonChosen+
             (story.matchingTag?': '+LABELS[story.matchingTag]?.[locale]:''):
             story.personalReason==='similar_to_liked'?t.reasonLiked:
             story.personalReason==='fresh_discovery'?t.reasonFresh:t.reasonWorld}
           </small>}
          <div className={styles.storyEnd}>
           {url&&<a href={url} target="_blank" rel="noopener noreferrer" aria-label={t.original+': '+story.title}>
            {t.original}<ArrowUpRight size={16}/></a>}
           {v&&<span className={styles.voteMarked}>{v==='yes'?<Heart size={13}/>:<HeartOff size={13}/>} {accountStatus==='member'?t.feedbackSaved:t.feedbackLocal}</span>}
          </div>
         </div>
         {(i===0||(i+1)%5===0)&&<div className={styles.feedback} data-testid="news-feedback">
          <p>{t.interesting}</p><div><button type="button" data-testid="news-vote-yes"
            aria-pressed={v==='yes'} disabled={votePending===story.id||accountStatus==='loading'||(accountStatus==='member'&&!personalEnabled)}
            onClick={()=>void answer(story,'yes')}><Heart size={14}/>{t.yes}</button>
           <button type="button" data-testid="news-vote-no"
            aria-pressed={v==='no'} disabled={votePending===story.id||accountStatus==='loading'||(accountStatus==='member'&&!personalEnabled)}
            onClick={()=>void answer(story,'no')}><HeartOff size={14}/>{t.no}</button></div>
          {voteError===story.id&&<small role="alert">{t.feedbackError}</small>}
         </div>}
        </article>;
       })}
      </div>}
     {canMore&&!error&&<button className={styles.more} type="button" disabled={busy} onClick={()=>setPage(x=>x+1)}>
       {busy?t.loading:t.more}<ChevronDown size={16}/></button>}
    </section>
   </div>
   <footer className={styles.footnote}>{t.attribution}</footer>
  </div>
 </PortalShell>;
}
