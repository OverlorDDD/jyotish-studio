/** JQA-3: independently certify exactly those civil DATES present in the
 * 20 SHA-pinned JHora 8.0 source exports, using actual native SWIEPH Moon.
 * Do not claim JHora sub-second instants or its undocumented year-option map.
 */
import {readFileSync} from 'node:fs';
import {loadCorpus,verifyReference,withinOneArcsecond} from './jqa3-corpus.mjs';
import {vimshottariTrueSiderealSolar,VIMSHOTTARI_SOLAR_METHOD} from '../packages/jyotish-core/src/solar-dasha.ts';
import {assertSwissReturnFlags} from '../apps/api/src/swiss-backend-policy.ts';
import {jhora8SiderealLongitude} from '../packages/jyotish-core/src/index.ts';
const sw=await import('@swisseph/node');
const flags=sw.CalculationFlag.SwissEphemeris|sw.CalculationFlag.Speed|65536;
sw.setSiderealMode(sw.SiderealMode.Lahiri);
const sunAt=jd=>{
 const p=sw.calculatePosition(jd,sw.Planet.Sun,flags);
 assertSwissReturnFlags(p.flags,'dasha-calendar.Sun');
 return {longitude:p.longitude,longitudeSpeed:p.longitudeSpeed};
};
const dateFor=(iso,utcOffsetSeconds)=>new Date(Date.parse(iso)+utcOffsetSeconds*1000+30000).toISOString().slice(0,10);
const corpus=loadCorpus();
const selected=corpus.records.filter(x=>x.hasOriginalJHoraIni&&x.configAssertion==='EXPLICIT_CAPTURED_INI');
if(selected.length!==20)throw Error('All 20 separately captured original JHora 8 cases required');
let maha=0,antara=0,moon=0;
const errors=[],perChart=[];
for(const record of selected){
 const fixture=verifyReference(record);
 const capture=JSON.parse(readFileSync(new URL('../'+record.captureDir+'/capture.json',import.meta.url),'utf8'));
 const offset=capture.utcOffsetSeconds;
 if(!Number.isInteger(offset)||Math.abs(offset)>14*3600)throw Error('Invalid captured fixed UTC offset '+record.id);
 const birth=new Date(fixture.civilTime.birthUtc);
 if(!Number.isFinite(birth.valueOf()))throw Error('Invalid UTC source birth '+record.id);
 const hour=birth.getUTCHours()+birth.getUTCMinutes()/60+birth.getUTCSeconds()/3600;
 const jd=sw.julianDay(birth.getUTCFullYear(),birth.getUTCMonth()+1,birth.getUTCDate(),hour);
 const position=sw.calculatePosition(jd,sw.Planet.Moon,flags);
 assertSwissReturnFlags(position.flags,record.id+'.Moon');
 const productionMoonLongitude=jhora8SiderealLongitude(position.longitude);
 if(!withinOneArcsecond(productionMoonLongitude,fixture.expected.positions.Moon.longitude)){
  errors.push({id:record.id,kind:'NATAL_MOON_PRECISION',reference:fixture.expected.positions.Moon.longitude,actual:productionMoonLongitude});
  continue;
 }
 moon++;
 const periods=vimshottariTrueSiderealSolar(productionMoonLongitude,fixture.civilTime.birthUtc,sunAt);
 let m=0,a=0;
 for(let i=0;i<9;i++){
  const expected=fixture.expected.vimshottari[i],actual=periods[i];
  if(actual.lord!==expected.lord)throw Error('Dasha lord order mismatch '+record.id);
  const observedDay=dateFor(actual.start,offset);
  if(observedDay===expected.start){maha++;m++;}
  else errors.push({id:record.id,kind:'MAHA_DATE',lord:actual.lord,observedDay,expectedDay:expected.start});
  for(const sub of actual.antardashas){
   const subDay=dateFor(sub.start,offset);
   if(subDay===expected.antardashas[sub.lord]){antara++;a++;}
   else errors.push({id:record.id,kind:'ANTAR_DATE',major:actual.lord,minor:sub.lord,observedDay:subDay,expectedDay:expected.antardashas[sub.lord]});
  }
 }
 perChart.push({id:record.id,maha:m,antara:a,moonWithinOneArcsecond:true});
}
const passed=moon===20&&maha===180&&antara===1620&&errors.length===0;
const report={
 certification:'JQA3_INDEPENDENT_JHORA_CALENDAR_DATES_ONLY',
 status:passed?'DATE_PARITY_CERTIFIED':'NOT_CERTIFIED',
 birthCases:20,natalMoonPassing:moon,
 mahaDates:{passing:maha,required:180},antaraDates:{passing:antara,required:1620},
 method:VIMSHOTTARI_SOLAR_METHOD,
 displayCalendar:'captured civil fixed offset, nearest minute, YYYY-MM-DD',
 numericalStandard:'actual native SWIEPH Moon must remain within 1 arcsecond',
 sourceEvidence:'unmodified JHora 8 original INI, binary hashes and per-chart raw clipboard captures',
 yearOptionEvidence:'JHora code=3 recorded; direct GUI label and subminute transitions not independently captured',
 exactUtcBoundaryInstantsCertified:false,
 perChart,failures:errors
};
console.log(JSON.stringify(report,null,2));
if(!passed)process.exitCode=2;
