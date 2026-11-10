import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../../components/PortalShell';
import ShareTools from '../../../components/ShareTools';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../../lib/brand';
import {indexRobots,publicSiteOrigin,publicIndexingEnabled} from '../../../../lib/site-indexing';
import {articleStructuredData} from '../../../../lib/seo-structured';

const SLUG='astrology/moon-sign-vs-sun-sign';
const COPY={
 en:{
  title:'Vedic Moon Sign vs Western Sun Sign: Why They Differ',
  description:'Vedic Moon sign and Western Sun sign are not the same calculation. Learn the difference between planets, sidereal and tropical zodiacs, and how to compare your birth chart.',
  eyebrow:'GALAXIORA · VEDIC & WESTERN ASTROLOGY',
  heading:'Why is my Vedic Moon sign different from my Western Sun sign?',
  lead:'You may have grown up identifying with a Western Sun sign, then opened a Jyotish birth chart and seen a different sign. This does not automatically mean either calculator is wrong. Often you are comparing two different celestial bodies, measured in two different zodiac systems.',
  compare:'Four measurements people often mix up',
  tableHeads:['Measurement','Celestial body','Zodiac reference','What it describes'],
  rows:[
   ['Western Sun sign','Sun','Usually tropical','The Sun’s zodiac placement used in common Western horoscopes'],
   ['Western Moon sign','Moon','Usually tropical','The Moon’s placement in a Western birth chart'],
   ['Vedic Sun sign','Sun','Sidereal (e.g. Lahiri)','The Sun’s placement in a Jyotish chart'],
   ['Vedic Moon sign (Chandra Rashi)','Moon','Sidereal (e.g. Lahiri)','The Moon’s sign in Jyotish; also relevant to nakshatras']
  ],
  sections:[
   {heading:'1. The Sun and Moon are not interchangeable',
    paragraphs:[
     'A birth chart records several positions at the same moment. The Sun’s sign and the Moon’s sign are separate measurements. The Moon travels through the zodiac much faster than the Sun; even when both charts use the same reference system, their signs frequently differ.',
     'Before deciding that two websites disagree, compare Sun with Sun or Moon with Moon. A “Vedic Moon sign” versus a “Western Sun sign” is not a like-for-like test.'
    ]},
   {heading:'2. Sidereal and tropical zodiacs use different reference points',
    paragraphs:[
     'Much contemporary Western astrology uses the tropical zodiac, anchored to the equinoxes. Jyotish commonly uses the sidereal zodiac, referenced to the background stars with an ayanamsha adjustment. Galaxiora uses the Lahiri ayanamsha in its Vedic chart.',
     'The offset is approximately 24 degrees in the present era, but is time-dependent, not a permanent number to subtract from every chart. A planet near a sign boundary may therefore appear under a different sign when switching systems. Changing the zodiac reference does not change the astronomical instant of birth.'
    ]},
   {heading:'3. A small example — illustration, not a real birth chart',
    paragraphs:[
     'Imagine that a tropical calculation places the Sun at 12° Aries. Subtracting a rounded 24° illustrative sidereal offset would put the same Sun near 18° Pisces in a sidereal chart. This is a simplified example only; the precise offset depends on the date and the chosen ayanamsha.',
     'The example says nothing about the Moon’s sign. To determine Chandra Rashi, you must calculate the Moon’s own longitude. If the birth time or place is uncertain, additional placements such as the Ascendant and divisional charts also need care.'
    ]},
   {heading:'4. How to compare your own chart correctly',
    paragraphs:[
     'Enter the same birth date, local birth time and birthplace into the calculators you are comparing. Check the time zone and any historical daylight-saving changes. Note which body is displayed (Sun, Moon or Ascendant), whether the zodiac is tropical or sidereal, and, for a sidereal chart, which ayanamsha is used.',
     'Read the Sun and Moon positions independently. A sign name alone is a poor accuracy test: exact longitudes, reference frame, birthplace and birth-time handling provide a better comparison. For the calculation conventions used here, see our published methodology.'
    ]},
   {heading:'5. What this difference means for interpretation',
    paragraphs:[
     'Western Sun-sign columns and a Jyotish Moon-sign reading are different traditions of interpretation. In Jyotish, a personal reading can also use Lagna (Ascendant), nakshatra, divisional charts and Vimshottari periods. A short generic sign description cannot replace the context of a full chart.',
     'Astronomical positions can be computed precisely; the personal meaning assigned to them belongs to astrological tradition rather than a scientifically validated prediction. That distinction helps you evaluate a reading without confusing calculation accuracy with interpretive certainty.'
    ]}
  ],
  cta:'Calculate your free Vedic birth chart',
  ctaSub:'Open D1, D9, D10, your Moon sign and nakshatra using your own birth details.',
  lesson:'Read the existing sidereal vs tropical zodiac lesson',
  methodology:'See our calculation methodology',
  panchanga:'Explore Panchanga for your city',
  home:'Home',astrology:'Astrology',more:'Explore related tools',
  glossary:'Helpful comparison checklist',
  checklist:['Same birth date, clock time and birthplace','Sun compared with Sun; Moon compared with Moon','Tropical or sidereal zodiac identified','Ayanamsha identified for sidereal positions','Ascendant treated cautiously when birth time is unknown']
 },
 uk:{
  title:'Ведичний знак Місяця і західний знак Сонця: чому вони різні',
  description:'Чому знак Місяця в Джйотіш може відрізнятися від західного знака Сонця? Порівнюємо світила, сидеричний і тропічний зодіак та правила натальних розрахунків.',
  eyebrow:'GALAXIORA · ВЕДИЧНА ТА ЗАХІДНА АСТРОЛОГІЯ',
  heading:'Чому мій знак Місяця в Джйотіш відрізняється від західного знака Сонця?',
  lead:'Звичний знак із західного гороскопа може не збігатися зі знаком, який показує натальна карта Джйотіш. Це не обов’язково помилка: часто порівнюються два різні світила, положення яких визначають у двох різних системах зодіаку.',
  compare:'Чотири різні показники, які легко переплутати',
  tableHeads:['Показник','Небесне тіло','Система зодіаку','Що означає'],
  rows:[
   ['Західний знак Сонця','Сонце','Зазвичай тропічна','Положення Сонця у звичних західних гороскопах'],
   ['Західний знак Місяця','Місяць','Зазвичай тропічна','Положення Місяця в західній натальній карті'],
   ['Ведичний знак Сонця','Сонце','Сидерична (наприклад, Лахірі)','Положення Сонця в карті Джйотіш'],
   ['Ведичний знак Місяця — Чандра Раші','Місяць','Сидерична (наприклад, Лахірі)','Знак Місяця в Джйотіш, пов’язаний також із накшатрами']
  ],
  sections:[
   {heading:'1. Сонце і Місяць — різні показники',
    paragraphs:[
     'Натальна карта фіксує кілька небесних положень на ту саму мить. Знак Сонця та знак Місяця — окремі обчислення. Місяць проходить зодіак набагато швидше за Сонце, тому навіть за однакової системи відліку вони нерідко перебувають у різних знаках.',
     'Перш ніж робити висновок, що калькулятори суперечать один одному, порівняй Сонце із Сонцем або Місяць із Місяцем. Ведичний знак Місяця й західний знак Сонця — не тотожні величини.'
    ]},
   {heading:'2. Сидеричний і тропічний зодіаки мають різні точки відліку',
    paragraphs:[
     'У сучасній західній астрології часто використовують тропічний зодіак, пов’язаний із точками рівнодення. У Джйотіш переважає сидеричний зодіак, орієнтований на зоряне тло з поправкою аянамша. Galaxiora використовує аянамшу Лахірі для ведичних карт.',
     'Різниця в сучасну епоху становить приблизно 24 градуси, але вона залежить від дати. Не слід завжди віднімати одну й ту саму константу. Біля меж знаків одна планета може отримати різні назви знаків у двох системах без зміни самого астрономічного моменту.'
    ]},
   {heading:'3. Спрощений приклад — не реальна натальна карта',
    paragraphs:[
     'Уявімо, що тропічне Сонце стоїть на 12° Овна. Якщо для наочності відняти округлені 24°, отримаємо приблизно 18° Риб у сидеричному зодіаку. Це умовний приклад: точна поправка залежить від дати та вибраної аянамші.',
     'Про знак Місяця цей приклад нічого не говорить. Щоб знайти Чандра Раші, потрібно окремо обчислити довготу Місяця. Невизначений час або місце народження також ускладнюють висновки щодо асцендента й дробових карт.'
    ]},
   {heading:'4. Як правильно зіставити свої карти',
    paragraphs:[
     'Використовуй ту саму дату, місцевий час і місто народження. Перевір часовий пояс та історичні переходи на літній час. З’ясуй, чи порівнюєш Сонце, Місяць або асцендент, чи застосовано тропічний або сидеричний зодіак та яку аянамшу обрано.',
     'Окремо перевір положення Сонця й Місяця. Самої назви знака замало для контролю точності: краще зіставляти точні довготи, систему відліку та обробку часу й координат. Методологія Galaxiora доступна поруч із розрахунками.'
    ]},
   {heading:'5. Що це змінює в тлумаченні',
    paragraphs:[
     'Західний загальний гороскоп за Сонцем і ведичне тлумачення за Місяцем — різні традиції. Джйотіш також розглядає лагну, накшатри, дробові карти й періоди Вімшоттарі. Загальний текст про знак не замінює аналіз усієї карти.',
     'Положення небесних тіл можна обчислити точно. Але інтерпретація їхнього особистого значення належить до астрологічної традиції, а не до науково підтверджених передбачень. Варто відрізняти точність обчислення від певності тлумачення.'
    ]}
  ],
  cta:'Розрахувати безкоштовну натальну карту Джйотіш',
  ctaSub:'Переглянь D1, D9, D10, власний знак Місяця й накшатру за даними народження.',
  lesson:'Урок про сидеричний і тропічний зодіаки',
  methodology:'Методологія розрахунків Galaxiora',
  panchanga:'Панчанга для свого міста',
  home:'Головна',astrology:'Астрологія',more:'Пов’язані інструменти',
  glossary:'Що перевірити перед порівнянням',
  checklist:['Однакові дата, місцевий час і місто народження','Сонце порівнюється із Сонцем, Місяць — із Місяцем','Визначено тропічну чи сидеричну систему','Для сидеричних координат указано аянамшу','За невідомого часу народження асцендент позначено як невизначений']
 }
} as const;

