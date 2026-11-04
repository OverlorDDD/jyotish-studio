/**
 * R4.3 IndexNow: safe dry-run by default.
 *
 * Usage:
 *   npm run r3:indexnow -- --url /en/panchanga
 *   npm run r3:indexnow -- --submit --url /en/panchanga
 *   npm run r3:indexnow -- --submit --file /tmp/galaxiora-changed-urls.txt
 *   npm run r3:indexnow -- --submit --bootstrap  # explicitly ONCE, after site-wide relaunch
 *
 * Precondition: publish https://galaxiora.com/<INDEXNOW_KEY>.txt, with key
 * as the only text, during the website build. No key is committed to GitHub.
 */
import {existsSync,readFileSync} from 'node:fs';
import {publicIndexingEnabled,publicSiteOrigin} from '../apps/web/lib/site-indexing.ts';
import {normalizeIndexNowUrls,parseIndexNowArgs,parseIndexNowSitemap,MAX_CHANGED_URLS} from './r43-indexnow-core.mjs';

if(existsSync('.env'))process.loadEnvFile('.env');
const args=parseIndexNowArgs(process.argv.slice(2));
if(args.help) {
 console.log('Usage: npm run r3:indexnow -- [--url /en/path ... | --file changed-urls.txt | --bootstrap] [--submit]');
 console.log('Default is dry-run; --submit requires published verification key and sitemap membership.');
 process.exit(0);
}
const origin=publicSiteOrigin();
const validKey=/^[A-Za-z0-9-]{8,128}$/.test(process.env.INDEXNOW_KEY||'');
const input=[...args.urls];
for(const file of args.files){
 const contents=readFileSync(file,'utf8');
 if(contents.length>50_000)throw Error('Changed URL file too large');
 input.push(...contents.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#')));
}
if(input.length>MAX_CHANGED_URLS)throw Error('Changed URL batch exceeds '+MAX_CHANGED_URLS+' entries');
const changed=input.length?normalizeIndexNowUrls(input,origin||'https://galaxiora.com'):[];

if(!args.submit){
 console.log('[IndexNow] DRY RUN; no HTTP requests sent.');
 console.log(JSON.stringify({
  siteOrigin:origin,indexingEnabled:publicIndexingEnabled(),keyConfigured:validKey,
  mode:args.bootstrap?'explicit bootstrap':changed.length?'changed URLs':'no URLs selected',
  changedCount:changed.length,changedUrls:changed,
  next:'Prepare and publish <INDEXNOW_KEY>.txt at the site root before web build; then use --submit with --url/--file. Only use --bootstrap once if the whole site was changed.'
 },null,2));
 process.exit(0);
}
if(!publicIndexingEnabled()||!origin||!validKey)
 throw Error('Blocked: SITE_NOINDEX=0, NEXT_PUBLIC_SITE_URL=https://your-owned-domain and valid INDEXNOW_KEY required');
if(!args.bootstrap&&!changed.length)
 throw Error('Refusing an empty IndexNow submission');

const key=process.env.INDEXNOW_KEY;
const keyLocation=origin+'/'+key+'.txt';
const [verification,sitemap]=await Promise.all([
 fetch(keyLocation,{signal:AbortSignal.timeout(9000),redirect:'error'}),
 fetch(origin+'/sitemap.xml',{signal:AbortSignal.timeout(9000),redirect:'error'})
]);
if(!verification.ok||(await verification.text()).trim()!==key)
 throw Error('Blocked: public IndexNow key file missing or content mismatch');
if(!sitemap.ok)throw Error('Blocked: live sitemap unavailable (HTTP '+sitemap.status+')');
const sitemapUrls=parseIndexNowSitemap(await sitemap.text(),origin);
const allowed=new Set(sitemapUrls);
const urls=args.bootstrap?sitemapUrls:changed;
const missing=urls.filter(url=>!allowed.has(url));
if(missing.length)
 throw Error('Blocked: changed URL not in canonical live sitemap: '+missing.slice(0,3).join(', '));
if(!urls.length)throw Error('No canonical URLs to submit');

const response=await fetch('https://api.indexnow.org/indexnow',{
 method:'POST',
 headers:{'Content-Type':'application/json; charset=utf-8'},
 body:JSON.stringify({host:new URL(origin).hostname,key,keyLocation,urlList:urls}),
 signal:AbortSignal.timeout(15000),
 redirect:'error'
});
console.log('[IndexNow] HTTP '+response.status+' for '+urls.length+' canonical public URLs; mode='+(args.bootstrap?'bootstrap':'changed'));
if(response.status===202){
 console.log('[IndexNow] Received; ownership validation pending. This is NOT proof of indexing.');
}else if(response.status===200){
 console.log('[IndexNow] Received successfully. This is NOT proof of indexing.');
}else{
 console.error('[IndexNow] Rejected. Check public key, 429 Retry-After and live sitemap; do not retry unchanged URLs in a loop.');
 process.exitCode=2;
}
