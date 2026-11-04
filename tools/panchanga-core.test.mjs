import test from 'node:test';
import assert from 'node:assert/strict';
import {fiveAngas,karanaName,findAngaBoundary,buildPanchangaSunrise,angaIndex} from '../packages/jyotish-core/src/panchanga.ts';
const hour=3600000,base=Date.parse('2000-01-01T00:00:00Z');
const at=(ms)=>({sun:0,moon:((ms-base)/hour%360+360)%360});
test('all five angas use correct traditional fixed/movable karana and degree boundaries',()=>{
 assert.equal(karanaName(0),'Kimstughna');
 assert.equal(karanaName(1),'Bava');
 assert.equal(karanaName(7),'Vishti');
 assert.equal(karanaName(8),'Bava');
 assert.equal(karanaName(56),'Vishti');
 assert.equal(karanaName(57),'Shakuni');
 assert.equal(karanaName(58),'Chatushpada');
 assert.equal(karanaName(59),'Naga');
 const first=fiveAngas({sun:0,moon:0},0);
 assert.equal(first.tithi.number,1);
 assert.equal(first.tithi.paksha,'Shukla');
 assert.equal(first.nakshatra.name,'Ashwini');
 assert.equal(first.nakshatra.pada,1);
 assert.equal(first.yoga.name,'Vishkumbha');
 assert.equal(first.karana.name,'Kimstughna');
 assert.equal(first.vara.name,'Ravivara');
 assert.equal(fiveAngas({sun:90,moon:270},3).tithi.number,16);
 assert.equal(fiveAngas({sun:90,moon:270},3).tithi.paksha,'Krishna');
 assert.equal(angaIndex('tithi',{sun:359,moon:1}),0);
 assert.equal(angaIndex('yoga',{sun:359,moon:1}),0);
});
test('transition solver searches fresh positions with UTC precision better than one second',()=>{
 const start=base+10*hour;
 for(const [kind,targetHour] of [['tithi',12],['karana',12],['nakshatra',360/27],['yoga',360/27]]){
  const next=Date.parse(findAngaBoundary(start,kind,at,1));
  assert.ok(Math.abs(next-(base+targetHour*hour))<=1000,kind+': '+next);
 }
 const previous=Date.parse(findAngaBoundary(base+10*hour,'tithi',at,-1));
 assert.ok(Math.abs(previous-base)<=1000);
});
test('sunrise snapshot keeps weekday and lists all transitions until NEXT local sunrise',()=>{
 const result=buildPanchangaSunrise('2000-01-01',
  new Date(base+3*hour).toISOString(),new Date(base+27*hour).toISOString(),at);
 assert.equal(result.sunrise.vara.name,'Shanivara');
 assert.equal(result.sunrise.tithi.number,1);
 assert.ok(result.changes.filter(x=>x.kind==='karana').length>=3);
 assert.ok(result.changes.some(x=>x.kind==='tithi'&&x.nextIndex===2));
 assert.equal(result.version,'panchanga-five-anga-v1');
 assert.ok(result.changes.every(x=>Date.parse(x.atUtc)>=base+3*hour&&Date.parse(x.atUtc)<base+27*hour));
});
test('fails closed for invalid positions, missing transitions and invalid sunrise spans',()=>{
 assert.throws(()=>fiveAngas({sun:NaN,moon:1},0),/Sun\/Moon/);
 assert.throws(()=>findAngaBoundary(base,'karana',()=>({sun:20,moon:40}),1),/No karana transition/);
 assert.throws(()=>buildPanchangaSunrise('2026-02-30',new Date(base).toISOString(),new Date(base+24*hour).toISOString(),at),/date/);
 assert.throws(()=>buildPanchangaSunrise('2000-01-01',new Date(base).toISOString(),new Date(base+12*hour).toISOString(),at),/sunrise-to-sunrise/);
});
