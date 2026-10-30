'use client';
import {useEffect,useRef,useState} from 'react';
import Script from 'next/script';
import Link from 'next/link';
import {LogIn,LogOut,UserRound,Eye,EyeOff,Shield} from 'lucide-react';
import {readApiJson} from '../../lib/api-response';
import {portalPath,type PortalLocale} from '../../lib/brand';

type User={id:string;email:string;role:'MEMBER'|'EXPERT'|'SUPPORT'|'ADMIN';subscription?:{tier:'FREE'|'PREMIUM';currentPeriodEnd:string|null}};
const siteKey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||'';
type TurnstileApi={render:(element:HTMLElement,options:{sitekey:string;action:string;callback:(token:string)=>void;'expired-callback':()=>void;'error-callback':()=>void})=>string;remove:(id:string)=>void};
export default function GlobalAccount({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [user,setUser]=useState<User|null>(null),[loaded,setLoaded]=useState(false),[open,setOpen]=useState(false);
 const [mode,setMode]=useState<'login'|'register'|'verify'>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[code,setCode]=useState('');
 const [challengeReady,setChallengeReady]=useState(0),[turnstileToken,setTurnstileToken]=useState('');
 const challengeRef=useRef<HTMLDivElement|null>(null);
 const [visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [expertUnread,setExpertUnread]=useState(0);
 useEffect(()=>{
  let alive=true;
  fetch('/api/v1/account/me',{credentials:'same-origin',cache:'no-store'})
   .then(r=>readApiJson<{user:User|null}>(r))
   .then(r=>{if(alive)setUser(r.user)})
   .catch(()=>{if(alive)setError(uk?'Сесію не вдалося перевірити.':'Could not check session.')})
   .finally(()=>{if(alive)setLoaded(true)});
  return()=>{alive=false};
 },[uk]);
 useEffect(()=>{
  if(user?.role!=='ADMIN'){setExpertUnread(0);return;}
  let active=true;
  const refresh=async()=>{
   try{
    const response=await fetch('/api/v1/admin/expert-requests',{credentials:'same-origin',cache:'no-store'});
    if(!response.ok)return;
    const info=await response.json() as {unread:number};
    if(active&&Number.isInteger(info.unread))setExpertUnread(info.unread);
   }catch{}
  };
  void refresh();
  const interval=setInterval(()=>void refresh(),45000);
  return()=>{active=false;clearInterval(interval)};
 },[user?.role]);
 useEffect(()=>{
  if(!open||mode!=='register'||!siteKey||!challengeRef.current||!challengeReady)return;
  const api=(window as Window & {turnstile?:TurnstileApi}).turnstile;
  if(!api)return;
  setTurnstileToken('');
  const id=api.render(challengeRef.current,{sitekey:siteKey,action:'register',
   callback:(token)=>setTurnstileToken(token),
   'expired-callback':()=>setTurnstileToken(''),
   'error-callback':()=>setTurnstileToken('')
  });
  return ()=>{api.remove(id);setTurnstileToken('')};
 },[open,mode,challengeReady]);
 async function authenticate(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{
   const endpoint=mode==='verify'?'register/verify':mode;
   const body=mode==='verify'?{email,code}:mode==='register'?{email,password,turnstileToken}:{email,password};
   const response=await fetch('/api/v1/account/'+endpoint,{method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const data=await readApiJson<{user?:User;verificationRequired?:boolean}>(response);
   if(mode==='register'){
    if(!data.verificationRequired)throw new Error(uk?'Не вдалося надіслати код':'Could not send verification code');
    setMode('verify');setPassword('');setCode('');setTurnstileToken('');
    return;
   }
   if(!data.user)throw new Error(uk?'Не вдалося завершити вхід':'Could not complete sign in');
   setUser(data.user);setPassword('');setCode('');setOpen(false);
   window.dispatchEvent(new Event('galaxiora:auth-changed'));
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 async function logout(){
  setBusy(true);setError('');
  try{
   await readApiJson(await fetch('/api/v1/account/logout',{method:'POST',credentials:'same-origin'}));
   setUser(null);setOpen(false);
   window.dispatchEvent(new Event('galaxiora:auth-changed'));
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false)}
 }
 return <div className="as-account">
  {siteKey&&<Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={()=>setChallengeReady(v=>v+1)}/>}
  <button className="as-account-trigger" type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
   <UserRound size={17}/><span>{user?(uk?'Кабінет':'Account'):(uk?'Увійти':'Sign in')}</span>
   {user?.role==='ADMIN'&&expertUnread>0&&<span role="status" aria-label={uk?'Нові запити до таролога':'New Tarot expert requests'} style={{borderRadius:20,padding:'2px 8px',background:'#b65357',color:'#fff',fontWeight:700}}>{expertUnread}</span>}
  </button>
  {open&&<div className="as-account-popover" role="region" aria-label={uk?'Обліковий запис':'Account'}>
   {!loaded?<p>{uk?'Завантаження…':'Loading…'}</p>:user?<div className="as-account-signed">
    <strong>{user.email}</strong>
    <small>{user.role} · {user.subscription?.tier==='PREMIUM'?'Premium':'Free'}</small>
    <Link href={portalPath(locale,'personal')} onClick={()=>setOpen(false)}>{uk?'Galaxiora Personal — Мій Всесвіт':'Galaxiora Personal — My Universe'}</Link>
     <Link href={portalPath(locale,'account')} onClick={()=>setOpen(false)}>{uk?'Акаунт і запитання':'Account & questions'}</Link>
    {user.role==='ADMIN'&&<Link href={portalPath(locale,'admin')} onClick={()=>setOpen(false)}><Shield size={15}/>{uk?'Панель адміністратора':'Admin overview'}{expertUnread>0?' ('+expertUnread+')':''}</Link>}
    <button type="button" onClick={logout} disabled={busy}><LogOut size={15}/>{uk?'Вийти':'Sign out'}</button>
   </div>:<form onSubmit={authenticate} className="as-account-form">
    <h3>{mode==='login'?(uk?'Вхід':'Sign in'):mode==='verify'?(uk?'Підтвердження пошти':'Verify email'):(uk?'Реєстрація':'Create account')}</h3>
    <label htmlFor="global-email">Email</label>
    <input id="global-email" autoComplete="email" type="email" maxLength={150} required
     disabled={mode==='verify'} value={email} onChange={e=>setEmail(e.target.value)}/>
    {mode==='verify'?<>
     <p>{uk?'Ми надіслали шестизначний код на цю адресу. Він дійсний 15 хвилин.':'We emailed a six-digit code to this address. It expires in 15 minutes.'}</p>
     <label htmlFor="global-code">{uk?'Код із листа':'Email code'}</label>
     <input id="global-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}"
      minLength={6} maxLength={6} required value={code} onChange={e=>setCode(e.target.value)}/>
    </>:<>
     <label htmlFor="global-password">{uk?'Пароль (від 12 символів)':'Password (12+ characters)'}</label>
     <div className="as-password"><input id="global-password" type={visible?'text':'password'} minLength={12} maxLength={128} required autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/>
      <button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible?(uk?'Сховати пароль':'Hide password'):(uk?'Показати пароль':'Show password')}>{visible?<EyeOff size={16}/>:<Eye size={16}/>}</button>
     </div>
    </>}
    {mode==='register'&&(siteKey?<div ref={challengeRef} aria-label={uk?'Захист від ботів':'Bot protection'}/>:<p role="status">{uk?'Реєстрація поки закрита: триває налаштування захисту.':'Registration is temporarily closed for security setup.'}</p>)}
    <button className="as-button as-button-primary" type="submit"
     disabled={busy||(mode==='register'&&(!siteKey||!turnstileToken))}><LogIn size={15}/>{mode==='login'?(uk?'Увійти':'Sign in'):mode==='verify'?(uk?'Підтвердити email':'Verify email'):(uk?'Отримати код':'Send verification code')}</button>
    <button type="button" className="as-mode-toggle" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setTurnstileToken('')}}>{mode==='login'?(uk?'Створити акаунт':'Create an account'):(uk?'Повернутися до входу':'Back to sign in')}</button>
   </form>}
   {error&&<p className="as-account-error" role="alert">{error}</p>}
  </div>}
 </div>;
}
