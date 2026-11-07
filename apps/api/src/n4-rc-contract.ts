/**
 * N4 Release Candidate: 15 charts derived SERVER-SIDE from the SAME already
 * internally verified D1. This evidence is intentionally NOT a JHora/Lahiri
 * physical certificate or a cryptographically signed response.
 *
 * D60 is excluded from the API. Existing D1/D9/D10 and Reader v6 untouched.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {
 calculateAllVargas,SHODASHAVARGA,VARGA_PROFILE,VARGA_RULESET_VERSION,
 type VargaChart,type VargaNumber
} from '../../../packages/jyotish-core/src/vargas.ts';
import {CHART_VERIFICATION_VERSION,type ChartVerification} from './jyotish-integrity.ts';

export const N4_RC_CONTRACT_VERSION='n4-rc-server-bound-15-v1' as const;
export const N4_RC_DIVISIONS=Object.freeze(
 SHODASHAVARGA.filter((n):n is Exclude<VargaNumber,60>=>n!==60)
);
export type N4RcPlanet=Readonly<{
 name:string;sign:number;house:number;retrograde:boolean;
 boundaryDistanceArcseconds:number
}>;
export type N4RcChart=Readonly<{
 division:number;lagnaSign:number;lagnaBoundaryArcseconds:number;
 planets:readonly N4RcPlanet[]
}>;
export type N4RcPayload=Readonly<{
 version:typeof N4_RC_CONTRACT_VERSION;
 sourceVerificationVersion:typeof CHART_VERIFICATION_VERSION;
 sourceDigest:string;
 status:'INTERNALLY_VERIFIED_D1_DERIVATION_NOT_EXTERNAL_LAHIRI_CERTIFICATE';
 method:typeof VARGA_PROFILE;
 ruleVersion:typeof VARGA_RULESET_VERSION;
 d2Method:'Sun/Moon Hora';
 d60Excluded:true;
 externalJhoraPerBirthCertified:false;
 charts:readonly N4RcChart[];
}>;

function must(value:boolean,label:string):void {
 if(!value)throw new Error('N4_RC_SOURCE_OR_METHOD_MISMATCH: '+label);
}
const NAMES=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const signOf=(n:number)=>Math.floor(((n%360)+360)%360/30)+1;
function matchLegacy(chart:CalculatedChart,varga:VargaChart,division:1|9|10):void{
 const old=division===1?chart.d1:division===9?chart.d9:chart.d10;
 const lagna=division===1?chart.ascendant:division===9?chart.lagnaD9:chart.lagnaD10;
 must(varga.lagna.vargaSign===lagna.sign,'D'+division+' lagna disagreement');
 must(varga.planets.length===9&&old.length===9,'D'+division+' bodies missing');
 for(const body of varga.planets){
  const expected=old.find(p=>p.name===body.name);
  must(!!expected && expected.sign===body.vargaSign &&
   expected.house===body.house,'D'+division+' '+body.name+' disagreement');
 }
}
export function makeN4RcPayload(
 chart:CalculatedChart,verification:ChartVerification
):N4RcPayload{
 must(verification?.version===CHART_VERIFICATION_VERSION &&
  verification.status==='verified_internal' &&
  /^[a-f0-9]{64}$/.test(verification.digest) &&
  verification.externalReferenceChecked===false,'missing source integrity');
 must(chart?.config?.ayanamsa==='Lahiri' &&
  chart.config.nodes==='Mean Rahu / opposite Ketu','physical source profile');
 must(Number.isFinite(chart.ascendant?.longitude),'lagna longitude');
 must(Array.isArray(chart.d1)&&chart.d1.length===9 &&
  new Set(chart.d1.map(p=>p.name)).size===9 &&
  NAMES.every(name=>chart.d1.some(p=>p.name===name)),'D1 bodies');
 for(const p of chart.d1){
  must(Number.isFinite(p.longitude)&&p.longitude>=0&&p.longitude<360 &&
   signOf(p.longitude)===p.sign,'D1 coordinate '+p.name);
 }
 must(signOf(chart.ascendant.longitude)===chart.ascendant.sign,'D1 ascendant');
 const vargas=calculateAllVargas(
  chart.ascendant.longitude,
  chart.d1.map(p=>({name:p.name,longitude:p.longitude,speed:p.retrograde?-1:1}))
 );
 must(vargas.length===16,'varga rule source drift');
 for(const n of [1,9,10] as const){
  const result=vargas.find(v=>v.division===n);
  must(!!result,'missing existing D'+n);
  matchLegacy(chart,result!,n);
 }
 const charts=N4_RC_DIVISIONS.map(n=>{
  const v=vargas.find(x=>x.division===n)!;
  return Object.freeze({
   division:n,
   lagnaSign:v.lagna.vargaSign,
   lagnaBoundaryArcseconds:v.lagna.boundaryDistanceArcseconds,
   planets:Object.freeze(v.planets.map(p=>Object.freeze({
    name:p.name,sign:p.vargaSign,house:p.house,
    retrograde:p.retrograde,boundaryDistanceArcseconds:p.boundaryDistanceArcseconds
   })))
  });
 });
 must(charts.length===15&&!charts.some(x=>x.division===60),'D60 must be absent');
 return Object.freeze({
  version:N4_RC_CONTRACT_VERSION,
  sourceVerificationVersion:CHART_VERIFICATION_VERSION,
  sourceDigest:verification.digest,
  status:'INTERNALLY_VERIFIED_D1_DERIVATION_NOT_EXTERNAL_LAHIRI_CERTIFICATE',
  method:VARGA_PROFILE,
  ruleVersion:VARGA_RULESET_VERSION,
  d2Method:'Sun/Moon Hora',d60Excluded:true,
  externalJhoraPerBirthCertified:false,
  charts:Object.freeze(charts)
 });
}
