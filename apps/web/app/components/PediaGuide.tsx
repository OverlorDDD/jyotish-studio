import Link from 'next/link';
import {ArrowLeft,ArrowUpRight,BookOpen} from 'lucide-react';
import PortalShell from './PortalShell';
import GlossaryText from './GlossaryText';
import {ACADEMY_LESSONS} from '../../lib/academy-content';
import {PEDIA_ARTICLES,PEDIA_CATEGORIES,type PediaArticle,type PediaLocale} from '../../lib/pedia-content';
import {articleStructuredData} from '../../lib/seo-structured';

export default function PediaGuide({article,locale}:{article:PediaArticle;locale:PediaLocale}){
 const uk=locale==='uk';
 const category=PEDIA_CATEGORIES.find(x=>x.id===article.category);
 const related=article.related.map(slug=>{
  const entry=PEDIA_ARTICLES.find(x=>x.slug===slug)||ACADEMY_LESSONS.find(x=>x.slug===slug);
  return entry?{slug,title:entry.title[locale]}:null;
 }).filter((x):x is {slug:string;title:string}=>Boolean(x));
 const jsonLd=articleStructuredData({locale,path:'/'+locale+'/pedia/'+article.slug,
  title:article.title[locale],description:article.summary[locale]});
 return <PortalShell locale={locale} active="learn" languagePath={'pedia/'+article.slug}>
  {jsonLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>}
  <div className="as-wellness as-academy-detail">
   <Link className="as-wellness-back" href={'/'+locale+'/pedia'}><ArrowLeft size={16}/>{uk?'До GalaxiPedia':'Back to GalaxiPedia'}</Link>
   <article className="as-academy-article">
    <header className="as-wellness-detail-head">
     <span className="as-overline">GALAXIPEDIA · {category?.title[locale]} · {article.minutes} {uk?'хв читання':'min read'}</span>
     <h1>{article.title[locale]}</h1><p><GlossaryText text={article.summary[locale]} locale={locale}/></p>
    </header>
    <nav className="as-lesson-contents" aria-label={uk?'Зміст':'Contents'}>
     <strong>{uk?'У статті':'In this guide'}</strong>
     {article.sections.map((s,i)=><a key={i} href={'#pedia-part-'+i}>{s.title[locale]}</a>)}
     <a href="#pedia-next">{uk?'Що читати далі':'What to explore next'}</a>
    </nav>
    <div className="as-lesson-sections">
     {article.sections.map((section,i)=><section className="as-lesson-section" key={i} id={'pedia-part-'+i}>
      <span className="as-overline">{uk?'РОЗДІЛ':'SECTION'} {i+1}</span>
      <h2><GlossaryText text={section.title[locale]} locale={locale}/></h2>
      {section.paragraphs.map((p,j)=><p key={j}><GlossaryText text={p[locale]} locale={locale}/></p>)}
     </section>)}
    </div>
    <section className="as-lesson-takeaways" id="pedia-next">
     <h2>{uk?'Продовжити дослідження':'Continue exploring'}</h2>
     <div className="as-actions"><Link className="as-button as-button-primary" href={'/'+locale+'/'+article.tool}>
      {uk?'Спробувати інструмент Galaxiora':'Try the Galaxiora tool'} <ArrowUpRight size={16}/></Link>
      <Link className="as-button as-button-secondary" href={'/'+locale+'/pedia/glossary'}>
       <BookOpen size={17}/>{uk?'Словник термінів':'Glossary of terms'}</Link>
     </div>
     {related.length>0&&<ul>{related.map(r=><li key={r.slug}><Link href={'/'+locale+'/pedia/'+r.slug}>{r.title}</Link></li>)}</ul>}
    </section>
    <section className="as-lesson-section">
     <h2>{uk?'Джерела та методика':'Sources and methodology'}</h2>
     <p>{uk?'Використані матеріали для перевірки наведених астрономічних і календарних фактів. Традиційні інтерпретації не є астрономічними вимірами.':'References for checking the astronomical and calendrical facts in this guide. Traditional interpretations are not astronomical measurements.'}</p>
     <ul>{article.references.map(ref=><li key={ref.url}><a href={ref.url} target="_blank" rel="noopener noreferrer">{ref.label} <ArrowUpRight size={14}/></a></li>)}</ul>
    </section>
   </article>
  </div>
 </PortalShell>;
}
