import Link from 'next/link';
import {ArrowUpRight,BookOpen,LibraryBig} from 'lucide-react';
import PortalShell from './PortalShell';
import PediaCatalog,{type PediaCatalogItem} from './PediaCatalog';
import {ACADEMY_LESSONS} from '../../lib/academy-content';
import {PEDIA_ARTICLES,PEDIA_CATEGORIES} from '../../lib/pedia-content';
import type {ContentLocale} from '../../lib/yoga-content';
import {publishedList} from '../../lib/editorial-public';

const CATALOG:PediaCatalogItem[]=[
 ...ACADEMY_LESSONS.map(lesson=>({
  slug:lesson.slug,category:lesson.topic,minutes:lesson.minutes,
  title:lesson.title,summary:lesson.description,kind:'lesson' as const
 })),
 ...PEDIA_ARTICLES.map(article=>({
  slug:article.slug,category:article.category,minutes:article.minutes,
  title:article.title,summary:article.summary,kind:'article' as const
 }))
];
export default async function AcademyHub({locale}:{locale:ContentLocale}){
 const uk=locale==='uk';
 const published=await publishedList('ACADEMY');
 return <PortalShell locale={locale} active="learn" languagePath="pedia"><div className="as-wellness">
  <section className="as-wellness-hero academy-hero">
   <span className="as-overline">GALAXIPEDIA · {uk?'ЕНЦИКЛОПЕДІЯ ТА АКАДЕМІЯ':'ENCYCLOPEDIA & ACADEMY'}</span>
   <h1>{uk?'Від питання — до розуміння.':'Explore the cosmos, one question at a time.'}</h1>
   <p>{uk?'Єдина енциклопедія астрології, Джйотіш, Панчанги, Таро, астрономії та духовних практик. Почни з довідкової статті, пройди урок із тестом і застосуй знання в інструментах Galaxiora.':'An open encyclopedia of astrology, Jyotish, Panchanga, Tarot, astronomy and mindful practice. Explore a focused guide, follow a lesson with a knowledge check and try the related Galaxiora tools.'}</p>
   <div className="as-wellness-tags"><span>{ACADEMY_LESSONS.length} {uk?'уроків':'lessons'}</span>
    <span>{PEDIA_ARTICLES.length} {uk?'нові довідкові статті':'original reference guides'}</span>
    <span>{PEDIA_CATEGORIES.length} {uk?'напрямів':'topics'}</span><span>EN / UA</span></div>
   <div className="as-actions">
    <a className="as-button as-button-primary" href="#pedia-explore">{uk?'Дослідити матеріали':'Explore the library'} <ArrowUpRight size={17}/></a>
    <Link className="as-button as-button-secondary" href={'/'+locale+'/pedia/glossary'}>{uk?'Словник термінів':'Glossary of terms'} <BookOpen size={17}/></Link>
   </div>
  </section>
  <section className="as-wellness-section" aria-label={uk?'Тематичні розділи':'Browse GalaxiPedia topics'}>
   <div className="as-wellness-section-header">
    <span className="as-overline">GALAXIPEDIA · TOPICS</span>
    <h2>{uk?'Шість тематичних напрямів':'Explore six focused topics'}</h2>
    <p>{uk?'Окремі сторінки з поясненнями, перевіреними прикладами та пов’язаними довідниками.':'Each topic has its own explanation, worked examples and clearly linked references.'}</p>
   </div>
   <div className="as-wellness-grid">{PEDIA_CATEGORIES.map(topic=><Link key={topic.id} className="as-wellness-card" href={'/'+locale+'/pedia/topic/'+topic.id}>
    <h3>{topic.title[locale]}</h3><p>{topic.description[locale]}</p>
    <span className="as-wellness-card-link">{uk?'Дослідити напрям':'Explore topic'} <ArrowUpRight size={16}/></span>
   </Link>)}</div>
  </section>
  <PediaCatalog locale={locale} items={CATALOG} categories={PEDIA_CATEGORIES}/>
  {published.length>0&&<section className="as-wellness-section" aria-label={uk?'Опубліковані матеріали Академії':'Published Academy articles'}>
   <h2>{uk?'Матеріали редакції':'Editorial publications'}</h2>
   <div className="as-wellness-grid">{published.filter(item=>!CATALOG.some(x=>x.slug===item.slug)).map(item=><Link key={item.slug} className="as-wellness-card" href={'/'+locale+'/pedia/'+item.slug}>
     <h3>{item.document.title[locale]}</h3><p>{item.document.summary[locale]}</p>
     <span className="as-wellness-card-link">{uk?'Читати статтю':'Read article'}</span>
   </Link>)}</div>
  </section>}
  <aside className="as-wellness-note"><LibraryBig size={23} aria-hidden="true"/><div>
   <strong>{uk?'Знання, практика й точність':'Learning, practice and accuracy'}</strong>
   <p>{uk?'Уроки й редакційні статті залишаються доступними. Розрахунки астрономічних положень, історичні правила та традиційні тлумачення позначено окремо. Тест допомагає перевірити знання, а не передбачає події.':'The existing lessons and editorial articles remain available. Astronomical calculations, historical rules and traditional interpretations are kept distinct. Quizzes check understanding rather than predict personal outcomes.'}</p>
   <Link href={'/'+locale+'/methodology'}>{uk?'Як ми перевіряємо розрахунки':'How we verify calculations'} <ArrowUpRight size={15}/></Link>
  </div></aside>
 </div></PortalShell>;
}