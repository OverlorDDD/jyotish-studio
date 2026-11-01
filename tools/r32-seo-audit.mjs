/** Read-only R3.2 audit. Fetches every public URL listed in the live sitemap.
 * No search-engine submissions, admin access, DB writes, or server mutation.
 * Usage: node tools/r32-seo-audit.mjs [--json]
 */
const origin=(process.env.R32_SITE_ORIGIN||'https://galaxiora.com').replace(/\/$/,'');
const base=new URL(origin);
if(base.protocol!=='https:'||base.search||base.hash||base.username||base.password||
 base.pathname!=='/'||base.port||!base.hostname)
 throw Error('R32_SITE_ORIGIN must be a bare HTTPS website origin, not a preview or path');
const errors=[],warnings=[],results=[];
function issue(list,code,url,message){list.push({code,url,message});}
const attr=(tag,name)=>{
 const value=tag.match(new RegExp('(?:\\s|<)'+name+'\\s*=\\s*([\\x22\\x27])([^\\x22\\x27]*)\\1','i'));
 return value?.[2]||null;
};
const tags=(html,tag)=>[...html.matchAll(new RegExp('<'+tag+'\\b[^>]*>','gi'))].map(m=>m[0]);
const canonical=html=>tags(html,'link').find(t=>attr(t,'rel')?.toLowerCase()==='canonical');
const robotsMeta=html=>tags(html,'meta').filter(t=>['robots','googlebot'].includes(attr(t,'name')?.toLowerCase()));
async function get(url){
 const res=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000),
  headers:{'User-Agent':'Galaxiora-R32-readonly-audit/1.0'}});
 return {res,body:await res.text()};
}
async function inspect(url){
 const item={url,status:null,canonical:null,title:null,h1:false,language:null};
 try{
  const {res,body}=await get(url);item.status=res.status;
  if(res.status!==200){issue(errors,'NOT_200',url,'HTTP '+res.status+(res.headers.get('location')?' to '+res.headers.get('location'):''));return item;}
  if(!res.headers.get('content-type')?.includes('text/html'))issue(errors,'NOT_HTML',url,'Expected HTML');
  const xrobot=res.headers.get('x-robots-tag')||'';
  if(/noindex/i.test(xrobot))issue(errors,'HEADER_NOINDEX',url,xrobot);
  const meta=robotsMeta(body).map(t=>attr(t,'content')||'').join(',');
  if(/noindex/i.test(meta))issue(errors,'META_NOINDEX',url,meta);
  const canon=canonical(body);item.canonical=canon?attr(canon,'href'):null;
  if(item.canonical!==url)issue(errors,'CANONICAL',url,'Found '+(item.canonical||'none')+'; expected '+url);
  const lang=body.match(/<html\b[^>]*\blang=(["'])([^"']+)\1/i);
  item.language=lang?.[2]||null;
  const expectedLang=new URL(url).pathname.split('/')[1];
  if(item.language!==expectedLang)issue(errors,'LANG',url,'Found '+item.language+'; expected '+expectedLang);
  const languageLinks=tags(body,'link').filter(t=>attr(t,'rel')?.toLowerCase()==='alternate'&&attr(t,'hreflang'));
  for(const loc of ['uk','en']){
   const href=languageLinks.find(t=>attr(t,'hreflang')===loc);
   if(!href||!attr(href,'href')?.startsWith(origin+'/'+loc))
    issue(errors,'HREFLANG_'+loc.toUpperCase(),url,'Missing or mismatched '+loc+' language alternate');
  }
  item.title=body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()||null;
  item.h1=/<h1(?:\s|>)/i.test(body);
  if(!item.title)issue(errors,'TITLE',url,'Missing server-rendered title');
  if(!item.h1)issue(warnings,'H1',url,'No H1 in initial response; review crawled HTML');
  if(!body.includes('Galaxiora'))issue(warnings,'BRAND',url,'Brand absent from initial HTML');
 }catch(e){issue(errors,'FETCH',url,String(e?.message||e));}
 return item;
}
let sitemap,robotText;
try{const x=await get(origin+'/robots.txt');
 if(x.res.status!==200)issue(errors,'ROBOTS_STATUS',origin+'/robots.txt',String(x.res.status));
 robotText=x.body;
 if(!robotText.includes('Sitemap: '+origin+'/sitemap.xml'))issue(errors,'ROBOTS_SITEMAP',origin+'/robots.txt','Missing expected sitemap directive');
 if(/User-agent:\s*\*\s*Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robotText))
  issue(errors,'ROBOTS_BLOCK',origin+'/robots.txt','Global crawl block');
}catch(e){issue(errors,'ROBOTS_FETCH',origin+'/robots.txt',String(e?.message||e));}
try{const x=await get(origin+'/sitemap.xml');
 if(x.res.status!==200)issue(errors,'SITEMAP_STATUS',origin+'/sitemap.xml',String(x.res.status));
 sitemap=x.body;
}catch(e){issue(errors,'SITEMAP_FETCH',origin+'/sitemap.xml',String(e?.message||e));}
const entries=[...String(sitemap||'').matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1].replace(/&amp;/g,'&'));
const urls=[...new Set(entries)];
if(!urls.length)issue(errors,'EMPTY_SITEMAP',origin+'/sitemap.xml','No loc URLs');
if(entries.length!==urls.length)issue(errors,'DUPLICATE_LOC',origin+'/sitemap.xml','Duplicate URL in sitemap');
if(urls.length>500)throw Error('Audit capped at 500 URLs; split the sitemap into batches before running');
for(const url of urls){
 let parsed;
 try{parsed=new URL(url);}catch{issue(errors,'INVALID_URL',url,'Malformed sitemap entry');continue;}
 if(parsed.origin!==origin)issue(errors,'OTHER_HOST',url,'Unexpected origin');
 if(!/^\/(uk|en)(?:\/|$)/.test(parsed.pathname))issue(errors,'UNLOCALIZED',url,'Expected /uk or /en canonical');
 if(/\/(account|admin|personal|editorial)(\/|$)/.test(parsed.pathname))
  issue(errors,'PRIVATE_IN_SITEMAP',url,'Private route must not be in sitemap');
 if(/^\/(uk|en)\/astrology$/.test(parsed.pathname))
  issue(errors,'REDIRECT_ALIAS',url,'Redirecting astrology alias, use /astrology/jyotish');
}
for(let start=0;start<urls.length;start+=5){
 const batch=urls.slice(start,start+5).filter(url=>{
  try{return new URL(url).origin===origin;}catch{return false;}
 });
 const value=await Promise.all(batch.map(inspect));
 results.push(...value);
}
for(const loc of ['uk','en']){
 for(const path of ['', '/about','/methodology','/horoscope','/astrology/jyotish','/panchanga']){
  const url=origin+'/'+loc+path;
  if(!urls.includes(url))issue(errors,'MISSING_CORE_URL',url,'Not listed in sitemap');
 }
}
const summary={origin,checked:results.length,sitemapUrls:urls.length,errors:errors.length,
 warnings:warnings.length,passed:results.filter(x=>x.status===200).length};
if(process.argv.includes('--json'))console.log(JSON.stringify({summary,errors,warnings,results},null,2));
else{
 console.log('R3.2 read-only SEO audit:',JSON.stringify(summary));
 errors.forEach(x=>console.error('BLOCKED '+x.code+' '+x.url+': '+x.message));
 warnings.forEach(x=>console.warn('CHECK '+x.code+' '+x.url+': '+x.message));
 if(!errors.length)console.log('PASS: all listed URLs satisfy technical crawling/canonical baseline');
}
process.exitCode=errors.length?2:0;
