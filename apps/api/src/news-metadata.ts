/** Metadata discovery only: no article bodies, no arbitrary-domain requests.
 * Restricted to previously curated publisher domains; redirects are never followed.
 * Hosts with private/internal addresses are refused even after curated selection. */
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {canonicalUrl,cleanDescription,publisherDomain} from './news-domain.ts';
import {RSS_SOURCES} from './news-sources.ts';
export type Meta={description?:string;imageUrl?:string;imageCredit?:string};
const forbidden=(ip:string)=>{
 if(isIP(ip)===4){
  const n=ip.split('.').map(Number);
  return n[0]===0||n[0]===10||n[0]===127||n[0]>=224||
   n[0]===169&&n[1]===254||n[0]===172&&n[1]>=16&&n[1]<=31||
   n[0]===192&&n[1]===168||n[0]===100&&n[1]>=64&&n[1]<=127||
   n[0]===192&&n[1]===0||n[0]===198&&n[1]>=18&&n[1]<=19;
 }
 if(isIP(ip)===6)return ip==='::1'||ip==='::'||ip.toLowerCase().startsWith('fc')||
  ip.toLowerCase().startsWith('fd')||ip.toLowerCase().startsWith('fe80')||ip.includes('::ffff:');
 return true;
};
export function metadataHosts(extra:readonly string[]=[]):Set<string>{
 const candidate=RSS_SOURCES.map(s=>publisherDomain(s.url)).filter((x):x is string=>Boolean(x));
 const permitted=(process.env.NEWS_METADATA_ALLOWED_HOSTS||'').split(',').map(x=>x.trim().toLowerCase())
  .filter(x=>/^[a-z0-9][a-z0-9.-]{2,190}[a-z0-9]$/.test(x));
 return new Set([...candidate,...permitted,...extra.filter(x=>/^[a-z0-9][a-z0-9.-]{2,190}$/.test(x))]);
}
export function parseArticleMeta(html:string,originalUrl:string):Meta {
 const meta=[...html.slice(0,135000).matchAll(/<meta\b[^>]*>/gi)];
 const attr=(tag:string,key:string)=>{
  const m=new RegExp('(?:^|\\s)'+key+'\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27|([^\\s>]+))','i').exec(tag);
  return m?.[1]||m?.[2]||m?.[3]||'';
 };
 const entries=new Map<string,string>();
 for(const [tag] of meta){
  const label=(attr(tag,'property')||attr(tag,'name')).toLowerCase();
  if(!label||entries.has(label))continue;
  const value=attr(tag,'content');if(value)entries.set(label,value);
 }
 const description=cleanDescription(entries.get('og:description')||entries.get('twitter:description')||entries.get('description')||'').slice(0,700);
 const candidate=entries.get('og:image:secure_url')||entries.get('og:image')||entries.get('twitter:image')||'';
 let imageUrl:string|undefined;
 try{if(candidate)imageUrl=canonicalUrl(new URL(candidate,originalUrl).toString())||undefined;}catch{}
 return {description:description.length>45?description:undefined,imageUrl,
  imageCredit:cleanDescription(entries.get('article:publisher')||new URL(originalUrl).hostname)};
}
export async function fetchArticleMetadata(url:string,fetcher:typeof fetch=fetch,extraHosts:readonly string[]=[]):Promise<Meta>{
 const clean=canonicalUrl(url);if(!clean)return {};
 const u=new URL(clean),allowed=metadataHosts(extraHosts);
 if(!allowed.has(u.hostname)&&!allowed.has(u.hostname.replace(/^www\./,'')))return {};
 try{
  if(isIP(u.hostname))return {};
  const addresses=await lookup(u.hostname,{all:true,verbatim:true});
  if(!addresses.length||addresses.some(x=>forbidden(x.address)))return {};
  // Follow at most 3 same-site HTTPS redirects (trailing slash, www ↔ apex).
  let target=clean,response:Response|null=null;
  for(let hop=0;hop<4;hop++){
   response=await fetcher(target,{redirect:'manual',signal:AbortSignal.timeout(6500),
    headers:{Accept:'text/html','User-Agent':'Mozilla/5.0 (compatible; GalaxioraNews/1.2; +https://galaxiora.com/en/methodology)'}});
   if(response.status<300||response.status>=400)break;
   const next=response.headers.get('location');if(!next||hop===3)return {};
   const to=new URL(next,target);
   if(to.protocol!=='https:'||to.hostname.replace(/^www\./,'')!==u.hostname.replace(/^www\./,''))return {};
   target=to.toString();
  }
  if(!response||!response.ok||!/(text\/html|application\/xhtml\+xml)/i.test(response.headers.get('content-type')||''))return {};
  // Article pages are often 200–600 KB; og:image lives in <head>, so read only
  // the first 140 KB instead of refusing large pages outright.
  const reader=response.body?.getReader();if(!reader)return {};
  const chunks:Uint8Array[]=[];let total=0;
  try{
   while(total<140000){
    const item=await reader.read();if(item.done)break;
    chunks.push(item.value);total+=item.value.byteLength;
   }
  }finally{void reader.cancel().catch(()=>{});}
  return parseArticleMeta(new TextDecoder().decode(Buffer.concat(chunks)),target);
 }catch{return {};}
}
