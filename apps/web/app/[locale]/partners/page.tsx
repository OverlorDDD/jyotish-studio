import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowRight,ArrowUpRight,BookOpen,ShieldCheck,Sparkles} from 'lucide-react';
import PartnerContactOptions from './PartnerContactOptions';
import PortalShell from '../../components/PortalShell';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../lib/brand';
import {indexRobots,publicIndexingEnabled,publicSiteOrigin} from '../../../lib/site-indexing';
import styles from './Partners.module.css';

type Props={params:Promise<{locale:string}>};

const COPY={
 en:{
  title:'Editorial Partnerships & Media Resources | Galaxiora',
  description:'Collaborate with Galaxiora on useful educational resources about Vedic astrology, Panchanga, Tarot and mindful practice. Information for editors and creators.',
  breadcrumb:'Partnerships',about:'About Galaxiora',
  eyebrow:'GALAXIORA / EDITORS & CREATORS',
  heading:'Good collaborations start with something worth sharing.',
  intro:'Galaxiora is a growing English- and Ukrainian-language project built by a small team of friends. We create free tools and original educational resources around Jyotish, Panchanga, Tarot and mindful practice. We welcome thoughtful, reader-first collaborations with independent publishers and educators.',
  heroPill:'Editorial collaborations · Educational resources · Independent creators',
  explore:'Explore resources',contact:'Discuss a collaboration',contactProfile:'Find our contact details',
  note:'No paid placement or guaranteed link exchange is offered on this page.',
  whoEyebrow:'01 / THE PROJECT',whoHeading:'What is Galaxiora?',
  who:'We combine astronomical calculations with accessible guides for people exploring spiritual traditions. Our methods explain what is calculated and where symbolic interpretation begins. Resources are available in English and Ukrainian.',
  source:'Our calculation methodology',introPage:'More about the project',
  resourcesEyebrow:'02 / USEFUL FOR YOUR READERS',resourcesHeading:'Resources you can explore and reference',
  resourcesLead:'Please try the relevant page before mentioning it. Link directly to the tool or guide that best fits your article—not just to our homepage.',
  resources:[
   {title:'Panchanga by city',tag:'VEDIC CALENDAR',text:'Explore Tithi, Nakshatra, Yoga, Karana and other traditional day factors for a selected location.',path:'panchanga'},
   {title:'Free Jyotish birth chart',tag:'VEDIC ASTROLOGY',text:'Calculate a natal chart with divisional views and learn how birth details affect the result.',path:'astrology/jyotish'},
   {title:'Tarot card meanings',tag:'TAROT',text:'Browse the symbolism and upright or reversed meanings of a classic 78-card deck.',path:'tarot/cards'},
   {title:'Yoga & mindful practice',tag:'MINDFULNESS',text:'Explore gentle breathing practices and introductory routines, without promises of medical outcomes.',path:'yoga'},
   {title:'GalaxiPedia guides',tag:'LEARNING',text:'Read original explanations of Jyotish concepts, lunar calendars, Tarot and astronomy.',path:'pedia'}
  ],
  ideasEyebrow:'03 / WAYS TO WORK TOGETHER',ideasHeading:'Ideas for meaningful collaboration',
  ideas:[
   {title:'Editorial resource mention',text:'A contextual link to a useful calculator, guide or calendar in a relevant article or newsletter, at the publisher’s discretion.'},
   {title:'Educational walkthrough or Q&A',text:'An original, clearly attributed explanation of a Panchanga factor, a chart calculation or Tarot symbolism, adapted to your audience.'},
   {title:'Independent resource discovery',text:'Share a genuinely helpful guide of your own for possible editorial consideration in GalaxiPedia. Inclusion is never automatic or conditional on linking to us.'}
  ],
  kitEyebrow:'04 / PRESS & MEDIA',kitHeading:'Ready-to-use introduction',
  kitLead:'Editors may adapt this short factual description after reviewing the linked pages:',
  short:'Galaxiora is a bilingual platform for exploring Vedic astrology, a location-aware Panchanga calendar, Tarot symbolism and mindful practices. It combines free public learning resources with astronomical calculations and explains the difference between computed data and traditional interpretation.',
  attribution:'Please credit Galaxiora and link to the most relevant public page. For methodology or technical claims, check the current verification notes.',
  guidelinesEyebrow:'05 / EDITORIAL PRINCIPLES',guidelinesHeading:'Transparent, independent and reader-first',
  principles:[
   'We do not promise backlinks, reciprocal placements or guaranteed coverage.',
   'Publishers retain editorial independence; we review factual descriptions of our own tools, not third-party opinions.',
   'Paid or sponsored content, if ever agreed separately, must be clearly disclosed and linked appropriately.',
   'We do not present spiritual interpretations as experimentally verified predictions.'
  ],
  reachEyebrow:'06 / GET IN TOUCH',reachHeading:'Have a thoughtful idea?',
  reach:'Tell us what you publish, which Galaxiora tool fits your audience, and the kind of article, interview or resource you have in mind. Include a link to your site or a representative piece of work.',
  contactDetail:'We review relevant suggestions individually. A message does not guarantee publication or a backlink.',
  contactFallback:'The lead developer’s public profile includes contact details.',
  browse:'Browse the project'
 },
 uk:{
  title:'Співпраця з редакціями та медіаматеріали | Galaxiora',
  description:'Співпраця з Galaxiora для редакторів, авторів і викладачів: корисні матеріали про Джйотіш, Панчангу, Таро й усвідомлені практики.',
  breadcrumb:'Співпраця',about:'Про Galaxiora',
  eyebrow:'GALAXIORA / РЕДАКЦІЯМ ТА АВТОРАМ',
  heading:'Хороша співпраця починається з матеріалу, яким варто поділитися.',
  intro:'Galaxiora — молодий українсько-англомовний проєкт невеликої команди друзів. Ми створюємо безкоштовні інструменти та оригінальні навчальні матеріали про Джйотіш, Панчангу, Таро й усвідомлені практики. Відкриті до змістовної співпраці з редакціями, викладачами та незалежними авторами.',
  heroPill:'Редакційні матеріали · Освітні ресурси · Незалежні автори',
  explore:'Переглянути ресурси',contact:'Обговорити співпрацю',contactProfile:'Знайти контакти',
  note:'Ця сторінка не пропонує платних розміщень або гарантованого обміну посиланнями.',
  whoEyebrow:'01 / ПРО ПРОЄКТ',whoHeading:'Що таке Galaxiora?',
  who:'Ми поєднуємо астрономічні розрахунки зі зрозумілими довідниками для дослідження духовних традицій. Пояснюємо, що саме обчислюється, а де починається символічне тлумачення. Матеріали доступні українською та англійською.',
  source:'Методологія обчислень',introPage:'Дізнатися про проєкт',
  resourcesEyebrow:'02 / ДЛЯ ВАШИХ ЧИТАЧІВ',resourcesHeading:'Ресурси, які варто спробувати й рекомендувати',
  resourcesLead:'Перед згадкою радимо переглянути відповідну сторінку. Посилайтеся на конкретний інструмент чи довідник, який допоможе читачеві, а не просто на головну.',
  resources:[
   {title:'Панчанга для міста',tag:'ВЕДИЧНИЙ КАЛЕНДАР',text:'Тітхі, накшатра, йога, карана та інші елементи традиційного календаря для обраного місця.',path:'panchanga'},
   {title:'Безкоштовна натальна карта Джйотіш',tag:'ВЕДИЧНА АСТРОЛОГІЯ',text:'Розрахунок натальної карти з дробовими картами та поясненнями впливу вихідних даних.',path:'astrology/jyotish'},
   {title:'Значення карт Таро',tag:'ТАРО',text:'Символіка класичної колоди з 78 картами, прямі та перевернуті значення.',path:'tarot/cards'},
   {title:'Йога й усвідомлені практики',tag:'УСВІДОМЛЕНІСТЬ',text:'Доступні дихальні вправи та короткі практики без обіцянок лікувальних результатів.',path:'yoga'},
   {title:'Довідники GalaxiPedia',tag:'ОСВІТА',text:'Авторські пояснення Джйотіш, місячних календарів, Таро й астрономії.',path:'pedia'}
  ],
  ideasEyebrow:'03 / ФОРМАТИ СПІВПРАЦІ',ideasHeading:'Ідеї для змістовної співпраці',
  ideas:[
   {title:'Редакційна згадка ресурсу',text:'Доречне посилання на калькулятор, довідник або календар у статті чи розсилці — виключно за рішенням редактора.'},
   {title:'Навчальний матеріал або інтерв’ю',text:'Оригінальне пояснення одного елемента Панчанги, астрологічного розрахунку чи символіки Таро з належним зазначенням джерел.'},
   {title:'Незалежний огляд корисних джерел',text:'Ви можете запропонувати власний якісний матеріал для редакційного розгляду в GalaxiPedia. Публікацію не гарантуємо й не ставимо її умовою посилання на нас.'}
  ],
  kitEyebrow:'04 / МЕДІАМАТЕРІАЛИ',kitHeading:'Короткий опис для редакції',
  kitLead:'Редактори можуть адаптувати цей фактологічний опис після перевірки сторінок:',
  short:'Galaxiora — двомовна платформа для дослідження ведичної астрології, Панчанги для конкретного міста, символіки Таро та усвідомлених практик. Вона поєднує відкриті навчальні матеріали з астрономічними розрахунками й пояснює різницю між обчисленими даними та традиційним тлумаченням.',
  attribution:'Зазначайте Galaxiora як джерело й ведіть читача на найбільш доречну сторінку. Для технічних тверджень перевіряйте актуальну методологію.',
  guidelinesEyebrow:'05 / РЕДАКЦІЙНІ ПРИНЦИПИ',guidelinesHeading:'Прозоро, незалежно й із повагою до читача',
  principles:[
   'Ми не гарантуємо зворотні посилання, взаємні публікації чи висвітлення.',
   'Редактори зберігають незалежність; ми можемо звірити лише фактичний опис власних інструментів.',
   'Якщо окремо погоджується спонсорований матеріал, його потрібно позначати та коректно оформлювати посилання.',
   'Духовні тлумачення не подаємо як експериментально доведені передбачення.'
  ],
  reachEyebrow:'06 / ЗВ’ЯЗОК',reachHeading:'Маєте цікаву ідею?',
  reach:'Розкажіть, що ви публікуєте, який інструмент Galaxiora цікавий вашій аудиторії та який формат статті, розмови чи навчального матеріалу пропонуєте. Додайте посилання на свій ресурс або приклад роботи.',
  contactDetail:'Ми розглядаємо релевантні пропозиції індивідуально. Звернення не гарантує публікації чи зворотного посилання.',
  contactFallback:'Контактні дані є у відкритому профілі провідного розробника.',
  browse:'Переглянути проєкт'
 }
} as const;

