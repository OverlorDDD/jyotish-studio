import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {tropicalSkyAtUtc,tropicalSkyForDay,westernSignReading} from '../apps/api/src/western-horoscope.ts';
import {getEphemeris} from '../apps/api/src/ephemeris.ts';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const example='1996-03-27T12:00:00.000Z';
test('27 March 1996: tropical Aries Sun and Cancer Moon; sidereal Pisces Sun and Gemini Moon',
 {timeout:40000},async()=>{
 const sky=await tropicalSkyAtUtc(example);
 assert.equal(sky.sun.sign,1,'Aries in tropical Western system');
 assert.equal(sky.moon.sign,4,'Cancer in tropical Western system');
 assert.ok(Math.abs(sky.sun.longitude-7.1043)<0.03,'Sun tropical longitude from independent Swiss control');
 assert.ok(Math.abs(sky.moon.longitude-101.8687)<0.03,'Moon tropical longitude from independent Swiss control');
 const eph=await getEphemeris({date:'1996-03-27',time:'12:00',timeZone:'UTC',latitude:50.4501,longitude:30.5234});
 const sun=eph.positions.find(p=>p.name==='Sun'),moon=eph.positions.find(p=>p.name==='Moon');
 assert.ok(sun&&moon);
 assert.ok(sun.longitude>=330 && sun.longitude<360,'Jyotish Sun Pisces');
 assert.ok(moon.longitude>=60 && moon.longitude<90,'Jyotish Moon Gemini');
});
test('sidereal Moon stays in Gemini on March 27 at 00/12/23 UTC', {timeout:50000},async()=>{
 for(const time of ['00:00','12:00','23:00']){
  const eph=await getEphemeris({date:'1996-03-27',time,timeZone:'UTC',latitude:0,longitude:0});
  const moon=eph.positions.find(p=>p.name==='Moon');
  assert.ok(moon && moon.longitude>=60 && moon.longitude<90,'Moon must be Gemini at '+time);
 }
});
test('Western Sun-sign readings are independently computed and have traceable evidence',
 {timeout:10000},async()=>{
 const sky=await tropicalSkyForDay('2026-10-31','Europe/Kyiv');
 const readings=Array.from({length:12},(_,i)=>westernSignReading(i+1,sky,'2026-10-31'));
 assert.equal(readings.length,12);
 assert.equal(new Set(readings.map(x=>x.house)).size,12);
 assert.ok(readings.every(x=>x.evidence.kind==='PUBLIC_TROPICAL_SOLAR_REFERENCE'));
 assert.ok(readings.every(x=>x.evidence.method.includes('tropical-of-date')));
 assert.ok(readings.every(x=>x.goodFor.uk && x.goodFor.en && x.description.uk && x.description.en));
 assert.notEqual(readings[0].description.uk,readings[2].description.uk);
});
test('Western forecast avoids verbatim repeat headlines and actions on adjacent days',async()=>{
 const days=['2026-10-28','2026-10-29','2026-10-30','2026-10-31'];
 const readings=await Promise.all(days.map(async day=>
  westernSignReading(1,await tropicalSkyForDay(day,'Europe/Kyiv'),day)));
 for(let i=1;i<readings.length;i++){
  assert.notEqual(readings[i].headline.uk,readings[i-1].headline.uk);
  assert.notEqual(readings[i].goodFor.uk,readings[i-1].goodFor.uk);
 }
});
test('Native western forecast refuses malformed dates, signs or zones',async()=>{
 const sky=await tropicalSkyAtUtc(example);
 for(const sign of [0,13,1.1,NaN])assert.throws(()=>westernSignReading(sign,sky,'1996-03-27'));
 assert.throws(()=>westernSignReading(1,sky,'1996-02-30'));
 await assert.rejects(tropicalSkyForDay('2026-10-31','Invalid/Zone'));
});
test('public Western and Vedic APIs remain separate; moon sign guide links do not silently switch',
 ()=>{
 const api=source('apps/api/src/horoscope.ts');
 const ui=source('apps/web/app/components/HoroscopeHub.tsx');
 const moon=source('apps/web/app/[locale]/horoscope/[sign]/page.tsx');
 const profile=source('apps/api/src/personal.ts');
 assert.ok(api.includes("@Get('western/today')"));
 assert.ok(api.includes("@Get('western/week')"));
 assert.ok(api.includes("reference:'TROPICAL_SUN_SIGN'"));
 assert.ok(api.includes("reference:'SIDEREAL_MOON_SIGN'"));
 assert.ok(ui.includes("useState<'western'|'vedic'>('western')"));
 assert.ok(ui.includes("TROPICAL_SUN_SIGN"));
 assert.ok(ui.includes("Натальний Місяць")||ui.includes("Ведичний Місяць"));
 assert.ok(moon.includes('system=vedic&sign='));
 assert.ok(profile.includes('westernSunSign')&&profile.includes('tropicalSkyAtUtc(result.utc)'));
});
