import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCorpus,verifyReference} from './jqa3-corpus.mjs';
import {vimshottari,localToUTC} from '../packages/jyotish-core/src/index.ts';

const LORDS=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
const YEARS=[7,20,6,10,7,18,16,19,17];
const DAY=86400000;
const EPSILON=2; // millisecond rounding only, never a JHora date tolerance

test('all original JHora year-mode references remain UNATTESTED (not a calendar certificate)',()=>{
 const corpus=loadCorpus();
 const originals=corpus.records.filter(r=>r.hasOriginalJHoraIni);
 assert.equal(originals.length,20);
 for(const row of originals){
  const record=verifyReference(row);
  assert.equal(record.independentSource.capture.profile.dashaYearVerified,false,row.id);
  assert.equal(record.independentSource.capture.iniSettings.YearDefinition,'74 3',row.id);
  assert.equal(record.expected.vimshottari.length,9,row.id);
  for(const p of record.expected.vimshottari){
   assert.match(p.start,/^\d{4}-\d{2}-\d{2}$/);
   assert.equal(Object.keys(p.antardashas).length,9);
  }
 }
});

test('production Vimshottari has 120-year exact internal UTC sequence with no gaps',()=>{
 const records=loadCorpus().records.filter(r=>r.hasOriginalJHoraIni);
 for(const r of records){
  const ref=verifyReference(r),moon=ref.expected.positions.Moon.longitude;
  const periods=vimshottari(moon,ref.civilTime.birthUtc);
  assert.equal(periods.length,9);
  const birth=Date.parse(ref.civilTime.birthUtc);
  assert.ok(Date.parse(periods[0].start)<=birth&&birth<Date.parse(periods[0].end));
  for(let i=0;i<9;i++){
   const p=periods[i],start=Date.parse(p.start),end=Date.parse(p.end);
   assert.ok(end>start,r.id+'/'+p.lord);
   assert.equal(p.antardashas?.length,9);
   assert.equal(Date.parse(p.antardashas[0].start),start);
   assert.equal(Date.parse(p.antardashas[8].end),end);
   if(i<8)assert.equal(p.end,periods[i+1].start);
   const lordIndex=LORDS.indexOf(p.lord);
   assert.equal(p.antardashas[0].lord,p.lord);
   assert.ok(Math.abs((end-start)/DAY-YEARS[lordIndex]*365.2425)<0.000001);
   for(let k=0;k<9;k++){
    const sub=p.antardashas[k],a=Date.parse(sub.start),b=Date.parse(sub.end);
    assert.equal(sub.lord,LORDS[(lordIndex+k)%9]);
    assert.ok(b>a);
    if(k<8)assert.equal(sub.end,p.antardashas[k+1].start);
    if(k<8){
     const duration=YEARS[lordIndex]*YEARS[(lordIndex+k)%9]/120*365.2425;
     assert.ok(Math.abs((b-a)/DAY-duration)<=EPSILON/DAY,r.id+' '+p.lord+'/'+sub.lord);
    }
   }
  }
 }
});

test('calendar day labeling must be distinguished from exact UTC transition instants and DST',()=>{
 const examples=[
  ['2024-03-10T06:59:00Z','01:59'],
  ['2024-03-10T07:01:00Z','03:01']
 ];
 const format=new Intl.DateTimeFormat('en-GB',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 for(const [utc,local] of examples)assert.equal(format.format(new Date(utc)),local);
 assert.throws(()=>localToUTC('2024-03-10','02:30','America/New_York'),/Nonexistent|Ambiguous|DST|time/i);
 assert.throws(()=>localToUTC('2024-11-03','01:30','America/New_York'),/Nonexistent|Ambiguous|DST|time/i);
});
