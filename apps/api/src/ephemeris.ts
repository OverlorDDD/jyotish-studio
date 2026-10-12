import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import type {BirthInput,EphemerisData} from '../../../packages/jyotish-core/src/index.ts';
import {localToUTC,mod} from '../../../packages/jyotish-core/src/index.ts';
const thisDir=dirname(fileURLToPath(import.meta.url));
/** Prefer native TypeScript-friendly Swiss Ephemeris; Python fallback is for offline workshops. */
export async function getEphemeris(input:BirthInput):Promise<EphemerisData>{
 const utc=localToUTC(input.date,input.time,input.timeZone);
 try {
  const sw=await import('@swisseph/node');
  const jd=sw.dateToJulianDay(new Date(utc));
  sw.setSiderealMode(sw.SiderealMode.Lahiri);
  const flags=sw.CalculationFlag.SwissEphemeris|sw.CalculationFlag.Speed|65536; // SEFLG_SIDEREAL
  const ayanamsa=sw.getAyanamsaExUt(jd,sw.CalculationFlag.SwissEphemeris);
  const houses=sw.calculateHouses(jd,input.latitude,input.longitude,sw.HouseSystem.Placidus);
  const ascendant=mod(houses.ascendant-ayanamsa);
  const bodies:[string,number][]=[['Sun',sw.Planet.Sun],['Moon',sw.Planet.Moon],['Mars',sw.Planet.Mars],['Mercury',sw.Planet.Mercury],['Jupiter',sw.Planet.Jupiter],['Venus',sw.Planet.Venus],['Saturn',sw.Planet.Saturn],['Rahu',sw.LunarPoint.MeanNode]];
  const positions=bodies.map(([name,body])=>{const p=sw.calculatePosition(jd,body,flags);return {name,longitude:mod(p.longitude),speed:p.longitudeSpeed};});
  const rahu=positions.find(p=>p.name==='Rahu')!;
  positions.push({name:'Ketu',longitude:mod(rahu.longitude+180),speed:rahu.speed});
  return {ayanamsa,ascendant,positions,julianDay:jd,backend:'Swiss Ephemeris / @swisseph/node'};
 } catch(err){
  if(process.env.ALLOW_PYTHON_SWISSEPH==='0')throw new Error(`Native Swiss Ephemeris unavailable: ${String(err)}`);
  const pythonExe=process.env.PYTHON_BIN|| (process.platform==='win32'?'python':'python3');
  const script=resolve(thisDir,'../../../tools/swiss_ephemeris.py');
  const result=spawnSync(pythonExe,[script],{input:JSON.stringify({utc,latitude:input.latitude,longitude:input.longitude}),encoding:'utf8',timeout:12000,maxBuffer:1024*1024});
  if(result.status!==0)throw new Error(`Install @swisseph/node with npm install, or Python pyswisseph: ${(result.stderr||result.error?.message||'ephemeris backend unavailable').slice(0,300)}`);
  return JSON.parse(result.stdout) as EphemerisData;
 }
}
