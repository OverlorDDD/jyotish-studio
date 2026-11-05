'use client';
import {useEffect,useRef,useState} from 'react';
import Script from 'next/script';
import {createPortal} from 'react-dom';
import Link from 'next/link';
import {LogIn,LogOut,UserRound,Eye,EyeOff,Shield,X} from 'lucide-react';
import {readApiJson} from '../../lib/api-response';
import {portalPath,type PortalLocale} from '../../lib/brand';

type User={id:string;email:string;role:'MEMBER'|'EXPERT'|'SUPPORT'|'ADMIN';subscription?:{tier:'FREE'|'PREMIUM';currentPeriodEnd:string|null}};
type SocialSettings={google:boolean;apple:boolean;linked:string[]};
const siteKey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||'';
type TurnstileApi={render:(element:HTMLElement,options:{sitekey:string;action:string;callback:(token:string)=>void;'expired-callback':()=>void;'error-callback':()=>void})=>string;remove:(id:string)=>void;reset:(id:string)=>void};
export default function GlobalAccount({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [user,setUser]=useState<User|null>(null),[loaded,setLoaded]=useState(false),[open,setOpen]=useState(false);
 const [mode,setMode]=useState<'login'|'register'|'verify'>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[code,setCode]=useState('');
 const [challengeReady,setChallengeReady]=useState(0),[turnstileToken,setTurnstileToken]=useState('');
 const challengeRef=useRef<HTMLDivElement|null>(null);
 const triggerRef=useRef<HTMLButtonElement|null>(null);
 const dialogRef=useRef<HTMLDivElement|null>(null);
 const [position,setPosition]=useState({top:90,left:16});
 const widgetIdRef=useRef<string|null>(null);
 const [visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [expertUnread,setExpertUnread]=useState(0);
 const [social,setSocial]=useState<SocialSettings>({google:false,apple:false,linked:[]});
 useEffect(()=>{
  if(!open)return;
  let alive=true;
  fetch('/api/v1/account/oauth/providers',{cache:'no-store',credentials:'same-origin'})
   .then(r=>readApiJson<SocialSettings>(r))
   .then(data=>{if(alive)setSocial(data)})
   .catch(()=>{if(alive)setSocial({google:false,apple:false,linked:[]})});
  return()=>{alive=false};
 },[open,user?.id]);
 useEffect(()=>{
  const code=new URLSearchParams(window.location.search).get('oauth_error');
  if(!code)return;
  const messages:Record<string,[string,string]>={
   existing_email:['Цей email вже зареєстрований. Увійдіть паролем і підключіть провайдера в кабінеті.','This email already has an account. Sign in with its password, then link the provider.'],
   email_unverified:['Провайдер не підтвердив email.','The provider did not verify the email address.'],
   invalid_state:['Сеанс входу завершився. Спробуйте ще раз.','Sign-in session expired. Try again.'],
   cancelled:['Вхід скасовано.','Sign-in was cancelled.'],
   link_conflict:['Цей провайдер вже пов’язаний з іншим акаунтом.','This provider belongs to a different account.']
  };
  const message=messages[code]||(uk?['Не вдалося завершити вхід. Спробуйте ще раз.',''] : ['','Could not finish sign-in. Please retry.']);
  setError(uk?message[0]:message[1]);setOpen(true);
  window.history.replaceState(null,'',window.location.pathname+window.location.hash);
 },[uk]);
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
  widgetIdRef.current=id;
  return ()=>{widgetIdRef.current=null;api.remove(id);setTurnstileToken('')};
 },[open,mode,challengeReady]);
 // Portal out of the sticky, backdrop-filtered header: Android Chrome otherwise
 // treats fixed popovers as header-positioned and can crop the left side.
 useEffect(()=>{
  if(!open)return;
  const oldFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const oldOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const reposition=()=>{
   const rect=triggerRef.current?.getBoundingClientRect();
   if(!rect)return;
   const width=Math.min(360,window.innerWidth-28);
   setPosition({
    top:Math.max(12,Math.min(rect.bottom+12,window.innerHeight-100)),
    left:Math.max(14,Math.min(rect.right-width,window.innerWidth-width-14))
   });
  };
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();setOpen(false);return;}
   if(event.key!=='Tab'||!dialogRef.current)return;
   const focusable=[...dialogRef.current.querySelectorAll<HTMLElement>(
    'button:not([disabled]),input:not([disabled]),a[href],select:not([disabled]),textarea:not([disabled])'
   )].filter(el=>el.getClientRects().length>0);
   if(!focusable.length)return;
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  reposition();
  const frame=requestAnimationFrame(()=>dialogRef.current?.querySelector<HTMLElement>(
   '.as-account-close'
  )?.focus());
  window.addEventListener('resize',reposition);
  window.addEventListener('scroll',reposition,true);
  window.visualViewport?.addEventListener('resize',reposition);
  document.addEventListener('keydown',onKey);
  return()=>{
   cancelAnimationFrame(frame);
   document.body.style.overflow=oldOverflow;
   window.removeEventListener('resize',reposition);
   window.removeEventListener('scroll',reposition,true);
   window.visualViewport?.removeEventListener('resize',reposition);
   document.removeEventListener('keydown',onKey);
   oldFocus?.focus();
  };
 },[open]);
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
  }catch(e){
   setError(e instanceof Error?e.message:String(e));
   if(mode==='register'){
    setTurnstileToken('');
    const api=(window as Window & {turnstile?:TurnstileApi}).turnstile;
    if(api&&widgetIdRef.current)api.reset(widgetIdRef.current);
   }
  }
  finally{setBusy(false)}
 }
 async function socialLogin(provider:'google'|'apple'){
  // Navigation is initiated only by clicking the provider button.
  window.location.assign('/api/v1/account/oauth/'+provider+'/start?locale='+locale);
 }
 async function linkSocial(provider:'google'|'apple'){
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/v1/account/oauth/'+provider+'/link',{
    method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({locale})
   });
   const payload=await readApiJson<{url:string}>(response);
   const target=new URL(payload.url);
   if((provider==='google'&&target.origin!=='https://accounts.google.com')||
      (provider==='apple'&&target.origin!=='https://appleid.apple.com'))
     throw new Error('Unexpected sign-in destination');
   window.location.assign(target.toString());
  }catch(e){setError(e instanceof Error?e.message:String(e));setBusy(false)}
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
  <button ref={triggerRef} className="as-account-trigger" type="button" aria-expanded={open}
   aria-haspopup="dialog" aria-controls={open?'galaxiora-account-dialog':undefined}
   onClick={()=>setOpen(v=>!v)}>
   <UserRound size={17}/><span>{user?(uk?'Кабінет':'Account'):(uk?'Увійти':'Sign in')}</span>
   {user?.role==='ADMIN'&&expertUnread>0&&<span role="status" aria-label={uk?'Нові запити до таролога':'New Tarot expert requests'} style={{borderRadius:20,padding:'2px 8px',background:'#b65357',color:'#fff',fontWeight:700}}>{expertUnread}</span>}
  </button>
  {open&&createPortal(<div className="as-account-overlay" onMouseDown={e=>{
   if(e.target===e.currentTarget)setOpen(false);
  }}>
   <div id="galaxiora-account-dialog" ref={dialogRef}
    className="as-account-popover as-account-dialog" role="dialog" aria-modal="true"
    aria-label={uk?'Обліковий запис':'Account'}
    style={{'--account-top':position.top+'px','--account-left':position.left+'px'} as React.CSSProperties}>
    <button className="as-account-close" type="button" onClick={()=>setOpen(false)}
     aria-label={uk?'Закрити вікно':'Close dialog'}><X size={19}/></button>
   {!loaded?<p>{uk?'Завантаження…':'Loading…'}</p>:user?<div className="as-account-signed">
    <strong>{user.email}</strong>
    <small>{user.role} · {user.subscription?.tier==='PREMIUM'?'Premium':'Free'}</small>
    <Link href={portalPath(locale,'personal')} onClick={()=>setOpen(false)}>{uk?'Galaxiora Personal — Мій Всесвіт':'Galaxiora Personal — My Universe'}</Link>
     <Link href={portalPath(locale,'account')} onClick={()=>setOpen(false)}>{uk?'Акаунт і запитання':'Account & questions'}</Link>
    {(social.google||social.apple)&&<div className="as-social-connections">
     <span>{uk?'Способи входу (необов’язково)':'Optional sign-in methods'}</span>
     {social.google&&(social.linked.includes('google')?
      <small>{uk?'Google підключено':'Google connected'}</small>:
      <button type="button" onClick={()=>void linkSocial('google')} disabled={busy}>{uk?'Підключити Google':'Link Google account'}</button>)}
     {social.apple&&(social.linked.includes('apple')?
      <small>{uk?'Apple підключено':'Apple connected'}</small>:
      <button type="button" onClick={()=>void linkSocial('apple')} disabled={busy}>{uk?'Підключити Apple':'Link Apple account'}</button>)}
    </div>}
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
    {mode!=='verify'&&(social.google||social.apple)&&
     <div className="as-social-login" role="group" aria-label={uk?'Вхід через іншого провайдера':'Other sign-in options'}>
      <span>{uk?'Або без пароля':'Or sign in without a password'}</span>
      {social.google&&<button type="button" onClick={()=>void socialLogin('google')} disabled={busy}>
       <span className="as-social-logo" aria-hidden="true">G</span>{uk?'Увійти через Google':'Continue with Google'}
      </button>}
      {social.apple&&<button type="button" onClick={()=>void socialLogin('apple')} disabled={busy}>
       <span className="as-social-logo" aria-hidden="true">●</span>{uk?'Увійти через Apple':'Continue with Apple'}
      </button>}
     </div>}
    <button type="button" className="as-mode-toggle" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setTurnstileToken('')}}>{mode==='login'?(uk?'Створити акаунт':'Create an account'):(uk?'Повернутися до входу':'Back to sign in')}</button>
    <p className="as-account-guest-note">{uk?
     'Реєстрація необов’язкова. Джйотіш, Панчанга й Таро доступні без входу. Акаунт потрібен лише для збереження власних результатів.':
     'An account is optional. Jyotish, Panchanga and Tarot work as a guest. Sign in only to save personal results.'}</p>
    <button type="button" className="as-account-guest" onClick={()=>setOpen(false)}>
     {uk?'Продовжити без акаунта':'Continue as guest'}
    </button>
   </form>}
   {error&&<p className="as-account-error" role="alert">{error}</p>}
   </div>
  </div>,document.body)}
 </div>;
}
