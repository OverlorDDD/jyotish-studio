import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import PortalShell from '../../components/PortalShell';
import PersonalDashboard from '../../components/personal/PersonalDashboard';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../lib/brand';
export const metadata:Metadata={title:'Galaxiora Personal — Your Universe',description:'Your private natal chart, dasha, transit calendar, Tarot, practices and journal.',robots:{index:false,follow:false}};
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export default async function PersonalPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale as PortalLocale} active="personal" languagePath="personal"><PersonalDashboard locale={locale as PortalLocale}/></PortalShell>;
}
