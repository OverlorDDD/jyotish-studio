'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,MessagesSquare,ShieldCheck,Trash2} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import styles from './GalaxiComBridge.module.css';
type Kind='ACADEMY'|'YOGA';
type Item={id:string;threadId:string;title:string;replies:number};
type Info={source:{kind:Kind;slug:string;category:string};items:Item[]};
type Permissions={permissions:{canManageContext:boolean};profile:{id:string}|null};
const defaultCategory=(kind:Kind)=>kind==='YOGA'?'practices':'jyotish';
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default function GalaxiComBridge({kind,slug,locale,title}:{
 kind:Kind;slug:string;locale:PortalLocale;title:string
}){
 const uk=locale==='uk',home='/'+locale+'/community';
 const [info,setInfo]=useState<Info|null>(null),[admin,setAdmin]=useState(false);
 const [topicId,setTopicId]=useState(''),[error,setError]=useState(''),[reload,setReload]=useState(0);
 const [saving,setSaving]=useState(false);
 const [search,setSearch]=useState(''),[matches,setMatches]=useState<{id:string;title:string}[]>([]);
 const [selectedTitle,setSelectedTitle]=useState('');
 useEffect(()=>{
  let live=true;
  const phrase=search.trim();
  if(!admin||phrase.length<2){setMatches([]);return;}
  const controller=new AbortController();
  const timer=setTimeout(()=>{
   fetch('/api/v1/com/threads?sort=latest&q='+encodeURIComponent(phrase)+'&page=1',
    {credentials:'same-origin',signal:controller.signal})
    .then(r=>r.ok?r.json():{items:[]})
    .then(data=>{if(live)setMatches((data.items||[]).slice(0,10).map((row:{id:string;title:string})=>({id:row.id,title:row.title})))})
    .catch(()=>{if(live&&!controller.signal.aborted)setMatches([])});
  },250);
  return()=>{live=false;clearTimeout(timer);controller.abort()};
 },[admin,search]);
 useEffect(()=>{
  let live=true;
  const params=new URLSearchParams({kind,slug});
  Promise.all([
   fetch('/api/v1/com/context?'+params,{cache:'no-store'}).then(r=>r.ok?r.json():null),
   fetch('/api/v1/com/me',{cache:'no-store',credentials:'same-origin'}).then(r=>r.ok?r.json():null)
  ]).then(([content,me]:[Info|null,Permissions|null])=>{
   if(live){setInfo(content);setAdmin(me?.permissions?.canManageContext===true);}
  }).catch(()=>{if(live)setInfo(null)});
  return()=>{live=false};
 },[kind,slug,reload]);
 async function edit(method:'POST'|'DELETE',id?:string){
  setSaving(true);setError('');
  try{
   const path=method==='POST'?'links':'links/'+id;
   const res=await fetch('/api/v1/com/context/'+path,{
    method,credentials:'same-origin',
    ...(method==='POST'?{headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kind,slug,threadId:topicId.trim()})}:{})
   });
   if(!res.ok){const payload=await res.json().catch(()=>({}));
    throw new Error(Array.isArray(payload.message)?payload.message.join(', '):payload.message||'HTTP '+res.status);}
   setTopicId('');setSelectedTitle('');setSearch('');setReload(v=>v+1);
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setSaving(false);}
 }
 return <aside className={styles.bridge} data-testid="community-context" aria-label={(uk?'Обговорення матеріалу: ':'Material discussions: ')+title}>
  <div className={styles.heading}><MessagesSquare size={24}/><div>
   <h2>{uk?'Обговорити у GalaxiCom':'Discuss in GalaxiCom'}</h2>
   <p>{uk?'Публічна розмова про тему матеріалу — не офіційне трактування Galaxiora.':
    'A public conversation about this material, not an official Galaxiora interpretation.'}</p>
  </div></div>
  {info?.items.length?<div className={styles.links}>{info.items.map(row=><div key={row.id} className={styles.item}>
   <Link href={home+'/topic/'+row.threadId}>{row.title}<ArrowUpRight size={15}/></Link>
   <small>{row.replies} {uk?'відповідей':'replies'} · {uk?'Зв’язок схвалений редакцією':'Editorially linked'}</small>
   {admin&&<button type="button" disabled={saving} onClick={()=>void edit('DELETE',row.id)}>
    <Trash2 size={14}/>{uk?'Прибрати зв’язок':'Unlink'}</button>}
  </div>)}</div>:<p className={styles.empty}>{uk?'Ще немає схвалених тематичних обговорень.':
   'No editorially linked discussions yet.'}</p>}
  <Link className={styles.start} href={home+'?category='+encodeURIComponent(info?.source.category||defaultCategory(kind))}>
   {uk?'Перейти до тематичного форуму':'Explore the topic forum'} <ArrowUpRight size={17}/>
  </Link>
  {admin&&<details className={styles.adminDisclosure}>
   <summary><ShieldCheck size={16}/>{uk?'Прив’язати обговорення до матеріалу':'Connect a discussion to this material'}</summary>
   <form className={styles.admin} onSubmit={e=>{e.preventDefault();if(idPattern.test(topicId))void edit('POST');}}>
    <p>{uk?'Знайди опубліковану тему за назвою, вибери її зі списку та підтвердь зв’язок. Жодних ID копіювати не потрібно.':
     'Search for an existing public discussion by its title, select it, then approve the association. No IDs to copy.'}</p>
    <label>{uk?'Знайти обговорення':'Find a discussion'}
     <input aria-label={uk?'Пошук теми для прив’язки':'Search topics to connect'} value={search}
      onChange={e=>{setSearch(e.target.value);setTopicId('');setSelectedTitle('')}}
      placeholder={uk?'Введи 2 або більше літер назви':'Type at least two letters'} maxLength={80}/>
    </label>
    {search.trim().length>=2&&<div className={styles.candidates}>
      {matches.length?matches.map(row=><button type="button" key={row.id}
       onClick={()=>{setTopicId(row.id);setSelectedTitle(row.title);setSearch(row.title)}}>
       {row.title}{row.id===topicId?' ✓':''}</button>):
       <small>{uk?'Нічого не знайдено. Створи тему на форумі та повернись сюди.':'No matching published topics. Create one on the forum first.'}</small>}
    </div>}
    {selectedTitle&&<p role="status">{uk?'Вибрано: ':'Selected: '}<strong>{selectedTitle}</strong></p>}
    <button type="submit" disabled={saving||!idPattern.test(topicId)}>
     {uk?'Підтвердити зв’язок':'Approve connection'}</button>
    <small>{uk?'Це зв’язок за темою, а не підтвердження правдивості відповідей.':'This links related subjects, not an endorsement of community replies.'}</small>
    {error&&<p role="alert">{error}</p>}
   </form>
  </details>}
 </aside>;
}
