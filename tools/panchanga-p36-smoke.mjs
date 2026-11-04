/** P3.6 nonmutating/unauthenticated release smoke.
 * One public verified 7+30-day batch and private 401 privacy check.
 * No login, real user data, mutations, screenshots, secrets, billing,
 * indexing submissions or any SSH action.
 */
import assert from 'node:assert/strict';
const origin=process.env.P36_SITE_ORIGIN||'http://127.0.0.1:3000';
const root=new URL(origin);
if(!['https:','http:'].includes(root.protocol)||root.username||
 root.password||root.pathname!=='/'||root.search||root.hash)
 throw Error('P36_SITE_ORIGIN must be a plain URL origin');
if(process.env.P36_PUBLIC==='1'&&origin!=='https://galaxiora.com')
 throw Error('P36 public gate must target exact https://galaxiora.com');
const query={zone:'Europe/Kyiv',latitude:'50.4501',longitude:'30.5234'};
const location=Object.assign({},query,{date:'2026-11-02'});
const path=(base,params)=>base+'?'+new URLSearchParams(params).toString();
async function get(endpoint,seconds=60){
 const r=await fetch(new URL(endpoint,root),{
  redirect:'manual',signal:AbortSignal.timeout(seconds*1000),
  headers:{accept:'application/json'}});
 return r;
}
for(const pathName of ['/uk/panchanga','/en/panchanga',
 '/uk/panchanga?view=personal','/en/panchanga?view=personal']){
 const r=await get(pathName,40);
 assert.equal(r.status,200,'Missing bilingual page '+pathName);
 const html=await r.text();
 assert.ok(/Galaxiora|Галаксіора/i.test(html),'Brand not rendered in '+pathName);
}
for(const name of ['resonance','timing','calendar']){
 const privateUrl=name==='calendar'?path('/api/v1/personal/panchanga/calendar',{
  ...query,start:'2026-11-02',days:'7'}):
  path('/api/v1/personal/panchanga/'+name,location);
 const r=await get(privateUrl,20);
 assert.equal(r.status,401,'Private '+name+' exposed to guest');
 assert.match(r.headers.get('cache-control')||'',/no-store/i,
  'Private denial must be non-cacheable '+name);
 const text=await r.text();
 assert.ok(text.length<2000,'Private denial exposes a large body '+name);
 assert.doesNotMatch(text,/natalPositions|birthDate|natalUtc|dateOfBirth|moonLongitude/i,
  'Guest error should not reveal natal data '+name);
}
for(const days of [7,30]){
 const url=path('/api/v1/panchanga/range',{start:'2026-11-02',days:String(days),...query});
 const r=await get(url,100);
 assert.equal(r.status,200,'Missing public Swiss Panchanga '+days);
 const payload=await r.json();
 assert.equal(payload.version,'panchanga-range-v1');
 assert.equal(payload.scope,'five-angas-at-local-sunrise-not-all-day-intervals');
 assert.equal(payload.observer?.timeZone,'Europe/Kyiv');
 assert.equal(payload.days?.length,days);
 assert.equal(payload.days[0].date,'2026-11-02');
 for(let i=1;i<days;i++){
  assert.equal(payload.days[i-1].nextSunriseUtc,payload.days[i].sunriseUtc,
   'Noncontiguous Swiss sunrise day '+i);
 }
}
if(process.env.P36_PUBLIC==='1'){
 const r=await get('/robots.txt');
 assert.equal(r.status,200);
 const body=await r.text();
 assert.match(body,/Sitemap:.*sitemap\.xml/i);
 assert.doesNotMatch(body,/^Disallow:\s*\/$/mi,'Public Panchanga accidentally blocked');
}
console.log('P36_SMOKE_PASS: UA/EN page, private 401 and non-cacheability, 7/30 verified Swiss continuous sunrise days');
