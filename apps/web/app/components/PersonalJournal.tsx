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
 const shown=sourceId?entries.filter(x=>x.kind===kind&&x.sourceId===sourceId):entries;
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
   </form>}
  {note&&<p role="status">{note}</p>}
  {error&&<div className="as-journal-error" role="alert"><p className="as-account-error">{error}</p><button type="button" className="as-button as-button-secondary" onClick={()=>void load()} disabled={loading}><RefreshCcw size={16}/>{uk?'Повторити':'Retry'}</button></div>}
  <div className="as-profile as-journal-entries">
   {shown.map(entry=><article className="as-draft-row" key={entry.id}>
    <div><small>{new Date(entry.createdAt).toLocaleDateString(uk?'uk-UA':'en-US')} · {entry.kind}</small>
     <strong>{entry.title}</strong><p>{entry.body}</p></div>
    <button type="button" disabled={busy} onClick={()=>void remove(entry.id)} aria-label={uk?'Видалити запис':'Delete note'}><Trash2 size={18}/></button>
   </article>)}
   {signedIn&&!shown.length&&<p className="as-muted">{uk?'Поки немає записів.':'No notes yet.'}</p>}
  </div>
 </section>;
}
