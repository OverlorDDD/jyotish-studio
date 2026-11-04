/** P2.5 non-mutating public/loopback smoke. No auth, payments, writes or indexing submissions.
 * Set P25_SITE_ORIGIN=https://galaxiora.com after actual cutover.
 */
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const origin=process.env.P25_SITE_ORIGIN||'http://127.0.0.1:3000';
const base=new URL(origin);
if(!['http:','https:'].includes(base.protocol)||base.username||base.password||
 base.pathname!=='/'||base.search||base.hash)
 throw Error('Set P25_SITE_ORIGIN to the plain HTTP(S) site origin');
const params=new URLSearchParams({date:'2026-11-02',start:'2026-11-02',days:'1',
 zone:'Europe/Kyiv',latitude:'50.4501',longitude:'30.5234',monthSystem:'amanta'});
const path=(route,keys=[])=>route+'?'+new URLSearchParams(
 keys.map(k=>[k,params.get(k)])).toString();
let successes=0;
async function request(route,{timeoutMs=50000}={}){
 const r=await fetch(new URL(route,base),{redirect:'manual',signal:AbortSignal.timeout(timeoutMs)});
 if(r.status!==200)throw Error('HTTP '+r.status+' for '+route);
 successes++;return r;
}
for(const route of ['/uk/panchanga','/en/panchanga','/uk/astrology/moon-sign-vs-sun-sign',
 '/en/astrology/moon-sign-vs-sun-sign']){
 const html=await (await request(route)).text();
 if(!html.includes('Galaxiora')||!/panchanga|панчанга|Moon|Місяц/i.test(html))
  throw Error('Missing bilingual/brand content in '+route);
}
const dayPath=path('/api/v1/panchanga/day',['date','zone','latitude','longitude']);
const overviewPath=path('/api/v1/vedic-calendar/overview',
 ['start','days','zone','latitude','longitude','monthSystem']);
const day=await (await request(dayPath)).json();
const view=await (await request(overviewPath)).json();
assert.equal(day.date,'2026-11-02');
assert.equal(view.days?.length,1);
assert.equal(view.observer?.timeZone,'Europe/Kyiv');
assert.equal(view.monthSystem,'amanta');
assert.equal(view.observanceDayCertifiedByTradition,false);
assert.equal(view.astronomicalTimeCertifiedByIndependentReference,false);
const item=view.days[0];
assert.equal(day.sunriseUtc,item.sunriseUtc);
assert.equal(day.sunsetUtc,item.sunsetUtc);
for(const limb of ['tithi','nakshatra','vara','yoga','karana'])
 assert.deepEqual(item.sunriseAngas?.[limb],day.sunrise?.[limb],'Mismatch in '+limb);
for(const e of item.observances||[]){
 assert.equal(e.date,day.date);
 assert.ok(['candidate','astronomical_event'].includes(e.category));
}
for(const phase of view.phaseEvents||[])assert.equal(phase.localDate,day.date);
const robots=await (await request('/robots.txt')).text();
if(process.env.P25_EXPECT_PUBLIC==='1'){
 assert.match(robots,/Sitemap:.*sitemap\.xml/i);
 assert.ok(!/^Disallow: \/$/m.test(robots),'Unexpected public noindex / disallow');
}
if(process.env.P25_VERIFY_BRAND==='1'){
 const approved=readFileSync(new URL('../apps/web/brand-assets/galaxiora-approved-spiral-6.png',import.meta.url));
 for(const route of ['/icon.png','/galaxiora-favicon.png']){
  const got=Buffer.from(await (await request(route)).arrayBuffer());
  assert.deepEqual(got,approved,'Incorrect approved Galaxy spiral #6: '+route);
 }
 const bad=await fetch(new URL('/icon.svg',base),{redirect:'manual',signal:AbortSignal.timeout(10000)});
 assert.equal(bad.status,404,'Old G icon.svg must not override approved spiral #6');
}
console.log('P25_SMOKE_PASS',successes,'HTTP 200 requests; Swiss Panchanga agreement, bilingual SEO and robots checked');
