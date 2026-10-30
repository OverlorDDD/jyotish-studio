'use client';
import {useEffect,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
type Request={id:string;createdAt:string;expertSubmittedAt:string;expertReviewedAt:string|null;
 topic:string;question:string;context:string;timeframe:string|null;user:{email:string}};
type Inbox={unread:number;total:number;items:Request[]};
export default function AdminExpertRequests({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [data,setData]=useState<Inbox|null>(null);
 const [error,setError]=useState(''),[busy,setBusy]=useState<string|null>(null);
 useEffect(()=>{
  let mounted=true;
  async function load(){
   try{
    const response=await fetch('/api/v1/admin/expert-requests',{credentials:'same-origin',cache:'no-store'});
    if(!response.ok)throw Error('HTTP '+response.status);
    const info=await response.json() as Inbox;
    if(mounted){setData(info);setError('');}
   }catch(e){if(mounted)setError(e instanceof Error?e.message:String(e));}
  }
  void load();
  const interval=setInterval(()=>void load(),45000);
  return()=>{mounted=false;clearInterval(interval)};
 },[]);
 async function markReviewed(id:string){
  if(busy)return;
  setBusy(id);setError('');
  try{
   const response=await fetch('/api/v1/admin/expert-requests/'+encodeURIComponent(id)+'/review',{
    method:'PATCH',credentials:'same-origin'
   });
   if(!response.ok)throw Error('HTTP '+response.status);
   setData(old=>old?{...old,unread:Math.max(0,old.unread-1),
    items:old.items.map(item=>item.id===id?{...item,expertReviewedAt:new Date().toISOString()}:item)}:old);
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setBusy(null)}
 }
 return <section aria-label={uk?'Звернення до експертів':'Expert inquiries'} id="expert-requests" style={{marginTop:28}}>
  <h2>{uk?'Нові звернення до таролога':'New Tarot expert inquiries'}</h2>
  <p className="as-muted">{uk?'Адміністратор бачить лише питання, які користувач погодився передати експерту. Оновлення кожні 45 секунд.':'Only questions explicitly shared for expert review are visible here. Refreshes every 45 seconds.'}</p>
  {data&&<p role="status" style={{fontWeight:700,color:'#efd39d'}}>
   {uk?'Не переглянуто: ':'Unreviewed: '}{data.unread} · {uk?'Усього: ':'Total: '}{data.total}
  </p>}
  {error&&<p role="alert">{uk?'Не вдалося оновити звернення: ':'Could not load inquiries: '}{error}</p>}
  {!data&&!error&&<p>{uk?'Завантаження…':'Loading…'}</p>}
  {data&&<div style={{display:'grid',gap:12}}>
   {data.items.length===0?<p className="as-muted">{uk?'Поки немає запитів до експертів.':'No expert requests yet.'}</p>:
    data.items.map(q=><article key={q.id} style={{border:'1px solid #45506a',borderRadius:12,padding:18,background:'#121f32',minWidth:0,overflowWrap:'anywhere'}}>
     <p style={{margin:0,color:'#c6d3eb',fontSize:12}}>
      {new Date(q.expertSubmittedAt).toLocaleString(uk?'uk-UA':'en-GB')} · {q.topic} · {q.user.email}
     </p>
     <h3 style={{fontSize:17,margin:'12px 0'}}>{q.question}</h3>
     <p style={{whiteSpace:'pre-wrap',lineHeight:1.6}}>{q.context}</p>
     {q.timeframe&&<p>{uk?'Період: ':'Timeframe: '}{q.timeframe}</p>}
     {q.expertReviewedAt?<span>{uk?'Переглянуто':'Reviewed'}</span>:
      <button className="as-button as-button-secondary" type="button" disabled={busy===q.id} onClick={()=>void markReviewed(q.id)}>
       {uk?'Позначити як переглянуте':'Mark reviewed'}
      </button>}
    </article>)}
  </div>}
 </section>;
}
