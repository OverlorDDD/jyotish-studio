import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarWindow,moveCalendar,validOverviewWindow,markerCountForDay} from '../apps/web/lib/panchanga-calendar.ts';
import {lunarPhaseEvents} from '../packages/jyotish-core/src/lunar-phase-calendar.ts';
import {validateVedicCalendar} from '../apps/api/src/vedic-calendar.ts';
const HOUR=3600000,base=Date.parse('2026-11-01T00:00:00Z');
const at=ms=>({sun:0,moon:(((ms-base)/HOUR*4)%360+360)%360});
test('verified phase geometry returns all four crossings and excludes endpoint',()=>{
 const events=lunarPhaseEvents(base,base+100*HOUR,at);
 assert.deepEqual(events.map(x=>x.kind),['first_quarter','full_moon','last_quarter','new_moon']);
 for(let i=0;i<4;i++)assert.ok(Math.abs(Date.parse(events[i].atUtc)-
  (base+(i+1)*22.5*HOUR))<=1000);
 assert.deepEqual(lunarPhaseEvents(base,base+22.5*HOUR,at),[]);
 assert.deepEqual(lunarPhaseEvents(base+22.5*HOUR,base+24*HOUR,at),[]);
 assert.throws(()=>lunarPhaseEvents(base,base+HOUR,()=>({sun:NaN,moon:1})),/Verified Swiss/);
 assert.throws(()=>lunarPhaseEvents(base,base+33*86400000,at),/1–32/);
});
test('31-day overview is allowed while legacy 7-day festival endpoint stays strict',()=>{
 const input={start:'2026-11-01',days:31,timeZone:'Europe/Kyiv',latitude:50.45,longitude:30.52};
 assert.equal(validateVedicCalendar(input,31).days,31);
 assert.throws(()=>validateVedicCalendar(input),/1–7/);
 assert.throws(()=>validateVedicCalendar({...input,days:32},31),/1–31/);
 assert.throws(()=>validateVedicCalendar({...input,monthSystem:'invalid'},31),/amanta or purnimanta/);
});
test('28/29/30/31 days and month shifting work without leaking DST offsets',()=>{
 assert.deepEqual(calendarWindow('2026-02-07','month'),{start:'2026-02-01',days:28});
 assert.equal(calendarWindow('2024-02-07','month').days,29);
 assert.equal(calendarWindow('2026-04-07','month').days,30);
 assert.equal(calendarWindow('2026-11-07','month').days,30);
 assert.equal(calendarWindow('2026-12-07','month').days,31);
 assert.equal(moveCalendar('2026-01-31','month',1),'2026-02-28');
 assert.equal(moveCalendar('2024-01-31','month',1),'2024-02-29');
 assert.equal(moveCalendar('2026-03-29','week',1),'2026-04-05');
 assert.equal(moveCalendar('2026-10-25','week',-1),'2026-10-18');
 assert.equal(validOverviewWindow('2026-12-01',31),true);
 assert.equal(validOverviewWindow('2100-01-01',7),false);
 assert.throws(()=>calendarWindow('2026-02-30','month'),/Invalid Gregorian/);
});
test('observer-local phase marker associates with its local calendar date',()=>{
 const phases=[{kind:'new_moon',atUtc:'2026-11-01T22:30:00Z',localDate:'2026-11-02'}];
 assert.deepEqual(markerCountForDay('2026-11-02',[{id:'ekadashi_sunrise'}],phases),
  {candidateCount:1,phaseCount:1});
 assert.deepEqual(markerCountForDay('2026-11-01',[],phases),{candidateCount:0,phaseCount:0});
});
