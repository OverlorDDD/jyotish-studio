import type {Metadata} from 'next';
import {notFound,redirect,permanentRedirect} from 'next/navigation';
import PortalSection,{isPortalSection,SECTIONS,SECTION_COPY} from '../../components/PortalSection';
import {BRAND,moduleTitle,isPortalLocale,portalPath,type PortalLocale} from '../../../lib/brand';
import {indexRobots,INDEXED_SECTIONS} from '../../../lib/site-indexing';

export const dynamicParams=false;
export function generateStaticParams(){return BRAND.locales.flatMap(locale=>SECTIONS.map(section=>({locale,section})));}
export async function generateMetadata({params}:{params:Promise<{locale:string;section:string}>}):Promise<Metadata>{
 const {locale,section}=await params;
 if(!isPortalLocale(locale)||!isPortalSection(section))return {};
 const data=SECTION_COPY[locale][section];
 if(section==='experts')return {title:data.title,robots:{index:false,follow:true},alternates:{canonical:'/'+locale+'/tarot'}};
 // Search intent must land on the actual tool route, not on a generic portal
 // page. Tarot has an account-gated draw, so do not claim anonymous readings.
 const seo=section==='tarot'?{
  title:locale==='uk'?'Таро онлайн — безкоштовні розклади на 1, 3 і 10 карт':'Free Online Tarot Readings — 1, 3 & 10 Card Spreads',
  description:locale==='uk'?'78 класичних карт Таро, розклади на 1, 3 і 10 карт, прямі та перевернуті значення. Увійди, щоб зробити й зберегти власний розклад.':'Explore 78 classic Tarot cards, 1-, 3- and 10-card spreads, and upright or reversed meanings. Sign in to draw and save your reading.'
 }:section==='yoga'?{title:locale==='uk'?'Йога й медитація — покрокові практики':'Yoga & Mindfulness — Guided Practices',description:locale==='uk'?'Чотири доступні практики йоги та уважності з таймером і поясненнями.':'Four guided yoga and mindfulness sessions with step-by-step support.'}:section==='learn'?{title:locale==='uk'?'Академія — уроки Джйотіш, Таро та йоги':'Academy — Jyotish, Tarot & Yoga Lessons',description:locale==='uk'?'Вісім авторських уроків про Джйотіш, Таро та уважність із перевіркою знань.':'Eight original lessons on Jyotish, Tarot and mindful practice with quizzes.'}:null;
 return {
  title:moduleTitle(section)+(seo?' — '+seo.title:' — '+data.title),description:seo?.description??data.lead,
  robots:indexRobots(INDEXED_SECTIONS.some(item=>item===section)),
  alternates:{canonical:'/'+locale+'/'+section,languages:{en:'/en/'+section,uk:'/uk/'+section,'x-default':'/en/'+section}}
 };
}
export default async function SectionPage({params}:{params:Promise<{locale:string;section:string}>}){
 const {locale,section}=await params;
 if(!isPortalLocale(locale)||!isPortalSection(section))notFound();
 if(section==='experts')redirect(portalPath(locale,'tarot')+'#human-readings');
 if(section==='learn')permanentRedirect('/'+locale+'/pedia');
 return <PortalSection locale={locale as PortalLocale} section={section}/>;
}
