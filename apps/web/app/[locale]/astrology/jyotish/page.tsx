import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import JyotishCalculator from '../../../astrology/jyotish/page';
import PortalShell from '../../../components/PortalShell';
import GalaxiComModuleLink from '../../../components/GalaxiComModuleLink';
import {JyotishSearchGuide} from '../../../components/SearchGuides';
import OrganicIntentBridge from '../../../components/OrganicIntentBridge';
import {BRAND,isPortalLocale} from '../../../../lib/brand';
import {indexRobots} from '../../../../lib/site-indexing';

export const dynamicParams=false;
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 return {
  title:locale==='uk'?'Натальна карта Джйотіш — 16 карт | Galaxiora':'Free Vedic Birth Chart (16 Charts) | Galaxiora',
  description:locale==='uk'?'Безкоштовний калькулятор натальної карти Джйотіш із Swiss Ephemeris, накшатрами та періодами Даша.':'Calculate a free Vedic birth chart (Kundli) using Swiss Ephemeris. Explore D1, D9, D10, your Moon sign, Nakshatra and Vimshottari Dasha.',
  robots:indexRobots(),
  alternates:{canonical:'/'+locale+'/astrology/jyotish',languages:{en:'/en/astrology/jyotish',uk:'/uk/astrology/jyotish','x-default':'/en/astrology/jyotish'}}
 };
}
export default async function JyotishPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale as 'en'|'uk'} active="astrology" languagePath="astrology/jyotish"><JyotishCalculator initialLang={locale as 'en'|'uk'}/><JyotishSearchGuide locale={locale as 'en'|'uk'}/><OrganicIntentBridge kind="jyotish" locale={locale as 'en'|'uk'}/><GalaxiComModuleLink locale={locale as 'en'|'uk'} kind="jyotish"/></PortalShell>;
}
