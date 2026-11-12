/** Tiny client-safe lookup for linking a computed nakshatra to its guide page.
 * Order matches packages/jyotish-core NAKSHATRAS (verified by tools/nakshatra-pages.test.mjs). */
export const NAKSHATRA_SLUGS=['ashwini','bharani','krittika','rohini','mrigashira','ardra','punarvasu','pushya',
 'ashlesha','magha','purva-phalguni','uttara-phalguni','hasta','chitra','swati','vishakha','anuradha','jyeshtha',
 'mula','purva-ashadha','uttara-ashadha','shravana','dhanishta','shatabhisha','purva-bhadrapada',
 'uttara-bhadrapada','revati'] as const;
export function nakshatraSlugByNumber(number:unknown):string|null{
 return typeof number==='number'&&Number.isInteger(number)&&number>=1&&number<=27?NAKSHATRA_SLUGS[number-1]:null;
}
export function nakshatraSlugByName(name:unknown):string|null{
 if(typeof name!=='string')return null;
 const slug=name.trim().toLowerCase().replace(/\s+/g,'-');
 return (NAKSHATRA_SLUGS as readonly string[]).includes(slug)?slug:null;
}
