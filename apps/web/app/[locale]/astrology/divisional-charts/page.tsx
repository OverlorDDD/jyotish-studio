import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../../components/PortalShell';
import {isPortalLocale} from '../../../../lib/brand';
import {indexRobots,publicIndexingEnabled,publicSiteOrigin} from '../../../../lib/site-indexing';
import {SHODASHAVARGA} from '../../../../lib/shodashavarga-content';
import styles from './DivisionalCharts.module.css';

type Locale='uk'|'en';
type Props={params:Promise<{locale:string}>};
const PATH='astrology/divisional-charts';
const COPY={
 en:{
  title:'16 Vedic Divisional Charts (D1–D60) | Galaxiora',
  desc:'Explore all 16 Shodashavarga charts from D1 Rashi to D60 Shashtiamsa, their traditional themes, birth-time limits and Galaxiora calculation methodology.',
  eyebrow:'GALAXIORA · SHODASHAVARGA',
  h1:'All 16 Vedic divisional charts, D1 to D60',
  intro:'One birth moment, sixteen traditional ways to examine it. A varga remaps a planet’s sidereal position within a zodiac sign to a finer chart. Start with D1, then compare the specialist chart for the question you actually have.',
  action:'Calculate my 16 charts for free',
  start:'What are the 16 Shodashavarga charts?',
  startText:'The classical set is D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45 and D60. These are divisions of the same planetary longitudes, not sixteen independently observed skies or sixteen guaranteed forecasts.',
  methodology:'How accurate are the calculations?',
  methodText:'Galaxiora computes a Lahiri sidereal D1 with Swiss Ephemeris, then derives 15 Shodashavarga charts under pinned Parashari rules, including the Sun/Moon Hora method for D2 and unequal divisions for D30. Those 15 charts are checked for internal consistency against the server-derived D1. The independent JQA-3 reference checks are narrower and do not certify all vargas for each visitor.',
  status:'Evidence and D60 limits',
  statusText:'D60 is displayed as a separate provisional symbolic reference. The D60 calculation at a pinned longitude has method comparisons, but a birth time rounded to the nearest minute does not establish a stable D60 Ascendant or house structure. Never interpret its provisional houses as independently verified for an individual birth.',
  table:'Explore each of the 16 charts',
  purpose:'Traditional theme',
  question:'A question this chart helps examine',
  all:'Back to all 16 charts',
  chart:'D',
  use:'Open the actual calculator',
  quality:'Input quality',
  qualityText:'All results depend on the date, local birth time, historical time zone and location. Fine divisions can change at boundaries. If your birth time is uncertain, compare the sensitivity of the derived Ascendant and read every varga in context with D1.',
  next:'Read the calculation methodology',
  link:'Start the 16-chart explorer',
  faq:'Common questions',
  q1:'Does this site calculate only D9 and D10?',
  a1:'No. Galaxiora provides all sixteen traditional divisions: D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45 and D60. D60 is provisional for individual birth-time-sensitive interpretations.',
  q2:'Is D60 independently certified for my time of birth?',
  a2:'No. The D60 symbolic formula has been checked for pinned input longitudes, but its natal Ascendant and houses are not certified stable across a realistic birth-time interval. An exact-looking clock time does not remove that limit.',
  q3:'Can I get a chart without paying or signing up?',
  a3:'The public birth-chart calculation is free and can be started without signing up. Enter a date, local birth time and place, calculate, then select the division you want in the 16-chart explorer.',
  warning:'Provisional: D60 birth-time-sensitive positions',
  stable:'Internally checked N4 division',
  note:'Astrological meanings are traditional interpretations, not scientifically established predictions. Astronomical coordinates and mathematical chart division are separate from interpretation.'
 },
 uk:{
  title:'16 дробових карт Джйотіш (D1–D60) | Galaxiora',
  desc:'Усі 16 класичних карт Шодашаварги — від D1 Раші до D60 Шаштіамші. Традиційні теми, точність часу народження й методологія Galaxiora.',
  eyebrow:'GALAXIORA · ШОДАШАВАРГА',
  h1:'Усі 16 дробових карт Джйотіш — від D1 до D60',
  intro:'Один момент народження — шістнадцять традиційних способів його розглянути. Варга перетворює сидеричне положення планети в знаку на тоншу карту. Починай із D1, а потім порівнюй тематичні карти з основною.',
  action:'Безкоштовно розрахувати всі 16 карт',
  start:'Які 16 карт входять до Шодашаварги?',
  startText:'Класичний набір: D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45 і D60. Це поділи тих самих довгот планет, а не шістнадцять незалежних спостережень неба чи гарантованих прогнозів.',
  methodology:'Наскільки точні розрахунки?',
  methodText:'Galaxiora обчислює сидеричну D1 з аянамшею Лагірі за Swiss Ephemeris, а потім отримує 15 варг за зафіксованими правилами Парашарі, зокрема Сонячною/Місячною Хорою для D2 і нерівними частинами D30. Ці 15 карт проходять внутрішню перевірку відповідності серверній D1. Незалежні перевірки JQA-3 мають вужчу область і не сертифікують кожну варгу для кожного відвідувача.',
  status:'Докази та обмеження D60',
  statusText:'D60 показана як окрема попередня символічна карта. Формулу звірено для зафіксованих довгот, але час народження, округлений до хвилини, не доводить стабільності її Лагни або домів. Не трактуй ці попередні доми як незалежно перевірені для конкретного народження.',
  table:'Досліди всі 16 карт',
  purpose:'Традиційна тема',
  question:'Запитання, яке допомагає розглянути карта',
  all:'Повернутися до 16 карт',
  chart:'D',
  use:'Відкрити справжній калькулятор',
  quality:'Точність вихідних даних',
  qualityText:'На результат впливають дата, місцевий час народження, історичний часовий пояс і координати. Тонкі поділи змінюються біля меж. Якщо час приблизний, перевір чутливість дробової Лагни й розглядай кожну варгу разом із D1.',
  next:'Методологія розрахунків',
  link:'Перейти до калькулятора 16 карт',
  faq:'Поширені запитання',
  q1:'На сайті є лише D9 і D10?',
  a1:'Ні. Galaxiora містить усі шістнадцять традиційних поділів: D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45 і D60. Для індивідуального часу народження D60 має попередній статус.',
  q2:'Чи незалежно сертифікована D60 для мого часу народження?',
  a2:'Ні. Символічну формулу D60 звірено для фіксованих довгот, але стабільність Лагни та домів на реальному інтервалі неточності часу не сертифікована. Точний на вигляд час цього не гарантує.',
  q3:'Чи можна побудувати карту без оплати та реєстрації?',
  a3:'Публічний розрахунок натальної карти безкоштовний і доступний без реєстрації. Введи дату, місцевий час і місце народження, розрахуй карту та обери потрібний поділ у досліднику 16 карт.',
  warning:'Попередня D60: чутливість до часу народження',
  stable:'Варга N4 з внутрішньою перевіркою',
  note:'Астрологічні значення — традиційні тлумачення, а не науково підтверджені передбачення. Астрономічні координати й математичний поділ карти відокремлені від тлумачення.'
 }
} as const;
export const dynamicParams=false;
export function generateStaticParams(){return [{locale:'en'},{locale:'uk'}];}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;if(!isPortalLocale(locale))return {};
 const c=COPY[locale],p='/'+locale+'/'+PATH;
 return {title:c.title,description:c.desc,robots:indexRobots(),
  alternates:{canonical:p,languages:{en:'/en/'+PATH,uk:'/uk/'+PATH,'x-default':'/en/'+PATH}},
  openGraph:{type:'article',title:c.title,description:c.desc,url:p,siteName:'Galaxiora'}};
}
export default async function DivisionalCharts({params}:Props){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 const lang=locale as Locale,c=COPY[lang],origin=publicSiteOrigin();
 const structured=publicIndexingEnabled()&&origin?JSON.stringify({
  '@context':'https://schema.org','@type':'WebPage',
  name:c.h1,description:c.desc,url:origin+'/'+lang+'/'+PATH,inLanguage:lang,
  isPartOf:{'@type':'WebSite',name:'Galaxiora',url:origin},
  mainEntity:{'@type':'ItemList',numberOfItems:16,itemListElement:
   SHODASHAVARGA.map((entry,i)=>({'@type':'ListItem',position:i+1,
    name:'D'+entry.division+' '+entry.name,
    url:origin+'/'+lang+'/'+PATH+'#d'+entry.division}))}
 }).replace(/</g,'\\u003c'):null;
 return <PortalShell locale={lang} active="astrology" languagePath={PATH}>
  {structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:structured}}/>}
  <article className={styles.page} data-testid="g4-shodashavarga-guide">
   <nav className={styles.breadcrumb} aria-label={lang==='uk'?'Навігація':'Breadcrumb'}>
    <Link href={'/'+lang+'/astrology/jyotish'}>{lang==='uk'?'Натальна карта':'Birth chart'}</Link> / Shodashavarga
   </nav>
   <header className={styles.hero}>
    <span className={styles.eyebrow}>{c.eyebrow}</span>
    <h1>{c.h1}</h1>
    <p>{c.intro}</p>
    <Link className={styles.primary} href={'/'+lang+'/astrology/jyotish#birth-details'}>{c.action}</Link>
   </header>
   <section className={styles.context} aria-labelledby="g4-what">
    <h2 id="g4-what">{c.start}</h2>
    <p>{c.startText}</p>
   </section>
   <section className={styles.context} aria-labelledby="g4-method">
    <h2 id="g4-method">{c.methodology}</h2>
    <p>{c.methodText}</p>
    <Link href={'/'+lang+'/methodology'}>{c.next}</Link>
   </section>
   <section className={styles.context} aria-labelledby="g4-evidence">
    <h2 id="g4-evidence">{c.status}</h2>
    <p>{c.statusText}</p>
   </section>
   <section className={styles.catalog} aria-labelledby="g4-catalog-title">
    <h2 id="g4-catalog-title">{c.table}</h2>
    <nav className={styles.index} aria-label={c.table}>
     {SHODASHAVARGA.map(v=><a key={v.division} href={'#d'+v.division}>D{v.division}</a>)}
    </nav>
    <div className={styles.grid}>
     {SHODASHAVARGA.map(v=><section key={v.division} id={'d'+v.division}
      className={styles.card} aria-labelledby={'varga-title-'+v.division}>
       <div className={styles.cardHeader}>
        <span className={styles.code}>D{v.division}</span>
        <div><h3 id={'varga-title-'+v.division}>{v.name}</h3><strong>{v.theme[lang]}</strong></div>
       </div>
       <p>{v.detail[lang]}</p>
       <p className={styles.question}><b>{c.question}:</b> {v.question[lang]}</p>
       <small className={v.division===60?styles.provisional:styles.status}>{v.division===60?c.warning:c.stable}</small>
       <Link href={'/'+lang+'/astrology/jyotish#birth-details'}>{c.use}</Link>
      </section>)}
    </div>
   </section>
   <section className={styles.context} aria-labelledby="g4-input">
    <h2 id="g4-input">{c.quality}</h2>
    <p>{c.qualityText}</p>
   </section>
   <section className={styles.faq} aria-labelledby="g4-faq">
    <h2 id="g4-faq">{c.faq}</h2>
    {([[c.q1,c.a1],[c.q2,c.a2],[c.q3,c.a3]] as const).map(([q,a])=>
     <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
   </section>
   <p className={styles.note}>{c.note}</p>
   <div className={styles.actions}>
    <Link className={styles.primary} href={'/'+lang+'/astrology/jyotish#birth-details'}>{c.link}</Link>
    <Link href={'/'+lang+'/methodology'}>{c.next}</Link>
   </div>
  </article>
 </PortalShell>;
}
