/** R4.2: only coarse, allowlisted public growth data. NEVER send user text, search terms,
 * horoscope inputs, profile IDs or paths of user-generated content to analytics.
 */
export const GROWTH_PUBLIC_SECTIONS=new Set([
 '','about','astrology','astrology/jyotish','tarot','tarot/cards',
 'panchanga','eclipses/2027','horoscope','yoga','learn','news','community','methodology'
]);
export type GrowthEvent='article_to_tool_click'|'public_resource_share';
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
 return name==='article_to_tool_click'||name==='public_resource_share';
}
