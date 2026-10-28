import test from 'node:test';
import assert from 'node:assert/strict';
import {readPublicSign} from '../apps/api/src/horoscope-editorial.ts';
import {buildMoonSignHoroscope} from '../apps/api/src/personal-guidance.ts';
const t={date:'2026-10-28',sampledAtUtc:'2026-10-28T10:00:00Z',method:'SWISS_LAHIRI',
 personalized:true,moon:{sign:3,longitude:71,nakshatra:'Ardra',pada:1,houseFromMoon:1},planets:[]};
test('all 12 public lunar signs agree with verified natal-Moon forecast for the same Swiss observation',()=>{
 for(let sign=1;sign<=12;sign++){
  const transit={...t,moon:{...t.moon,houseFromMoon:((t.moon.sign-sign+12)%12)+1}};
  const ctx={lagnaSign:1,moonSign:sign,natalPositions:[{name:'Moon',sign}],period:null};
  const personal=buildMoonSignHoroscope(transit,ctx);
  const publicSign=readPublicSign(sign,transit);
  assert.ok(personal,'Natal-Moon sign '+sign);
  assert.deepEqual(personal.headline,publicSign.headline);
  assert.deepEqual(personal.description,publicSign.description);
  assert.deepEqual(personal.goodFor,publicSign.goodFor);
  assert.deepEqual(personal.caution,publicSign.caution);
  assert.deepEqual(personal.action,publicSign.reflection);
  assert.equal(publicSign.house,transit.moon.houseFromMoon);
 }
});
test('manual Aries in public mode does not overwrite natal Gemini (distinct evidence)',()=>{
 const aries=readPublicSign(1,t);
 const gemini=buildMoonSignHoroscope(t,{lagnaSign:1,moonSign:3,natalPositions:[{name:'Moon',sign:3}],period:null});
 assert.notEqual(aries.headline.uk,gemini.headline.uk);
 assert.equal(gemini.headline.uk,readPublicSign(3,t).headline.uk);
});
