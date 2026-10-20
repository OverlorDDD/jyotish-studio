'use client';
import {useEffect,useState} from 'react';
import {AlertCircle,CheckCircle2,CreditCard,LockKeyhole,X} from 'lucide-react';
import {readApiJson} from '../../lib/api-response';
import type {PortalLocale} from '../../lib/brand';

const TOPICS={en:[['relationships','Relationships'],['career','Work / purpose'],['growth','Personal growth'],['decision','A decision'],['other','Other']],uk:[['relationships','Стосунки'],['career','Робота / покликання'],['growth','Саморозвиток'],['decision','Важливе рішення'],['other','Інше']]} as const;
type DraftReply={id:string;expiresAt:string;status:string;checkoutAvailable:boolean};
type PrivateDraft={id:string;createdAt:string;expiresAt:string;topic:string;question:string;context:string;timeframe?:string|null};
export default function DraftCheckout({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [topic,setTopic]=useState('relationships'),[question,setQuestion]=useState(''),[context,setContext]=useState(''),[timeframe,setTimeframe]=useState('');
 const [consent,setConsent]=useState(false),[saving,setSaving]=useState(false),[notice,setNotice]=useState(''),[draft,setDraft]=useState<DraftReply|null>(null);
 const [saved,setSaved]=useState<PrivateDraft[]>([]),[draftMessage,setDraftMessage]=useState('');
 const ready=question.trim().length>=12&&context.trim().length>=20&&consent;
 async function loadDrafts(){
  try{
   const list=await readApiJson<PrivateDraft[]>(await fetch('/api/v1/reading-orders/drafts',{credentials:'same-origin',cache:'no-store'}));
   setSaved(list);setDraftMessage('');
  }catch{setSaved([]);setDraftMessage(uk?'Увійди, щоб переглянути приватні чернетки.':'Sign in to view private drafts.');}
 }
 async function deleteDraft(id:string){
  try{await readApiJson(await fetch('/api/v1/reading-orders/drafts/'+id,{method:'DELETE',credentials:'same-origin'}));
   setSaved(old=>old.filter(x=>x.id!==id));
  }catch{setDraftMessage(uk?'Не вдалося видалити чернетку.':'Could not delete draft.');}
 }
 useEffect(()=>{void loadDrafts();},[]);
 async function submit(event:React.FormEvent){
  event.preventDefault();if(!ready)return;
  setSaving(true);setNotice('');
  try{
   const response=await fetch('/api/v1/reading-orders/drafts',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({topic,question,context,timeframe,privacyConsent:consent})
   });
   const saved=await readApiJson<DraftReply>(response);
   setDraft(saved);
   await loadDrafts();
   setQuestion('');setContext('');setTimeframe('');setConsent(false);
  }catch(error){
   setNotice(error instanceof Error?error.message:String(error));
  }finally{setSaving(false)}
 }
 return <section className="as-intake" id="reading-draft">
  <div className="as-section-heading"><div>
   <span className="as-overline">{uk?'КРОК 1 · РОЗКАЖИ ПРО СВОЄ ПИТАННЯ':'STEP 1 · TELL US YOUR QUESTION'}</span>
   <h2>{uk?'Спочатку питання — потім оплата':'Your question first. Checkout next.'}</h2>
   <p>{uk?'Зараз доступне лише збереження приватного запитання. Оплати та передачі експерту немає. Чернетку можна переглянути або видалити нижче.':'You can currently save a private request only. There is no payment or practitioner access. You can review or delete your draft below.'}</p>
  </div></div>
  <div className="as-intake-columns">
   <aside className="as-examples">
    <h3>{uk?'Як ставити питання':'Question guidance'}</h3>
    <div className="as-example"><p className="as-less">{uk?'Менш корисно: «Чи буде все добре?»':'Less helpful: “Will everything be fine?”'}</p><p className="as-better">{uk?'Краще: «Що я можу зробити, щоб краще зрозуміти ситуацію і свій наступний крок?»':'Better: “What might help me understand this situation and choose my next step?”'}</p></div>
    <div className="as-example"><p className="as-less">{uk?'Менш корисно: «Коли я стану багатим?»':'Less helpful: “When will I become rich?”'}</p><p className="as-better">{uk?'Краще: «Які можливості та обмеження мені варто обдумати при зміні роботи?»':'Better: “Which possibilities and limitations could I reflect on before changing jobs?”'}</p></div>
    <p className="as-privacy"><LockKeyhole size={18}/>{uk?'Достатньо псевдоніма чи контексту без імен. Не вказуй чужі особисті дані, адреси чи документи. Чернетку можна видалити у кабінеті.':'Avoid IDs, addresses and third-party private details. Your draft can be deleted in your account.'}</p>
   </aside>
   <form className="as-intake-form" onSubmit={submit}>
    <label htmlFor="draft-topic">{uk?'Тема':'Topic'}</label>
    <select id="draft-topic" value={topic} onChange={e=>setTopic(e.target.value)}>{TOPICS[locale].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
    <label htmlFor="draft-question">{uk?'Основне запитання':'Your main question'} *</label>
    <textarea id="draft-question" rows={3} minLength={12} maxLength={600} required value={question} onChange={e=>setQuestion(e.target.value)} placeholder={uk?'Що мені варто зрозуміти про…':'What could I learn about…'}/>
    <small>{uk?'Сформулюй конкретне відкрите запитання (від 12 символів).':'Use a clear, open-ended question (12+ characters).'}</small>
    <label htmlFor="draft-context">{uk?'Контекст ситуації':'Relevant context'} *</label>
    <textarea id="draft-context" rows={5} minLength={20} maxLength={2000} required value={context} onChange={e=>setContext(e.target.value)} placeholder={uk?'Що відбулося і які рішення ти розглядаєш?':'What happened, and which options are you considering?'}/>
    <small>{uk?'Кілька речень контексту без зайвих персональних даних (від 20 символів).':'A few sentences, without unnecessary personal details (20+ characters).'}</small>
    <label htmlFor="draft-timeframe">{uk?'Часовий період (необов’язково)':'Timeframe (optional)'}</label>
    <input id="draft-timeframe" maxLength={140} value={timeframe} onChange={e=>setTimeframe(e.target.value)} placeholder={uk?'Наприклад, наступні 3 місяці':'For example, the next 3 months'}/>
    <label className="as-consent"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/>
      <span>{uk?'Погоджуюсь на тимчасове зберігання моєї приватної чернетки в акаунті до 7 днів. Я розумію, що розклад ще не замовлено і оплата недоступна.':'I consent to saving my private draft for up to 7 days. I understand this is not a paid order and checkout is not yet available.'}</span>
    </label>
    <p className="as-muted">{uk?'Для відправлення потрібен акаунт. Якщо ще не увійшов, натисни «Увійти» у верхньому меню.':'You need to be signed in to save a draft. Use Sign in in the top navigation first.'}</p>
    <button className="as-button as-button-primary" disabled={!ready||saving} type="submit">{saving?(uk?'Зберігаємо…':'Saving…'):(uk?'Зберегти приватну чернетку':'Save private draft')}</button>
    {notice&&<p className="as-account-error" role="alert"><AlertCircle size={16}/>{notice}</p>}
   </form>
  </div>
  <section className="as-expert-drafts" aria-label={uk?'Мої чернетки':'My saved drafts'}>
   <h3>{uk?'Мої приватні запитання':'My private questions'}</h3>
   <p>{uk?'Чернетки доступні лише власнику протягом 7 днів. Експерт їх не бачить.':'Only you can access your drafts for seven days. Practitioners cannot view them.'}</p>
   <button type="button" className="as-button as-button-secondary" onClick={()=>void loadDrafts()}>{uk?'Оновити список':'Refresh list'}</button>
   {draftMessage?<p role="status">{draftMessage}</p>:null}
   {saved.map(item=><article className="as-expert-draft-card" key={item.id}>
    <span>{item.topic} · {uk?'не оплачено':'unpaid'}</span>
    <h4>{item.question}</h4><p>{item.context}</p>
    <small>{uk?'До ':'Expires '}{new Date(item.expiresAt).toLocaleDateString(uk?'uk-UA':'en-US')}</small>
    <button type="button" className="as-button as-button-secondary" onClick={()=>void deleteDraft(item.id)}>{uk?'Видалити чернетку':'Delete draft'}</button>
   </article>)}
  </section>
  {draft&&<div className="as-modal-overlay" role="presentation" onClick={()=>setDraft(null)}>
   <div role="dialog" aria-modal="true" aria-labelledby="reading-payment-title" className="as-payment-modal" onClick={e=>e.stopPropagation()}>
    <button type="button" className="as-modal-close" aria-label={uk?'Закрити':'Close'} onClick={()=>setDraft(null)}><X size={20}/></button>
    <CheckCircle2 size={35} className="as-modal-success"/>
    <h2 id="reading-payment-title">{uk?'Твоє питання збережено':'Your question was saved'}</h2>
    <p>{uk?'Запитання збережено у твоєму кабінеті, але це ще не замовлення. Експерт його не отримав.':'Your request remains a private draft, not a paid order. No practitioner has access to it.'}</p>
    <div className="as-checkout-summary"><LockKeyhole size={20}/><span>{uk?'Оплата наразі не підключена. Гроші не списуються, і замовлення не створено.':'Checkout is not integrated yet. No money is charged, and no paid order has been created.'}</span></div>
    <button className="as-button as-button-primary" type="button" disabled aria-disabled="true"><CreditCard size={18}/>{uk?'Оплатити — незабаром':'Pay — coming soon'}</button>
    <button className="as-button as-button-secondary" type="button" onClick={()=>setDraft(null)}>{uk?'Повернутися на сайт':'Return to website'}</button>
   </div>
  </div>}
 </section>;
}
