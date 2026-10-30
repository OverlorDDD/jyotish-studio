import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {BRAND,isPortalLocale} from '../../../lib/brand';
import PortalShell from '../../components/PortalShell';

export const metadata:Metadata={title:'Terms of Use | Galaxiora',robots:{index:false,follow:true}};
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export default async function TermsPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 const uk=locale==='uk';
 const contact=process.env.NEXT_PUBLIC_SITE_CONTACT_EMAIL?.trim()||'';
 return <PortalShell locale={locale}><article className="as-subpage" style={{maxWidth:850,margin:'0 auto'}}>
 <h1>{uk?'Умови використання Galaxiora':'Galaxiora Terms of Use'}</h1>
 <p>{uk?'Оновлено: 30 жовтня 2026 року':'Updated: October 30, 2026'}</p>
 <h2>{uk?'Призначення сервісу':'About this service'}</h2>
 <p>{uk?'Galaxiora пропонує традиційні астрологічні інтерпретації, Таро, йогу, освітні матеріали, новини та дискусії. Інтерпретації є інформаційним і культурним матеріалом, а не медичними, юридичними чи фінансовими рекомендаціями.':'Galaxiora offers traditional astrology interpretations, Tarot, yoga, educational content, news and discussions. Interpretations are informational and cultural material, not medical, legal or financial advice.'}</p>
 <h2>{uk?'Акаунт і спільнота':'Accounts and community'}</h2>
 <p>{uk?'Під час реєстрації використовуйте власну поштову адресу й зберігайте пароль у таємниці. На форумі не публікуйте чужих персональних даних, спам, погрози, незаконний вміст чи матеріали, на які у вас немає прав. Адміністрація може модерувати дописи, щоб захистити учасників.':'Use your own email address and keep your password private. Do not post others’ personal data, spam, threats, unlawful content or material you lack rights to. Moderators may moderate posts to protect participants.'}</p>
 <h2>{uk?'Новини та авторські права':'News and copyright'}</h2>
 <p>{uk?'Посилання на оригінальні публікації ведуть до незалежних джерел. Авторські права на сторонні матеріали належать відповідним правовласникам. Не копіюйте та не публікуйте чужі матеріали без дозволу.':'Links to original publications lead to independent publishers. Third-party materials remain the property of their respective rights holders. Do not republish others’ content without permission.'}</p>
 <h2>{uk?'Доступність і зміни':'Availability and changes'}</h2>
 <p>{uk?'Сервіс може змінюватися або тимчасово бути недоступним через технічне обслуговування. У платних функціях, якщо вони з’являться, перед оплатою буде окремо показано умови й вартість.':'The service may change or be temporarily unavailable during maintenance. If paid services become available, terms and pricing will be shown before any payment.'}</p>
 <h2>{uk?'Контакт':'Contact'}</h2>
 <p>{contact?<a href={'mailto:'+contact}>{contact}</a>:(uk?'Контактну адресу буде додано перед публічним запуском.':'Contact details must be added before public launch.')}</p>
 <p><Link href={'/'+locale+'/privacy'}>{uk?'Політика конфіденційності':'Privacy Notice'}</Link></p>
 </article></PortalShell>;
}
