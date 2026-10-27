import test from 'node:test';
import assert from 'node:assert/strict';
import {horoscopeTheme,readPublicSign,EDITORIAL_REFERENCE} from '../apps/api/src/horoscope-editorial.ts';
const transit={date:'2026-10-27',sampledAtUtc:'2026-10-27T10:00:00.000Z',method:'Swiss Ephemeris / Lahiri',moon:{sign:2,nakshatra:'Rohini',pada:1}};
test('12 sidereal Janma-Rashi forecasts derive only from real supplied lunar observation',()=>{
 const rows=Array.from({length:12},(_,i)=>readPublicSign(i+1,transit));
 assert.equal(rows.length,12);assert.deepEqual(rows.map(x=>x.house).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9,10,11,12]);
 assert.equal(rows[1].house,1);assert.equal(rows[0].house,2);
 for(const x of rows){
  assert.equal(x.evidence.moonSign,2);assert.equal(x.evidence.nakshatra,'Rohini');
  assert.equal(x.evidence.method,'Swiss Ephemeris / Lahiri');
  assert.ok(x.description.uk.length>120&&x.description.en.length>120);
  assert.ok(x.reflection.uk.endsWith('?')&&x.reflection.en.endsWith('?'));
 }
 assert.match(EDITORIAL_REFERENCE.classical,/Phaladipika/);
 assert.throws(()=>readPublicSign(13,transit));assert.throws(()=>horoscopeTheme(0));
});
