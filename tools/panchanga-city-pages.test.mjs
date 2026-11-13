import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PANCHANGA_CITIES,PANCHANGA_REGIONS,panchangaCityBySlug} from '../apps/web/lib/panchanga-cities.ts';
import {citySunriseRows,cityChanges,cityDayMatches,cityCivilDate,nextCivilDate,tithiLabel,
 cityClock,cityMoment} from '../apps/web/lib/panchanga-city-day.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

const kyiv=panchangaCityBySlug('kyiv');
const period=(index,startUtc,endUtc,value)=>({index,startUtc,endUtc,value});
// Synthetic shape fixture only: it checks presentation, not astronomy.
const day={date:'2026-11-12',sunriseUtc:'2026-11-12T04:55:00Z',sunsetUtc:'2026-11-12T14:15:00Z',
 nextSunriseUtc:'2026-11-13T04:57:00Z',
 location:{timeZone:kyiv.timeZone,latitude:kyiv.latitude,longitude:kyiv.longitude},
 sunrise:{tithi:{number:3,paksha:'Shukla',numberWithinPaksha:3},nakshatra:{number:4,name:'Rohini',pada:2},
  vara:{number:5,name:'Guruvara'},yoga:{number:16,name:'Siddhi'},karana:{slot:5,name:'Taitila'}},
 periods:{
  tithi:[period(3,'2026-11-11T20:00:00Z','2026-11-12T22:30:00Z',{number:3,paksha:'Shukla',numberWithinPaksha:3}),
   period(4,'2026-11-12T22:30:00Z','2026-11-14T01:00:00Z',{number:4,paksha:'Shukla',numberWithinPaksha:4})],
  nakshatra:[period(4,'2026-11-11T18:00:00Z','2026-11-13T09:00:00Z',{number:4,name:'Rohini',pada:2})],
  yoga:[period(16,'2026-11-12T01:00:00Z','2026-11-12T23:00:00Z',{number:16,name:'Siddhi'}),
   period(17,'2026-11-12T23:00:00Z','2026-11-13T21:00:00Z',{number:17,name:'Vyatipata'})],
  karana:[period(5,'2026-11-11T20:00:00Z','2026-11-12T09:15:00Z',{slot:5,name:'Taitila'}),
   period(6,'2026-11-12T09:15:00Z','2026-11-12T22:30:00Z',{slot:6,name:'Garaja'}),
   period(7,'2026-11-12T22:30:00Z','2026-11-13T11:45:00Z',{slot:7,name:'Vanija'})]}};

test('city allowlist: unique slugs, valid zones and coordinates, every region populated',()=>{
 const slugs=new Set();
 for(const city of PANCHANGA_CITIES){
  assert.match(city.slug,/^[a-z][a-z-]{1,39}$/);assert.ok(!slugs.has(city.slug),city.slug);slugs.add(city.slug);
  assert.ok(city.name.uk&&city.name.en);
  assert.ok(Math.abs(city.latitude)<66&&Math.abs(city.longitude)<=180,city.slug);
  assert.doesNotThrow(()=>new Intl.DateTimeFormat('en',{timeZone:city.timeZone}),city.slug);
 }
 assert.ok(PANCHANGA_CITIES.length>=100);
 for(const region of PANCHANGA_REGIONS)assert.ok(PANCHANGA_CITIES.some(c=>c.region===region.id),region.id);
 assert.equal(panchangaCityBySlug('Kyiv'),null);assert.equal(panchangaCityBySlug('../etc'),null);
 assert.equal(panchangaCityBySlug(null),null);assert.equal(panchangaCityBySlug('delhi').timeZone,'Asia/Kolkata');
});

test('sunrise rows and day changes are derived only from supplied verified periods',()=>{
 const uk=citySunriseRows(day,'uk'),en=citySunriseRows(day,'en');
 assert.deepEqual(uk.map(r=>r.kind),['tithi','nakshatra','vara','yoga','karana']);
 assert.equal(uk[0].value,'Шукла Трітія (3)');assert.equal(en[0].value,'Shukla Tritiya (3)');
 assert.equal(uk[0].until,'00:30, 13 листопада');   // 22:30Z is after local midnight in Kyiv
 assert.equal(uk[1].value,'Рохіні, пада 2');assert.equal(uk[1].until,null); // lasts past next sunrise
 assert.match(uk[2].value,/четвер/);assert.equal(uk[2].until,null);
 assert.equal(en[4].value,'Taitila');assert.equal(en[4].until,'11:15');
 const changes=cityChanges(day,'en');
 assert.deepEqual(changes.map(c=>c.kind),['karana','tithi','karana','yoga']);
 assert.equal(changes[0].at,'11:15');assert.equal(changes[0].value,'Garaja');
 assert.equal(changes[3].value,'Vyatipata');
});

test('labels, clocks and guards',()=>{
 assert.equal(tithiLabel({number:15,paksha:'Shukla',numberWithinPaksha:15},'uk'),'Пурніма (повня)');
 assert.equal(tithiLabel({number:30,paksha:'Krishna',numberWithinPaksha:15},'en'),'Amavasya (new Moon)');
 assert.throws(()=>tithiLabel({number:1,paksha:'X',numberWithinPaksha:1},'en'));
 assert.equal(cityClock(day.sunriseUtc,'Europe/Kyiv','uk'),'06:55');
 assert.equal(cityMoment(day.sunsetUtc,day,'en'),'16:15');
 assert.equal(cityCivilDate(new Date('2026-11-12T22:30:00Z'),'Europe/Kyiv'),'2026-11-13');
 assert.equal(cityCivilDate(new Date('2026-11-12T22:30:00Z'),'America/New_York'),'2026-11-12');
 assert.equal(nextCivilDate('2026-12-31'),'2027-01-01');
 assert.ok(cityDayMatches(day,'2026-11-12',kyiv));
 assert.ok(!cityDayMatches(day,'2026-11-13',kyiv));
 assert.ok(!cityDayMatches(day,'2026-11-12',panchangaCityBySlug('lviv')));
 assert.ok(!cityDayMatches(null,'2026-11-12',kyiv));
 assert.throws(()=>citySunriseRows({...day,periods:{...day.periods,tithi:[]}},'en'));
});

test('route contract: canonical, hreflang, sitemap, directory and no invented data',()=>{
 const page=read('apps/web/app/[locale]/panchanga/[city]/page.tsx');
 assert.match(page,/panchangaCityBySlug\(slug\)/);assert.match(page,/notFound\(\)/);
 assert.match(page,/canonical,languages:\{uk:'\/uk\/'\+path,en:'\/en\/'\+path,'x-default':'\/en\/'\+path\}/);
 assert.match(page,/robots:indexRobots\(\)/);
 assert.match(page,/\/api\/v1\/panchanga\/day\?/);assert.match(page,/cityDayMatches\(day,date,city\)/);
 assert.match(page,/panchanga-city-unavailable/);
 assert.doesNotMatch(page,/'use client'/);
 assert.match(read('apps/web/app/sitemap.ts'),/PANCHANGA_CITIES\.map\(city=>'panchanga\/'\+city\.slug\)/);
 assert.match(read('apps/web/app/[locale]/panchanga/page.tsx'),/<PanchangaCityIndex locale=/);
 const hub=read('apps/web/app/components/PanchangaHub.tsx');
 assert.match(hub,/qs\.get\('city'\)/);assert.match(hub,/panchangaCityBySlug\(slug\)/);
});

// Panchanga Today day plan (registered here so the release needs no package.json change).
import './panchanga-today.test.mjs';
