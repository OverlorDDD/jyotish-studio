/**
 * D2 Uma-Shambhu Hora (US) from JHora's original author P.V.R. Narasimha Rao,
 * "Parasara's Hora Chart Decoded: Uma-Shambhu Hora", 2012, pp. 1–2.
 * 12 zodiac signs × 2 halves, 24 cells; 0-based result.
 * Explicit ALTERNATIVE to the existing Sun/Moon Cancer/Leo D2.
 * This module does not switch the production profile.
 */
export const N4_D2_US_PROFILE='n4-hora-uma-shambhu-author-2012-v1' as const;
const HALF_SIGNS: readonly (readonly [number,number])[]=[
 [0,1], [3,2], [4,5], [7,6], [8,9], [11,10],
 [0,1], [3,2], [4,5], [7,6], [8,9], [11,10]
] as const;
/** Sign is 0-based Aries=0 .. Pisces=11; exactly 15° goes to second half. */
export function n4UmaShambhuHoraSign(longitude:number):number{
 if(!Number.isFinite(longitude))throw new RangeError('Non-finite D2 longitude');
 const lon=((longitude%360)+360)%360;
 const sign=Math.floor(lon/30),part=(lon-sign*30)>=15?1:0;
 return HALF_SIGNS[sign][part];
}
