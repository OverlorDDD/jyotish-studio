import test from 'node:test';import assert from 'node:assert/strict';
import {daytimeKalas,DAYTIME_KALA_VERSION} from '../packages/jyotish-core/src/daytime-kalas.ts';
const sunrise='2026-10-26T06:00:00.000Z',sunset='2026-10-26T18:00:00.000Z';
test('Seven canonical weekday tables derive all Rahu/Yamaganda/Gulika daytime octants',()=>{
 const rahu=[8,2,7,5,6,4,3],yama=[5,4,3,2,1,7,6],gulika=[7,6,5,4,3,2,1];
 for(let weekday=0;weekday<7;weekday++){
  const p=daytimeKalas(sunrise,sunset,weekday);
  assert.equal(p.rahuKalam.part,rahu[weekday]);
  assert.equal(p.yamaganda.part,yama[weekday]);
  assert.equal(p.gulikaKalam.part,gulika[weekday]);
  for(const e of [p.rahuKalam,p.yamaganda,p.gulikaKalam]){
   const from=Date.parse(e.fromUtc),until=Date.parse(e.untilUtc);
   assert.equal(from,Date.parse(sunrise)+(e.part-1)*90*60000);
   assert.equal(until-from,90*60000);
  }
 }
 const mon=daytimeKalas(sunrise,sunset,1);
 assert.equal(mon.rahuKalam.fromUtc,'2026-10-26T07:30:00.000Z');
 assert.equal(mon.rahuKalam.untilUtc,'2026-10-26T09:00:00.000Z');
 assert.equal(mon.yamaganda.fromUtc,'2026-10-26T10:30:00.000Z');
 assert.equal(mon.gulikaKalam.fromUtc,'2026-10-26T13:30:00.000Z');
 assert.equal(mon.version,DAYTIME_KALA_VERSION);
});
test('Actual local sunrise-sunset duration drives window length; not fixed clock times',()=>{
 const p=daytimeKalas('2026-07-01T03:15:00.000Z','2026-07-01T19:15:00.000Z',3);
 assert.equal(p.rahuKalam.part,5);
 assert.equal(p.rahuKalam.fromUtc,'2026-07-01T11:15:00.000Z');
 assert.equal(p.rahuKalam.untilUtc,'2026-07-01T13:15:00.000Z');
});
test('Fails closed for invalid observer rise/set and weekday',()=>{
 assert.throws(()=>daytimeKalas(sunrise,sunset,-1),/weekday/);
 assert.throws(()=>daytimeKalas(sunset,sunrise,1),/interval/);
 assert.throws(()=>daytimeKalas('bad',sunset,1),/interval/);
});