type Props={params:Promise<{locale:string}>};
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 const t=COPY[locale],url='/'+locale+'/'+SLUG;
 return {
  title:t.title+' | Galaxiora',description:t.description,robots:indexRobots(),
  alternates:{canonical:url,languages:{en:'/en/'+SLUG,uk:'/uk/'+SLUG,'x-default':'/en/'+SLUG}},
  openGraph:{type:'article',siteName:'Galaxiora',title:t.title,description:t.description,
   url,locale:locale==='uk'?'uk_UA':'en_US'},
  twitter:{card:'summary',title:t.title,description:t.description}
 };
}
export default async function MoonAndSunSignGuide({params}:Props){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 const loc=locale as PortalLocale,t=COPY[loc],path='/'+loc+'/'+SLUG;
 const base=publicSiteOrigin();
 const article=articleStructuredData({locale:loc,path,title:t.title,description:t.description});
 const crumbs=base&&publicIndexingEnabled()?JSON.stringify({
  '@context':'https://schema.org','@type':'BreadcrumbList',
  itemListElement:[
   {'@type':'ListItem',position:1,name:t.home,item:base+'/'+loc},
   {'@type':'ListItem',position:2,name:t.astrology,item:base+'/'+loc+'/astrology/jyotish'},
   {'@type':'ListItem',position:3,name:t.title,item:base+path}
  ]
 }).replace(/</g,'\\u003c'):null;
 return <PortalShell locale={loc} active="astrology" languagePath={SLUG}>
  {article&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:article}}/>}
  {crumbs&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:crumbs}}/>}
  <article className="as-wellness as-academy-detail" data-testid="r43-moon-sun-sign-guide">
   <nav aria-label={loc==='uk'?'Навігація':'Breadcrumb'}>
    <Link href={'/'+loc}>{t.home}</Link> / <Link href={'/'+loc+'/astrology/jyotish'}>{t.astrology}</Link> / {t.title}
   </nav>
   <header className="as-wellness-detail-head" style={{marginTop:30}}>
    <span className="as-overline">{t.eyebrow}</span>
    <h1>{t.heading}</h1><p>{t.lead}</p>
   </header>
   <ShareTools locale={loc} title={t.title} path={path}/>
   <section className="as-lesson-section" aria-label={t.compare}>
    <h2>{t.compare}</h2>
    <div style={{overflowX:'auto'}}>
     <table style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}>
      <thead><tr>{t.tableHeads.map(h=><th key={h} scope="col" style={{padding:12,borderBottom:'1px solid currentColor'}}>{h}</th>)}</tr></thead>
      <tbody>{t.rows.map(row=><tr key={row[0]}>{row.map((cell,i)=><td key={i} style={{padding:12,borderBottom:'1px solid rgba(128,128,128,.25)',verticalAlign:'top'}}>{cell}</td>)}</tr>)}</tbody>
     </table>
    </div>
   </section>
   <div className="as-lesson-sections">
    {t.sections.map(s=><section key={s.heading} className="as-lesson-section">
     <h2>{s.heading}</h2>{s.paragraphs.map(p=><p key={p}>{p}</p>)}
    </section>)}
   </div>
   <section className="as-lesson-section">
    <h2>{t.glossary}</h2>
    <ul>{t.checklist.map(s=><li key={s}>{s}</li>)}</ul>
   </section>
   <section className="as-lesson-section">
    <h2>{t.more}</h2>
    <p>{t.ctaSub}</p>
    <p><Link className="as-button as-button-primary" href={'/'+loc+'/astrology/jyotish'}>{t.cta}</Link></p>
    <p><Link href={'/'+loc+'/pedia/sidereal-and-tropical'}>{t.lesson}</Link></p>
    <p><Link href={'/'+loc+'/methodology'}>{t.methodology}</Link></p>
    <p><Link href={'/'+loc+'/panchanga'}>{t.panchanga}</Link></p>
   </section>
  </article>
 </PortalShell>;
}
