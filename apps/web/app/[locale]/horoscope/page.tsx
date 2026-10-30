import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import PortalShell from '../../components/PortalShell';
import HoroscopeHub from '../../components/HoroscopeHub';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../lib/brand';
import {indexRobots} from '../../../lib/site-indexing';
const SEO_COPY={"uk":{"title":"Гороскопи Джйотіш для 12 місячних знаків","description":"Щоденні й тижневі гороскопи за сидеричним Місяцем, перевірений персональний прогноз за натальною картою, транзити й джерела."},"en":{"title":"Jyotish Horoscopes for All 12 Moon Signs","description":"Daily and weekly sidereal Moon-sign horoscopes, verified birth-chart readings, planetary transits and classical Jyotish sources."}} as const;
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
