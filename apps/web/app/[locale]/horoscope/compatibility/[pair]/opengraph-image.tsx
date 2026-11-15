import {OG_SIZE,pairCard} from '../../../../../lib/og-cards';
export const alt='Galaxiora horoscope';
export const size=OG_SIZE;
export const contentType='image/png';
export default async function Image({params}:{params:Promise<{locale:string;pair:string}>}){
 const p=await params;
 return pairCard(p.locale,p.pair);
}
