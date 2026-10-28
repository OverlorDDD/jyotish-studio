/** GalaxiNews openly licensed *alternative illustrative photographs*.
 * Wikimedia Commons file-page licensing and author information is mandatory.
 * A news publisher's OG/RSS preview is NOT a reuse grant.
 * Never label illustrative photos as documentary photographs of an article.
 */
import {createHash} from 'node:crypto';
import type {PrismaService} from './prisma.ts';
import {cleanDescription,safeImageUrl} from './news-domain.ts';
type Topic= 'jyotish'|'astrology'|'tarot'|'yoga'|'meditation'|'vedic'|'self-development'|'astronomy';
export type OpenImage={imageUrl:string;imagePageUrl:string;imageLicense:string;imageLicenseUrl:string;imageCredit:string};
type MediaInfo={thumburl?:string;url?:string;descriptionurl?:string;mime?:string;width?:number;height?:number;
 extmetadata?:Record<string,{value?:string}>};
const SEARCH:Record<Topic,string[]>={
 jyotish:['Indian astronomical observatory','Jantar Mantar observatory','Hindu astrology manuscript'],
 astrology:['observatory telescope stars','planetary observatory','night sky stars'],
 tarot:['tarot cards table','Rider Waite tarot cards','antique tarot cards'],
 yoga:['yoga outdoors','yoga meditation outdoors','yoga posture'],
 meditation:['meditating Buddha statue','meditation retreat nature','meditation sunrise'],
 vedic:['Hindu temple India','vedic manuscript','ancient Indian temple'],
 'self-development':['mountain path sunrise','forest hiking trail','open book sunlight'],
 astronomy:['moon telescope night','solar eclipse astronomy','night sky observatory']
};
const TERMS:Topic[]=['jyotish','astrology','tarot','yoga','meditation','vedic','self-development','astronomy'];
function allowLicense(meta:MediaInfo['extmetadata']){
 const name=meta?.LicenseShortName?.value?.trim()||'';
 const rawUrl=meta?.LicenseUrl?.value?.trim()||'';
 let url:URL;try{url=new URL(rawUrl);}catch{return null;}
 if(url.protocol!=='https:'&&url.protocol!=='http:')return null;
 if(url.hostname!=='creativecommons.org')return null;
 const path=url.pathname.replace(/\/+$/,'').toLowerCase();
 if(/^\/publicdomain\/zero\/1\.0$/.test(path)&&/^cc0/i.test(name))return {name:'CC0 1.0',url:'https://creativecommons.org/publicdomain/zero/1.0/'};
 const m=/^\/licenses\/(by|by-sa)\/(2\.0|2\.5|3\.0|4\.0)$/.exec(path);
 if(!m)return null;
 const title=name.toLowerCase().replace(/[ .-]+/g,'');
 if(title!==(m[1]==='by'?'ccby':'ccbysa')+m[2].replaceAll('.',''))return null;
 return {name:(m[1]==='by'?'CC BY ':'CC BY-SA ')+m[2],url:'https://creativecommons.org/licenses/'+m[1]+'/'+m[2]+'/'};
}
const isCommons=(url:string,hostname:string)=>{
 try{const u=new URL(url);return u.protocol==='https:'&&u.hostname===hostname&&
  !u.username&&!u.password&&!u.port;}catch{return false;}
};
export function selectOpenImage(json:unknown,excludedUrls:ReadonlySet<string>=new Set()):OpenImage|null{
 const pages=Object.values((json as {query?:{pages?:Record<string,{imageinfo?:MediaInfo[];title?:string}>}})?.query?.pages||{});
 for(const page of pages){
  const photo=page?.imageinfo?.[0];if(!photo)continue;
  const imageUrl=photo.thumburl||photo.url||'';
  const pageUrl=photo.descriptionurl||'';
  if(excludedUrls.has(imageUrl)||!isCommons(imageUrl,'upload.wikimedia.org')||
   !isCommons(pageUrl,'commons.wikimedia.org')||
   !/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(imageUrl))continue;
  if(!['image/jpeg','image/png','image/webp'].includes(photo.mime||''))continue;
  if((photo.width||0)<450||(photo.height||0)<270)continue;
  const license=allowLicense(photo.extmetadata);
  if(!license||!safeImageUrl(imageUrl,license.url,'Wikimedia Commons'))continue;
  const author=cleanDescription(photo.extmetadata?.Artist?.value||'').replace(/\s+/g,' ').slice(0,82);
  if(!author)continue; // never omit required author credit
  const credit=(author+' · '+license.name+' · Wikimedia Commons').slice(0,160);
  return {imageUrl,imagePageUrl:pageUrl,imageLicense:license.name,
   imageLicenseUrl:license.url,imageCredit:credit};
 }
 return null;
}
export async function findOpenImage(topic:string,seed:string,fetcher:typeof fetch=fetch,excludedUrls:ReadonlySet<string>=new Set()):Promise<OpenImage|null>{
 if(!TERMS.includes(topic as Topic))return null;
 const searches=SEARCH[topic as Topic];
 const hash=createHash('sha256').update(seed).digest();
 const term=searches[hash[0]%searches.length];
 const url=new URL('https://commons.wikimedia.org/w/api.php');
 for(const [k,v] of Object.entries({
  action:'query',generator:'search',gsrsearch:term,gsrnamespace:'6',gsrlimit:'12',
  gsroffset:String((hash[1]%5)*12),
  prop:'imageinfo',iiprop:'url|size|mime|extmetadata',iiurlwidth:'760',
  iiextmetadatafilter:'LicenseShortName|LicenseUrl|Artist',format:'json',formatversion:'2'
 }))url.searchParams.set(k,v);
 try{
  const r=await fetcher(url.toString(),{redirect:'error',signal:AbortSignal.timeout(5500),
   headers:{Accept:'application/json','User-Agent':'Galaxiora-News/1.0 (open licensed illustration lookup)'}});
  if(!r.ok)return null;
  const size=Number(r.headers.get('content-length')||0);if(size>220000)return null;
  const body=await r.text();if(body.length>220000)return null;
  const data=JSON.parse(body);
  // formatversion 2 returns pages as an array, unlike v1 object.
  if(Array.isArray(data?.query?.pages))data.query.pages=Object.fromEntries(
   data.query.pages.map((p:{pageid?:number},i:number)=>[String(p.pageid??i),p]));
  return selectOpenImage(data,excludedUrls);
 }catch{return null;}
}
/** Updates only articles without any permitted image. Does not contact article URLs.
 * A maximum of 12 lookups per ingest cycle and 3 concurrent HTTPS requests.
 * Failed lookups get a 48-hour retry window; app is fast even on offline Windows.
 */
