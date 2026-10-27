/** Traditional, versioned moon-strength arithmetic; no user data or ephemeris.
 * Both coordinates must be derived from verified natal chart and Swiss day Moon.
 */
export const LUNAR_STRENGTH_VERSION='tarabala-chandrabala-v1';
export const TARA_NAMES=['Janma','Sampat','Vipat','Kshema','Pratyak','Sadhaka','Naidhana','Mitra','Parama Mitra'] as const;
// Janma treated as caution, not categorical harm or an affirmative 'good'.
// Schools differ on edge cases; keep explicit versioned 5/9 simple policy.
const SUPPORTIVE_TARAS=new Set([2,4,6,8,9]);
const SUPPORTIVE_HOUSES=new Set([1,3,6,7,10,11]);
function bounded(n:number,max:number,label:string){
 if(!Number.isInteger(n)||n<1||n>max)throw Error('Invalid '+label);
 return n;
}
export function tarabala(natalNakshatraIndex:number,transitNakshatraIndex:number){
 const birth=bounded(natalNakshatraIndex,27,'natal nakshatra');
 const transit=bounded(transitNakshatraIndex,27,'transit nakshatra');
 const distance=(transit-birth+27)%27+1;
 const tara=(distance-1)%9+1;
 return {birthNakshatraIndex:birth,transitNakshatraIndex:transit,
  inclusiveCount:distance,taraNumber:tara,cycle:Math.floor((distance-1)/9)+1,
  name:TARA_NAMES[tara-1],
  quality:tara===1?'caution':SUPPORTIVE_TARAS.has(tara)?'supportive':'challenging',
  methodology:'27 nakshatras; count both endpoints from Janma Nakshatra; reduce to nine taras; Janma caution'};
}
export function chandrabala(natalMoonSign:number,transitMoonSign:number){
 const birth=bounded(natalMoonSign,12,'natal Moon sign');
 const transit=bounded(transitMoonSign,12,'transit Moon sign');
 const house=(transit-birth+12)%12+1;
 return {natalMoonSign:birth,transitMoonSign:transit,houseFromJanmaRashi:house,
  quality:SUPPORTIVE_HOUSES.has(house)?'supportive':'challenging',
  ashtamaChandra:house===8,
  favorableHouses:[1,3,6,7,10,11],
  methodology:'Inclusive whole-sign count of transit Moon from verified Janma Rashi; versioned 1,3,6,7,10,11 convention'};
}
export function verifiedDailyMoonStrength(natal:{moonLongitude:number;moonSign:number},
 transit:{nakshatraNumber:number;moonSign:number}){
 if(!Number.isFinite(natal.moonLongitude)||natal.moonLongitude<0||natal.moonLongitude>=360)
  throw Error('Verified natal Moon longitude required');
 const derivedNatalSign=Math.floor(natal.moonLongitude/30)+1;
 if(derivedNatalSign!==natal.moonSign)throw Error('Natal sign and longitude inconsistency');
 const nakIndex=Math.floor(natal.moonLongitude/(360/27))+1;
 return {version:LUNAR_STRENGTH_VERSION,tarabala:tarabala(nakIndex,transit.nakshatraNumber),
  chandrabala:chandrabala(natal.moonSign,transit.moonSign),
  resultType:'TRADITIONAL_COMPARISON_OF_ASTRONOMICAL_FACTS',
  predictiveGuarantee:false};
}
