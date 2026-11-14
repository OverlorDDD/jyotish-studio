'use client';
import {useEffect,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
type Request={id:string;createdAt:string;expertSubmittedAt:string;expertReviewedAt:string|null;
 topic:string;question:string;context:string;timeframe:string|null;user:{email:string}};
type Inbox={unread:number;total:number;items:Request[]};
type Pay={price:string;card:string;binance:string;reader:string};
const PAY_KEY='gx-reader-payment-details';
const TOPIC_UK:Record<string,string>={relationships:'Стосунки',career:'Робота й гроші',growth:'Самопізнання',decision:'Вибір і рішення',other:'Інше'};
/** Manual payment: details live only in this admin browser (localStorage), never on the server.
 * The reader sends an offer by email; the payment is checked by hand before answering. */
/** Personal reply: first the free hint (the reader writes it in the mail client), then the offer
 * with price and payment details. Payment details exist only in this admin's browser. */
function offerMail(q:Request,p:Pay){
 const subject='Galaxiora: відповідь тарологині на ваше питання';
 const body=['Вітаю!','','Дякую за ваше питання на Galaxiora:','«'+q.question+'»','',
  'Ось що я бачу вже зараз:','[Коротка безкоштовна підказка: 2–3 речення про головне в ситуації]','',
  'Якщо захочете піти глибше, я зроблю для вас повний живий розклад Таро саме на цю ситуацію: надішлю фото розкладу й докладну письмову відповідь — що відбувається, куди веде і що варто зробити.',
  'Вартість: '+(p.price||'$30')+'.','','Оплатити можна так:',
  p.card?'• переказом на картку ПриватБанку: '+p.card:'',p.binance?'• USDT через Binance Pay, Pay ID: '+p.binance:'',
  '','Після оплати надішліть, будь ласка, у відповідь на цей лист скриншот платежу. Розклад надійде протягом доби. Якщо я не встигну, поверну гроші.',
  'Якщо поки не хочете — просто нічого не робіть, підказка вище ваша безкоштовно.','',(p.reader||'Тарологиня Galaxiora')].filter((x,i,a)=>x!==''||a[i-1]!=='').join('\n');
 return 'mailto:'+encodeURIComponent(q.user.email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}
export default function AdminExpertRequests({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [data,setData]=useState<Inbox|null>(null);
 const [error,setError]=useState(''),[busy,setBusy]=useState<string|null>(null);
 const [pay,setPay]=useState<Pay>({price:'$30',card:'',binance:'',reader:''});
 useEffect(()=>{try{const raw=window.localStorage.getItem(PAY_KEY);if(raw)setPay(p=>({...p,...JSON.parse(raw) as Pay}));}catch{/* ignore */}},[]);
 function savePay(next:Pay){setPay(next);try{window.localStorage.setItem(PAY_KEY,JSON.stringify(next));}catch{/* ignore */}}
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
  <details style={{margin:'12px 0',padding:'12px 16px',border:'1px solid #45506a',borderRadius:12,background:'#121f32'}}>
   <summary style={{cursor:'pointer',fontWeight:700}}>{uk?'Реквізити для оплати (зберігаються лише в цьому браузері)':'Payment details (stored only in this browser)'}</summary>
   <div style={{display:'grid',gap:8,marginTop:10,maxWidth:560}}>
    {([['price',uk?'Ціна':'Price'],['card',uk?'Номер картки ПриватБанку (для переказу)':'PrivatBank card number (for transfers)'],['binance','Binance Pay ID'],['reader',uk?'Підпис (ім’я таролога)':'Signature (reader name)']] as const).map(([k,label])=>
     <label key={k} style={{display:'grid',gap:4,fontSize:13}}>{label}
      <input value={pay[k]} onChange={e=>savePay({...pay,[k]:e.target.value})} style={{padding:'8px 10px',borderRadius:8,border:'1px solid #435470',background:'#1b283b',color:'#f3f5fa'}}/></label>)}
    <p className="as-muted" style={{margin:0,fontSize:12}}>{uk?'Кнопка «Відповісти клієнту» відкриє лист: спершу впишіть коротку безкоштовну підказку, нижче вже стоїть пропозиція з ціною й цими реквізитами. Реквізити не потрапляють на сайт, у базу чи GitHub. Оплату перевіряйте вручну, перш ніж робити розклад.':'“Reply” opens an email: write a short free hint first; the offer with price and these details is already below. The details never reach the site, the database or GitHub. Check the payment manually before reading.'}</p>
   </div>
  </details>
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
     <p style={{margin:'0 0 10px'}}><a className="as-button as-button-secondary" href={offerMail(q,pay)}>{uk?'Відповісти клієнту: підказка + пропозиція':'Reply: free hint + offer'}</a>
      {' '}<span className="as-muted" style={{fontSize:12}}>{TOPIC_UK[q.topic]??q.topic}</span></p>
     {q.expertReviewedAt?<span>{uk?'Переглянуто':'Reviewed'}</span>:
      <button className="as-button as-button-secondary" type="button" disabled={busy===q.id} onClick={()=>void markReviewed(q.id)}>
       {uk?'Позначити як переглянуте':'Mark reviewed'}
      </button>}
    </article>)}
  </div>}
 </section>;
}
