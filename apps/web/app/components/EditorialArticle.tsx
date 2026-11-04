import Link from 'next/link';
import {ArrowLeft,ShieldCheck} from 'lucide-react';
import PortalShell from './PortalShell';
import PublishedAcademyQuiz from './PublishedAcademyQuiz';
import GlossaryText from './GlossaryText';
import GalaxiComBridge from './GalaxiComBridge';
import {articleStructuredData} from '../../lib/seo-structured';
import type {PublishedContent,Locale} from '../../lib/editorial-public';
export default function EditorialArticle({entry,locale}:{entry:PublishedContent;locale:Locale}){
 const uk=locale==='uk',academy=entry.kind==='ACADEMY',base=academy?'learn':'yoga';
 const body=entry.document.body[locale].split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
 const jsonLd=academy?articleStructuredData({locale,path:'/'+locale+'/'+base+'/'+entry.slug,
  title:entry.document.title[locale],description:entry.document.summary[locale],publishedAt:entry.publishedAt}):null;
 return <PortalShell locale={locale} active={base} languagePath={base+'/'+entry.slug}>
  {jsonLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>}
  <div className="as-wellness as-wellness-detail as-academy-detail">
   <Link href={'/'+locale+'/'+base} className="as-wellness-back"><ArrowLeft size={16}/>{uk?'До бібліотеки':'Back to library'}</Link>
   <article className="as-academy-article">
    <header className="as-wellness-detail-head"><span className="as-overline">{entry.topic.toUpperCase()} · GALAXIORA</span>
     <h1><GlossaryText text={entry.document.title[locale]} locale={locale}/></h1><p><GlossaryText text={entry.document.summary[locale]} locale={locale}/></p>
     {academy&&<small>{uk?'Опубліковано: ':'Published: '}{new Date(entry.publishedAt).toLocaleDateString(uk?'uk-UA':'en-GB')}</small>}</header>
    {academy?<div className="as-lesson-sections">{body.map((text,i)=><section key={i} className="as-lesson-section">
     <p><GlossaryText text={text} locale={locale}/></p></section>)}</div>:
     <div className="as-cms-steps">{body.map((text,i)=><section key={i} className="as-cms-step"><span className="as-overline">{uk?'КРОК':'STEP'} {i+1}</span><p><GlossaryText text={text} locale={locale}/></p></section>)}</div>}
    {!academy&&entry.document.safety?<aside className="as-wellness-note"><ShieldCheck size={22}/><div><strong>{uk?'Безпека':'Safety'}</strong><p><GlossaryText text={entry.document.safety[locale]} locale={locale}/></p></div></aside>:null}
    {academy&&entry.document.quiz?<PublishedAcademyQuiz quiz={entry.document.quiz} locale={locale}/>:null}
    <GalaxiComBridge kind={entry.kind} slug={entry.slug} title={entry.document.title[locale]} locale={locale}/>
   </article>
  </div>
 </PortalShell>;
}
