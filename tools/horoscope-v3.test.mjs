import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GOCHARA_GOOD,composeDay,houseFrom,inRange,matchCouple,moonPhase,passport,ratings,validSign,validSystem} from '../apps/api/src/horoscope-v3.ts';
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

/* ---------- Phase 2: compatibility ---------- */
import {ALL_PAIRS,pairContent,parsePair,westernScores,vedicSignLevel} from '../apps/web/lib/compatibility.ts';
import {SIGNS} from '../apps/web/lib/horoscope-signs.ts';

test('Compatibility: exactly 78 canonical pairs, each with complete original content',()=>{
 assert.equal(ALL_PAIRS.length,78);
 assert.equal(new Set(ALL_PAIRS.map(p=>p.slug)).size,78);
 const taglines=new Set();
 for(const p of ALL_PAIRS){
  const c=pairContent(p);
  assert.ok(c.tagline?.uk&&c.tagline?.en,p.slug+' tagline');
  assert.ok(c.element?.text?.uk,p.slug+' element text');
  assert.ok(c.aspect.strengths.length>=3&&c.aspect.challenges.length>=2);
  taglines.add(c.tagline.uk);
  for(const v of Object.values(c.western))assert.ok(v>=30&&v<=97,p.slug);
  assert.equal(c.vedic.max,15);
  assert.ok(c.vedic.total>=0&&c.vedic.total<=15);
 }
 assert.equal(taglines.size,78,'every pair has its own line');
});

test('Compatibility: pair URLs are canonical in zodiac order and symmetric',()=>{
 assert.deepEqual({slug:parsePair('aries-leo').slug,canonical:parsePair('aries-leo').canonical},{slug:'aries-leo',canonical:true});
 assert.deepEqual({slug:parsePair('leo-aries').slug,canonical:parsePair('leo-aries').canonical},{slug:'aries-leo',canonical:false});
 assert.equal(parsePair('aries-nope'),null);
 assert.equal(parsePair('../etc'),null);
 for(const a of SIGNS)for(const b of SIGNS){
  assert.deepEqual(westernScores(a,b),westernScores(b,a));
  assert.equal(vedicSignLevel(a,b).total,vedicSignLevel(b,a).total);
 }
 // Trines (same element) outrank squares for every sign.
 for(const a of SIGNS)assert.ok(westernScores(a,SIGNS[(a.n+3)%12]).overall>westernScores(a,SIGNS[(a.n+2)%12]).overall,a.slug);
});

test('Compatibility: routes, sitemap and the private 36-guna endpoint are wired',()=>{
 const sitemap=source('apps/web/app/sitemap.ts');
 assert.match(sitemap,/'horoscope\/compatibility',\.\.\.ALL_PAIRS\.map/);
 const pairRoute=source('apps/web/app/[locale]/horoscope/compatibility/[pair]/page.tsx');
 assert.match(pairRoute,/permanentRedirect\(compatPath\(locale,pair\.slug\)\)/,'reverse-order URLs consolidate');
 const api=source('apps/api/src/horoscope.ts');
 assert.match(api,/@Post\('v3\/match'\)/);
 assert.match(api,/v3Match[\s\S]*no-store|no-store[\s\S]*v3Match/);
 const form=source('apps/web/app/components/horoscope/CoupleMatch.tsx');
 assert.match(form,/method:'POST'/);
 assert.doesNotMatch(form,/localStorage/,'couple birth data is never kept in the browser');
});

test('Compatibility: 36-guna matching from real Swiss Moons',{timeout:60000},async t=>{
 const one={date:'1996-03-27',time:'14:00',zone:'Europe/Kyiv'};
 let r;
 try{r=await matchCouple({a:one,b:one});}
 catch(error){if(/swisseph|ephemeris backend/i.test(String(error))){t.skip('Swiss Ephemeris is not installed here');return;}throw error;}
 assert.equal(r.a.moonSign,3,'sidereal Gemini Moon');
 assert.equal(r.ashtakoota.full,true);
 assert.equal(r.ashtakoota.total,28,'identical Moons: everything but Nadi');
 assert.equal(r.approximate,false);
 const loose=await matchCouple({a:{date:'1996-03-27'},b:{date:'1990-03-02',zone:'Europe/Warsaw'}});
 assert.ok(loose.ashtakoota.total>=0&&loose.ashtakoota.total<=36);
 assert.equal(typeof loose.approximate,'boolean');
 await assert.rejects(()=>matchCouple({a:{date:'1996-02-30'},b:one}),/Invalid birth date/);
});

/* ---------- Phase 3: yearly horoscope and share images ---------- */
import {composeYear,validYear,yearReading,YEARS,YEAR_ECLIPSES} from '../apps/api/src/horoscope-year.ts';
import {existsSync,statSync} from 'node:fs';

