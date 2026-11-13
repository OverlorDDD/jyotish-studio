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
 // page. Guests can draw the card of the day and 3 spreads a day without an account.
 const seo=section==='tarot'?{
  title:locale==='uk'?'Таро онлайн — безкоштовні розклади: карта дня, так чи ні, кохання':'Free Online Tarot Readings — Card of the Day, Yes or No, Love',
  description:locale==='uk'?'Безкоштовне Таро онлайн без реєстрації: карта дня, розклад «так чи ні», на кохання, роботу й тиждень, значення всіх 78 карт і особисте питання живому тарологу.':'Free online Tarot with no sign-up: card of the day, yes-or-no, love, work and weekly spreads, meanings of all 78 cards and a personal question to a human reader.'
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
