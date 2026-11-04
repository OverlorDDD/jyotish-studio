import test from 'node:test';
import assert from 'node:assert/strict';
import {findAstronomicalEvents,ASTRONOMICAL_EVENTS_VERSION} from '../packages/jyotish-core/src/astronomical-events.ts';
const origin=Date.parse('2026-01-01T00:00:00Z'),H=3600000,normalize=x=>((x%360)+360)%360;
const sampler=(ms,body)=>{
 const h=(ms-origin)/H;
 const fixed={Venus:45,Jupiter:100,Saturn:205};
 if(body==='Sun')return {longitude:normalize(0.1+0.01*h),longitudeSpeed:.24};
 if(body==='Moon')return {longitude:normalize(80+1.0*h),longitudeSpeed:24};
 if(body==='Mars')return {longitude:normalize(29+0.2*h),longitudeSpeed:4.8};
 if(body==='Mercury')return {longitude:normalize(29+2*Math.sin(h*Math.PI/24)),
  longitudeSpeed:2*Math.PI/24*24*Math.cos(h*Math.PI/24)};
 return {longitude:fixed[body],longitudeSpeed:0.0001};
};
test('AE-P5 phase solver locates geocentric quarters to <=one second',()=>{
 const events=findAstronomicalEvents(origin,origin+10*24*H,sampler);
 const first=events.find(e=>e.kind==='first_quarter');
 const full=events.find(e=>e.kind==='full_moon');
 const last=events.find(e=>e.kind==='last_quarter');
 assert.ok(first&&full&&last);
 const expectedFirst=(90-79.9)/0.99;
 assert.ok(Math.abs(Date.parse(first.atUtc)-(origin+expectedFirst*H))<=1000);
 assert.ok(Math.abs(Date.parse(full.atUtc)-(origin+(180-79.9)/.99*H))<=1000);
 assert.ok(Math.abs(Date.parse(last.atUtc)-(origin+(270-79.9)/.99*H))<=1000);
 assert.equal(ASTRONOMICAL_EVENTS_VERSION,'astronomical-events-v1');
});
test('sign ingress and retrograde station can occur repeatedly, with direct/retrograde direction',()=>{
 const events=findAstronomicalEvents(origin,origin+2*24*H,sampler);
 const mars=events.find(e=>e.body==='Mars'&&e.kind==='sidereal_ingress');
 assert.ok(mars);assert.equal(mars.fromSign,1);assert.equal(mars.toSign,2);
 assert.equal(mars.motion,'direct');
 assert.ok(Math.abs(Date.parse(mars.atUtc)-(origin+5*H))<=1000);
 const mercury=events.filter(e=>e.body==='Mercury');
 assert.ok(mercury.some(e=>e.kind==='sidereal_ingress'&&e.motion==='direct'));
 assert.ok(mercury.some(e=>e.kind==='sidereal_ingress'&&e.motion==='retrograde'));
 const stationRx=mercury.find(e=>e.kind==='retrograde_station');
 const stationDirect=mercury.find(e=>e.kind==='direct_station');
 assert.ok(stationRx&&stationDirect);
 assert.ok(Math.abs(Date.parse(stationRx.atUtc)-(origin+12*H))<=1000);
 assert.ok(Math.abs(Date.parse(stationDirect.atUtc)-(origin+36*H))<=1000);
});
test('local-day contiguous windows are half-open and produce sorted nonduplicated UTC events',()=>{
 const a=findAstronomicalEvents(origin,origin+24*H,sampler);
 const b=findAstronomicalEvents(origin+24*H,origin+48*H,sampler);
 const joined=[...a,...b].sort((x,y)=>x.atUtc.localeCompare(y.atUtc)||x.kind.localeCompare(y.kind)||
  String(x.body||'').localeCompare(String(y.body||'')));
 const combined=findAstronomicalEvents(origin,origin+48*H,sampler);
 assert.deepEqual(joined,combined);
 assert.ok(combined.every((e,i)=>i===0||e.atUtc>=combined[i-1].atUtc));
 assert.equal(new Set(combined.map(e=>e.atUtc+e.kind+e.body)).size,combined.length);
});
test('phase wrap at 360 degrees gives new moon and avoids angular discontinuity errors',()=>{
 const at=(ms,body)=>{
  const h=(ms-origin)/H;
  if(body==='Sun')return {longitude:359.5,longitudeSpeed:0.1};
  if(body==='Moon')return {longitude:normalize(358+h),longitudeSpeed:24};
  return {longitude:150,longitudeSpeed:.01};
 };
 const e=findAstronomicalEvents(origin,origin+5*H,at);
 const moon=e.find(x=>x.kind==='new_moon');
 assert.ok(moon);
 assert.ok(Math.abs(Date.parse(moon.atUtc)-(origin+1.5*H))<=1000);
});
test('AE-P5 fails closed on impossible windows and corrupt/NaN Swiss outputs',()=>{
 assert.throws(()=>findAstronomicalEvents(origin,origin,sampler),/window/);
 assert.throws(()=>findAstronomicalEvents(origin,origin+32*24*H,sampler),/window/);
 assert.throws(()=>findAstronomicalEvents(origin,origin+H,()=>({longitude:NaN,longitudeSpeed:1})),/Verified/);
});
