import {spawnSync} from 'node:child_process';
import {assertSwissReturnFlags} from './swiss-backend-policy.ts';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import type {BirthInput,EphemerisData} from '../../../packages/jyotish-core/src/index.ts';
import {localToUTC,mod,JHORA8_MEAN_LAHIRI_VERSION_DIFF_ARCSECONDS,jhora8SiderealLongitude} from '../../../packages/jyotish-core/src/index.ts';
const thisDir=dirname(fileURLToPath(import.meta.url));
/** Prefer native TypeScript-friendly Swiss Ephemeris; Python fallback is for offline workshops. */
export async function getEphemeris(input:BirthInput):Promise<EphemerisData>{
 const utc=localToUTC(input.date,input.time,input.timeZone);
 try {
  const sw=await import('@swisseph/node');
  const date=new Date(utc);
  const hour=date.getUTCHours()+date.getUTCMinutes()/60+date.getUTCSeconds()/3600+date.getUTCMilliseconds()/3600000;
  const jd=sw.julianDay(date.getUTCFullYear(),date.getUTCMonth()+1,date.getUTCDate(),hour);
  sw.setSiderealMode(sw.SiderealMode.Lahiri);
  const flags=sw.CalculationFlag.SwissEphemeris|sw.CalculationFlag.Speed|65536; // SEFLG_SIDEREAL, upstream numeric flag
  // Maintain JHora 8's explicitly versioned historical Lahiri convention
  // for the apparent metadata and every sidereal graha (including the Moon).
  // Swiss 2.10's tropical astronomy is retained; only the documented
  // historical ayanamsa definition differs.
  const ayanamsa=sw.getAyanamsaExUt(jd,sw.CalculationFlag.SwissEphemeris)-
   JHORA8_MEAN_LAHIRI_VERSION_DIFF_ARCSECONDS/3600;
  // Swiss SEFLG_NONUT=64. Across 20 original JHora 8.0 exports the rising
  // longitude agrees with tropical ASC minus MEAN Lahiri (19/20 within 1\"),
  // rather than tropical ASC minus nutated Lahiri (0/20 within 1\").
  // This is an observational convention match, not proof of JHora internals.
  const lagnaAyanamsa=sw.getAyanamsaExUt(jd,sw.CalculationFlag.SwissEphemeris|64);
  const houses=sw.calculateHouses(jd,input.latitude,input.longitude,sw.HouseSystem.Placidus);
  // JHora 8's Swiss 2.02.01 mean Lahiri ayanamsa differs from 2.10.03.
  // Same physically attested v2.02.01 ayanamsa convention for Lagna;
  // no chart-specific adjustment or data replacement.
  const jhora8HistoricalMeanLahiri=lagnaAyanamsa-JHORA8_MEAN_LAHIRI_VERSION_DIFF_ARCSECONDS/3600;
  const ascendant=mod(houses.ascendant-jhora8HistoricalMeanLahiri);
  const bodies:[string,number][]=[['Sun',sw.Planet.Sun],['Moon',sw.Planet.Moon],['Mars',sw.Planet.Mars],['Mercury',sw.Planet.Mercury],['Jupiter',sw.Planet.Jupiter],['Venus',sw.Planet.Venus],['Saturn',sw.Planet.Saturn],['Rahu',sw.LunarPoint.MeanNode]];
  const positions=bodies.map(([name,body])=>{const p=sw.calculatePosition(jd,body,flags);assertSwissReturnFlags(p.flags,name);return {name,longitude:jhora8SiderealLongitude(p.longitude),speed:p.longitudeSpeed};});
  const rahu=positions.find(p=>p.name==='Rahu')!;
  positions.push({name:'Ketu',longitude:mod(rahu.longitude+180),speed:rahu.speed});
  if(!Number.isFinite(ascendant)||positions.some(p=>!Number.isFinite(p.longitude)||!Number.isFinite(p.speed)))throw Error('Invalid native ephemeris result');
  return {ayanamsa,ascendant,positions,julianDay:jd,backend:'Swiss Ephemeris / @swisseph/node / verified-SWIEPH'};
 } catch(err){
  if(process.env.ALLOW_PYTHON_SWISSEPH==='0')throw new Error(`Native Swiss Ephemeris unavailable: ${String(err)}`);
  const pythonExe=process.env.PYTHON_BIN|| (process.platform==='win32'?'py':'python3');
  const script=resolve(thisDir,'../../../tools/swiss_ephemeris.py');
  const result=spawnSync(pythonExe,[...(pythonExe==='py'?['-3']:[]),script],{input:JSON.stringify({utc,latitude:input.latitude,longitude:input.longitude}),encoding:'utf8',timeout:12000,maxBuffer:1024*1024});
  if(result.status!==0)throw new Error(`Install @swisseph/node with npm install, or Python pyswisseph: ${(result.stderr||result.error?.message||'ephemeris backend unavailable').slice(0,300)}`);
  return JSON.parse(result.stdout) as EphemerisData;
 }
}

/** Native, fail-closed SWIEPH Sun callback for true-sidereal solar years.
 * Never attempt to calculate future dashas with a Moshier fallback.
 */
export async function getVerifiedSiderealSolarSunAt(){
 const sw=await import('@swisseph/node');
 sw.setSiderealMode(sw.SiderealMode.Lahiri);
 const flags=sw.CalculationFlag.SwissEphemeris|sw.CalculationFlag.Speed|65536;
 return (julianDayUt:number)=>{
  const point=sw.calculatePosition(julianDayUt,sw.Planet.Sun,flags);
  assertSwissReturnFlags(point.flags,'TrueSiderealDasha.Sun');
  return {longitude:jhora8SiderealLongitude(point.longitude),longitudeSpeed:point.longitudeSpeed};
 };
}
