/**
 * N4 research-only birth civil time classification for a birthplace with
 * known IANA zone. Not a generic proof of past legal time in all locations.
 * No historic legal 'approved' Boolean can be manufactured by this module.
 */
import {resolveN414CivilTime} from './n4-14-time-d60.mjs';

export const N4_HISTORICAL_POLICY_VERSION='n4-civil-time-source-confidence-v1';
const fail=m=>{throw Error('N4_HISTORICAL_TIME_BLOCKED: '+m)};
export function classifyN4BirthCivilTime(input){
 if(!input||typeof input.date!=='string'||typeof input.time!=='string'||
  typeof input.zone!=='string')fail('explicit date/time/IANA zone required');
 const local=resolveN414CivilTime(input);
 const year=Number(input.date.slice(0,4));
 if(!Number.isInteger(year))fail('invalid birth year');
 if(local.status==='FOLD'||local.status==='GAP'){
  return Object.freeze({
   version:N4_HISTORICAL_POLICY_VERSION,
   status:local.status==='FOLD'?'BIRTH_TIME_AMBIGUOUS_FOLD':'BIRTH_TIME_NONEXISTENT_GAP',
   possibleUtcInstants:local.candidatesUtc.length,
   calculatorMayAssumeOneInstant:false,
   zoneDataFromIanaOnly:true,
   legalTimeDocumentCertified:false,
   d60FullPrecisionEligible:false
  });
 }
 if(local.status!=='UNIQUE'||local.candidatesUtc.length!==1)fail('inconsistent IANA resolution');
 return Object.freeze({
  version:N4_HISTORICAL_POLICY_VERSION,
  status:year<1970?'PRE_1970_HISTORICAL_EVIDENCE_REQUIRED':
   'IANA_UNIQUE_LEGAL_TIME_NOT_INDEPENDENTLY_CERTIFIED',
  possibleUtcInstants:1,
  requiresJurisdictionSpecificPrimaryEvidence:year<1970,
  calculatorMayAssumeOneInstant:year>=1970,
  zoneDataFromIanaOnly:true,
  legalTimeDocumentCertified:false,
  d60FullPrecisionEligible:false,
  originalN4JhoraResearchNotLegalProof:true
 });
}
