/** Working public brand. Replace only after domain and trademark clearance. */
export const BRAND = {
  name: 'Galaxiora',
  tagline: 'Explore your connection to the cosmos',
  locales: ['en', 'uk'] as const,
  modules: {
    astrology: 'Galaxiora Astro',
    tarot: 'Galaxiora Tarot',
    experts: 'Galaxiora Experts',
    yoga: 'Galaxiora Yoga',
    learn: 'Galaxiora Academy',
    jyotish: 'Galaxiora Jyotish',
    account: 'Galaxiora Account',
    admin: 'Galaxiora Admin',
  } as const,
} as const;
export type PortalLocale = 'en' | 'uk';
export const isPortalLocale = (value:string):value is PortalLocale => value==='en'||value==='uk';
export const portalPath = (locale:PortalLocale,section='') => '/' + locale + (section ? '/' + section : '');
