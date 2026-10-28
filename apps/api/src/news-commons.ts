/** License-checked illustrative alternatives from Wikimedia Commons.
 * Commons images are not presented as the original publisher's photos.
 * Restrict to topic vocabulary, Commons media, and explicit reusable licenses.
 */
const QUERIES:Record<string,string>={
 jyotish:'vedic astrology ancient astronomy',astrology:'night sky constellations',
 tarot:'tarot cards rider waite',yoga:'yoga meditation exercise',
 meditation:'meditation peaceful nature',vedic:'Indian temple architecture',
 'self-development':'mountain sunrise nature',astronomy:'moon telescope stars'};
export type CommonsImage={imageUrl:string;imageCredit:string;imageLicense:string;imageLicenseUrl:string;imagePageUrl:string};
const cache=new Map<string,{until:number;image:CommonsImage|null}>();
function plain(raw:string){return raw.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim().slice(0,180);}
export function parseCommonsResponse(data:unknown):CommonsImage|null{
 const pages=Object.values((data as {query?:{pages?:Record<string,any>}})?.query?.pages||{});
 for(const p of pages){
  const file=p?.imageinfo?.[0],m=file?.extmetadata||{};
  const lic=String(m.LicenseShortName?.value||'').trim();
  if(!/^(?:CC0(?:\s*1\.0)?|public domain|CC BY(?:-SA)?\s*[234]\.0)$/i.test(lic))continue;
  if(String(m.NonFree?.value||'').toLowerCase()==='true')continue;
  if(!/^image\/(?:jpeg|png|webp)$/i.test(String(file.mime||'')))continue;
  let url:URL,page:URL;
  try{url=new URL(file.thumburl||'');page=new URL(file.descriptionurl||'');}catch{continue;}
  if(url.protocol!=='https:'||!['upload.wikimedia.org','commons.wikimedia.org'].includes(url.hostname)
   ||page.hostname!=='commons.wikimedia.org'||page.protocol!=='https:')continue;
  const author=plain(String(m.Artist?.value||file.user||''))||'Wikimedia Commons contributor';
  let licenseUrl=String(m.LicenseUrl?.value||'');
  if(!licenseUrl.startsWith('https://'))licenseUrl=page.href;
  return {imageUrl:url.href,imagePageUrl:page.href,imageCredit:author+' · Wikimedia Commons',
   imageLicense:lic,imageLicenseUrl:licenseUrl};
 }
 return null;
}
export async function commonsIllustration(topic:string,fetcher:typeof fetch=fetch):Promise<CommonsImage|null>{
 const query=QUERIES[topic];if(!query)return null;
 const now=Date.now(),cached=cache.get(topic);
 if(cached&&cached.until>now)return cached.image;
 const url=new URL('https://commons.wikimedia.org/w/api.php');
 for(const [k,v] of Object.entries({action:'query',format:'json',generator:'search',
  gsrsearch:'filetype:bitmap '+query,gsrnamespace:'6',gsrlimit:'8',
  prop:'imageinfo',iiprop:'url|mime|user|extmetadata',iiurlwidth:'700',
  iiextmetadatafilter:'LicenseShortName|LicenseUrl|Artist|NonFree'}))url.searchParams.set(k,v);
 try{
  const response=await fetcher(url,{signal:AbortSignal.timeout(6500),
   headers:{Accept:'application/json','User-Agent':'Galaxiora/1.0 (license-checked editorial images)'}});
  if(!response.ok)throw Error('Commons unavailable');
  const result=parseCommonsResponse(await response.json());
  cache.set(topic,{until:now+24*3600000,image:result});
  return result;
 }catch{cache.set(topic,{until:now+30*60000,image:null});return null;}
}
