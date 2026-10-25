import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDailyGuidance,buildPeriodGuidance,buildWeekHighlights,natalPeriodContext} from '../apps/api/src/personal-guidance.ts';

const natal=[{name:'Saturn',sign:9},{name:'Moon',sign:3},{name:'Jupiter',sign:6}];
const period={lord:'Saturn',start:'2015-01-01T00:00:00.000Z',end:'2034-01-01T00:00:00.000Z',
 antardasha:{lord:'Moon',start:'2026-06-20T00:00:00.000Z',end:'2028-01-19T00:00:00.000Z'}};
const context={lagnaSign:4,moonSign:3,natalPositions:natal,period};
const moon=(date,sign,nakshatra,house)=>({
 date,sampledAtUtc:date+'T10:00:00.000Z',timeZone:'Europe/Kyiv',
 method:'Swiss Ephemeris / Lahiri sidereal / local-noon-sample-v1',
 personalized:house!=null,observationType:'SIDEREAL_GEOCENTRIC_POSITION_AT_LOCAL_NOON',
 moon:{longitude:(sign-1)*30+5,sign,nakshatra,pada:2,houseFromLagna:house,houseFromMoon:house},
 planets:[]
});
const week=[
 moon('2026-10-25',12,'Revati',9),moon('2026-10-26',1,'Ashwini',10),
 moon('2026-10-27',1,'Krittika',10),moon('2026-10-28',2,'Rohini',11),
 moon('2026-10-29',2,'Mrigashira',11),moon('2026-10-30',3,'Ardra',12),
 moon('2026-10-31',3,'Punarvasu',12)
];
test('Dasha interpretation remains grounded in verified natal house positions',()=>{
 const res=buildPeriodGuidance(period,4,natal);
 assert.ok(res);assert.equal(natalPeriodContext(4,natal,'Saturn').house,6);
 assert.equal(res.evidence.house,6);assert.equal(res.evidence.major,'Saturn');
 assert.equal(res.evidence.minor,'Moon');assert.match(res.description.en,/house 6/);
 assert.equal(buildPeriodGuidance(null,4,natal),null);
});
test('One personal reading uses natal Lagna, natal Moon, Dasha and same noon transit',()=>{
 const reading=buildDailyGuidance(week[0],context);
 assert.ok(reading);assert.deepEqual(reading,buildDailyGuidance(week[0],context));
 assert.equal(reading.evidence.kind,'VERIFIED_NATAL_TRANSIT_DASHA');
 assert.equal(reading.evidence.natalLagnaSign,4);
 assert.equal(reading.evidence.natalMoonSign,3);
 assert.equal(reading.evidence.natalMoonHouse,12);
 assert.equal(reading.evidence.major,'Saturn');
 assert.equal(reading.evidence.minor,'Moon');
 assert.equal(reading.evidence.majorNatalHouse,6);
 assert.equal(reading.evidence.minorNatalHouse,12);
 assert.equal(reading.evidence.house,9);
 assert.equal(reading.evidence.sampledAtUtc,week[0].sampledAtUtc);
 assert.match(reading.description.uk,/натальн/);
 assert.match(reading.description.uk,/махадаша Сатурна/);
 assert.match(reading.description.en,/natal Moon/);
 assert.match(reading.action.uk,/принцип/);
 assert.doesNotMatch(reading.action.uk,/навчальну програму|вступ|наставник|вакансі/);
 assert.doesNotMatch(reading.goodFor.uk,/вступ|наставник/);
 assert.notEqual(buildDailyGuidance(week[0],{...context,period:null}).description.uk,reading.description.uk);
});
test('A missing, unverified or mismatched birth chart never triggers personal advice',()=>{
 assert.equal(buildDailyGuidance(week[0],null),null);
 assert.equal(buildDailyGuidance(moon('2026-10-25',12,'Revati',null),context),null);
 assert.equal(buildDailyGuidance(week[0],{...context,lagnaSign:5}),null);
 assert.equal(buildDailyGuidance(week[0],{...context,moonSign:11}),null);
 assert.equal(buildWeekHighlights(week,[],()=>null).length,0);
 assert.equal(buildWeekHighlights(week,[]).length,0);
});
test('Calendar today references precisely the same reading, not a complementary substitute',()=>{
 const events=[{date:'2026-10-28',type:'ANTARDASHA_START',lord:'Moon',atUtc:'2026-10-28T08:00:00Z'}];
 const highlights=buildWeekHighlights(week,events,()=>context);
 assert.ok(highlights.length>=2&&highlights.length<=4);
 const daily=buildDailyGuidance(week[0],context);
 assert.equal(highlights[0].kind,'TODAY');
 assert.equal(highlights[0].date,week[0].date);
 assert.deepEqual(highlights[0].action,daily.action);
 assert.deepEqual(highlights[0].goodFor,daily.goodFor);
 assert.deepEqual(highlights[0].caution,daily.caution);
 assert.deepEqual(highlights[0].summary,daily.description);
 assert.equal(highlights[0].evidence.sampledAtUtc,daily.evidence.sampledAtUtc);
 assert.equal(highlights.filter(h=>h.kind==='TODAY').length,1);
 assert.equal(new Set(highlights.map(h=>h.action.uk)).size,highlights.length);
 assert.ok(highlights.every(h=>h.evidence.method));
 assert.ok(highlights.some(h=>h.date==='2026-10-26'));
 assert.ok(highlights.some(h=>h.date==='2026-10-28'));
 assert.equal(buildWeekHighlights([],events,()=>context).length,0);
});
test('Natal anchors meaningfully change texts, while no life circumstances are invented',()=>{
 const sameTransit=moon('2026-10-25',12,'Revati',9);
 const cancer=buildDailyGuidance(sameTransit,context);
 const ariesContext={lagnaSign:1,moonSign:3,natalPositions:natal,period};
 const aries=buildDailyGuidance({...sameTransit,moon:{...sameTransit.moon,houseFromLagna:12}},ariesContext);
 assert.ok(cancer&&aries);
 assert.notEqual(cancer.headline.uk,aries.headline.uk);
 assert.notEqual(cancer.action.uk,aries.action.uk);
 for(let h=1;h<=12;h++){
  const sign=((context.lagnaSign+h-2)%12)+1;
  const transit=moon('2026-10-25',sign,'Revati',h);
  const value=buildDailyGuidance(transit,context);
  assert.ok(value,'missing house '+h);
  assert.ok(value.action.uk.length>40);
  assert.ok(value.action.en.length>35);
  assert.doesNotMatch(value.action.uk,/вступ|наставнику|вакансію|керівництв|дитин|школу|навчальну програму/);
  assert.doesNotMatch(value.action.en,/enrolment|apply to a school|mentor|manager|children/i);
 }
});
