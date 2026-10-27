import test from 'node:test';
import assert from 'node:assert/strict';
import {VEDIC_CALENDAR_VERSION,monthAtSunrise,sunriseObservances,
 solarSankrantis,abhijitMuhurta,tithiNumber,namedFestivalCandidates} from '../packages/jyotish-core/src/vedic-calendar.ts';
const HOUR=3600000,DAY=24*HOUR,base=Date.parse('2026-01-01T00:00:00Z');
const moons=[
 {atUtc:'2026-01-01T00:00:00.000Z',sunLongitude:330},
 {atUtc:'2026-01-31T00:00:00.000Z',sunLongitude:0.5},
 {atUtc:'2026-03-01T00:00:00.000Z',sunLongitude:31},
 {atUtc:'2026-03-30T00:00:00.000Z',sunLongitude:61}
];
const obs=(overrides={})=>({
 date:'2026-01-20',sunriseUtc:'2026-01-20T06:00:00.000Z',
 sunsetUtc:'2026-01-20T18:00:00.000Z',
 nextSunriseUtc:'2026-01-21T06:00:00.000Z',
 tithi:11,arunodayaTithi:10,pradoshaTithi:12,pradoshaEndTithi:12,
 sunLongitude:340,...overrides
});
test('amanta / purnimanta names preserve bright fortnight; shift only regular Krishna fortnight',()=>{
 assert.equal(VEDIC_CALENDAR_VERSION,'vedic-observance-indications-v1');
 const sample='2026-01-20T06:00:00.000Z';
 assert.equal(monthAtSunrise(sample,7,moons,'amanta').name,'Chaitra');
 assert.equal(monthAtSunrise(sample,7,moons,'purnimanta').name,'Chaitra');
 const dark=monthAtSunrise(sample,22,moons,'purnimanta');
 assert.equal(dark.name,'Vaishakha');
 assert.equal(dark.amantaName,'Chaitra');
 assert.equal(dark.purnimantaKrishnaShiftApplied,true);
 assert.equal(monthAtSunrise(sample,22,moons,'amanta').name,'Chaitra');
});
test('adhika month from zero Sankranti is labeled clearly; kshaya refuses to guess a month name',()=>{
 const leap=[
  {atUtc:'2026-01-01T00:00:00.000Z',sunLongitude:330},
  {atUtc:'2026-01-31T00:00:00.000Z',sunLongitude:350},
  {atUtc:'2026-03-01T00:00:00.000Z',sunLongitude:20}
 ];
 const a=monthAtSunrise('2026-01-20T06:00:00.000Z',26,leap,'purnimanta');
 assert.equal(a.lunarMonthStatus,'adhika');
 assert.equal(a.name,'Chaitra');
 assert.equal(a.purnimantaKrishnaShiftApplied,false);
 const loss=[
  {atUtc:'2026-01-01T00:00:00.000Z',sunLongitude:355},
  {atUtc:'2026-01-31T00:00:00.000Z',sunLongitude:35},
  {atUtc:'2026-03-01T00:00:00.000Z',sunLongitude:65}
 ];
 const x=monthAtSunrise('2026-01-20T06:00:00.000Z',9,loss,'amanta');
 assert.equal(x.lunarMonthStatus,'kshaya_review_required');
 assert.equal(x.name,null);
 assert.equal(x.finalFestivalDateCertified,false);
});
test('ekadashi sunrise and 96-min arunodaya flags stay candidates and do not invent Parana',()=>{
 const only=sunriseObservances(obs());
 assert.deepEqual(only.map(x=>x.id),['ekadashi_sunrise']);
 assert.equal(only[0].category,'candidate');
 assert.equal(only[0].metadata.paksha,'Shukla');
 const valid=sunriseObservances(obs({arunodayaTithi:11}));
 assert.deepEqual(valid.map(x=>x.id),['ekadashi_sunrise','ekadashi_arunodaya']);
 assert.equal(valid[1].atUtc,'2026-01-20T04:24:00.000Z');
 const dark=sunriseObservances(obs({tithi:26,arunodayaTithi:26}));
 assert.equal(dark[0].metadata.paksha,'Krishna');
});
test('Pradosha night eligibility uses actual local sunset, not sunrise Trayodashi',()=>{
 const list=sunriseObservances(obs({tithi:12,pradoshaTithi:13,pradoshaEndTithi:13}));
 assert.deepEqual(list.map(x=>x.id),['pradosha_trayodashi']);
 assert.equal(list[0].atUtc,'2026-01-20T18:00:00.000Z');
 assert.equal(sunriseObservances(obs({tithi:15,pradoshaTithi:15,pradoshaEndTithi:15}))[0].id,'purnima_sunrise');
 assert.equal(sunriseObservances(obs({tithi:30,pradoshaTithi:30,pradoshaEndTithi:30}))[0].id,'amavasya_sunrise');
});
test('Sankranti crosses all twelve signs, including 360-degree Pisces->Aries, within one second',()=>{
 for(let sign=1;sign<=12;sign++){
  const origin=(sign*30-1)%360,rate=.2;
  const lon=ms=>((origin+rate*(ms-base)/HOUR)%360+360)%360;
  const events=solarSankrantis(base,base+20*HOUR,lon);
  assert.equal(events.length,1,'sign '+sign);
  assert.equal(events[0].fromSign,sign);
  assert.equal(events[0].toSign,sign%12+1);
  assert.ok(Math.abs(Date.parse(events[0].atUtc)-(base+5*HOUR))<=1000);
 }
 assert.deepEqual(solarSankrantis(base,base+HOUR,()=>1),[]);
});
test('Abhijit is 8th of 15 live daylight periods, with Wednesday caveat',()=>{
 const start='2026-01-20T06:00:00.000Z',end='2026-01-20T18:00:00.000Z';
 const t=abhijitMuhurta(start,end,2);
 assert.equal(t.startUtc,'2026-01-20T11:36:00.000Z');
 assert.equal(t.endUtc,'2026-01-20T12:24:00.000Z');
 assert.equal(t.weekdayCaution,null);
 assert.equal(abhijitMuhurta(start,end,3).weekdayCaution,'wednesday_traditional_exception');
});
test('fail closed for invalid moon inputs, policies, dates and impossible horizons',()=>{
 assert.equal(tithiNumber({sun:359,moon:1}),1);
 assert.throws(()=>tithiNumber({sun:NaN,moon:1}),/Verified/);
 assert.throws(()=>monthAtSunrise('bad',5,moons,'amanta'),/Invalid/);
 assert.throws(()=>monthAtSunrise('2026-01-20T06:00:00.000Z',5,moons,'other'),/Unsupported/);
 assert.throws(()=>sunriseObservances(obs({arunodayaTithi:99})),/Invalid/);
 assert.throws(()=>abhijitMuhurta('bad','2026-01-20T18:00:00Z',2),/Invalid/);
 assert.throws(()=>solarSankrantis(base,base+16*DAY,()=>1),/Invalid/);
});

