'use client';
import {useEffect,useState} from 'react';
import {BookMarked,UserRound,LogIn,LogOut,Save,Trash2,Eye,LockKeyhole} from 'lucide-react';
import {readApiJson} from '../../lib/api-response';
import type {ReadingReport} from './DetailedReport';
type User={id:string;email:string};
type Birth={date:string;time:string;timeZone:string;latitude:number;longitude:number;place?:string};
type SavedSummary={id:string;createdAt:string;place:string;date:string;ascendant:string;hasReport:boolean};
type SavedData={id:string;chart:unknown;report:ReadingReport|null};
const json={headers:{'Content-Type':'application/json'},credentials:'same-origin' as const};

export default function AccountPortal({birth,report,lang,onOpenSaved}:{
 birth:Birth|null;report:ReadingReport|null;lang:'uk'|'en';
 onOpenSaved:(chart:unknown,report:ReadingReport|null)=>void;
}){
 const uk=lang==='uk';
 const [user,setUser]=useState<User|null>(null);
 const [ready,setReady]=useState(false);
 const [open,setOpen]=useState(false);
 const [mode,setMode]=useState<'login'|'register'>('register');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [history,setHistory]=useState<SavedSummary[]>([]);
 const [working,setWorking]=useState(false);
 const [message,setMessage]=useState('');
 async function loadHistory(){
  const res=await fetch('/api/v1/account/charts',{credentials:'same-origin',cache:'no-store'});
  setHistory(await readApiJson<SavedSummary[]>(res));
 }
 useEffect(()=>{
  let canceled=false;
  fetch('/api/v1/account/me',{credentials:'same-origin',cache:'no-store'})
   .then(r=>readApiJson<{user:User|null}>(r))
   .then(data=>{if(!canceled){setUser(data.user);setReady(true);}})
   .catch(()=>{if(!canceled)setReady(true);});
  return()=>{canceled=true};
 },[]);
 useEffect(()=>{if(user)loadHistory().catch(()=>setMessage(uk?'Не вдалося завантажити історію.':'Could not load history.'));else setHistory([]);},[user?.id]);
 const safeError=(error:unknown)=>error instanceof Error?error.message:String(error);
 async function authenticate(e:React.FormEvent){
  e.preventDefault();setWorking(true);setMessage('');
  try{
   const r=await fetch('/api/v1/account/'+mode,{...json,method:'POST',body:JSON.stringify({email,password})});
   const result=await readApiJson<{user:User}>(r);
   setUser(result.user);setPassword('');
   setMessage(uk?'Вітаємо! Тепер ви можете зберігати карти.':'Welcome! You can now save charts.');
  }catch(error){setMessage(safeError(error));}
  finally{setWorking(false);}
 }
 async function logout(){
  setWorking(true);setMessage('');
  try{
   await readApiJson(await fetch('/api/v1/account/logout',{...json,method:'POST'}));
   setUser(null);setHistory([]);setOpen(false);
  }catch(error){setMessage(safeError(error));}
  finally{setWorking(false);}
 }
 async function save(){
  if(!user){setMode('register');setOpen(true);setMessage(uk?'Створіть акаунт, щоб зберегти поточну карту.':'Create an account to save this chart.');return;}
  if(!birth){setMessage(uk?'Спочатку розрахуйте карту.':'Calculate a chart first.');return;}
  setWorking(true);setMessage('');
  try{
   const ai=report?.ai;
   const r=await fetch('/api/v1/account/charts',{...json,method:'POST',body:JSON.stringify({
    ...birth,language:lang,asOf:report?.asOf||new Date().toISOString().slice(0,10),
    aiProvider:ai?.provider==='openrouter'||ai?.provider==='ollama'?ai.provider:'local',
    aiModel:ai?.model||'',
    aiText:ai?.text?.slice(0,12000)||''
   })});
   await readApiJson(r);
   await loadHistory();
   setMessage(uk?'Карту збережено у вашому кабінеті.':'Chart saved to your account.');
  }catch(error){setMessage(safeError(error));}
  finally{setWorking(false);}
 }
 async function openChart(id:string){
  setWorking(true);setMessage('');
  try{
   const r=await fetch('/api/v1/account/charts/'+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store'});
   const data=await readApiJson<SavedData>(r);
   onOpenSaved(data.chart,data.report);
   setOpen(false);
   document.getElementById('calculator')?.scrollIntoView({behavior:'smooth'});
  }catch(error){setMessage(safeError(error));}
  finally{setWorking(false);}
 }
 async function removeChart(id:string){
  if(!confirm(uk?'Назавжди видалити цю збережену карту?':'Permanently delete this saved chart?'))return;
  setWorking(true);setMessage('');
  try{
   const r=await fetch('/api/v1/account/charts/'+encodeURIComponent(id),{...json,method:'DELETE'});
   await readApiJson(r);await loadHistory();
   setMessage(uk?'Карту видалено.':'Chart deleted.');
  }catch(error){setMessage(safeError(error));}
  finally{setWorking(false);}
 }
 return <div className="account-widget">
  <button type="button" className="account-trigger" onClick={()=>setOpen(!open)} aria-expanded={open}>
   {user?<BookMarked size={16}/>:<UserRound size={16}/>}
   {user?(uk?'Мій кабінет':'My account'):(uk?'Увійти / Реєстрація':'Sign in / Register')}
  </button>
  {open?<section className="account-popover" aria-label={uk?'Кабінет користувача':'User account'}>
   <div className="account-heading">
    <strong>{user?(uk?'Особистий кабінет':'Your account'):(mode==='register'?(uk?'Створити акаунт':'Create account'):(uk?'Увійти':'Sign in'))}</strong>
    <button type="button" className="account-close" onClick={()=>setOpen(false)}>×</button>
   </div>
   {!ready?<p className="account-muted">...</p>:user?<>
    <p className="account-email">{user.email}</p>
    <button className="account-primary" type="button" disabled={working||!birth} onClick={save}><Save size={15}/>{uk?'Зберегти поточну карту':'Save current chart'}</button>
    <div className="account-history-title">{uk?'Історія збережених карт':'Saved chart history'} · {history.length}</div>
    {history.length? <div className="account-history">
     {history.map(item=><div className="account-history-item" key={item.id}>
      <div><strong>{item.place||item.ascendant||'Jyotish'}</strong><small>{item.date} · {new Date(item.createdAt).toLocaleDateString(uk?'uk-UA':'en-US')}</small></div>
      <button type="button" disabled={working} title={uk?'Відкрити':'Open'} onClick={()=>openChart(item.id)}><Eye size={16}/></button>
      <button type="button" disabled={working} title={uk?'Видалити':'Delete'} onClick={()=>removeChart(item.id)}><Trash2 size={16}/></button>
     </div>)}
    </div>:<p className="account-muted">{uk?'У вас поки немає збережених карт. Розрахуйте карту й натисніть «Зберегти».':'No saved charts yet. Calculate a chart and select Save.'}</p>}
    <button type="button" className="account-link" onClick={logout} disabled={working}><LogOut size={14}/>{uk?'Вийти':'Sign out'}</button>
   </>:<>
    <p className="account-muted">{uk?'Усі розрахунки та AI-трактування доступні без реєстрації. Акаунт потрібен лише для збереження історії.':'All calculations and AI readings are free to use as a guest. An account saves your history.'}</p>
    <form className="account-form" onSubmit={authenticate}>
     <label>{uk?'Електронна пошта':'Email'}<input type="email" autoComplete="email" required maxLength={150} value={email} onChange={e=>setEmail(e.target.value)}/></label>
     <label>{uk?'Пароль (мінімум 12 символів)':'Password (12+ characters)'}<input type="password" autoComplete={mode==='register'?'new-password':'current-password'} minLength={12} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
     <button type="submit" className="account-primary" disabled={working}><LogIn size={15}/>{mode==='register'?(uk?'Зареєструватися':'Register'):(uk?'Увійти':'Sign in')}</button>
    </form>
    <button type="button" className="account-link" onClick={()=>{setMode(mode==='register'?'login':'register');setMessage('')}}>
     {mode==='register'?(uk?'Уже маєте акаунт? Увійти':'Already registered? Sign in'):(uk?'Немає акаунта? Зареєструватися':'Need an account? Register')}
    </button>
   </>}
   {message?<p className="account-message" role="status">{message}</p>:null}
   <div className="account-privacy"><LockKeyhole size={12}/>{uk?'Збережені карти доступні лише власнику.':'Only the owner can view saved charts.'}</div>
  </section>:null}
 </div>;
}
