'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,Bell,Flag,History,Lock,MessageCircle,Plus,Search,ShieldCheck,Star,ThumbsUp,Trash2,Users} from 'lucide-react';
import PortalShell from './PortalShell';
import GalaxiComSafety from './GalaxiComSafety';
import GalaxiComGrowth from './GalaxiComGrowth';
import type {PortalLocale} from '../../lib/brand';
import styles from './GalaxiCom.module.css';
type Category={slug:string;titleUk:string;titleEn:string;descriptionUk:string;descriptionEn:string};
type Author={id:string;name:string;expert:boolean;premium:boolean};
type Thread={id:string;title:string;body:string;categorySlug:string;category:{slug:string;titleUk:string;titleEn:string};
 author:Author;createdAt:string;updatedAt:string;lastActivityAt:string;replyCount:number;pinned:boolean;locked:boolean};
type Post={id:string;body:string;author:Author;createdAt:string;updatedAt:string};
type Listing<T>={items:T[];page:number;pageSize:number;total:number};
type Me={signedIn:boolean;permissions:{canCreate:boolean;canReply:boolean;canModerate:boolean;canManageContext:boolean;premiumBadge:boolean};
 profile:{id:string;name:string;showPremiumBadge:boolean}|null};
type Report={id:string;reason:string;targetType:'thread'|'post';targetId:string;threadId:string;excerpt:string;createdAt:string};
type Activity={following:boolean;followers:number;likes:Record<string,{count:number;liked:boolean}>;myLikes:string[]};
type CuratedSource={kind:'ACADEMY'|'YOGA';slug:string;titleUk:string;titleEn:string};
type Inbox={items:{id:string;threadId:string;title:string;createdAt:string;read:boolean}[];unread:number;total:number};
type Revision={id:string;title?:string;body:string;editedAt:string};
const uk={
 heading:'GalaxiCom',eyebrow:'СПІЛЬНОТА GALAXIORA',intro:'Простір живого спілкування про Джйотіш, Таро, духовні практики та ведичну традицію.',
 browse:'Обговорення',newTopic:'Створити тему',newTitle:'Назва теми',newBody:'Що хочеш обговорити?',pickCategory:'Вибери розділ',
 publish:'Опублікувати',reply:'Відповісти',send:'Надіслати',latest:'Нові',active:'Активні',unanswered:'Без відповідей',
 search:'Пошук у форумі',find:'Знайти',all:'Усі розділи',empty:'Поки немає обговорень. Стань автором першої теми!',
 login:'Увійди у свій акаунт Galaxiora, щоб створювати теми й відповідати.',account:'Акаунт',replyCount:'відповідей',
 pinned:'Закріплено',locked:'Тему закрито для відповідей',expert:'Перевірений експерт',premium:'PREMIUM',badgeShow:'Показувати PREMIUM-плашку',badgeHide:'Приховати PREMIUM-плашку',
 back:'До обговорень',more:'Наступна сторінка',previous:'Попередня',report:'Поскаржитися',reportReason:'Причина скарги',
 reportSend:'Надіслати скаргу',cancel:'Скасувати',edit:'Редагувати',save:'Зберегти',myName:'Моє ім’я на форумі',
 name:'Публічний псевдонім',update:'Оновити',queue:'Черга модерації',hide:'Приховати',restore:'Відновити',
 lock:'Закрити тему',unlock:'Відкрити тему',pin:'Закріпити',unpin:'Відкріпити',resolve:'Вирішено',dismiss:'Відхилити',
 moderationReason:'Причина рішення',rule:'Тут публікуються відкриті дописи. Не розміщуй приватні дані народження, чужі історії, адресу чи контакти без згоди.',
 loading:'Завантаження…',error:'Не вдалося виконати дію. Перевір дані й повтори.',done:'Зміни збережено.',
 noReplies:'Поки немає відповідей.',signIn:'Увійти для участі',time:'uk-UA',
 follow:'Стежити за темою',unfollow:'Не стежити',followers:'підписників',
 helpful:'Корисно',history:'Історія змін',notifications:'Сповіщення',markRead:'Позначити прочитаним',
 allRead:'Прочитати всі',delete:'Видалити тему',deleteConfirm:'Прибрати тему з форуму? Її можна відновити через модерацію, дані не будуть знищені.',
 similar:'Можливо, таку тему вже обговорювали',editedLabel:'Попередня версія',noNotices:'Нових сповіщень немає.'
} as const;
const en={
 heading:'GalaxiCom',eyebrow:'GALAXIORA COMMUNITY',intro:'A welcoming space to discuss Jyotish, Tarot, spiritual practices and Vedic traditions.',
 browse:'Discussions',newTopic:'Start a topic',newTitle:'Topic title',newBody:'What would you like to discuss?',pickCategory:'Choose a category',
 publish:'Publish',reply:'Reply',send:'Send',latest:'Newest',active:'Active',unanswered:'Unanswered',
 search:'Search discussions',find:'Search',all:'All categories',empty:'No discussions yet. Start the first one!',
 login:'Sign in to your Galaxiora account to create and reply to topics.',account:'Account',replyCount:'replies',
 pinned:'Pinned',locked:'Replies are closed',expert:'Verified expert',premium:'PREMIUM',badgeShow:'Show PREMIUM badge',badgeHide:'Hide PREMIUM badge',
 back:'All discussions',more:'Next page',previous:'Previous',report:'Report',reportReason:'Reason for report',
 reportSend:'Send report',cancel:'Cancel',edit:'Edit',save:'Save',myName:'My forum identity',
 name:'Public display name',update:'Update',queue:'Moderation queue',hide:'Hide',restore:'Restore',
 lock:'Lock thread',unlock:'Unlock thread',pin:'Pin',unpin:'Unpin',resolve:'Resolve',dismiss:'Dismiss',
 moderationReason:'Decision reason',rule:'Posts are public. Avoid posting sensitive birth details, other people’s information, addresses or contact data without permission.',
 loading:'Loading…',error:'This action failed. Check the input and try again.',done:'Your changes were saved.',
 noReplies:'No replies yet.',signIn:'Sign in to participate',time:'en-GB',
 follow:'Follow topic',unfollow:'Unfollow',followers:'followers',
 helpful:'Helpful',history:'Edit history',notifications:'Notifications',markRead:'Mark as read',
 allRead:'Mark all read',delete:'Delete topic',deleteConfirm:'Remove this discussion? It will be hidden and auditable rather than physically erased.',
 similar:'Similar discussions already exist',editedLabel:'Previous version',noNotices:'No notifications.'
} as const;
async function api<T>(path:string,options?:RequestInit):Promise<T>{
 const response=await fetch('/api/v1/com/'+path,{credentials:'same-origin',cache:'no-store',...options});
 const data=await response.json().catch(()=>({})) as T & {message?:string};
 if(!response.ok)throw new Error(data.message||('HTTP '+response.status));
 return data;
}
const json=(method:string,data:unknown):RequestInit=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
export default function GalaxiCom({locale,threadId}:{locale:PortalLocale;threadId?:string}){
 const t=locale==='uk'?uk:en;
 const [categories,setCategories]=useState<Category[]>([]);
 const [me,setMe]=useState<Me|null>(null);
 const [listing,setListing]=useState<Listing<Thread>|null>(null);
 const [detail,setDetail]=useState<Thread|null>(null);
 const [replies,setReplies]=useState<Listing<Post>|null>(null);
 const [category,setCategory]=useState(''),[sort,setSort]=useState('active');
 const [search,setSearch]=useState(''),[query,setQuery]=useState(''),[page,setPage]=useState(1);
 const [replyPage,setReplyPage]=useState(1),[reload,setReload]=useState(0);
 const [composer,setComposer]=useState(false),[title,setTitle]=useState(''),[body,setBody]=useState('');
 const composerRef=useRef<HTMLElement|null>(null),composerTitleRef=useRef<HTMLHeadingElement|null>(null);
 const [topicCategory,setTopicCategory]=useState(''),[replyBody,setReplyBody]=useState('');
 const [displayName,setDisplayName]=useState(''),[editing,setEditing]=useState<string|null>(null),[edited,setEdited]=useState('');
 const [editedTitle,setEditedTitle]=useState('');
 const [activity,setActivity]=useState<Activity|null>(null),[inboxOpen,setInboxOpen]=useState(false);
 const [sources,setSources]=useState<CuratedSource[]>([]);
 const [inbox,setInbox]=useState<Inbox|null>(null),[duplicates,setDuplicates]=useState<{id:string;title:string}[]>([]);
 const [history,setHistory]=useState<{id:string;items:Revision[]}|null>(null);
 const [reporting,setReporting]=useState<{target:'thread'|'post';id:string}|null>(null);
 const [reportReason,setReportReason]=useState(''),[modReason,setModReason]=useState('');
 const [queue,setQueue]=useState<Report[]|null>(null),[queueOpen,setQueueOpen]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const root='/'+locale+'/community';
 useEffect(()=>{const requested=new URLSearchParams(window.location.search).get('category');
  if(requested&&['jyotish','tarot','practices','vedic','experiences','experts','help'].includes(requested))setCategory(requested);
 },[]);
 useEffect(()=>{if(composer&&!threadId){
  const heading=composerTitleRef.current;
  heading?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  heading?.focus({preventScroll:true});
 }},[composer,threadId]);
 const name=(c:Category)=>locale==='uk'?c.titleUk:c.titleEn;
 const date=(s:string)=>new Intl.DateTimeFormat(t.time,{day:'numeric',month:'short',year:'numeric'}).format(new Date(s));
 const refresh=()=>setReload(n=>n+1);
 const act=async(action:()=>Promise<unknown>,done=t.done)=>{
  setBusy(true);setError('');setNotice('');
  try{await action();setNotice(done);refresh();return true;}
  catch(e){setError(e instanceof Error?e.message:t.error);return false;}
  finally{setBusy(false);}
 };
 useEffect(()=>{
  const ctl=new AbortController();
  Promise.all([api<{items:Category[]}>('categories'),api<Me>('me')]).then(([c,u])=>{
   if(ctl.signal.aborted)return;
   setCategories(c.items);setMe(u);setTopicCategory(old=>old||c.items[0]?.slug||'');
   setDisplayName(u.profile?.name||'');
  }).catch(()=>{if(!ctl.signal.aborted)setError(t.error)});
  return()=>ctl.abort();
 },[reload,locale]);
 useEffect(()=>{
  if(threadId)return;
  let active=true;
  const params=new URLSearchParams({sort,page:String(page)});
  if(category)params.set('category',category);
  if(query.length>=2)params.set('q',query);
  api<Listing<Thread>>('threads?'+params).then(data=>{if(active)setListing(data)})
   .catch(()=>{if(active)setError(t.error)});
  return()=>{active=false};
 },[category,sort,query,page,reload,threadId]);
 useEffect(()=>{
  if(!threadId)return;
  let active=true;
  Promise.all([api<{thread:Thread}>('threads/'+threadId),api<Listing<Post>>('threads/'+threadId+'/posts?page='+replyPage),
   api<Activity>('threads/'+threadId+'/activity'),api<{items:CuratedSource[]}>('context/threads/'+threadId)])
   .then(([thread,posts,social,linked])=>{if(active){setDetail(thread.thread);setReplies(posts);setActivity(social);setSources(linked.items)}})
   .catch(()=>{if(active)setError(t.error)});
  return()=>{active=false};
 },[threadId,replyPage,reload]);
 useEffect(()=>{
  if(!queueOpen||!me?.permissions.canModerate)return;
  let active=true;
  api<{items:Report[]}>('mod/reports').then(d=>{if(active)setQueue(d.items)})
   .catch(()=>{if(active)setError(t.error)});
  return()=>{active=false};
 },[queueOpen,me?.permissions.canModerate,reload]);
 useEffect(()=>{
  if(!inboxOpen||!me?.signedIn)return;
  let active=true;
  api<Inbox>('notifications').then(x=>{if(active)setInbox(x)}).catch(()=>{if(active)setError(t.error)});
  return()=>{active=false};
 },[inboxOpen,me?.signedIn,reload]);
 const showHistory=async(path:string,id:string)=>{
  if(history?.id===id){setHistory(null);return;}
  try{const response=await api<{items:Revision[]}>(path+'/revisions');setHistory({id,items:response.items});}
  catch(e){setError(e instanceof Error?e.message:t.error);}
 };
 const historyPanel=(id:string)=>history?.id===id?<section className={styles.historyPanel}>
  <h3>{t.history}</h3>
  {history.items.map(rev=><div key={rev.id} className={styles.historyItem}>
   <span>{t.editedLabel} · {date(rev.editedAt)}</span>
   {rev.title&&<strong>{rev.title}</strong>}
   <p className={styles.body}>{rev.body}</p>
  </div>)}
 </section>:null;
 const reportBox=(target:'thread'|'post',id:string)=>
  reporting?.target===target&&reporting.id===id?
   <form className={styles.inlineForm} onSubmit={async e=>{
    e.preventDefault();const ok=await act(()=>api('reports',json('POST',{target,targetId:id,reason:reportReason})));
    if(ok){setReporting(null);setReportReason('')}
   }}>
    <label>{t.reportReason}<textarea value={reportReason} minLength={8} maxLength={300}
     onChange={e=>setReportReason(e.target.value)} required/></label>
    <div className={styles.actions}><button disabled={busy} type="submit">{t.reportSend}</button>
     <button type="button" onClick={()=>setReporting(null)}>{t.cancel}</button></div>
   </form>:null;
 const actor=(u:Author)=> <span className={styles.author}>
  <Link href={root+'/member/'+u.id} className={styles.memberLink}><strong>{u.name}</strong></Link>
  {u.expert&&<span className={styles.expert}><ShieldCheck size={13}/>{t.expert}</span>}
  {u.premium&&<span className={styles.premium}><Star size={12}/>{t.premium}</span>}
 </span>;
 const editButton=(id:string,current:string,titleText='')=><button type="button" onClick={()=>{
  setEditing(id);setEdited(current);setEditedTitle(titleText);
 }}>{t.edit}</button>;
 const editingForm=(id:string,path:string)=>editing===id?<form className={`${styles.inlineForm} ${styles.largeEditor}`}
  data-testid="com-fullwidth-editor" onSubmit={async e=>{
   e.preventDefault();const data=path.startsWith('posts/')?{body:edited}:{title:editedTitle,body:edited};
   const ok=await act(()=>api(path,json('PATCH',data)));
   if(ok)setEditing(null);
  }}>
   {!path.startsWith('posts/')&&<label>{t.newTitle}<input type="text" value={editedTitle} minLength={1}
    maxLength={160} onChange={e=>setEditedTitle(e.target.value)} required/></label>}
   <label>{t.newBody}<textarea rows={14} value={edited} minLength={1} maxLength={path.startsWith('posts/')?5000:8000}
    onChange={e=>setEdited(e.target.value)} required/></label>
   <div className={styles.actions}><button type="submit" disabled={busy}>{t.save}</button>
    <button type="button" onClick={()=>setEditing(null)}>{t.cancel}</button></div>
  </form>:null;
 return <PortalShell locale={locale} active="community" languagePath={threadId?'community/topic/'+threadId:'community'}>
  <div className={styles.wrap} data-testid="galaxicom">
   <header className={styles.hero}>
    <div className={styles.stars} aria-hidden="true">✧　✦　☾</div>
    <span className={styles.eyebrow}>{t.eyebrow}</span>
    <h1>{t.heading}</h1><p>{t.intro}</p>
    <div className={styles.heroBottom}><span><Users size={16}/>{t.browse}</span>
     {me?.permissions.canCreate&&<button type="button" aria-expanded={composer} aria-controls="com-topic-composer" onClick={()=>{setComposer(true);if(composer)composerTitleRef.current?.scrollIntoView({behavior:'smooth',block:'start'});}}>
      <Plus size={17}/>{t.newTopic}</button>}</div>
   </header>
   <p className={styles.rules}>{t.rule}</p>
   <div className={styles.communityToolbar} data-testid="com-compact-toolbar">
   {me?.signedIn&&<details className={styles.inbox} open={inboxOpen}
    onToggle={e=>setInboxOpen(e.currentTarget.open)}>
    <summary><Bell size={17}/>{t.notifications}{inbox&&inbox.unread>0&&<strong>({inbox.unread})</strong>}</summary>
    {inboxOpen&&<div className={styles.inboxItems}>
     {inbox?.unread? <button type="button" disabled={busy} onClick={()=>void act(()=>api('notifications/read-all',{method:'PATCH'}))}>{t.allRead}</button>:null}
     {inbox?.items.length?inbox.items.map(note=><div key={note.id} className={styles.inboxItem}>
      <Link href={root+'/topic/'+note.threadId}>{note.title}</Link>
      <span>{date(note.createdAt)}</span>
      {!note.read&&<button type="button" onClick={()=>void act(()=>api('notifications/'+note.id+'/read',{method:'PATCH'}))}>{t.markRead}</button>}
     </div>):<p>{t.noNotices}</p>}
    </div>}
   </details>}
   {error&&<p className={styles.error} role="alert">{error}</p>}
   {notice&&<p className={styles.notice} role="status">{notice}</p>}
   {!me?.signedIn&&<p className={styles.signIn}>{t.login} <Link href={'/'+locale+'/account'}>{t.signIn}<ArrowRight size={15}/></Link></p>}
   {me?.signedIn&&<form className={styles.compactName} onSubmit={async e=>{
     e.preventDefault();await act(()=>api('me',json('PATCH',{displayName})));
   }}>
    <label htmlFor="com-display-name">{t.myName}</label>
    <input id="com-display-name" aria-label={t.name} value={displayName} minLength={3} maxLength={40}
      onChange={e=>setDisplayName(e.target.value)}/>
    <button type="submit" disabled={busy||displayName===me.profile?.name}>{t.update}</button>
   </form>}
   {me?.permissions.premiumBadge&&<button className={styles.badgeToggle} type="button" disabled={busy}
     onClick={()=>void act(()=>api('me',json('PATCH',{showPremiumBadge:!me.profile?.showPremiumBadge})))}>
     <Star size={14}/>{me.profile?.showPremiumBadge?t.badgeHide:t.badgeShow}
   </button>}

   <GalaxiComSafety locale={locale} me={me}/>
   <GalaxiComGrowth locale={locale} me={me} threadId={threadId}/>
   </div>
   {composer&&me?.permissions.canCreate&&<section id="com-topic-composer" ref={composerRef} className={styles.panel} aria-label={t.newTopic} data-testid="com-composer">
    <h2 ref={composerTitleRef} tabIndex={-1}>{t.newTopic}</h2>
    <form className={styles.composer} onSubmit={async e=>{
     e.preventDefault();setBusy(true);setError('');
     try{const r=await api<{id:string}>('threads',json('POST',{categorySlug:topicCategory,title,body}));
      window.location.assign(root+'/topic/'+r.id);
     }catch(e){setBusy(false);setError(e instanceof Error?e.message:t.error)}
    }}>
     <label>{t.pickCategory}<select value={topicCategory} onChange={e=>setTopicCategory(e.target.value)}>
      {categories.map(c=><option key={c.slug} value={c.slug}>{name(c)}</option>)}
     </select></label>
     <label>{t.newTitle}<input value={title} minLength={1} maxLength={160} required
      onBlur={()=>{if(title.trim().length>=8)api<{items:{id:string;title:string}[]}>('duplicates?title='+encodeURIComponent(title.trim()))
       .then(x=>setDuplicates(x.items)).catch(()=>setDuplicates([]));}}
      onChange={e=>{setTitle(e.target.value);setDuplicates([])}}/></label>
     {duplicates.length>0&&<aside className={styles.similar} aria-label={t.similar}>
      <strong>{t.similar}</strong>
      {duplicates.map(item=><Link key={item.id} href={root+'/topic/'+item.id}>{item.title}</Link>)}
     </aside>}
     <label>{t.newBody}<textarea rows={12} value={body} minLength={1} maxLength={8000} required onChange={e=>setBody(e.target.value)}/></label>
     <div className={styles.actions}><button type="submit" disabled={busy||!topicCategory}>{t.publish}</button>
      <button type="button" onClick={()=>setComposer(false)}>{t.cancel}</button></div>
    </form>
   </section>}
   {me?.permissions.canModerate&&<section className={styles.modQueueWrap} data-testid="com-mod-queue">
    <button type="button" aria-expanded={queueOpen} onClick={()=>setQueueOpen(n=>!n)}>
      <ShieldCheck size={16}/>{t.queue}{queueOpen?' −':' +'}{queue?.length?' ('+queue.length+')':''}
    </button>
    {queueOpen&&<div className={styles.queue}>
     <h3>{locale==='uk'?'Скарги від учасників':'Member reports'}</h3>
     <p>{locale==='uk'?'Перевір скаргу та відкрий пов’язану публікацію. «Вирішено» закриває звернення, «Відхилити» залишає його без дії, «Приховати» прибирає публікацію. Для кожної дії вкажи причину (від 6 символів).':
        'Review the reported topic or reply. Resolve closes a report, Dismiss rejects it, and Hide removes the content. Each action requires a reason (6+ characters).'}</p>
     {queue?.length? <label>{t.moderationReason}<input value={modReason} minLength={6} maxLength={300}
      placeholder={locale==='uk'?'Наприклад: порушення правил спільноти':'Example: community rule violation'}
      onChange={e=>setModReason(e.target.value)}/></label>:null}
     {queue===null?<p>{t.loading}</p>:queue.length===0?<p role="status">{locale==='uk'?'Нових скарг немає. Черга порожня.':'No new reports. Your queue is empty.'}</p>:queue.map(item=><div className={styles.report} key={item.id}>
      <p><strong>{item.excerpt}</strong></p>
      <p>{locale==='uk'?'Причина скарги':'Reported reason'}: {item.reason}</p>
      <Link href={root+'/topic/'+item.threadId}>
       {locale==='uk'?'Відкрити обговорення':'Open discussion'}
      </Link>
      <div className={styles.actions}>
       {(['RESOLVED','DISMISSED'] as const).map(decision=><button type="button" key={decision}
        disabled={busy||modReason.trim().length<6}
        onClick={()=>void act(()=>api('mod/reports/'+item.id,json('PATCH',{decision,reason:modReason})))}>
        {decision==='RESOLVED'?t.resolve:t.dismiss}</button>)}
       <button type="button" disabled={busy||modReason.trim().length<6} onClick={()=>void act(()=>api(
        'mod/'+(item.targetType==='thread'?'threads/':'posts/')+item.targetId,
        json('PATCH',item.targetType==='thread'?{status:'HIDDEN',reason:modReason}:{status:'HIDDEN',reason:modReason})
       ))}>{t.hide}</button>
      </div>
     </div>)}
    </div>}
   </section>}
   {threadId?
    <section className={styles.content}>
     <Link href={root} className={styles.back}><ArrowLeft size={16}/>{t.back}</Link>
     {sources.length>0&&<nav className={styles.curatedSources} aria-label={locale==='uk'?'Пов’язані матеріали':'Related learning materials'}>
      <strong>{locale==='uk'?'Матеріали Galaxiora за темою':'Related Galaxiora materials'}</strong>
      {sources.map(item=><Link key={item.kind+item.slug}
       href={'/'+locale+'/'+(item.kind==='ACADEMY'?'learn':'yoga')+'/'+item.slug}>
       {locale==='uk'?item.titleUk:item.titleEn} <ArrowRight size={14}/>
      </Link>)}
      <small>{locale==='uk'?'Редакція підтвердила зв’язок тем. Відповіді форуму — думки учасників, не офіційні висновки.':
      'Editorially linked subject matter. Community replies are member views, not official findings.'}</small>
     </nav>}
     {detail&&<article className={styles.panel} data-testid="com-thread">
      <div className={styles.meta}>{locale==='uk'?detail.category.titleUk:detail.category.titleEn} · {date(detail.createdAt)}
       {detail.pinned&&<span> · {t.pinned}</span>}</div>
      <h2>{detail.title}</h2><p className={styles.authorRow}>{actor(detail.author)}</p>
      <p className={styles.body}>{detail.body}</p>
      {detail.locked&&<p className={styles.locked}><Lock size={15}/>{t.locked}</p>}
      {activity&&<div className={styles.followBar}>
       <span>{activity.followers} {t.followers}</span>
       {me?.signedIn&&<button type="button" disabled={busy} onClick={()=>void act(()=>api('threads/'+detail.id+'/follow',{
        method:activity.following?'DELETE':'PUT'}))}>{activity.following?t.unfollow:t.follow}</button>}
      </div>}
      <div className={styles.actions}>
       {me?.profile?.id===detail.author.id&&editButton(detail.id,detail.body,detail.title)}
       {(me?.profile?.id===detail.author.id||me?.permissions.canModerate)&&
        <button type="button" onClick={()=>void showHistory('threads/'+detail.id,detail.id)}>
         <History size={14}/>{t.history}</button>}
       {me?.signedIn&&<button type="button" onClick={()=>setReporting({target:'thread',id:detail.id})}>
        <Flag size={15}/>{t.report}</button>}
      </div>
      {editingForm(detail.id,'threads/'+detail.id)}
      {historyPanel(detail.id)}
      {reportBox('thread',detail.id)}
      {me?.permissions.canModerate&&<div className={styles.modBar}>
       <input aria-label={t.moderationReason} value={modReason} minLength={6} maxLength={300}
        onChange={e=>setModReason(e.target.value)} placeholder={t.moderationReason}/>
       {([
        {text:detail.locked?t.unlock:t.lock,delta:{locked:!detail.locked}},
        {text:detail.pinned?t.unpin:t.pin,delta:{pinned:!detail.pinned}},
        {text:t.hide,delta:{status:'HIDDEN'}}
       ]).map((item,i)=><button type="button" key={i} disabled={busy||modReason.trim().length<6}
        onClick={()=>void act(()=>api('mod/threads/'+detail.id,json('PATCH',{...item.delta,reason:modReason})))}>{item.text}</button>)}
       <button type="button" className={styles.deleteButton} disabled={busy}
        onClick={async()=>{if(!window.confirm(t.deleteConfirm))return;
         if(await act(()=>api('mod/threads/'+detail.id,{method:'DELETE'})))window.location.assign(root);
        }}><Trash2 size={15}/>{t.delete}</button>
      </div>}
     </article>}
     <h2 className={styles.subTitle}>{t.reply} · {replies?.total??0}</h2>
     <p className={styles.voteHint}><ThumbsUp size={16}/>
       {locale==='uk'?'Кнопка «Корисно» є під кожною відповіддю. Вона допомагає відзначати цінні пояснення.':
        'Use “Helpful” beneath individual replies to highlight useful explanations.'}
     </p>
     {replies?.items.map(p=><article className={styles.reply} key={p.id}>
      <div className={styles.meta}>{actor(p.author)} · {date(p.createdAt)}</div>
      <p className={styles.body}>{p.body}</p>
      <div className={styles.actions}>
       {me?.profile?.id===p.author.id&&editButton(p.id,p.body)}
       {(me?.profile?.id===p.author.id||me?.permissions.canModerate)&&
        <button type="button" onClick={()=>void showHistory('posts/'+p.id,p.id)}>
         <History size={14}/>{t.history}</button>}
       <button className={styles.helpfulButton} type="button" disabled={!me?.signedIn||busy}
        title={locale==='uk'?'Позначити цю відповідь корисною':'Mark this reply helpful'}
        aria-pressed={activity?.myLikes.includes(p.id)===true}
        onClick={()=>void act(()=>api('posts/'+p.id+'/helpful',{
         method:activity?.myLikes.includes(p.id)?'DELETE':'PUT'}))}>
        <ThumbsUp size={14}/>{t.helpful} · {activity?.likes[p.id]?.count||0}
       </button>
       {me?.signedIn&&<button type="button" onClick={()=>setReporting({target:'post',id:p.id})}><Flag size={14}/>{t.report}</button>}
       {me?.permissions.canModerate&&<button type="button" disabled={busy||modReason.trim().length<6}
        onClick={()=>void act(()=>api('mod/posts/'+p.id,json('PATCH',{status:'HIDDEN',reason:modReason})))}>{t.hide}</button>}
      </div>
      {editingForm(p.id,'posts/'+p.id)}
      {historyPanel(p.id)}
      {reportBox('post',p.id)}
     </article>)}
     {replies&&replies.total===0&&<p className={styles.empty}>{t.noReplies}</p>}
     {replies&&<div className={styles.pages}>
      <button type="button" disabled={replyPage===1} onClick={()=>setReplyPage(n=>n-1)}>{t.previous}</button>
      <span>{replyPage}</span><button type="button" disabled={replyPage*20>=replies.total}
       onClick={()=>setReplyPage(n=>n+1)}>{t.more}</button></div>}
     {me?.permissions.canReply&&!detail?.locked&&detail&&<form className={styles.panel} onSubmit={async e=>{
      e.preventDefault();const ok=await act(()=>api('threads/'+detail.id+'/posts',json('POST',{body:replyBody})));
      if(ok){setReplyBody('');setReplyPage(1)}
     }}>
      <h3>{t.reply}</h3><textarea rows={12} value={replyBody} minLength={1} maxLength={5000} required
       onChange={e=>setReplyBody(e.target.value)}/>
      <button type="submit" disabled={busy}>{t.send}</button>
     </form>}
    </section>
   :<div className={styles.layout}>
     <aside className={styles.sidebar} aria-label={t.pickCategory}>
      <button type="button" className={!category?styles.selected:''} onClick={()=>{setCategory('');setPage(1)}}>{t.all}</button>
      {categories.map(c=><button type="button" key={c.slug} className={category===c.slug?styles.selected:''}
       onClick={()=>{setCategory(c.slug);setPage(1)}}>{name(c)}</button>)}
     </aside>
     <section className={styles.content}>
      <div className={styles.tools}>
       <form role="search" onSubmit={e=>{e.preventDefault();setQuery(search.trim());setPage(1)}}>
        <Search size={18}/><input aria-label={t.search} value={search} maxLength={80} placeholder={t.search}
         onChange={e=>setSearch(e.target.value)}/>
        <button type="submit">{t.find}</button></form>
       <div className={styles.tabs} role="group" aria-label={t.browse}>
        {(['active','latest','unanswered'] as const).map(value=><button type="button" key={value}
         aria-pressed={sort===value} onClick={()=>{setSort(value);setPage(1)}}>{t[value]}</button>)}
       </div>
      </div>
      {!listing?<p className={styles.empty}>{t.loading}</p>:listing.items.length===0?
       <p className={styles.empty}>{t.empty}</p>:listing.items.map(thread=>
        <article className={styles.thread} key={thread.id} data-testid="com-thread-card">
         <div className={styles.meta}><span>{locale==='uk'?thread.category.titleUk:thread.category.titleEn}</span>
          <span>· {date(thread.lastActivityAt)}</span>{thread.pinned&&<span>· {t.pinned}</span>}</div>
         <h2><Link href={root+'/topic/'+thread.id}>{thread.title}</Link></h2>
         <p className={styles.excerpt}>{thread.body.slice(0,260)}{thread.body.length>260?'…':''}</p>
         <div className={styles.threadFooter}>{actor(thread.author)}<span><MessageCircle size={15}/>{thread.replyCount} {t.replyCount}</span>
          {thread.locked&&<Lock size={15}/>}
          {me?.permissions.canModerate&&<button className={styles.deleteButton} type="button" disabled={busy}
           onClick={async()=>{if(!window.confirm(t.deleteConfirm))return;
            await act(()=>api('mod/threads/'+thread.id,{method:'DELETE'}));
           }}><Trash2 size={14}/>{t.delete}</button>}</div>
        </article>)}
      {listing&&<div className={styles.pages}>
       <button type="button" disabled={page===1} onClick={()=>setPage(n=>n-1)}>{t.previous}</button>
       <span>{page}</span>
       <button type="button" disabled={page*20>=listing.total} onClick={()=>setPage(n=>n+1)}>{t.more}</button>
      </div>}
     </section>
    </div>}
  </div>
 </PortalShell>;
}
