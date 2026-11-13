'use client';
import {useEffect,useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
import {guideTo} from '../../lib/guide-focus';
import styles from './ExpertQuestionForm.module.css';
type Topic='relationships'|'career'|'growth'|'decision'|'other';
const topics:Record<Topic,[string,string]>={
 relationships:['Стосунки','Relationships'],career:['Робота й гроші','Work & money'],
 growth:['Самопізнання','Personal growth'],decision:['Вибір і рішення','A decision'],
 other:['Інше','Other']
};
const DRAFT='gx-reader-question-draft';
/** Free first step of the human reading: the question reaches the Galaxiora administrator
 * and the reader replies by email. Nothing is paid here; payment details come only by email
 * after a reader accepts the question. */
export default function ExpertQuestionForm({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [topic,setTopic]=useState<Topic>('relationships');
 const [question,setQuestion]=useState(''),[context,setContext]=useState(''),[timeframe,setTimeframe]=useState('');
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [needsSignIn,setNeedsSignIn]=useState(false);
 const [submitted,setSubmitted]=useState<{id:string}|null>(null);
 useEffect(()=>{
  try{
   const saved=window.sessionStorage.getItem(DRAFT);
   if(saved){const d=JSON.parse(saved) as {topic:Topic;question:string;context:string};setTopic(d.topic);setQuestion(d.question);setContext(d.context);}
  }catch{/* ignore */}
  const onAuth=()=>setNeedsSignIn(false);
  // From a finished online spread: pre-fill only empty fields, never overwrite what the person typed.
  const fromSpread=(event:Event)=>{
   const d=(event as CustomEvent<{question?:string;context?:string;topic?:Topic|null}>).detail;
   if(!d)return;
   setSubmitted(null);
   if(d.topic&&d.topic in topics)setTopic(d.topic);
   if(d.question)setQuestion(q=>q.trim()?q:d.question!.slice(0,600));
   if(d.context)setContext(c=>c.trim()?c:d.context!.slice(0,2000));
   guideTo(d.question?'expert-context':'expert-question',{focus:!d.question,delay:500});
  };
  window.addEventListener('galaxiora:auth-changed',onAuth);
  window.addEventListener('galaxiora:tarot-to-reader',fromSpread);
  return()=>{window.removeEventListener('galaxiora:auth-changed',onAuth);window.removeEventListener('galaxiora:tarot-to-reader',fromSpread);};
 },[]);
 async function submit(e:React.FormEvent){
  e.preventDefault();if(busy)return;
  setError('');setBusy(true);setNeedsSignIn(false);
  try{
   const response=await fetch('/api/v1/reading-orders/questions/expert',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({topic,question:question.trim(),context:context.trim(),
     timeframe:timeframe.trim()||undefined,privacyConsent:consent})
   });
   if(!response.ok){
    const errorText=await response.text();
    if(response.status===401){
     try{window.sessionStorage.setItem(DRAFT,JSON.stringify({topic,question,context}));}catch{/* ignore */}
     setNeedsSignIn(true);return;
    }
    if(response.status===429)throw Error(uk?'Забагато звернень за добу. Спробуйте завтра.':'Daily inquiry limit reached. Try tomorrow.');
    throw Error((uk?'Не вдалося надіслати питання. ':'Could not send the question. ')+errorText.slice(0,120));
   }
   const result=await response.json() as {id:string;status:string};
   if(result.status!=='SENT_TO_EXPERT_INBOX'||!result.id)throw Error(uk?'Сервер не підтвердив відправлення.':'Server did not confirm submission.');
   setSubmitted({id:result.id});
   try{window.sessionStorage.removeItem(DRAFT);}catch{/* ignore */}
   setQuestion('');setContext('');setTimeframe('');setConsent(false);
   window.dispatchEvent(new Event('galaxiora:expert-question-sent'));
  }catch(err){setError(err instanceof Error?err.message:String(err));}
  finally{setBusy(false);}
 }
 return <div className={styles.section} data-testid="reader-question-form">
  {submitted?<div role="status" className={styles.success}>
   <strong>{uk?'Питання надіслано!':'Your question has been sent!'}</strong>
   <p>{uk?'Таролог прочитає його й відповість на пошту вашого акаунта, зазвичай протягом доби: чи візьметься за питання і який розклад пропонує. Платити зараз нічого не потрібно.':
    'A reader will read it and reply to your account email, usually within a day: whether they can take the question and which spread they suggest. Nothing to pay now.'}</p>
   <p>{uk?'Якщо хочете пришвидшити відповідь, відкрийте наш Telegram і напишіть адміністратору — можна зв’язатися з ним через контакти в каналі.':
    'To speed things up, open our Telegram and message the administrator using the contacts in the channel.'}</p>
   <p><a href="https://t.me/Galaxiora" target="_blank" rel="noopener noreferrer" className={styles.link}>
    {uk?'Відкрити @Galaxiora':'Open @Galaxiora'}</a></p>
   <button type="button" className="as-button as-button-secondary" onClick={()=>setSubmitted(null)}>
    {uk?'Написати ще одне питання':'Write another question'}
   </button>
  </div>:<form onSubmit={submit} className={styles.form}>
   <span className={styles.label} id="expert-topic-label">{uk?'Про що питання?':'What is it about?'}</span>
   <div className={styles.chips} role="radiogroup" aria-labelledby="expert-topic-label">
    {Object.entries(topics).map(([id,names])=><button type="button" role="radio" key={id} aria-checked={topic===id}
     onClick={()=>setTopic(id as Topic)}>{names[uk?0:1]}</button>)}
   </div>
   <label htmlFor="expert-question">{uk?'Ваше питання':'Your question'}</label>
   <textarea id="expert-question" rows={3} required maxLength={600}
    value={question} onChange={e=>setQuestion(e.target.value)}
    placeholder={uk?'Наприклад: чи варто мені погоджуватися на переїзд заради нової роботи?':'For example: should I agree to move for a new job?'}/>
   <label htmlFor="expert-context">{uk?'Що важливо знати тарологу (необов’язково)':'What the reader should know (optional)'}</label>
   <textarea id="expert-context" rows={3} maxLength={2000}
    value={context} onChange={e=>setContext(e.target.value)}
    placeholder={uk?'Кілька речень про ситуацію, без зайвих особистих даних.':'A few sentences about the situation, without unnecessary personal details.'}/>
   <label htmlFor="expert-timeframe">{uk?'Період, який вас цікавить (необов’язково)':'Timeframe (optional)'}</label>
   <input id="expert-timeframe" maxLength={140} value={timeframe} onChange={e=>setTimeframe(e.target.value)}
    placeholder={uk?'Наприклад: найближчі три місяці':'For example: the next three months'}/>
   <label className={styles.consent}>
    <input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/>
    <span>{uk?
     'Я погоджуюся зберегти моє питання в Galaxiora та передати його, опис ситуації й email акаунта адміністратору й тарологу для відповіді. Раніше збережені приватні запитання не передаються.':
     'I agree that Galaxiora may store my question, description and account email and share them with its administrator and reader to reply. Previously saved private questions are not shared.'}</span>
   </label>
   {needsSignIn&&<div role="alert" className={styles.signin}>
    <p>{uk?'Щоб таролог міг відповісти вам на пошту, увійдіть або створіть акаунт — це хвилина. Питання збережеться в цьому вікні.':
     'So the reader can reply by email, sign in or create an account — it takes a minute. Your question stays in this window.'}</p>
    <button type="button" className="as-button as-button-secondary" onClick={()=>(document.querySelector('button.as-account-trigger') as HTMLButtonElement|null)?.click()}>
     {uk?'Увійти або зареєструватися':'Sign in or register'}</button>
   </div>}
   {error&&<p role="alert" className={styles.error}>{error}</p>}
   <button type="submit" className="as-button as-button-primary" disabled={busy||!consent||!question.trim()}>
    {busy?(uk?'Надсилаємо…':'Sending…'):(uk?'Надіслати питання тарологу':'Send my question to a reader')}
   </button>
   <p className={styles.note}>{uk?'Безкоштовно і ні до чого не зобов’язує.':'Free and with no obligation.'}</p>
  </form>}
 </div>;
}
