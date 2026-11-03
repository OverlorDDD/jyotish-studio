import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateVerifiedEventLagna,validateEventLagnaInput,EVENT_LAGNA_PROFILE}
 from '../apps/api/src/panchanga-event-lagna.ts';
import {getEphemeris} from '../apps/api/src/ephemeris.ts';
import {calculateRamanPanchaka} from '../apps/web/lib/panchanga-p38-panchaka.ts';

const fixture=JSON.parse(readFileSync(new URL('../tests/fixtures/p384-pyswisseph-event-lagna.json',import.meta.url),'utf8'));
const angularArcsec=(a,b)=>Math.abs(((a-b+540)%360)-180)*3600;
const first=fixture.cases[0];
test('P3.8.4 8 pinned independent PySwissEph ascendants agree within 1 arcsecond over 4 continents and Ukrainian DST',async()=>{
 assert.match(fixture.source,/PySwissEph/);
 for(const c of fixture.cases){
  const got=await calculateVerifiedEventLagna({
   atUtc:c.atUtc,latitude:c.latitude,longitude:c.longitude,timeZone:c.timeZone});
  assert.equal(got.status,'available');
  assert.equal(got.profile,EVENT_LAGNA_PROFILE);
  assert.equal(got.provenance,'NATIVE_SWISS_TROPICAL_ASC_MINUS_VERIFIED_MEAN_LAHIRI');
  assert.ok(Math.abs(got.julianDayUt-c.julianDayUt)<2e-8,c.atUtc+' Julian day');
  for(const [name,key] of [
   ['tropicalAscendantDegrees','tropicalAscendantDegrees'],
   ['siderealAscendantDegrees','siderealAscendantDegrees'],
   ['ayanamsaDegrees','meanLahiriDegrees']
  ]){
   assert.ok(angularArcsec(got[name],c[key])<=fixture.toleranceArcseconds,
    c.atUtc+' '+name+' '+got[name]+' vs '+c[key]);
  }
  assert.equal(got.lagnaSign,c.lagnaSign,c.atUtc+' Lagna sign');
  assert.equal(got.panchakaLagnaNumber,c.lagnaSign);
  assert.equal(got.localDate,c.localDate);
  assert.equal(got.localTime,c.localTime);
  assert.ok(got.eventNavamsaSign>=1&&got.eventNavamsaSign<=12);
  assert.ok(got.distanceToSignBoundaryArcseconds>1);
 }
});
test('P3.8.4 same instant but different event city MUST produce different Lagna, even for the SAME natal chart',async()=>{
 const a=await calculateVerifiedEventLagna({
  atUtc:first.atUtc,latitude:first.latitude,longitude:first.longitude,timeZone:first.timeZone});
 const india=fixture.cases[1],b=await calculateVerifiedEventLagna({
  atUtc:india.atUtc,latitude:india.latitude,longitude:india.longitude,timeZone:india.timeZone});
 assert.equal(a.lagnaSign,9);
 assert.equal(b.lagnaSign,11);
 assert.ok(Math.abs(a.siderealAscendantDegrees-b.siderealAscendantDegrees)>60);
 // Different event Lagna can change classical Panchaka outcome independently
 // of natal Lagna or the guest's saved home location.
 const fixed={tithiNumber:13,varaNumber:1,nakshatraNumber:9};
 const left=calculateRamanPanchaka({...fixed,electionLagnaSign:a.lagnaSign},'home_building');
 const right=calculateRamanPanchaka({...fixed,electionLagnaSign:b.lagnaSign},'home_building');
 assert.notEqual(left.remainder,right.remainder);
});
test('P3.8.4 Ukraine DST spring-forward never guesses a nonexistent 03:30 local time',async()=>{
 const before=fixture.cases[4],after=fixture.cases[5];
 const x=await calculateVerifiedEventLagna({
  atUtc:before.atUtc,latitude:before.latitude,longitude:before.longitude,timeZone:before.timeZone});
 const y=await calculateVerifiedEventLagna({
  atUtc:after.atUtc,latitude:after.latitude,longitude:after.longitude,timeZone:after.timeZone});
 assert.equal(x.localTime,'02:30:00');assert.equal(y.localTime,'04:30:00');
 assert.equal(Date.parse(y.eventAtUtc)-Date.parse(x.eventAtUtc),3600000);
 assert.notEqual(x.lagnaSign,y.lagnaSign);
});
test('P3.8.4 native Swiss event Lagna matches owner-natal JQA3 backend on identical UTC/location < 1 arcsecond',async()=>{
 for(const c of [fixture.cases[0],fixture.cases[2],fixture.cases[3]]){
  const d=new Date(c.atUtc),date=c.atUtc.slice(0,10);
  const time=d.toISOString().slice(11,16);
  const ev=await calculateVerifiedEventLagna({
   atUtc:c.atUtc,latitude:c.latitude,longitude:c.longitude,timeZone:c.timeZone});
  const natal=await getEphemeris({date,time,timeZone:'Etc/UTC',
   latitude:c.latitude,longitude:c.longitude});
  assert.match(natal.backend,/swisseph\/node/);
  assert.ok(angularArcsec(ev.siderealAscendantDegrees,natal.ascendant)<1,
   'Same Swiss mean Lahiri convention, independent of event/natal input label');
 }
});
test('P3.8.4 malformed/ambiguous input, polar Placidus, and unverified date range fail closed',()=>{
 const obj={atUtc:first.atUtc,latitude:50,longitude:30,timeZone:'Europe/Kyiv'};
 assert.ok(Number.isFinite(validateEventLagnaInput(obj)));
 for(const bad of [
  {...obj,atUtc:'2026-11-03T11:00:00+02:00'},
  {...obj,atUtc:'2026-11-03T11:00:00'},
  {...obj,atUtc:'2026-11-03T09:00:00.1Z'},
  {...obj,atUtc:'2026-11-31T09:00:00Z'},
  {...obj,atUtc:'2100-01-01T09:00:00Z'},
  {...obj,latitude:66.5},{...obj,latitude:NaN},{...obj,longitude:181},
  {...obj,timeZone:'Europe/NoCity'}, {...obj,timeZone:'Kyiv'}
 ])assert.throws(()=>validateEventLagnaInput(bad));
});
