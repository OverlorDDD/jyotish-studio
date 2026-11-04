/**
 * SEO-1 + GROWTH-3.0 release readiness audit (read-only).
 * No authentication, cookies, POSTs, private data, IndexNow submission or analytics pings.
 * This checks public HTTP SEO contracts, NOT Google's indexing state or real CWV/GA4 receipt.
 * Usage: node tools/seo1-g30-live-audit.mjs --json [--require-pedia]
 * Override only with the official production HTTPS origin or loopback for isolated CI:
 *   SEO1_G30_ORIGIN=http://127.0.0.1:3000 node tools/seo1-g30-live-audit.mjs
 */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const PUBLIC_PATHS=[
 '/en','/uk','/en/astrology/jyotish','/uk/astrology/jyotish',
 '/en/panchanga','/uk/panchanga','/en/tarot','/uk/tarot'
];
const PEDIA_PATHS=['/en/pedia','/uk/pedia',
 '/en/pedia/what-is-tithi-lunar-day','/uk/pedia/what-is-tithi-lunar-day'];
const ENDPOINTS=['/robots.txt','/sitemap.xml'];

export function originAllowed(value){
 try{
  const u=new URL(value);
  const production=u.protocol==='https:'&&u.hostname==='galaxiora.com'&&!u.port;
  const local=u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname);
  return (production||local)&&u.pathname==='/'&&!u.search&&!u.hash&&!u.username&&!u.password;
 }catch{return false;}
}
function tags(html,name){
 return [...html.matchAll(new RegExp('<'+name+'\\b[^>]*>','gi'))].map(m=>m[0]);
}
function attr(tag,name){
 const match=tag.match(new RegExp('(?:\\s|<)'+name+'\\s*=\\s*(["\\x27])([^"\\x27]*)\\1','i'));
 return match?.[2]||null;
}
function link(html,rel,hreflang){
 const all=tags(html,'link');
 return all.find(x=>attr(x,'rel')?.toLowerCase()===rel&&
  (!hreflang||attr(x,'hreflang')===hreflang));
}
export function pageSignals(html,path,expectedOrigin,xrobots=''){
 const language=path.split('/')[1];
 const canonical=attr(link(html,'canonical')||'','href');
 const alternates={en:attr(link(html,'alternate','en')||'','href'),
  uk:attr(link(html,'alternate','uk')||'','href')};
 const htmlLang=attr((html.match(/<html\b[^>]*>/i)||[])[0]||'','lang');
 const robots=tags(html,'meta').filter(t=>
  /^(robots|googlebot)$/i.test(attr(t,'name')||''))
  .map(t=>attr(t,'content')||'').join(' ');
 const h1=(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||'';
 return {
  htmlLang,canonical,alternates,
  indexable:!/noindex/i.test(robots+' '+xrobots),
  h1Present:h1.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().length>0,
  canonicalCorrect:canonical===expectedOrigin+path,
  languagesCorrect:htmlLang===language&&alternates.en===expectedOrigin+'/en'+path.slice(3)&&
   alternates.uk===expectedOrigin+'/uk'+path.slice(3),
  breadcrumbNavigation:/<nav\b[^>]*(aria-label="(?:Breadcrumbs|Навігація)"|class="[^"]*breadcrumb)/i.test(html)
 };
}
export async function audit(options={}){
 const origin=options.origin||'https://galaxiora.com';
 if(!originAllowed(origin))throw Error('SEO1_G30_ORIGIN: use galaxiora.com HTTPS or loopback HTTP only');
 const requirePedia=options.requirePedia===true;
 const fetcher=options.fetcher||fetch;
 const paths=[...PUBLIC_PATHS,...(requirePedia?PEDIA_PATHS:[]),...ENDPOINTS];
 const failures=[],warnings=[],checks=[];
 async function get(path){
  try{
   const response=await fetcher(origin+path,{
    method:'GET',redirect:'manual',signal:AbortSignal.timeout(15000),
    headers:{'user-agent':'Galaxiora-SEO1-G3-readonly/1.0','accept':'text/html,application/xml,text/plain'}
   });
   // Do not retain raw page content in the report; capped body avoids runaway memory.
   const body=(await response.text()).slice(0,350000);
   return {status:response.status,contentType:response.headers.get('content-type')||'',
    xrobots:response.headers.get('x-robots-tag')||'',body};
  }catch(error){return{status:0,body:'',error:String(error?.message||error)};}
 }
 // Concurrent but bounded to three requests; audit never calls POST/private routes.
 const results=new Map();
 for(let i=0;i<paths.length;i+=3){
  const batch=await Promise.all(paths.slice(i,i+3).map(async p=>[p,await get(p)]));
  for(const [p,v] of batch)results.set(p,v);
 }
 function check(path,assertion,pass,detail,warning=false){
  checks.push({path,assertion,pass});
  if(!pass)(warning?warnings:failures).push({path,assertion,detail});
 }
 for(const path of PUBLIC_PATHS.concat(requirePedia?PEDIA_PATHS:[])){
  const r=results.get(path);
  check(path,'HTTP_200',r.status===200,r.error||'HTTP '+r.status);
  if(r.status!==200)continue;
  check(path,'HTML',r.contentType.includes('text/html'),'Content-Type '+r.contentType);
  const s=pageSignals(r.body,path,origin,r.xrobots);
  check(path,'INDEXABLE',s.indexable,'noindex detected');
  check(path,'LANG',s.htmlLang===path.split('/')[1],'lang='+s.htmlLang);
  check(path,'CANONICAL',s.canonicalCorrect,'canonical='+s.canonical);
  check(path,'HREFLANG_PAIR',s.languagesCorrect,JSON.stringify(s.alternates));
  check(path,'SERVER_H1',s.h1Present,'Missing server-rendered H1',true);
  if(requirePedia&&path.includes('/pedia/')&&!path.endsWith('/glossary')){
   check(path,'BREADCRUMB_NAV',s.breadcrumbNavigation,'Missing visible breadcrumb nav');
  }
 }
 const robots=results.get('/robots.txt');
 check('/robots.txt','ROBOTS_HTTP',robots.status===200,'HTTP '+robots.status);
 if(robots.status===200){
  check('/robots.txt','ROBOTS_PUBLIC',!/User-agent:\s*\*\s*(?:\r?\n)\s*Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robots.body),'Global Disallow / found');
  for(const p of ['/api/','/en/admin','/uk/admin','/en/personal','/uk/personal']){
   check('/robots.txt','PRIVATE_DISALLOW',robots.body.includes('Disallow: '+p),'Missing protected pattern '+p);
  }
  check('/robots.txt','SITEMAP_REFERENCE',robots.body.includes(origin+'/sitemap.xml'),
   'Missing production sitemap reference');
 }
 const sitemap=results.get('/sitemap.xml');
 check('/sitemap.xml','SITEMAP_HTTP',sitemap.status===200,'HTTP '+sitemap.status);
 if(sitemap.status===200){
  const urls=new Set([...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m=>m[1].replaceAll('&amp;','&')));
  for(const path of PUBLIC_PATHS.concat(requirePedia?PEDIA_PATHS:[])){
   check('/sitemap.xml','LISTED_CANONICAL',urls.has(origin+path),'Missing '+path);
  }
  check('/sitemap.xml','NO_PRIVATE_URLS',
   ![...urls].some(u=>/\/(?:account|admin|personal)(?:\/|$)/i.test(u)),
   'Sitemap contains private URLs');
 }
 return {origin,checkedAt:new Date().toISOString(),requirePedia,
  summary:{pageCount:PUBLIC_PATHS.length+(requirePedia?PEDIA_PATHS.length:0),
   checks:checks.length,errors:failures.length,warnings:warnings.length,
   indexingInGoogle:'unknown_requires_GSC_URL_Inspection',
   realUserCWV:'unknown_requires_CrUX_or_PSI',
   GA4Receipt:'unknown_requires_GA4_DebugView'},
  failures,warnings,checks};
}
async function main(){
 const result=await audit({
  origin:process.env.SEO1_G30_ORIGIN||'https://galaxiora.com',
  requirePedia:process.argv.includes('--require-pedia')
 });
 if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));
 else{
  console.log('SEO1_G30_READONLY',JSON.stringify(result.summary));
  for(const i of result.failures)console.error('BLOCK',i.assertion,i.path,i.detail);
  for(const i of result.warnings)console.warn('WARN',i.assertion,i.path,i.detail);
 }
 if(result.summary.errors)process.exitCode=2;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 main().catch(error=>{console.error('SEO1_G30_AUDIT_ERROR',error.message);process.exitCode=2;});
}
