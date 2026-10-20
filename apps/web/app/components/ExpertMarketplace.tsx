'use client';
import {useEffect,useState} from 'react';
import {ShieldCheck,BookOpen,CheckCircle2,RefreshCcw,UserRound,LockKeyhole} from 'lucide-react';
import Link from 'next/link';
type L='uk'|'en';
type PublicProfile={id:string;displayName:string;bioUk:string;bioEn:string;specialties:string[]};
type ReviewProfile=PublicProfile&{userId:string;reviewStatus:string;revision:number;updatedAt:string;user:{email:string;role:string}};
type MyProfile={reviewStatus:string;revision:number;displayName:string;bioUk:string;bioEn:string;specialties:string[]};
const topics=['jyotish','tarot','yoga','meditation'] as const;
const names:{[key:string]:{uk:string;en:string}}={jyotish:{uk:'Джйотіш',en:'Jyotish'},tarot:{uk:'Таро',en:'Tarot'},yoga:{uk:'Йога',en:'Yoga'},meditation:{uk:'Медитація',en:'Meditation'}};
export default function ExpertMarketplace({locale}:{locale:L}){
 const uk=locale==='uk';
 const [profiles,setProfiles]=useState<PublicProfile[]>([]);
 const [role,setRole]=useState('MEMBER');
 const [mine,setMine]=useState<MyProfile|null>(null);
 const [queue,setQueue]=useState<ReviewProfile[]>([]);
 const [name,setName]=useState(''),[bioUk,setBioUk]=useState(''),[bioEn,setBioEn]=useState('');
 const [selected,setSelected]=useState<string[]>(['jyotish']);
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function json(url:string,options?:RequestInit){
  const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
  const data=await r.json().catch(()=>({message:'Request failed'}));
  if(!r.ok)throw Error(typeof data.message==='string'?data.message:'HTTP '+r.status);
  return data;
 }
 async function load(){
  const list=await json('/api/v1/experts');
  setProfiles(list.profiles||[]);
  try{
   const me=await json('/api/v1/account/me');const r=me.user?.role||'MEMBER';setRole(r);
   if(me.user&&r==='EXPERT')setMine(await json('/api/v1/experts/me'));
   if(me.user&&r==='ADMIN')setQueue(await json('/api/v1/experts/admin/applications'));
  }catch{/* Anonymous catalog still works */}
 }
 useEffect(()=>{load().catch(e=>setError(e instanceof Error?e.message:String(e)));},[]);
 async function mutate(path:string,payload:unknown){
  setBusy(true);setError('');setMessage('');
  try{
   await json('/api/v1/experts/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   setMessage(uk?'Дані оновлено.':'Updated successfully.');
   await load();
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 }
 return <main className="as-experts-page">
  <header><span className="as-overline">GALAXIORA · HUMAN EXPERTS</span>
   <h1>{uk?'Експерти Galaxiora':'Galaxiora practitioners'}</h1>
   <p>{uk?'Тут з’являються лише спеціалісти, чий профіль перевірив адміністратор. Платні консультації та передавання приватних запитань ще не запущені.':'Only administrator-reviewed profiles appear here. Paid bookings and private brief transfers are not enabled.'}</p>
  </header>
  {error?<p role="alert" className="as-editorial-error">{error}</p>:null}
  {message?<p role="status" className="as-editorial-success"><CheckCircle2 size={17}/>{message}</p>:null}
  <section aria-label={uk?'Каталог фахівців':'Practitioner directory'} className="as-experts-list">
   {profiles.length===0?<div className="as-expert-empty"><ShieldCheck size={32}/><h2>{uk?'Профілі проходять перевірку':'Profiles are being reviewed'}</h2>
    <p>{uk?'Ми не показуємо непідтверджені профілі та не імітуємо запис на консультацію.':'Unverified profiles are not displayed and bookings are not simulated.'}</p></div>:
   <div className="as-experts-grid">{profiles.map(p=><article className="as-expert-card" key={p.id}>
    <UserRound size={28}/><h2>{p.displayName}</h2><p>{uk?p.bioUk:p.bioEn}</p>
    <div className="as-expert-tags">{p.specialties.map(t=><span key={t}>{names[t]?.[locale]||t}</span>)}</div>
    <small><ShieldCheck size={14}/>{uk?'Профіль перевірений редакцією Galaxiora':'Profile reviewed by Galaxiora'}</small></article>)}</div>}
   <p className="as-muted"><LockKeyhole size={15}/> {uk?'Запис та оплата залишаються вимкненими до підключення перевіреного платіжного процесу.':'Bookings and payments remain disabled pending a verified payment flow.'}</p>
  </section>
  {role==='EXPERT'?<section className="as-expert-application">
   <span className="as-overline">{uk?'ДЛЯ ЕКСПЕРТІВ':'FOR PRACTITIONERS'}</span>
   <h2>{uk?'Заявка на профіль':'Apply for a public profile'}</h2>
   {mine?<p>{uk?'Статус перевірки':'Review status'}: <strong data-testid="expert-review-status">{mine.reviewStatus}</strong></p>:null}
   {(!mine||mine.reviewStatus==='REJECTED'||mine.reviewStatus==='SUSPENDED')?<form onSubmit={e=>{e.preventDefault();mutate('apply',{displayName:name,bioUk,bioEn,specialties:selected,consent:true});}}>
    <label>{uk?'Публічне ім’я':'Public display name'}<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>
    <label>{uk?'Опис українською':'Ukrainian bio'}<textarea required minLength={40} maxLength={2400} rows={4} value={bioUk} onChange={e=>setBioUk(e.target.value)}/></label>
    <label>{uk?'Опис англійською':'English bio'}<textarea required minLength={40} maxLength={2400} rows={4} value={bioEn} onChange={e=>setBioEn(e.target.value)}/></label>
    <fieldset><legend>{uk?'Напрямки консультацій':'Specialties'}</legend>{topics.map(t=><label key={t}><input type="checkbox" checked={selected.includes(t)} onChange={e=>setSelected(xs=>e.target.checked?[...xs,t]:xs.filter(x=>x!==t))}/>{names[t][locale]}</label>)}</fieldset>
    <p className="as-muted">{uk?'Надсилаючи заявку, ви дозволяєте опублікувати тільки опис профілю після перевірки; email не публікується.':'Submitting permits your approved public bio to appear in the directory; email is never public.'}</p>
    <button className="as-button as-button-primary" disabled={busy||selected.length===0} type="submit">{uk?'Надіслати заявку':'Submit application'}</button>
   </form>:<p>{uk?'Заявку вже подано. Під час перевірки профіль не показується публічно.':'Your application is on file; it is not public unless approved.'}</p>}
  </section>:null}
  {role==='ADMIN'?<section className="as-expert-application" aria-label={uk?'Адміністрування заявок':'Review queue'}>
    <span className="as-overline">{uk?'ПЕРЕВІРКА ЕКСПЕРТІВ':'EXPERT REVIEW'}</span>
    <h2>{uk?'Заявки на перевірку':'Review applications'}</h2>
    {queue.length===0?<p>{uk?'Заявок поки немає.':'No applications yet.'}</p>:queue.map(p=><article className="as-expert-review" key={p.id}>
     <h3>{p.displayName} <small>{p.reviewStatus}</small></h3><p>{p.bioUk}</p><p>{p.bioEn}</p>
     <p>{uk?'Напрями: ':'Specialties: '}{p.specialties.join(', ')}</p>
     <small>{uk?'Акаунт: ':'Account: '}{p.user.email} · {p.user.role}</small>
     <div className="as-expert-review-buttons">
      {p.reviewStatus==='SUBMITTED'?<>
       <button className="as-button as-button-primary" disabled={busy||p.user.role!=='EXPERT'} onClick={()=>mutate('admin/applications/'+p.id+'/review',{action:'verify',expectedRevision:p.revision})}>{uk?'Підтвердити профіль':'Verify profile'}</button>
       <button className="as-button as-button-secondary" disabled={busy} onClick={()=>mutate('admin/applications/'+p.id+'/review',{action:'reject',expectedRevision:p.revision})}>{uk?'Відхилити':'Reject'}</button>
      </>:null}
      {p.reviewStatus==='VERIFIED'?<button className="as-button as-button-secondary" disabled={busy} onClick={()=>mutate('admin/applications/'+p.id+'/review',{action:'suspend',expectedRevision:p.revision})}>{uk?'Призупинити публікацію':'Suspend profile'}</button>:null}
     </div>
    </article>)}
  </section>:null}
  <Link href={'/'+locale+'/tarot'} className="as-button as-button-secondary">{uk?'Повернутися до Таро':'Back to Tarot'}</Link>
 </main>;
}
