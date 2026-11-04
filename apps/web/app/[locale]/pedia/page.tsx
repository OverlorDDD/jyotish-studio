import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import AcademyHub from '../../components/AcademyHub';
import {isPortalLocale} from '../../../lib/brand';
import {indexRobots} from '../../../lib/site-indexing';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale}=await params;
 if(!isPortalLocale(locale))return {};
 return {
  title:locale==='uk'?'GalaxiPedia — енциклопедія й Академія Джйотіш, Таро та Панчанги':'GalaxiPedia — Astrology, Jyotish & Panchanga Encyclopedia',
  description:locale==='uk'?'Двомовна енциклопедія астрології, Джйотіш, Панчанги, Таро, астрономії та йоги: уроки, словник, довідники й тести.':'Original bilingual astrology, Jyotish, Panchanga, Tarot, astronomy and yoga guides, lessons, glossary and knowledge checks.',
  robots:indexRobots(),
  alternates:{canonical:'/'+locale+'/pedia',languages:{en:'/en/pedia',uk:'/uk/pedia','x-default':'/en/pedia'}}
 };
}
export default async function PediaPage({params}:Props){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 return <AcademyHub locale={locale}/>;
}
