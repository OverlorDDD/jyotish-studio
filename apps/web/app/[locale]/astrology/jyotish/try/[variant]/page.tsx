import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {BRAND,isPortalLocale} from '../../../../../../lib/brand';
import PortalShell from '../../../../../components/PortalShell';
import Calculator from '../../../../../astrology/jyotish/page';

type Params=Promise<{locale:string;variant:string}>;
export const dynamicParams=false;
export function generateStaticParams(){return BRAND.locales.flatMap(locale=>['short','steps'].map(variant=>({locale,variant})));}
export async function generateMetadata({params}:{params:Params}):Promise<Metadata>{
 const {locale}=await params;
 return {title:locale==='uk'?'Натальна карта Джйотіш | Galaxiora':'Vedic birth chart | Galaxiora',
  robots:{index:false,follow:false},alternates:{canonical:'/'+locale+'/astrology/jyotish'}};
}
export default async function Page({params}:{params:Params}){
 const {locale,variant}=await params;
 if(!isPortalLocale(locale)||(variant!=='short'&&variant!=='steps'))notFound();
 return <PortalShell locale={locale} active="astrology" languagePath={'astrology/jyotish/try/'+variant}>
  <Calculator initialLang={locale} variant={variant}/>
 </PortalShell>;
}
