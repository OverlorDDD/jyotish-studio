import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import PortalShell from '../../components/PortalShell';
import ExpertMarketplace from '../../components/ExpertMarketplace';
import {BRAND,isPortalLocale} from '../../../lib/brand';
export const metadata:Metadata={title:'Експерти Galaxiora | Galaxiora Practitioners',description:'Публічні перевірені експертні профілі Galaxiora / Verified Galaxiora practitioner profiles.'};
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
export default async function ExpertsPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 return <PortalShell locale={locale}><ExpertMarketplace locale={locale}/></PortalShell>;
}
