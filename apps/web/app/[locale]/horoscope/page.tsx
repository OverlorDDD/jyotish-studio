import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import PortalShell from '../../components/PortalShell';
import HoroscopeHub from '../../components/HoroscopeHub';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../lib/brand';
import {indexRobots} from '../../../lib/site-indexing';
const SEO_COPY={"uk":{"title":"Гороскопи для 12 знаків — західні та ведичні","description":"Західні гороскопи за тропічним Сонцем, ведичні прогнози за сидеричним Місяцем і персональний аналіз натальної карти. Точні розрахунки Swiss Ephemeris."},"en":{"title":"Horoscopes for 12 Signs — Western Sun & Vedic Moon","description":"Western tropical Sun-sign horoscopes, Vedic sidereal Moon-sign readings, and personalized birth-chart guidance computed from Swiss Ephemeris."}} as const;
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 const current=SEO_COPY[locale],path="horoscope";
 const canonical='/'+locale+'/'+path;
 return {title:current.title+' | Galaxiora',description:current.description,robots:indexRobots(),
  alternates:{canonical,languages:{uk:'/uk/'+path,en:'/en/'+path,'x-default':'/en/'+path}},
  openGraph:{title:current.title,description:current.description,type:'website',locale:locale==='uk'?'uk_UA':'en_US',
   url:canonical,siteName:'Galaxiora'},
  twitter:{card:'summary_large_image',title:current.title,description:current.description}};
}
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export default async function HoroscopePage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale as PortalLocale} active="horoscope" languagePath="horoscope">
  <HoroscopeHub locale={locale as PortalLocale}/>
 </PortalShell>;
}
