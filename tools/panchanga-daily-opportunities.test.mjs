import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatePanchangaDay} from '../apps/api/src/panchanga.ts';
import {evaluateP38} from '../apps/web/lib/panchanga-p38-decision.ts';
import {calculateTraditionalSlots,dailyOpportunities,
 featuredOpportunities,brahmaMuhurta,abhijitWindow} from '../apps/web/lib/panchanga-opportunities.ts';

const DAY=86400000;
const EXPECTED_DAY=['Udveg','Amrit','Rog','Labh','Shubh','Char','Kaal'];
const EXPECTED_NIGHT=['Shubh','Char','Kaal','Udveg','Amrit','Rog','Labh'];
const SUN_WEEK=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
const stamp=x=>Date.parse(x);
const dateAt=(day,offset)=>new Date(Date.parse(day+'T12:00:00Z')+offset*DAY).toISOString().slice(0,10);
const data=async(date,zone='Europe/Kyiv',latitude=50.4501,longitude=30.5234)=>{
 const d=await calculatePanchangaDay({date,timeZone:zone,latitude,longitude});
 assert.match(d.astronomyProfile,/verified SWIEPH/);
 return d;
};
test('P410 all seven weekdays: exact Drik day and night starts, 8+8 / 12+12 slots, hora weekday lords',async()=>{
 for(let w=0;w<7;w++){
  const date=dateAt('2026-11-01',w); // 2026-11-01 was Sunday
  const day=await data(date);
  const {weekday,choghadiya,hora}=calculateTraditionalSlots(day);
  assert.equal(weekday,w,date);
  assert.equal(choghadiya.length,16);
  assert.equal(hora.length,24);
  assert.equal(choghadiya[0].kind,EXPECTED_DAY[w]);
  assert.equal(choghadiya[7].kind,EXPECTED_DAY[w]);
  assert.equal(choghadiya[8].kind,EXPECTED_NIGHT[w]);
  assert.equal(choghadiya[15].kind,EXPECTED_NIGHT[w]);
  assert.equal(hora[0].kind,SUN_WEEK[w]);
  assert.equal(hora[0].startUtc,day.sunriseUtc);
  assert.equal(choghadiya[0].startUtc,day.sunriseUtc);
  assert.equal(choghadiya[7].endUtc,day.sunsetUtc);
  assert.equal(choghadiya[8].startUtc,day.sunsetUtc);
  assert.equal(choghadiya[15].endUtc,day.nextSunriseUtc);
  assert.equal(hora[23].endUtc,day.nextSunriseUtc);
  for(const arr of [hora,choghadiya]){
   for(let i=1;i<arr.length;i++)
    assert.equal(stamp(arr[i-1].endUtc),stamp(arr[i].startUtc),'no gap/overlap '+date);
  }
 }
});
test('P410 real Swiss Kyiv: different deeds and intervals; no 53%, incomplete Muhurta or hard excludes',async()=>{
 const signatures=new Set(),kinds=new Set();
 let eligible=0,discarded=0;
 for(let i=0;i<7;i++){
  const day=await data(dateAt('2026-11-01',i));
  const result=dailyOpportunities(day);
  const featured=featuredOpportunities(result,3);
  assert.ok(featured.length<=3);
  assert.equal(new Set(featured.map(x=>x.kind)).size,featured.length);
  for(const r of result){
   eligible++;
   assert.equal(r.personalized,false);
   assert.equal('score' in r,false);
   assert.equal('percentage' in r,false);
   assert.ok(r.source.startsWith('https://'));
   assert.ok(!['wedding','engagement','foundation','house_entry'].includes(r.activityId));
   assert.ok(stamp(r.endUtc)-stamp(r.startUtc)>=15*60000);
   for(const key of ['rahuKalam','yamaganda','gulikaKalam']){
    const k=day.daytimeKalas[key];
    assert.ok(!(stamp(r.startUtc)<stamp(k.untilUtc)&&stamp(k.fromUtc)<stamp(r.endUtc)),
     'Do not show a green interval overlapping '+key);
   }
   if(r.activityId){
    const moment=new Date(stamp(r.startUtc)+1000).toISOString();
    const verdict=evaluateP38(day,moment,r.activityId);
    assert.ok(!verdict.observations.some(o=>o.polarity==='excludes'),r.activityId+' '+moment);
   }
   signatures.add(r.kind+'|'+r.choghadiya+'|'+r.hora);
   kinds.add(r.kind);
  }
  if(!result.length)discarded++;
 }
 assert.ok(eligible>0,'Real source must find at least one opportunity');
 assert.ok(signatures.size>=4,'Do not repeat one generic signature across a week');
 assert.ok(kinds.size>=3,'Different Choghadiya/horas should fit different activities');
 console.log('P410_REAL_OPPORTUNITIES_PASS '+JSON.stringify({eligible,signatures:signatures.size,kinds:kinds.size,emptyDays:discarded}));
});
test('P410 precise DST/observer-day: Sunday night belongs to Sunday, UTC spans adapt',async()=>{
 for(const [date,zone,lat,lng] of [
  ['2026-03-29','Europe/Kyiv',50.4501,30.5234], // Ukraine DST start
  ['2026-10-25','Europe/Kyiv',50.4501,30.5234], // DST end
  ['2026-11-03','Asia/Kolkata',28.6139,77.2090],
  ['2026-11-03','America/New_York',40.7128,-74.0060]
 ]){
  const day=await data(date,zone,lat,lng);
  const {choghadiya,hora}=calculateTraditionalSlots(day);
  assert.equal(choghadiya.length,16);
  assert.equal(hora.length,24);
  assert.equal(choghadiya[8].startUtc,day.sunsetUtc);
  assert.equal(hora[12].startUtc,day.sunsetUtc);
  const daySpan=stamp(day.sunsetUtc)-stamp(day.sunriseUtc);
  const nightSpan=stamp(day.nextSunriseUtc)-stamp(day.sunsetUtc);
  assert.ok(Math.abs((stamp(choghadiya[0].endUtc)-stamp(day.sunriseUtc))*8-daySpan)<8);
  assert.ok(Math.abs((stamp(choghadiya[8].endUtc)-stamp(day.sunsetUtc))*8-nightSpan)<8);
  const found=dailyOpportunities(day);
  for(const w of found)assert.ok(stamp(w.startUtc)>=stamp(day.sunriseUtc));
 }
});
test('P410 Brahma Muhurta uses last two exact NIGHT muhurtas; Abhijit eighth daylight fifteenth except Wednesday',async()=>{
 const tuesday=await data('2026-11-03');
 const brahma=brahmaMuhurta(tuesday);
 const localNight=stamp(tuesday.nextSunriseUtc)-stamp(tuesday.sunsetUtc);
 assert.ok(Math.abs((stamp(tuesday.nextSunriseUtc)-stamp(brahma.startUtc))-localNight*2/15)<2);
 assert.ok(Math.abs((stamp(tuesday.nextSunriseUtc)-stamp(brahma.endUtc))-localNight/15)<2);
 assert.ok(stamp(brahma.startUtc)>stamp(tuesday.sunsetUtc));
 const abhijit=abhijitWindow(tuesday);
 assert.ok(abhijit);
 const day=stamp(tuesday.sunsetUtc)-stamp(tuesday.sunriseUtc);
 assert.ok(Math.abs(stamp(abhijit.startUtc)-stamp(tuesday.sunriseUtc)-day*7/15)<2);
 const wed=await data('2026-11-04');
 assert.equal(abhijitWindow(wed),null);
});
test('P410 fail closed when key verified UTC timing is missing',async()=>{
 const day=await data('2026-11-03');
 assert.throws(()=>dailyOpportunities({...day,sunsetUtc:day.sunriseUtc}));
 assert.throws(()=>dailyOpportunities({...day,daytimeKalas:{
  ...day.daytimeKalas,yamaganda:null}}));
});
