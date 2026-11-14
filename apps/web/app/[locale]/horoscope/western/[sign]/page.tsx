import {notFound,permanentRedirect} from 'next/navigation';
import {isPortalLocale} from '../../../../../lib/brand';
import {signBySlug} from '../../../../../lib/horoscope-signs';
/** Legacy Western sign URL: the Western horoscope now lives at /horoscope/{sign}. */
type Props={params:Promise<{locale:string;sign:string}>};
export default async function LegacyWesternSign({params}:Props){
 const {locale,sign}=await params;
 if(!isPortalLocale(locale)||!signBySlug(sign))notFound();
 permanentRedirect('/'+locale+'/horoscope/'+sign);
}
