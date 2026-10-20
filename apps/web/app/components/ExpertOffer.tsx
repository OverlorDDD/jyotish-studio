import {Clock,LockKeyhole,MessageCircleMore,ShieldCheck,Video} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import Link from 'next/link';
import DraftCheckout from './DraftCheckout';
export default function ExpertOffer({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const benefits=uk?[
  {icon:Video,title:'Індивідуальне відео',text:'Реальна експертка особисто розкладає карти та пояснює їх значення.'},
  {icon:MessageCircleMore,title:'Твоя історія',text:'Відкрите запитання і контекст дозволяють уникнути шаблонних відповідей.'},
  {icon:ShieldCheck,title:'Приватність',text:'Чернетку бачиш тільки ти. Експертка отримає запитання лише після оплати.'},
  {icon:Clock,title:'Контроль виконання',text:'У майбутньому кабінеті бачитимеш статус і дату готовності відео.'}
 ]:[
  {icon:Video,title:'Personal recorded video',text:'A real practitioner draws the cards and explains the reading.'},
  {icon:MessageCircleMore,title:'Your own story',text:'An open-ended question and context make the reading more individual.'},
  {icon:ShieldCheck,title:'Privacy first',text:'Only you can see your draft. A reader receives it only after verified payment.'},
  {icon:Clock,title:'Track your order',text:'Once the service launches, track progress and delivery in your account.'}
 ];
 return <section className="as-expert-offer">
  <span className="as-overline">HUMAN VIDEO TAROT</span>
  <h2>{uk?'Чому варто замовити розклад у живої людини?':'What makes a human reading different?'}</h2>
  <div className="as-benefits">{benefits.map(b=><article className="as-benefit" key={b.title}><b.icon size={22}/><h3>{b.title}</h3><p>{b.text}</p></article>)}</div>
  <div className="as-offer-process">
   <h3>{uk?'Як це працюватиме':'How this will work'}</h3>
   <ol>
    <li>{uk?'Сформулюй питання й коротко опиши ситуацію':'Submit your question and the relevant context'}</li>
    <li>{uk?'Побачиш вікно оплати та зможеш перевірити умови':'See the checkout step and service terms'}</li>
    <li>{uk?'Лише підтверджена оплата перетворить чернетку на замовлення':'Only verified payment converts the draft into a real order'}</li>
    <li>{uk?'Експертка виконає розклад і передасть приватне відео':'Your reader records and privately delivers your video'}</li>
   </ol>
   <p className="as-muted"><LockKeyhole size={15}/> {uk?'Наразі оплата ще не підключена, тому можна зберегти тільки приватну чернетку.':'Checkout is not connected yet; currently you can only save a private draft.'}</p>
  </div>
  <p><Link className="as-button as-button-secondary" href={'/'+locale+'/experts'}>{uk?'Переглянути перевірених експертів':'View reviewed practitioners'}</Link></p>
  <DraftCheckout locale={locale}/>
 </section>;
}
