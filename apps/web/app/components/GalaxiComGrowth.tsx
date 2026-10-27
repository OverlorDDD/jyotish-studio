'use client';
import {useEffect,useState} from 'react';
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
export default function GalaxiComGrowth({locale,me,threadId}:{locale:PortalLocale;me:Me|null;threadId?:string}){
 const uk=locale==='uk',root='/'+locale+'/community',premium=me?.permissions.premiumBadge===true;
 const [featured,setFeatured]=useState<Topic[]>([]),[saved,setSaved]=useState(false),[bookmarks,setBookmarks]=useState<Bookmarks|null>(null);
 const [profile,setProfile]=useState<Member|null>(null),[signature,setSignature]=useState(''),[accent,setAccent]=useState('default');
 const [open,setOpen]=useState(false),[refresh,setRefresh]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState('');
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
 return <section className={styles.wrap} data-testid="com-growth">
  {!threadId&&<details className={styles.card} data-testid="com-trending">
   <summary><Flame size={18}/>{uk?'Популярне':'Trending'}</summary>
   <div className={styles.detailContent}>
   {featured.length?featured.map(x=><Link href={root+'/topic/'+x.id} className={styles.item} key={x.id}>
    <span>{x.title}</span><small>{x.category} · {x.replies} {uk?'відповідей':'replies'}</small>
   </Link>):<p>{uk?'Обговорення з’являться після перших публікацій.':'Discussions appear after members post.'}</p>}
   <small>{uk?'Активність за 30 днів, не редакційна рекомендація':'30-day engagement, not an editorial endorsement'}</small>
   </div>
  </details>}
  {threadId&&me?.signedIn&&<div className={styles.bookmarkAction}>
   <button type="button" disabled={busy} aria-pressed={saved} onClick={()=>void change('bookmarks/'+threadId,saved?'DELETE':'PUT')}>
    <Bookmark size={16}/>{saved?(uk?'Прибрати із закладок':'Remove bookmark'):(uk?'Зберегти тему':'Save topic')}</button>
  </div>}
  {me?.signedIn&&<details className={styles.card} open={open} onToggle={e=>setOpen(e.currentTarget.open)}>
   <summary><Bookmark size={19}/>{uk?'Мої закладки':'My saved topics'} {bookmarks?('('+bookmarks.total+'/'+bookmarks.max+')'):''}</summary>
   {open&&<div className={styles.savedList}>{bookmarks?.items.length?bookmarks.items.map(x=>
    <div className={styles.saved} key={x.id}><Link href={root+'/topic/'+x.id}>{x.title}</Link>
     <button disabled={busy} type="button" onClick={()=>void change('bookmarks/'+x.id,'DELETE')}>{uk?'Прибрати':'Remove'}</button></div>):<p>{uk?'Поки немає збережених тем':'No saved topics yet'}</p>}</div>}
  </details>}
  {me?.signedIn&&profile&&<details className={styles.card}>
   <summary><Medal size={19}/>{uk?'Мій профіль спільноти':'My community profile'}</summary>
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
  </details>}
  {error&&<p role="alert" className={styles.error}>{error}</p>}
 </section>;
}
