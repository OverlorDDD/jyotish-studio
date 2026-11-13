import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import PortalShell from '../../components/PortalShell';
import PanchangaHub from '../../components/PanchangaHub';
import {PanchangaSearchGuide} from '../../components/SearchGuides';
import OrganicIntentBridge from '../../components/OrganicIntentBridge';
import PanchangaCityIndex from '../../components/PanchangaCityIndex';
import PanchangaQuickLinks from '../../components/PanchangaQuickLinks';
import PanchangaFaq from '../../components/PanchangaFaq';
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
  <PanchangaQuickLinks locale={locale as PortalLocale}/>
  <PanchangaHub locale={locale as PortalLocale}/>
  <OrganicIntentBridge kind="panchanga" locale={locale as PortalLocale}/>
  <PanchangaFaq locale={locale as PortalLocale}/>
  <details style={{width:'min(100% - 32px,1024px)',boxSizing:'border-box',margin:'0 auto 28px',padding:'16px clamp(16px,3vw,26px)',
   borderRadius:'20px',border:'1px solid rgba(214,185,127,.26)',background:'linear-gradient(145deg,#1b2b44,#16243a)',color:'#e6ecf5'}}>
   <summary style={{cursor:'pointer',fontWeight:700,color:'#e8c08a'}}>{locale==='uk'?'Як читати Панчангу: короткий довідник':'How to read Panchanga: guide'}</summary>
   <PanchangaSearchGuide locale={locale as PortalLocale}/>
  </details>

  <PanchangaCityIndex locale={locale as PortalLocale}/>
 </PortalShell>;
}
