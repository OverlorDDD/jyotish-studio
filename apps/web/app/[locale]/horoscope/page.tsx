import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import PortalShell from '../../components/PortalShell';
import HoroscopeHub from '../../components/HoroscopeHub';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../lib/brand';
export const metadata:Metadata={title:'Гороскопи Джйотіш — 12 знаків і персональні прогнози | Galaxiora',
 description:'Сидеричний місячний гороскоп для всіх 12 знаків та персональні читання за перевіреною натальною картою й традицією Джйотіш.'};
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export default async function HoroscopePage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale as PortalLocale} active="horoscope" languagePath="horoscope">
  <HoroscopeHub locale={locale as PortalLocale}/>
 </PortalShell>;
}
