import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft,ArrowRight,ArrowUpRight} from 'lucide-react';
import PortalShell from '../../../components/PortalShell';
import AcademyQuiz from '../../../components/AcademyQuiz';
import {ACADEMY_LESSONS,ACADEMY_TOPICS,academyBySlug} from '../../../../lib/academy-content';
import {isPortalLocale} from '../../../../lib/brand';
import {indexRobots} from '../../../../lib/site-indexing';
import {publishedDetail} from '../../../../lib/editorial-public';
import EditorialArticle from '../../../components/EditorialArticle';
export const dynamicParams=true;
type Params={params:Promise<{locale:string;slug:string}>};
export function generateStaticParams(){return (['uk','en'] as const).flatMap(locale=>ACADEMY_LESSONS.map(item=>({locale,slug:item.slug})));}
export async function generateMetadata({params}:Params):Promise<Metadata>{
 const {locale,slug}=await params,lesson=academyBySlug(slug);
 if(!isPortalLocale(locale))return {};
 if(!lesson){
  const cms=await publishedDetail('ACADEMY',slug);
  if(!cms)return {robots:{index:false,follow:false}};
  return {title:cms.document.title[locale]+' | Galaxiora Academy',description:cms.document.summary[locale],robots:indexRobots(),alternates:{canonical:'/'+locale+'/learn/'+slug,languages:{uk:'/uk/learn/'+slug,en:'/en/learn/'+slug}}};
 }
 return {title:lesson.title[locale]+' | Galaxiora Academy',description:lesson.description[locale],
  robots:indexRobots(),alternates:{canonical:'/'+locale+'/learn/'+slug,
   languages:{uk:'/uk/learn/'+slug,en:'/en/learn/'+slug}}};
}
export default async function AcademyLessonPage({params}:Params){
 const {locale,slug}=await params,lesson=academyBySlug(slug);
 if(!isPortalLocale(locale))notFound();
 if(!lesson){
  const cms=await publishedDetail('ACADEMY',slug);
  if(!cms)notFound();
  return <EditorialArticle entry={cms} locale={locale}/>;
 }
 const uk=locale==='uk',position=ACADEMY_LESSONS.findIndex(l=>l.slug===slug),
  next=ACADEMY_LESSONS[position+1],topic=ACADEMY_TOPICS.find(t=>t.id===lesson.topic)!;
 return <PortalShell locale={locale} active="learn" languagePath={'learn/'+slug}>
  <div className="as-wellness as-academy-detail">
   <Link href={'/'+locale+'/learn'} className="as-wellness-back"><ArrowLeft size={16}/>{uk?'Всі уроки':'All lessons'}</Link>
   <article className="as-academy-article">
    <header className="as-wellness-detail-head">
     <span className="as-overline">{topic.title[locale]} · {lesson.minutes} {uk?'хв читання':'min read'}</span>
     <h1>{lesson.title[locale]}</h1><p>{lesson.description[locale]}</p>
    </header>
    <nav className="as-lesson-contents" aria-label={uk?'Зміст уроку':'On this page'}>
     <strong>{uk?'У цьому уроці':'In this lesson'}</strong>
     {lesson.sections.map((section,i)=><a href={'#part-'+(i+1)} key={i}>{i+1}. {section.heading[locale]}</a>)}
     <a href="#knowledge-check">{uk?'Перевірка знань':'Knowledge check'}</a>
    </nav>
    <div className="as-lesson-sections">{lesson.sections.map((section,i)=>
     <section className="as-lesson-section" key={i} id={'part-'+(i+1)}>
      <span className="as-overline">{uk?'РОЗДІЛ':'CHAPTER'} {String(i+1).padStart(2,'0')}</span>
      <h2>{section.heading[locale]}</h2>
      {section.paragraphs.map((p,j)=><p key={j}>{p[locale]}</p>)}
     </section>
    )}</div>
    <aside className="as-lesson-takeaways"><h2>{uk?'Головне з уроку':'Key takeaways'}</h2>
     <ul>{lesson.takeaways.map((item,i)=><li key={i}>{item[locale]}</li>)}</ul>
    </aside>
    <div id="knowledge-check"><AcademyQuiz locale={locale} quiz={lesson.quiz}/></div>
    <div className="as-lesson-navigation">
     <Link href={'/'+locale+'/'+lesson.related} className="as-button as-button-secondary">{uk?'Спробувати на практиці':'Explore related tool'} <ArrowUpRight size={16}/></Link>
     {next?<Link className="as-button as-button-primary" href={'/'+locale+'/learn/'+next.slug}>{uk?'Наступний урок':'Next lesson'} <ArrowRight size={16}/></Link>:
     <Link className="as-button as-button-primary" href={'/'+locale+'/learn'}>{uk?'До бібліотеки':'Back to library'} <ArrowRight size={16}/></Link>}
    </div>
   </article>
  </div></PortalShell>;
}