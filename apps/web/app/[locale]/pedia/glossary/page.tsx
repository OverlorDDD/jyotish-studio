import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft} from 'lucide-react';
import PortalShell from '../../../components/PortalShell';
import PediaGlossary from '../../../components/PediaGlossary';
import {GLOSSARY} from '../../../../lib/glossary';
import {PEDIA_ARTICLES} from '../../../../lib/pedia-content';
import {ACADEMY_LESSONS} from '../../../../lib/academy-content';
import {isPortalLocale} from '../../../../lib/brand';
import {indexRobots} from '../../../../lib/site-indexing';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 return {title:locale==='uk'?'Астрологічний словник — Джйотіш, Панчанга, Таро | GalaxiPedia':'Astrology Glossary — Jyotish, Panchanga & Tarot | GalaxiPedia',
  description:locale==='uk'?'Двомовні пояснення термінів Панчанги, астрології, Джйотіш і Таро з переходами до повних статей та інструментів.':'Clear bilingual definitions of Panchanga, Jyotish, astrology and Tarot terms, linked to original lessons and tools.',
  robots:indexRobots(),alternates:{canonical:'/'+locale+'/pedia/glossary',languages:{en:'/en/pedia/glossary',uk:'/uk/pedia/glossary','x-default':'/en/pedia/glossary'}}};
}
const LINKS:Record<string,string>={
 lagna:'sun-moon-rising-signs-compared',rashi:'sun-moon-rising-signs-compared',
 sidereal:'sun-moon-rising-signs-compared',ayanamsha:'sidereal-and-tropical',
 navamsa:'divisional-charts',dashamsa:'divisional-charts',nakshatra:'nakshatras',
 vimshottari:'vimshottari-life-cycle',dasha:'vimshottari-life-cycle',
 mahadasha:'vimshottari-life-cycle',antardasha:'vimshottari-life-cycle',
 panchanga:'panchanga-five-limbs-explained',tithi:'panchanga-five-limbs-explained',
 karana:'panchanga-five-limbs-explained',vara:'panchanga-five-limbs-explained',
 'nitya-yoga':'panchanga-five-limbs-explained',muhurta:'panchanga-five-limbs-explained',
 'rahu-kalam':'panchanga-five-limbs-explained',paksha:'moon-phases-and-lunar-calendar',
 amavasya:'moon-phases-and-lunar-calendar',purnima:'moon-phases-and-lunar-calendar'
};
export default async function GlossaryPage({params}:Props){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 const uk=locale==='uk';
 const entries=GLOSSARY.map(term=>{
  const slug=LINKS[term.id];
  const article=[...PEDIA_ARTICLES,...ACADEMY_LESSONS].find(x=>x.slug===slug);
  const label=term.forms.find(x=>uk?/[а-яіїєґ]/i.test(x):/^[a-z]/i.test(x))||term.forms[0]||term.id;
  return {id:term.id,label:label.slice(0,1).toLocaleUpperCase(uk?'uk':'en')+label.slice(1),
   definition:term[locale],forms:term.forms,related:article?{slug:article.slug,title:article.title[locale]}:undefined};
 }).sort((a,b)=>a.label.localeCompare(b.label,uk?'uk':'en'));
 return <PortalShell locale={locale} active="learn" languagePath="pedia/glossary">
  <div className="as-wellness as-academy-detail">
   <Link href={'/'+locale+'/pedia'} className="as-wellness-back"><ArrowLeft size={16}/>{uk?'До GalaxiPedia':'Back to GalaxiPedia'}</Link>
   <header className="as-wellness-detail-head">
    <span className="as-overline">GALAXIPEDIA · {uk?'СЛОВНИК':'GLOSSARY'}</span>
    <h1>{uk?'Словник астрології та Джйотіш':'Astrology and Jyotish glossary'}</h1>
    <p>{uk?'Зрозумілі визначення, альтернативні назви та переходи до перевірених матеріалів.':'Readable definitions, alternate spellings and links to relevant reference articles.'}</p>
   </header>
   <PediaGlossary locale={locale} entries={entries}/>
  </div>
 </PortalShell>;
}
