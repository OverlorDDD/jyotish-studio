'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {readApiJson} from '../../lib/api-response';
import {portalPath,type PortalLocale} from '../../lib/brand';

type Me={user:{id:string;email:string;role:string}|null};
export default function AccountDashboard({locale}:{locale:PortalLocale}){
 const uk=locale==='uk', [user,setUser]=useState<Me['user']>(null),[ready,setReady]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  let live=true;
  fetch('/api/v1/account/me',{credentials:'same-origin',cache:'no-store'})
   .then(r=>readApiJson<Me>(r)).then(data=>{if(live)setUser(data.user)})
   .catch(e=>{if(live)setError(e instanceof Error?e.message:String(e))})
   .finally(()=>{if(live)setReady(true)});
  return()=>{live=false};
 },[]);
 return <section className="as-profile">
  <h1>{uk?'Особистий кабінет':'Your account'}</h1>
  {!ready?<p>{uk?'Завантаження…':'Loading…'}</p>:error?<p role="alert">{error}</p>:!user?
  <p>{uk?'Увійди або зареєструйся через кнопку у верхньому меню.':'Sign in or create an account using the top navigation.'}</p>:
  <div className="as-profile-card">
   <p>{uk?'Обліковий запис':'Signed in as'}: <strong>{user.email}</strong></p>
   <p>{uk?'Роль':'Role'}: <strong>{user.role}</strong></p>
   <Link className="as-button as-button-secondary" href={portalPath(locale,'astrology/jyotish')}>{uk?'Збережені натальні карти — відкрити Джйотіш':'Saved birth charts — open Jyotish'}</Link>
   {user.role==='ADMIN'&&<Link className="as-button as-button-primary" href={portalPath(locale,'admin')}>{uk?'Статистика адміністратора':'Administrator dashboard'}</Link>}
   <p className="as-muted">{uk?'Тут згодом з’являться Таро, замовлення та персональні практики.':'Tarot history, reading orders and mindful practices will appear here as those modules launch.'}</p>
  </div>}
 </section>;
}
