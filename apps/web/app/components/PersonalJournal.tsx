'use client';
import {useEffect,useState} from 'react';
import {BookOpen,Save,Trash2,RefreshCcw} from 'lucide-react';
import {readApiJson} from '../../lib/api-response';
type Kind='TAROT'|'JYOTISH'|'PRACTICE'|'REFLECTION';
type Entry={id:string;kind:Kind;sourceId:string|null;title:string;body:string;createdAt:string};
export default function PersonalJournal({locale,sourceId,kind='REFLECTION'}:{
 locale:'uk'|'en';sourceId?:string|null;kind?:Kind;
}){
 const uk=locale==='uk', [entries,setEntries]=useState<Entry[]>([]),[title,setTitle]=useState(''),
 [body,setBody]=useState(''),[error,setError]=useState(''),[note,setNote]=useState(''),
 [busy,setBusy]=useState(false),[signedIn,setSignedIn]=useState(false),[loading,setLoading]=useState(true);
 const [filter,setFilter]=useState<Kind|'ALL'>('ALL'),[search,setSearch]=useState(''),[editing,setEditing]=useState<string|null>(null);
 const [editTitle,setEditTitle]=useState(''),[editBody,setEditBody]=useState('');
 async function load(){
  setLoading(true);setError('');
  try{
   const me=await readApiJson<{user:{id:string}|null}>(await fetch('/api/v1/account/me',{credentials:'same-origin',cache:'no-store'}));
   setSignedIn(!!me.user);
   if(!me.user){setEntries([]);return;}
   const data=await readApiJson<{entries:Entry[]}>(await fetch('/api/v1/account/journal',{credentials:'same-origin',cache:'no-store'}));
   setEntries(data.entries);
  }catch{
   setError(uk?'Журнал зараз не відповідає. Перевір підключення API й спробуй ще раз.':'Journal is not responding. Check the API connection and retry.');
  }finally{setLoading(false);}
 }
 useEffect(()=>{
  void load();
  const listener=()=>{setEntries([]);void load();};
  window.addEventListener('galaxiora:auth-changed',listener);
  return()=>window.removeEventListener('galaxiora:auth-changed',listener);
 },[locale]);
 async function save(event:React.FormEvent){
  event.preventDefault();if(!signedIn)return;
  setBusy(true);setError('');setNote('');
  try{
   await readApiJson(await fetch('/api/v1/account/journal',{method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({kind,sourceId:sourceId||undefined,title:title.trim(),body:body.trim()})}));
   setTitle('');setBody('');
   await load();setNote(uk?'Запис збережено приватно':'Private note saved');
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 async function remove(id:string){
  setBusy(true);setError('');setNote('');
  try{
   await readApiJson(await fetch('/api/v1/account/journal/'+encodeURIComponent(id),{method:'DELETE',credentials:'same-origin'}));
   await load();
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 async function updateEntry(event:React.FormEvent,id:string){
  event.preventDefault();if(!signedIn)return;
  setBusy(true);setError('');setNote('');
  try{
   await readApiJson(await fetch('/api/v1/account/journal/'+encodeURIComponent(id),{method:'PATCH',
    credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:editTitle.trim(),body:editBody.trim()})}));
   setEditing(null);await load();setNote(uk?'Зміни збережено':'Changes saved');
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false);}
 }
 async function exportPrivate(){
  if(!signedIn)return;
  setBusy(true);setError('');setNote('');
  try{
   const all:Entry[]=[];let cursor:string|null=null;
   for(let page=0;page<100;page++){
    const endpoint:string='/api/v1/account/journal/export'+(cursor?'?cursor='+encodeURIComponent(cursor):'');
    const result:{entries:Entry[];nextCursor:string|null}=await readApiJson<{entries:Entry[];nextCursor:string|null}>(await fetch(endpoint,{credentials:'same-origin',cache:'no-store'}));
    all.push(...result.entries);cursor=result.nextCursor;
    if(!cursor)break;
   }
   if(cursor)throw new Error('Export exceeds the maximum supported size');
   const blob=new Blob([JSON.stringify({format:'galaxiora-journal-v1',exportedAt:new Date().toISOString(),entries:all},null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='galaxiora-personal-journal.json';
   document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
   setNote(uk?'Приватний журнал експортовано':'Private journal exported');
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false);}
 }
 const shown=sourceId?entries.filter(x=>x.kind===kind&&x.sourceId===sourceId):entries.filter(x=>(filter==='ALL'||x.kind===filter)&&(!search.trim()||(x.title+' '+x.body).toLocaleLowerCase().includes(search.toLocaleLowerCase().trim())));
 return <section id="personal-journal" className="as-profile-card as-journal-card" aria-label={uk?'Особистий журнал':'Personal journal'}>
  <div className="as-journal-head"><h2><BookOpen size={21}/>{uk?'Мій особистий журнал':'My personal journal'}</h2><span>{uk?'ПРИВАТНИЙ ПРОСТІР':'PRIVATE SPACE'}</span></div>
  <p className="as-muted">{uk?'Ці нотатки бачиш лише ти. Вони не передаються AI-провайдерам.':'Only you can view these notes. They are never sent to AI providers.'}</p>
  {loading?<p role="status" className="as-muted">{uk?'Завантажуємо записи…':'Loading entries…'}</p>:null}
  {!loading&&!signedIn?<p>{uk?'Увійди, щоб вести приватний журнал.':'Sign in to keep a private journal.'}</p>:signedIn?
   <form onSubmit={save} className="account-form">
    <label>{uk?'Назва запису':'Entry title'}
     <input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label>{uk?'Мої думки та висновки':'My thoughts and observations'}
     <textarea required maxLength={2000} rows={4} value={body} onChange={e=>setBody(e.target.value)}/></label>
    <button type="submit" className="as-button as-button-primary" disabled={busy||!title.trim()||!body.trim()}>
     <Save size={17}/>{uk?'Зберегти запис':'Save entry'}</button>
   </form>:null}
  {signedIn&&!sourceId&&<div className="as-journal-tools">
   <label htmlFor="as-journal-filter">{uk?'Тип записів':'Filter by type'}
    <select id="as-journal-filter" value={filter} onChange={e=>setFilter(e.target.value as Kind|'ALL')}>
     <option value="ALL">{uk?'Усі записи':'All entries'}</option>
     {(['TAROT','JYOTISH','PRACTICE','REFLECTION'] as Kind[]).map(v=><option value={v} key={v}>{v}</option>)}
    </select></label>
   <label htmlFor="as-journal-search">{uk?'Пошук':'Search'}
    <input id="as-journal-search" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={uk?'Назва або текст':'Title or text'}/></label>
   <button className="as-button as-button-secondary" type="button" onClick={()=>void exportPrivate()} disabled={busy}>
    {uk?'Експорт JSON':'Export JSON'}</button>
  </div>}
  {note&&<p role="status">{note}</p>}
  {error&&<div className="as-journal-error" role="alert"><p className="as-account-error">{error}</p><button type="button" className="as-button as-button-secondary" onClick={()=>void load()} disabled={loading}><RefreshCcw size={16}/>{uk?'Повторити':'Retry'}</button></div>}
  <div className="as-profile as-journal-entries">
   {shown.map(entry=><article className="as-draft-row" key={entry.id}>
    <div><small>{new Date(entry.createdAt).toLocaleDateString(uk?'uk-UA':'en-US')} · {entry.kind}</small>
     {editing===entry.id?<form onSubmit={e=>void updateEntry(e,entry.id)} className="account-form">
      <label>{uk?'Назва':'Title'}<input required maxLength={120} value={editTitle} onChange={e=>setEditTitle(e.target.value)}/></label>
      <label>{uk?'Запис':'Note'}<textarea required maxLength={2000} value={editBody} onChange={e=>setEditBody(e.target.value)}/></label>
      <button className="as-button as-button-primary" disabled={busy||!editTitle.trim()||!editBody.trim()} type="submit">{uk?'Зберегти зміни':'Save changes'}</button>
      <button className="as-button as-button-secondary" type="button" onClick={()=>setEditing(null)}>{uk?'Скасувати':'Cancel'}</button>
     </form>:<><strong>{entry.title}</strong><p>{entry.body}</p>
      <button className="as-button as-button-secondary" type="button" disabled={busy} onClick={()=>{setEditing(entry.id);setEditTitle(entry.title);setEditBody(entry.body);}}>{uk?'Редагувати':'Edit'}</button></>}</div>
    <button type="button" disabled={busy} onClick={()=>void remove(entry.id)} aria-label={uk?'Видалити запис':'Delete note'}><Trash2 size={18}/></button>
   </article>)}
   {signedIn&&!shown.length&&<p className="as-muted">{uk?'Поки немає записів.':'No notes yet.'}</p>}
  </div>
 </section>;
}
