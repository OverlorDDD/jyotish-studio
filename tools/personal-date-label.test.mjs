import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarDayLabel} from '../apps/web/lib/personal-date-label.ts';

test('Civil-day labels are timezone-safe around DST and month/year boundary',()=>{
 assert.equal(calendarDayLabel('2026-10-25','2026-10-25','uk'),'Сьогодні');
 assert.equal(calendarDayLabel('2026-10-26','2026-10-25','uk'),'Завтра');
 assert.equal(calendarDayLabel('2026-10-24','2026-10-25','uk'),'Вчора');
 assert.equal(calendarDayLabel('2026-10-27','2026-10-25','uk'),'27 жовтня');
 assert.equal(calendarDayLabel('2026-10-25','2026-10-25','en'),'Today');
 assert.equal(calendarDayLabel('2027-01-01','2026-12-31','en'),'Tomorrow');
 assert.equal(calendarDayLabel('2026-12-31','2027-01-01','uk'),'Вчора');
 assert.equal(calendarDayLabel('2026-10-26','2026-10-24','uk'),'26 жовтня');
});
