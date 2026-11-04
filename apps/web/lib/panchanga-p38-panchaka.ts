/**
 * Raman's Chapter III electional PANCHAKA (not the five limbs of PANCHANGA).
 *
 * Inputs: actual Tithi index 1..30, Vedic weekday 1..7 (Sunday=1),
 * active Nakshatra index 1..27, **ELECTIONAL** Lagna 1..12 at the EVENT
 * location and moment. NEVER substitute birth Lagna.
 *
 * B. V. Raman, Muhurtha, Chapter III: (Tithi + Vara + Nakshatra +
 * Lagna) mod 9. Consequences are activity-scoped and subject to
 * the author's expressly stated traditional reservations/exceptions.
 * A clear remainder is NOT a full auspicious election.
 * https://ved.bz/_jyotish/books/muhurtha.html
 */
export type P38PanchakaScope='occupation'|'home_building'|'travel'|'marriage';
type PanchakaName='Mrityu'|'Agni'|'Raja'|'Chora'|'Roga'|'None';
export type P38Panchaka={
 version:'p38-raman-panchaka-v1';
 tithiNumber:number;varaNumber:number;nakshatraNumber:number;electionLagnaSign:number;
 sum:number;remainder:number;name:PanchakaName;
 applicableScope:P38PanchakaScope;
 forbiddenForScope:boolean;
 hasGeneralDosha:boolean;
 conclusion:'specific_exclusion'|'no_specific_exclusion';
 source:string;
};
const dosha:Record<number,PanchakaName>={
 0:'None',1:'Mrityu',2:'Agni',3:'None',4:'Raja',5:'None',6:'Chora',7:'None',8:'Roga'
};
const scopeForbidden:Record<P38PanchakaScope,readonly number[]>={
 occupation:[4],home_building:[2,4],travel:[6],marriage:[1,8]
};
const integer=(n:number,max:number)=>Number.isInteger(n)&&n>=1&&n<=max;
export function calculateRamanPanchaka(
 data:{tithiNumber:number;varaNumber:number;nakshatraNumber:number;electionLagnaSign:number},
 scope:P38PanchakaScope
):P38Panchaka{
 if(!integer(data?.tithiNumber,30)||!integer(data?.varaNumber,7)||
  !integer(data?.nakshatraNumber,27)||!integer(data?.electionLagnaSign,12))
  throw Error('P38 Panchaka needs verified Tithi/Vara/Nakshatra AND event Lagna');
 if(!Object.hasOwn(scopeForbidden,scope))throw Error('P38 unsupported Panchaka election scope');
 const sum=data.tithiNumber+data.varaNumber+data.nakshatraNumber+data.electionLagnaSign;
 const remainder=sum%9,forbiddenForScope=scopeForbidden[scope].includes(remainder);
 return {version:'p38-raman-panchaka-v1',...data,sum,remainder,name:dosha[remainder],
  applicableScope:scope,forbiddenForScope,hasGeneralDosha:dosha[remainder]!=='None',
  conclusion:forbiddenForScope?'specific_exclusion':'no_specific_exclusion',
  source:'https://ved.bz/_jyotish/books/muhurtha.html#chapter-3'};
}
