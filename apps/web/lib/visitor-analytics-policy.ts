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
 if(pathname==='/'||pathname.endsWith('/')||pathname.includes('//'))return null; // root is canonicalized /en
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
