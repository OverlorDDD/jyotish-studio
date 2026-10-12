import test from 'node:test';
import assert from 'node:assert/strict';
import {divisionalLongitude,signIndex,nakshatraOf,vimshottari,localToUTC,calculateChart,graha} from './index.ts';
test('D9 navamsa seed signs and boundaries',()=>{
 assert.equal(signIndex(divisionalLongitude(0,9)),0); // Aries begins Aries
 assert.equal(signIndex(divisionalLongitude(30,9)),9); // Taurus begins Capricorn
 assert.equal(signIndex(divisionalLongitude(60,9)),6); // Gemini begins Libra
 assert.equal(signIndex(divisionalLongitude(90,9)),3); // Cancer begins Cancer
 assert.equal(signIndex(divisionalLongitude(33.34,9)),10); // Taurus second division Aquarius
 assert.equal(signIndex(divisionalLongitude(29.999,9)),8);
});
test('D10 odd sign starts same; even starts ninth',()=>{
 assert.equal(signIndex(divisionalLongitude(0,10)),0);
 assert.equal(signIndex(divisionalLongitude(30,10)),9);
 assert.equal(signIndex(divisionalLongitude(60,10)),2);
 assert.equal(signIndex(divisionalLongitude(33,10)),10);
});
test('nakshatra boundaries / padas',()=>{
 assert.equal(nakshatraOf(0).name,'Ashwini');
 assert.equal(nakshatraOf(0).pada,1);
 assert.equal(nakshatraOf(3.34).pada,2);
 assert.equal(nakshatraOf(359.999).name,'Revati');
});
test('pre-DST Europe/Kyiv civil time uses UTC+2',()=>{
 assert.equal(localToUTC('2001-03-21','12:30','Europe/Kyiv'),'2001-03-21T10:30:00.000Z');
});
test('reject DST gap and ambiguous hour',()=>{
 assert.throws(()=>localToUTC('2026-03-29','03:30','Europe/Kyiv'),/Nonexistent/);
 assert.throws(()=>localToUTC('2026-10-25','03:30','Europe/Kyiv'),/Ambiguous/);
});
test('120 year dasha cycle and nested subdivisions',()=>{
 const ds=vimshottari(0,'2000-01-01T00:00:00Z');
 assert.equal(ds.length,9);assert.equal(ds[0].lord,'Ketu');
 assert.equal(ds[0].antardashas?.length,9);
 assert.equal(ds[0].antardashas?.[8].end,ds[0].end);
 const duration=(Date.parse(ds[8].end)-Date.parse(ds[0].start))/86400000;
 assert.ok(Math.abs(duration-120*365.2425)<0.00001);
});
test('whole-sign house wrap',()=>{
 assert.equal(graha('Sun',0,330).house,2);
 assert.equal(graha('Moon',330,330).house,1);
});
test('compose D1 D9 D10 with normalized ephemeris',()=>{
 const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
 const input={date:'2000-01-01',time:'12:00',timeZone:'Europe/Kyiv',latitude:48,longitude:33};
 const chart=calculateChart(input,{ayanamsa:23.8,ascendant:170,julianDay:2451545,backend:'test',positions:names.map((name,i)=>({name,longitude:i*35,speed:1}))});
 assert.equal(chart.d1.length,9);assert.equal(chart.d9.length,9);assert.equal(chart.d10.length,9);
 assert.equal(chart.ascendant.signName,'Virgo');
 assert.equal(chart.lagnaD9.house,1);assert.equal(chart.lagnaD10.house,1);
});

test('divisional maps remain in 0..360 and repeat after a full circle',()=>{
 for(let sign=0;sign<12;sign++)for(const div of [9,10] as const)for(let i=0;i<div;i++){
  const lon=sign*30+(i+0.5)*30/div;const next=divisionalLongitude(lon,div);
  assert.ok(next>=0&&next<360);
  assert.ok(Math.abs(next-divisionalLongitude(lon+360,div))<1e-9);
 }
});

test('all 27 nakshatras map to the documented first Vimshottari lord',()=>{
 for(let i=0;i<27;i++){
  const lon=(i+0.375)*360/27;
  const ds=vimshottari(lon,'2004-01-01T00:00:00.000Z');
  assert.equal(ds[0].lord,['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'][i%9]);
  assert.equal(ds[0].antardashas?.[0].lord,ds[0].lord);
 }
});
test('birth occurs within the initial Mahadasha, and 9 Antardasha periods connect with no gaps',()=>{
 const birth='2004-01-01T00:00:00Z';const ds=vimshottari(109.375,birth);
 assert.ok(Date.parse(ds[0].start)<=Date.parse(birth));
 assert.ok(Date.parse(ds[0].end)>Date.parse(birth));
 for(let i=0;i<ds.length;i++){
  const subs=ds[i].antardashas!;
  assert.equal(subs[0].start,ds[i].start);
  assert.equal(subs[8].end,ds[i].end);
  if(i>0)assert.equal(ds[i-1].end,ds[i].start);
  for(let j=1;j<subs.length;j++)assert.equal(subs[j-1].end,subs[j].start);
 }
});
test('reference odd-even Dashamsa and Navamsa examples',()=>{
 // Published Parashari D10 examples: 10° Gemini -> Virgo, 19° Scorpio -> Capricorn.
 assert.equal(signIndex(divisionalLongitude(70,10)),5);
 assert.equal(signIndex(divisionalLongitude(229,10)),9);
 // D9 of 10° Aries begins in Cancer (fourth navamsa).
 assert.equal(signIndex(divisionalLongitude(10,9)),3);
});
test('no shared input may place Rahu and Ketu in the same sign through 180° nodes',()=>{
 for(let lon=0;lon<360;lon+=0.1){
  const rahu=graha('Rahu',lon,123),ketu=graha('Ketu',lon+180,123);
  assert.equal((rahu.sign-1+6)%12,ketu.sign-1);
  assert.ok(Math.abs(((ketu.longitude-rahu.longitude+360)%360)-180)<1e-6);
 }
});
test('reject impossible dates and invalid geographic coordinates',()=>{
 assert.throws(()=>localToUTC('2025-02-29','10:00','Europe/Kyiv'),/Invalid/);
 assert.throws(()=>localToUTC('2025-03-01','25:00','Europe/Kyiv'),/Invalid/);
 assert.throws(()=>localToUTC('2025-03-01','10:00','Invalid/Unknown'),/time zone/);
 assert.throws(()=>calculateChart({date:'2004-01-01',time:'12:00',timeZone:'UTC',latitude:98,longitude:34},{ayanamsa:24,ascendant:160,julianDay:2453000,backend:'test',positions:[]}),/Latitude/);
});
