import {CreditCard,LockKeyhole,ShieldCheck,Video,MessageCircleMore,Clock} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
export default function ExpertOffer({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const benefits=uk?[
  {icon:Video,title:'Відео від живої людини',text:'Експертка самостійно працює з розкладом і записує персональне пояснення.'},
  {icon:MessageCircleMore,title:'Саме твоє питання',text:'Після оплати розкажеш контекст, щоб розклад враховував твою ситуацію.'},
  {icon:ShieldCheck,title:'Приватна доставка',text:'Відео буде доступне тільки у твоєму захищеному кабінеті.'},
  {icon:Clock,title:'Прозорий процес',text:'В особистому кабінеті відображатимуться статус та обумовлений строк виконання.'}
 ]:[
  {icon:Video,title:'A real human reader',text:'A practitioner draws the cards and records a thoughtful personal video.'},
  {icon:MessageCircleMore,title:'Your individual question',text:'After confirmed payment, share the context that matters to your situation.'},
  {icon:ShieldCheck,title:'Private delivery',text:'Only your account will receive the finished video through a protected link.'},
  {icon:Clock,title:'Clear order tracking',text:'See progress and the agreed delivery deadline in your personal dashboard.'}
 ];
 return <section className="as-expert-offer">
  <span className="as-overline">{uk?'ПЕРСОНАЛЬНИЙ ВІДЕОРОЗКЛАД':'PERSONAL VIDEO TAROT'}</span>
  <h2>{uk?'Чому варто обрати живу експертку?':'Why choose a human tarot reading?'}</h2>
  <div className="as-benefits">{benefits.map(b=><article className="as-benefit" key={b.title}><b.icon size={22}/><h3>{b.title}</h3><p>{b.text}</p></article>)}</div>
  <div className="as-offer-process">
   <h3>{uk?'Як проходитиме замовлення':'How your order will work'}</h3>
   <ol><li>{uk?'Обереш експертку та послугу':'Choose a reader and a service'}</li>
    <li>{uk?'Оплатиш через захищену сторінку':'Pay through an approved checkout'}</li>
    <li>{uk?'Після підтвердження платежу відкриється форма запитання і контексту':'Only after verified payment, unlock a private question and context form'}</li>
    <li>{uk?'Експертка запише відео, а ти отримаєш його у своєму кабінеті':'The expert records a video and delivers it privately to your account'}</li>
   </ol>
   <div className="as-payment-lock"><LockKeyhole size={21}/><div><strong>{uk?'Оплата ще не підключена':'Checkout is not yet available'}</strong><p>{uk?'Форма запитання заблокована. Ми не приймаємо замовлення і не просимо приватних даних до підтвердження платежу.':'Question submission is locked. No bookings or personal briefs are accepted before payment verification.'}</p></div></div>
   <button type="button" className="as-button as-button-primary" disabled aria-disabled="true"><CreditCard size={18}/>{uk?'Оплатити — незабаром':'Pay — coming soon'}</button>
  </div>
  <div className="as-detail">
   <h3>{uk?'Як правильно сформулювати питання':'How to phrase your question'}</h3>
   <p>{uk?'Невдало: «Він мене любить?». Краще: «Що я можу усвідомити у наших стосунках і як прийняти рішення?»':'Less useful: “Does he love me?” Better: “What could I learn about this relationship and how can I make an informed decision?”'}</p>
   <p>{uk?'Після оплати буде достатньо відкритого питання, кількох речень контексту та необов’язкового періоду. Дата народження не потрібна.':'After payment, an open question, a few sentences of context and an optional timeframe are enough. A birth date is not required.'}</p>
  </div>
 </section>;
}
