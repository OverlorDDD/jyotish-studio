/** P3.8.8 public, NONMUTATING on-host and HTTPS release acceptance.
 * Public verified astronomy + bilingual HTML + owner-only 401 + no-store.
 * Never supplies real birth data, authentication cookies, or executes writes.
 */
import assert from 'node:assert/strict';
const origin=process.env.P388_SITE_ORIGIN||'http://127.0.0.1:3000';
const url=new URL(origin);
if(!['http:','https:'].includes(url.protocol)||url.username||url.password||
 url.pathname!=='/'||url.search||url.hash||url.origin!==origin.replace(/\/$/,''))
 throw Error('P388_SITE_ORIGIN must be an uncredentialed exact HTTP(S) origin');
if(process.env.P388_PUBLIC==='1'&&origin!=='https://galaxiora.com')
 throw Error('Public P388 smoke must verify https://galaxiora.com');
const query={start:'2026-11-01',date:'2026-11-03',zone:'Europe/Kyiv',
 latitude:'50.4501',longitude:'30.5234',monthSystem:'amanta'};
const q=(name,fields)=>name+'?'+new URLSearchParams(
 fields.map(x=>[x,query[x]])).toString();
async function get(path,seconds=80){
 return fetch(new URL(path,url),{redirect:'manual',cache:'no-store',
  headers:{accept:'application/json'},signal:AbortSignal.timeout(seconds*1000)});
}
const day=q('/api/v1/panchanga/day',['date','zone','latitude','longitude']);
const overview=q('/api/v1/vedic-calendar/overview',
 ['start','zone','latitude','longitude','monthSystem'])+'&days=31';
const range=q('/api/v1/panchanga/range',['start','zone','latitude','longitude'])+'&days=31';
for(const route of ['/uk/panchanga?date=2026-11-03','/en/panchanga?date=2026-11-03',
 '/uk/news','/en/news']){
 const r=await get(route,35);
 assert.equal(r.status,200,'Bilingual public page missing '+route);
 const content=await r.text();
 assert.match(content,/Galaxiora|Галаксіора/i,'Branded HTML missing '+route);
 assert.doesNotMatch(content,/AZURE_TRANSLATOR_KEY|AUTH_SECRET|DATABASE_URL/);
}
const requests=await Promise.all([get(day,70),get(overview,110),get(range,110)]);
for(const r of requests)assert.equal(r.status,200,
 'Verified public Swiss day/month unavailable: '+r.status);
const [one,calendar,full]=await Promise.all(requests.map(x=>x.json()));
assert.equal(one.date,'2026-11-03');
assert.equal(calendar.days.length,31);
assert.equal(full.days.length,31);
assert.equal(calendar.days[2].date,one.date);
assert.equal(calendar.days[2].sunriseUtc,one.sunriseUtc);
assert.equal(calendar.days[2].nextSunriseUtc,one.nextSunriseUtc);
assert.equal(full.days[2].sunriseUtc,one.sunriseUtc);
assert.equal(calendar.astronomyProfile,one.astronomyProfile);
assert.equal(full.astronomyProfile,one.astronomyProfile);
for(const limb of ['tithi','nakshatra','vara','yoga','karana']){
 assert.deepEqual(calendar.days[2].sunriseAngas[limb],one.sunrise[limb],
  'Independent day/31-day five-limb exact parity: '+limb);
 assert.deepEqual(full.days[2].sunrise[limb],one.sunrise[limb],
  'Public range/day five-limb exact parity: '+limb);
}
for(const [body,cache] of [
 [q('/api/v1/personal/panchanga/calendar',['start','zone','latitude','longitude'])+'&days=31',true],
 ['/api/v1/personal/profile',true]
]){
 const r=await get(body,20);
 assert.equal(r.status,401,'Private owner endpoint must reject guests');
 if(cache)assert.match(r.headers.get('cache-control')||'',/no-store/i);
}
for(const api of ['time-finder','event-lagna']){
 const r=await fetch(new URL('/api/v1/personal/panchanga/'+api,url),{
  method:'POST',redirect:'manual',cache:'no-store',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({activityId:'foundation',atUtc:'2027-04-10T12:00:00.000Z',
   timeZone:'Europe/Kyiv',latitude:50.4501,longitude:30.5234,days:7}),
  signal:AbortSignal.timeout(20000)});
 assert.equal(r.status,401,'Private election mutation exposed to guest '+api);
 assert.match(r.headers.get('cache-control')||'',/no-store/i);
}
const robots=await get('/robots.txt');
assert.equal(robots.status,200);
if(process.env.P388_PUBLIC==='1'){
 const text=await robots.text();
 assert.match(text,/Sitemap:.*sitemap\.xml/i);
 assert.doesNotMatch(text,/^Disallow:\s*\/$/mi,'Live indexability regressed');
}
console.log('P388_PUBLIC_SMOKE_PASS: UA/EN pages; 31-day/month/day five-limb parity; source profile; owner 401; no-store; robots');
