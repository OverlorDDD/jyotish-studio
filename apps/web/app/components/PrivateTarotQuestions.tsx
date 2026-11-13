'use client';
import {useEffect,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
type Question={id:string;createdAt:string;topic:string;question:string;context:string;expertSubmittedAt?:string|null;expertReviewedAt?:string|null};
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
  window.addEventListener('galaxiora:expert-question-sent',event);
  return()=>{window.removeEventListener('galaxiora:auth-changed',event);window.removeEventListener('galaxiora:expert-question-sent',event);};
 },[locale]);
 async function remove(id:string){
  try{
   const response=await fetch('/api/v1/reading-orders/questions/'+encodeURIComponent(id),{method:'DELETE',credentials:'same-origin'});
   if(!response.ok)throw Error(String(response.status));
   setItems(list=>list.filter(q=>q.id!==id));setMessage('');
  }catch{setMessage(uk?'Не вдалося видалити запитання.':'Could not delete the question.');}
 }
 if(!items.length&&!message)return null;
 const TOPIC:Record<string,[string,string]>={relationships:['Стосунки','Relationships'],career:['Робота й гроші','Work & money'],
  growth:['Самопізнання','Personal growth'],decision:['Вибір і рішення','A decision'],other:['Інше','Other']};
 return <section className="as-expert-drafts" aria-label={uk?'Мої питання тарологу':'My questions to readers'}>
  <h3>{uk?'Мої питання тарологу':'My questions to readers'}</h3>
  {message&&<p role="alert">{message}</p>}
  {items.map(q=><article className="as-expert-draft-card" key={q.id}>
   <small>{(TOPIC[q.topic]?.[uk?0:1]??q.topic)} · {new Date(q.createdAt).toLocaleDateString(uk?'uk-UA':'en-GB')}</small>
   <h4>{q.question}</h4>{q.context&&<p>{q.context}</p>}
   <small>{q.expertReviewedAt?(uk?'Таролог переглянув — відповідь прийде на вашу пошту':'A reader has seen it — the reply comes by email')
    :q.expertSubmittedAt?(uk?'Надіслано тарологу':'Sent to a reader'):(uk?'Лише для вас':'Private')}</small>
   <button type="button" className="as-button as-button-secondary" onClick={()=>void remove(q.id)}>
    {uk?'Видалити питання':'Delete question'}
   </button>
  </article>)}
 </section>;
}
