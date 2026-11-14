import {permanentRedirect} from 'next/navigation';
import {hubMetadata,renderHub} from '../../../lib/horoscope-page';
import {hubPath,signBySlug,signPath} from '../../../lib/horoscope-signs';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({params}:Props){return hubMetadata((await params).locale,'western');}
export default async function HoroscopePage({params,searchParams}:Props){
 const {locale}=await params,q=await searchParams;
 // Legacy bookmarks (?system=vedic&sign=gemini) consolidate to one canonical page.
 // The old hub defaulted to the Vedic Moon sign, so a bare ?sign= keeps that meaning.
 if((locale==='uk'||locale==='en')&&(typeof q.sign==='string'||typeof q.system==='string')){
  const system=q.system==='western'?'western':'vedic';
  const sign=typeof q.sign==='string'?signBySlug(q.sign.toLowerCase()):undefined;
  permanentRedirect(sign?signPath(locale,system,sign.slug):hubPath(locale,system));
 }
 return renderHub(locale,'western');
}
