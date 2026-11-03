/** P3.8.8 independent, pinned source oracles. Not app-generated golden values.
 * Native JQA3 event Lagna vs 30 PySwissEph 2.10.03/zoneinfo records; public
 * 7-day sunrise snapshots vs independent PySwissEph SWIEPH-only samples.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculateVerifiedEventLagna} from '../apps/api/src/panchanga-event-lagna.ts';
import {panchangaRange} from '../apps/api/src/panchanga-range.ts';
import {createVerifiedSiderealPlanetAt} from '../apps/api/src/panchanga.ts';
import {historicalJHora8DeltaTShiftSeconds} from '../packages/jyotish-core/src/jhora8-delta-t-grid.ts';

const fixture=readFileSync(new URL('../tests/fixtures/p388-independent-asc-30.tsv',import.meta.url),'utf8')
 .split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>{
  const [atUtc,latitude,longitude,timeZone,expectedAsc,expectedLagna,expectedLocal]=l.split('|');
  return {atUtc,latitude:Number(latitude),longitude:Number(longitude),timeZone,
   expectedAsc:Number(expectedAsc),expectedLagna:Number(expectedLagna),expectedLocal};
 });
const angle=(a,b)=>Math.abs(((a-b+540)%360)-180)*3600;
const script=fileURLToPath(new URL('./panchanga-p388-independent-reference.py',import.meta.url));
const python=process.env.PYTHON_BIN||(process.platform==='win32'?'py':'python3');
function oracle(args,input){
 const result=spawnSync(python,[...(python==='py'?['-3']:[]),script,...args],{
  input:input?JSON.stringify(input):undefined,
  encoding:'utf8',timeout:120000,maxBuffer:240000,env:process.env});
 assert.equal(result.status,0,result.stderr||result.error?.message||'Python independent reference failed');
 return result.stdout;
}
test('P388 pinned 30 global/different-DST Swiss 2.10.03 source values are independently reproducible',()=>{
 assert.equal(fixture.length,30,'Full reference set is mandatory');
 const result=oracle(['--verify-asc']);
 assert.match(result,/P388_PYTHON_REFERENCE_PASS rows=30 Swiss=2\.10\.03/);
 const places=new Set(fixture.map(f=>f.timeZone));
 assert.ok(places.size>=17);
});
test('P388 30 native event-ASC locations and UTC/DST clocks match independent Swiss/Python within 1 arcsecond',async()=>{
 assert.equal(fixture.length,30);
 for(const f of fixture){
  const event=await calculateVerifiedEventLagna({
   atUtc:f.atUtc,latitude:f.latitude,longitude:f.longitude,timeZone:f.timeZone});
  assert.equal(event.provenance,'NATIVE_SWISS_TROPICAL_ASC_MINUS_VERIFIED_MEAN_LAHIRI');
  assert.ok(angle(event.siderealAscendantDegrees,f.expectedAsc)<=1,
   f.timeZone+' '+f.atUtc+' native sidereal ASC disagreement');
  assert.equal(event.lagnaSign,f.expectedLagna,f.timeZone+' '+f.atUtc+' native Lagna');
  assert.equal(event.localDate+'T'+event.localTime,f.expectedLocal,
   f.timeZone+' IANA UTC/local conversion');
 }
 const spring=fixture.slice(0,2),fall=fixture.slice(2,4);
 assert.equal(spring[0].expectedLocal.endsWith('02:30:00'),true);
 assert.equal(spring[1].expectedLocal.endsWith('04:30:00'),true);
 assert.equal(fall[0].expectedLocal,fall[1].expectedLocal,
  'Autumn 03:30 clock is ambiguous: UTC must not be inferred from local alone');
});
test('P388 4 independent Swiss 7-day sunrise + Sun/Moon + five-limb vectors, including DST and fractional-zone observer',async()=>{
 const vectors=[
  {start:'2026-10-24',days:7,timeZone:'Europe/Kyiv',latitude:50.4501,longitude:30.5234},
  {start:'2027-03-27',days:7,timeZone:'Europe/London',latitude:51.5074,longitude:-0.1278},
  {start:'2027-04-03',days:7,timeZone:'Australia/Sydney',latitude:-33.8688,longitude:151.2093},
  {start:'2027-01-15',days:7,timeZone:'Asia/Kathmandu',latitude:27.7172,longitude:85.3240}
 ];
 const nativePlanet=await createVerifiedSiderealPlanetAt();
 let checked=0,stable=0;
 for(const observer of vectors){
  const modern=JSON.parse(oracle(['--sunrise-samples'],observer));
  const offsets=modern.days.map(d=>{
   const julian=Date.parse(d.sunriseUtc)/86400000+2440587.5;
   return historicalJHora8DeltaTShiftSeconds(julian);
  });
  assert.ok(offsets.every(x=>x>0&&x<60),'Pinned original-DLL ΔT correction exceeds supported 2026–27 physical epoch');
  const py=JSON.parse(oracle(['--sunrise-samples'],
   {...observer,historicalDeltaTSeconds:offsets}));
  assert.equal(py.astronomyEpoch,'JHORA8_HISTORICAL_DELTA_T');
  assert.match(py.source,/SWIEPH-only/);
  assert.ok(py.days.every((d,i)=>d.sunriseUtc===modern.days[i].sunriseUtc),
   'Historical ΔT must not alter independently computed observer sunrise times');
  const ts=await panchangaRange({start:observer.start,days:observer.days,
   timeZone:observer.timeZone,latitude:observer.latitude,longitude:observer.longitude});
  assert.equal(ts.days.length,observer.days);
  for(let i=0;i<observer.days;i++){
   const a=ts.days[i],b=py.days[i];
   assert.equal(a.date,b.date,'No missing observer-local date');
   const from=Date.parse(a.sunriseUtc),target=Date.parse(b.sunriseUtc);
   assert.ok(Math.abs(from-target)<=2000,
    'Independent Swiss local sunrise must agree within 2 seconds '+observer.timeZone+' '+b.date);
   assert.ok(Math.abs(Date.parse(a.nextSunriseUtc)-Date.parse(b.nextSunriseUtc))<=2000,
    'Independent Swiss next sunrise disagreement '+b.date);
   assert.equal(a.sunrise.vara.number,b.vara,'Incorrect weekday at selected local sunrise');
   assert.equal(a.sunrise.moonSign,b.moonSign,'Sidereal Moon sign at verified local sunrise');
   // Cross-library timing convention: JHora8 historical vs modern Swiss 2.10.
   // Both are real SWIEPH positions, and angular mismatch must remain <=2".
   const sun=nativePlanet(target,'Sun').longitude,moon=nativePlanet(target,'Moon').longitude;
   assert.ok(angle(sun,b.sunLongitude)<1,'Independent same-epoch Sun angular mismatch '+b.date);
   assert.ok(angle(moon,b.moonLongitude)<1,'Independent same-epoch Moon angular mismatch '+b.date);
   // The uncorrected modern-Swiss Moon has a measurably DIFFERENT epoch.
   // It is NOT an argument to relax the <=1" same-profile acceptance.
   assert.ok(angle(b.moonLongitude,b.modernMoonLongitude)>1,
    'Historical JHora8 / modern Swiss Moon difference should remain observable '+b.date);
   if(b.safelyAwayFromAngaBoundary){
    assert.equal(a.sunrise.tithi.number,b.tithi,'Tithi: '+b.date);
    assert.equal(a.sunrise.nakshatra.number,b.nakshatra,'Nakshatra: '+b.date);
    assert.equal(a.sunrise.yoga.number,b.yoga,'Yoga: '+b.date);
    assert.equal(a.sunrise.karana.slot,b.karana,'Karana: '+b.date);
    stable++;
   }
   checked++;
  }
 }
 assert.equal(checked,28);
 assert.ok(stable>=24,'Too many source-boundary ambiguous sunrise samples');
});