test('named festival candidates use actual matching sunrise/midday/sunset/night-tithi rules, with no fictional full festival certification',()=>{
 const sample=(month,extra={})=>({
  date:'2026-03-26',sunriseUtc:'2026-03-26T06:00:00.000Z',
  sunsetUtc:'2026-03-26T18:00:00.000Z',
  nextSunriseUtc:'2026-03-27T06:00:00.000Z',
  sunriseTithi:7,madhyahnaTithi:7,sunsetTithi:7,nightMidTithi:7,
  amantaMonth:month,monthStatus:'regular',...extra
 });
 const cases=[
  ['Chaitra',{sunriseTithi:1},'chaitra_navratri'],
  ['Ashwina',{sunriseTithi:1},'sharad_navratri'],
  ['Chaitra',{madhyahnaTithi:9},'rama_navami'],
  ['Bhadrapada',{madhyahnaTithi:4},'ganesh_chaturthi'],
  ['Ashadha',{sunriseTithi:15},'guru_purnima'],
  ['Shravana',{nightMidTithi:23},'janmashtami'],
  ['Magha',{nightMidTithi:29},'maha_shivaratri'],
  ['Ashwina',{sunsetTithi:30},'diwali_amavasya']
 ];
 for(const [month,overrides,expected] of cases){
  const actual=namedFestivalCandidates(sample(month,overrides));
  assert.deepEqual(actual.map(e=>e.id),[expected]);
  assert.equal(actual[0].category,'candidate');
  assert.equal(actual[0].metadata.traditionalRuleOnly,true);
 }
 assert.deepEqual(namedFestivalCandidates(sample('Chaitra',{madhyahnaTithi:9,monthStatus:'adhika'})),[]);
 assert.deepEqual(namedFestivalCandidates(sample('Chaitra',{madhyahnaTithi:9,monthStatus:'kshaya_review_required'})),[]);
 assert.deepEqual(namedFestivalCandidates(sample('Chaitra',{sunriseTithi:9,madhyahnaTithi:8})),[]);
 assert.deepEqual(namedFestivalCandidates(sample('Magha',{nightMidTithi:28,sunriseTithi:29})),[]);
});
