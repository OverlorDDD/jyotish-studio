'use client';
import {useState} from 'react';
import {readApiJson} from '../../lib/api-response';
export default function PracticeCompletionButton({slug,locale}:{slug:string;locale:'uk'|'en'}){
 const uk=locale==='uk';
 const [busy,setBusy]=useState(false),[recorded,setRecorded]=useState(false),[status,setStatus]=useState('');
 async function complete(){
  setBusy(true);setStatus('');
  try{
   await readApiJson(await fetch('/api/v1/personal/practices',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({practiceSlug:slug})
   }));
   setRecorded(true);setStatus(uk?'Практику додано до твоєї історії в особистому кабінеті.':'Practice saved to your personal activity history.');
  }catch(e){setStatus(e instanceof Error?e.message:String(e));}
  finally{setBusy(false)}
 }
 return <div className="as-profile-card">
  <h3>{uk?'Моя історія практик':'My practice history'}</h3>
  <p className="as-muted">{uk?'Після виконання, якщо хочеш, підтвердь завершення. Перегляд інструкцій сам по собі не зараховується.':'If you performed the practice, you may mark it completed. Merely viewing the instructions never counts.'}</p>
  <button className="as-button as-button-secondary" type="button" disabled={busy||recorded} onClick={()=>void complete()}>
   {recorded?(uk?'Збережено':'Saved'):(busy?(uk?'Зберігаємо…':'Saving…'):(uk?'Я виконав(-ла) практику':'I completed this practice'))}
  </button>
  {status&&<p role="status" className="as-muted">{status}</p>}
 </div>;
}
