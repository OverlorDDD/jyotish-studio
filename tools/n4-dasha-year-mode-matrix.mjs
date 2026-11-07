/**
 * N4.16: independent fixed-length Vimshottari year-mode forensics against the
 * 20 SHA-bound original JHora8 JQA3 GUI date captures.
 *
 * This is NOT a mode optimizer for production. Do not choose JHora option
 * "YearDefinition=0 3" by highest score; the option mapping is unknown.
 * No private birth metadata, longitudes, or individual original dates in output.
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadCorpus,verifyReference} from './jqa3-corpus.mjs';
import {parseJHoraRaw} from './jqa3-raw-parser.mjs';
import {nakshatraOf,DASHA_YEARS,DASHA_LORDS,vimshottari}
 from '../packages/jyotish-core/src/index.ts';

const DAY=86400000;
const YEAR_MODES=Object.freeze([
 {name:'savana-360',days:360},
 {name:'fixed-365',days:365},
 {name:'tropical-365.24219',days:365.24219},
 {name:'current-gregorian-365.2425',days:365.2425},
 {name:'julian-365.25',days:365.25},
 {name:'sidereal-365.25636',days:365.25636}
]);
const fail=m=>{throw Error('N4_DASHA_YEAR_FORENSICS_BLOCKED: '+m)};
const date=t=>new Date(t).toISOString().slice(0,10);
const dateDifference=(a,b)=>(Date.parse(a+'T00:00:00.000Z')-Date.parse(b+'T00:00:00.000Z'))/DAY;
const freshScore=()=>({majors:0,majorExact:0,minors:0,minorExact:0,
 majorMaxAbsDays:0,minorMaxAbsDays:0,minorAbsDaysTotal:0,minorWithinOneDay:0});
function recordDashaForFixedYear(moon,birthUtc,yearDays){
 if(!Number.isFinite(moon)||!Number.isFinite(yearDays)||yearDays<=300||yearDays>400||
    !Number.isFinite(Date.parse(birthUtc)))fail('invalid time/year/moment');
 const nak=nakshatraOf(moon),index=nak.index%9;
 let t=Date.parse(birthUtc)-yearDays*DAY*DASHA_YEARS[index]*nak.fraction;
 const out=[];
 for(let i=0;i<9;i++){
  const majorIdx=(index+i)%9,years=DASHA_YEARS[majorIdx],periodStart=t;
  const sub={};
  for(let j=0;j<9;j++){
   const idx=(majorIdx+j)%9;
   sub[DASHA_LORDS[idx]]=t;
   t+=yearDays*DAY*years*DASHA_YEARS[idx]/120;
  }
  // Prevent successive floating-point additions from accumulating calendar
  // drift: the major starts are anchored to an independent closed form.
  const majorEnd=periodStart+yearDays*DAY*years;
  if(Math.abs(t-majorEnd)>4)fail('arithmetic drift exceeds 4 ms');
  out.push({lord:DASHA_LORDS[majorIdx],start:periodStart,subs:sub});
  t=majorEnd;
 }
 return out;
}
function scoreOne(target,computed,original,offsetMs){
 if(!Array.isArray(original)||original.length!==9||computed.length!==9)
  fail('missing original 9 major periods');
 for(let i=0;i<9;i++){
  const expected=original[i],c=computed[i];
  if(expected.lord!==c.lord||Object.keys(expected.antardashas??{}).length!==9)
   fail('JHora lord order or original subperiod absent');
  const delta=dateDifference(date(c.start+offsetMs),expected.start);
  target.majors++;
  target.majorExact+=Number(delta===0);
  target.majorMaxAbsDays=Math.max(target.majorMaxAbsDays,Math.abs(delta));
  for(const [lord,at] of Object.entries(c.subs)){
   const expectedDate=expected.antardashas[lord];
   if(typeof expectedDate!=='string')fail('JHora original antardasha omitted');
   const diff=dateDifference(date(at+offsetMs),expectedDate);
   target.minors++;
   target.minorExact+=Number(diff===0);
   target.minorWithinOneDay+=Number(Math.abs(diff)<=1);
   target.minorAbsDaysTotal+=Math.abs(diff);
   target.minorMaxAbsDays=Math.max(target.minorMaxAbsDays,Math.abs(diff));
  }
 }
}
function getPinned20(){
 const references=loadCorpus().records.filter(x=>x.hasOriginalJHoraIni);
 if(references.length!==20)fail('require precisely 20 original JHora captures');
 return references.map((rec,i)=>{
  const ref=verifyReference(rec),loc='../'+rec.captureDir+'/';
  const chart=readFileSync(new URL(loc+'chart_data.txt',import.meta.url),'utf8');
  const divisional=readFileSync(new URL(loc+'divisionals.txt',import.meta.url),'utf8');
  const ini=readFileSync(new URL(loc+'jhora.ini',import.meta.url),'utf8');
  if(!/^YearDefinition=0 3\r?$/m.test(ini))fail('original YearDefinition changed');
  const original=parseJHoraRaw(chart,divisional);
  if(Math.abs(original.expected.positions.Moon.longitude-ref.expected.positions.Moon.longitude)>1e-9)
   fail('JHora original Moon differs');
  if(!Number.isInteger(original.birth.utcOffsetSeconds))fail('JHora original UTC offset not attested');
  return Object.freeze({index:i,moon:original.expected.positions.Moon.longitude,
   birthUtc:ref.civilTime.birthUtc,offsetMs:original.birth.utcOffsetSeconds*1000,
   reference:ref.expected.vimshottari});
 });
}
export function auditN4DashaModeMatrix(){
 const corpus=getPinned20(),results=[];
 for(const year of YEAR_MODES)for(const clock of ['UTC','ORIGINAL_CAPTURED_LOCAL']){
  const train=freshScore(),holdout=freshScore(),overall=freshScore();
  for(const record of corpus){
   const calc=recordDashaForFixedYear(record.moon,record.birthUtc,year.days);
   const offset=clock==='UTC'?0:record.offsetMs;
   scoreOne(record.index<10?train:holdout,calc,record.reference,offset);
   scoreOne(overall,calc,record.reference,offset);
  }
  if(train.majors!==90||train.minors!==810||
   holdout.majors!==90||holdout.minors!==810||
   overall.majors!==180||overall.minors!==1620)
   fail('incomplete original period corpus');
  results.push({yearModel:year.name,yearDays:year.days,clock,
   training:train,holdout,overall});
 }
 // Independently audit the actual production function, not just this model.
 const production=freshScore(),local=freshScore();
 for(const rec of corpus){
  const periods=vimshottari(rec.moon,rec.birthUtc);
  const adapted=periods.map(p=>({lord:p.lord,start:Date.parse(p.start),
   subs:Object.fromEntries(p.antardashas.map(x=>[x.lord,Date.parse(x.start)]))}));
  scoreOne(production,adapted,rec.reference,0);
  scoreOne(local,adapted,rec.reference,rec.offsetMs);
 }
 if(production.majorExact!==37||production.minorExact!==294||
    local.majorExact!==37||local.minorExact!==293)
  fail('original production dasha 20-case baseline changed unexpectedly');
 const sorted=[...results].sort((a,b)=>b.holdout.minorExact-a.holdout.minorExact||
  b.holdout.majorExact-a.holdout.majorExact||
  a.holdout.minorMaxAbsDays-b.holdout.minorMaxAbsDays);
 return Object.freeze({
  status:'N4_JHORA20_YEAR_MODE_HOLDOUT_FORENSICS_COMPLETED',
  originalJHoraSources:20,trainingSourceCases:10,holdoutSourceCases:10,
  eachCandidateMajorDates:180,eachCandidateMinorDates:1620,
  actualProductionUtc:production,actualProductionCapturedLocal:local,
  originalYearDefinitionCode:'YearDefinition=0 3',
  candidatesByHoldoutScore:sorted,
  noTrainingOrHoldoutReferenceDateGenerated:true,
  originalJHoraExactSolarYearDefinitionVerified:false,
  fixedCalendarYearModelAutomaticallyApproved:false,
  trueSolarLongitudeModelIncluded:false,
  productionDashaDatesCertified:false,
  productionDashaModeChanged:false,
  next:'Test true sidereal/tropical solar longitude crossing on pinned Swiss backend, then inspect original JHora year definition menu.'
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  console.log(JSON.stringify(auditN4DashaModeMatrix(),null,2));
 }catch(e){console.error(e.message);process.exitCode=2;}
}
