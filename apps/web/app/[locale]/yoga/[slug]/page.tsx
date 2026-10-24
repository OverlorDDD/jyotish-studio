import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft,ArrowUpRight,ShieldCheck} from 'lucide-react';
import PortalShell from '../../../components/PortalShell';
import YogaSession from '../../../components/YogaSession';
import PracticeCompletionButton from '../../../components/PracticeCompletionButton';
import GlossaryText from '../../../components/GlossaryText';
import {YOGA_PRACTICES,yogaBySlug,say} from '../../../../lib/yoga-content';
import {BREATHING_PATTERNS,sessionMs} from '../../../../lib/breathing-patterns';
import {isPortalLocale} from '../../../../lib/brand';
import {indexRobots} from '../../../../lib/site-indexing';
import {publishedDetail} from '../../../../lib/editorial-public';
import EditorialArticle from '../../../components/EditorialArticle';
export const dynamicParams=true;
type Params={params:Promise<{locale:string;slug:string}>};
export function generateStaticParams(){return (['uk','en'] as const).flatMap(locale=>YOGA_PRACTICES.map(item=>({locale,slug:item.slug})));}
export async function generateMetadata({params}:Params):Promise<Metadata>{
 const {locale,slug}=await params,practice=yogaBySlug(slug);
 if(!isPortalLocale(locale))return {};
 if(!practice){
  const cms=await publishedDetail('YOGA',slug);
  if(!cms)return {robots:{index:false,follow:false}};
  return {title:cms.document.title[locale]+' | Galaxiora Yoga',description:cms.document.summary[locale],robots:indexRobots(),alternates:{canonical:'/'+locale+'/yoga/'+slug,languages:{uk:'/uk/yoga/'+slug,en:'/en/yoga/'+slug}}};
 }
 return {title:say(practice.title,locale)+' | Galaxiora Yoga',
  description:say(practice.purpose,locale),robots:indexRobots(),
  alternates:{canonical:'/'+locale+'/yoga/'+slug,languages:{uk:'/uk/yoga/'+slug,en:'/en/yoga/'+slug}}};
}
export default async function YogaPracticePage({params}:Params){
 const {locale,slug}=await params,practice=yogaBySlug(slug);
 if(!isPortalLocale(locale))notFound();
 if(!practice){
  const cms=await publishedDetail('YOGA',slug);
  if(!cms)notFound();
  return <EditorialArticle entry={cms} locale={locale}/>;
 }
 const uk=locale==='uk';
 return <PortalShell locale={locale} active="yoga" languagePath={'yoga/'+slug}>
  <div className="as-wellness as-wellness-detail">
   <Link href={'/'+locale+'/yoga'} className="as-wellness-back"><ArrowLeft size={16}/>{uk?'До всіх практик':'All practices'}</Link>
   <header className="as-wellness-detail-head">
    <span className="as-overline">GALAXIORA YOGA</span>
    <h1>{say(practice.title,locale)}</h1>
    <p><GlossaryText text={say(practice.purpose,locale)} locale={locale}/></p>
    <div className="as-wellness-tags"><span>{practice.category==='breathing'?sessionMs(BREATHING_PATTERNS[0])/60000:practice.steps.reduce((sum,s)=>sum+s.seconds,0)/60} {uk?'хвилин':'minutes'}</span><span>{practice.category==='breathing'?BREATHING_PATTERNS[0].rounds:practice.steps.length} {practice.category==='breathing'?(uk?'циклів':'cycles'):(uk?'підказок':'guides')}</span></div>
   </header>
   <aside className="as-wellness-prep"><h2>{uk?'Перед початком':'Before you begin'}</h2><p><GlossaryText text={say(practice.preparation,locale)} locale={locale}/></p></aside>
   <YogaSession practice={practice} locale={locale}/>
   <PracticeCompletionButton slug={practice.slug} locale={locale}/>
   <aside className="as-wellness-note"><ShieldCheck size={22} aria-hidden="true"/><div><strong>{uk?'Важливо':'Safety first'}</strong><p><GlossaryText text={say(practice.safety,locale)} locale={locale}/></p></div></aside>
   <div className="as-wellness-next"><Link href={'/'+locale+'/learn/yoga-roots-and-safety'}>{uk?'Більше про йогу в Академії':'Explore yoga in Academy'} <ArrowUpRight size={16}/></Link></div>
  </div></PortalShell>;
}