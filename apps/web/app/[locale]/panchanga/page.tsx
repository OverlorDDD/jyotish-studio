import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import PortalShell from '../../components/PortalShell';
import PanchangaHub from '../../components/PanchangaHub';
import {PanchangaSearchGuide} from '../../components/SearchGuides';
import OrganicIntentBridge from '../../components/OrganicIntentBridge';
import PanchangaCityIndex from '../../components/PanchangaCityIndex';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../lib/brand';
import {indexRobots} from '../../../lib/site-indexing';
const SEO_COPY={"uk":{"title":"Панчанга сьогодні — Тітхі та Накшатра","description":"Панчанга сьогодні для вашого міста: місцевий час тітхі, накшатри, сходу Сонця, йоги та карани. Обирайте дату й місто для ведичного календаря."},"en":{"title":"Panchang Today by City — Tithi & Nakshatra","description":"Check today's Panchanga for your city: exact local tithi, nakshatra, sunrise, yoga, karana and traditional Vedic timing. Select your location and date."}} as const;
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 const current=SEO_COPY[locale],path="panchanga";
 const canonical='/'+locale+'/'+path;
 return {title:current.title+' | Galaxiora',description:current.description,robots:indexRobots(),
  alternates:{canonical,languages:{uk:'/uk/'+path,en:'/en/'+path,'x-default':'/en/'+path}},
  openGraph:{title:current.title,description:current.description,type:'website',locale:locale==='uk'?'uk_UA':'en_US',
   url:canonical,siteName:'Galaxiora'},
  twitter:{card:'summary_large_image',title:current.title,description:current.description}};
}
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export default async function PanchangaPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale as PortalLocale} active="panchanga" languagePath="panchanga">
  <PanchangaHub locale={locale as PortalLocale}/>
  <OrganicIntentBridge kind="panchanga" locale={locale as PortalLocale}/>
  <details className="as-wellness" style={{margin:'24px 0',padding:'16px',borderRadius:'14px'}}>
   <summary style={{cursor:'pointer',fontWeight:700}}>{locale==='uk'?'Як читати Панчангу: короткий довідник':'How to read Panchanga: guide'}</summary>
   <PanchangaSearchGuide locale={locale as PortalLocale}/>
  </details>

  <PanchangaCityIndex locale={locale as PortalLocale}/>
 </PortalShell>;
}
