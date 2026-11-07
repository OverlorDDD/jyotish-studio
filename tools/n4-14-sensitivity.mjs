/**
 * N4.14: deterministic, sanitized birth-time sensitivity DIAGNOSTIC.
 *
 * A caller supplies a real ephemeris sampler (or explicitly labelled synthetic
 * callback for tests). Point samples are NOT interval bounds and cannot prove
 * D60 sign stability between samples. Never enable production via this module.
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
/**
 * sampleAtUtc(isoString) => complete 10-body longitude record.
 * This deliberately does not accept client-side "verified" booleans.
 */
export async function auditN414Sensitivity({date,time,zone,sampleAtUtc,radiiSeconds=N414_RADII_SECONDS}){
  if(typeof sampleAtUtc!=='function'||!Array.isArray(radiiSeconds)||
     radiiSeconds.length===0||radiiSeconds.some(r=>!Number.isInteger(r)||r<1||r>3600))
    throw Error('N414_INVALID_DIAGNOSTIC_INPUT');
  const civil=resolveN414CivilTime({date,time,zone});
  if(civil.status!=='UNIQUE')return Object.freeze({
    status:'BLOCKED_CIVIL_TIME_'+civil.status,civilStatus:civil.status,
    candidatesUtc:civil.candidatesUtc,productionD60Certified:false,
    timeZoneIndependentlyVerified:false
  });
  const center=Date.parse(civil.candidatesUtc[0]);
  const centerPosition=checkedPosition(await sampleAtUtc(new Date(center).toISOString()));
  // Only 1-second-grid sample points across the requested radii, including
  // both endpoint seconds. No interpolation or derivative claim.
  const maxRadius=Math.max(...radiiSeconds);
  const values=new Map([[0,centerPosition]]);
  for(let second=-maxRadius;second<=maxRadius;second++){
    if(second===0)continue;
    const r=await sampleAtUtc(new Date(center+second*1000).toISOString());
    values.set(second,checkedPosition(r));
  }
  const windows=radiiSeconds.map(radiusSeconds=>{
    const bodies=BODIES.map(body=>{
      const samples=[];
      const nominal=centerPosition[body];
      for(let second=-radiusSeconds;second<=radiusSeconds;second++){
        const longitude=unwrapAround(values.get(second)[body],nominal);
        samples.push({second,longitude});
      }
      const minimum=Math.min(...samples.map(x=>x.longitude));
      const maximum=Math.max(...samples.map(x=>x.longitude));
      const bounds=inspectN414D60Envelope({minimum,nominal,maximum});
      const nominalSign=sign60(nominal);
      const observedSigns=[...new Set(samples.map(x=>sign60(x.longitude)))].sort((a,b)=>a-b);
      const firstObservedChange=samples.find(x=>sign60(x.longitude)!==nominalSign);
      return {
        body,nominalSignIndex:nominalSign,
        observedSigns,firstObservedChangeSeconds:firstObservedChange?.second??null,
        sampledMinimumDegrees:minimum,sampledMaximumDegrees:maximum,
        sampledBoundaryCount:bounds.boundaryCount,
        sampledSignChanged:observedSigns.length!==1,
        continuousBoundCertified:false
      };
    });
    return {
      radiusSeconds,bodyCount:bodies.length,
      sampledChangedBodies:bodies.filter(x=>x.sampledSignChanged).map(x=>x.body),
      bodies,continuousTimeWindowCertified:false
    };
  });
  return Object.freeze({
    version:'n4.14-second-grid-sensitivity-v1',
    status:'N414_SAMPLED_SENSITIVITY_DIAGNOSTIC_ONLY',
    candidateCount:civil.candidatesUtc.length,centerUtc:civil.candidatesUtc[0],
    radiiSeconds,oneSecondSampling:true,windows,
    timeZoneIndependentlyVerified:false,continuousBoundsVerified:false,
    productionD60Certified:false,
    note:'Samples are not a continuous interval enclosure, even when every sampled sign matches'
  });
}
