/** Coarse server-only HTML request categorization; never derive a visitor identity. */
import {safeGrowthPath} from './growth-metrics.ts';
const ROBOT=/(bot|crawler|spider|google-inspection|headless|lighthouse|curl|wget|python|go-http-client|httpclient|playwright|selenium|axios|node-fetch|postman|insomnia|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|bytespider|semrush|ahrefs|mj12|uptime|monitor)/i;
/** The very same allowlist is used by HTML-request and browser-rendered
 * counters. Never send or persist a full page slug, city, query or user ID.
 * This is a page/category classifier, not an assertion that a 200 was served.
 */
export function publicAggregateSectionForPath(pathname:string):string|null{
 if(pathname==='/')return 'home';
 if(pathname.endsWith('/')||pathname.includes('//'))return null;
 if(/^\/(?:uk|en)\/about-me$/.test(pathname))return 'about';
 if(/^\/(?:uk|en)\/panchanga\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname))return 'panchanga';
 if(/^\/(?:uk|en)\/news\/[a-z0-9-]+-[0-9a-f]{8}$/.test(pathname))return 'news';
 if(/^\/(?:uk|en)\/astrology\/(?:moon-sign-vs-sun-sign|divisional-charts)$/.test(pathname))return 'astrology';
 if(/^\/(?:uk|en)\/nakshatra(?:\/[a-z]+(?:-[a-z]+)*)?$/.test(pathname))return 'astrology';
 const safe=safeGrowthPath(pathname);
 if(!safe)return null;
 const section=safe.split('/').slice(2).join('/');
 if(!section)return 'home';
 if(section==='astrology/jyotish')return 'jyotish';
 if(section==='astrology/divisional-charts')return 'astrology';
 // The existing dashboard uses "learn" for the public GalaxiPedia.
 if(section==='pedia')return 'learn';
 if(section==='tarot/cards')return 'tarot_cards';
 if(section==='eclipses/2027')return 'eclipses';
 return section==='astrology'||section==='tarot'||section==='panchanga'||
  section==='horoscope'||section==='yoga'||section==='learn'||section==='news'||
  section==='community'||section==='methodology'||section==='about'?section:null;
}
export function eligiblePublicHtmlSection(pathname:string,headers:{
 accept:string|null;agent:string|null;purpose:string|null;routerPrefetch:string|null;
 rsc:string|null;fetchDest:string|null;
}):string|null{
 if(!headers.accept?.toLowerCase().includes('text/html'))return null;
 if(!headers.agent||ROBOT.test(headers.agent))return null;
 if(headers.purpose?.toLowerCase().includes('prefetch')||headers.routerPrefetch||
  headers.rsc||headers.fetchDest&&headers.fetchDest!=='document')return null;
 return publicAggregateSectionForPath(pathname);
}

/** One coarse referral category per eligible public HTML request.
 * Do not persist referrers, query strings, domains, cookies or identities.
 * UTM values are declarations, not verified traffic origins.
 */
export type ReferralBucket='google'|'other_search'|'social'|'partner_tag'|'other_referral'|'internal'|'unknown';
export function classifyReferralBucket(rawReferrer:string|null,rawQuery:string):ReferralBucket{
 let host='';
 try{
  if(rawReferrer){
   const url=new URL(rawReferrer);
   if(url.protocol==='https:'||url.protocol==='http:')host=url.hostname.toLowerCase();
  }
 }catch{}
 if(host==='galaxiora.com'||host==='www.galaxiora.com')return 'internal';
 const matches=(base:string)=>host===base||host.endsWith('.'+base);
 if(host&&(
  matches('google.com')||/^(.+\.)?google\.(co\.[a-z]{2}|[a-z]{2,3})$/.test(host)
 ))return 'google';
 if(host&&['bing.com','yahoo.com','duckduckgo.com','ecosia.org','yandex.com','yandex.ru','brave.com'].some(matches))return 'other_search';
 if(host&&['youtube.com','youtu.be','reddit.com','t.co','x.com','twitter.com','facebook.com','instagram.com','tiktok.com','telegram.org','t.me','linkedin.com','pinterest.com','threads.net'].some(matches))return 'social';
 if(host)return 'other_referral';
 // Query parameters are never stored; only a fixed campaign source category
 // can help distinguish links where messaging apps strip the Referer header.
 try{
  const q=new URLSearchParams(rawQuery.startsWith('?')?rawQuery.slice(1):rawQuery);
  if(q.get('utm_medium')==='social'&&
    ['reddit','youtube','telegram','instagram','facebook','tiktok','linkedin','twitter','x'].includes(q.get('utm_source')||''))return 'social';
  if(q.get('utm_medium')==='social'&&q.get('utm_source')==='partner')return 'partner_tag';
  if(q.get('utm_source')==='google'&&q.get('utm_medium')==='organic')return 'google';
 }catch{}
 return 'unknown';
}
