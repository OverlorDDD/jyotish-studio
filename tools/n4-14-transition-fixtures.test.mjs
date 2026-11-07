import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveN414CivilTime} from './n4-14-time-d60.mjs';
const fixture=JSON.parse(readFileSync(new URL('./n4-14-transition-fixtures.json',import.meta.url),'utf8'));
test('N4.14 25 IANA transition fixtures incl Kyiv 1990 and Samoa 2011',()=>{
 assert.equal(fixture.fixtures.length,25);
 assert.equal(fixture.authority,'IANA_DIAGNOSTIC_ONLY_NOT_LEGAL_TIME_CERTIFICATION');
 for(const c of fixture.fixtures){
  const r=resolveN414CivilTime(c);
  assert.equal(r.status,c.expected,JSON.stringify(c));
  assert.equal(r.candidatesUtc.length,c.expected==='GAP'?0:c.expected==='FOLD'?2:1);
  assert.equal(r.hostTzdbExternallyCertified,false);
  assert.equal(r.productionTimeResolved,false);
 }
});
