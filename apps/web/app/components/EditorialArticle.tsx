import Link from 'next/link';
import {ArrowLeft,ShieldCheck} from 'lucide-react';
import PortalShell from './PortalShell';
import PublishedAcademyQuiz from './PublishedAcademyQuiz';
import type {PublishedContent,Locale} from '../../lib/editorial-public';
export default function EditorialArticle({entry,locale}:{entry:PublishedContent;locale:Locale}){
 const uk=locale==='uk',academy=entry.kind==='ACADEMY',base=academy?'learn':'yoga';
 const body=entry.document.body[locale].split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
 return <PortalShell locale={locale} active={base} languagePath={base+'/'+entry.slug}>
  <div className="as-wellness as-wellness-detail as-academy-detail">
   <Link href={'/'+locale+'/'+base} className="as-wellness-back"><ArrowLeft size={16}/>{uk?'До бібліотеки':'Back to library'}</Link>
   <article className="as-academy-article">
    <header className="as-wellness-detail-head"><span className="as-overline">{entry.topic.toUpperCase()} · GALAXIORA</span>
     <h1>{entry.document.title[locale]}</h1><p>{entry.document.summary[locale]}</p></header>
    {academy?<div className="as-lesson-sections">{body.map((text,i)=><section key={i} className="as-lesson-section">
     <p>{text}</p></section>)}</div>:
     <div className="as-cms-steps">{body.map((text,i)=><section key={i} className="as-cms-step"><span className="as-overline">{uk?'КРОК':'STEP'} {i+1}</span><p>{text}</p></section>)}</div>}
    {!academy&&entry.document.safety?<aside className="as-wellness-note"><ShieldCheck size={22}/><div><strong>{uk?'Безпека':'Safety'}</strong><p>{entry.document.safety[locale]}</p></div></aside>:null}
    {academy&&entry.document.quiz?<PublishedAcademyQuiz quiz={entry.document.quiz} locale={locale}/>:null}
   </article>
  </div>
 </PortalShell>;
}
