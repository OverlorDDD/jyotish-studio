import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../../components/PortalShell';
import ShareTools from '../../../components/ShareTools';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../../lib/brand';
import {indexRobots,publicIndexingEnabled,publicSiteOrigin} from '../../../../lib/site-indexing';

type Props={params:Promise<{locale:string}>};
type Text={uk:string;en:string};
const ECLIPSES_2027=[
 {date:'2027-02-06',kind:'solar-annular',name:{uk:'Кільцеподібне сонячне затемнення',en:'Annular solar eclipse'},where:{uk:'Смуга кільцеподібної фази проходить через частини Південної Америки й Африки. Часткову фазу видно на значно ширшій території.',en:'The annular path crosses parts of South America and Africa; a partial eclipse is visible across a much wider area.'},context:{uk:'Місяць проходить перед Сонцем, але його видимий диск менший, тому біля максимуму залишається світле кільце.',en:'The Moon crosses the Sun, but its apparent disk is smaller, leaving a ring of sunlight near maximum eclipse.'}},
 {date:'2027-02-20',kind:'lunar-penumbral',name:{uk:'Напівтіньове місячне затемнення',en:'Penumbral lunar eclipse'},where:{uk:'За картою NASA явище можна спостерігати з частини Америк, Європи, Африки, Азії, Австралії й Антарктиди, залежно від місцевого часу.',en:'NASA lists visibility across parts of the Americas, Europe, Africa, Asia, Australia and Antarctica, subject to local nighttime.'},context:{uk:'Місяць входить до напівтіні Землі. Потемніння може бути слабким і не завжди помітним неозброєним оком.',en:'The Moon passes through Earth’s penumbra. The resulting dimming can be subtle and hard to notice.'}},
 {date:'2027-07-18',kind:'lunar-penumbral',name:{uk:'Слабке напівтіньове місячне затемнення',en:'Faint penumbral lunar eclipse'},where:{uk:'Надзвичайно слабке явище, відзначене в каталозі NASA. Місцева видимість і календарна дата потребують перевірки для обраного міста.',en:'A very slight event listed in the NASA catalog. Local visibility and the calendar date require checking for the observer’s location.'},context:{uk:'Проходження Місяця через край напівтіні Землі може майже не давати помітного затемнення. Не слід очікувати виразного «кривавого Місяця».',en:'The Moon grazes Earth’s penumbra, with little or no obvious darkening. Do not expect a dramatic blood-red Moon.'}},
 {date:'2027-08-02',kind:'solar-total',name:{uk:'Повне сонячне затемнення',en:'Total solar eclipse'},where:{uk:'Смуга повної фази проходить через південь Іспанії, Північну Африку та частини Близького Сходу. У значно ширшому регіоні видно часткову фазу.',en:'The totality path passes through southern Spain, North Africa and parts of the Middle East. A partial phase is visible across a much larger region.'},context:{uk:'У вузькій смузі Місяць повністю закриє видимий диск Сонця. Поза нею, навіть якщо затемнення видно, фаза залишається частковою.',en:'Within a narrow path the Moon completely covers the Sun’s apparent disk. Outside that path, a visible eclipse remains partial.'}},
 {date:'2027-08-17',kind:'lunar-penumbral',name:{uk:'Напівтіньове місячне затемнення',en:'Penumbral lunar eclipse'},where:{uk:'Може бути помітним із частин Америк, Західної Європи, Африки, Австралії, Нової Зеландії та Азії — залежно від часу й горизонту.',en:'Visibility extends across parts of the Americas, western Europe, Africa, Australia, New Zealand and Asia, depending on local nighttime.'},context:{uk:'Місяць проходить через зовнішню область земної тіні. Це не повне й не часткове тіньове затемнення.',en:'The Moon moves through the outer part of Earth’s shadow, not into the darker umbra of a total or partial umbral lunar eclipse.'}}
] as const;
const T={
 uk:{title:'Затемнення 2027 року: календар Сонця й Місяця',description:'Усі п’ять затемнень 2027 року за каталогом NASA: 2 сонячні та 3 місячні, дати UTC, типи, зони видимості й пояснення.',h1:'Затемнення 2027: повний астрономічний календар',intro:'У 2027 році каталог NASA містить два сонячні й три місячні затемнення. Тут наведено дати за UTC та фізичний тип кожного явища. Це календар астрономічних подій, не прогноз особистих подій.',date:'Дата в каталозі NASA (UTC)',where:'Де шукати явище',meaning:'Що відбувається на небі',source:'Первинні джерела й точність',notice:'Дата за місцевим календарем може відрізнятися від дати UTC. Для конкретної точки спостереження потрібні карта видимості, часовий пояс і час сходу/заходу світила. Панчанга Galaxiora розраховує місцевий календар, але сама по собі не підтверджує видимість конкретного затемнення.',safety:'Ніколи не дивись безпосередньо на Сонце під час часткового або кільцеподібного затемнення без належного сертифікованого захисту для очей. Звичайні темні окуляри не підходять. Для місячних затемнень спеціальні окуляри не потрібні.',tradition:'Традиційне тлумачення й астрономічні факти',traditionText:'У Джйотіш сонячні й місячні затемнення мають власне ритуальне та символічне значення. Водночас точно обчислена фаза не є доказом конкретного прогнозу для людини. Для роботи з традиційним календарем обери власне місто у Панчанзі, а для спостереження користуйся картою NASA.',panchanga:'Відкрити Панчангу для свого міста',home:'Головна',back:'Панчанга'},
 en:{title:'Eclipses 2027: Complete Solar and Lunar Calendar',description:'All five 2027 eclipses from the NASA catalog: two solar and three lunar, UTC dates, types, visibility regions and explanations.',h1:'2027 eclipses: the solar and lunar calendar',intro:'NASA catalogues two solar and three lunar eclipses in 2027. This calendar provides the UTC date and physical type of each event. It is an astronomical calendar, not a personal prediction.',date:'NASA catalog date (UTC)',where:'Where to look',meaning:'What happens in the sky',source:'Primary sources and accuracy',notice:'A local civil date may differ from the UTC catalog date. Visibility for any observing site needs a visibility map, local time zone and the rising/setting of the relevant body. Galaxiora Panchanga calculates a local calendar but alone does not establish whether an eclipse is visible at your location.',safety:'Never look directly at the Sun during a partial or annular eclipse without proper certified solar viewing protection. Ordinary sunglasses are not safe. Lunar eclipses need no special viewing glasses.',tradition:'Traditional interpretation and astronomical facts',traditionText:'In Jyotish, solar and lunar eclipses carry ritual and symbolic significance. A precisely computed eclipse is not evidence of a particular prediction for an individual. Use Panchanga for your local traditional calendar and a NASA visibility map for observing.',panchanga:'Open Panchanga for your city',home:'Home',back:'Panchanga'}
} as const;
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;if(!isPortalLocale(locale))return {};
 const t=T[locale],url='/'+locale+'/eclipses/2027';
 return {title:t.title+' | Galaxiora',description:t.description,robots:indexRobots(),
  alternates:{canonical:url,languages:{uk:'/uk/eclipses/2027',en:'/en/eclipses/2027','x-default':'/en/eclipses/2027'}},
  openGraph:{type:'article',siteName:'Galaxiora',title:t.title,description:t.description,url,locale:locale==='uk'?'uk_UA':'en_US'}};
}
export default async function EclipseCalendar2027({params}:Props){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 const loc=locale as PortalLocale,t=T[loc],base=publicSiteOrigin(),url='/'+loc+'/eclipses/2027';
 const crumbs=publicIndexingEnabled()&&base?JSON.stringify({
  '@context':'https://schema.org','@type':'BreadcrumbList',
  itemListElement:[
   {'@type':'ListItem',position:1,name:t.home,item:base+'/'+loc},
   {'@type':'ListItem',position:2,name:t.back,item:base+'/'+loc+'/panchanga'},
   {'@type':'ListItem',position:3,name:t.h1,item:base+url}
  ]
 }).replace(/</g,'\\u003c'):null;
 return <PortalShell locale={loc} active="panchanga" languagePath="eclipses/2027">
  {crumbs&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:crumbs}}/>}
  <article className="as-wellness as-academy-detail" data-testid="eclipse-calendar-2027">
   <ShareTools locale={loc} title={t.h1} path={url}/>

   <nav aria-label={loc==='uk'?'Навігація':'Breadcrumb'}><Link href={'/'+loc}>{t.home}</Link> / <Link href={'/'+loc+'/panchanga'}>{t.back}</Link> / 2027</nav>
   <header className="as-wellness-detail-head" style={{marginTop:30}}>
    <span className="as-overline">GALAXIORA · ASTRONOMICAL CALENDAR · NASA GSFC</span>
    <h1>{t.h1}</h1><p>{t.intro}</p>
   </header>
   <div className="as-lesson-sections">{ECLIPSES_2027.map(event=><section className="as-lesson-section" key={event.date}>
    <span className="as-overline">{t.date}: <time dateTime={event.date}>{event.date}</time></span>
    <h2>{event.name[loc]}</h2>
    <h3>{t.meaning}</h3><p>{event.context[loc]}</p>
    <h3>{t.where}</h3><p>{event.where[loc]}</p>
   </section>)}</div>
   <section className="as-lesson-section">
    <h2>{t.source}</h2><p>{t.notice}</p>
    <p>{t.safety}</p>
    <p><a href="https://eclipse.gsfc.nasa.gov/OH/OH2027.html" rel="noopener noreferrer" target="_blank">NASA Goddard Space Flight Center — Eclipses During 2027</a></p>
    <p><a href="https://science.nasa.gov/eclipses/future-eclipses/" rel="noopener noreferrer" target="_blank">NASA Science — Future Eclipses and Visibility</a></p>
   </section>
   <section className="as-lesson-section">
    <h2>{t.tradition}</h2><p>{t.traditionText}</p>
    <p><Link href={'/'+loc+'/panchanga'}>{t.panchanga}</Link></p>
    <p><Link href={'/'+loc+'/methodology'}>{loc==='uk'?'Методологія Galaxiora':'Galaxiora methodology'}</Link></p>
   </section>
  </article>
 </PortalShell>;
}
