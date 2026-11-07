/**
 * N4.14 research-only civil-time resolver. No production calls or feature flags.
 * Intl's host ICU/tzdb is a reproducible diagnostic, NOT independently
 * attested historical timezone provenance. Time gap/fold fails closed.
 */
const zoneFormatter = zone => new Intl.DateTimeFormat('en-GB', {
  timeZone: zone, calendar: 'gregory', numberingSystem: 'latn',
  hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit'
});
function civilFields(formatter, utcMs) {
  const p = Object.fromEntries(formatter.formatToParts(new Date(utcMs))
    .filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
  return [p.year,p.month,p.day,p.hour,p.minute,p.second];
}
function civilMillis(f) {
  const d=new Date(0);
  d.setUTCFullYear(f[0], f[1]-1, f[2]);
  d.setUTCHours(f[3],f[4],f[5],0);
  return d.getTime();
}
export function resolveN414CivilTime({date,time,zone}) {
  if (typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||
      typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time)||
      typeof zone!=='string'||zone.length>100)
    throw Error('N414_INVALID_CIVIL_INPUT');
  const fields=[...date.split('-').map(Number),...time.split(':').map(Number)];
  if(fields.length===5)fields.push(0);
  const naive=civilMillis(fields);
  if (!Number.isFinite(naive)||new Date(naive).getUTCFullYear()!==fields[0]||
      new Date(naive).getUTCMonth()+1!==fields[1]||
      new Date(naive).getUTCDate()!==fields[2]||fields[0]<1900||fields[0]>2100)
    throw Error('N414_INVALID_CIVIL_DATE_OR_RANGE');
  let formatter;
  try { formatter=zoneFormatter(zone); formatter.format(new Date(naive)); }
  catch { throw Error('N414_INVALID_IANA_TIMEZONE'); }
  // Explore all offsets seen across a 72-hour UTC neighborhood. This is
  // candidate discovery, not a proof that the timezone database is complete.
  const offsets=new Set();
  for(let h=-36;h<=36;h+=0.5){
    const instant=naive+h*3600000;
    offsets.add(Math.round((civilMillis(civilFields(formatter,instant))-instant)/1000));
  }
  const matches=[...offsets].map(offsetSeconds=>naive-offsetSeconds*1000)
    .filter(ms=>civilFields(formatter,ms).every((v,i)=>v===fields[i]))
    .sort((a,b)=>a-b);
  const unique=[...new Set(matches)];
  const status=unique.length===1?'UNIQUE':unique.length===0?'GAP':'FOLD';
  return Object.freeze({
    version:'n4.14-intl-civil-diagnostic-v1',status,
    zone:formatter.resolvedOptions().timeZone,
    candidatesUtc:unique.map(ms=>new Date(ms).toISOString()),
    offsetSeconds:unique.map(ms=>Math.round((naive-ms)/1000)),
    hostTzdbExternallyCertified:false,productionTimeResolved:false,
    requiresIndependentHistoricalZoneProvenance:true
  });
}
/** 
 * Conservative crossing inventory for guaranteed continuous UNWRAPPED longitude
 * envelopes. Does not itself certify that the bounds truly enclose a trajectory.
 * D60 equal arcs are 0.5 degrees; signed unwrapped values may exceed 360.
 */
export function inspectN414D60Envelope({minimum,maximum,nominal}) {
  if(![minimum,maximum,nominal].every(Number.isFinite)||minimum>nominal||
      nominal>maximum||maximum-minimum>360)
    throw Error('N414_INVALID_CONTINUOUS_ENVELOPE');
  const epsilon=1e-10;
  const first=Math.ceil((minimum-epsilon)*2);
  const last=Math.floor((maximum+epsilon)*2);
  const crossingCount=Math.max(0,last-first+1);
  const nearBoundary=crossingCount>0;
  return Object.freeze({
    version:'n4.14-d60-boundaries-v1',
    stableWithoutBoundary:!nearBoundary,
    boundaryCount:crossingCount,
    firstBoundaryDegrees:nearBoundary?first/2:null,
    lastBoundaryDegrees:nearBoundary?last/2:null,
    requiresIndependentlyVerifiedContinuousBounds:true,
    productionD60Certified:false
  });
}
