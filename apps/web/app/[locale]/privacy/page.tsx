import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {BRAND,isPortalLocale} from '../../../lib/brand';
import PortalShell from '../../components/PortalShell';
import AnalyticsPreferences from '../../components/AnalyticsPreferences';

export const metadata:Metadata={title:'Privacy | Galaxiora',robots:{index:false,follow:true}};
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export default async function PrivacyPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 const uk=locale==='uk';
 const contact=process.env.NEXT_PUBLIC_SITE_CONTACT_EMAIL?.trim()||'';
 return <PortalShell locale={locale}><article className="as-subpage" style={{maxWidth:850,margin:'0 auto'}}>
 <h1>{uk?'Конфіденційність Galaxiora':'Galaxiora Privacy Notice'}</h1>
 <p>{uk?'Оновлено: 1 листопада 2026 року':'Updated: November 1, 2026'}</p>
 <h2>{uk?'Про сервіс та зворотний зв’язок':'Service and contact'}</h2>
 <p>{uk?'Galaxiora — назва цього онлайн-сервісу. Для запитань щодо конфіденційності, доступу до даних або їх видалення звертайтеся:':'Galaxiora is the name of this online service. For privacy questions and requests to access or erase your data, contact:'}
 {' '}<a href={'mailto:'+(contact||'support@galaxiora.com')}>{contact||'support@galaxiora.com'}</a></p>
 <h2>{uk?'Які дані ми обробляємо':'Data we process'}</h2>
 <p>{uk?'Для акаунта: email, захищений хеш пароля і сесійний cookie. Якщо ви користуєтеся персональними інструментами: дані народження й натальні карти, збережені результати, нотатки та реакції на новини. У форумі: ваші повідомлення, скарги й налаштування профілю.':'For accounts: email, a secure password hash and a session cookie. If you use personal features: birth details and charts, saved readings, notes and news reactions. In the forum: messages, reports and profile settings.'}</p>
 <h2>{uk?'Мета обробки':'Why we process it'}</h2>
 <p>{uk?'Щоб надати обрані функції, захистити акаунти, модерувати спільноту та підтримувати працездатність сервісу. Дані натальної карти є особистими: не публікуйте їх у відкритому форумі.':'To provide requested features, secure accounts, moderate the community and keep the service functioning. Birth-chart data is personal: do not post it in the public forum.'}</p>
 <h2>{uk?'Сторонні сервіси':'Third-party services'}</h2>
 <p>{uk?'Хостинг — AWS; перевірка від ботів — Cloudflare Turnstile; листи підтвердження — Resend (після налаштування). Публічні заголовки новин можуть надсилатися Azure Translator для перекладу. Для окремих AI-функцій використовуються обрані постачальники моделей відповідно до доступних можливостей.':'Hosting uses AWS; bot verification uses Cloudflare Turnstile; verification emails use Resend once configured. Public news headlines may be sent to Azure Translator. Some AI features use the configured model providers for requested operations.'}</p>
 <h2>{uk?'Необов’язкова аналітика':'Optional growth analytics'}</h2>
 <p>{uk?'Google Analytics 4 підключається лише після вашого явного дозволу й лише якщо адміністратор увімкнув аналітику. Якщо ви відмовилися, аналітичний скрипт не завантажується. Вимірюємо відвідування публічних сторінок та узагальнені переходи від статей до інструментів. URL особистих кабінетів, текст розкладів, дата й час народження, координати, адреса email та питання не передаються як аналітичні події. За замовчуванням Google Analytics вимкнено, а вибір не запитується у спливаючому вікні. Надати або відкликати дозвіл можна нижче на цій сторінці. Вибір зберігається локально у браузері.':'Google Analytics 4 loads only after you actively consent and only if the site operator has enabled analytics. Declining blocks the analytics script. We measure public page visits and coarse article-to-tool navigation. Private URLs, reading questions, birth dates/times, coordinates and email addresses are never sent as analytics events. Google Analytics is off by default and we do not display a pop-up consent prompt. You can opt in or withdraw below on this page. Your choice is stored locally in your browser.'}</p>
 <p>{uk?'Google може обробляти мережеві метадані відповідно до власної політики. Аналітика необов’язкова, відмова не обмежує доступ. Налаштування згоди на аналітику не дозволяє рекламну персоналізацію.':'Google may process network metadata under its own privacy policy. Analytics is optional and declining does not restrict site functionality. Analytics consent does not grant permission for advertising personalization.'}</p>
 <AnalyticsPreferences locale={locale as 'en'|'uk'}/>
 <h2>{uk?'Збереження та права':'Retention and your rights'}</h2>
 <p>{uk?'Непідтверджені реєстрації зберігаються тимчасово: код діє 15 хвилин, прострочені записи видаляються плановим очищенням. Інші дані зберігаються, доки потрібні для функцій і виконання законних обов’язків. Ви можете звернутися щодо доступу, виправлення, експорту або видалення своїх даних.':'Unverified registrations are temporary: codes expire after 15 minutes, and expired records are removed by scheduled cleanup. Other records are retained while needed to operate requested features and meet lawful obligations. You can request access, correction, export or deletion of your data.'}</p>
 <h2>{uk?'Контакт':'Contact'}</h2>
 <p>{contact?<a href={'mailto:'+contact}>{contact}</a>:(uk?'Контактну адресу необхідно налаштувати перед публічним запуском.':'A contact address must be configured before public launch.')}</p>
 <p><Link href={'/'+locale+'/terms'}>{uk?'Умови використання':'Terms of Use'}</Link></p>
 </article></PortalShell>;
}
