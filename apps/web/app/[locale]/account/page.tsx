import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import PortalShell from '../../components/PortalShell';
import AccountDashboard from '../../components/AccountDashboard';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../lib/brand';
export const metadata:Metadata={title:'Personal account',robots:{index:false,follow:false}};
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export default async function AccountPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale}><AccountDashboard locale={locale as PortalLocale}/></PortalShell>;
}
