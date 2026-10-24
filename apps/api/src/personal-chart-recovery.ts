/** Personal Data Recovery: safely project legacy snapshots onto today's verified calculator.
 * Never changes Chart.result, savedReport or original birth data.
 * Persisted cache keyed by SHA256(source) + integrity/method version prevents repeated
 * calculations and invalidates automatically when source or contract changes.
 */
import {createHash} from 'node:crypto';
import type {PrismaService} from './prisma.ts';
import {runCalculation} from './logic.ts';
import {CHART_VERIFICATION_VERSION} from './jyotish-integrity.ts';
import {validateBirth,type CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';

export const PERSONAL_RECOVERY_METHOD='personal-chart-recovery-v1';
export const PERSONAL_ASCENDANT_CONVENTION='tropical-apparent-minus-mean-lahiri-v2';
export const personalRecoveryVersion=PERSONAL_RECOVERY_METHOD+':'+CHART_VERIFICATION_VERSION+':'+PERSONAL_ASCENDANT_CONVENTION;
export type RecoveredChart=CalculatedChart&{verification:{status:'verified_internal';version:string;digest:string}};
export type RecoveryState='current'|'recovered'|'needs_review'|'temporarily_unavailable';
export type RecoveryResolution={status:RecoveryState;chart:RecoveredChart|null};
type SourceChart={id:string;input:unknown;result:unknown};
const pending=new Map<string,Promise<RecoveryResolution>>();
const record=(value:unknown):Record<string,unknown>|null=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
export function isCurrentVerifiedChart(value:unknown):value is RecoveredChart{
 const v=record(value),verify=record(v?.verification),cfg=record(v?.config);
 return verify?.status==='verified_internal'&&verify.version===CHART_VERIFICATION_VERSION&&
   cfg?.ascendantConvention===PERSONAL_ASCENDANT_CONVENTION&&
   Array.isArray(v?.d1)&&Array.isArray(v?.d9)&&Array.isArray(v?.d10)&&Array.isArray(v?.dasha);
}
export function originalSignsAgree(source:unknown,fresh:CalculatedChart):boolean{
 const legacy=record(source);
 if(!legacy)return false;
 const asc=record(legacy.ascendant);
 if(typeof asc?.sign!=='number'||!Number.isInteger(asc.sign)||asc.sign!==fresh.ascendant.sign)return false;
 for(const key of ['d1','d9','d10'] as const){
  const old=legacy[key];
  if(!Array.isArray(old)||old.length!==9)return false;
  const original=new Map<string,number>();
  for(const entry of old){
   const g=record(entry);
   if(typeof g?.name!=='string'||(typeof g.sign!=='number'||!Number.isInteger(g.sign))||original.has(g.name))return false;
   original.set(g.name,g.sign as number);
  }
  if(!fresh[key].every(p=>original.get(p.name)===p.sign))return false;
 }
 return true;
}
export function sourceFingerprint(row:SourceChart):string{
 return createHash('sha256').update(JSON.stringify({input:row.input,result:row.result})).digest('hex');
}
function checkRecovered(result:unknown,original:unknown):result is RecoveredChart{
 return isCurrentVerifiedChart(result)&&originalSignsAgree(original,result);
}
export async function resolvePersonalChart(prisma:PrismaService,row:SourceChart):Promise<RecoveryResolution>{
 if(isCurrentVerifiedChart(row.result))return {status:'current',chart:row.result};
 const hash=sourceFingerprint(row),key=row.id+':'+hash+':'+personalRecoveryVersion;
 const existing=pending.get(key);
 if(existing)return existing;
 const task=(async():Promise<RecoveryResolution>=>{
  try{
   const stored=await prisma.personalChartRecovery.findUnique({where:{chartId:row.id}});
   if(stored?.sourceHash===hash&&stored.methodVersion===personalRecoveryVersion&&
     checkRecovered(stored.verifiedResult,row.result)){
    return {status:'recovered',chart:stored.verifiedResult};
   }
   const birth=record(row.input);
   if(!birth)return {status:'needs_review',chart:null};
   try{validateBirth(birth as unknown as Parameters<typeof validateBirth>[0]);}
   catch{return {status:'needs_review',chart:null};}
   const fresh=await runCalculation(row.input);
   if(!checkRecovered(fresh,row.result))return {status:'needs_review',chart:null};
   await prisma.personalChartRecovery.upsert({
    where:{chartId:row.id},
    create:{chartId:row.id,sourceHash:hash,methodVersion:personalRecoveryVersion,
      verifiedResult:JSON.parse(JSON.stringify(fresh))},
    update:{sourceHash:hash,methodVersion:personalRecoveryVersion,
      verifiedResult:JSON.parse(JSON.stringify(fresh)),verifiedAt:new Date()}
   });
   return {status:'recovered',chart:fresh};
  }catch(error){
   // Malformed legacy data requires a new calculation, while a missing
   // ephemeris/database is retryable. Neither grants an unverified badge.
   const hasBirth=record(row.input);
   if(!hasBirth||typeof hasBirth.date!=='string'||typeof hasBirth.time!=='string'||
      typeof hasBirth.timeZone!=='string'||typeof hasBirth.latitude!=='number'||typeof hasBirth.longitude!=='number'||
      !Number.isFinite(hasBirth.latitude)||!Number.isFinite(hasBirth.longitude))return {status:'needs_review',chart:null};
   return {status:'temporarily_unavailable',chart:null};
  }
 })();
 pending.set(key,task);
 try{return await task}finally{if(pending.get(key)===task)pending.delete(key);}
}
