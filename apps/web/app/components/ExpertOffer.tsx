import {Clock,LockKeyhole,MessageCircleMore,ShieldCheck,Video} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import DraftCheckout from './DraftCheckout';
export default function ExpertOffer({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const benefits=uk?[
  {icon:Video,title:'Індивідуальне відео',text:'Реальна експертка особисто розкладає карти та пояснює їх значення.'},
  {icon:MessageCircleMore,title:'Твоя історія',text:'Відкрите запитання і контекст дозволяють уникнути шаблонних відповідей.'},
  {icon:ShieldCheck,title:'Приватність',text:'Твоє запитання зберігається приватно в кабінеті. Доступ таролога поки не активований.'},
  {icon:Clock,title:'Контроль виконання',text:'У майбутньому кабінеті бачитимеш статус і дату готовності відео.'}
 ]:[
  {icon:Video,title:'Personal recorded video',text:'A real practitioner draws the cards and explains the reading.'},
  {icon:MessageCircleMore,title:'Your own story',text:'An open-ended question and context make the reading more individual.'},
  {icon:ShieldCheck,title:'Privacy first',text:'Only you can see your saved question. Reader access is not enabled.'},
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
    <li>{uk?'Збережеш запитання у своєму особистому кабінеті':'Keep your question in your personal account'}</li>
    <li>{uk?'Доступ до живого таролога з'явиться після окремого запуску консультацій':'Consultations will become available when the human-reader service launches'}</li>
    <li>{uk?'Експертка виконає розклад і передасть приватне відео':'Your reader records and privately delivers your video'}</li>
   </ol>
   <p className="as-muted"><LockKeyhole size={15}/> {uk?'Запитання зберігаються приватно. Добровільна підтримка платформи не означає оплату або замовлення консультації.':'Checkout is not connected yet; currently you can only save a private draft.'}</p>
  </div>
  <DraftCheckout locale={locale}/>
 </section>;
}
