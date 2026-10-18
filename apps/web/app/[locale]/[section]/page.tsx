import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import PortalSection,{isPortalSection,SECTIONS,SECTION_COPY} from '../../components/PortalSection';
import {BRAND,moduleTitle,isPortalLocale,type PortalLocale} from '../../../lib/brand';

export const dynamicParams=false;
export function generateStaticParams(){return BRAND.locales.flatMap(locale=>SECTIONS.map(section=>({locale,section})));}
export async function generateMetadata({params}:{params:Promise<{locale:string;section:string}>}):Promise<Metadata>{
 const {locale,section}=await params;
 if(!isPortalLocale(locale)||!isPortalSection(section))return {};
 const data=SECTION_COPY[locale][section];
 return {
  title:data.title+' — '+moduleTitle(section),description:data.lead,
  alternates:{canonical:'/'+locale+'/'+section,languages:{en:'/en/'+section,uk:'/uk/'+section}}
 };
}
export default async function SectionPage({params}:{params:Promise<{locale:string;section:string}>}){
 const {locale,section}=await params;
 if(!isPortalLocale(locale)||!isPortalSection(section))notFound();
 return <PortalSection locale={locale as PortalLocale} section={section}/>;
}
