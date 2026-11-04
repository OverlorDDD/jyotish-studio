/** G3.2.1 daily read-only SEO health for the three real bilingual tool entrypoints.
 * No cookies, auth, POST, IndexNow, Google indexing requests, or arbitrary hosts.
 */
import {ORGANIC_INTENTS} from '../apps/web/lib/organic-intents.ts';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const G32_LIVE_ORIGIN='https://galaxiora.com';
export function healthOrigin(value=G32_LIVE_ORIGIN){
 const parsed=new URL(value);
 if(parsed.username||parsed.password||parsed.search||parsed.hash||parsed.pathname!=='/'||
  !((parsed.protocol==='https:'&&parsed.origin===G32_LIVE_ORIGIN)||
    (parsed.protocol==='http:'&&['localhost','127.0.0.1'].includes(parsed.hostname))))
  throw Error('G3.2 Health permits only Galaxiora production HTTPS or local loopback');
 return parsed.origin;
}
const tagAttr=(tag,name)=>{
 const match=tag.match(new RegExp('\\b'+name+'\\s*=\\s*(["\\x27])([^"\\x27]*)\\1','i'));
 return match?.[2]||null;
};
const findTags=(html,tag)=>[...html.matchAll(new RegExp('<'+tag+'\\b[^>]*>','gi'))].map(m=>m[0]);
const links=(html,rel)=>findTags(html,'link').filter(t=>(tagAttr(t,'rel')||'').toLowerCase()===rel);
export function validateOrganicHtml(html,path,origin=G32_LIVE_ORIGIN){
 const failures=[],warnings=[];
 const lang=path.split('/')[1];
 if(!['en','uk'].includes(lang))throw Error('Health route must be localized');
 const expected=origin+path;
 if(!/<h1(?:\\s|>)/i.test(html))failures.push('MISSING_H1');
 if(!/<title(?:\\s|>)[\\s\\S]*?<\\/title>/i.test(html))failures.push('MISSING_TITLE');
 if(!new RegExp('<html\\b[^>]*\\blang=["\\x27]'+lang+'["\\x27]','i').test(html))
  failures.push('LANG_MISMATCH');
 const canonical=links(html,'canonical').map(t=>tagAttr(t,'href'));
 if(canonical.length!==1||canonical[0]!==expected)failures.push('CANONICAL_MISMATCH');
 const suffix=path.slice(3);
 for(const alternate of ['en','uk']){
  const correct=origin+'/'+alternate+suffix;
  if(!links(html,'alternate').some(t=>tagAttr(t,'hreflang')===alternate&&tagAttr(t,'href')===correct))
   failures.push('HREFLANG_'+alternate.toUpperCase());
 }
 const robots=findTags(html,'meta').filter(t=>/^(robots|googlebot)$/i.test(tagAttr(t,'name')||''));
 if(robots.some(t=>/noindex/i.test(tagAttr(t,'content')||'')))failures.push('META_NOINDEX');
 if(!/<meta\s[^>]*name=["\\x27]description["\\x27]/i.test(html))
  warnings.push('META_DESCRIPTION_MISSING');
 const topic=ORGANIC_INTENTS.find(x=>path==='/'+lang+'/'+x.toolPath);
 if(topic){
  for(const guide of topic.guides){
   if(!html.includes('href="/'+lang+'/'+guide.path+'"'))failures.push('GUIDE_LINK_MISSING:'+guide.path);
  }
 }
 return {path,failures,warnings};
}
export async function runOrganicHealth({origin=G32_LIVE_ORIGIN,fetcher=fetch}={}){
 origin=healthOrigin(origin);
 const routes=['/en','/uk',...ORGANIC_INTENTS.flatMap(x=>['en','uk'].map(l=>'/'+l+'/'+x.toolPath)),
 '/en/pedia','/uk/pedia','/en/pedia/what-is-tithi-lunar-day','/uk/pedia/what-is-tithi-lunar-day'];
 const report={stage:'G3.2.1',origin,readOnly:true,checks:[],errors:[],warnings:[],
  indexingStatus:'unknown_requires_GSC_URL_Inspection',
  fieldCwv:'unknown_requires_CrUX',
  measuredVisitors:'unknown_not_an_analytics_report'};
 async function get(path){
  const res=await fetcher(origin+path,{redirect:'manual',signal:AbortSignal.timeout(15000),
   headers:{'User-Agent':'Galaxiora-G32-organic-health/1.0'}});
  const size=Number(res.headers.get('content-length')||0);
  if(size>2_000_000)throw Error('Page larger than 2 MB');
  const body=await res.text();
  if(body.length>2_000_000)throw Error('Oversized HTML response');
  return {status:res.status,headers:res.headers,body};
 }
 for(const path of ['/robots.txt','/sitemap.xml',...routes]){
  try{
   const res=await get(path);
   const errs=[],warns=[];
   if(res.status!==200)errs.push('HTTP_'+res.status);
   if(path==='/robots.txt'){
    if(/User-agent:\\s*\\*\\s*Disallow:\\s*\\/\\s*(?:\\r?\\n|$)/i.test(res.body))errs.push('ROOT_BLOCKED');
    if(!res.body.includes('Sitemap: '+origin+'/sitemap.xml'))errs.push('ROBOTS_SITEMAP_MISSING');
   }else if(path==='/sitemap.xml'){
    if(!res.body.includes('<urlset'))errs.push('SITEMAP_INVALID');
    for(const route of routes)if(!res.body.includes('<loc>'+origin+route+'</loc>'))
     errs.push('SITEMAP_MISSING:'+route);
    if(/<loc>https:\/\/galaxiora\.com\/(?:en|uk)\/(?:account|admin|personal|api)(?:\/|<)/.test(res.body))
     errs.push('PRIVATE_SITEMAP_PATH');
   }else if(res.status===200){
    if(!res.headers.get('content-type')?.includes('text/html'))errs.push('CONTENT_TYPE_NOT_HTML');
    if(/noindex/i.test(res.headers.get('x-robots-tag')||''))errs.push('HEADER_NOINDEX');
    const evaluated=validateOrganicHtml(res.body,path,origin);
    errs.push(...evaluated.failures);warns.push(...evaluated.warnings);
   }
   report.checks.push({path,httpStatus:res.status,passed:errs.length===0});
   report.errors.push(...errs.map(code=>({path,code})));
   report.warnings.push(...warns.map(code=>({path,code})));
  }catch(e){
   report.checks.push({path,httpStatus:null,passed:false});
   report.errors.push({path,code:'FETCH_FAILED',detail:String(e?.message||e).slice(0,140)});
  }
 }
 report.summary={routes:routes.length,errors:report.errors.length,warnings:report.warnings.length};
 return report;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const args=process.argv.slice(2);
 if(args.some(a=>a!=='--json'&&a!=='--local'))throw Error('Only --json or --local supported');
 const origin=args.includes('--local')?'http://127.0.0.1:3000':G32_LIVE_ORIGIN;
 const report=await runOrganicHealth({origin});
 console.log(JSON.stringify(report,null,2));
 if(report.errors.length)process.exitCode=2;
}
