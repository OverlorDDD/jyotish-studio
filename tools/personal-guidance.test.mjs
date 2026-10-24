import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDailyGuidance,buildPeriodGuidance,buildWeekHighlights,natalPeriodContext} from '../apps/api/src/personal-guidance.ts';
const natal=[{name:'Saturn',sign:9},{name:'Moon',sign:3},{name:'Jupiter',sign:6}];
const moon=(date,sign,nakshatra,house)=>({
 date,sampledAtUtc:date+'T10:00:00.000Z',timeZone:'Europe/Kyiv',method:'Swiss Ephemeris / Lahiri sidereal / local-noon-sample-v1',
 observationType:'SIDEREAL_GEOCENTRIC_POSITION_AT_LOCAL_NOON',personalized:house!=null,
 moon:{longitude:sign*30,sign,nakshatra,pada:2,houseFromLagna:house,houseFromMoon:house},
 planets:[]
});
test('Dasha guidance is anchored in natal houses and does not fabricate event dates',()=>{
 const period={lord:'Saturn',start:'2015-01-01T00:00:00.000Z',end:'2034-01-01T00:00:00.000Z',
  antardasha:{lord:'Moon',start:'2026-06-20T00:00:00.000Z',end:'2028-01-19T00:00:00.000Z'}};
 const result=buildPeriodGuidance(period,4,natal);
 assert.ok(result);
 assert.equal(natalPeriodContext(4,natal,'Saturn').house,6);
 assert.equal(result.evidence.house,6);
 assert.equal(result.evidence.major,'Saturn');
 assert.equal(result.evidence.minor,'Moon');
 assert.match(result.description.uk,/6-му домі/);
 assert.match(result.description.en,/house 6/);
 assert.match(result.headline.uk,/антардаша Місяця/);
 assert.ok(result.action.en.length>20);
 assert.equal(buildPeriodGuidance(null,4,natal),null);
});
test('Daily advice is consistent, bilingual, fact-backed and safe without primary chart',()=>{
 const day=moon('2026-10-24',7,'Swati',4);
 const a=buildDailyGuidance(day),b=buildDailyGuidance(day);
 assert.deepEqual(a,b);
 assert.equal(a.evidence.kind,'PERSONAL_MOON_HOUSE');
 assert.equal(a.evidence.house,4);
 assert.equal(a.evidence.nakshatra,'Swati');
 assert.equal(a.evidence.sampledAtUtc,day.sampledAtUtc);
 assert.match(a.description.uk,/4-й дім/);
 assert.match(a.description.en,/house 4/);
 assert.ok(a.action.uk.length>15);
 const general=buildDailyGuidance(moon('2026-10-24',7,'Swati',null));
 assert.equal(general.evidence.kind,'GENERAL_MOON_SKY');
 assert.equal(general.evidence.house,null);
 assert.doesNotMatch(general.description.uk,/для твоєї лагни це/);
 assert.equal(buildDailyGuidance(null),null);
});
test('Weekly highlights use only supplied noon observations or actual Dasha boundary events',()=>{
 const days=[
  moon('2026-10-24',7,'Swati',4),moon('2026-10-25',7,'Vishakha',4),
  moon('2026-10-26',8,'Vishakha',5),moon('2026-10-27',8,'Anuradha',5),
  moon('2026-10-28',9,'Mula',6),moon('2026-10-29',9,'Mula',6),
  moon('2026-10-30',10,'Uttara Ashadha',7),moon('2026-10-31',10,'Shravana',7)
 ];
 const events=[{date:'2026-10-26',type:'ANTARDASHA_START',lord:'Moon',atUtc:'2026-10-26T07:00:00Z'}];
 const highlights=buildWeekHighlights(days,events);
 assert.equal(highlights[0].kind,'WEEK_OPENING');
 assert.ok(highlights.some(h=>h.kind==='DASHA_START'&&h.date==='2026-10-26'));
 assert.ok(highlights.some(h=>h.kind==='MOON_SIGN_SAMPLE_CHANGE'));
 assert.ok(highlights.some(h=>h.kind==='NAKSHATRA_SAMPLE_CHANGE'));
 assert.ok(highlights.length<=5);
 assert.ok(highlights.every(h=>h.date<='2026-10-30'&&h.evidence.method));
 assert.ok(highlights.filter(h=>h.kind!=='DASHA_START').every(h=>h.evidence.sampledAtUtc));
 assert.equal(buildWeekHighlights([],events).length,0);
 const noEvents=buildWeekHighlights([moon('2026-10-24',1,'Ashwini',null)],[]);
 assert.equal(noEvents.length,1);
 assert.match(noEvents[0].summary.uk,/загальний/);
});
