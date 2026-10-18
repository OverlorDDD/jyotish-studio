import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import JyotishCalculator from '../../../astrology/jyotish/page';
import {BRAND,isPortalLocale} from '../../../../lib/brand';

export const dynamicParams=false;
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 return {
  title:locale==='uk'?'Натальна карта Джйотіш — D1, D9, D10':'Vedic Birth Chart Calculator — D1, D9, D10',
  description:locale==='uk'?'Безкоштовний калькулятор натальної карти Джйотіш із Swiss Ephemeris, накшатрами та періодами Даша.':'Free Jyotish Vedic birth chart using Swiss Ephemeris, Nakshatras, Navamsa and Vimshottari Dasha.',
  alternates:{canonical:'/'+locale+'/astrology/jyotish',languages:{en:'/en/astrology/jyotish',uk:'/uk/astrology/jyotish'}}
 };
}
export default async function JyotishPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 return <JyotishCalculator initialLang={locale as 'en'|'uk'}/>;
}
