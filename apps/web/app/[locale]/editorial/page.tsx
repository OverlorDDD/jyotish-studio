import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import PortalShell from '../../components/PortalShell';
import EditorialWorkspace from '../../components/EditorialWorkspace';
import {BRAND,isPortalLocale} from '../../../lib/brand';
export const metadata:Metadata={title:'Редакція Galaxiora | Editorial',robots:{index:false,follow:false}};
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export default async function EditorialPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale}><div className="as-wellness"><EditorialWorkspace locale={locale}/></div></PortalShell>;
}