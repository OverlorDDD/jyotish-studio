import {permanentRedirect,notFound} from 'next/navigation';
import {BRAND,isPortalLocale,portalPath} from '../../lib/brand';
export const dynamicParams=false;
export function generateStaticParams(){return BRAND.locales.map(locale=>({locale}));}
/** /en and /uk are permanent aliases of the actual natal chart tools. */
export default async function LocalizedHome({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isPortalLocale(locale))notFound();
 permanentRedirect(portalPath(locale,'astrology/jyotish'));
}
