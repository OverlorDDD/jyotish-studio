import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculateVerifiedEventLagna} from '../apps/api/src/panchanga-event-lagna.ts';
import {createVerifiedSiderealPlanetAt,calculatePanchangaDay}
 from '../apps/api/src/panchanga.ts';
import {p38Activity} from '../apps/web/lib/panchanga-p38-decision.ts';
import {validateP387Finder} from '../apps/web/lib/panchanga-p387-unified.ts';

const fixture=JSON.parse(readFileSync(new URL('../tests/fixtures/p388-independent-qa-samples.json',import.meta.url),'utf8'));
const oraclePath=fileURLToPath(new URL('./panchanga-p388-independent-oracle.py',import.meta.url));
const python=process.env.PYTHON_BIN||(process.platform==='win32'?'py':'python3');
const pythonArgs=[...(python==='py'?['-3']:[]),oraclePath];
const arcsec=(a,b)=>Math.abs(((a-b+540)%360)-180)*3600;
const ms=iso=>Date.parse(iso);
const names=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
let oracle;
test('P388 independent PySwissEph reference requires bundled Swiss files and returns 30/10 actual observations',()=>{
 assert.equal(fixture.version,'p388-independent-reference-samples-v1');
 assert.equal(fixture.events.length,30);
 assert.equal(fixture.sunrises.length,10);
 const run=spawnSync(python,pythonArgs,{input:JSON.stringify(fixture),encoding:'utf8',
  timeout:150000,maxBuffer:3*1024*1024});
 assert.equal(run.status,0,run.stderr||run.error?.message||'Cannot run independent Swiss oracle');
 oracle=JSON.parse(run.stdout);
 assert.equal(oracle.oracle,'PYSWISSEPH_2_10_03_OFFICIAL_SWIEPH');
 assert.equal(oracle.events.length,30);assert.equal(oracle.sunrises.length,10);
 for(const name of ['sepl_18.se1','semo_18.se1'])
  assert.match(oracle.epheSha256[name],/^[0-9a-f]{64}$/,'must hash actual official ephemerides');
});
test('P388 event ascendant (tropical + mean Lahiri), IANA local time and seven planets cross-checked for all 30 geography/DST vectors',async()=>{
 assert.ok(oracle,'Independent reference setup must pass before checking Node');
 const at=await createVerifiedSiderealPlanetAt();
 for(const c of oracle.events){
  const input={atUtc:c.atUtc,latitude:c.latitude,longitude:c.longitude,timeZone:c.timeZone};
  const real=await calculateVerifiedEventLagna(input);
  assert.ok(Math.abs(real.julianDayUt-c.julianDayUt)<2e-8,c.atUtc+' UTC Julian day');
  for(const name of ['tropicalAscendantDegrees','ayanamsaDegrees','siderealAscendantDegrees'])
   assert.ok(arcsec(real[name],c[name])<=1,
    c.atUtc+' '+c.timeZone+' '+name+' independent arcseconds error '+arcsec(real[name],c[name]));
  assert.equal(real.lagnaSign,c.lagnaSign,c.atUtc+' source-based Lagna');
  assert.equal(real.localDate,c.localDate,c.atUtc+' local date');
  assert.equal(real.localTime,c.localTime,c.atUtc+' local clock/DST fold');
  const instant=ms(c.atUtc);
  for(const name of names){
   const actual=at(instant,name),expected=c.planets[name];
   assert.ok(arcsec(actual.longitude,expected.longitude)<=1,
    c.atUtc+' '+name+' sidereal longitude mismatch '+arcsec(actual.longitude,expected.longitude)+' arcsec');
   assert.ok(Math.abs(actual.longitudeSpeed-expected.speed)<0.0005,
    c.atUtc+' '+name+' longitude speed mismatch');
   assert.equal(Math.floor(actual.longitude/30)+1,Math.floor(expected.longitude/30)+1,
    c.atUtc+' '+name+' zodiac sign');
  }
 }
});
test('P388 actual Swiss local sunrise, sunset and five angas match independent Python for 10 observers/DST dates', {timeout:180000},async()=>{
 assert.ok(oracle,'Independent reference setup must pass');
 for(const c of oracle.sunrises){
  const actual=await calculatePanchangaDay({date:c.localDay,timeZone:c.timeZone,
   latitude:c.latitude,longitude:c.longitude});
  for(const k of ['sunriseUtc','sunsetUtc','nextSunriseUtc'])
   assert.ok(Math.abs(ms(actual[k])-ms(c[k]))<=1000,
    c.timeZone+' '+c.localDay+' '+k+' '+actual[k]+' vs '+c[k]);
  const five=c.fiveAngas;
  for(const [got,want,label] of [
   [actual.sunrise.tithi.number,five.tithi,'Tithi'],
   [actual.sunrise.nakshatra.number,five.nakshatra,'Nakshatra'],
   [actual.sunrise.vara.number,five.vara,'Vara'],
   [actual.sunrise.yoga.number,five.yoga,'Nitya Yoga'],
   [actual.sunrise.karana.slot,five.karana,'Karana'],
   [actual.sunrise.moonSign,five.moonSign,'Moon Rashi']
  ])assert.equal(got,want,c.timeZone+' '+c.localDay+' '+label);
  assert.equal(actual.location.timeZone,c.timeZone);
  assert.ok(actual.astronomyProfile.includes('SWIEPH'));
 }
});
test('P388 source-coverage safety: wedding/foundation are never a certified candidate, unknown is not a bad day',()=>{
 const wedding=p38Activity('wedding'),foundation=p38Activity('foundation');
 assert.equal(wedding.method,'special_election');
 assert.equal(foundation.method,'special_election');
 for(const activityId of ['wedding','foundation']){
  const c=fixture.events[0];
  const date=c.atUtc.slice(0,10),point={date,
   timeZone:c.timeZone,latitude:String(c.latitude),longitude:String(c.longitude)};
  const t=ms(c.atUtc);
  const review={startUtc:new Date(t+30000).toISOString(),
   sampleUtc:new Date(t+30000).toISOString(),endUtc:new Date(t+3600000).toISOString(),
   sunriseDate:date,status:'requires_review',reasonIds:['SPECIAL_ELECTION_RULE_COVERAGE_INCOMPLETE']};
  const report={version:'p385-time-finder-v1',activityId,
   scope:'OWNER_NATAL_AND_EVENT_CITY_SAME_VERIFIED_UTC',observer:{
    timeZone:c.timeZone,latitude:c.latitude,longitude:c.longitude},
   complete:true,selectionPolicy:'FIRST_CANDIDATE_AND_REVIEW_PER_LOCAL_SUNRISE_DAY',
   daysRequested:7,startUtc:c.atUtc,searchThroughUtc:new Date(t+7*86400000).toISOString(),
   candidate:null,review,status:'review_only',windows:[review]};
  assert.equal(validateP387Finder(report,point,activityId).status,'review_only');
  const falseCertification={...report,status:'candidate_found',candidate:{...review,status:'candidate'},
   windows:[{...review,status:'candidate'}],review:null};
  assert.throws(()=>validateP387Finder(falseCertification,point,activityId),
   /mismatch|certification|source/);
 }
});
