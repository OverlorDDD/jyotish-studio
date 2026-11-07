/**
 * N4.14 research-only sensitivity sampling. Both UTC and civil-time entrypoints
 * are diagnostic. One-second samples cannot prove continuous D60 stability.
 */
import {resolveN414CivilTime,inspectN414D60Envelope} from './n4-14-time-d60.mjs';
const BODIES=Object.freeze(['Ascendant','Sun','Moon','Mars','Mercury',
 'Jupiter','Venus','Saturn','Rahu','Ketu']);
export const N414_RADII_SECONDS=Object.freeze([15,30,60,120,300]);
const normalized=x=>((x%360)+360)%360;
const sign60=x=>Math.floor(normalized(x)*2)%60;
function checkedPosition(o){
 if(!o||Object.keys(o).length!==BODIES.length||
    BODIES.some(b=>!Number.isFinite(o[b])))
  throw Error('N414_MISSING_OR_INVALID_NATIVE_POSITIONS');
 return o;
}
function unwrapAround(x,nominal){
 return nominal+(((x-nominal+540)%360+360)%360-180);
}
/** Direct, source-bound UTC entrypoint for the 50 private JHora synthetic cases.
 * Original JHora cases use pinned fixed offsets, NOT independently verified IANA
 * historical zone names. This interface intentionally does NOT claim they do.
 */
export async function auditN414UtcSensitivity({
 centerUtc,sampleAtUtc,radiiSeconds=N414_RADII_SECONDS
}){
 if(typeof centerUtc!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(centerUtc)||
    !Number.isFinite(Date.parse(centerUtc))||
    new Date(Date.parse(centerUtc)).toISOString()!==centerUtc||
    typeof sampleAtUtc!=='function'||!Array.isArray(radiiSeconds)||
    radiiSeconds.length===0||new Set(radiiSeconds).size!==radiiSeconds.length||
    radiiSeconds.some(r=>!Number.isInteger(r)||r<1||r>3600))
  throw Error('N414_INVALID_UTC_SENSITIVITY_INPUT');
 const center=Date.parse(centerUtc),maxRadius=Math.max(...radiiSeconds);
 const values=new Map();
 for(let second=-maxRadius;second<=maxRadius;second++){
  const sample=await sampleAtUtc(new Date(center+second*1000).toISOString());
  values.set(second,checkedPosition(sample));
 }
 const centerPosition=values.get(0);
 const windows=radiiSeconds.map(radiusSeconds=>{
  const bodies=BODIES.map(body=>{
   const nominal=centerPosition[body], samples=[];
   for(let second=-radiusSeconds;second<=radiusSeconds;second++)
    samples.push({second,longitude:unwrapAround(values.get(second)[body],nominal)});
   const minimum=Math.min(...samples.map(x=>x.longitude));
   const maximum=Math.max(...samples.map(x=>x.longitude));
   const bounds=inspectN414D60Envelope({minimum,nominal,maximum});
   const nominalSign=sign60(nominal);
   const observedSigns=[...new Set(samples.map(x=>sign60(x.longitude)))].sort((a,b)=>a-b);
   const firstObservedChange=samples.find(x=>sign60(x.longitude)!==nominalSign);
   const observedCrossingBrackets=[];
   for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i];
    if(sign60(a.longitude)!==sign60(b.longitude))
     observedCrossingBrackets.push([a.second,b.second]);
   }
   return {body,nominalSignIndex:nominalSign,
    observedSigns,firstObservedChangeSeconds:firstObservedChange?.second??null,
    sampledMinimumDegrees:minimum,sampledMaximumDegrees:maximum,
    sampledBoundaryCount:bounds.boundaryCount,
    observedCrossingBrackets,
    sampledSignChanged:observedSigns.length!==1,
    continuousBoundCertified:false};
  });
  return {radiusSeconds,bodyCount:bodies.length,
   sampledChangedBodies:bodies.filter(x=>x.sampledSignChanged).map(x=>x.body),
   bodies,continuousTimeWindowCertified:false};
 });
 return Object.freeze({
  version:'n4.14-second-grid-sensitivity-v2',
  status:'N414_SAMPLED_SENSITIVITY_DIAGNOSTIC_ONLY',
  centerUtc, candidateCount:1,radiiSeconds,oneSecondSampling:true,windows,
  timeZoneIndependentlyVerified:false,continuousBoundsVerified:false,
  productionD60Certified:false,
  note:'Point samples and crossing brackets are not complete continuous enclosures'
 });
}
/** IANA civil-time route: block gaps/folds instead of selecting UTC silently. */
export async function auditN414Sensitivity({date,time,zone,sampleAtUtc,radiiSeconds=N414_RADII_SECONDS}){
 if(typeof sampleAtUtc!=='function')throw Error('N414_INVALID_DIAGNOSTIC_INPUT');
 const civil=resolveN414CivilTime({date,time,zone});
 if(civil.status!=='UNIQUE')return Object.freeze({
  status:'BLOCKED_CIVIL_TIME_'+civil.status,civilStatus:civil.status,
  candidatesUtc:civil.candidatesUtc,productionD60Certified:false,
  timeZoneIndependentlyVerified:false
 });
 const sampled=await auditN414UtcSensitivity({
  centerUtc:civil.candidatesUtc[0],sampleAtUtc,radiiSeconds
 });
 return Object.freeze({...sampled,civilStatus:civil.status,
  historicalIanaOffsetIndependentlyCertified:false});
}
