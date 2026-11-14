/** GalaxiNews RSS: own sky stories plus curated world stories (titles link to our story pages). */
import {publicSiteOrigin} from '../../../../lib/site-indexing';
import {fetchNewsFeed,newsTeaser,newsTitle,sourceLabel,storySlug,isOwn,type NewsLocale} from '../../../../lib/news-public';
import {composeSkyArticle} from '../../../../lib/news-sky';

export const dynamic='force-dynamic';
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export async function GET(_req:Request,{params}:{params:Promise<{locale:string}>}){
 const {locale:raw}=await params;
 if(raw!=='uk'&&raw!=='en')return new Response('Not found',{status:404});
 const l=raw as NewsLocale,base=publicSiteOrigin()||'https://galaxiora.com';
 const feed=await fetchNewsFeed({locale:l,limit:40,sort:'latest'});
 const items=feed.items.map(i=>{
  const art=isOwn(i)&&i.event?composeSkyArticle(i.event):null;
  const title=art?art.headline[l]:newsTitle(i,l);if(!title)return '';
  const link=base+'/'+l+'/news/'+storySlug(i,l),desc=art?art.lead[l]:newsTeaser(i,l)||'';
  return '<item><title>'+esc(title)+'</title><link>'+esc(link)+'</link><guid isPermaLink="true">'+esc(link)+'</guid><pubDate>'+new Date(i.publishedAt).toUTCString()+'</pubDate><source url="'+esc(base+'/'+l+'/news')+'">'+esc(sourceLabel(i,l))+'</source>'+(desc?'<description>'+esc(desc)+'</description>':'')+'</item>';
 }).filter(Boolean).join('');
 const xml='<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>GalaxiNews</title><link>'+esc(base+'/'+l+'/news')+'</link><description>'+(l==='uk'?'Новини неба, Джйотиш, Таро й ведичної традиції':'Sky, Jyotish, Tarot and Vedic tradition news')+'</description><language>'+l+'</language>'+items+'</channel></rss>';
 return new Response(xml,{headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'public, max-age=600'}});
}
