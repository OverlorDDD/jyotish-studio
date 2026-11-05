/**
 * N4.11 birth-time provenance and D60 interval *eligibility*.
 * A noon surrogate is not an observed birth moment. Continuous ephemeris
 * enclosures must come from a separately verified service; sample points alone
 * never prove that no boundary crossing happened between those points.
 *
 * Pure policy only. No raw birth date, city, identity or timezone is serialized.
 * Does not change production natal input or enable a feature flag.
 */
import {vargaSign} from '../../../packages/jyotish-core/src/vargas.ts';

export const N4_BIRTH_TIME_POLICY_VERSION='n4-birth-time-uncertainty-v1' as const;
export type N4TimeDeclaration=
 | Readonly<{kind:'recorded';localTime:string;uncertaintyMinutes:number}>
 | Readonly<{kind:'approximate';localTime:string;uncertaintyMinutes:number}>
 | Readonly<{kind:'unknown'}>;
export type N4TimePolicy=Readonly<{
 version:typeof N4_BIRTH_TIME_POLICY_VERSION;
 kind:N4TimeDeclaration['kind'];
 nominalLocalTime:string;
 source:'stated_local_time'|'assumed_local_noon';
 localMinuteInterval:Readonly<{startInclusive:number;endExclusive:number}>;
 nominalIsObserved:boolean;
 requiresIanaZoneAndHistoricalDst:true;
 continuousConfidence:'unverified_user_precision';
 natalHousesTrusted:false;
 d60ChartTrusted:false;
}>;

const parseClock=(s:string):number=>{
 if(typeof s!=='string'||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s))
  throw Error('Use a valid local civil time HH:MM');
 const [h,m]=s.split(':').map(Number);
 return 60*h+m;
};
const HHMM=(minute:number)=>String(Math.floor(minute/60)).padStart(2,'0')+
 ':'+String(minute%60).padStart(2,'0');

/** Time interval uses minutes relative to the nominal birth *local date*.
 * It may extend below 0 or past 1440 for approximate births across midnight.
 * End 1440 means the next midnight, never a valid HH:MM field.
 */
export function planN4BirthTime(input:N4TimeDeclaration):N4TimePolicy{
 if(!input||!['recorded','approximate','unknown'].includes(input.kind))
  throw Error('Explicit recorded, approximate or unknown birth-time declaration is required');
 if(input.kind==='unknown'){
  if('localTime' in input||'uncertaintyMinutes' in input)
   throw Error('Unknown time must not masquerade as an observed clock time');
  return Object.freeze({
   version:N4_BIRTH_TIME_POLICY_VERSION,kind:input.kind,
   nominalLocalTime:'12:00',source:'assumed_local_noon' as const,
   localMinuteInterval:Object.freeze({startInclusive:0,endExclusive:1440}),
   nominalIsObserved:false,requiresIanaZoneAndHistoricalDst:true as const,
   continuousConfidence:'unverified_user_precision' as const,
   natalHousesTrusted:false as const,d60ChartTrusted:false as const
  });
 }
 const minute=parseClock(input.localTime),err=input.uncertaintyMinutes;
 if(!Number.isInteger(err)||err<0||err>720||(input.kind==='recorded'&&err>60)||
    (input.kind==='approximate'&&err===0))
  throw Error('Birth-time uncertainty must be declared explicitly and within policy bounds');
 return Object.freeze({
  version:N4_BIRTH_TIME_POLICY_VERSION,kind:input.kind,nominalLocalTime:HHMM(minute),
  source:'stated_local_time' as const,
  localMinuteInterval:Object.freeze({
   startInclusive:minute-err,
   endExclusive:minute+err+1
  }),
  nominalIsObserved:true,requiresIanaZoneAndHistoricalDst:true as const,
  continuousConfidence:'unverified_user_precision' as const,
  natalHousesTrusted:false as const,d60ChartTrusted:false as const
 });
}

export type N4ContinuousLongitudeEnvelope=Readonly<{
 name:'Ascendant'|'Sun'|'Moon'|'Mars'|'Mercury'|'Jupiter'|'Venus'|'Saturn'|'Rahu'|'Ketu';
 /** Unwrapped sidereal longitudes; source must guarantee containing every
  * longitude across the WHOLE UTC uncertainty window, not only its endpoints.
  */
 minimum:number;maximum:number;nominal:number;
}>;
const BODIES=['Ascendant','Sun','Moon','Mars','Mercury','Jupiter','Venus',
 'Saturn','Rahu','Ketu'] as const;
