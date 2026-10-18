'use client';
import {useEffect,useState} from 'react';
import {readApiJson} from '../../lib/api-response';
import type {PortalLocale} from '../../lib/brand';
type Offer={id:string;titleUk:string;titleEn:string;descriptionUk:string;descriptionEn:string;priceMinor:number;currency:string;deliveryDays:number};
type Expert={id:string;displayName:string;bioUk:string;bioEn:string;offers:Offer[]};
export default function ExpertCatalog({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [items,setItems]=useState<Expert[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  fetch('/api/v1/experts',{cache:'no-store'}).then(r=>readApiJson<{profiles:Expert[]}>(r))
   .then(data=>{if(active)setItems(data.profiles)})
   .catch(e=>{if(active)setError(e instanceof Error?e.message:String(e))})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[]);
 return <section className="as-expert-catalog" aria-label={uk?'Каталог експерток':'Expert catalog'}>
  <h3>{uk?'Наші експерти та відеопослуги':'Our readers and video services'}</h3>
  {loading?<p>{uk?'Завантажуємо каталог…':'Loading catalog…'}</p>:error?<p role="alert">{error}</p>:
   items.length===0?<p className="as-muted">{uk?'Зараз ми відбираємо й перевіряємо реальних експерток. Поки немає опублікованих профілів, ти можеш зберегти приватне питання, але послуга не замовляється.':'We are onboarding verified real practitioners. No profiles are published yet; you can save a private question, but cannot place an order.'}</p>:
   <div className="as-expert-profiles">{items.map(expert=><article className="as-expert-profile" key={expert.id}>
    <h4>{expert.displayName}</h4><p>{uk?expert.bioUk:expert.bioEn}</p>
    {expert.offers.length?expert.offers.map(offer=><div className="as-expert-service" key={offer.id}>
     <strong>{uk?offer.titleUk:offer.titleEn}</strong>
     <p>{uk?offer.descriptionUk:offer.descriptionEn}</p>
     <span>{new Intl.NumberFormat(uk?'uk-UA':'en-US',{style:'currency',currency:offer.currency}).format(offer.priceMinor/100)} · {offer.deliveryDays} {uk?'днів':'days'}</span>
     <small>{uk?'Замовлення та оплату ще не відкрито.':'Booking and payment are not open yet.'}</small>
    </div>):<p className="as-muted">{uk?'Опублікованих послуг ще немає.':'No active services yet.'}</p>}
   </article>)}</div>}
 </section>;
}
