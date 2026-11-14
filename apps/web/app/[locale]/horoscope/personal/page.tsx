import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import PortalShell from '../../../components/PortalShell';
import HoroscopeHub from '../../../components/HoroscopeHub';
import {isPortalLocale,type PortalLocale} from '../../../../lib/brand';
/** Personal horoscope from the visitor's saved birth chart (and the earlier
 * per-sign explorer). Account-dependent, so not indexed. */
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;const uk=locale==='uk';
 return {title:(uk?'Мій персональний гороскоп':'My personal horoscope')+' | Galaxiora',robots:{index:false,follow:true},
  alternates:{canonical:'/'+locale+'/horoscope/personal'}};
}
export default async function PersonalHoroscopePage({params}:Props){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale as PortalLocale} active="horoscope" languagePath="horoscope/personal">
  <HoroscopeHub locale={locale as PortalLocale}/>
 </PortalShell>;
}