export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}

export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 const c=COPY[locale],path='/'+locale+'/partners';
 return {
  title:c.title,description:c.description,robots:indexRobots(),
  alternates:{canonical:path,languages:{en:'/en/partners',uk:'/uk/partners','x-default':'/en/partners'}},
  openGraph:{type:'website',siteName:'Galaxiora',title:c.title,description:c.description,
   url:path,locale:locale==='uk'?'uk_UA':'en_US',images:['/opengraph-image']}
 };
}

export default async function PartnersPage({params}:Props){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 const loc=locale as PortalLocale,c=COPY[loc],origin=publicSiteOrigin();
 const publicContact=process.env.NEXT_PUBLIC_SITE_CONTACT_EMAIL?.trim()||'support@galaxiora.com';
 const jsonLd=publicIndexingEnabled()&&origin?JSON.stringify([
  {'@context':'https://schema.org','@type':'WebPage','@id':origin+'/'+loc+'/partners#webpage',
   name:c.heading,url:origin+'/'+loc+'/partners',description:c.description,inLanguage:loc,
   isPartOf:{'@type':'WebSite',url:origin,name:'Galaxiora'}},
  {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
   {'@type':'ListItem',position:1,name:c.about,item:origin+'/'+loc+'/about'},
   {'@type':'ListItem',position:2,name:c.breadcrumb,item:origin+'/'+loc+'/partners'}
  ]}
 ]).replace(/</g,'\\u003c'):null;
 return <PortalShell locale={loc} languagePath="partners">
  {jsonLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>}
  <article className={styles.page}>
   <nav className={styles.breadcrumbs} aria-label={loc==='uk'?'Навігація':'Breadcrumb'}>
    <Link href={'/'+loc+'/about'}>{c.about}</Link><span aria-hidden="true">/</span><span aria-current="page">{c.breadcrumb}</span>
   </nav>
   <header className={styles.hero}>
    <div className={styles.heroCopy}>
     <span className={styles.eyebrow}><Sparkles size={15} aria-hidden="true"/>{c.eyebrow}</span>
     <h1>{c.heading}</h1>
     <p className={styles.heroLead}>{c.intro}</p>
     <div className={styles.actions}>
      <a className={styles.primaryAction} href="#resources">{c.explore}<ArrowRight size={18} aria-hidden="true"/></a>
      <a className={styles.secondaryAction} href="#contact">{c.contact}<ArrowRight size={18} aria-hidden="true"/></a>
     </div>
    </div>
    <aside className={styles.heroAside}>
     <span className={styles.brandName}>Galaxiora</span>
     <span className={styles.brandDescription}>{c.heroPill}</span>
     <span className={styles.orbit} aria-hidden="true">✦</span>
     <p>{c.note}</p>
    </aside>
   </header>

   <section className={styles.introPanel} aria-labelledby="partners-who">
    <div>
     <span className={styles.sectionEyebrow}>{c.whoEyebrow}</span>
     <h2 id="partners-who">{c.whoHeading}</h2>
     <p>{c.who}</p>
    </div>
    <div className={styles.introLinks}>
     <Link href={'/'+loc+'/about'}>{c.introPage}<ArrowUpRight size={16} aria-hidden="true"/></Link>
     <Link href={'/'+loc+'/methodology'}>{c.source}<ArrowUpRight size={16} aria-hidden="true"/></Link>
    </div>
   </section>

   <section id="resources" className={styles.section} aria-labelledby="partners-resources">
    <span className={styles.sectionEyebrow}>{c.resourcesEyebrow}</span>
    <h2 id="partners-resources">{c.resourcesHeading}</h2>
    <p className={styles.sectionLead}>{c.resourcesLead}</p>
    <div className={styles.resources}>
     {c.resources.map(resource=><Link className={styles.resourceCard} href={'/'+loc+'/'+resource.path} key={resource.path}>
      <span className={styles.cardTag}>{resource.tag}</span>
      <h3>{resource.title}<ArrowUpRight size={18} aria-hidden="true"/></h3>
      <p>{resource.text}</p>
     </Link>)}
    </div>
   </section>

   <section className={styles.section} aria-labelledby="partners-ideas">
    <span className={styles.sectionEyebrow}>{c.ideasEyebrow}</span>
    <h2 id="partners-ideas">{c.ideasHeading}</h2>
    <div className={styles.ideas}>
     {c.ideas.map((idea,i)=><div className={styles.idea} key={idea.title}>
      <span className={styles.ideaNumber}>0{i+1}</span>
      <div><h3>{idea.title}</h3><p>{idea.text}</p></div>
     </div>)}
    </div>
   </section>

   <section className={styles.editorial} aria-labelledby="partners-kit">
    <div className={styles.editorialIntro}>
     <span className={styles.sectionEyebrow}>{c.kitEyebrow}</span>
     <h2 id="partners-kit">{c.kitHeading}</h2>
     <p>{c.kitLead}</p>
    </div>
    <blockquote className={styles.pressQuote}>
     <BookOpen size={25} aria-hidden="true"/>
     <p>{c.short}</p>
    </blockquote>
    <p className={styles.attribution}>{c.attribution}</p>
   </section>

   <section className={styles.section} aria-labelledby="partners-principles">
    <span className={styles.sectionEyebrow}>{c.guidelinesEyebrow}</span>
    <h2 id="partners-principles">{c.guidelinesHeading}</h2>
    <ul className={styles.principles}>
     {c.principles.map(principle=><li key={principle}><ShieldCheck size={19} aria-hidden="true"/><span>{principle}</span></li>)}
    </ul>
   </section>

   <section id="contact" className={styles.contact} aria-labelledby="partners-contact">
    <span className={styles.sectionEyebrow}>{c.reachEyebrow}</span>
    <h2 id="partners-contact">{c.reachHeading}</h2>
    <p>{c.reach}</p>
    <PartnerContactOptions locale={loc} email={publicContact}/>
    <div className={styles.contactActions}>
     <Link href={'/'+loc+'/about'} className={styles.secondaryAction}>{c.browse}<ArrowRight size={18} aria-hidden="true"/></Link>
    </div>
    <p className={styles.contactDetail}>{c.contactDetail}</p>
   </section>
  </article>
 </PortalShell>;
}
