/** Galaxiora release proof: non-mutating checks against the running local
 * website. Does not open ports, alter the database, publish or expose secrets.
 */
const host=process.env.LAUNCH_SITE_ORIGIN||'http://127.0.0.1:3000';
const errors=[],warnings=[],passed=[];
async function request(path,timeout=13000){
 const r=await fetch(host+path,{signal:AbortSignal.timeout(timeout),redirect:'manual'});
 const body=await r.text();
 return {r,body};
}
async function check(name,path,predicate,required=true){
 try{
  const response=await request(path);
  if(!predicate(response))throw new Error('Unexpected response '+response.r.status);
  passed.push(name);
  return response;
 }catch(error){
  const message=name+': '+(error instanceof Error?error.message:String(error));
  (required?errors:warnings).push(message);
  return null;
 }
}
function validProductionSite(value){
 if(!value)return false;
 try{
  const x=new URL(value);
  return x.protocol==='https:'&&x.pathname==='/'&&!x.search&&!x.hash&&!x.username&&!x.password&&!x.port&&
   !['localhost','127.0.0.1'].includes(x.hostname)&&!x.hostname.endsWith('.ngrok-free.dev')&&
   !x.hostname.endsWith('.trycloudflare.com');
 }catch{return false;}
}
if(!process.env.AUTH_SECRET||process.env.AUTH_SECRET.length<32)
 errors.push('AUTH_SECRET must contain at least 32 characters before public user registration.');
const publicDomain=validProductionSite(process.env.NEXT_PUBLIC_SITE_URL);
const indexEnabled=publicDomain&&process.env.SITE_NOINDEX==='0';
if(!publicDomain)warnings.push('Public domain not configured: SITE_NOINDEX=1 is required; this is a preview, not an SEO launch.');
if(publicDomain&&process.env.SITE_NOINDEX!=='0')warnings.push('HTTPS domain present but SITE_NOINDEX remains enabled: Google indexing intentionally disabled.');
if(process.env.NEWS_INGESTION_ENABLED!=='1')
 warnings.push('NEWS_INGESTION_ENABLED=1 is required for scheduled scans in managed production.');
await check('Homepage UA','/uk',x=>x.r.status===200&&/Galaxiora/.test(x.body));
await check('Homepage EN','/en',x=>x.r.status===200&&/Galaxiora/.test(x.body));
const horoscope=await check('Horoscope 12 signs','/uk/horoscope',x=>x.r.status===200&&/Гороскопи/.test(x.body));
await check('Panchanga','/uk/panchanga',x=>x.r.status===200);
await check('Moon-sign SEO page','/uk/horoscope/aries',x=>x.r.status===200&&/Овен/.test(x.body));
await check('Moon-sign EN SEO page','/en/horoscope/aries',x=>x.r.status===200&&/Aries/.test(x.body));
await check('GalaxiNews','/uk/news',x=>x.r.status===200);
await check('Yoga','/uk/yoga',x=>x.r.status===200);
await check('Public API / health','/api/health',x=>{
 if(x.r.status!==200)return false;try{const b=JSON.parse(x.body);return b.status==='ok'&&b.database==='connected';}catch{return false;}
});
await check('Verified public horoscope API','/api/v1/horoscope/today',x=>{
 if(x.r.status!==200)return false;try{const b=JSON.parse(x.body);return b.reference==='SIDEREAL_MOON_SIGN'&&b.signs?.length===12;}catch{return false;}
});
await check('Worldwide place geocoding','/api/v1/panchanga/cities?q=London&lang=en',x=>{
 if(x.r.status!==200)return false;try{const b=JSON.parse(x.body);return b.items?.some(y=>y.timeZone&&Number.isFinite(y.latitude));}catch{return false;}
});
await check('News scheduler health','/api/v1/news/status',x=>{
 if(x.r.status!==200)return false;try{
  const b=JSON.parse(x.body);
  if(process.env.NEWS_INGESTION_ENABLED==='1'&&!b.running)return false;
  if(!b.lastScan)warnings.push('No completed GalaxiNews scan yet; inspect admin diagnostics after initial scan.');
  return true;
 }catch{return false;}
});
const robots=await check('Robots policy','/robots.txt',x=>x.r.status===200);
if(robots){
 if(indexEnabled&&!/Sitemap:.*sitemap\.xml/i.test(robots.body))errors.push('Public robots.txt does not list a sitemap.');
 if(!indexEnabled&&!/Disallow: \//i.test(robots.body))errors.push('Preview robots.txt must block crawlers.');
}
if(indexEnabled){
 await check('SEO sitemap','/sitemap.xml',x=>x.r.status===200&&
  x.body.includes('/uk/horoscope/aries')&&x.body.includes('/en/horoscope/aries')&&x.body.includes('/uk/panchanga'));
 if(horoscope&&/content="noindex"|content='noindex'|noindex,nofollow/i.test(horoscope.body))
  errors.push('Public horoscope remains noindex while release indexing is enabled.');
}
for(const p of passed)console.log('PASS',p);
for(const w of warnings)console.warn('CHECK',w);
for(const e of errors)console.error('BLOCKED',e);
console.log('\nRelease checks: '+passed.length+' PASS, '+warnings.length+' notes, '+errors.length+' blockers.');
console.log('Mode: '+(indexEnabled?'PUBLIC SEARCH INDEXING':'PRIVATE/NOINDEX PREVIEW'));
process.exitCode=errors.length?1:0;
