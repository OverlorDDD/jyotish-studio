import test from 'node:test';
import assert from 'node:assert/strict';
import {assertSwissReturnFlags} from '../apps/api/src/swiss-backend-policy.ts';
test('Swiss returned calculation flags prove actual backend not requested backend',()=>{
 for(const flag of [2,258,65794,65858])assert.doesNotThrow(()=>assertSwissReturnFlags(flag,'Moon'));
 for(const flag of [undefined,null,NaN,0,1,4,257,260,65860,3,6,-1,'2'])
  assert.throws(()=>assertSwissReturnFlags(flag,'Moon'),/Precise Swiss Ephemeris required/);
});
test('Birth and transit ephemeris adapter must inspect planetary result flags',()=>{
 const fs=await import('node:fs');
 const native=fs.readFileSync(new URL('../apps/api/src/ephemeris.ts',import.meta.url),'utf8');
 const python=fs.readFileSync(new URL('./swiss_ephemeris.py',import.meta.url),'utf8');
 assert.match(native,/assertSwissReturnFlags\(p\.flags/);
 assert.match(python,/ret\s*&\s*7/);
 assert.match(python,/Swiss Ephemeris files unavailable/);
});
