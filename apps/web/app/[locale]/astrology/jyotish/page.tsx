import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import JyotishCalculator from '../../../astrology/jyotish/page';
import PortalShell from '../../../components/PortalShell';
import GalaxiComModuleLink from '../../../components/GalaxiComModuleLink';
import {JyotishSearchGuide} from '../../../components/SearchGuides';
import VargaSeoGuide from '../../../components/VargaSeoGuide';
import {BRAND,moduleTitle,isPortalLocale} from '../../../../lib/brand';
import {indexRobots} from '../../../../lib/site-indexing';

export const dynamicParams=false;
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 return {
  title:(locale==='uk'?'Натальна карта онлайн — безкоштовний калькулятор Джйотіш D1–D60':'Free Vedic Birth Chart Calculator (Kundli) — D1–D60')+' — '+moduleTitle('jyotish'),
  description:locale==='uk'?'Калькулятор натальної карти Джйотіш: D1, D9, D10 та всі 16 дробових карт до D60, порівняння варг, накшатри й Вімшоттарі-даша.':'Calculate a free Vedic birth chart (Kundli) with Swiss Ephemeris. Explore 16 divisional charts D1–D60, compare Navamsa D9 and Dashamsa D10, and see Vimshottari Dasha.',
  robots:indexRobots(),
  alternates:{canonical:'/'+locale+'/astrology/jyotish',languages:{en:'/en/astrology/jyotish',uk:'/uk/astrology/jyotish','x-default':'/en/astrology/jyotish'}}
 };
}
export default async function JyotishPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale as 'en'|'uk'} active="astrology" languagePath="astrology/jyotish"><JyotishCalculator initialLang={locale as 'en'|'uk'}/><JyotishSearchGuide locale={locale as 'en'|'uk'}/><VargaSeoGuide locale={locale as 'en'|'uk'}/><GalaxiComModuleLink locale={locale as 'en'|'uk'} kind="jyotish"/></PortalShell>;
}
