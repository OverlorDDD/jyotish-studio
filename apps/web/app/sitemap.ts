import type {MetadataRoute} from 'next';
import {publicIndexingEnabled,publicSiteOrigin,SEO_PATHS} from '../lib/site-indexing';
import {YOGA_PRACTICES} from '../lib/yoga-content';
import {ACADEMY_LESSONS} from '../lib/academy-content';
import {MOON_SIGN_GUIDES} from '../lib/moon-sign-guides';
import {publishedList} from '../lib/editorial-public';
const paths=(locale:'en'|'uk',suffix:string)=>'/'+locale+(suffix?'/'+suffix:'');
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 if(!publicIndexingEnabled())return [];
 const base=publicSiteOrigin()!;
 const [yoga,academy]=await Promise.all([publishedList('YOGA'),publishedList('ACADEMY')]);
 const allPages=[...new Set([...SEO_PATHS,...MOON_SIGN_GUIDES.map(s=>'horoscope/'+s.slug),
  ...YOGA_PRACTICES.map(p=>'yoga/'+p.slug),...ACADEMY_LESSONS.map(l=>'learn/'+l.slug),
  ...yoga.map(p=>'yoga/'+p.slug),...academy.map(p=>'learn/'+p.slug)])];
 return allPages.flatMap(suffix=>(['en','uk'] as const).map(locale=>({
  url:base+paths(locale,suffix),
  alternates:{languages:{en:base+paths('en',suffix),uk:base+paths('uk',suffix),'x-default':base+paths('en',suffix)}},
  changeFrequency:'weekly' as const,
  priority:suffix===''?1:0.7
 })));
}
