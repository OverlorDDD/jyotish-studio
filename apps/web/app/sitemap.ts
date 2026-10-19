import type {MetadataRoute} from 'next';
import {publicIndexingEnabled,publicSiteOrigin,SEO_PATHS} from '../lib/site-indexing';
const paths=(locale:'en'|'uk',suffix:string)=>'/'+locale+(suffix?'/'+suffix:'');
export default function sitemap():MetadataRoute.Sitemap{
 if(!publicIndexingEnabled())return [];
 const base=publicSiteOrigin()!;
 return SEO_PATHS.flatMap(suffix=>(['en','uk'] as const).map(locale=>({
  url:base+paths(locale,suffix),
  alternates:{languages:{en:base+paths('en',suffix),uk:base+paths('uk',suffix)}},
  changeFrequency:'weekly' as const,
  priority:suffix===''?1:0.7
 })));
}
