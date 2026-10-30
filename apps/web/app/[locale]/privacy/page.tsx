import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {BRAND,isPortalLocale} from '../../../../lib/brand';
import PortalShell from '../../../components/PortalShell';

export const metadata:Metadata={title:'Privacy | Galaxiora',robots:{index:false,follow:true}};
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export default async function PrivacyPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 const uk=locale==='uk';
 const contact=process.env.NEXT_PUBLIC_SITE_CONTACT_EMAIL?.trim()||'';
 const operator=process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim()||'';
 return <PortalShell locale={locale}><article className="as-subpage" style={{maxWidth:850,margin:'0 auto'}}>
 <h1>{uk?'Конфіденційність Galaxiora':'Galaxiora Privacy Notice'}</h1>
 <p>{uk?'Оновлено: 30 жовтня 2026 року':'Updated: October 30, 2026'}</p>
 <h2>{uk?'Оператор і зв’язок':'Operator and contact'}</h2>
 <p>{operator||(uk?'Інформація про оператора буде опублікована до відкриття реєстрації.':'Operator information will be supplied before public registration.')}
 {contact&&<> · <a href={'mailto:'+contact}>{contact}</a></>}</p>
 <h2>{uk?'Які дані ми обробляємо':'Data we process'}</h2>
 <p>{uk?'Для акаунта: email, захищений хеш пароля і сесійний cookie. Якщо ви користуєтеся персональними інструментами: дані народження й натальні карти, збережені результати, нотатки та реакції на новини. У форумі: ваші повідомлення, скарги й налаштування профілю.':'For accounts: email, a secure password hash and a session cookie. If you use personal features: birth details and charts, saved readings, notes and news reactions. In the forum: messages, reports and profile settings.'}</p>
 <h2>{uk?'Мета обробки':'Why we process it'}</h2>
 <p>{uk?'Щоб надати обрані функції, захистити акаунти, модерувати спільноту та підтримувати працездатність сервісу. Дані натальної карти є особистими: не публікуйте їх у відкритому форумі.':'To provide requested features, secure accounts, moderate the community and keep the service functioning. Birth-chart data is personal: do not post it in the public forum.'}</p>
 <h2>{uk?'Сторонні сервіси':'Third-party services'}</h2>
 <p>{uk?'Хостинг — AWS; перевірка від ботів — Cloudflare Turnstile; листи підтвердження — Resend (після налаштування). Публічні заголовки новин можуть надсилатися Azure Translator для перекладу. Для окремих AI-функцій використовуються обрані постачальники моделей відповідно до доступних можливостей.':'Hosting uses AWS; bot verification uses Cloudflare Turnstile; verification emails use Resend once configured. Public news headlines may be sent to Azure Translator. Some AI features use the configured model providers for requested operations.'}</p>
 <h2>{uk?'Збереження та права':'Retention and your rights'}</h2>
 <p>{uk?'Непідтверджені реєстрації зберігаються тимчасово: код діє 15 хвилин, прострочені записи видаляються плановим очищенням. Інші дані зберігаються, доки потрібні для функцій і виконання законних обов’язків. Ви можете звернутися щодо доступу, виправлення, експорту або видалення своїх даних.':'Unverified registrations are temporary: codes expire after 15 minutes, and expired records are removed by scheduled cleanup. Other records are retained while needed to operate requested features and meet lawful obligations. You can request access, correction, export or deletion of your data.'}</p>
 <h2>{uk?'Контакт':'Contact'}</h2>
 <p>{contact?<a href={'mailto:'+contact}>{contact}</a>:(uk?'Контактну адресу необхідно налаштувати перед публічним запуском.':'A contact address must be configured before public launch.')}</p>
 <p><Link href={'/'+locale+'/terms'}>{uk?'Умови використання':'Terms of Use'}</Link></p>
 </article></PortalShell>;
}
