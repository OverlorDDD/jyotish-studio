/** Coarse server-only HTML request categorization; never derive a visitor identity. */
import {safeGrowthPath} from './growth-metrics.ts';
const ROBOT=/(bot|crawler|spider|google-inspection|headless|lighthouse|curl|wget|python|go-http-client|httpclient|playwright|selenium|axios|node-fetch|postman|insomnia|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|bytespider|semrush|ahrefs|mj12|uptime|monitor)/i;
export function eligiblePublicHtmlSection(pathname:string,headers:{
 accept:string|null;agent:string|null;purpose:string|null;routerPrefetch:string|null;
 rsc:string|null;fetchDest:string|null;
}):string|null {
 // GET + non-redirect/canonical path checks are performed by middleware.
 if(!headers.accept?.toLowerCase().includes('text/html'))return null;
 if(!headers.agent||ROBOT.test(headers.agent))return null;
 if(headers.purpose?.toLowerCase().includes('prefetch')||headers.routerPrefetch||
  headers.rsc||headers.fetchDest&&headers.fetchDest!=='document')return null;
 if(pathname==='/' )return 'home'; // Root serves a real public HTML page, not a redirect.
 if(pathname.endsWith('/')||pathname.includes('//'))return null;
 const safe=safeGrowthPath(pathname);
 if(!safe)return null;
 const section=safe.split('/').slice(2).join('/');
 if(!section)return 'home';
 if(section==='astrology/jyotish')return 'jyotish';
 if(section==='tarot/cards')return 'tarot_cards';
 if(section==='eclipses/2027')return 'eclipses';
 return section==='astrology'||section==='tarot'||section==='panchanga'||
  section==='horoscope'||section==='yoga'||section==='learn'||section==='news'||
  section==='community'||section==='methodology'||section==='about'?section:null;
}


/** One coarse referral category per eligible public HTML request.
 * Do not persist referrers, query strings, domains, cookies or identities.
 * UTM values are declarations, not verified traffic origins.
 */
export type ReferralBucket='google'|'other_search'|'social'|'partner_tag'|'other_referral'|'unknown';
export function classifyReferralBucket(rawReferrer:string|null,rawQuery:string):ReferralBucket{
 let host='';
 try{
  if(rawReferrer){
   const url=new URL(rawReferrer);
   if(url.protocol==='https:'||url.protocol==='http:')host=url.hostname.toLowerCase();
  }
 }catch{}
 if(host==='galaxiora.com'||host==='www.galaxiora.com')return 'unknown';
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
