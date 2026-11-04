/** Explicitly versioned South Indian common weekday octants.
 * The actual sunrise/sunset come from observer-specific Swiss calculations.
 * These three customary daylight windows are not a complete muhurta verdict.
 */
export const DAYTIME_KALA_VERSION='daylight-octants-south-indian-common-v1';
const RAHU=[8,2,7,5,6,4,3] as const;
const YAMA=[5,4,3,2,1,7,6] as const;
const GULIKA=[7,6,5,4,3,2,1] as const;
export function daytimeKalas(sunriseUtc:string,sunsetUtc:string,weekday:number){
 const rise=Date.parse(sunriseUtc),set=Date.parse(sunsetUtc);
 if(!Number.isSafeInteger(weekday)||weekday<0||weekday>6)throw Error('Invalid sunrise weekday');
 if(!Number.isFinite(rise)||!Number.isFinite(set)||set<=rise||
   set-rise<3600000||set-rise>24*3600000)throw Error('Invalid Swiss sunrise/sunset interval');
 const interval=(slot:number)=>{
  const step=(set-rise)/8,from=Math.round(rise+(slot-1)*step),to=Math.round(rise+slot*step);
  return {part:slot,fromUtc:new Date(from).toISOString(),untilUtc:new Date(to).toISOString()};
 };
 return {version:DAYTIME_KALA_VERSION,method:'local Swiss apparent upper-limb sunrise/sunset, 8 equal daytime octants',
  rahuKalam:interval(RAHU[weekday]),yamaganda:interval(YAMA[weekday]),gulikaKalam:interval(GULIKA[weekday]),
  convention:'common weekday tables; ritual-school and local elevation variants not certified'};
}
