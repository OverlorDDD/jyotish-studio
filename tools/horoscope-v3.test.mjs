import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GOCHARA_GOOD,composeDay,houseFrom,inRange,moonPhase,passport,ratings,validSign,validSystem} from '../apps/api/src/horoscope-v3.ts';
import {MOON_HOUSE,LOVE_BY_HOUSE,WORK_BY_HOUSE,MONEY_BY_HOUSE,HEALTH_BY_HOUSE,SUN_HOUSE,WEEKDAY} from '../apps/api/src/horoscope-v3-texts.ts';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

const sky=(system,date,lon)=>({system,date,sampledAtUtc:date+'T10:00:00.000Z',
 pos:Object.fromEntries(Object.entries(lon).map(([k,v])=>[k,{sign:Math.floor(v/30)+1,longitude:v}])),
 ...(system==='vedic'?{moonNakshatra:{name:'Shravana',pada:2}}:{})});
const base={Sun:232,Moon:280,Mercury:250,Venus:200,Mars:260,Jupiter:130,Saturn:350};

test('Horoscope v3: classical Gochara table and whole-sign houses',()=>{
 assert.deepEqual(GOCHARA_GOOD.Moon,[1,3,6,7,10,11]);
 assert.deepEqual(GOCHARA_GOOD.Jupiter,[2,5,7,9,11]);
 assert.deepEqual(GOCHARA_GOOD.Saturn,[3,6,11]);
 assert.equal(houseFrom(8,8),1);
 assert.equal(houseFrom(8,3),8,'Gemini is the 8th from Scorpio');
 assert.equal(houseFrom(12,1),2);
});

test('Horoscope v3: Chandrashtama (Moon in the 8th) caps every rating and is flagged',()=>{
 // Moon in Gemini (sign 3) is the 8th from Scorpio (sign 8).
 const s=sky('vedic','2026-11-14',{...base,Moon:75});
 const r=ratings(8,s);
 assert.ok(r.mood<=2);
 for(const c of ['love','work','money','health'])assert.ok(r[c]<=3,c);
 const d=composeDay('vedic',8,s,[]);
 assert.equal(d.chandrashtama,true);
 assert.equal(d.moon.house,8);
});

test('Horoscope v3: every sign gets a complete bilingual reading in both systems',()=>{
 for(const system of ['western','vedic'])for(let sign=1;sign<=12;sign++){
  const d=composeDay(system,sign,sky(system,'2026-11-14',base),[{uk:'Подія',en:'Event'}]);
  for(const c of ['mood','love','work','money','health']){
   assert.ok(Number.isInteger(d.ratings[c])&&d.ratings[c]>=1&&d.ratings[c]<=5,system+sign+c);
  }
  for(const field of [d.headline,d.intro,d.theme,d.sections.love,d.sections.work,d.sections.money,d.sections.health]){
   assert.ok(field.uk.length>3&&field.en.length>3);
   assert.doesNotMatch(field.uk,/undefined|NaN/);
  }
  assert.ok(d.good.length>=2&&d.avoid.length>=1);
  assert.ok(d.why.length>=2,'the forecast explains which transits it used');
  assert.match(d.color.hex,/^#[0-9A-F]{6}$/i);
  assert.equal(d.moon.house,houseFrom(sign,d.moon.sign));
 }
});

test('Horoscope v3: texts are complete for all 12 houses and written in the polite «ви» voice',()=>{
 for(const list of [MOON_HOUSE,LOVE_BY_HOUSE,WORK_BY_HOUSE,MONEY_BY_HOUSE,HEALTH_BY_HOUSE,SUN_HOUSE])assert.equal(list.length,12);
 assert.equal(WEEKDAY.length,7);
 const uk=source('apps/api/src/horoscope-v3-texts.ts');
 assert.doesNotMatch(uk,/\b(твій|твоя|твоє|тобі|тебе|зроби|подумай)\b/i,'public horoscope speaks to readers as «ви»');
});

test('Horoscope v3: Moon phase follows Sun–Moon elongation',()=>{
 assert.equal(moonPhase(sky('western','2026-11-14',{...base,Sun:100,Moon:105})),'new');
 assert.equal(moonPhase(sky('western','2026-11-14',{...base,Sun:100,Moon:190})),'waxing');
 assert.equal(moonPhase(sky('western','2026-11-14',{...base,Sun:100,Moon:282})),'full');
 assert.equal(moonPhase(sky('western','2026-11-14',{...base,Sun:100,Moon:20})),'waning');
});

test('Horoscope v3: request validation rejects junk and far-away dates',()=>{
 assert.equal(validSign('8'),8);
 for(const bad of ['0','13','x','1.5',null])assert.equal(validSign(bad),null);
 assert.equal(validSystem('vedic'),'vedic');
 assert.equal(validSystem('chinese'),null);
 assert.equal(inRange('2026-11-14','2026-11-14'),true);
 assert.equal(inRange('2026-11-01','2026-11-14'),true,'the whole current month is readable');
 assert.equal(inRange('2026-10-20','2026-11-14'),false);
 assert.equal(inRange('2027-02-01','2026-11-14'),false);
 assert.equal(inRange('2026-13-01','2026-11-14'),false);
});

test('Horoscope v3: API exposes v3 endpoints and the passport never stores or logs birth data',()=>{
 const api=source('apps/api/src/horoscope.ts');
 for(const route of ["'v3/day'","'v3/all'","'v3/period'","'v3/passport'"])assert.ok(api.includes(route),route);
 assert.match(api,/@Post\('v3\/passport'\)/,'birth data travels in a POST body, never a URL');
 const engine=source('apps/api/src/horoscope-v3.ts');
 assert.doesNotMatch(engine,/prisma|console\.(log|info)/i);
 const form=source('apps/web/app/components/horoscope/Passport.tsx');
 assert.match(form,/method:'POST'/);
 assert.doesNotMatch(form,/localStorage\.setItem\([^)]*date/i,'only the resulting signs may be remembered');
});

test('Horoscope v3 passport: 27 March 1996 is tropical Aries but sidereal Pisces with a Gemini Moon',{timeout:60000},async t=>{
 let result;
 try{result=await passport({date:'1996-03-27',time:'14:00',zone:'Europe/Kyiv'});}
 catch(error){if(/swisseph|ephemeris backend/i.test(String(error))){t.skip('Swiss Ephemeris is not installed here');return;}throw error;}
 assert.equal(result.western.sunSign,1);
 assert.equal(result.vedic.sunSign,12);
 assert.deepEqual(result.vedic.moonSigns,[3]);
 assert.ok(result.vedic.nakshatra?.name);
 assert.ok(result.ayanamshaDegrees>23.7&&result.ayanamshaDegrees<24.3);
 const noTime=await passport({date:'1996-03-27'});
 assert.equal(noTime.timeKnown,false);
 assert.ok(noTime.vedic.moonSigns.includes(3));
});
