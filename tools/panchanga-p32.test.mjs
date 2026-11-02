import test from 'node:test';
import assert from 'node:assert/strict';
import {interpretPanchanga} from '../apps/web/lib/panchanga-p32-engine.ts';
const stamp=s=>'2026-11-02T'+s+':00.000Z';
const base=()=>{
 const day={
  date:'2026-11-02',location:{timeZone:'Europe/Kyiv'},
  sunriseUtc:stamp('04:30'),sunsetUtc:stamp('14:30'),nextSunriseUtc:'2026-11-03T04:31:00.000Z',
  sunrise:{tithi:{number:8,paksha:'Shukla',numberWithinPaksha:8},
   nakshatra:{number:4,name:'Rohini',pada:1},
   vara:{number:5,name:'Guruvara'},yoga:{number:16,name:'Siddhi'},
   karana:{slot:14,name:'Bava'}},
  periods:{},
  daytimeKalas:{rahuKalam:{fromUtc:stamp('05:45'),untilUtc:stamp('07:00')}}
 };
 for(const k of ['tithi','nakshatra','yoga','karana'])
  day.periods[k]=[{startUtc:stamp('03:00'),endUtc:'2026-11-03T05:00:00.000Z',value:day.sunrise[k]}];
 return day;
};
const ms=s=>Date.parse(stamp(s));
test('P3.2 evaluates all five limbs, Moon phase and Rahu in a single typed source record',()=>{
 const r=interpretPanchanga(base(),ms('10:00'),'work');
 assert.equal(r.status,'supported');
 assert.equal(r.scope,'traditional-calendar-only');
 assert.equal(r.personalized,false);
 assert.equal(r.moment,'live');
 assert.equal(r.evidence.length,7);
 assert.deepEqual(r.evidence.map(x=>x.factor),['tithi','nakshatra','vara','yoga','karana','moon','rahu']);
 assert.equal(r.coverage.natal,false);
 assert.ok(r.evidence.every(e=>e.id&&e.source&&e.detail.uk&&e.detail.en));
 assert.match(r.action.uk,/переговори про підвищення/);
});
test('P3.2 hard traditional Bhadra/Vishti barrier overrides independent positive factors',()=>{
 const d=base();
 d.sunrise.karana={slot:14,name:'Vishti'};
 d.periods.karana[0].value=d.sunrise.karana;
 const r=interpretPanchanga(d,ms('10:00'),'money');
 assert.equal(r.status,'avoid');
 assert.match(r.reason.uk,/Вішті/);
 assert.match(r.headline.uk,/Не починайте/);
 assert.equal(r.evidence.find(x=>x.factor==='karana').tone,'blocks');
 assert.ok(r.evidence.filter(x=>x.tone==='supports').length>=2);
});
test('P3.2 Rahu changes active verdict without declaring the remainder of the day automatically favourable',()=>{
 const d=base();
 assert.equal(interpretPanchanga(d,ms('06:00'),'work').status,'avoid');
 assert.equal(interpretPanchanga(d,ms('10:00'),'work').status,'supported');
 assert.match(interpretPanchanga(d,ms('06:00'),'work').reason.uk,/Раху-калам/);
});
test('P3.2 Rikta tithi is a real caution even when the nakshatra supports travel',()=>{
 const d=base();
 d.sunrise.tithi={number:9,paksha:'Shukla',numberWithinPaksha:9};
 d.periods.tithi[0].value=d.sunrise.tithi;
 d.sunrise.nakshatra={number:15,name:'Swati',pada:2};
 d.periods.nakshatra[0].value=d.sunrise.nakshatra;
 const r=interpretPanchanga(d,ms('10:00'),'travel');
 assert.equal(r.status,'caution');
 assert.match(r.reason.uk,/Порожня тітхі/);
 assert.equal(r.evidence.find(x=>x.factor==='nakshatra').tone,'supports');
});
test('P3.2 activity-specific suitability: movable for travel not automatically for a pay negotiation',()=>{
 const d=base();
 d.sunrise.tithi={number:1,paksha:'Shukla',numberWithinPaksha:1};
 d.periods.tithi[0].value=d.sunrise.tithi;
 d.sunrise.nakshatra={number:15,name:'Swati',pada:2};
 d.periods.nakshatra[0].value=d.sunrise.nakshatra;
 const travel=interpretPanchanga(d,ms('10:00'),'travel');
 const work=interpretPanchanga(d,ms('10:00'),'work');
 assert.equal(travel.evidence.find(e=>e.factor==='nakshatra').tone,'supports');
 assert.equal(work.evidence.find(e=>e.factor==='nakshatra').tone,'neutral');
});
test('P3.2 reacts to the true midpoint tithi change and identifies next UTC boundary',()=>{
 const d=base();
 const second={number:9,paksha:'Shukla',numberWithinPaksha:9};
 d.periods.tithi=[
  {startUtc:stamp('03:00'),endUtc:stamp('10:30'),value:d.sunrise.tithi},
  {startUtc:stamp('10:30'),endUtc:'2026-11-03T05:00:00.000Z',value:second}
 ];
 const before=interpretPanchanga(d,ms('10:00'),'work');
 const after=interpretPanchanga(d,ms('11:00'),'work');
 assert.equal(before.status,'supported');assert.equal(after.status,'caution');
 assert.equal(before.untilUtc,stamp('10:30'));
 assert.ok(after.evidence.some(x=>x.id==='TITHI_RIKTA'));
});
test('P3.2 future selected date is sunrise snapshot, never described as "now"',()=>{
 const d=base();
 const r=interpretPanchanga(d,Date.parse('2026-11-05T12:00:00Z'),'work');
 assert.equal(r.moment,'sunrise-snapshot');
 assert.equal(r.untilUtc,null);
 assert.doesNotMatch(r.headline.uk,/зараз/i);
});
test('P3.2 malformed or contradictory measurements fail closed',()=>{
 const d=base();
 const corrupt=base();corrupt.sunrise.tithi.number=30;corrupt.periods.tithi[0].value=corrupt.sunrise.tithi;
 assert.throws(()=>interpretPanchanga(corrupt,ms('10:00'),'work'),/inconsistent five limbs/i);
 const missing=base();missing.periods.nakshatra=[];
 assert.throws(()=>interpretPanchanga(missing,ms('10:00'),'work'),/incomplete nakshatra/i);
 const overlap=base();overlap.periods.karana.push({...overlap.periods.karana[0]});
 assert.throws(()=>interpretPanchanga(overlap,ms('10:00'),'work'),/overlapping karana/i);
 const badRahu=base();badRahu.daytimeKalas.rahuKalam.untilUtc=stamp('15:00');
 assert.throws(()=>interpretPanchanga(badRahu,ms('10:00'),'work'),/unverified sunrise/i);
});
