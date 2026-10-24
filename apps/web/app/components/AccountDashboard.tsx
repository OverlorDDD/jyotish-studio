'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Trash2} from 'lucide-react';
import PersonalHistory from './PersonalHistory';
import SavedChartJournal from './SavedChartJournal';
import {readApiJson} from '../../lib/api-response';
import {portalPath,type PortalLocale} from '../../lib/brand';
type User={id:string;email:string;role:string;subscription:{tier:'FREE'|'PREMIUM';currentPeriodEnd:string|null}};
type Draft={id:string;createdAt:string;expiresAt:string;topic:string;question:string;context:string;timeframe:string|null};
export default function AccountDashboard({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [user,setUser]=useState<User|null>(null),[drafts,setDrafts]=useState<Draft[]>([]);
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){
  const me=await readApiJson<{user:User|null}>(await fetch('/api/v1/account/me',{credentials:'same-origin',cache:'no-store'}));
  setUser(me.user);
  if(me.user){
   const d=await readApiJson<Draft[]>(await fetch('/api/v1/reading-orders/drafts',{credentials:'same-origin',cache:'no-store'}));
   setDrafts(d);
  }else setDrafts([]);
 }
 useEffect(()=>{let alive=true;
  (async()=>{try{await load()}catch(e){if(alive)setError(e instanceof Error?e.message:String(e))}finally{if(alive)setReady(true)}})();
  return()=>{alive=false};
 },[]);
 async function removeDraft(id:string){
  if(!confirm(uk?'Видалити цю приватну чернетку?':'Delete this private draft?'))return;
  setBusy(true);setError('');
  try{
   await readApiJson(await fetch('/api/v1/reading-orders/drafts/'+encodeURIComponent(id),{method:'DELETE',credentials:'same-origin'}));
   await load();
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 return <section className="as-profile">
  <h1>{uk?'Особистий кабінет':'Your account'}</h1>
  {!ready?<p>{uk?'Завантаження…':'Loading…'}</p>:error&&!user?<p role="alert">{error}</p>:!user?
   <p>{uk?'Увійди або зареєструйся через кнопку у верхньому меню.':'Sign in or create an account using the top navigation.'}</p>:
   <div className="as-profile-card">
    <p>{uk?'Обліковий запис':'Signed in as'}: <strong>{user.email}</strong></p>
    <p>{uk?'Роль доступу':'Access role'}: <strong>{user.role==='MEMBER'?(uk?'Звичайний користувач':'Member'):user.role}</strong></p>
    <p>{uk?'Підписка':'Subscription'}: <strong>{user.subscription?.tier==='PREMIUM'?'Premium':(uk?'Безкоштовна (Free)':'Free')}</strong></p>
    {user.subscription?.tier==='PREMIUM'&&user.subscription.currentPeriodEnd&&<p>{uk?'Активна до':'Active until'}: {new Date(user.subscription.currentPeriodEnd).toLocaleDateString(uk?'uk-UA':'en-US')}</p>}
    <p className="as-muted">{uk?'Підписка не змінює права адміністратора або експерта. Оплата підписки ще не підключена.':'Subscription is separate from staff roles. Subscription checkout has not launched yet.'}</p>
    <Link className="as-button as-button-secondary" href={portalPath(locale,'astrology/jyotish')}>{uk?'Мої натальні карти — відкрити Джйотіш':'Saved birth charts — open Jyotish'}</Link>
    {user.role==='ADMIN'&&<Link className="as-button as-button-primary" href={portalPath(locale,'admin')}>{uk?'Панель адміністратора':'Administrator dashboard'}</Link>}
    <h2>{uk?'Приватні чернетки Таро':'Your private tarot drafts'} · {drafts.length}</h2>
    {drafts.length?drafts.map(d=><article className="as-draft-row" key={d.id}>
     <div><small>{d.topic} · {new Date(d.createdAt).toLocaleDateString(uk?'uk-UA':'en-US')}</small>
      <p>{d.question}</p><p className="as-muted">{uk?'Очікує підключення оплати. Експертка не має доступу.':'Awaiting checkout integration. Not shared with any practitioner.'}</p>
      <small>{uk?'Видалиться після':'Expires'}: {new Date(d.expiresAt).toLocaleDateString(uk?'uk-UA':'en-US')}</small>
     </div>
     <button type="button" disabled={busy} onClick={()=>removeDraft(d.id)} aria-label={uk?'Видалити чернетку':'Delete draft'}><Trash2 size={18}/></button>
    </article>):<p className="as-muted">{uk?'Чернеток поки немає.':'No drafts yet.'}</p>}
    <Link className="as-button as-button-secondary" href={portalPath(locale,'tarot')+'#human-readings'}>{uk?'Створити питання для експертки':'Ask a human reader'}</Link>
    <SavedChartJournal locale={locale}/>
    <PersonalHistory locale={locale}/>
    {error&&<p role="alert" className="as-account-error">{error}</p>}
   </div>}
 </section>;
}