function yearFixture(system){
 const dates=[];for(let m=1;m<=12;m++)for(const d of [1,8,15,22])dates.push('2027-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'));dates.push('2027-12-31');
 const skies=dates.map((d,i)=>sky(system,d,{Sun:(280+i*7.6)%360,Moon:0,Mercury:(270+i*7.6)%360,Venus:(250+i*9)%360,Mars:(150+i*2)%360,Jupiter:128+i*.6,Saturn:345+i*.4}));
 return {skies,
  jupiter:[{sign:5,from:'2027-01-01',to:'2027-07-25'},{sign:6,from:'2027-07-26',to:'2027-12-31'}],
  saturn:[{sign:12,from:'2027-01-01',to:'2027-06-02'},{sign:1,from:'2027-06-03',to:'2027-10-19'},{sign:12,from:'2027-10-20',to:'2027-12-31'}],
  rahu:system==='vedic'?[{sign:10,from:'2027-01-01',to:'2027-12-31'}]:null,
  stations:[{date:'2027-02-09',body:'Mercury',kind:'retrograde_station',sign:11},{date:'2027-03-03',body:'Mercury',kind:'direct_station',sign:11}],
  eclipses:[{date:'2027-02-06',solar:true,kind:{uk:'кільцеподібне сонячне затемнення',en:'annular solar eclipse'},sign:11}]};
}

test('Year: only catalogued years are served, with the NASA 2027 eclipse list',()=>{
 assert.deepEqual(YEARS,[2027]);
 assert.equal(validYear('2027'),2027);
 for(const bad of ['2026','2100','x',null])assert.equal(validYear(bad),null);
 assert.deepEqual(YEAR_ECLIPSES[2027].map(e=>e.date),['2027-02-06','2027-02-20','2027-07-18','2027-08-02','2027-08-17']);
 assert.match(source('apps/web/app/[locale]/eclipses/2027/page.tsx'),/2027-08-02/,'the yearly forecast and the eclipse page share one catalogue');
});

test('Year: complete bilingual reading for every sign in both systems',()=>{
 for(const system of ['western','vedic'])for(let sign=1;sign<=12;sign++){
  const y=composeYear(system,sign,2027,yearFixture(system));
  assert.equal(y.months.length,12);
  for(const m of y.months){
   assert.ok(m.title.uk&&m.text.en,system+sign);
   for(const c of ['love','work','money','health'])assert.ok(m.ratings[c]>=1&&m.ratings[c]<=5);
   const dates=m.events.map(e=>e.en);assert.deepEqual(dates,[...dates].sort((a,b)=>Date.parse(a.split(':')[0]+' 2027')-Date.parse(b.split(':')[0]+' 2027')),'events are in date order');
  }
  for(const k of ['love','work','money'])assert.equal(y.bestMonths[k].length,3);
  assert.equal(y.carefulMonths.length,2);
  assert.equal(y.jupiter.length,2,'Jupiter changes sign once');
  assert.equal(y.saturn.length,2,'Saturn going back and forth is grouped by house');
  assert.equal(y.saturn.find(s=>s.periods.length===2)?.periods[1].from,'2027-10-20');
  assert.equal(system==='vedic',Boolean(y.rahu));
 }
});

test('Year: Vedic Saturn phases (Sade Sati, Ashtama, Kantaka) are read from the Moon sign',()=>{
 const aries=composeYear('vedic',1,2027,yearFixture('vedic'));
 assert.deepEqual(aries.saturnPhase.map(p=>p.key),['sadeSati1','sadeSati2'],'Saturn in Pisces then Aries');
 assert.equal(aries.saturnPhase[0].periods.length,2);
 const pisces=composeYear('vedic',12,2027,yearFixture('vedic'));
 assert.deepEqual(pisces.saturnPhase.map(p=>p.key),['sadeSati2','sadeSati3']);
 const virgo=composeYear('vedic',6,2027,yearFixture('vedic'));
 assert.deepEqual(virgo.saturnPhase.map(p=>p.key),['ashtama'],'Pisces is 7th from Virgo (no phase), Aries is 8th');
 assert.deepEqual(virgo.saturnPhase[0].periods,[{from:'2027-06-03',to:'2027-10-19'}]);
 const sagittarius=composeYear('vedic',9,2027,yearFixture('vedic'));
 assert.deepEqual(sagittarius.saturnPhase.map(p=>p.key),['kantaka'],'Pisces is 4th from Sagittarius');
 const leo=composeYear('vedic',5,2027,yearFixture('vedic'));
 assert.deepEqual(leo.saturnPhase.map(p=>p.key),['ashtama'],'Pisces is 8th from Leo');
 assert.deepEqual(composeYear('western',1,2027,yearFixture('western')).saturnPhase,[],'Sade Sati is a Vedic concept only');
});

