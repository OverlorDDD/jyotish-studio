import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {localToUTC} from '../packages/jyotish-core/src/index.ts';
import {resolveN414CivilTime} from './n4-14-time-d60.mjs';

const corpus=JSON.parse(readFileSync(
 new URL('./n4-14-transition-fixtures.json',import.meta.url),'utf8'));
test('production natal localToUTC agrees with independent research Intl resolver on 25 IANA transitions',()=>{
 assert.equal(corpus.fixtures.length,25);
 for(const entry of corpus.fixtures){
  const diagnostic=resolveN414CivilTime(entry);
  assert.equal(diagnostic.status,entry.expected,entry.zone+' '+entry.date+' '+entry.time);
  if(entry.expected==='UNIQUE'){
   assert.equal(localToUTC(entry.date,entry.time,entry.zone),diagnostic.candidatesUtc[0],
    'production UTC mismatch for '+JSON.stringify(entry));
  }else{
   assert.throws(()=>localToUTC(entry.date,entry.time,entry.zone),
    /Ambiguous local time|Nonexistent local time/,
    'production should block '+JSON.stringify(entry));
  }
 }
});
test('production natal rejects invented time and non-IANA time zone',()=>{
 assert.throws(()=>localToUTC('2024-02-30','12:00','Europe/Kyiv'),/Invalid calendar/);
 assert.throws(()=>localToUTC('2024-01-15','99:99','Europe/Kyiv'),/Invalid calendar/);
 assert.throws(()=>localToUTC('2024-01-15','12:00','Mars/Olympus'),/Unknown IANA/);
});
