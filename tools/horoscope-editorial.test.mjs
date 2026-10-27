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

test('Each sign delivers different text and direct action on adjacent calendar dates',()=>{
 for(let sign=1;sign<=12;sign++)for(let d=0;d<32;d++){
  const date=new Date(Date.parse('2026-10-27T00:00:00Z')+d*86400000).toISOString().slice(0,10);
  const next=new Date(Date.parse(date+'T00:00:00Z')+86400000).toISOString().slice(0,10);
  const a=readPublicSign(sign,{...transit,date}),b=readPublicSign(sign,{...transit,date:next});
  assert.notDeepEqual(a.description,b.description);
  assert.notDeepEqual(a.goodFor,b.goodFor);
  assert.notDeepEqual(a.caution,b.caution);
  assert.match(a.goodFor.uk,/^[А-ЯІЇЄҐ]/);
 }
 assert.throws(()=>readPublicSign(1,{...transit,date:'2026-02-30'}));
 assert.throws(()=>readPublicSign(1,{...transit,moon:{...transit.moon,pada:0}}));
});
