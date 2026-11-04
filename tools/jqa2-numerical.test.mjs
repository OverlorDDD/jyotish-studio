/**
 * JQA-2 broad deterministic + real Swiss-ephemeris stress suite.
 * IMPORTANT: 24 newly calculated charts are NOT independent JHora fixtures.
 * Only the pinned JHoraKit export supplies JHora-recorded data.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {calculateChart,divisionalLongitude,graha,localToUTC,nakshatraOf,signIndex,vimshottari,DASHA_YEAR_DAYS} from '../packages/jyotish-core/src/index.ts';
import {d10JHoraFiveEight} from './jhora-independent-parity.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const mod=(x,n)=>((x%n)+n)%n;
const sign=longitude=>signIndex(longitude)+1;
const fixture=JSON.parse(readFileSync(resolve(root,'tests/fixtures/jhora-8-gandhi-public.json'),'utf8'));

test('historic IANA offsets preserve seconds; modern zones and DST folds/gaps stay exact',()=>{
 assert.equal(localToUTC('1900-06-01','11:34','Europe/Dublin'),'1900-06-01T11:59:21.000Z');
 assert.equal(localToUTC('1869-10-02','08:34','Asia/Kolkata'),'1869-10-02T02:40:40.000Z');
 assert.equal(localToUTC('2026-06-01','12:00','Asia/Kathmandu'),'2026-06-01T06:15:00.000Z');
 assert.equal(localToUTC('2026-10-23','13:36','Europe/Bucharest'),'2026-10-23T10:36:00.000Z');
 assert.throws(()=>localToUTC('2024-11-03','01:30','America/New_York'),/Ambiguous local time/);
 assert.throws(()=>localToUTC('2024-03-10','02:30','America/New_York'),/Nonexistent local time/);
 assert.throws(()=>localToUTC('2026-10-25','02:30','Europe/Berlin'),/Ambiguous local time/);
 assert.throws(()=>localToUTC('2026-03-29','02:30','Europe/Berlin'),/Nonexistent local time/);
 // The Gandhi JHora instant uses an EXPLICIT historical +04:39:16 offset;
 // IANA Asia/Kolkata has a different offset. Never silently substitute it.
 assert.equal(fixture.civilTime.birthUtc,'1869-10-02T02:40:44Z');
});

test('12 signs; all 108 D9, 120 D10 slices and their boundaries',()=>{
 let checks=0;
 for(let s=0;s<12;s++){
  for(const division of [9,10]){
   for(let p=0;p<division;p++){
    const start=s*30+p*30/division;
    const center=start+15/division;
    const actual=sign(divisionalLongitude(center,division));
    const expected=division===9?mod(s*9+p,12)+1:mod((s%2===0?s:s+8)+p,12)+1;
    assert.equal(actual,expected,`D${division} sign ${s+1}, slice ${p+1}`);
    assert.equal(sign(divisionalLongitude(start+0.000001,division)),expected);
    checks+=2;
   }
  }
 }
 assert.equal(checks,456);
 for(let n=0;n<27;n++)for(let pada=0;pada<4;pada++){
  const longitude=(n+pada/4+0.125/4)*(360/27);
  const nak=nakshatraOf(longitude);
  assert.equal(nak.index,n);
  assert.equal(nak.pada,pada+1);
 }
 assert.equal(graha('Saturn',310,300,-0.01).retrograde,true);
 assert.equal(graha('Jupiter',310,300,0.01).retrograde,false);
});

test('independent recorded JHora longitudes replay to exact D9 and its own D10 5-8 variant',()=>{
 let n9=0,n10=0;
 for(const [name,p] of Object.entries(fixture.expected.positions)){
  const a=sign(divisionalLongitude(p.longitude,9));
  const b=d10JHoraFiveEight(p.longitude);
  assert.equal(a,p.d9,`JHora-reported D9 ${name}`);
  assert.equal(b,p.d10_5_8,`JHora-reported D10 5-8 ${name}`);
  n9++;n10++;
 }
 assert.equal(n9,10);assert.equal(n10,10);
 // A replay with identical INPUT longitudes checks the varga rule;
 // it does not prove identical Swiss/JHora astronomical longitudes.
});

test('24 Swiss-calculated cross-century natal charts: physical and temporal invariants',()=>{
 const cmd=process.env.PYTHON_BIN||(process.platform==='win32'?'py':'python3');
 const script=resolve(root,'tools/swiss_ephemeris.py');
 let checked=0;
 for(let i=0;i<24;i++){
  const birth={
   date:`${1869+i*6}-${String(i%12+1).padStart(2,'0')}-${String(i%24+1).padStart(2,'0')}`,
   time:`${String(i*7%24).padStart(2,'0')}:${String(i*11%60).padStart(2,'0')}`,
   timeZone:'Etc/UTC',latitude:-50+(i*23)%100,longitude:-175+(i*59)%350
  };
  const utc=localToUTC(birth.date,birth.time,birth.timeZone);
  const response=spawnSync(cmd,[...(cmd==='py'?['-3']:[]),script],{
   cwd:root,input:JSON.stringify({utc,latitude:birth.latitude,longitude:birth.longitude}),
   encoding:'utf8',timeout:12000,maxBuffer:200000
  });
  assert.equal(response.status,0,`pyswisseph case ${i}: ${response.stderr||response.error?.message||''}`);
  const eph=JSON.parse(response.stdout);
  const chart=calculateChart(birth,eph);
  assert.equal(chart.utc,utc);
  assert.equal(chart.d1.length,9);
  assert.equal(chart.d9.length,9);
  assert.equal(chart.d10.length,9);
  assert.ok(chart.ayanamsa>=0&&chart.ayanamsa<360);
  assert.ok(Number.isFinite(eph.julianDay));
  for(let j=0;j<9;j++){
   const body=chart.d1[j],nav=chart.d9[j],das=chart.d10[j];
   assert.ok(body.longitude>=0&&body.longitude<360);
   assert.equal(body.sign,sign(body.longitude));
   assert.equal(body.house,mod(body.sign-chart.ascendant.sign,12)+1);
   assert.equal(nav.sign,sign(divisionalLongitude(body.longitude,9)));
   assert.equal(das.sign,sign(divisionalLongitude(body.longitude,10)));
   const nak=nakshatraOf(body.longitude);
   assert.equal(body.nakshatra,nak.name);
   assert.equal(body.pada,nak.pada);
   assert.equal(body.retrograde,(body.name==='Ketu'?eph.positions.find(p=>p.name==='Ketu').speed:eph.positions.find(p=>p.name===body.name).speed)<0);
  }
  const rahu=chart.d1.find(x=>x.name==='Rahu'),ketu=chart.d1.find(x=>x.name==='Ketu');
  assert.ok(Math.abs(mod(rahu.longitude+180,360)-ketu.longitude)<1e-8);
  assert.equal(chart.dasha.length,9);
  const birthTime=Date.parse(utc);
  assert.ok(Date.parse(chart.dasha[0].start)<=birthTime&&Date.parse(chart.dasha[0].end)>birthTime);
  for(let j=0;j<9;j++){
   const md=chart.dasha[j],subs=md.antardashas;
   assert.equal(subs.length,9);
   assert.equal(subs[0].start,md.start);
   assert.equal(subs[8].end,md.end);
   for(let k=1;k<9;k++)assert.equal(subs[k-1].end,subs[k].start);
   if(j>0)assert.equal(chart.dasha[j-1].end,md.start);
  }
  checked++;
 }
 assert.equal(checked,24);
 console.log('JQA2: 24 Swiss-calculated stress charts checked; 1 genuinely independent JHora chart is tracked separately.');
});

test('one complete Vimshottari cycle uses agreed 365.2425-day convention',()=>{
 assert.equal(DASHA_YEAR_DAYS,365.2425);
 const periods=vimshottari(15.123456,'1996-03-27T10:58:00.000Z');
 assert.equal(periods.length,9);
 let years=0;
 for(let i=0;i<9;i++){
  const p=periods[i],subs=p.antardashas;
  const length=(Date.parse(p.end)-Date.parse(p.start))/86400000;
  years+=length/DASHA_YEAR_DAYS;
  assert.equal(subs.length,9);
  for(let j=1;j<subs.length;j++)assert.equal(subs[j-1].end,subs[j].start);
 }
 assert.ok(years>119.999999&&years<120.000001);
});
