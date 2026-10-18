/** Working public brand. Replace only after domain and trademark clearance. */
export const BRAND = {
  name: 'AstraNira',
  tagline: 'Astrology, Tarot & Mindful Living',
  locales: ['en', 'uk'] as const,
} as const;
export type PortalLocale = 'en' | 'uk';
export const isPortalLocale = (value:string):value is PortalLocale => value==='en'||value==='uk';
export const portalPath = (locale:PortalLocale,section='') => '/' + locale + (section ? '/' + section : '');
