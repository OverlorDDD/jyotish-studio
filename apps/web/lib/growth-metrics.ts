/** R4.2: only coarse, allowlisted public growth data. NEVER send user text, search terms,
 * horoscope inputs, profile IDs or paths of user-generated content to analytics.
 */
export const GROWTH_PUBLIC_SECTIONS=new Set([
 '','about','astrology','astrology/jyotish','astrology/divisional-charts','tarot','tarot/cards',
 'panchanga','eclipses/2027','horoscope','yoga','learn','pedia','news','community','methodology'
]);
export type PublicTool='jyotish'|'panchanga'|'tarot';
export type PublicToolEvent='public_tool_started'|'public_tool_completed'|'public_tool_failed'|'public_tool_auth_required';
export type GrowthEvent='jyotish_chart_completed'|'article_to_tool_click'|'public_resource_share'|'tarot_spread_started'|'tarot_spread_completed'|'panchanga_calculation_completed'|PublicToolEvent;
const PUBLIC_TOOL_EVENTS=new Set<PublicToolEvent>(['public_tool_started','public_tool_completed','public_tool_failed','public_tool_auth_required']);
export function safePublicTool(tool:string):tool is PublicTool{
 return tool==='jyotish'||tool==='panchanga'||tool==='tarot';
}
export function safePublicToolEvent(name:string):name is PublicToolEvent{
 return PUBLIC_TOOL_EVENTS.has(name as PublicToolEvent);
}
export function safeGrowthToolForPath(pathname:string):PublicTool|null{
 if(!safeGrowthPath(pathname))return null;
 if(/^\/(uk|en)\/astrology\/jyotish$/.test(pathname))return 'jyotish';
 if(/^\/(uk|en)\/panchanga$/.test(pathname))return 'panchanga';
 if(/^\/(uk|en)\/tarot$/.test(pathname))return 'tarot';
 return null;
}
export function safeGrowthPath(pathname:string):string|null{
 // The non-localized domain root serves English and canonically points to /en.
 // It is also the site's Google-branded entry point, so it must be measured.
 if(pathname==='/')return '/en';
 if(!/^\/(uk|en)(\/|$)/.test(pathname))return null;
 if(/[?#%]/.test(pathname))return null;
 const parts=pathname.split('/').filter(Boolean);
 const section=parts.slice(1).join('/');
 if(GROWTH_PUBLIC_SECTIONS.has(section))return '/'+parts[0]+(section?'/'+section:'');
 if(/^tarot\/cards\/[a-z-]+$/.test(section))return '/'+parts[0]+'/tarot/cards';
 if(/^learn\/[a-z-]+$/.test(section))return '/'+parts[0]+'/learn';
 // GalaxiPedia guides and topical hubs are public editorial content. Record
 // only the coarse section, never a free-form slug or URL query.
 if(/^pedia\/(?:[a-z0-9-]+|topic\/[a-z0-9-]+)$/.test(section))return '/'+parts[0]+'/pedia';
 if(/^yoga\/[a-z-]+$/.test(section))return '/'+parts[0]+'/yoga';
 if(/^horoscope\/(western\/)?[a-z-]+$/.test(section))return '/'+parts[0]+'/horoscope';
 return null;
}
export function safeGrowthEvent(name:string):name is GrowthEvent{
 return ['jyotish_chart_completed','article_to_tool_click','public_resource_share','tarot_spread_started','tarot_spread_completed','panchanga_calculation_completed'].includes(name)||safePublicToolEvent(name);
}

/** Names only: no question, birth information, location, ID or user-input payload. */
export function reportGrowthEvent(name:GrowthEvent):void{
 if(typeof window==='undefined'||!safeGrowthEvent(name))return;
 window.dispatchEvent(new CustomEvent('galaxiora:growth',{detail:{name}}));
}

/** Coarse funnel events only: never accept user-generated properties or free-text errors.
 * GrowthConsent cross-checks the tool against the current allowlisted route.
 */
export function reportPublicToolEvent(name:PublicToolEvent,tool:PublicTool):void{
 if(typeof window==='undefined'||!safePublicToolEvent(name)||!safePublicTool(tool))return;
 window.dispatchEvent(new CustomEvent('galaxiora:growth',{detail:{name,tool}}));
}

/** Map only preapproved public campaigns to GA4 fields, never copy raw UTM values.
 * Does not alter the safe public page URL and does not allow user-supplied identifiers.
 */
export function safeGrowthCampaign(query:string):{campaign_source:string;campaign_medium:string;campaign_name:string}|null{
 const params=new URLSearchParams(query);
 const source=params.get('utm_source')?.toLowerCase();
 const medium=params.get('utm_medium')?.toLowerCase();
 const campaign=params.get('utm_campaign')?.toLowerCase();
 const approvedSources=new Set(['telegram','youtube','partner']);
 const approvedCampaigns=new Set(['launch','astro_basics','tarot_cards','panchanga_today','eclipses_2027']);
 if(!source||!approvedSources.has(source)||medium!=='social'||!campaign||!approvedCampaigns.has(campaign))return null;
 return {campaign_source:source,campaign_medium:'social',campaign_name:campaign};
}


/** G4 AI Search entry attribution. Only four named providers; never forward raw
 * query strings, prompts, referrer paths or birth details to analytics.
 * A supplied UTM is an attribution hint, not proof of a genuine bot visit.
 */
export type AiSearchSource='chatgpt'|'perplexity'|'claude'|'copilot';
export function safeAiSearchSource(search:string,referrer:string):AiSearchSource|null{
 const approved:Record<string,AiSearchSource>={
  'chatgpt.com':'chatgpt','perplexity.ai':'perplexity','claude.ai':'claude',
  'copilot.microsoft.com':'copilot'
 };
 if(typeof search==='string'&&search.length<=2048){
  const source=new URLSearchParams(search).get('utm_source')?.trim().toLowerCase();
  if(source&&Object.prototype.hasOwnProperty.call(approved,source))return approved[source];
 }
 if(typeof referrer!=='string'||referrer.length>2048)return null;
 try{
  const url=new URL(referrer);
  if(url.protocol!=='https:')return null;
  const host=url.hostname.toLowerCase();
  return approved[host]||null;
 }catch{return null;}
}
