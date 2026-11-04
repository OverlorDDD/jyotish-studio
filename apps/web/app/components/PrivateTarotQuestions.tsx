'use client';
import {useEffect,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
type Question={id:string;createdAt:string;topic:string;question:string;context:string;expertSubmittedAt?:string|null};
export default function PrivateTarotQuestions({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [items,setItems]=useState<Question[]>([]);
 const [message,setMessage]=useState('');
 async function refresh(){
  try{
   const response=await fetch('/api/v1/reading-orders/questions',{credentials:'same-origin',cache:'no-store'});
   if(!response.ok){setItems([]);return;}
   setItems(await response.json() as Question[]);setMessage('');
  }catch{setMessage(uk?'Не вдалося завантажити запитання.':'Could not load saved questions.');}
 }
 useEffect(()=>{
  void refresh();
  const event=()=>void refresh();
  window.addEventListener('galaxiora:auth-changed',event);
  return()=>window.removeEventListener('galaxiora:auth-changed',event);
 },[locale]);
 async function remove(id:string){
  try{
   const response=await fetch('/api/v1/reading-orders/questions/'+encodeURIComponent(id),{method:'DELETE',credentials:'same-origin'});
   if(!response.ok)throw Error(String(response.status));
   setItems(list=>list.filter(q=>q.id!==id));setMessage('');
  }catch{setMessage(uk?'Не вдалося видалити запитання.':'Could not delete the question.');}
 }
 return <section className="as-expert-drafts" aria-label={uk?'Мої збережені запитання':'My saved questions'}>
  <h3>{uk?'Мої збережені запитання':'My saved Tarot questions'}</h3>
  <p className="as-muted">{uk?'Лише спеціально надіслані звернення доступні адміністратору. Старі приватні запитання бачиш тільки ти.':'Only questions explicitly sent to the administrator are shared. Earlier private questions remain yours.'}</p>
  <button type="button" className="as-button as-button-secondary" onClick={()=>void refresh()}>{uk?'Оновити список':'Refresh list'}</button>
  {message&&<p role="alert">{message}</p>}
  {items.map(q=><article className="as-expert-draft-card" key={q.id}>
   <small>{q.topic} · {new Date(q.createdAt).toLocaleDateString(uk?'uk-UA':'en-GB')}</small>
   <h4>{q.question}</h4>{q.context&&<p>{q.context}</p>}
   <small>{q.expertSubmittedAt?(uk?'Надіслано адміністратору':'Shared with administrator'):(uk?'Лише для тебе':'Private')}</small>
   <button type="button" className="as-button as-button-secondary" onClick={()=>void remove(q.id)}>
    {uk?'Видалити запитання':'Delete question'}
   </button>
  </article>)}
 </section>;
}
