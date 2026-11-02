/** R4 search / discovery health — extra checks excluded from the old sitemap-only R3.2 gate.
 * Read-only, non-mutating. Examples:
 *    node tools/r4-search-discovery-audit.mjs --json
 *    R4_AUDIT_ORIGIN=http://127.0.0.1:3000 node tools/r4-search-discovery-audit.mjs
 * The latter is allowed only for local isolated CI, never for other arbitrary HTTP hosts.
 */
const rawOrigin=process.env.R4_AUDIT_ORIGIN||'https://galaxiora.com';
const origin=new URL(rawOrigin).origin;
const site=new URL(rawOrigin);
if(site.pathname!=='/'||site.search||site.hash||site.username||site.password||
 !(site.protocol==='https:'||(site.protocol==='http:'&&['127.0.0.1','localhost'].includes(site.hostname))))
 throw Error('R4_AUDIT_ORIGIN must be a bare HTTPS origin or local CI HTTP loopback');
const issues=[],checks=[];
async function get(path){
 const started=Date.now();
 try{
  const response=await fetch(origin+path,{
   redirect:'manual',signal:AbortSignal.timeout(16000),
   headers:{'user-agent':'Galaxiora-R4-readonly-discovery-audit/1.0'}
  });
  return {status:response.status,contentType:response.headers.get('content-type')||'',
   xrobots:response.headers.get('x-robots-tag')||'',text:await response.text(),
   ms:Date.now()-started,location:response.headers.get('location')||''};
 }catch(error){return {status:0,error:String(error?.message||error),ms:Date.now()-started,text:'',xrobots:''};}
}
function record(path,name,ok,description,level='error'){
 checks.push({path,name,ok,description});
 if(!ok)issues.push({path,name,level,description});
}
function tags(html,name){
 return [...html.matchAll(new RegExp('<'+name+'\\b[^>]*>','gi'))].map(x=>x[0]);
}
function attr(tag,name){
 const match=tag.match(new RegExp('(?:\\s|<)'+name+'\\s*=\\s*(["\\x27])([^"\\x27]*)\\1','i'));
 return match?.[2]||null;
}
function canonical(html){return attr(tags(html,'link').find(t=>attr(t,'rel')?.toLowerCase()==='canonical')||'','href');}
function noindex(html){
 return tags(html,'meta').some(tag=>/^(robots|googlebot)$/i.test(attr(tag,'name')||'')&&/noindex/i.test(attr(tag,'content')||''));
}
function readableH1(html){
 const m=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
 return m?.[1].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()||'';
}
function structuredTypes(html){
 return tags(html,'script').filter(t=>attr(t,'type')==='application/ld+json').length>0||html.includes('application/ld+json');
}
const paths=['/','/uk','/en','/uk/astrology/jyotish','/en/astrology/jyotish','/uk/tarot',
 '/uk/tarot/cards','/uk/tarot/cards/moon','/uk/panchanga','/uk/eclipses/2027',
 '/uk/learn/nakshatras','/en/about','/uk/methodology','/uk/news','/uk/horoscope'];
const pages=await Promise.all(paths.map(get));
for(let i=0;i<paths.length;i++){
 const path=paths[i],p=pages[i];
 record(path,'HTTP_200',p.status===200, p.error||'HTTP '+p.status+(p.location?' → '+p.location:''));
 if(p.status!==200)continue;
 record(path,'HTML',p.contentType.includes('text/html'),'Content-Type '+p.contentType);
 record(path,'INDEXABLE',!noindex(p.text)&&!/noindex/i.test(p.xrobots),'No meta/X-Robots noindex');
 record(path,'H1',!!readableH1(p.text),'Visible server-rendered heading: '+readableH1(p.text).slice(0,110));
 record(path,'CANONICAL',canonical(p.text)===(origin+(path==='/'?'/en':path)),
  'canonical='+String(canonical(p.text)));
 record(path,'H1_TOPIC',!['/','/uk','/en'].includes(path)||/Astrology|Таро|Панчанга|Panchanga/i.test(readableH1(p.text)),
  'Homepage H1 should name an actual user tool', 'warning');
 if(p.ms>3000)record(path,'SERVER_TIMING',false,'Slow single-request response: '+p.ms+'ms (not Core Web Vitals)','warning');
}
const [root,uk,en]=pages;
if(root?.status===200){
 record('/','WEBSITE_SCHEMA',root.text.includes('https://schema.org')&&root.text.includes('WebSite')&&root.text.includes('Galaxiora'),
  'Organization/WebSite markup visible on domain root');
}
if(uk?.status===200&&en?.status===200){
 record('/uk','NAVIGABLE_IA',/href="\/uk\/(tarot|astrology|learn)/.test(uk.text),
  'Server HTML contains crawlable anchored links to public tools');
 record('/en','NAVIGABLE_IA',/href="\/en\/(tarot|astrology|learn)/.test(en.text),
  'Server HTML contains crawlable anchored links to public tools');
}
const [robots,sitemap,...icons]=await Promise.all(['/robots.txt','/sitemap.xml',
 '/favicon.ico','/galaxiora-favicon.png','/galaxiora-logo-128.png','/apple-touch-icon.png',
 '/site.webmanifest'].map(get));
record('/robots.txt','ROBOTS',robots.status===200&&!/User-agent:\s*\*\s*Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robots.text),
 'Robots readable without global site block');
record('/sitemap.xml','SITEMAP',sitemap.status===200&&sitemap.text.includes('<urlset'),
 'Sitemap exists with loc/alternate link XML');
const urls=[...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
if(sitemap.status===200){
 record('/sitemap.xml','BILINGUAL_SITEMAP',urls.some(x=>x.endsWith('/uk'))&&urls.some(x=>x.endsWith('/en')),
  'UA and EN home canonicals present');
 record('/sitemap.xml','CONTENT_HUBS',urls.some(x=>x.endsWith('/uk/tarot/cards'))&&urls.some(x=>x.endsWith('/uk/eclipses/2027')),
  'Original educational guides are listed');
}
for(let i=0;i<icons.length;i++){
 const path=['/favicon.ico','/galaxiora-favicon.png','/galaxiora-logo-128.png','/apple-touch-icon.png','/site.webmanifest'][i];
 record(path,'BRAND_ASSET',icons[i].status===200,
  'Public Google/browser/PWA branding HTTP '+icons[i].status);
}
if(icons[4]?.status===200){
 try{const manifest=JSON.parse(icons[4].text);
  record('/site.webmanifest','MANIFEST_NAME',manifest.short_name==='Galaxiora',
   'PWA site name='+manifest.short_name);
 }catch{record('/site.webmanifest','MANIFEST_JSON',false,'Manifest not valid JSON');}
}
const summary={checkedPages:paths.length,assets:icons.length,checks:checks.length,
 errors:issues.filter(x=>x.level==='error').length,warnings:issues.filter(x=>x.level==='warning').length,
 signal:'This tests technical reachability, not Google index status, search rankings or GA4 delivery.'};
if(process.argv.includes('--json'))console.log(JSON.stringify({origin,summary,issues,checks},null,2));
else{
 console.log('[Galaxiora R4 discovery audit]',JSON.stringify({origin,summary}));
 for(const i of issues)console.log((i.level==='warning'?'WARN':'BLOCK')+' '+i.name+' '+i.path+' '+i.description);
}
if(summary.errors)process.exitCode=2;
