import test from 'node:test';
import assert from 'node:assert/strict';
import {finalizedGscWindow} from './g32-search-intelligence.mjs';

test('Pacific reporting window subtracts calendar days across daylight-saving transitions',()=>{
 const before=finalizedGscWindow(new Date('2026-11-05T07:30:00Z'));
 assert.equal(before.endDate,'2026-10-31');
 assert.equal(before.startDate,'2026-10-22');
 const ordinary=finalizedGscWindow(new Date('2026-11-05T11:30:00Z'));
 assert.equal(ordinary.endDate,'2026-11-01');
 assert.equal(ordinary.startDate,'2026-10-23');
});
