/** R4.2: only coarse, allowlisted public growth data. NEVER send user text, search terms,
 * horoscope inputs, profile IDs or paths of user-generated content to analytics.
 */
export const GROWTH_PUBLIC_SECTIONS=new Set([
 '','about','astrology','astrology/jyotish','tarot','tarot/cards',
 'panchanga','eclipses/2027','horoscope','yoga','learn','news','community','methodology'
]);
export type GrowthEvent='article_to_tool_click'|'public_resource_share'|'tarot_spread_started'|'tarot_spread_completed'|'panchanga_calculation_completed';
export function safeGrowthPath(pathname:string):string|null{
 if(!/^\/(uk|en)(\/|$)/.test(pathname))return null;
 if(/[?#%]/.test(pathname))return null;
 const parts=pathname.split('/').filter(Boolean);
 const section=parts.slice(1).join('/');
 if(GROWTH_PUBLIC_SECTIONS.has(section))return '/'+parts[0]+(section?'/'+section:'');
 if(/^tarot\/cards\/[a-z-]+$/.test(section))return '/'+parts[0]+'/tarot/cards';
 if(/^learn\/[a-z-]+$/.test(section))return '/'+parts[0]+'/learn';
 if(/^yoga\/[a-z-]+$/.test(section))return '/'+parts[0]+'/yoga';
 if(/^horoscope\/(western\/)?[a-z-]+$/.test(section))return '/'+parts[0]+'/horoscope';
 return null;
}
export function safeGrowthEvent(name:string):name is GrowthEvent{
 return ['article_to_tool_click','public_resource_share','tarot_spread_started','tarot_spread_completed','panchanga_calculation_completed'].includes(name);
}

/** Names only: no question, birth information, location, ID or user-input payload. */
export function reportGrowthEvent(name:GrowthEvent):void{
 if(typeof window==='undefined'||!safeGrowthEvent(name))return;
 window.dispatchEvent(new CustomEvent('galaxiora:growth',{detail:{name}}));
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
