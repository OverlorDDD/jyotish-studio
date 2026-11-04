#!/usr/bin/env node
/**
 * Read-only, authorized Google URL Inspection for Galaxiora. Never requests indexing.
 * Usage (from repo root):
 *   node tools/gsc-url-inspection.mjs --dry-run
 *   GSC_SERVICE_ACCOUNT_FILE=/path/to/reader.json node tools/gsc-url-inspection.mjs --limit=50
 *   GSC_SERVICE_ACCOUNT_FILE=/path/to/reader.json node tools/gsc-url-inspection.mjs --all
 *
 * Search Console permission for the service-account email and enabled Search Console
 * API are necessary. Uses webmasters.readonly OAuth scope, not Indexing API.
 * Never prints private keys, access tokens, or any personally identifiable user data.
 */
import {existsSync, readFileSync} from 'node:fs';
import {createSign} from 'node:crypto';

const ROOT='https://galaxiora.com';
const SITE='sc-domain:galaxiora.com';
const SCOPE='https://www.googleapis.com/auth/webmasters.readonly';
const ENDPOINT='https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
const args=process.argv.slice(2);
const help=args.includes('--help')||args.includes('-h');
const dryRun=args.includes('--dry-run');
const all=args.includes('--all');
const json=args.includes('--json');
const found=args.find(x=>x.startsWith('--limit='));
const limit=all?200:Number(found?.slice('--limit='.length)||50);
if(!Number.isInteger(limit)||limit<1||limit>200)throw Error('Use --limit=1..200 or --all');
if(help){
 console.log('Read-only Search Console URL Inspection for Galaxiora. --dry-run [--limit=50], --all, --json.');
 console.log('Set GSC_SERVICE_ACCOUNT_FILE to a local service-account JSON path; add its client_email as a Search Console property user.');
 process.exit(0);
}
const encode=value=>Buffer.from(value).toString('base64url');
const timeout=ms=>AbortSignal.timeout(ms);
const xmlRes=await fetch(ROOT+'/sitemap.xml',{signal:timeout(15000)});
if(xmlRes.status!==200)throw Error('Canonical sitemap is not HTTP 200: '+xmlRes.status);
const xml=await xmlRes.text();
const allUrls=[...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
 .map(m=>m[1].replaceAll('&amp;','&')).filter(u=>{
  try{
   const u2=new URL(u);
   return u2.origin===ROOT&&/^\/(en|uk)(?:\/|$)/.test(u2.pathname)&&!u2.search&&!u2.hash;
  }catch{return false;}
 }))];
const pedia=allUrls.filter(u=>/^\/(en|uk)\/pedia(?:\/|$)/.test(new URL(u).pathname));
const selected=(all?allUrls:pedia).slice(0,limit);
if(!selected.length)throw Error('No localized canonical URLs found for inspection');
if(dryRun){
 console.log(JSON.stringify({mode:'DRY_RUN_NO_GOOGLE_API_CALL',property:SITE,sitemapUrls:allUrls.length,
  relevantPediaUrls:pedia.length,selected: selected.length,urls:selected},null,2));
 process.exit(0);
}

const keyFile=process.env.GSC_SERVICE_ACCOUNT_FILE||process.env.GOOGLE_APPLICATION_CREDENTIALS||
 '/home/ubuntu/.ga4-upload/ga4-reader.json';
if(!existsSync(keyFile))throw Error('Service-account key file unavailable on this server. Set GSC_SERVICE_ACCOUNT_FILE to an existing protected local JSON path.');
const key=JSON.parse(readFileSync(keyFile,'utf8'));
if(key.type!=='service_account'||typeof key.client_email!=='string'||typeof key.private_key!=='string')
 throw Error('Credential JSON must be a valid local Google service-account file.');
const now=Math.floor(Date.now()/1000);
const header=encode(JSON.stringify({alg:'RS256',typ:'JWT'}));
const payload=encode(JSON.stringify({iss:key.client_email,scope:SCOPE,aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3000}));
const signingInput=header+'.'+payload;
const signer=createSign('RSA-SHA256');signer.update(signingInput);signer.end();
const assertion=signingInput+'.'+signer.sign(key.private_key,'base64url');
const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{
 method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),
 signal:timeout(15000)
});
if(!tokenResponse.ok)throw Error('Google OAuth denied service account: HTTP '+tokenResponse.status+' (credentials, time or API access).');
const token=(await tokenResponse.json()).access_token;
if(typeof token!=='string')throw Error('Google OAuth response missing access_token');

const statuses=[];
for(const url of selected){
 const response=await fetch(ENDPOINT,{
  method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({inspectionUrl:url,siteUrl:SITE,languageCode:'en-US'}),
  signal:timeout(20000)
 });
 if(!response.ok){
  const body=await response.text();
  const code=(()=>{try{return JSON.parse(body)?.error?.status||'UNKNOWN'}catch{return 'UNKNOWN'}})();
  if([401,403].includes(response.status)){
   throw Error('URL Inspection API HTTP '+response.status+' ('+code+'). Grant service-account '+key.client_email+' access to Search Console domain property and enable the Search Console API in its Google Cloud project.');
  }
  if(response.status===429)throw Error('Google URL Inspection API quota exceeded; stop and retry only after quota reset.');
  statuses.push({url,error:'HTTP '+response.status+' '+code});
  continue;
 }
 const result=(await response.json()).inspectionResult||{};
 const index=result.indexStatusResult||{};
 statuses.push({
  url,
  verdict:index.verdict||null,
  coverageState:index.coverageState||null,
  robotsTxtState:index.robotsTxtState||null,
  indexingState:index.indexingState||null,
  pageFetchState:index.pageFetchState||null,
  lastCrawlTime:index.lastCrawlTime||null,
  googleCanonical:index.googleCanonical||null,
  userCanonical:index.userCanonical||null,
  referringUrls:(index.referringUrls||[]).slice(0,4),
  inspectionResultLink:result.inspectionResultLink||null
 });
}
const counts={};
for(const v of statuses){const k=v.error?'API_ERROR':v.coverageState||v.verdict||'UNKNOWN';counts[k]=(counts[k]||0)+1}
const report={mode:'READ_ONLY_GSC_INSPECT',site:SITE,generatedAt:new Date().toISOString(),
 sitemapUrls:allUrls.length,relevantPediaUrls:pedia.length,inspected:statuses.length,counts,items:statuses};
if(json)console.log(JSON.stringify(report,null,2));
else{
 console.log('GSC_INDEX_INSPECTION_READ_ONLY '+JSON.stringify({inspected:report.inspected,counts}));
 for(const s of statuses)console.log(JSON.stringify(s));
}
if(statuses.some(s=>s.error))process.exitCode=2;
