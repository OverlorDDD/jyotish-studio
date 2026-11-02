import test from 'node:test';
import assert from 'node:assert/strict';
import {p31DaySummary,P31_TOPICS} from '../apps/web/lib/panchanga-p31-model.ts';
const day={
 date:'2026-11-02',location:{timeZone:'Europe/Kyiv',latitude:50.4501,longitude:30.5234},
 sunriseUtc:'2026-11-02T04:30:00.000Z',sunsetUtc:'2026-11-02T14:30:00.000Z',
 nextSunriseUtc:'2026-11-03T04:31:00.000Z',
 sunrise:{tithi:{number:23,paksha:'Krishna',numberWithinPaksha:8},
  nakshatra:{number:9,name:'Ashlesha',pada:1},
  vara:{number:2,name:'Somavara'},yoga:{number:23,name:'Shubha'},
  karana:{slot:45,name:'Taitila'}},
 changes:[],
 periods:{},
 daytimeKalas:{rahuKalam:{fromUtc:'2026-11-02T05:45:00.000Z',
  untilUtc:'2026-11-02T07:00:00.000Z'}}
};
for(const k of ['tithi','nakshatra','yoga','karana']){
 const v=day.sunrise[k],index=k==='karana'?v.slot:v.number;
 day.periods[k]=[{index,startUtc:day.sunriseUtc,endUtc:day.nextSunriseUtc,value:v}];
}
const at=s=>Date.parse(s);
test('P3.1 shows categorical Rahu rule only while the verified local daytime interval is active',()=>{
 const r=p31DaySummary(day,at('2026-11-02T06:00:00.000Z'),'work');
 assert.equal(r.vedicDay,'live');
 assert.equal(r.withinRahu,true);
 assert.match(r.advice.guidance.uk,/не починайте розмову про підвищення до 09:00/);
 assert.equal(r.advice.verdict,'calendar_only');
 assert.equal(r.advice.personalized,false);
 assert.ok(r.advice.missing.includes('FIVE_LIMB_SYNTHESIS_P32'));
 assert.deepEqual(r.advice.evidence.map(x=>x.id),['RAHU_KALAM_DAYLIGHT_EIGHTH','VERIFIED_LOCAL_SUNRISE']);
});
test('P3.1 never calls outside Rahu time favourable, and does not fabricate natal advice',()=>{
 for(const topic of P31_TOPICS){
  const r=p31DaySummary(day,at('2026-11-02T11:20:00.000Z'),topic);
  assert.equal(r.withinRahu,false);
  assert.equal(r.advice.verdict,'calendar_only');
  assert.match(r.advice.guidance.uk,/у проміжку 07:45–09:00/);
  assert.doesNotMatch(r.advice.guidance.uk,/сприятлив|вдалий|успіх/);
  assert.equal(r.advice.evidence.filter(x=>x.kind==='natal').length,0);
 }
});
test('P3.1 before sunrise does not mislabel the future sunrise state as current',()=>{
 const r=p31DaySummary(day,at('2026-11-02T03:00:00.000Z'),'money');
 assert.equal(r.vedicDay,'pre_sunrise');
 assert.equal(r.isLive,false);
 assert.equal(r.withinRahu,false);
});
test('P3.1 guards corrupt intervals instead of generating instructions',()=>{
 assert.throws(()=>p31DaySummary({...day,daytimeKalas:{rahuKalam:{
  fromUtc:'2026-11-02T15:00:00.000Z',untilUtc:'2026-11-02T16:00:00.000Z'}}},
  at('2026-11-02T06:00:00.000Z'),'work'),/Invalid verified/);
});
