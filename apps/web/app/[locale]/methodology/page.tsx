import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../../components/PortalShell';
import {isPortalLocale,type PortalLocale} from '../../../../lib/brand';
import {indexRobots,publicIndexingEnabled,publicSiteOrigin} from '../../../../lib/site-indexing';

const COPY={
 uk:{
  title:'Як Galaxiora розраховує натальні карти — методологія та перевірка точності',
  description:'Дізнайся, як ми розраховуємо Джйотіш за Swiss Ephemeris, перевіряємо лагну, Місяць, D1/D9/D10 і даші за JHora та відокремлюємо факти від тлумачень.',
  heading:'Методологія розрахунків і джерела Galaxiora',
  intro:'Пояснюємо, звідки беруться астрономічні дані, як саме перевіряємо натальні карти й у яких межах підтверджена точність.',
  headings:['Як створюється натальна карта','Що саме підтвердив JQA-3','Що означає сертифікат і чого він не охоплює','Чим розрахунок відрізняється від тлумачення','Як перевірити результат самостійно'],
  paragraphs:[
   'Основа обчислень — Swiss Ephemeris із сидеричним зодіаком і визначеною аянамшою Лагірі. Дата, точний час, часовий пояс і географічні координати впливають на лагну та положення планет. D1 відображає основну карту, D9 і D10 — традиційні дробові карти.',
   'Наш тестовий корпус містить 20 оригінальних профілів Jagannatha Hora 8.0. Сертифікатор JQA-3 зіставив 200 із 200 довгот планет і лагни з відхиленням не більш як одна кутова секунда; окремо лагна 20/20 і Місяць 20/20. Дати 180 махадаш і 1620 антардаш збіглися з незалежно збереженими календарними записами.',
   'Цей сертифікат стосується узгодженого історичного профілю JHora, координат і надрукованих дат. Він не підтверджує кожний можливий історичний часовий пояс або точні моменти меж даш у UTC до секунди. Якщо введений час народження неточний, математична точність не усуває похибку вихідних даних.',
   'Положення планет, фаза Місяця, накшатра та даша — результати розрахунку. Висновки про характер, стосунки чи події — традиційні інтерпретації Джйотіш, а не вимірювані астрономічні факти. Ми прагнемо пояснювати, на яких положеннях карти ґрунтується кожне трактування.',
   'Збережи ті самі дату, час, часовий пояс, місце й налаштування сидеричного зодіаку. Порівнюй їх із незалежною програмою та враховуй параметри аянамші й календарного року для даш. Для відтворення нашої перевірки доступний публічний журнал GitHub Actions.'
  ],
  verification:'Незалежний протокол JQA-3 у GitHub',
  reference:'Документація Swiss Ephemeris',
  next:'Побудувати натальну карту',
  academy:'Читати Академію',
  updated:'Остання документована перевірка: 28 жовтня 2026 року'
 },
 en:{
  title:'How Galaxiora calculates birth charts — methodology and accuracy',
  description:'Explore our Swiss Ephemeris Jyotish calculations and independent JHora checks for Ascendant, Moon, D1/D9/D10 and dasha dates.',
  heading:'Galaxiora calculation methods and source evidence',
  intro:'Where the astronomical data comes from, how birth charts are verified, and which precision claims have actually been tested.',
  headings:['How a birth chart is calculated','What JQA-3 actually certified','Scope and limitations of certification','Astronomical calculations versus interpretation','How to reproduce the comparison'],
  paragraphs:[
   'We use Swiss Ephemeris in a sidereal zodiac with an explicitly selected Lahiri ayanamsha. Birth date, exact civil time, time zone and location affect the rising sign and planetary coordinates. D1 is the main chart; D9 and D10 are traditional divisional charts.',
   'The independent corpus contains 20 original Jagannatha Hora 8.0 profiles. JQA-3 matched all 200 of 200 planetary and Ascendant longitudes to within one arcsecond, including Ascendant 20/20 and Moon 20/20. It also matched 180 mahadasha and 1,620 antardasha printed civil dates.',
   'The certificate covers the source-matched historical JHora configuration, angular coordinates and printed dates. It does not separately attest every historic time-zone scenario or the exact UTC instant of each dasha boundary to the second. Inaccurate birth-time input remains a significant limitation.',
   'Planetary positions, Moon phases, nakshatras and dashas are calculated. Statements about relationships, personality or future events are traditional Jyotish interpretations rather than measured astronomical observations. We aim to make the source of each interpretation understandable.',
   'Use identical birth date, civil time, time-zone rules, coordinates, sidereal settings and ayanamsha in another program. For dasha comparisons, align the year definition and calendar settings. The public GitHub Actions log contains reproducible certification output.'
  ],
  verification:'Read the independent JQA-3 GitHub verification',
  reference:'Swiss Ephemeris programming documentation',
  next:'Calculate a birth chart',
  academy:'Explore the Academy',
  updated:'Last documented verification: October 28, 2026'
 }
} as const;
type Props={params:Promise<{locale:string}>};
export function generateStaticParams(){return [{locale:'uk'},{locale:'en'}];}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;if(!isPortalLocale(locale))return {};
 const c=COPY[locale],p='/'+locale+'/methodology';
 return {title:c.title+' | Galaxiora',description:c.description,robots:indexRobots(),
  alternates:{canonical:p,languages:{uk:'/uk/methodology',en:'/en/methodology','x-default':'/en/methodology'}},
  openGraph:{type:'website',title:c.title,description:c.description,url:p,siteName:'Galaxiora'}};
}
export default async function Methodology({params}:Props){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 const c=COPY[locale],uk=locale==='uk';
 const origin=publicSiteOrigin();
 const structured=publicIndexingEnabled()&&origin?JSON.stringify({
  '@context':'https://schema.org','@type':'WebPage',
  name:c.heading,url:origin+'/'+locale+'/methodology',
  description:c.description,inLanguage:locale,
  isPartOf:{'@type':'WebSite',name:'Galaxiora',url:origin},
  about:[{'@type':'Thing',name:'Jyotish'},{'@type':'Thing',name:'Swiss Ephemeris'}]
 }).replace(/</g,'\\u003c'):null;
 return <PortalShell locale={locale as PortalLocale} languagePath="methodology">
  {structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:structured}}/>}
  <article className="as-wellness as-academy-detail" style={{maxWidth:880,margin:'32px auto 72px'}}>
   <nav aria-label={uk?'Навігація':'Breadcrumb'}><Link href={'/'+locale}>{uk?'Головна':'Home'}</Link> / {uk?'Методологія':'Methodology'}</nav>
   <header className="as-wellness-detail-head">
    <span className="as-overline">GALAXIORA · REPRODUCIBLE JYOTISH</span>
    <h1>{c.heading}</h1><p>{c.intro}</p>
    <small>{c.updated}</small>
   </header>
   {c.headings.map((h,i)=><section key={h} className="as-lesson-section">
    <h2>{h}</h2><p>{c.paragraphs[i]}</p>
   </section>)}
   <section className="as-lesson-section"><h2>{uk?'Першоджерела та перевірка':'Sources and verification'}</h2>
    <p><a href="https://www.astro.com/swisseph/swephprg.htm" target="_blank" rel="noopener noreferrer">{c.reference}</a></p>
    <p><a href="https://github.com/OverlorDDD/jyotish-studio/actions/runs/40676861324" target="_blank" rel="noopener noreferrer">{c.verification}</a></p>
   </section>
   <div className="as-actions" style={{display:'flex',gap:14,flexWrap:'wrap'}}>
    <Link className="as-button as-button-primary" href={'/'+locale+'/astrology/jyotish'}>{c.next}</Link>
    <Link className="as-button as-button-secondary" href={'/'+locale+'/learn'}>{c.academy}</Link>
   </div>
  </article>
 </PortalShell>;
}
