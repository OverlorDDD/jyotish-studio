import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import JyotishCalculator from '../../../astrology/jyotish/page';
import PortalShell from '../../../components/PortalShell';
import GalaxiComModuleLink from '../../../components/GalaxiComModuleLink';
import {JyotishSearchGuide} from '../../../components/SearchGuides';
import Link from 'next/link';
import OrganicIntentBridge from '../../../components/OrganicIntentBridge';
import SiteSectionsHub from '../../../components/SiteSectionsHub';
import {BRAND,isPortalLocale} from '../../../../lib/brand';
import {indexRobots} from '../../../../lib/site-indexing';

export const dynamicParams=false;
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 return {
  title:locale==='uk'?'Натальна карта Джйотіш — 16 карт | Galaxiora':'Free Vedic Birth Chart (16 Charts) | Galaxiora',
  description:locale==='uk'?'Безкоштовна ведична натальна карта: 16 карт життя для дослідження сильних сторін, викликів, стосунків і кар’єри. Розрахунок за датою, часом і містом народження.':'Create your free Vedic birth chart (Kundli). Explore strengths, challenges, relationships and career through 16 life charts.',
  robots:indexRobots(),
  openGraph:{type:'website',title:locale==='uk'?'Натальна карта онлайн — 16 ведичних карт | Galaxiora':'Free Vedic Birth Chart — Explore 16 Charts | Galaxiora',
   description:locale==='uk'?'16 карт життя: досліджуй сильні сторони, виклики, стосунки та кар’єру через ведичну натальну карту.':'Explore strengths, challenges, relationships and career with 16 traditional Vedic life charts.',url:'/'+locale+'/astrology/jyotish'},
  alternates:{canonical:'/'+locale+'/astrology/jyotish',languages:{en:'/en/astrology/jyotish',uk:'/uk/astrology/jyotish','x-default':'/en/astrology/jyotish'}}
 };
}
export default async function JyotishPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale as 'en'|'uk'} active="astrology" languagePath="astrology/jyotish"><JyotishCalculator initialLang={locale as 'en'|'uk'}/><SiteSectionsHub locale={locale as 'en'|'uk'}/><JyotishSearchGuide locale={locale as 'en'|'uk'}/><div className="as-wellness" style={{margin:'14px auto',padding:'16px 22px',maxWidth:1050}}><Link href={'/'+locale+'/astrology/divisional-charts'}>{locale==='uk'?'Докладний довідник усіх 16 карт Шодашаварги (D1–D60)':'Explore all 16 Shodashavarga charts (D1–D60) and their methods'}</Link></div><OrganicIntentBridge kind="jyotish" locale={locale as 'en'|'uk'}/><GalaxiComModuleLink locale={locale as 'en'|'uk'} kind="jyotish"/></PortalShell>;
}