test('Year: routes, sitemap, API and share images are wired',()=>{
 assert.match(source('apps/api/src/horoscope.ts'),/@Get\('v3\/year'\)/);
 assert.match(source('apps/web/lib/horoscope-signs.ts'),/export const HORO_YEAR=2027;/);
 assert.match(source('apps/web/app/sitemap.ts'),/'\/'\+HORO_YEAR\]/);
 for(const dir of ['[sign]','[sign]/[period]','vedic/[sign]','vedic/[sign]/[period]','compatibility','compatibility/[pair]'])
  assert.ok(existsSync(new URL('../apps/web/app/[locale]/horoscope/'+dir+'/opengraph-image.tsx',import.meta.url)),dir);
 for(const f of ['Inter-Bold.otf','Inter-Medium.otf','DejaVuSans-zodiac.ttf','OFL-1.1-Inter.txt','LICENSE-DejaVu.txt']){
  const u=new URL('../apps/web/assets/og/'+f,import.meta.url);
  assert.ok(existsSync(u)&&statSync(u).size>1000,f);
 }
 const og=source('apps/web/lib/og-cards.tsx');
 assert.doesNotMatch(og,/fetch\(/,'share images never call the network');
});

test('Year: 2027 from real Swiss ephemeris',{timeout:240000},async t=>{
 let west;
 try{west=await yearReading('western',8,2027);}
 catch(error){if(/swisseph|ephemeris backend/i.test(String(error))){t.skip('Swiss Ephemeris is not installed here');return;}throw error;}
 assert.equal(west.jupiter[0].sign,5,'tropical Jupiter starts 2027 in Leo');
 assert.ok(west.jupiter.some(j=>j.sign===6),'and moves into Virgo');
 assert.ok(west.saturn.some(s=>s.sign===1),'tropical Saturn in Aries');
 assert.equal(west.months.length,12);
 const ved=await yearReading('vedic',1,2027);
 assert.equal(ved.rahu?.[0].sign,10,'sidereal Rahu in Capricorn');
 assert.ok(ved.saturn.some(s=>s.sign===12),'sidereal Saturn in Pisces');
 assert.ok(ved.saturnPhase.some(p=>p.key.startsWith('sadeSati')),'Aries Moon is in Sade Sati');
 assert.ok(ved.months.some(m=>m.events.length>0),'stations and eclipses are listed');
});

/* ---------- Profile: saved natal chart feeds the public tools ---------- */
import {composeMatch,personFromChart} from '../apps/api/src/horoscope-v3.ts';

test('Profile: a saved chart becomes an exact match person (no birth details needed)',()=>{
 // 291° sidereal = 21° Capricorn → Shravana (280°–293°20′).
 const p=personFromChart({westernSunSign:8,vedicSunSign:7,moonLongitude:291});
 assert.equal(p.moonSign,10);
 assert.equal(p.nakshatra.name,'Shravana');
 assert.equal(p.exact,true);
 assert.equal(p.fromProfile,true);
 const r=composeMatch(p,personFromChart({westernSunSign:4,vedicSunSign:3,moonLongitude:291}));
 assert.equal(r.ashtakoota.total,28,'identical Moons');
 assert.equal('point' in r.a,false,'internal Moon point is not returned');
});

test('Profile: private endpoints read only the owner’s charts and never take birth data from storage',()=>{
 const api=source('apps/api/src/personal.ts');
 assert.match(api,/@Get\('horoscope\/signs'\) @Header\('Cache-Control','private, no-store'\)/);
 assert.match(api,/@Post\('horoscope\/match'\)[\s\S]{0,200}const uid=mutation\(req\)/,'same-origin check on the POST');
 assert.match(api,/chart\.findFirst\(\{where:\{id,ownerId:uid\}/,'charts are looked up by owner');
 const helper=source('apps/web/lib/my-signs.ts');
 assert.match(helper,/r\.status===401/);
 assert.doesNotMatch(helper,/localStorage/);
 const passport=source('apps/web/app/components/horoscope/Passport.tsx');
 assert.match(passport,/loadMySigns\(\)/);
 assert.doesNotMatch(passport,/setItem\(LAST,JSON\.stringify\(\{[^}]*\bdate\b/,'only derived signs are remembered');
 const match=source('apps/web/app/components/horoscope/CoupleMatch.tsx');
 assert.match(match,/\/api\/v1\/personal\/horoscope\/match/);
 assert.match(match,/chartId:x\.chartId/);
 const mySign=source('apps/web/app/components/horoscope/MySign.tsx');
 assert.match(mySign,/loadMySigns\(\)/);
});

test('Profile: the Jyotish calculator opens the saved chart unless ?new is asked',()=>{
 const page=source('apps/web/app/astrology/jyotish/page.tsx');
 assert.match(page,/loadMySigns\(\)/);
 assert.match(page,/has\('new'\)/);
 assert.match(page,/\/api\/v1\/account\/charts\/'\+encodeURIComponent\(own\.id\)/);
 assert.match(page,/readingRequestId\.current!==0/,'a calculation the visitor started is never replaced');
 assert.match(page,/startNewChart/);
});
