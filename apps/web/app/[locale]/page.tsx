import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import PortalHome from '../components/PortalHome';
import {BRAND,isPortalLocale,type PortalLocale} from '../../lib/brand';

export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 return {
  title: locale==='uk'?'Астрологія, Таро, йога та духовні практики':'Astrology, Tarot & Mindful Living',
  description:locale==='uk'?'Досліджуй натальні карти Джйотіш, Таро, медитацію та духовні практики в одному просторі.':'Explore Vedic astrology, tarot readings, mindfulness and personal growth in one place.',
  alternates:{canonical:'/'+locale,languages:{en:'/en',uk:'/uk','x-default':'/en'}}
 };
}
export default async function LocalizedHome({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 return <PortalHome locale={locale as PortalLocale}/>;
}
