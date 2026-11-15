import {OG_SIZE,compatCard} from '../../../../lib/og-cards';
export const alt='Galaxiora horoscope';
export const size=OG_SIZE;
export const contentType='image/png';
export default async function Image({params}:{params:Promise<{locale:string}>}){
 const p=await params;
 return compatCard(p.locale);
}
