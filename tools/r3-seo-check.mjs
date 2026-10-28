/** R3 live-only SEO checks. Run while the site is up in a second shell.
 * Never submits a URL or changes indexing without explicit deployment.
 */
import {existsSync} from 'node:fs';
import {publicIndexingEnabled,publicSiteOrigin} from '../apps/web/lib/site-indexing.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
const site=process.env.R3_SITE_ORIGIN||process.env.LAUNCH_SITE_ORIGIN||'http://127.0.0.1:3000';
const published=publicIndexingEnabled();
const origin=publicSiteOrigin();
const errors=[],notes=[],passed=[];
async function get(path){
 const response=await fetch(site+path,{signal:AbortSignal.timeout(20000),redirect:'manual'});
 return {status:response.status,body:await response.text(),headers:response.headers};
}
async function test(label,path,inspect){
 try{
  const result=await get(path);
  if(result.status!==200||!inspect(result))throw Error('HTTP '+result.status+' or missing expected SEO markers');
  passed.push(label);
 }catch(e){errors.push(label+': '+(e instanceof Error?e.message:String(e)));}
}
const routes=[
 ['Homepage UA','/uk','Galaxiora'],['Homepage EN','/en','Galaxiora'],
 ['Methodology UA','/uk/methodology','Методологія розрахунків'],
 ['Methodology EN','/en/methodology','calculation methods'],
 ['Moon-sign editorial page','/uk/horoscope/aries','Місячний гороскоп']
];
for(const [name,path,content] of routes){
 await test(name,path,x=>{
  const body=x.body;
  if(!body.includes(content))return false;
  if(published){
   if(!body.includes('rel="canonical"')||!body.includes(origin+path))return false;
   if(!body.includes('hreflang="uk"')||!body.includes('hreflang="en"'))return false;
   if(/<meta[^>]*name="robots"[^>]*noindex/i.test(body))return false;
  }
  return true;
 });
}
await test('robots.txt','/robots.txt',x=>
 published?/User-agent: OAI-SearchBot/i.test(x.body)&&
  /Sitemap:.*sitemap\.xml/i.test(x.body):
  /Disallow:\s*\//i.test(x.body));
await test('sitemap policy','/sitemap.xml',x=>
 published?x.body.includes(origin+'/uk/methodology')&&
  x.body.includes(origin+'/en/methodology')&&!x.body.includes('/uk/account'):
  !x.body.includes('http://127.0.0.1:3000/uk/methodology'));
if(!published)notes.push('Correct private NOINDEX preview; cannot certify public Google or AI crawler accessibility yet');
else notes.push('Public HTML/robots/sitemap checked: Search Console/Bing ownership, actual bot access and indexing require external verification');
passed.forEach(x=>console.log('PASS',x));
notes.forEach(x=>console.warn('CHECK',x));
errors.forEach(x=>console.error('BLOCKED',x));
console.log(JSON.stringify({stage:'R3',mode:published?'PUBLIC_SEO':'PRIVATE_PREVIEW',
 url:site,passes:passed.length,blockers:errors.length},null,2));
process.exitCode=errors.length?2:0;