export async function enrichOpenNewsPhotos(prisma:PrismaService,fetcher:typeof fetch=fetch){
 if(process.env.NEWS_OPEN_MEDIA_ENABLED==='0')return {checked:0,filled:0};
 const retryBefore=new Date(Date.now()-48*3600000);
 // Older rows may contain RSS/OG URLs without a documented reuse grant.
 // Those were hidden at delivery time, and must also qualify for remediation.
 const rows=await prisma.newsArticle.findMany({where:{status:'PUBLISHED',
  AND:[
   {OR:[{imageUrl:null},{imageLicense:null,imageLicenseUrl:null}]},
   {OR:[{imageLookupAt:null},{imageLookupAt:{lt:retryBefore}}]}
  ]},
  orderBy:{publishedAt:'desc'},take:12,
  select:{id:true,topic:true,urlHash:true,source:true,imageUrl:true,imageLicense:true,imageLicenseUrl:true}});
 // Do not keep selecting the same first Commons search hit for different articles.
 const approved=await prisma.newsArticle.findMany({
  where:{status:'PUBLISHED',imageUrl:{not:null},imageLicense:{not:null}},
  select:{imageUrl:true}
 });
 const usedUrls=new Set(approved.map(row=>row.imageUrl).filter((value):value is string=>Boolean(value)));
 let cursor=0,filled=0;
 await Promise.all(Array.from({length:Math.min(3,rows.length)},async()=>{
  while(cursor<rows.length){
   const row=rows[cursor++];
   // Preserve already approved publisher photos rather than overwriting them.
   if(row.imageUrl&&safeImageUrl(row.imageUrl,row.imageLicenseUrl||row.imageLicense||'',row.source)){
    await prisma.newsArticle.updateMany({where:{id:row.id,status:'PUBLISHED'},data:{imageLookupAt:new Date()}});
    continue;
   }
   const image=await findOpenImage(row.topic,row.urlHash,fetcher,usedUrls);
   if(image)usedUrls.add(image.imageUrl);
   const result=await prisma.newsArticle.updateMany({
    where:{id:row.id,status:'PUBLISHED',imageLicense:null,imageLicenseUrl:null},
    data:{imageLookupAt:new Date(),...(image||{})}
   });
   if(image&&result.count)filled++;
  }
 }));
 return {checked:rows.length,filled};
}
