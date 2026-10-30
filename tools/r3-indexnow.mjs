/** IndexNow is OFF by default. Submit only after deploying to an owned domain,
 * publishing the verification key file and explicitly passing --submit.
 */
import {existsSync} from 'node:fs';
import {publicIndexingEnabled,publicSiteOrigin,SEO_PATHS} from '../apps/web/lib/site-indexing.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
const origin=publicSiteOrigin(),submit=process.argv.includes('--submit');
const key=process.env.INDEXNOW_KEY||'';
const validKey=/^[A-Za-z0-9-]{8,128}$/.test(key);
if(!submit){
 console.log('[IndexNow] DRY RUN, no HTTP requests sent.');
 console.log({indexingEnabled:publicIndexingEnabled(),siteOrigin:origin,
  keyConfigured:validKey,staticSections:SEO_PATHS.length,
  next:'After deployment, place a UTF-8 file named <INDEXNOW_KEY>.txt in apps/web/public/ with the key as its only content. Verify it at your HTTPS site. Then run this command with --submit only for changed URLs.'});
 process.exit(0);
}
if(!publicIndexingEnabled()||!origin||!validKey)throw Error('Blocked: owned HTTPS URL, SITE_NOINDEX=0 and a valid 8-128 character INDEXNOW_KEY required.');
const keyLocation=origin+'/'+key+'.txt';
const [verify,sitemap]=await Promise.all([
 fetch(keyLocation,{signal:AbortSignal.timeout(9000),redirect:'error'}),
 fetch(origin+'/sitemap.xml',{signal:AbortSignal.timeout(9000),redirect:'error'})
]);
if(!verify.ok||(await verify.text()).trim()!==key)
 throw Error('Blocked: public IndexNow key file missing/mismatched at the owned domain.');
if(!sitemap.ok)throw Error('Blocked: public sitemap unavailable.');
const xml=await sitemap.text();
const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1].replace(/&amp;/g,'&'))
 .filter(x=>{try{const u=new URL(x);return u.origin===origin&&!u.search&&!u.hash}catch{return false;}});
if(!urls.length||urls.length>10000)throw Error('Blocked: invalid, empty or too large canonical sitemap.');
const response=await fetch('https://api.indexnow.org/indexnow',{
 method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},
 body:JSON.stringify({host:new URL(origin).hostname,key,keyLocation,urlList:urls}),
 signal:AbortSignal.timeout(15000)
});
console.log('[IndexNow] POST returned HTTP '+response.status+' for '+urls.length+' own-domain canonical URLs.');
if(!response.ok)process.exitCode=2;
