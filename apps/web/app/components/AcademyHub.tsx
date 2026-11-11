import Link from 'next/link';
import {ArrowUpRight,BookOpen,LibraryBig} from 'lucide-react';
import PortalShell from './PortalShell';
import PediaCatalog,{type PediaCatalogItem} from './PediaCatalog';
import {ACADEMY_LESSONS} from '../../lib/academy-content';
import {PEDIA_ARTICLES,PEDIA_CATEGORIES} from '../../lib/pedia-content';
import type {ContentLocale} from '../../lib/yoga-content';
import {publishedList} from '../../lib/editorial-public';

// Original guides are listed before course lessons: most visitors arrive to answer a question.
// All published CMS links are server-rendered, with no client-side fetch needed for discovery.
const CATALOG:PediaCatalogItem[]=[
 ...PEDIA_ARTICLES.map(article=>({
  slug:article.slug,category:article.category,minutes:article.minutes,
  title:article.title,summary:article.summary,kind:'article' as const
 })),
 ...ACADEMY_LESSONS.map(lesson=>({
  slug:lesson.slug,category:lesson.topic,minutes:lesson.minutes,
  title:lesson.title,summary:lesson.description,kind:'lesson' as const
 }))
];

export default async function AcademyHub({locale}:{locale:ContentLocale}){
 const uk=locale==='uk';
 const published=await publishedList('ACADEMY');
 const extra:PediaCatalogItem[]=published
  .filter(item=>!CATALOG.some(x=>x.slug===item.slug)&&
   typeof item.document.summary?.en==='string'&&typeof item.document.summary?.uk==='string')
  .map(item=>({
   slug:item.slug,category:'editorial' as const,minutes:5,
   title:item.document.title,summary:item.document.summary,kind:'editorial' as const
  }));
 const items=[...CATALOG,...extra];
 return <PortalShell locale={locale} active="learn" languagePath="pedia">
  <div className="as-wellness as-pedia">
   <header className="as-pedia-intro">
    <span className="as-overline">GALAXIPEDIA · {uk?'ЕНЦИКЛОПЕДІЯ ТА АКАДЕМІЯ':'ENCYCLOPEDIA & ACADEMY'}</span>
    <h1>{uk?'GalaxiPedia — астрологія, Джйотіш і Панчанга':'GalaxiPedia — Astrology, Jyotish & Panchanga'}</h1>
    <p>{uk?
     'Від питання — до розуміння. Шукай відповіді про Джйотіш, Панчангу, Таро й астрономію. Читай довідники, навчайся та застосовуй знання в інструментах Galaxiora.':
     'Explore the cosmos, one question at a time. Find practical answers about Jyotish, Panchanga, Tarot and astronomy. Explore original guides, learn the concepts and try the related Galaxiora tools.'}</p>
    <div className="as-pedia-intro-meta">
     <span>{PEDIA_ARTICLES.length} {uk?'довідників':'guides'}</span>
     <span>{ACADEMY_LESSONS.length} {uk?'уроків':'lessons'}</span>
     <span>{PEDIA_CATEGORIES.length} {uk?'напрямів':'topics'}</span>
     <Link href={'/'+locale+'/pedia/glossary'}><BookOpen size={16} aria-hidden="true"/>{uk?'Словник термінів':'Glossary of terms'} <ArrowUpRight size={15} aria-hidden="true"/></Link>
    </div>
   </header>

   <PediaCatalog locale={locale} items={items} categories={PEDIA_CATEGORIES}/>

   <section className="as-pedia-topic-section" id="pedia-topics" aria-labelledby="pedia-topics-title">
    <div className="as-pedia-topic-heading">
     <span className="as-overline">GALAXIPEDIA · {uk?'НАПРЯМИ':'TOPICS'}</span>
     <h2 id="pedia-topics-title">{uk?'Заглибитись у тему':'Go deeper into a topic'}</h2>
     <p>{uk?'Кожен напрям має окрему сторінку з поясненнями й пов’язаними матеріалами.':
      'Each subject has its own guide page with context and related reading.'}</p>
    </div>
    <div className="as-pedia-topic-grid">
     {PEDIA_CATEGORIES.map(topic=><Link key={topic.id} href={'/'+locale+'/pedia/topic/'+topic.id} className="as-pedia-topic-card">
      <h3>{topic.title[locale]}</h3>
      <p>{topic.description[locale]}</p>
      <span>{uk?'Відкрити напрям':'Browse topic'} <ArrowUpRight size={15} aria-hidden="true"/></span>
     </Link>)}
    </div>
   </section>

   <aside className="as-wellness-note as-pedia-methodology">
    <LibraryBig size={22} aria-hidden="true"/>
    <div>
     <strong>{uk?'Знання, практика й точність':'Learning, practice and accuracy'}</strong>
     <p>{uk?'Матеріали відділяють астрономічні розрахунки від традиційних інтерпретацій. Уроки й редакційні публікації відкриті без реєстрації.':
      'Our guides distinguish astronomical calculations from traditional interpretations. Lessons and editorial publications remain open without an account.'}</p>
     <Link href={'/'+locale+'/methodology'}>{uk?'Як ми перевіряємо розрахунки':'How we verify calculations'} <ArrowUpRight size={15} aria-hidden="true"/></Link>
     <Link href={'/'+locale+'/astrology/divisional-charts'}>{uk?'Усі 16 дробових карт Шодашаварги':'All 16 Shodashavarga divisional charts'} <ArrowUpRight size={15} aria-hidden="true"/></Link>
    </div>
   </aside>
  </div>
 </PortalShell>;
}
