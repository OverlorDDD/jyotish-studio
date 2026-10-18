'use client';
import {useEffect,useState} from 'react';
import {readApiJson} from '../../lib/api-response';
import type {PortalLocale} from '../../lib/brand';
type Service={id:string;titleUk:string;titleEn:string;priceMinor:number;currency:string;deliveryDays:number;isPublished:boolean};
type Profile={id:string;displayName:string;bioUk:string;bioEn:string;isPublished:boolean;user:{id:string;email:string;role:string};offers:Service[]};
export default function ExpertManagement({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [rows,setRows]=useState<Profile[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [email,setEmail]=useState(''),[name,setName]=useState(''),[bioUk,setBioUk]=useState(''),[bioEn,setBioEn]=useState('');
 const [forExpert,setForExpert]=useState(''),[titleUk,setTitleUk]=useState(''),[titleEn,setTitleEn]=useState('');
 const [descriptionUk,setDescriptionUk]=useState(''),[descriptionEn,setDescriptionEn]=useState(''),[price,setPrice]=useState('30'),[days,setDays]=useState('5');
 async function refresh(){
  const next=await readApiJson<Profile[]>(await fetch('/api/v1/admin/experts',{cache:'no-store',credentials:'same-origin'}));
  setRows(next);
 }
 useEffect(()=>{let active=true;refresh().catch(e=>{if(active)setError(e instanceof Error?e.message:String(e))}).finally(()=>{if(active)setLoading(false)});return()=>{active=false};},[]);
 async function change(path:string,method:'POST'|'PATCH',data:object){
  setBusy(true);setError('');setNotice('');
  try{
   await readApiJson(await fetch('/api/v1/'+path,{method,credentials:'same-origin',
    headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}));
   await refresh();setNotice(uk?'Зміни збережено.':'Saved successfully.');
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 async function addExpert(e:React.FormEvent){
  e.preventDefault();
  await change('admin/experts','POST',{email,displayName:name,bioUk,bioEn});
 }
 async function addOffer(e:React.FormEvent){
  e.preventDefault();
  const amount=Math.round(Number(price)*100),deliveryDays=Number(days);
  if(!Number.isSafeInteger(amount)||amount<100||!Number.isInteger(deliveryDays)||deliveryDays<1){setError(uk?'Некоректна ціна або строк.':'Invalid price or delivery time.');return;}
  await change('admin/experts/'+encodeURIComponent(forExpert)+'/offers','POST',{
   titleUk,titleEn,descriptionUk,descriptionEn,priceMinor:amount,deliveryDays
  });
 }
 return <section className="as-expert-management">
  <h2>{uk?'Експертки та послуги (адміністрування)':'Practitioners & services (admin)'}</h2>
  <p className="as-muted">{uk?'Спочатку через таблицю користувачів надай реальній людині роль EXPERT. Далі створи її профіль. Усі профілі та послуги спочатку приховані; публікація здійснюється вручну. Платежі вимкнені.':'First grant EXPERT to a real account using role management. Create the profile here. Profiles and offers start hidden and require manual publication. Payments are disabled.'}</p>
  {error&&<p role="alert" className="as-account-error">{error}</p>}
  {notice&&<p role="status">{notice}</p>}
  <h3>{uk?'Додати експертку':'Add a real reader'}</h3>
  <form className="as-expert-admin-form" onSubmit={addExpert}>
   <label>Email <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
   <label>{uk?'Публічне ім’я':'Public name'} <input minLength={2} maxLength={90} required value={name} onChange={e=>setName(e.target.value)}/></label>
   <label>{uk?'Опис українською':'Ukrainian bio'} <textarea minLength={25} maxLength={3000} rows={3} required value={bioUk} onChange={e=>setBioUk(e.target.value)}/></label>
   <label>{uk?'Опис англійською':'English bio'} <textarea minLength={25} maxLength={3000} rows={3} required value={bioEn} onChange={e=>setBioEn(e.target.value)}/></label>
   <button type="submit" disabled={busy}>{uk?'Створити прихований профіль':'Create unpublished profile'}</button>
  </form>
  <h3>{uk?'Існуючі профілі':'Existing profiles'}</h3>
  {loading?<p>{uk?'Завантаження…':'Loading…'}</p>:rows.length===0?<p className="as-muted">{uk?'Профілів ще немає.':'No profiles yet.'}</p>:
  <div className="as-expert-admin-list">{rows.map(row=><article key={row.id}>
   <strong>{row.displayName}</strong><p>{row.user.email} · {row.user.role}</p>
   <label><input type="checkbox" checked={row.isPublished} disabled={busy||row.user.role!=='EXPERT'}
    onChange={e=>change('admin/experts/'+row.id+'/visibility','PATCH',{isPublished:e.target.checked})}/>
    {uk?'Опублікувати профіль':'Publish profile'}</label>
   <div>{row.offers.map(o=><div key={o.id} className="as-expert-admin-offer">
    <span>{o.titleUk} · {(o.priceMinor/100).toFixed(2)} {o.currency}</span>
    <label><input type="checkbox" checked={o.isPublished} disabled={busy||row.user.role!=='EXPERT'}
     onChange={e=>change('admin/offers/'+o.id+'/visibility','PATCH',{isPublished:e.target.checked})}/>
     {uk?'Опублікувати послугу':'Publish service'}</label>
   </div>)}</div>
  </article>)}</div>}
  <h3>{uk?'Додати відеопослугу':'Add a video service'}</h3>
  <form className="as-expert-admin-form" onSubmit={addOffer}>
   <label>{uk?'Експертка':'Reader'}<select value={forExpert} required onChange={e=>setForExpert(e.target.value)}>
    <option value="">{uk?'Обери експертку':'Choose a reader'}</option>
    {rows.filter(r=>r.user.role==='EXPERT').map(row=><option key={row.id} value={row.id}>{row.displayName}</option>)}
   </select></label>
   <label>{uk?'Назва послуги UA':'Service title UA'}<input minLength={4} maxLength={130} required value={titleUk} onChange={e=>setTitleUk(e.target.value)}/></label>
   <label>{uk?'Назва послуги EN':'Service title EN'}<input minLength={4} maxLength={130} required value={titleEn} onChange={e=>setTitleEn(e.target.value)}/></label>
   <label>{uk?'Опис UA':'Description UA'}<textarea minLength={30} maxLength={3000} rows={3} required value={descriptionUk} onChange={e=>setDescriptionUk(e.target.value)}/></label>
   <label>{uk?'Опис EN':'Description EN'}<textarea minLength={30} maxLength={3000} rows={3} required value={descriptionEn} onChange={e=>setDescriptionEn(e.target.value)}/></label>
   <label>{uk?'Ціна в USD':'Price (USD)'}<input type="number" step="0.01" min="1" max="100000" required value={price} onChange={e=>setPrice(e.target.value)}/></label>
   <label>{uk?'Строк, днів':'Delivery days'}<input type="number" min="1" max="90" required value={days} onChange={e=>setDays(e.target.value)}/></label>
   <button type="submit" disabled={busy||!forExpert}>{uk?'Створити приховану послугу':'Create unpublished service'}</button>
  </form>
 </section>;
}
