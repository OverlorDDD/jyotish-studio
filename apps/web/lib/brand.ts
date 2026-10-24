/** Public brand and module naming; workspace, API and repository names remain stable. */
export const BRAND = {
  name: 'Galaxiora',
  tagline: 'Explore your connection to the cosmos',
  taglineUk: 'Досліджуй свій зв’язок зі Всесвітом',
  locales: ['en','uk'] as const,
  moduleSuffixes: {
    astrology: 'Astro',
    tarot: 'Tarot',
    experts: 'Experts',
    yoga: 'Yoga',
    learn: 'Academy',
    news: 'News',
    community: 'Community',
    jyotish: 'Jyotish',
    account: 'Account',
    admin: 'Admin',
  } as const,
} as const;
export type PortalLocale = 'en' | 'uk';
export type PortalModule = keyof typeof BRAND.moduleSuffixes;
export const moduleTitle=(module:PortalModule):string=>module==='jyotish'?'GalaxiAstro · Jyotish':'Galaxi'+({astrology:'Astro',tarot:'Tarot',experts:'Experts',yoga:'Yoga',learn:'Learn',news:'News',community:'Com',account:'Account',admin:'Admin'} as const)[module];

export const isPortalLocale = (value:string):value is PortalLocale => value==='en'||value==='uk';
export const portalPath=(locale:PortalLocale,section='')=>'/'+locale+(section?'/'+(section==='astrology'?'astrology/jyotish':section):'');
