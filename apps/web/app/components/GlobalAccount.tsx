'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {LogIn,LogOut,UserRound,Eye,EyeOff,Shield} from 'lucide-react';
import {readApiJson} from '../../lib/api-response';
import {portalPath,type PortalLocale} from '../../lib/brand';

type User={id:string;email:string;role:'MEMBER'|'EXPERT'|'SUPPORT'|'ADMIN'};
export default function GlobalAccount({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [user,setUser]=useState<User|null>(null),[loaded,setLoaded]=useState(false),[open,setOpen]=useState(false);
 const [mode,setMode]=useState<'login'|'register'>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  let alive=true;
  fetch('/api/v1/account/me',{credentials:'same-origin',cache:'no-store'})
   .then(r=>readApiJson<{user:User|null}>(r))
   .then(r=>{if(alive)setUser(r.user)})
   .catch(()=>{if(alive)setError(uk?'Сесію не вдалося перевірити.':'Could not check session.')})
   .finally(()=>{if(alive)setLoaded(true)});
  return()=>{alive=false};
 },[uk]);
 async function authenticate(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{
   const response=await fetch('/api/v1/account/'+mode,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
   const data=await readApiJson<{user:User}>(response);
   setUser(data.user);setPassword('');setOpen(false);
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 async function logout(){
  setBusy(true);setError('');
  try{
   await readApiJson(await fetch('/api/v1/account/logout',{method:'POST',credentials:'same-origin'}));
   setUser(null);setOpen(false);
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 return <div className="as-account">
  <button className="as-account-trigger" type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
   <UserRound size={17}/><span>{user?(uk?'Кабінет':'Account'):(uk?'Увійти':'Sign in')}</span>
  </button>
  {open&&<div className="as-account-popover" role="region" aria-label={uk?'Обліковий запис':'Account'}>
   {!loaded?<p>{uk?'Завантаження…':'Loading…'}</p>:user?<div className="as-account-signed">
    <strong>{user.email}</strong>
    <small>{user.role}</small>
    <Link href={portalPath(locale,'account')} onClick={()=>setOpen(false)}>{uk?'Мій кабінет':'My account'}</Link>
    {user.role==='ADMIN'&&<Link href={portalPath(locale,'admin')} onClick={()=>setOpen(false)}><Shield size={15}/>{uk?'Панель адміністратора':'Admin overview'}</Link>}
    <button type="button" onClick={logout} disabled={busy}><LogOut size={15}/>{uk?'Вийти':'Sign out'}</button>
   </div>:<form onSubmit={authenticate} className="as-account-form">
    <h3>{mode==='login'?(uk?'Вхід':'Sign in'):(uk?'Реєстрація':'Create account')}</h3>
    <label htmlFor="global-email">Email</label><input id="global-email" autoComplete="email" type="email" maxLength={150} required value={email} onChange={e=>setEmail(e.target.value)}/>
    <label htmlFor="global-password">{uk?'Пароль (від 12 символів)':'Password (12+ characters)'}</label>
    <div className="as-password"><input id="global-password" type={visible?'text':'password'} minLength={12} maxLength={128} required autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/>
     <button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible?(uk?'Сховати пароль':'Hide password'):(uk?'Показати пароль':'Show password')}>{visible?<EyeOff size={16}/>:<Eye size={16}/>}</button>
    </div>
    <button className="as-button as-button-primary" type="submit" disabled={busy}><LogIn size={15}/>{mode==='login'?(uk?'Увійти':'Sign in'):(uk?'Зареєструватися':'Register')}</button>
    <button type="button" className="as-mode-toggle" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?(uk?'Створити акаунт':'Create an account'):(uk?'У мене є акаунт':'Already have an account')}</button>
   </form>}
   {error&&<p className="as-account-error" role="alert">{error}</p>}
  </div>}
 </div>;
}
