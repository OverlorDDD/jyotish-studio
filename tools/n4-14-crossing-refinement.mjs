/**
 * N4.14 numerical refinement of D60 transitions OBSERVED between neighboring
 * 1-second Swiss samples. This does not prove uniqueness, continuity, or the
 * absence of sub-second excursions. No natal data is serialized by this module.
 */
const BODIES=Object.freeze(['Ascendant','Sun','Moon','Mars','Mercury','Jupiter',
 'Venus','Saturn','Rahu','Ketu']);
const wrap=x=>((x%360)+360)%360;
const d60sector=x=>Math.floor(wrap(x)*2)%720;
const delta=(a,b)=>((a-b+540)%360+360)%360-180;
function assertPositions(p){
 if(!p||typeof p!=='object'||BODIES.some(b=>!Number.isFinite(p[b])))
  throw Error('N414_REFINEMENT_INVALID_NATIVE_SAMPLE');
 return p;
}
/**
 * observed comes from auditN414UtcSensitivity's 1-second grid. Boundaries
 * are discovered from neighboring samples, never invented. Refine by bisection
 * until the ORIGINAL one-second sign difference is enclosed in <= precisionMs.
 * Unresolved sign/sector mismatches are returned as BLOCKED, not ignored.
 */
export async function refineN414ObservedCrossings({observed,sampleAtUtc,precisionMs=125}){
 if(observed?.status!=='N414_SAMPLED_SENSITIVITY_DIAGNOSTIC_ONLY'||
  typeof observed.centerUtc!=='string'||!Number.isFinite(Date.parse(observed.centerUtc))||
  typeof sampleAtUtc!=='function'||!Number.isInteger(precisionMs)||
  precisionMs<10||precisionMs>500||!Array.isArray(observed.windows)||!observed.windows.length)
  throw Error('N414_REFINEMENT_INVALID_INPUT');
 const largest=observed.windows.reduce((a,b)=>a.radiusSeconds>b.radiusSeconds?a:b);
 const center=Date.parse(observed.centerUtc),all=[];
 for(const entry of largest.bodies||[]){
  if(!BODIES.includes(entry.body)||!Array.isArray(entry.observedCrossingBrackets))
   throw Error('N414_REFINEMENT_INVALID_BODY_BRACKETS');
  for(const bracket of entry.observedCrossingBrackets){
   if(!Array.isArray(bracket)||bracket.length!==2||
    !bracket.every(Number.isInteger)||bracket[1]-bracket[0]!==1||
    bracket[0]<-largest.radiusSeconds||bracket[1]>largest.radiusSeconds)
    throw Error('N414_REFINEMENT_INVALID_SECOND_BRACKET');
   all.push({body:entry.body,leftMs:center+bracket[0]*1000,
    rightMs:center+bracket[1]*1000});
  }
 }
 if(all.length>5000)throw Error('N414_REFINEMENT_TOO_MANY_BRACKETS');
 const cache=new Map();
 async function at(t){
  if(!cache.has(t))cache.set(t,Promise.resolve(sampleAtUtc(new Date(t).toISOString())).then(assertPositions));
  return cache.get(t);
 }
 const refined=[];
 for(const b of all){
  let lo=b.leftMs,hi=b.rightMs;
  const first=wrap((await at(lo))[b.body]);
  const last=wrap((await at(hi))[b.body]);
  const startSector=d60sector(first),endSector=d60sector(last);
  const oneSecondShift=Math.abs(delta(last,first));
  if(startSector===endSector||oneSecondShift>=0.5){
   refined.push({body:b.body,sourceOffsetStartSeconds:(b.leftMs-center)/1000,
    status:'BLOCKED_AMBIGUOUS_SECOND_BRACKET',widthMs:1000});
   continue;
  }
  // A narrower sampled sign-change bracket, NOT a proof of a unique root.
  while(hi-lo>precisionMs){
   const mid=Math.floor((lo+hi)/2);
   if(mid<=lo||mid>=hi)break;
   const sector=d60sector((await at(mid))[b.body]);
   if(sector===startSector)lo=mid;
   else hi=mid;
  }
  refined.push({body:b.body,sourceOffsetStartSeconds:(b.leftMs-center)/1000,
   status:'NUMERIC_SIGN_CHANGE_BRACKET_ONLY',
   leftOffsetMs:lo-center,rightOffsetMs:hi-center,widthMs:hi-lo,
   continuousUniquenessCertified:false,physicalTimeAccuracyCertified:false});
 }
 return Object.freeze({
  status:'N414_OBSERVED_CROSSINGS_REFINEMENT_DIAGNOSTIC',
  observedBrackets:all.length,
  refinedBrackets:refined.filter(x=>x.status==='NUMERIC_SIGN_CHANGE_BRACKET_ONLY').length,
  blockedBrackets:refined.filter(x=>x.status!=='NUMERIC_SIGN_CHANGE_BRACKET_ONLY').length,
  maximumRefinedWidthMs:Math.max(0,...refined.filter(x=>x.widthMs<1000).map(x=>x.widthMs)),
  roots:refined, // KEEP PRIVATE: only aggregate counts go to exported report
  independentContinuousDynamicsCertified:false,independentHistoricUtcCertified:false,
  productionReleasePermitted:false
 });
}
