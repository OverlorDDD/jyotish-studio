'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import Link from 'next/link';
import {Bookmark,Flame,Medal} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import styles from './GalaxiComGrowth.module.css';
type Topic={id:string;title:string;category:string;replies?:number};
type Bookmarks={items:Topic[];total:number;max:number};
type Me={signedIn:boolean;permissions:{premiumBadge:boolean};profile:{id:string}|null};
type Member={signature:string;accent:string;helpful:number;reputation:string};
async function api<T>(path:string,init?:RequestInit):Promise<T>{
 const res=await fetch('/api/v1/com/growth/'+path,{credentials:'same-origin',cache:'no-store',...init});
 const body=await res.json().catch(()=>({})) as T&{message?:string};
 if(!res.ok)throw new Error(body.message||String(res.status));return body;
}
export default function GalaxiComGrowth({locale,me,threadId,activePanel,onToggle}:{locale:PortalLocale;me:Me|null;
 threadId?:string;activePanel:string|null;onToggle:(name:string)=>void}){
 const uk=locale==='uk',root='/'+locale+'/community',premium=me?.permissions.premiumBadge===true;
 const [featured,setFeatured]=useState<Topic[]>([]),[saved,setSaved]=useState(false),[bookmarks,setBookmarks]=useState<Bookmarks|null>(null);
 const [profile,setProfile]=useState<Member|null>(null),[signature,setSignature]=useState(''),[accent,setAccent]=useState('default');
 const [refresh,setRefresh]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [portalTarget,setPortalTarget]=useState<HTMLElement|null>(null);
 useEffect(()=>{setPortalTarget(document.getElementById('com-toolbar-panel'))},[]);
 useEffect(()=>{let active=true;
  if(!threadId)api<{items:Topic[]}>('featured').then(x=>{if(active)setFeatured(x.items)}).catch(()=>{});
  if(me?.signedIn){
   api<Bookmarks>('bookmarks').then(x=>{if(active)setBookmarks(x)}).catch(()=>{});
   if(threadId)api<{saved:boolean}>('bookmarks/'+threadId).then(x=>{if(active)setSaved(x.saved)}).catch(()=>{});
   if(me.profile?.id)api<Member>('members/'+me.profile.id).then(x=>{if(active){setProfile(x);setSignature(x.signature);setAccent(x.accent)}}).catch(()=>{});
  }return()=>{active=false};
 },[threadId,me?.signedIn,me?.profile?.id,refresh]);
 async function change(path:string,method:string,data?:unknown){
  setBusy(true);setError('');
  try{await api(path,{method,...(data!==undefined?{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});
   setRefresh(x=>x+1);
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false);}
 }
 const control=(key:string,label:string,icon:ReactNode)=>
  <button type="button" className={styles.trigger} aria-controls="com-toolbar-panel"
   aria-expanded={activePanel===key} onClick={()=>onToggle(key)}>{icon}{label}</button>;
 return <section className={styles.wrap} data-testid="com-growth">
  {!threadId&&<div className={styles.card} data-testid="com-trending">
   {control('popular',uk?'Популярне':'Trending',<Flame size={18}/>)}</div>}
  {threadId&&me?.signedIn&&<div className={styles.bookmarkAction}>
   <button type="button" disabled={busy} aria-pressed={saved}
    onClick={()=>void change('bookmarks/'+threadId,saved?'DELETE':'PUT')}>
    <Bookmark size={16}/>{saved?(uk?'Прибрати із закладок':'Remove bookmark'):(uk?'Зберегти тему':'Save topic')}
   </button></div>}
  {me?.signedIn&&<div className={styles.card} data-testid="com-bookmarks">
   {control('bookmarks',(uk?'Мої закладки':'My saved topics')+(bookmarks?' ('+bookmarks.total+'/'+bookmarks.max+')':''),<Bookmark size={19}/>)}</div>}
  {me?.signedIn&&profile&&<div className={styles.card} data-testid="com-profile-tool">
   {control('profile',uk?'Мій профіль спільноти':'My community profile',<Medal size={19}/>)}</div>}
  {activePanel==='popular'&&portalTarget&&!threadId&&createPortal(
   <div className={styles.expanded} data-testid="com-expanded-popular">
    <h3>{uk?'Популярні обговорення':'Trending discussions'}</h3>
    {featured.length?featured.map(x=><Link href={root+'/topic/'+x.id} className={styles.item} key={x.id}>
     <span>{x.title}</span><small>{x.category} · {x.replies} {uk?'відповідей':'replies'}</small>
    </Link>):<p>{uk?'Обговорення з’являться після перших публікацій.':'Discussions appear after members post.'}</p>}
    <small>{uk?'Активність за 30 днів, не редакційна рекомендація':'30-day engagement, not an editorial endorsement'}</small>
   </div>,portalTarget)}
  {activePanel==='bookmarks'&&portalTarget&&me?.signedIn&&createPortal(
   <div className={styles.expanded} data-testid="com-expanded-bookmarks">
    <h3>{uk?'Мої закладки':'My saved topics'}</h3>
    <div className={styles.savedList}>{bookmarks?.items.length?bookmarks.items.map(x=>
     <div className={styles.saved} key={x.id}><Link href={root+'/topic/'+x.id}>{x.title}</Link>
      <button disabled={busy} type="button" onClick={()=>void change('bookmarks/'+x.id,'DELETE')}>
       {uk?'Прибрати':'Remove'}</button></div>):<p>{uk?'Поки немає збережених тем':'No saved topics yet'}</p>}</div>
   </div>,portalTarget)}
  {activePanel==='profile'&&portalTarget&&me?.signedIn&&profile&&createPortal(
   <div className={styles.expanded} data-testid="com-expanded-profile">
    <h3>{uk?'Мій профіль спільноти':'My community profile'}</h3>
    <form className={styles.settings} onSubmit={e=>{e.preventDefault();void change('profile','PATCH',{signature,accent})}}>
     <label>{uk?'Про мене':'About me'}<textarea rows={3} maxLength={premium?280:80} value={signature}
      onChange={e=>setSignature(e.target.value)}/></label>
     <label>{uk?'Оформлення профілю':'Profile appearance'}<select value={accent} onChange={e=>setAccent(e.target.value)}>
      <option value="default">{uk?'Звичайне':'Default'}</option>
      {premium&&<><option value="gold">{uk?'Золото':'Gold'}</option><option value="violet">{uk?'Фіолет':'Violet'}</option><option value="teal">{uk?'Бірюза':'Teal'}</option></>}
     </select></label>
     <button type="submit" disabled={busy}>{uk?'Зберегти профіль':'Save profile'}</button>
     <p>{premium?(uk?'PREMIUM: 200 закладок, розширений опис і кольори':'PREMIUM: 200 bookmarks, extended bio and accents'):
      (uk?'FREE: 20 закладок і короткий опис':'FREE: 20 bookmarks and a short bio')}</p>
    </form>
   </div>,portalTarget)}
  {error&&<p role="alert" className={styles.error}>{error}</p>}
 </section>;
}
