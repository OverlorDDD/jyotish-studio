import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import PortalShell from '../../components/PortalShell';
import PanchangaHub from '../../components/PanchangaHub';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../lib/brand';
import {indexRobots} from '../../../lib/site-indexing';
const SEO_COPY={"uk":{"title":"Панчанга — ведичний календар і фази Місяця","description":"Панчанга для будь-якого міста світу: тітхі, накшатра, йога, карана, схід Сонця, місячні фази та ведичні свята."},"en":{"title":"Panchanga — Vedic Calendar and Moon Phases","description":"Worldwide Panchanga: tithi, nakshatra, yoga, karana, sunrise, lunar phases and traditional Vedic observances."}} as const;
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
 </PortalShell>;
}
