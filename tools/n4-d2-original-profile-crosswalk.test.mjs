import test from 'node:test';
import assert from 'node:assert/strict';
import {compareN4D2Methods} from './n4-d2-original-profile-crosswalk.mjs';
test('D2 Sun/Moon and original JHora Uma-Shambhu are distinct named methods',()=>{
 const r=compareN4D2Methods(10);
 assert.equal(r.sunMoonSign,5); // Aries first half Sun = Leo
 assert.equal(r.umaShambhuSign,1); // Aries first half Uma-Shambhu = Aries
 assert.equal(r.sameSign,false);
});
test('methods must not be treated as agreeing by assumption',()=>{
 const values=[0,14.999999,15,30,45,359.99];
 assert.ok(values.some(v=>!compareN4D2Methods(v).sameSign));
 for(const v of values) {
  const r=compareN4D2Methods(v);
  assert.ok(r.sunMoonSign>=1&&r.sunMoonSign<=12);
  assert.ok(r.umaShambhuSign>=1&&r.umaShambhuSign<=12);
 }
});
test('nonfinite positions never become a certification',()=>{
 for(const v of [NaN,Infinity,-Infinity])
  assert.throws(()=>compareN4D2Methods(v),/non-numeric/);
});
