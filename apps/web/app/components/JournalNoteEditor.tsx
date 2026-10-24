'use client';
import {useEffect,useState} from 'react';
import {readApiJson} from '../../lib/api-response';

type Note={id:string;kind:string;referenceId:string;note:string;updatedAt:string};
export default function JournalNoteEditor({referenceId,kind,locale}:{
 referenceId:string;kind:'TAROT'|'CHART'|'PRACTICE';locale:'uk'|'en'
}){
 const uk=locale==='uk';
 const [text,setText]=useState(''),[initial,setInitial]=useState('');
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{
  let active=true;setText('');setInitial('');setMessage('');setLoading(true);
  fetch('/api/v1/personal/journal',{credentials:'same-origin',cache:'no-store'})
   .then(async r=>readApiJson<Note[]>(r))
   .then(notes=>{if(!active)return;const found=notes.find(n=>n.kind===kind&&n.referenceId===referenceId);
    setText(found?.note||'');setInitial(found?.note||'');})
   .catch(()=>{if(active)setMessage(uk?'Для приватних нотаток увійди в акаунт.':'Sign in to use your private notes.');})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[referenceId,kind,uk]);
 async function save(){
  setBusy(true);setMessage('');
  try{
   const note=text.trim();
   if(!note)throw new Error(uk?'Спочатку напиши нотатку.':'Write a note first.');
   const response=await fetch('/api/v1/personal/journal',{
    method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({kind,referenceId,note})
   });
   const result=await readApiJson<Note>(response);
   setText(result.note);setInitial(result.note);
   setMessage(uk?'Збережено у твоєму приватному журналі.':'Saved to your private journal.');
  }catch(e){setMessage(e instanceof Error?e.message:String(e));}
  finally{setBusy(false)}
 }
 return <section className="as-profile-card" aria-label={uk?'Приватні нотатки':'Private notes'}>
  <h4>{uk?'Мої нотатки до читання':'My reading notes'}</h4>
  <p className="as-muted">{uk?'Твоя власна історія: що відгукнулося, що хочеш перевірити пізніше? Нотатка приватна і не надсилається AI.':'Your own reflection: what resonated, what would you like to revisit later? This note stays private and is never sent to AI.'}</p>
  <textarea aria-label={uk?'Нотатка':'Journal note'} rows={3} maxLength={2000} disabled={loading||busy}
   value={text} onChange={e=>setText(e.target.value)}
   placeholder={uk?'Запиши власне спостереження…':'Write your observation…'}/>
  <button type="button" className="as-button as-button-secondary" onClick={()=>void save()}
   disabled={loading||busy||!text.trim()||text.trim()===initial}>
   {busy?(uk?'Збереження…':'Saving…'):(uk?'Зберегти нотатку':'Save note')}
  </button>
  {message&&<p role="status" className="as-muted">{message}</p>}
 </section>;
}
