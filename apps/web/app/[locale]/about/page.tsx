import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../components/PortalShell';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../lib/brand';
import {indexRobots,publicIndexingEnabled,publicSiteOrigin} from '../../../lib/site-indexing';

type Props={params:Promise<{locale:string}>};
const COPY={
 uk:{
  title:'Про Galaxiora — астрологія Джйотіш, Таро й космічні практики',
  description:'Galaxiora — українсько-англійська платформа ведичної та західної астрології з натальними картами, Панчангою, Таро й навчальними матеріалами.',
  heading:'Galaxiora — простір астрології, Таро та щоденного пізнання',
  intro:'Galaxiora.com — офіційний сайт Galaxiora. Ми створюємо онлайн-простір для тих, хто досліджує Джйотіш, західну астрологію, символіку Таро, місячні цикли й духовні практики.',
  topics:[
   {h:'Астрологічні розрахунки',p:'GalaxiAstro будує натальну карту Джйотіш із положеннями планет, лагною, накшатрами, D1, D9, D10 та періодами Вімшоттарі. Для астрономічних розрахунків використовуємо Swiss Ephemeris і визначені налаштування сидеричного зодіаку. У гороскопах чітко відрізняємо західний знак Сонця від ведичного знака Місяця.'},
   {h:'Панчанга, Таро та практика',p:'Панчанга показує традиційні елементи ведичного календаря залежно від місця й часу. Розділ Таро пропонує класичну колоду з прямими та перевернутими значеннями; йога — доступні дихальні та усвідомлені практики.'},
   {h:'Знання, новини й спільнота',p:'Академія містить оригінальні уроки з прикладами й перевіркою знань. GalaxiNews допомагає відкривати матеріали зі світових джерел із посиланнями на авторів. GalaxiCom — місце для тематичного спілкування та запитань.'},
   {h:'Як ми працюємо з точністю',p:'Розраховані координати небесних тіл відокремлюємо від традиційного астрологічного тлумачення. Публікуємо методологію, обсяг проведених перевірок і джерела. Не видаємо духовні інтерпретації за експериментально підтверджені передбачення.'}
  ],
  methods:'Дізнатися про методологію й перевірки',
  chart:'Побудувати натальну карту',
  horoscope:'Дослідити гороскопи',
  lessons:'Відкрити Академію',
  scope:'Офіційний сайт: galaxiora.com. Мови інтерфейсу: українська та англійська.'
 },
 en:{
  title:'About Galaxiora — Jyotish Astrology, Tarot and Cosmic Practice',
  description:'Galaxiora is a bilingual astrology and Tarot platform with Vedic and Western birth charts, Panchanga, original lessons and mindful practices.',
  heading:'Galaxiora — astrology, Tarot and a place for daily discovery',
  intro:'Galaxiora.com is the official website of Galaxiora. We are building an online space for people exploring Jyotish, Western astrology, Tarot symbolism, lunar cycles and mindful spiritual practices.',
  topics:[
   {h:'Astrological calculations',p:'GalaxiAstro calculates Jyotish natal charts with planetary positions, Ascendant, nakshatras, D1, D9, D10 and Vimshottari periods. Astronomical computations use Swiss Ephemeris with defined sidereal settings. Our horoscopes distinguish the Western Sun sign from the Vedic Moon sign.'},
   {h:'Panchanga, Tarot and practice',p:'Panchanga presents traditional Vedic calendar factors for a selected place and time. Tarot offers a classical deck with upright and reversed meanings; Yoga provides accessible breathing and mindful movement practices.'},
   {h:'Learning, news and community',p:'The Academy hosts original lessons with examples and knowledge checks. GalaxiNews helps readers discover worldwide publishers with links to original sources. GalaxiCom brings together thematic discussions and questions.'},
   {h:'Our approach to accuracy',p:'We distinguish calculated celestial coordinates from traditional interpretations. Our methodology documents the scope of verification and underlying sources. Symbolic spiritual readings are not presented as experimentally established predictions.'}
  ],
  methods:'Read our methods and verification',
  chart:'Calculate a birth chart',
  horoscope:'Explore horoscopes',
  lessons:'Open the Academy',
  scope:'Official site: galaxiora.com. Interface languages: Ukrainian and English.'
 }
} as const;

export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 const content=COPY[locale];
 return {title:content.title,description:content.description,robots:indexRobots(),
  alternates:{canonical:'/'+locale+'/about',
   languages:{uk:'/uk/about',en:'/en/about','x-default':'/en/about'}},
  openGraph:{type:'website',siteName:'Galaxiora',title:content.title,
   description:content.description,url:'/'+locale+'/about',locale:locale==='uk'?'uk_UA':'en_US'}};
}
export default async function AboutPage({params}:Props){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 const copy=COPY[locale],origin=publicSiteOrigin();
 const jsonLd=publicIndexingEnabled()&&origin?JSON.stringify({
  '@context':'https://schema.org','@type':'AboutPage',
  name:copy.heading,url:origin+'/'+locale+'/about',inLanguage:locale,
  description:copy.description,about:{'@id':origin+'/#organization'}
 }).replace(/</g,'\\u003c'):null;
 return <PortalShell locale={locale as PortalLocale} languagePath="about">
  {jsonLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>}
  <article className="as-wellness as-academy-detail" style={{maxWidth:880,margin:'32px auto 72px'}}>
   <nav aria-label={locale==='uk'?'Навігація':'Breadcrumb'}>
    <Link href={'/'+locale}>{locale==='uk'?'Головна':'Home'}</Link> / {locale==='uk'?'Про Galaxiora':'About Galaxiora'}
   </nav>
   <header className="as-wellness-detail-head">
    <span className="as-overline">GALAXIORA.COM · OFFICIAL WEBSITE</span>
    <h1>{copy.heading}</h1><p>{copy.intro}</p>
   </header>
   {copy.topics.map(item=><section className="as-lesson-section" key={item.h}>
    <h2>{item.h}</h2><p>{item.p}</p>
   </section>)}
   <section className="as-lesson-section">
    <h2>{locale==='uk'?'Почніть знайомство':'Start exploring'}</h2>
    <p><Link href={'/'+locale+'/astrology/jyotish'}>{copy.chart}</Link></p>
    <p><Link href={'/'+locale+'/horoscope'}>{copy.horoscope}</Link></p>
    <p><Link href={'/'+locale+'/learn'}>{copy.lessons}</Link></p>
    <p><Link href={'/'+locale+'/methodology'}>{copy.methods}</Link></p>
   </section>
   <p><small>{copy.scope}</small></p>
  </article>
 </PortalShell>;
}
