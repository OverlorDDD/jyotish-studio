#!/usr/bin/env node
/**
 * Original JHora8 20-case date audit of the ACTUAL legacy Vimshottari function.
 * Original JHora printed calendar dates (no instants), so the independent
 * day-matches are evidence of discrepancies, not a calendar-year certificate.
 */
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {loadCorpus,verifyReference} from './jqa3-corpus.mjs';
import {parseJHoraRaw} from './jqa3-raw-parser.mjs';
import {vimshottari,DASHA_YEAR_DAYS} from '../packages/jyotish-core/src/index.ts';

const fail=m=>{throw Error('N4_JHORA20_DASHA_DATE_AUDIT_BLOCKED: '+m)};
const DAY=86400000;
const fmt=t=>new Date(t).toISOString().slice(0,10);
const days=(a,b)=>(Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/DAY;
const score=()=>({majorMatches:0,minorMatches:0,majorTotal:0,minorTotal:0,maxMajorAbsDays:0,
 maxMinorAbsDays:0,first20WorstDayDeltas:[]});
export function auditN4JHoraOriginal20DashaDates(){
 const captures=loadCorpus().records.filter(r=>r.hasOriginalJHoraIni);
 if(captures.length!==20)fail('20 original JHora calendar-date records required');
 const utc=score(),local=score();
 for(const record of captures){
  const ref=verifyReference(record),relative='../'+record.captureDir+'/';
  const chart=readFileSync(new URL(relative+'chart_data.txt',import.meta.url),'utf8');
  const divisions=readFileSync(new URL(relative+'divisionals.txt',import.meta.url),'utf8');
  const ini=readFileSync(new URL(relative+'jhora.ini',import.meta.url),'utf8');
  if(!/^YearDefinition=0 3\r?$/m.test(ini))fail('reference year definition differs');
  const captured=parseJHoraRaw(chart,divisions);
  const sourceMoon=captured.expected.positions.Moon.longitude;
  if(Math.abs(ref.expected.positions.Moon.longitude-sourceMoon)>1e-9)
   fail('not the original JHora captured Moon');
  const expected=ref.expected.vimshottari;
  const actual=vimshottari(sourceMoon,ref.civilTime.birthUtc);
  if(expected?.length!==9||actual.length!==9)fail('incomplete JHora 9-period archive');
  const offset=captured.birth.utcOffsetSeconds;
  if(!Number.isFinite(offset))fail('non-numeric original fixed local UTC offset');
  for(const [target,offsetMs] of [[utc,0],[local,offset*1000]]){
   let max=0;
   for(let i=0;i<9;i++){
    const a=actual[i],e=expected[i];
    if(a.lord!==e.lord||typeof e.start!=='string'||e.start.length!==10)
     fail('original JHora major lord/date missing');
    const delta=days(fmt(Date.parse(a.start)+offsetMs),e.start);
    target.majorTotal++;
    target.majorMatches+=Number(delta===0);
    target.maxMajorAbsDays=Math.max(target.maxMajorAbsDays,Math.abs(delta));
    max=Math.max(max,Math.abs(delta));
    const keys=Object.keys(e.antardashas??{});
    if(keys.length!==9)fail('original JHora nine antardasha dates missing');
    for(const row of a.antardashas??[]){
     const original=e.antardashas[row.lord];
     if(typeof original!=='string'||original.length!==10)
      fail('original JHora minor lord/date missing');
     const difference=days(fmt(Date.parse(row.start)+offsetMs),original);
     target.minorTotal++;
     target.minorMatches+=Number(difference===0);
     target.maxMinorAbsDays=Math.max(target.maxMinorAbsDays,Math.abs(difference));
     max=Math.max(max,Math.abs(difference));
    }
   }
   target.first20WorstDayDeltas.push(max);
  }
 }
 if(utc.majorTotal!==180||local.majorTotal!==180||
  utc.minorTotal!==1620||local.minorTotal!==1620)
  fail('original calendar cases incomplete');
 return Object.freeze({
  status:'N4_ORIGINAL_JHORA20_VIMSHOTTARI_CALENDAR_DAY_AUDIT_COMPLETE',
  originalSyntheticCases:20,
  originalYearOptionCode:'YearDefinition=0 3',
  actualProductionYearDays:DASHA_YEAR_DAYS,
  originalJHoraPrintedPrecision:'YYYY-MM-DD, no moment of transition',
  actualGalaxioraUtcClock:utc,originalCapturedLocalFixedOffsetClock:local,
  originalJHoraOption3NumericalDefinitionCertified:false,
  userSpecificHistoricTimeZoneCertified:false,
  productionCalendarDatesApproved:false,
  originalAndProductionDashaYearConventionMatched:false,
  warning:'Calendar day matches or near matches do not identify the original JHora year mode; exact dates require original time-of-day and matching convention.'
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{console.log(JSON.stringify(auditN4JHoraOriginal20DashaDates(),null,2))}
 catch(e){console.error(e.message);process.exitCode=2}
}
