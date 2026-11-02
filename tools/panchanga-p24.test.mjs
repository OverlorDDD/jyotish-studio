import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyIntegratedOverview,chooseInitialDay,dateIsSupported} from '../apps/web/lib/panchanga-integration.ts';
const point={date:'2026-11-02',timeZone:'Europe/Kyiv',latitude:'50.4501',longitude:'30.5234'};
const sunrise={tithi:{number:12},nakshatra:{number:3},vara:{name:'Somavara'},
 yoga:{number:5},karana:{slot:23}};
const exact={date:point.date,location:{timeZone:point.timeZone,latitude:50.4501,longitude:30.5234},
 sunriseUtc:'2026-11-02T05:00:00.000Z',sunsetUtc:'2026-11-02T14:00:00.000Z',sunrise};
const overview={monthSystem:'amanta',observer:{timeZone:point.timeZone,latitude:50.4501,longitude:30.5234},
 astronomicalTimeCertifiedByIndependentReference:false,observanceDayCertifiedByTradition:false,
 days:[{date:point.date,sunriseUtc:exact.sunriseUtc,sunsetUtc:exact.sunsetUtc,sunriseAngas:sunrise,
 moonMonth:{name:'Kartika',lunarMonthStatus:'regular'},observances:[{
 id:'ekadashi_sunrise',date:point.date,category:'candidate',atUtc:exact.sunriseUtc,
 rule:'Sunrise indicator, not final fasting date'}]}],
 phaseEvents:[{kind:'full_moon',atUtc:'2026-11-02T21:30:00.000Z',localDate:point.date}]};
test('only identical observer and sunrise data are joined into the day experience',()=>{
 assert.equal(verifyIntegratedOverview(overview,exact,point,'amanta').phases.length,1);
 assert.throws(()=>verifyIntegratedOverview({...overview,monthSystem:'purnimanta'},exact,point,'amanta'),/mismatch/i);
 assert.throws(()=>verifyIntegratedOverview({...overview,observer:{...overview.observer,latitude:51}},exact,point,'amanta'),/mismatch/);
 assert.throws(()=>verifyIntegratedOverview({...overview,days:[{...overview.days[0],
  sunriseAngas:{...sunrise,tithi:{number:10}}}]},exact,point,'amanta'),/Mismatched sunrise anga/);
 assert.throws(()=>verifyIntegratedOverview({...overview,days:[]},exact,point,'amanta'),/Incomplete/);
});
test('festival candidates are never promoted to certified fasting dates',()=>{
 assert.throws(()=>verifyIntegratedOverview({...overview,observanceDayCertifiedByTradition:true},exact,point,'amanta'),/certification scope/);
 assert.throws(()=>verifyIntegratedOverview({...overview,days:[{...overview.days[0],observances:[{
  ...overview.days[0].observances[0],date:'2026-11-03'}]}]},exact,point,'amanta'),/festival candidate/);
});
test('phases belong to the selected observer civil date, even after UTC midnight',()=>{
 assert.throws(()=>verifyIntegratedOverview({...overview,phaseEvents:[{
  ...overview.phaseEvents[0],localDate:'2026-11-01'}]},exact,point,'amanta'),/observer-local lunar phase/);
});
test('deep-linked dates stay valid; current day uses visitor location timezone not UTC',()=>{
 assert.equal(chooseInitialDay('2026-12-31','Europe/Kyiv'),'2026-12-31');
 assert.equal(chooseInitialDay('2026-02-30','Europe/Kyiv',new Date('2026-11-02T23:30:00Z')),'2026-11-03');
 assert.equal(chooseInitialDay(null,'America/Los_Angeles',new Date('2026-11-02T02:30:00Z')),'2026-11-01');
 assert.equal(dateIsSupported('2099-12-31'),false);
});
