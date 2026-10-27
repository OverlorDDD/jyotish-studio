import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import PortalShell from '../../components/PortalShell';
import PanchangaHub from '../../components/PanchangaHub';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../lib/brand';
export const metadata:Metadata={
 title:'Панчанга — місячний календар і точні переходи | Galaxiora',
 description:'Тітхі, накшатра, вара, йога і карана за Swiss Ephemeris, час місцевого сходу Сонця та точні календарні переходи.'
};
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export default async function PanchangaPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale as PortalLocale} active="panchanga" languagePath="panchanga">
  <PanchangaHub locale={locale as PortalLocale}/>
 </PortalShell>;
}
