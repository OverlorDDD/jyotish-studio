'use client';
import {useEffect,useState} from 'react';
import {ShieldCheck,Download,Scale,Trash2} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import styles from './GalaxiComSafety.module.css';
type Request={id:string;status:string;targetType?:string;targetId?:string;reason?:string;
 decisionReason?:string;userId?:string};
type Me={signedIn:boolean;permissions:{canModerate:boolean;canManageContext:boolean}};
async function api<T>(path:string,init?:RequestInit){
 const res=await fetch('/api/v1/com/'+path,{credentials:'same-origin',cache:'no-store',...init});
 const body=await res.json().catch(()=>({})) as T & {message?:string|string[]};
 if(!res.ok)throw new Error(Array.isArray(body.message)?body.message.join(', '):body.message||'HTTP '+res.status);
 return body;
}
const send=(method:string,data:unknown):RequestInit=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
export default function GalaxiComSafety({locale,me}:{locale:PortalLocale;me:Me|null}){
 const uk=locale==='uk';
 const [open,setOpen]=useState(false),[mine,setMine]=useState<Request[]>([]),
  [eligible,setEligible]=useState<{type:string;id:string;label:string}[]>([]),
  [privacy,setPrivacy]=useState<Request[]>([]),[appeals,setAppeals]=useState<Request[]>([]),
  [modPrivacy,setModPrivacy]=useState<Request[]>([]);
 const [type,setType]=useState('THREAD'),[id,setId]=useState(''),[reason,setReason]=useState('');
 const [decisionReason,setDecisionReason]=useState(''),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[reload,setReload]=useState(0);
 const signed=me?.signedIn===true,staff=me?.permissions.canModerate===true,admin=me?.permissions.canManageContext===true;
 useEffect(()=>{if(!open||!signed)return;let active=true;
  Promise.all([api<{items:Request[]}>('appeals/mine'),api<{items:{type:string;id:string;label:string}[]}>('appeals/eligible'),api<{items:Request[]}>('privacy/requests'),
   staff?api<{items:Request[]}>('mod/appeals'):Promise.resolve({items:[]}),
   admin?api<{items:Request[]}>('mod/privacy'):Promise.resolve({items:[]})])
   .then(([a,e,p,m,x])=>{if(active){setMine(a.items);setEligible(e.items);setPrivacy(p.items);setAppeals(m.items);setModPrivacy(x.items)}})
   .catch(e=>{if(active)setError(e.message)});
  return()=>{active=false};
 },[open,signed,staff,admin,reload]);
 async function action(request:()=>Promise<unknown>,success:string){
  setBusy(true);setError('');setMessage('');
  try{await request();setMessage(success);setReload(x=>x+1);return true}
  catch(e){setError(e instanceof Error?e.message:String(e));return false}
  finally{setBusy(false)}
 }
 async function download(){
  setBusy(true);setError('');
  try{
   const pages=[];let more=true;
   for(let page=1;page<=1000&&more;page++){
    const result=await api<{hasMore:boolean}>('privacy/export?page='+page);
    pages.push(result);more=result.hasMore;
   }
   const data=new Blob([JSON.stringify({scope:'GalaxiCom forum only',pages},null,2)],{type:'application/json'});
   const url=URL.createObjectURL(data);
   const a=document.createElement('a');a.href=url;a.download='galaxicom-forum-export.json';a.click();
   URL.revokeObjectURL(url);
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 if(!signed)return null;
 return <section className={styles.wrapper} data-testid="com-safety">
  <button className={styles.toggle} type="button" onClick={()=>setOpen(!open)} aria-expanded={open}>
   <ShieldCheck size={19}/>{uk?'Безпека, апеляції та мої дані':'Safety, appeals and my data'}
  </button>
  {open&&<div className={styles.content}>
   <h3>{uk?'Правила спільноти':'Community rules'}</h3>
   <p>{uk?'Публікуй лише інформацію, якою маєш право ділитися. Заборонені переслідування, спам, обманна реклама та чужі приватні дані. Скарги розглядають люди; редакційний зв’язок не означає схвалення кожної відповіді.':
    'Only share information you are authorized to disclose. No harassment, spam, deceptive advertising, or third-party private data. Humans review reports; article links do not endorse every community reply.'}</p>
   <p>{uk?'Апеляцію на модерацію власного прихованого допису можна подати протягом 30 днів. Початковий модератор не може розглядати власне рішення.':
    'Appeal moderation of your hidden contribution within 30 days. The original moderator cannot decide their own appeal.'}</p>
   <div className={styles.columns}>
    <section>
     <h3><Scale size={17}/>{uk?'Оскаржити рішення':'Appeal moderation'}</h3>
     {eligible.length>0&&<label>{uk?'Мої приховані матеріали':'My moderated contributions'}
      <select value="" onChange={e=>{
       const item=eligible.find(x=>x.id===e.target.value);
       if(item){setType(item.type);setId(item.id);}
      }}>
       <option value="">{uk?'Вибрати матеріал':'Choose a contribution'}</option>
       {eligible.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
      </select>
     </label>}
     <form onSubmit={async e=>{e.preventDefault();if(await action(()=>api('appeals',send('POST',{
      targetType:type,targetId:id,reason
     })),uk?'Апеляцію передано':'Appeal submitted')){setReason('');setId('')}}}>
      <label>{uk?'Тип запису':'Content type'}
       <select value={type} onChange={e=>setType(e.target.value)}>
        <option value="THREAD">{uk?'Тема':'Thread'}</option><option value="POST">{uk?'Відповідь':'Reply'}</option>
       </select></label>
      <label>{uk?'ID власної прихованої теми / відповіді':'Your hidden post/thread ID'}
       <input value={id} onChange={e=>setId(e.target.value)} required
        pattern="[a-fA-F0-9-]{36}" maxLength={36}/></label>
      <label>{uk?'Чому переглянути рішення':'Why review the decision?'}
       <textarea value={reason} onChange={e=>setReason(e.target.value)} minLength={12} maxLength={1000} required/></label>
      <button type="submit" disabled={busy}>{uk?'Надіслати апеляцію':'Submit appeal'}</button>
     </form>
     {mine.length>0&&<div className={styles.queue}>
      <strong>{uk?'Мої апеляції':'My appeals'}</strong>
      {mine.map(x=><p key={x.id}>{x.status} · {x.targetType} · {x.targetId}
       {x.decisionReason?' — '+x.decisionReason:''}</p>)}
     </div>}
    </section>
    <section>
     <h3><Download size={17}/>{uk?'Мої форумні дані':'My forum data'}</h3>
     <p>{uk?'Можна завантажити власні теми, відповіді, скарги та апеляції. Це експорт GalaxiCom, не всього акаунта Galaxiora.':
      'Download your forum threads, replies, reports and appeals. This exports GalaxiCom only, not all Galaxiora account data.'}</p>
     <button type="button" onClick={()=>void download()} disabled={busy}><Download size={15}/>{uk?'Завантажити JSON':'Download JSON'}</button>
     <p>{uk?'Запит на видалення публічного контенту перевіряє адміністратор. Записи модерації й резервні копії мають окремі строки зберігання.':
      'An administrator reviews public-content removal. Moderation records and backups follow a separate retention schedule.'}</p>
     <button type="button" disabled={busy||privacy.some(p=>['OPEN','IN_REVIEW'].includes(p.status))}
      onClick={()=>{if(window.confirm(uk?'Подати запит на приховування та очищення своїх публічних форумних дописів?':
       'Request public removal of your forum contributions?'))void action(
        ()=>api('privacy/requests',send('POST',{kind:'ERASE_FORUM'})),
        uk?'Запит прийнято':'Request received');}}>
       <Trash2 size={15}/>{uk?'Запитати видалення':'Request removal'}
     </button>
     {privacy.map(p=><p key={p.id}>{uk?'Статус запиту':'Request status'}: {p.status}</p>)}
    </section>
   </div>
   {staff&&<section className={styles.staff}>
    <h3>{uk?'Черга апеляцій для модераторів':'Moderator appeal queue'}</h3>
    <label>{uk?'Обґрунтування рішення':'Decision reason'}
     <textarea value={decisionReason} onChange={e=>setDecisionReason(e.target.value)} minLength={12} maxLength={1000}/></label>
    {appeals.length===0?<p>{uk?'Нових апеляцій немає':'No pending appeals'}</p>:appeals.map(a=><div className={styles.queueRow} key={a.id}>
     <strong>{a.targetType}: {a.targetId}</strong><p>{a.reason}</p>
     {(['ACCEPTED','REJECTED'] as const).map(decision=><button key={decision} type="button"
      disabled={busy||decisionReason.trim().length<12} onClick={()=>void action(
       ()=>api('mod/appeals/'+a.id,send('PATCH',{decision,reason:decisionReason})),
       uk?'Рішення збережено':'Decision saved')}>{decision}</button>)}
    </div>)}
   </section>}
   {admin&&<section className={styles.staff}>
    <h3>{uk?'Запити на захист даних':'Privacy requests'}</h3>
    {modPrivacy.length===0?<p>{uk?'Немає відкритих запитів':'No open requests'}</p>:modPrivacy.map(q=><div key={q.id} className={styles.queueRow}>
     <strong>{q.id}</strong><p>{q.status}</p>
     {(['REVIEW','PUBLIC_REDACT'] as const).map(next=><button type="button" key={next}
      disabled={busy||decisionReason.trim().length<12} onClick={()=>void action(
       ()=>api('mod/privacy/'+q.id,send('PATCH',{action:next,reason:decisionReason})),
       uk?'Статус оновлено':'Status updated')}>{next}</button>)}
    </div>)}
   </section>}
   {error&&<p className={styles.error} role="alert">{error}</p>}
   {message&&<p className={styles.success} role="status">{message}</p>}
  </div>}
 </section>;
}
