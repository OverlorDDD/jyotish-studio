/** R4.3: pure, fail-closed IndexNow input helpers; no network or environment access. */
export const MAX_CHANGED_URLS = 200;
export const MAX_BOOTSTRAP_URLS = 10000;
const PRIVATE_PATH = /\/(?:account|admin|personal|profile|settings|api|auth|checkout)(?:\/|$)/i;
const LOCALIZED_PATH = /^\/(?:en|uk)(?:\/|$)/;

export function parseIndexNowArgs(args) {
 const parsed = {submit:false,bootstrap:false,urls:[],files:[],help:false};
 for(let i=0;i<args.length;i++){
  const arg=args[i];
  if(arg==='--submit'){parsed.submit=true;continue;}
  if(arg==='--bootstrap'){parsed.bootstrap=true;continue;}
  if(arg==='--help'||arg==='-h'){parsed.help=true;continue;}
  if(arg==='--url'||arg==='--file'){
   const value=args[++i];
   if(!value||value.startsWith('--'))throw Error('Expected a value after '+arg);
   (arg==='--url'?parsed.urls:parsed.files).push(value);
   continue;
  }
  throw Error('Unknown IndexNow argument: '+arg);
 }
 if(parsed.bootstrap&&(parsed.urls.length||parsed.files.length))
  throw Error('--bootstrap cannot be combined with changed URL inputs');
 if(parsed.submit&&!parsed.bootstrap&&!parsed.urls.length&&!parsed.files.length)
  throw Error('Refusing to submit the entire sitemap implicitly; provide --url, --file, or explicit --bootstrap');
 return parsed;
}

export function normalizeIndexNowUrls(values, origin, limit=MAX_CHANGED_URLS){
 const base=new URL(origin);
 if(base.protocol!=='https:'||base.pathname!=='/'||base.search||base.hash)
  throw Error('IndexNow requires an exact HTTPS site origin');
 if(!Array.isArray(values)||values.length>limit)throw Error('Too many IndexNow URLs (max '+limit+')');
 const result=[];
 const seen=new Set();
 for(const input of values){
  if(typeof input!=='string'||!input.trim()||/\s/.test(input)||input.includes('\\'))
   throw Error('Invalid or whitespace-containing IndexNow URL');
  const raw=input.trim();
  // Reject userinfo and path traversal before URL normalizes the path.
  if(/%(?:2f|5c|2e)/i.test(raw)||/(?:^|\/)\.\.(?:\/|$)/.test(raw))
   throw Error('Unsafe encoded or traversal URL');
  let url;
  try{url=new URL(raw,base);}catch{throw Error('Invalid IndexNow URL');}
  if(url.origin!==base.origin||url.username||url.password||url.search||url.hash)
   throw Error('IndexNow URL must be a same-origin public canonical path without query or fragment');
  if(!LOCALIZED_PATH.test(url.pathname)||PRIVATE_PATH.test(url.pathname))
   throw Error('IndexNow accepts only localized public paths');
  if(url.pathname.includes('//'))throw Error('IndexNow rejects duplicate slash paths');
  const canonical=base.origin+url.pathname;
  if(!seen.has(canonical)){seen.add(canonical);result.push(canonical);}
 }
 if(!result.length)throw Error('No valid changed URLs');
 return result;
}

export function parseIndexNowSitemap(xml,origin) {
 if(typeof xml!=='string'||xml.length>8_000_000)throw Error('Invalid or oversized sitemap');
 const locations=[...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)]
  .map(m=>m[1].trim().replace(/&amp;/g,'&'));
 if(!locations.length)throw Error('Sitemap has no loc elements');
 const urls=[];
 for(const loc of locations){
  try { urls.push(...normalizeIndexNowUrls([loc],origin,MAX_BOOTSTRAP_URLS)); }
  catch { /* Ignore non-page loc, e.g. a sitemap-index child or an external URL. */ }
 }
 const unique=[...new Set(urls)];
 if(unique.length>MAX_BOOTSTRAP_URLS)throw Error('Sitemap exceeds IndexNow batch limit');
 if(!unique.length)throw Error('Sitemap has no localized canonical page URLs');
 return unique;
}
