/** Swiss Ephemeris backend attestation.
 * swe_calc_ut may silently substitute Moshier for SWIEPH; the caller must
 * examine the *returned* flags, not the requested flags.
 * https://www.astro.com/swisseph/swephprg.htm
 */
export const JPL_BACKEND_FLAG=1;
export const SWISS_BACKEND_FLAG=2;
export const MOSHIER_BACKEND_FLAG=4;
const BACKEND_MASK=JPL_BACKEND_FLAG|SWISS_BACKEND_FLAG|MOSHIER_BACKEND_FLAG;
export function assertSwissReturnFlags(flags:unknown,body:string):void{
 if(!Number.isInteger(flags)||typeof flags!=='number'||(flags&BACKEND_MASK)!==SWISS_BACKEND_FLAG){
  throw new Error('Precise Swiss Ephemeris required for '+body+
   '; requested SWIEPH but returned flags='+String(flags)+
   '. Check ephemeris data files; refusing silent Moshier/JPL substitution.');
 }
}
