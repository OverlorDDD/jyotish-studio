import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../../../components/PortalShell';
import {ACADEMY_LESSONS} from '../../../../../lib/academy-content';
import {PEDIA_ARTICLES,PEDIA_CATEGORIES,type PediaCategory,type PediaLocale} from '../../../../../lib/pedia-content';
import {isPortalLocale} from '../../../../../lib/brand';
import {indexRobots} from '../../../../../lib/site-indexing';

type Props={params:Promise<{locale:string;category:string}>};
const INTRO:Record<PediaCategory,{en:[string,string];uk:[string,string];tool:string}>={
 panchanga:{
  en:['Panchanga is a local-time almanac, not merely a list of good or bad dates. This collection explores tithi, the lunar longitude difference; nakshatra, the Moon\'s sidereal sector; sunrise-based weekdays; and how local sunrise changes traditional intervals.','Start with the five classical limbs, then follow a worked time calculation. Each guide distinguishes astronomical transitions from calendar customs. For a real day and city, use the Panchanga tool rather than copying examples for another location.'],
  uk:['Панчанга — календар із прив’язкою до місцевого часу, а не просто перелік хороших чи поганих дат. Тут пояснено тітхі як різницю довгот Місяця й Сонця, накшатру як сидеричний сектор, правило дня від сходу Сонця та локальні інтервали.','Почни з п’яти класичних складників, потім перейди до числових прикладів. Кожен матеріал відділяє астрономічні переходи від календарних звичаїв. Для справжньої дати й міста використовуй Панчангу, а не чужий розклад.'],
  tool:'panchanga'},
 jyotish:{
  en:['A Jyotish chart depends on exact birth data, a declared sidereal convention and the distinction between planet, sign and house. Our guides teach how the Lagna is formed, how to orient a D1 chart and why the Moon\'s nakshatra sets the starting Vimshottari period.','These articles use hypothetical placements and transparent arithmetic rather than vague personality promises. Before treating a chart result as precise, check the city, historical time zone, birth time and ayanamsha; then explore the corresponding calculation in Galaxiora.'],
  uk:['Карта Джйотіш залежить від точних даних народження, визначеної сидеричної системи й розрізнення планети, знака та дому. Матеріали пояснюють побудову Лагни, читання D1 і те, як натальна накшатра Місяця визначає початковий період Вімшоттарі.','Ми використовуємо умовні положення й прозору арифметику, а не розмиті обіцянки про характер. Перш ніж вважати результат точним, звір місто, історичний часовий пояс, час народження та айанамшу й перевір розрахунок у Galaxiora.'],
  tool:'astrology/jyotish'},
 western:{
  en:['Western astrology frequently describes five major angular aspects between planetary positions: conjunction, sextile, square, trine and opposition. This topic explains their geometric definitions and separates exact angles from the traditional meanings assigned to them.','The orb is a chosen tolerance, not a physical property of the sky. Compare worked angular examples, learn why wraparound at 360 degrees matters, and distinguish the aspects actually supported by Galaxiora from techniques described for educational purposes only.'],
  uk:['Західна астрологія часто використовує п’ять основних кутових аспектів між планетами: з’єднання, секстиль, квадрат, трин та опозицію. У цьому напрямі пояснюється їхня геометрія й відмінність між точним кутом і традиційним символічним значенням.','Орбіс — це обране правило допуску, а не фізична властивість неба. Перевір числові приклади, зрозумій межу 360° та розрізняй підтримувані розрахунки Galaxiora і методи, описані лише для навчання.'],
  tool:'horoscope'},
 tarot:{
  en:['Tarot reading becomes more useful when the question, card positions and interpretive framework are explicit. Here the Academy lessons on framing questions and reversed cards connect to a three-card spread with two worked hypothetical readings.','The aim is to explore symbolism and possible actions while keeping interpretations open to revision. No card can independently verify another person\'s thoughts or guarantee an outcome; real decisions should use evidence beyond a spread.'],
  uk:['Розклад Таро стає змістовнішим, коли заздалегідь визначені запитання, позиції карт і принципи трактування. Уроки Академії про формулювання запитань і перевернуті карти пов’язані з розкладом на три карти та двома навчальними прикладами.','Мета — досліджувати символіку й варіанти дій, залишаючи простір для перегляду тлумачення. Жодна карта сама собою не доводить чужих думок і не гарантує результату; реальні рішення потребують доказів.'],
  tool:'tarot'},
 astronomy:{
  en:['Astronomy explains what is actually observable and computable: why the Moon changes phase, where eclipses are visible and how the inclined lunar orbit produces two nodes. These calculations can be connected to traditional lunar calendars without mistaking symbolism for measurement.','Use the eclipse visibility guide to distinguish a global UTC event from a local observing opportunity. Read NASA\'s maps and safety advice, check the actual horizon and weather, and use Galaxiora\'s calendar as an educational starting point.'],
  uk:['Астрономія пояснює те, що реально можна спостерігати й обчислити: фази Місяця, географію видимості затемнень і два вузли нахиленої місячної орбіти. Ці факти пов’язані з традиційними календарями, але символічні значення не тотожні вимірюванням.','Посібник із видимості затемнень допоможе відрізнити світову подію в UTC від місцевого спостереження. Перевір карти й правила NASA, горизонт і погоду, а календар Galaxiora використовуй для початкового планування.'],
  tool:'panchanga'},
 practice:{
  en:['Mindfulness and yoga practices in Galaxiora are brief, practical exercises, not promises of instant healing. These preserved Academy lessons explain reflective attention, the roots of yoga and where it is important to adapt a session to individual comfort.','Learn the concepts first, then try gentle breathing or movement in the existing Yoga area. This section is deliberately small: we publish a useful lesson only when it adds something practical instead of generating near-identical wellness pages for every keyword.'],
  uk:['Практики уважності й йоги в Galaxiora — це короткі практичні вправи, а не обіцянки миттєвого лікування. Збережені уроки Академії пояснюють усвідомлену увагу, витоки йоги та важливість адаптації вправ до власного самопочуття.','Спочатку ознайомся з поняттями, тоді спробуй м’які дихальні чи рухові практики в розділі Yoga. Цей напрям навмисно компактний: ми публікуємо лише корисні уроки замість майже однакових текстів під кожне можливе пошукове слово.'],
  tool:'yoga'}
};
const CATEGORIES=PEDIA_CATEGORIES.map(x=>x.id);
export function generateStaticParams(){return (['en','uk'] as const).flatMap(locale=>CATEGORIES.map(category=>({locale,category})));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale,category}=await params;
 if(!isPortalLocale(locale)||!CATEGORIES.includes(category as PediaCategory))return {};
 const topic=PEDIA_CATEGORIES.find(x=>x.id===category)!;
 return {title:topic.title[locale]+' — GalaxiPedia',description:INTRO[topic.id][locale][0],
 robots:indexRobots(),alternates:{canonical:'/'+locale+'/pedia/topic/'+category,languages:{
 en:'/en/pedia/topic/'+category,uk:'/uk/pedia/topic/'+category,'x-default':'/en/pedia/topic/'+category}}};
}
export default async function TopicPage({params}:Props){
 const {locale,category}=await params;
 if(!isPortalLocale(locale)||!CATEGORIES.includes(category as PediaCategory))notFound();
 const id=category as PediaCategory,uk=locale==='uk',topic=PEDIA_CATEGORIES.find(x=>x.id===id)!;
 const articles=PEDIA_ARTICLES.filter(x=>x.category===id).map(x=>({slug:x.slug,title:x.title[locale],summary:x.summary[locale],kind:uk?'Стаття':'Guide'}));
 const lessons=ACADEMY_LESSONS.filter(x=>x.topic===id).map(x=>({slug:x.slug,title:x.title[locale],summary:x.description[locale],kind:uk?'Урок':'Lesson'}));
 return <PortalShell locale={locale} active="learn" languagePath={'pedia/topic/'+id}>
  <div className="as-wellness as-academy-detail">
   <nav aria-label={uk?'Навігація':'Breadcrumbs'}><Link href={'/'+locale+'/pedia'}>GalaxiPedia</Link> / {topic.title[locale]}</nav>
   <header className="as-wellness-detail-head">
    <span className="as-overline">GALAXIPEDIA · {uk?'ТЕМА':'TOPIC'}</span>
    <h1>{topic.title[locale]}</h1>
    {INTRO[id][locale].map((paragraph,i)=><p key={i}>{paragraph}</p>)}
   </header>
   <section className="as-wellness-section" aria-label={uk?'Матеріали теми':'Topic articles'}>
    <h2>{uk?'Довідники та уроки':'Guides and lessons'}</h2>
    <div className="as-wellness-grid">
    {[...articles,...lessons].map(item=><Link key={item.slug} href={'/'+locale+'/pedia/'+item.slug} className="as-wellness-card as-lesson-card">
     <span className="as-overline">{item.kind}</span><h3>{item.title}</h3><p>{item.summary}</p>
     <span className="as-wellness-card-link">{uk?'Читати матеріал':'Read guide'}</span>
    </Link>)}
    </div>
   </section>
   <p><Link className="as-button as-button-primary" href={'/'+locale+'/'+INTRO[id].tool}>{uk?'Перейти до інструмента':'Explore the related tool'}</Link></p>
   <p><Link href={'/'+locale+'/pedia/glossary'}>{uk?'Словник термінів':'Explore the glossary'}</Link></p>
  </div>
 </PortalShell>;
}
