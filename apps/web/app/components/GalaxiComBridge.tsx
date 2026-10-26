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
   setTopicId('');setReload(v=>v+1);
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
  {admin&&<form className={styles.admin} onSubmit={e=>{e.preventDefault();if(idPattern.test(topicId.trim()))void edit('POST');}}>
   <strong><ShieldCheck size={15}/>{uk?'Редакційне схвалення зв’язку':'Approve contextual connection'}</strong>
   <label>{uk?'ID опублікованої теми':'Published topic ID'}
    <input aria-label={uk?'ID теми для прив’язки':'Topic ID to link'} value={topicId}
     onChange={e=>setTopicId(e.target.value)} placeholder="UUID" required pattern="[0-9a-fA-F-]{36}" maxLength={36}/>
   </label>
   <button type="submit" disabled={saving||!idPattern.test(topicId.trim())}>
    {uk?'Прив’язати тему':'Link topic'}</button>
   <small>{uk?'Тільки опубліковані теми. Прив’язка не підтверджує правильність відповідей.':
    'Only published topics. Association does not endorse community replies.'}</small>
   {error&&<p role="alert">{error}</p>}
  </form>}
 </aside>;
}
