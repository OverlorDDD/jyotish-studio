import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import JyotishCalculator from '../../../astrology/jyotish/page';
import PortalShell from '../../../components/PortalShell';
import GalaxiComModuleLink from '../../../components/GalaxiComModuleLink';
import {JyotishSearchGuide} from '../../../components/SearchGuides';
import OrganicIntentBridge from '../../../components/OrganicIntentBridge';
import {BRAND,moduleTitle,isPortalLocale} from '../../../../lib/brand';
import {indexRobots} from '../../../../lib/site-indexing';

export const dynamicParams=false;
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 return {
  title:(locale==='uk'?'Натальна карта онлайн безкоштовно — Джйотіш і 16 карт':'Free Vedic Birth Chart & Kundli Calculator — 16 Charts')+' — '+moduleTitle('jyotish'),
  description:locale==='uk'?'Створи натальну карту онлайн за датою, часом і місцем народження. 16 ведичних карт, знак Місяця, асцендент і накшатра — безкоштовно.':'Create your free Vedic birth chart (Kundli). Discover your rising sign, Moon sign, nakshatra, 16 divisional charts and Vimshottari Dasha.',
  robots:indexRobots(),
  openGraph:{type:'website',title:locale==='uk'?'Натальна карта онлайн — 16 ведичних карт | Galaxiora':'Free Vedic Birth Chart — Explore 16 Charts | Galaxiora',
   description:locale==='uk'?'Натальна карта безкоштовно: знак Місяця, асцендент і 16 ведичних дробових карт.':'Free birth chart with Moon sign, ascendant and all 16 classical Vedic divisional charts.',url:'/'+locale+'/astrology/jyotish'},
  alternates:{canonical:'/'+locale+'/astrology/jyotish',languages:{en:'/en/astrology/jyotish',uk:'/uk/astrology/jyotish','x-default':'/en/astrology/jyotish'}}
 };
}
export default async function JyotishPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale as 'en'|'uk'} active="astrology" languagePath="astrology/jyotish"><JyotishCalculator initialLang={locale as 'en'|'uk'}/><JyotishSearchGuide locale={locale as 'en'|'uk'}/><OrganicIntentBridge kind="jyotish" locale={locale as 'en'|'uk'}/><GalaxiComModuleLink locale={locale as 'en'|'uk'} kind="jyotish"/></PortalShell>;
}
