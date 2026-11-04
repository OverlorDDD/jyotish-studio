/**
 * GROWTH-3.2: fixed, privacy-safe acquisition campaign links.
 * No link shorteners, redirects, cookies, per-user IDs, question text,
 * birth details, exact locations or raw UTM passthrough.
 * Usage: node --experimental-strip-types tools/g32-campaigns.mjs --json
 */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {safeGrowthCampaign,safeGrowthToolForPath} from '../apps/web/lib/growth-metrics.ts';

const ORIGIN='https://galaxiora.com';
const ALLOWED_PATHS=new Set([
 '/en/tarot','/uk/tarot',
 '/en/astrology/jyotish','/uk/astrology/jyotish',
 '/en/panchanga','/uk/panchanga'
]);
const CAMPAIGNS=Object.freeze([
 {id:'G32-E1-YT',channel:'youtube',medium:'social',campaign:'tarot_cards',
  path:'/en/tarot',intent:'pick a card / three-card Tarot',format:'YouTube profile link',
  stage:'ready_not_published',authNote:'Account required to draw; never promise guest readings'},
 {id:'G32-E2-YT',channel:'youtube',medium:'social',campaign:'astro_basics',
  path:'/en/astrology/jyotish',intent:'Vedic Moon vs Western Sun',format:'YouTube profile link',
  stage:'ready_not_published',authNote:'A chart uses birth inputs; no personal screenshots'},
 {id:'G32-E3-YT',channel:'youtube',medium:'social',campaign:'panchanga_today',
  path:'/en/panchanga',intent:'Panchanga differs by city',format:'YouTube profile link',
  stage:'ready_not_published',authNote:'Use a reproducible real city/date before publishing'},
 {id:'G32-E3-TG',channel:'telegram',medium:'social',campaign:'panchanga_today',
  path:'/uk/panchanga',intent:'Панчанга для свого міста',format:'Owned Telegram channel post',
  stage:'ready_not_published',authNote:'Only after content facts and channel access verified'},
 {id:'G32-E4-COMMUNITY',channel:'community',medium:'social',campaign:'launch',
  path:'/en/astrology/jyotish',intent:'First-time independent usability feedback',format:'Allowed community post',
  stage:'ready_not_published',authNote:'Check moderator policy; disclose site ownership'},
 {id:'G32-E4-UA',channel:'community',medium:'social',campaign:'launch',
  path:'/uk/panchanga',intent:'Україномовний тест практичної Панчанги',format:'Voluntary community QA request',
  stage:'ready_not_published',authNote:'No personal birth data or session recording'},
 {id:'G32-E5-PARTNER',channel:'partner',medium:'social',campaign:'astro_basics',
  path:'/en/astrology/jyotish',intent:'Independent educational calculator review',format:'Consented creator referral',
  stage:'ready_not_published',authNote:'Personalized manual outreach, no expectation of links'}
]);
export function buildCampaignUrl(entry){
 if(!entry||!ALLOWED_PATHS.has(entry.path)||
  !['youtube','telegram','partner','community'].includes(entry.channel)||
  entry.medium!=='social')throw Error('Unapproved campaign destination/source');
 const url=new URL(entry.path,ORIGIN);
 url.searchParams.set('utm_source',entry.channel);
 url.searchParams.set('utm_medium',entry.medium);
 url.searchParams.set('utm_campaign',entry.campaign);
 const safe=safeGrowthCampaign(url.search);
 if(!safe||safe.campaign_source!==entry.channel||safe.campaign_medium!=='social'||
  safe.campaign_name!==entry.campaign||!safeGrowthToolForPath(entry.path))
  throw Error('Campaign does not match production analytics allowlist');
 return url.toString();
}
export function listCampaigns(){
 return CAMPAIGNS.map(c=>({...c,url:buildCampaignUrl(c)}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 console.log(process.argv.includes('--json')?JSON.stringify(listCampaigns(),null,2):
  listCampaigns().map(c=>c.id+' '+c.url+' [NOT PUBLISHED]').join('\n'));
}
