/** Public indexing only when explicitly configured with an HTTPS origin. */
export const INDEXED_SECTIONS=['astrology','tarot'] as const;
export const SEO_PATHS=['','astrology','tarot','astrology/jyotish'] as const;
export function publicSiteOrigin():string|null{
 const value=process.env.NEXT_PUBLIC_SITE_URL?.trim();
 if(!value)return null;
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'||!url.hostname||url.username||url.password||
   url.search||url.hash||url.pathname!=='/'||url.port)return null;
  if(url.hostname==='localhost'||url.hostname.endsWith('.localhost')||
   url.hostname==='127.0.0.1')return null;
  return url.origin;
 }catch{return null;}
}
export function publicIndexingEnabled():boolean{
 return process.env.SITE_NOINDEX!=='1'&&publicSiteOrigin()!==null;
}
export function indexRobots(indexable=true){
 return {index:indexable&&publicIndexingEnabled(),follow:true};
}
