/** Public indexing only when explicitly configured with an HTTPS origin. */
export const INDEXED_SECTIONS=['astrology','tarot','yoga','learn','news','community','methodology'] as const;
// Include only canonical public 200 pages; /astrology redirects to /astrology/jyotish.
export const SEO_PATHS=['','about','tarot','tarot/cards','astrology/jyotish','yoga','learn','horoscope','panchanga','eclipses/2027','news','community','methodology'] as const;
export function publicSiteOrigin():string|null{
 const value=process.env.NEXT_PUBLIC_SITE_URL?.trim();
 if(!value)return null;
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'||!url.hostname||url.username||url.password||
   url.search||url.hash||url.pathname!=='/'||url.port)return null;
  if(url.hostname==='localhost'||url.hostname.endsWith('.localhost')||
   url.hostname==='127.0.0.1'||url.hostname.endsWith('.ngrok-free.dev')||
   url.hostname.endsWith('.trycloudflare.com'))return null;
  return url.origin;
 }catch{return null;}
}
export function publicIndexingEnabled():boolean{
 return process.env.SITE_NOINDEX==='0'&&publicSiteOrigin()!==null;
}
export function indexRobots(indexable=true){
 return {index:indexable&&publicIndexingEnabled(),follow:true};
}
