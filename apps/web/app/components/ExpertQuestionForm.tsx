'use client';
import {useState} from 'react';
import type {PortalLocale} from '../../lib/brand';
import styles from './ExpertQuestionForm.module.css';
type Topic='relationships'|'career'|'growth'|'decision'|'other';
const topics:Record<Topic,[string,string]>={
 relationships:['Стосунки','Relationships'],career:['Робота й кар’єра','Work & career'],
 growth:['Самопізнання','Personal growth'],decision:['Вибір і рішення','A decision'],
 other:['Інше','Other']
};
export default function ExpertQuestionForm({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [topic,setTopic]=useState<Topic>('relationships');
 const [question,setQuestion]=useState(''),[context,setContext]=useState(''),[timeframe,setTimeframe]=useState('');
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [submitted,setSubmitted]=useState<{id:string}|null>(null);
 async function submit(e:React.FormEvent){
  e.preventDefault();if(busy)return;
  setError('');setBusy(true);
  try{
   const response=await fetch('/api/v1/reading-orders/questions/expert',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({topic,question:question.trim(),context:context.trim(),
     timeframe:timeframe.trim()||undefined,privacyConsent:consent})
   });
   if(!response.ok){
    const errorText=await response.text();
    if(response.status===401)throw Error(uk?'Увійди або зареєструйся, щоб надіслати запит.':'Sign in or create an account to submit.');
    if(response.status===429)throw Error(uk?'Забагато звернень за добу. Спробуй пізніше.':'Daily inquiry limit reached. Try later.');
    throw Error((uk?'Не вдалося зберегти запит. ':'Could not save the inquiry. ')+errorText.slice(0,120));
   }
   const result=await response.json() as {id:string;status:string};
   if(result.status!=='SENT_TO_EXPERT_INBOX'||!result.id)throw Error(uk?'Сервер не підтвердив відправлення.':'Server did not confirm submission.');
   setSubmitted({id:result.id});
   setQuestion('');setContext('');setTimeframe('');setConsent(false);
  }catch(err){setError(err instanceof Error?err.message:String(err));}
  finally{setBusy(false);}
 }
 return <section id="human-readings" aria-label={uk?'Запит до таролога':'Ask a human Tarot expert'}
  className={styles.section}>
  <span className="as-overline">GALAXIORA · HUMAN TAROT</span>
  <h2>{uk?'Запитай справжнього таролога':'Ask a human Tarot practitioner'}</h2>
  <p>{uk?
   'Опиши своє запитання і ситуацію. Воно збережеться на сайті й з’явиться в особистій панелі адміністратора Galaxiora. Оплата зараз не потрібна, а терміни відповіді не гарантуються.':
   'Describe your question and situation. Your inquiry will be saved for the Galaxiora administrator to review. No payment is required; response times are not guaranteed.'}</p>
  {submitted?<div role="status" className={styles.success}>
   <strong>{uk?'Твоє звернення прийнято!':'Your inquiry was received!'}</strong>
   <p>{uk?'Запит збережено, адміністратора буде сповіщено на сайті. Поки що ми не відправляємо питання в Telegram автоматично.':'Your question was saved and an in-site notification is available to the administrator. It is not automatically sent to Telegram.'}</p>
   <p>{uk?'Щоб адміністратор швидше зорієнтувався у зверненні, відкрий наш Telegram і зв’яжися з ним через контакти, вказані в каналі. Можеш повідомити, що вже залишив запитання на сайті.':'To follow up, open our Telegram channel and contact the administrator using the contact details provided there. Mention that you submitted a question on the website.'}</p>
   <p><a href="https://t.me/Galaxiora" target="_blank" rel="noopener noreferrer"
    style={{fontWeight:700,color:'#efd5a8',textDecoration:'underline'}}>
    {uk?'Відкрити @Galaxiora та зв’язатися з адміністратором':'Open @Galaxiora to contact the administrator'}</a></p>
   <button type="button" className="as-button as-button-secondary" onClick={()=>setSubmitted(null)}>
    {uk?'Написати ще одне запитання':'Write another question'}
   </button>
  </div>:<form onSubmit={submit} className={styles.form}>
   <label htmlFor="expert-topic">{uk?'Тема звернення':'Topic'}</label>
   <select id="expert-topic" value={topic} onChange={e=>setTopic(e.target.value as Topic)}>
    {Object.entries(topics).map(([id,names])=><option key={id} value={id}>{names[uk?0:1]}</option>)}
   </select>
   <label htmlFor="expert-question">{uk?'Головне запитання':'Your main question'}</label>
   <textarea id="expert-question" rows={3} required maxLength={600}
    value={question} onChange={e=>setQuestion(e.target.value)}
    placeholder={uk?'Наприклад: як краще розібратися в ситуації у стосунках?':'For example: How can I understand this relationship situation?'}/>
   <label htmlFor="expert-context">{uk?'Контекст (необов’язково): що важливо знати тарологу':'Context (optional)'}</label>
   <textarea id="expert-context" rows={4} maxLength={2000}
    value={context} onChange={e=>setContext(e.target.value)}
    placeholder={uk?'Опиши обставини своїми словами, без зайвих особистих даних.':'Describe your situation without unnecessary personal details.'}/>
   <label htmlFor="expert-timeframe">{uk?'Період (необов’язково)':'Timeframe (optional)'}</label>
   <input id="expert-timeframe" maxLength={140} value={timeframe} onChange={e=>setTimeframe(e.target.value)}/>
   <label style={{display:'flex',gap:12,alignItems:'flex-start',fontSize:13,lineHeight:1.5,letterSpacing:0}}>
    <input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}
     style={{width:18,height:18,flex:'none'}}/>
    <span>{uk?
     'Я погоджуюся зберегти моє запитання в Galaxiora та передати його, контекст і email акаунта адміністратору для розгляду експертом. Раніше збережені приватні запитання не передаються.':
     'I agree that Galaxiora may store my question, context and account email and show them to its administrator for expert review. Previous private questions are not shared.'}</span>
   </label>
   {error&&<p role="alert" style={{color:'#ffc0bd'}}>{error}</p>}
   <button type="submit" className="as-button as-button-primary" disabled={busy||!consent||!question.trim()}>
    {busy?(uk?'Надсилаємо…':'Submitting…'):(uk?'Надіслати запит експерту':'Submit to expert')}
   </button>
  </form>}
 </section>;
}
