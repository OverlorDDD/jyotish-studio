/**
 * N4 D60 (Shashtiamsa) strictly scoped symbolic arithmetic.
 *
 * This validates sign mapping against existing verified physical source D1;
 * it does NOT prove a birth time rounded to minute determines a unique D60
 * Lagna/house across its uncertainty window. No public interpretation gate.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {calculateVargaFromLongitudes,VARGA_PROFILE,VARGA_RULESET_VERSION} from '../../../packages/jyotish-core/src/vargas.ts';
import {CHART_VERIFICATION_VERSION,type ChartVerification} from './jyotish-integrity.ts';

export const N4_D60_VERSION='n4-d60-symbolic-reference-20261107-v1' as const;
export const N4_D60_METHOD='JHora8-Traditional-own-rashi-inclusive-D60' as const;
export type D60Part=Readonly<{name:string;sign:number;house:number;part:number;boundaryDistanceArcseconds:number;retrograde:boolean}>;
export type D60Candidate=Readonly<{
 version:typeof N4_D60_VERSION;
 sourceVerificationVersion:typeof CHART_VERIFICATION_VERSION;
 sourceDigest:string;
 sourceMethod:typeof VARGA_PROFILE;
 rulesVersion:typeof VARGA_RULESET_VERSION;
 method:typeof N4_D60_METHOD;
 division:60;
 lagna:D60Part;
 planets:readonly D60Part[];
 symbolicFormulaIndependentReference:'original-JHora8-50-same-method-and-PyJHora';
 symbolicMathScope:'VERIFIED_FOR_PINNED_INPUT_LONGITUDES_ONLY';
 birthTimePrecision:'NOT_INFERRED_FROM_HH_MM';
 continuousTimeStabilityCertified:false;
 d60HouseInterpretationEligible:false;
 astronomicalCoordinatesPerBirthExternallyCertified:false;
 status:'PROVISIONAL_D60_INDIVIDUAL_BIRTH';
}>;

const guard=(ok:boolean,why:string)=>{if(!ok)throw Error('N4_D60_SOURCE_INTEGRITY_REJECTED: '+why)};
export function makeN4D60Candidate(chart:CalculatedChart,verification:ChartVerification):D60Candidate{
 guard(verification?.version===CHART_VERIFICATION_VERSION &&
  verification.status==='verified_internal' &&
  /^[a-f0-9]{64}$/.test(verification.digest) &&
  verification.externalReferenceChecked===false,'original source must be internally verified');
 guard(chart?.config?.ayanamsa==='Lahiri' &&
  chart?.config?.nodes==='Mean Rahu / opposite Ketu','production astronomical method');
 guard(Number.isFinite(chart.ascendant?.longitude) &&
  chart.ascendant.longitude>=0&&chart.ascendant.longitude<360,'invalid source lagna');
 guard(Array.isArray(chart.d1)&&chart.d1.length===9 &&
  new Set(chart.d1.map(p=>p.name)).size===9,'source grahas');
 const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
 guard(names.every(name=>chart.d1.some(p=>p.name===name&&
  Number.isFinite(p.longitude)&&p.longitude>=0&&p.longitude<360)),
 'missing physical source longitude');
 const v=calculateVargaFromLongitudes(60,chart.ascendant.longitude,
  chart.d1.map(p=>({name:p.name,longitude:p.longitude,speed:p.retrograde?-1:1})));
 guard(v.profile===VARGA_PROFILE&&v.rulesVersion===VARGA_RULESET_VERSION&&
  v.planets.length===9,'D60 pinned rules changed');
 const map=(p:typeof v.lagna):D60Part=>Object.freeze({
  name:p.name,sign:p.vargaSign,house:p.house,part:p.part,
  boundaryDistanceArcseconds:p.boundaryDistanceArcseconds,
  retrograde:p.retrograde
 });
 return Object.freeze({
  version:N4_D60_VERSION,
  sourceVerificationVersion:CHART_VERIFICATION_VERSION,
  sourceDigest:verification.digest,
  sourceMethod:VARGA_PROFILE,
  rulesVersion:VARGA_RULESET_VERSION,
  method:N4_D60_METHOD,
  division:60,
  lagna:map(v.lagna),
  planets:Object.freeze(v.planets.map(map)),
  symbolicFormulaIndependentReference:'original-JHora8-50-same-method-and-PyJHora',
  symbolicMathScope:'VERIFIED_FOR_PINNED_INPUT_LONGITUDES_ONLY',
  birthTimePrecision:'NOT_INFERRED_FROM_HH_MM',
  continuousTimeStabilityCertified:false,
  d60HouseInterpretationEligible:false,
  astronomicalCoordinatesPerBirthExternallyCertified:false,
  status:'PROVISIONAL_D60_INDIVIDUAL_BIRTH'
 });
}
