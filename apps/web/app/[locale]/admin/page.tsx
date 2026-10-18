import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import PortalShell from '../../components/PortalShell';
import AdminDashboard from '../../components/AdminDashboard';
import {BRAND,isPortalLocale,type PortalLocale} from '../../../lib/brand';
export const metadata:Metadata={title:'Site operations',robots:{index:false,follow:false}};
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export default async function AdminPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale}><AdminDashboard locale={locale as PortalLocale}/></PortalShell>;
}
