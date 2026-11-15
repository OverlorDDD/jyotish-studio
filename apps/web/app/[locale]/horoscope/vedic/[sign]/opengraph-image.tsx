import {OG_SIZE,signCard} from '../../../../../lib/og-cards';
export const alt='Galaxiora horoscope';
export const size=OG_SIZE;
export const contentType='image/png';
export default async function Image({params}:{params:Promise<{locale:string;sign:string}>}){
 const p=await params;
 return signCard(p.locale,'vedic',p.sign,'today');
}
