/**
 * N4 exact-method VARIANT adapter. The live calculator is NOT switched.
 *
 * The same symbolic 16-varga mapping can be applied to source D1 longitudes
 * computed with either Lahiri or True Citra; this does not make the original
 * physical positions equivalent. Original JHora 50-case sources use US Hora.
 */
import {calculateAllVargas,type VargaChart,type VargaPlacement,
 type VargaPoint} from './vargas.ts';
import {n4UmaShambhuHoraSign} from './hora-uma-shambhu.ts';

export const N4_METHOD_PROFILE_VERSION='n4-explicit-method-choice-v1' as const;
export const N4_US_HORA_PROFILE='n4-uma-shambhu-hora-parashari-16-v1' as const;
export type N4D2Method='sun-moon'|'uma-shambhu';
export type N4InputConvention='production-lahiri-apparent'|'original-jhora8-true-citra-geometric';
export type N4ProfileRequest=Readonly<{d2Method:N4D2Method;
 inputConvention:N4InputConvention}>;
export type N4MethodVargaChart=Omit<VargaChart,'profile'> & Readonly<{profile:string}>;
export type N4VargaProfileResult=Readonly<{
 version:typeof N4_METHOD_PROFILE_VERSION;
 inputConvention:N4InputConvention;
 d2Method:N4D2Method;
 originalJHora50SameInputMethod:boolean;
 verifiedPhysicalSourceForThisBirth:false;
 originalJHoraDashaDateVerified:false;
 productionReleasePermitted:false;
 charts:readonly N4MethodVargaChart[];
}>;
const house=(sign:number,lagna:number)=>((sign-lagna+12)%12)+1;
export function calculateN4VargasForMethod(
 ascendantLongitude:number,planets:readonly VargaPoint[],request:N4ProfileRequest
):N4VargaProfileResult{
 if(!request||
   !['sun-moon','uma-shambhu'].includes(request.d2Method)||
   !['production-lahiri-apparent','original-jhora8-true-citra-geometric']
    .includes(request.inputConvention))
  throw Error('N4_EXPLICIT_SOURCE_AND_D2_METHOD_REQUIRED');
 const base=calculateAllVargas(ascendantLongitude,planets);
 if(base.length!==16)throw Error('N4_INCOMPLETE_DIVISION_SET');
 const charts=request.d2Method==='sun-moon'?base:Object.freeze(base.map(c=>{
  if(c.division!==2)return Object.freeze({...c,profile:N4_US_HORA_PROFILE});
  const lagnaSign=n4UmaShambhuHoraSign(c.lagna.birthLongitude)+1;
  const transform=(p:VargaPlacement)=>{
   const sign=n4UmaShambhuHoraSign(p.birthLongitude)+1;
   return Object.freeze({...p,vargaSign:sign,house:house(sign,lagnaSign)});
  };
  // Preserve source D1 longitude, part index, sector boundary and retrograde.
  // The original US Hora is mapped onto an otherwise unchanged D1 dataset.
  return Object.freeze({...c,profile:N4_US_HORA_PROFILE,lagna:transform(c.lagna),
   planets:Object.freeze(c.planets.map(transform))});
 }));
 return Object.freeze({
  version:N4_METHOD_PROFILE_VERSION,inputConvention:request.inputConvention,
  d2Method:request.d2Method,
  originalJHora50SameInputMethod:request.d2Method==='uma-shambhu'&&
   request.inputConvention==='original-jhora8-true-citra-geometric',
  verifiedPhysicalSourceForThisBirth:false as const,
  originalJHoraDashaDateVerified:false as const,
  productionReleasePermitted:false as const,
  charts
 });
}
