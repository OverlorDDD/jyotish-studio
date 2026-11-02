import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPanchangaSunrise} from '../packages/jyotish-core/src/panchanga.ts';
import {calendarDateAt,previousCivilDate,needsPriorVedicDay,slicesFor,stateAt,positionInDay} from '../apps/web/lib/panchanga-live.ts';
const HOUR=3600000,base=Date.parse('2026-11-02T00:00:00Z');
const at=ms=>({sun:0,moon:((ms-base)/HOUR%360+360)%360});
function make(sunrise=base+6*HOUR,nextSunrise=base+30*HOUR){
 const core=buildPanchangaSunrise('2026-11-02',
  new Date(sunrise).toISOString(),new Date(nextSunrise).toISOString(),at);
 return {...core,sunsetUtc:new Date(base+16*HOUR).toISOString(),
  location:{timeZone:'Europe/Kyiv',latitude:50.45,longitude:30.52}};
}
test('all four limb periods are continuous, correctly indexed and use real next boundaries',()=>{
 const d=make(),dayStart=Date.parse(d.sunriseUtc),dayEnd=Date.parse(d.nextSunriseUtc);
 for(const kind of ['tithi','nakshatra','yoga','karana']){
  const slices=slicesFor(d,kind);
  assert.ok(slices.length>=2,kind);
  assert.equal(slices[0].clippedStartUtc,d.sunriseUtc);
  assert.equal(slices.at(-1).clippedEndUtc,d.nextSunriseUtc);
  assert.ok(Date.parse(slices[0].startUtc)<dayStart,kind+' must preserve previous start');
  assert.ok(Date.parse(slices.at(-1).endUtc)>dayEnd,kind+' must preserve true future end');
  for(let i=1;i<slices.length;i++)assert.equal(slices[i-1].endUtc,slices[i].startUtc);
  assert.ok(Math.abs(slices.reduce((a,x)=>a+x.widthPercent,0)-100)<1e-6);
 }
 const at12=stateAt(d,base+12*HOUR);
 assert.ok(at12);
 assert.equal(at12.tithi.value.number,2); // instant at the exact crossing belongs to the new period
 assert.equal(at12.karana.value.slot,3);
 assert.equal(stateAt(d,base+6*HOUR-1),null);
 assert.equal(stateAt(d,base+30*HOUR),null);
 assert.equal(positionInDay(d,base+6*HOUR),0);
 assert.equal(positionInDay(d,base+30*HOUR),null);
});
test('pre-sunrise in selected zone belongs to previous Vedic day',()=>{
 const d=make();
 assert.equal(calendarDateAt(Date.parse('2026-11-01T23:00:00Z'),'Europe/Kyiv'),'2026-11-02');
 assert.equal(needsPriorVedicDay(d,Date.parse('2026-11-02T03:00:00Z')),true);
 assert.equal(needsPriorVedicDay(d,Date.parse('2026-11-02T06:00:00Z')),false);
 assert.equal(previousCivilDate('2026-11-02'),'2026-11-01');
 assert.equal(previousCivilDate('2026-03-01'),'2026-02-28');
 assert.equal(previousCivilDate('2024-03-01'),'2024-02-29');
});
test('DST civil dates are not inferred from fixed 24h UTC offsets',()=>{
 assert.equal(calendarDateAt(Date.parse('2026-03-29T00:15:00Z'),'Europe/Kyiv'),'2026-03-29');
 assert.equal(calendarDateAt(Date.parse('2026-10-25T00:15:00Z'),'Europe/Kyiv'),'2026-10-25');
 for(const length of [23,25]){
  const d=make(base+6*HOUR,base+(6+length)*HOUR);
  const segments=slicesFor(d,'karana');
  assert.equal(segments[0].clippedStartUtc,d.sunriseUtc);
  assert.equal(segments.at(-1).clippedEndUtc,d.nextSunriseUtc);
  assert.ok(stateAt(d,base+8*HOUR));
 }
});
test('tampered or missing period data is rejected instead of inventing a timeline',()=>{
 const original=make();
 const noPeriod={...original,periods:{...original.periods,karana:[]}};
 assert.throws(()=>slicesFor(noPeriod,'karana'),/Missing verified/);
 const wrong={...original,periods:{...original.periods,
  yoga:original.periods.yoga.map((p,i)=>i===0?{...p,index:99}:p)}};
 assert.throws(()=>slicesFor(wrong,'yoga'),/Invalid yoga index/);
 assert.throws(()=>previousCivilDate('2026-02-30'),/Invalid local date/);
});
