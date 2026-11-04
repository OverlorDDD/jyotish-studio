/** Diagnostic only: test source-DLL Delta-T history against exact immutable
 * JHora printed calendar days, without choosing a winner automatically.
 * Birth Moon and crossing Sun are varied independently to localize influence.
 */
import {readFileSync} from 'node:fs';
import {loadCorpus,verifyReference} from './jqa3-corpus.mjs';
import {vimshottariTrueSiderealSolar} from '../packages/jyotish-core/src/solar-dasha.ts';
import {jhora8SiderealLongitude} from '../packages/jyotish-core/src/index.ts';
import {jhora8HistoricalJulianDay,JHORA8_DELTA_T_GRID_ID} from '../packages/jyotish-core/src/jhora8-delta-t-grid.ts';
import {assertSwissReturnFlags} from '../apps/api/src/swiss-backend-policy.ts';
const sw=await import('@swisseph/node');
sw.setSiderealMode(sw.SiderealMode.Lahiri);
const flags=sw.CalculationFlag.SwissEphemeris|sw.CalculationFlag.Speed|65536;
const calculate=(jd,planet,withHistoricalDeltaT)=>{
 const point=sw.calculatePosition(withHistoricalDeltaT?jhora8HistoricalJulianDay(jd):jd,planet,flags);
 assertSwissReturnFlags(point.flags,'HistoricalDeltaT.'+planet);
 return point;
};
const sunAt=(withHistoricalDeltaT)=>(jd)=>{
 const p=calculate(jd,sw.Planet.Sun,withHistoricalDeltaT);
 return {longitude:jhora8SiderealLongitude(p.longitude),longitudeSpeed:p.longitudeSpeed};
};
const modes=[
 {name:'baseline-versioned-ayanamsa-only',moonShift:false,sunShift:false},
 {name:'historical-delta-t-natal-moon',moonShift:true,sunShift:false},
 {name:'historical-delta-t-solar-crossings',moonShift:false,sunShift:true},
 {name:'historical-delta-t-both',moonShift:true,sunShift:true}
];
const scores=modes.map(m=>({name:m.name,maha:0,antara:0,errors:[],moonResidualArcsec:[],birthDeltaTSeconds:[]}));
const corpus=loadCorpus();
const records=corpus.records.filter(x=>x.hasOriginalJHoraIni);
if(records.length!==20)throw Error('All 20 attested charts required');
for(const rec of records){
 const ref=verifyReference(rec);
 const cap=JSON.parse(readFileSync(new URL('../'+rec.captureDir+'/capture.json',import.meta.url),'utf8'));
 const utc=new Date(ref.civilTime.birthUtc);
 const jd=sw.julianDay(utc.getUTCFullYear(),utc.getUTCMonth()+1,utc.getUTCDate(),
   utc.getUTCHours()+utc.getUTCMinutes()/60+utc.getUTCSeconds()/3600);
 const off=cap.utcOffsetSeconds;
 for(let k=0;k<modes.length;k++){
  const mode=modes[k],score=scores[k];
  const pos=calculate(jd,sw.Planet.Moon,mode.moonShift);
  const lon=jhora8SiderealLongitude(pos.longitude);
  const delta=((lon-ref.expected.positions.Moon.longitude+540)%360-180)*3600;
  score.moonResidualArcsec.push(delta);
  score.birthDeltaTSeconds.push((jhora8HistoricalJulianDay(jd)-jd)*86400);
  if(Math.abs(delta)>1)throw Error('Production Moon arcsecond regressed '+mode.name+' '+rec.id);
  const actual=vimshottariTrueSiderealSolar(lon,ref.civilTime.birthUtc,sunAt(mode.sunShift));
  for(let i=0;i<9;i++){
   const expected=ref.expected.vimshottari[i];
   const a=actual[i];
   const display=iso=>new Date(Date.parse(iso)+off*1000+30000).toISOString().slice(0,10);
   if(display(a.start)===expected.start)score.maha++;
   else score.errors.push({id:rec.id,kind:'maha',lord:a.lord,date:display(a.start),expected:expected.start});
   for(const sub of a.antardashas){
    if(display(sub.start)===expected.antardashas[sub.lord])score.antara++;
    else score.errors.push({id:rec.id,kind:'antara',major:a.lord,minor:sub.lord,date:display(sub.start),expected:expected.antardashas[sub.lord]});
   }
  }
 }
}
const report={kind:'PHYSICALLY_ANCHORED_DELTA_T_DIFF_EXPERIMENT_NOT_CERTIFICATION',
 source: JHORA8_DELTA_T_GRID_ID,
 results:scores.map(s=>({mode:s.name,maha:s.maha,antara:s.antara,errors:s.errors,
 maxAbsMoonArcsec:Math.max(...s.moonResidualArcsec.map(Math.abs)),
 birthDeltaTAtJQA3_19:s.birthDeltaTSeconds[18]}))};
console.log('HISTORICAL_DELTAT_EXPERIMENT '+JSON.stringify(report));
// No acceptance gate for a research hypothesis; the independent date
// certificate separately and strictly requires 180/180 and 1620/1620.
if(!scores.every(s=>Number.isFinite(s.maha)&&Number.isFinite(s.antara)))process.exitCode=1;