export type N4D60EvidenceReview=Readonly<{
 version:'n4-d60-interval-evidence-v1';
 status:'INSUFFICIENT_CONTINUOUS_EPHEMERIS_EVIDENCE'|
  'MATH_REFERENCE_NOT_CERTIFIED'|'PROVISIONAL_SIGNS_ONLY'|'ALL_D60_POSITIONS_ELIGIBLE';
 mathReferenceApproved:boolean;
 stableSigns:readonly {name:string;sign:number}[];
 uncertainBodies:readonly string[];
 lagnaStable:boolean;
 houseInterpretationEligible:boolean;
 noInternalReferenceIsCertification:true;
}>;
const normalize=(x:number)=>((x%360)+360)%360;
const safeWithinPart=(lo:number,hi:number)=>Math.floor(2*(lo-1e-8))===Math.floor(2*(hi+1e-8));

/**
 * Controlled engine-side eligibility proof. The caller must validate the
 * independent original JHora certificate and the trusted continuous longitude
 * bounds BEFORE setting the two booleans; never accept them from a client/LLM.
 */
export function assessN4D60Evidence(input:Readonly<{
 time:N4TimePolicy;
 envelopes:readonly N4ContinuousLongitudeEnvelope[];
 continuousBoundsVerified:boolean;
 originalJHora8MathApproved:boolean;
 historicalTimezoneResolved:boolean;
}>):N4D60EvidenceReview{
 if(!input?.time||input.time.version!==N4_BIRTH_TIME_POLICY_VERSION||
  !Array.isArray(input.envelopes)||typeof input.continuousBoundsVerified!=='boolean'||
  typeof input.originalJHora8MathApproved!=='boolean'||
  typeof input.historicalTimezoneResolved!=='boolean')
  throw Error('Invalid D60 independent reference / ephemeris confidence inputs');
 if(input.envelopes.length!==10||
  new Set(input.envelopes.map(x=>x.name)).size!==10||
  BODIES.some(name=>!input.envelopes.some(x=>x.name===name)))
  throw Error('An independent interval must bound all 10 objects including Lagna');
 for(const e of input.envelopes){
  if(![e.minimum,e.maximum,e.nominal].every(Number.isFinite)||
   e.minimum>e.maximum||e.minimum>e.nominal||e.nominal>e.maximum||
   e.maximum-e.minimum>360)
   throw Error('Invalid enclosing longitudes for '+e.name);
 }
 // "Verified" is an input from an internal ephemeris attestation, NOT a
 // conclusion reached merely by comparing sampled endpoints.
 const verified=input.continuousBoundsVerified&&input.historicalTimezoneResolved;
 const stable=input.envelopes.filter(e=>safeWithinPart(e.minimum,e.maximum));
 const unstable=BODIES.filter(name=>!stable.some(e=>e.name===name));
 const stableSigns=stable.map(e=>Object.freeze({
  name:e.name,sign:vargaSign(normalize(e.nominal),60)+1
 }));
 const lagnaStable=stable.some(e=>e.name==='Ascendant');
 const allStable=unstable.length===0;
 // A hypothetical noon is never an observed birth, however stable a forged envelope looks.
 const eligible=verified&&input.originalJHora8MathApproved&&allStable&&input.time.kind!=='unknown';
 const status: N4D60EvidenceReview['status']=!verified?
  'INSUFFICIENT_CONTINUOUS_EPHEMERIS_EVIDENCE':
  !input.originalJHora8MathApproved?'MATH_REFERENCE_NOT_CERTIFIED':
  eligible?'ALL_D60_POSITIONS_ELIGIBLE':'PROVISIONAL_SIGNS_ONLY';
 return Object.freeze({
  version:'n4-d60-interval-evidence-v1' as const,status,
  mathReferenceApproved:input.originalJHora8MathApproved,
  stableSigns:Object.freeze(stableSigns),uncertainBodies:Object.freeze(unstable),
  lagnaStable,houseInterpretationEligible:eligible,
  noInternalReferenceIsCertification:true as const
 });
}
