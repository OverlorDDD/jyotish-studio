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
import {indexRobots,publicSiteOrigin,publicIndexingEnabled} from '../../../../lib/site-indexing';

export const dynamicParams=false;
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 return {
  title:locale==='uk'?'Натальна карта Джйотіш онлайн — 16 карт | Galaxiora':'Free Vedic Birth Chart Calculator (16 Charts) | Galaxiora',
  description:locale==='uk'?'Розрахуйте безкоштовну натальну карту Джйотіш онлайн. 16 дробових карт D1–D60, зокрема D9 і D10, за часом і місцем народження. Без реєстрації.':'Calculate a free Vedic birth chart (Kundli) using Swiss Ephemeris and Lahiri ayanamsa. Explore D1, D9, D10 and 16 divisional charts. No signup.',
  robots:indexRobots(),
  openGraph:{type:'website',title:locale==='uk'?'Безкоштовна натальна карта Джйотіш | Galaxiora':'Free Vedic Birth Chart Calculator | Galaxiora',
   description:locale==='uk'?'Безкоштовний розрахунок 16 ведичних карт. D60 має окремі обмеження точності часу народження.':'Free Kundli calculator with D1, D9, D10 and 16 Vedic divisional charts. D60 has birth-time precision limits.',images:['/opengraph-image'],url:'/'+locale+'/astrology/jyotish'},
  alternates:{canonical:'/'+locale+'/astrology/jyotish',languages:{en:'/en/astrology/jyotish',uk:'/uk/astrology/jyotish','x-default':'/en/astrology/jyotish'}}
 };
}
export default async function JyotishPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 // Public WebApplication markup: factual free-tool features, never invented reviews.
 // It is suppressed automatically for preview or noindex origins.
 const origin=publicIndexingEnabled()?publicSiteOrigin():null;
 const schema=origin?{
  '@context':'https://schema.org','@type':'WebApplication',
  name:locale==='uk'?'Калькулятор натальної карти Джйотіш Galaxiora':'Galaxiora Vedic Birth Chart Calculator',
  url:origin+'/'+locale+'/astrology/jyotish',
  inLanguage:locale,
  description:locale==='uk'?'Безкоштовний розрахунок натальної карти за часом і місцем народження.':'Free Vedic birth chart (Kundli) using Swiss Ephemeris and Lahiri ayanamsa.',
  applicationCategory:'EducationalApplication',operatingSystem:'Web browser',isAccessibleForFree:true,
  offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},
  featureList:locale==='uk'
   ?['16 дробових карт Шодашаварги','D1, D9 та D10','Попередня D60 з обмеженням точності часу']
   :['16 Shodashavarga divisional charts','D1, D9 and D10','Provisional D60 with birth-time sensitivity limits']
 }:null;
 return <PortalShell locale={locale as 'en'|'uk'} active="astrology" languagePath="astrology/jyotish">
  {schema&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>}
  <JyotishCalculator initialLang={locale as 'en'|'uk'}/><SiteSectionsHub locale={locale as 'en'|'uk'}/><JyotishSearchGuide locale={locale as 'en'|'uk'}/><div className="as-wellness" style={{margin:'14px auto',padding:'16px 22px',maxWidth:1050}}><Link href={'/'+locale+'/astrology/divisional-charts'}>{locale==='uk'?'Докладний довідник усіх 16 карт Шодашаварги (D1–D60)':'Explore all 16 Shodashavarga charts (D1–D60) and their methods'}</Link></div><OrganicIntentBridge kind="jyotish" locale={locale as 'en'|'uk'}/><GalaxiComModuleLink locale={locale as 'en'|'uk'} kind="jyotish"/></PortalShell>;
}
