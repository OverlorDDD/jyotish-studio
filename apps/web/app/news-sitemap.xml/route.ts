/** Google News sitemap: own GalaxiNews stories from the last 48 hours only. */
import {publicIndexingEnabled,publicSiteOrigin} from '../../lib/site-indexing';
import {fetchNewsFeed,newsTitle,storySlug,type NewsItem,type NewsLocale} from '../../lib/news-public';
import {composeSkyArticle} from '../../lib/news-sky';

export const dynamic='force-dynamic';
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export async function GET(){
 const head='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">';
 if(!publicIndexingEnabled())return new Response(head+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8'}});
 const base=publicSiteOrigin()!,since=Date.now()-48*3600000;
 const feeds=await Promise.all((['uk','en'] as NewsLocale[]).map(async l=>({l,items:(await fetchNewsFeed({locale:l,scope:'own',limit:48,sort:'latest'})).items})));
 const rows=feeds.flatMap(({l,items})=>items.filter((i:NewsItem)=>Date.parse(i.publishedAt)>since).map(i=>{
  const title=i.event?composeSkyArticle(i.event)?.headline[l]:newsTitle(i,l);
  if(!title)return '';
  return '<url><loc>'+esc(base+'/'+l+'/news/'+storySlug(i,l))+'</loc><news:news><news:publication><news:name>GalaxiNews</news:name><news:language>'+l+'</news:language></news:publication><news:publication_date>'+esc(new Date(i.publishedAt).toISOString())+'</news:publication_date><news:title>'+esc(title)+'</news:title></news:news></url>';
 })).filter(Boolean);
 return new Response(head+rows.join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=600'}});
}
