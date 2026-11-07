/**
 * N4.16 research-only TRUE SOLAR LONGITUDE YEAR diagnostic using REAL native
 * Swiss Ephemeris with returned SWIEPH=2 on every solar position.
 *
 * Against 20 independently SHA-pinned original JHora8 GUI date captures.
 * Does NOT modify production dasa or claim that JHora YearDefinition=0 3
 * is this algorithm. Date-only source is never a sub-day UTC certificate.
 */
import {readFileSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {loadCorpus,verifyReference} from './jqa3-corpus.mjs';
import {parseJHoraRaw} from './jqa3-raw-parser.mjs';
import {DASHA_YEARS,DASHA_LORDS,nakshatraOf,jhora8SiderealLongitude}
 from '../packages/jyotish-core/src/index.ts';
import {jhora8HistoricalJulianDay} from '../packages/jyotish-core/src/jhora8-delta-t-grid.ts';

const DAY=86400000;
const FILES={
 'sepl_18.se1':'0b7e416e3c1be9e6a0dd1d711dae7f7685793a0e7df13f76363a493dc27b6ea1',
 'semo_18.se1':'ecfa54dbf5bc0b5a9bc3e04ed28629a821e98625eacae38f4070593bba0e2980'
};
const fail=m=>{throw Error('N4_TRUE_SOLAR_SWIEPH_BLOCKED: '+m)};
const normal=x=>((x%360)+360)%360;
const angularError=(actual,target)=>((actual-target+540)%360+360)%360-180;
const calendar=t=>new Date(t).toISOString().slice(0,10);
const dayDiff=(a,b)=>(Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/DAY;
const score=()=>({cases:0,majorExact:0,majorTotal:0,minorExact:0,minorTotal:0,
 maxMajorAbsDays:0,maxMinorAbsDays:0,minorMeanAbsDays:0});
/**
 * Find the crossing of Sun's sidereal/tropical longitude at *years* (360 deg
 * per year) from start. Every actual sun call MUST independently assert SWIEPH;
 * the solver makes no claim of interval-unique roots without a monotonicity
 * proof across its bracket. Conservative 12-day bracket + sun-speed checks.
 * For times/years beyond the solar data coverage this must fail closed.
 */
export function solveN4SolarArcInstant({startMs,years,yearDays,getSun}){
 if(!Number.isFinite(startMs)||!Number.isFinite(years)||years===0||
  Math.abs(years)>125||!Number.isFinite(yearDays)||yearDays<365||yearDays>366||
  typeof getSun!=='function')fail('invalid root inputs');
 const first=getSun(startMs);
 if(!Number.isFinite(first))fail('Sun position unavailable');
 const target=normal(first+360*(years%1));
 const prediction=startMs+years*yearDays*DAY;
 let lower=prediction-12*DAY,upper=prediction+12*DAY;
 let fl=angularError(getSun(lower),target);
 let fu=angularError(getSun(upper),target);
 if(!Number.isFinite(fl)||!Number.isFinite(fu)||!(fl< -0.005&&fu>0.005))
  fail('target solar longitude cannot be bracketed near physically expected year');
 for(let i=0;i<45&&upper-lower>1000;i++){
  const mid=(lower+upper)/2,err=angularError(getSun(mid),target);
  if(!Number.isFinite(err))fail('non-finite Sun during bisection');
  if(err<0)lower=mid;else upper=mid;
 }
 const mid=(lower+upper)/2;
 if(upper-lower>1000||Math.abs(angularError(getSun(mid),target))>0.00005)
  fail('Sun root residual/width too large');
 return mid;
}
function load20(){
 const captures=loadCorpus().records.filter(x=>x.hasOriginalJHoraIni);
 if(captures.length!==20)fail('20 genuine JHora captures required');
 return captures.map((rec,index)=>{
  const ref=verifyReference(rec),prefix='../'+rec.captureDir+'/';
  const text=readFileSync(new URL(prefix+'chart_data.txt',import.meta.url),'utf8');
  const divisions=readFileSync(new URL(prefix+'divisionals.txt',import.meta.url),'utf8');
  const ini=readFileSync(new URL(prefix+'jhora.ini',import.meta.url),'utf8');
  if(!/^YearDefinition=0 3\r?$/m.test(ini))fail('original year option absent');
  const raw=parseJHoraRaw(text,divisions);
  if(Math.abs(raw.expected.positions.Moon.longitude-ref.expected.positions.Moon.longitude)>1e-9)
   fail('original Moon differs from SHA-pinned reference');
  return {index,moon:raw.expected.positions.Moon.longitude,
   birthUtc:ref.civilTime.birthUtc,
   offsetMs:raw.birth.utcOffsetSeconds*1000,
   periods:ref.expected.vimshottari};
 });
}
function buildPeriods(caseRecord,mode,getSun){
 const nak=nakshatraOf(caseRecord.moon),first=nak.index%9;
 const guessYearDays=mode==='sidereal'?365.25636:365.24219;
 let t=solveN4SolarArcInstant({startMs:Date.parse(caseRecord.birthUtc),
  years:-DASHA_YEARS[first]*nak.fraction,yearDays:guessYearDays,getSun});
 const periods=[];
 for(let i=0;i<9;i++){
  const k=(first+i)%9,years=DASHA_YEARS[k],start=t;
  const nextMajor=solveN4SolarArcInstant({startMs:start,years,
   yearDays:guessYearDays,getSun});
  const subs={};let sub=t;
  for(let j=0;j<9;j++){
   const l=(k+j)%9;subs[DASHA_LORDS[l]]=sub;
   if(j<8){
    sub=solveN4SolarArcInstant({startMs:sub,years:years*DASHA_YEARS[l]/120,
     yearDays:guessYearDays,getSun});
   }
  }
  if(sub>nextMajor+1000)fail('antardasha elapsed beyond next mahadasha');
  periods.push({lord:DASHA_LORDS[k],start,subs});
  t=nextMajor;
 }
 return periods;
}
function addCase(target,computed,original,offsetMs){
 if(computed.length!==9||original.length!==9)fail('bad dasha sequence');
 target.cases++;
 for(let i=0;i<9;i++){
  const actual=computed[i],expected=original[i];
  if(actual.lord!==expected.lord||Object.keys(expected.antardashas??{}).length!==9)
   fail('original JHora lord/date sequence incomplete');
  const major=dayDiff(calendar(actual.start+offsetMs),expected.start);
  target.majorTotal++;
  target.majorExact+=Number(major===0);
  target.maxMajorAbsDays=Math.max(target.maxMajorAbsDays,Math.abs(major));
  for(const [lord,at] of Object.entries(actual.subs)){
   if(typeof expected.antardashas[lord]!=='string')
    fail('original minor date omitted');
   const diff=dayDiff(calendar(at+offsetMs),expected.antardashas[lord]);
   target.minorTotal++;
   target.minorExact+=Number(diff===0);
   target.maxMinorAbsDays=Math.max(target.maxMinorAbsDays,Math.abs(diff));
   target.minorMeanAbsDays+=Math.abs(diff);
  }
 }
}

/**
 * Inspect ONLY the original JHora sidereal + original captured-local-offset
 * calendar-day residuals. Public JQA3 cases are synthetic and SHA-bound;
 * omit exact original birth details and source-longitude from this output.
 * A one-day disagreement is not automatically rounded away or repaired.
 */
export function inspectN416LocalDashaResiduals({computed,original,offsetMs,caseIndex}){
 if(!Array.isArray(computed)||computed.length!==9||
    !Array.isArray(original)||original.length!==9||
    !Number.isInteger(offsetMs)||Math.abs(offsetMs)>14*3600000||
    !Number.isInteger(caseIndex)||caseIndex<0||caseIndex>19)
  fail('invalid residual inspection inputs');
 const mismatches=[];
 function check(at,expected,lord,minorLord){
  if(!Number.isFinite(at)||typeof expected!=='string'||
     !/^\d{4}-\d{2}-\d{2}$/.test(expected))
   fail('invalid original calendar boundary');
  const wall=new Date(at+offsetMs);
  const predicted=wall.toISOString().slice(0,10);
  const delta=dayDiff(predicted,expected);
  if(delta===0)return;
  const secondsIntoLocalDay=wall.getUTCHours()*3600+
   wall.getUTCMinutes()*60+wall.getUTCSeconds()+wall.getUTCMilliseconds()/1000;
  mismatches.push(Object.freeze({
   sourceCaseIndex:caseIndex+1,majorLord:lord,
   ...(minorLord?{minorLord}:{}),
   level:minorLord?'antardasha':'mahadasha',
   predictedOriginalFixedOffsetLocalDate:predicted,
   independentlyCapturedJHoraDate:expected,
   deltaCalendarDays:delta,
   predictedOriginalFixedOffsetLocalHHMMSS:wall.toISOString().slice(11,23),
   secondsToNearestLocalMidnight:Math.round(Math.min(
    secondsIntoLocalDay,86400-secondsIntoLocalDay)*1000)/1000,
   localTimeInterpretation:'Original JHora birth-capture fixed UTC offset, not independently proven historical IANA DST'
  }));
 }
 for(let i=0;i<9;i++){
  const c=computed[i],ref=original[i];
  if(c?.lord!==ref?.lord||!c.subs||
     Object.keys(c.subs).length!==9||Object.keys(ref.antardashas??{}).length!==9)
   fail('incomplete period for source residual inspection');
  check(c.start,ref.start,c.lord,null);
  for(const [lord,at] of Object.entries(c.subs)){
   if(!(lord in ref.antardashas))fail('unmatched original sublord');
   check(at,ref.antardashas[lord],c.lord,lord);
  }
 }
 return Object.freeze(mismatches);
}


/**
 * First-order, transparent sensitivity caused ONLY by a source printing Moon
 * to two decimals of arcsecond. NOT a certified astronomical time error bound:
 * native dasha roots below compute the actual physical sensitivity.
 */
export function n418MoonPrintSensitivitySeconds({initialLordYears,roundingStepArcsec,solarYearDays}){
 if(!Number.isFinite(initialLordYears)||initialLordYears<=0||initialLordYears>20||
    !Number.isFinite(roundingStepArcsec)||roundingStepArcsec<=0||roundingStepArcsec>1||
    !Number.isFinite(solarYearDays)||solarYearDays<365||solarYearDays>366)
  fail('invalid source precision model');
 return (roundingStepArcsec/2)/3600/(360/27)*initialLordYears*solarYearDays*86400;
}

/** N4.18, FOCUSED JQA3-02 source-precision interval, never a release gate.
 * Do not assume the actual unrounded original JHora8 Moon position is at any
 * particular side of the printed 0.01-arcsec interval. No source dates modified.
 */
export async function auditN418JHora02PrintedMoonResolution(){
 const records=loadCorpus().records.filter(x=>x.hasOriginalJHoraIni);
 if(records.length!==20||records[1]?.id!=='jqa3-02')
  fail('JQA3-02 original independent source/order absent');
 const ref=verifyReference(records[1]);
 const original=load20()[1];
 if(original.index!==1||original.offsetMs!==0)fail('JQA3-02 fixed source offset changed');
 const raw=readFileSync(new URL('../'+records[1].captureDir+'/chart_data.txt',import.meta.url),'utf8');
 const moonLine=raw.split(/\r?\n/).find(x=>/^Moon\s/.test(x));
 const m=moonLine?.match(/\b(\d{1,2})\s+(Ar|Ta|Ge|Cn|Le|Vi|Li|Sc|Sg|Cp|Aq|Pi)\s+(\d{1,2})'\s+(\d{1,2}\.\d{2})"/);
 if(!m||m[2]!=='Ta')fail('Moon not printed to attested hundredth arcsecond');
 const printed=30+Number(m[1])+Number(m[3])/60+Number(m[4])/3600;
 if(Math.abs(printed-original.moon)>1e-10||
    Math.abs(printed-ref.expected.positions.Moon.longitude)>1e-10)
  fail('original raw Moon print disagrees with immutably pinned source');
 const nak=nakshatraOf(original.moon);
 if(nak.index!==3||DASHA_LORDS[nak.index%9]!=='Moon')fail('unexpected original Moon dasha start');
 const expected=original.periods.find(x=>x.lord==='Jupiter')?.antardashas?.Ketu;
 if(typeof expected!=='string'||expected!=='2018-11-15')
  fail('JHora8 Jupiter/Ketu original printed date changed');
 const native=await nativeSolar();
 const variants=[];
 for(const deltaArcseconds of [-0.005,0,0.005]){
  const moon=original.moon+deltaArcseconds/3600;
  if(nakshatraOf(moon).index!==nak.index)fail('source rounding crosses natal nakshatra');
  const result=buildPeriods({...original,moon},'sidereal',at=>native.sunAt(at,'sidereal'));
  const jupiter=result.find(x=>x.lord==='Jupiter');
  const instant=jupiter?.subs?.Ketu;
  if(!Number.isFinite(instant))fail('native Jupiter/Ketu transition absent');
  const local=new Date(instant+original.offsetMs);
  variants.push({
   printedSourceMoonOffsetArcseconds:deltaArcseconds,
   computedLocalCalendarDate:local.toISOString().slice(0,10),
   computedOriginalFixedOffsetLocalClock:local.toISOString().slice(11,23),
   utcInstant: new Date(instant).toISOString(),
   timestampMs:instant
  });
 }
 const [low,center,high]=variants;
 const hasJHoraDay=variants.some(x=>x.computedLocalCalendarDate===expected);
 const hasOriginalComputedDay=variants.some(x=>x.computedLocalCalendarDate===center.computedLocalCalendarDate);
 const crossBoundary=hasJHoraDay&&hasOriginalComputedDay&&
  variants.some(x=>x.computedLocalCalendarDate!==expected);
 if(center.computedLocalCalendarDate!=='2018-11-14'||!crossBoundary||
    !(low.timestampMs>center.timestampMs&&center.timestampMs>high.timestampMs))
  fail('original 0.01 arcsec Moon precision interval does not explain observed date boundary');
 const predictedHalfWidth=n418MoonPrintSensitivitySeconds({
  initialLordYears:10,roundingStepArcsec:0.01,solarYearDays:365.25636
 });
 const deltaSeconds=(low.timestampMs-high.timestampMs)/1000;
 if(Math.abs(deltaSeconds)>120||Math.abs(deltaSeconds)<30)
  fail('implausible observed native source precision date sensitivity');
 const publicVariants=variants.map(({timestampMs,...safe})=>safe);
 return Object.freeze({
  status:'N418_SOURCE_PRINT_PRECISION_DAY_BOUNDARY_SPANNED_STRICT_SWIEPH_PASS',
  originalSourceCase:'JQA3-02',
  originalJHoraMoonPrintedPrecisionArcseconds:0.01,
  rawPrintedMoonSign:'Taurus',
  originalJHoraJupiterKetuCalendarDate:expected,
  initialMahadashaLord:'Moon',
  firstOrderHalfRoundingSeconds:predictedHalfWidth,
  nativeSourcePrintedIntervalSpanSeconds:deltaSeconds,
  nativeSolarEphemerisCalls:native.calls(),
  originalMoonPrintAlternatives:publicVariants,
  originalUnroundedJHoraMoonLongitudeKnown:false,
  sourceRoundingCanExplainSingleCalendarMismatch:true,
  originalJHoraYearDefinitionOption3Proven:false,
  exactSubdayJHoraTransitionVerified:false,
  productionDashaModeChanged:false,
  historicalCivilTimeCertified:false,
  productionReleasePermitted:false
 });
}

async function nativeSolar(){
 const ephe=resolve(process.cwd(),'node_modules/@swisseph/node/ephemeris');
 for(const [name,expected] of Object.entries(FILES)){
  const file=join(ephe,name);
  const bytes=readFileSync(file);
  if(statSync(file).size<100000||createHash('sha256').update(bytes).digest('hex')!==expected)
   fail('wrong bundled SWIEPH dataset: '+name);
 }
 const sw=await import('@swisseph/node');
 if(sw?.SiderealMode?.Lahiri===undefined||
  sw?.CalculationFlag?.SwissEphemeris!==2)fail('unexpected native Swiss constants');
 sw.setEphemerisPath(ephe);
 sw.setSiderealMode(sw.SiderealMode.Lahiri);
 const flag=sw.CalculationFlag.SwissEphemeris|sw.CalculationFlag.Speed;
 let calls=0;
 function sunAt(ms,mode){
  if(!Number.isFinite(ms))fail('invalid UTC time');
  const jd=ms/DAY+2440587.5,year=new Date(ms).getUTCFullYear();
  if(year<1900||year>2200)fail('outside JQA3 historic DeltaT certified range');
  const adjusted=jhora8HistoricalJulianDay(jd);
  const f=flag|(mode==='sidereal'?65536:0);
  const p=sw.calculatePosition(adjusted,sw.Planet.Sun,f);
  if(!Number.isFinite(p?.longitude)||!Number.isFinite(p?.longitudeSpeed)||
   (p.flags&7)!==2||p.longitudeSpeed<=0.7||p.longitudeSpeed>=1.3)
   fail('Sun not strictly backed by SWIEPH, or implausible speed');
  calls++;
  return mode==='sidereal'?jhora8SiderealLongitude(p.longitude):normal(p.longitude);
 }
 return {sunAt,calls:()=>calls};
}
export async function auditN4Original20NativeSolarDasha(){
 const original=load20(),physical=await nativeSolar(),out=[];
 const siderealOriginalLocalResiduals=[];
 for(const mode of ['sidereal','tropical']){
  const results={UTC:{training:score(),holdout:score(),total:score()},
   ORIGINAL_CAPTURED_LOCAL:{training:score(),holdout:score(),total:score()}};
  for(const record of original){
   const computed=buildPeriods(record,mode,at=>physical.sunAt(at,mode));
   if(mode==='sidereal')siderealOriginalLocalResiduals.push(...inspectN416LocalDashaResiduals({
    computed,original:record.periods,offsetMs:record.offsetMs,caseIndex:record.index
   }));
   for(const clock of Object.keys(results)){
    const col=results[clock],offset=clock==='UTC'?0:record.offsetMs;
    addCase(record.index<10?col.training:col.holdout,computed,record.periods,offset);
    addCase(col.total,computed,record.periods,offset);
   }
  }
  for(const r of Object.values(results)){
   if(r.training.cases!==10||r.holdout.cases!==10||r.total.cases!==20||
    r.total.majorTotal!==180||r.total.minorTotal!==1620)
    fail('missing original JHora source dates');
   for(const s of [r.training,r.holdout,r.total])
    s.minorMeanAbsDays=s.minorMeanAbsDays/s.minorTotal;
  }
  out.push({solarYearConvention:mode==='sidereal'?
   'TRUE_SIDEREAL_SOLAR_LONGITUDE_360_DEGREES':
   'TRUE_TROPICAL_SOLAR_LONGITUDE_360_DEGREES',
   sourceDateClockResults:results});
 }
 return Object.freeze({
  status:'N4_JHORA20_NATIVE_SOLAR_LONGITUDE_DASHA_DIAGNOSTIC_COMPLETED',
  genuineOriginalSyntheticCases:20,actualNativeSunEphemerisCalls:physical.calls(),
  backend:'STRICT_RETURNED_SWIEPH_2_DE431_PINNED_FILES',
  comparison:out,independentTenCaseHoldout:true,
  originalLocalSiderealCalendarResiduals:Object.freeze(siderealOriginalLocalResiduals),
  originalLocalSiderealResidualCount:siderealOriginalLocalResiduals.length,
  originalLocalSiderealMinorCalendarResiduals:Object.freeze(
   siderealOriginalLocalResiduals.filter(x=>x.level==='antardasha')),
  originalLocalSiderealMinorResidualCount:siderealOriginalLocalResiduals.filter(
   x=>x.level==='antardasha').length,
  originalLocalSiderealMajorResidualCount:siderealOriginalLocalResiduals.filter(
   x=>x.level==='mahadasha').length,
  calendarResidualsHaveOnlySyntheticReferenceCaseIds:true,
  jhoraYearDefinitionOption3Identified:false,
  originalJHoraDateTimeExactnessCertified:false,
  productionDashaModeChanged:false,productionReleasePermitted:false,
  note:'True solar year models are physical candidate hypotheses; matching printed calendar days is not a proof of the JHora option number or period transition instants.'
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const mode=process.argv.slice(2);
  if(mode.length>1||(mode.length===1&&mode[0]!=='--moon-precision-jqa3-02'))
   fail('valid modes: no arguments or --moon-precision-jqa3-02');
  const result=mode.length===1?await auditN418JHora02PrintedMoonResolution():await auditN4Original20NativeSolarDasha();
  console.log(JSON.stringify(result,null,2));
 } catch(error){
  console.error(error instanceof Error?error.message:String(error));
  process.exitCode=2;
 }
}
