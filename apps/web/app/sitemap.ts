import type {MetadataRoute} from 'next';
import {publicIndexingEnabled,publicSiteOrigin,SEO_PATHS} from '../lib/site-indexing';
import {YOGA_PRACTICES} from '../lib/yoga-content';
import {ACADEMY_LESSONS} from '../lib/academy-content';
import {PEDIA_ARTICLES,PEDIA_CATEGORIES} from '../lib/pedia-content';
import {MOON_SIGN_GUIDES} from '../lib/moon-sign-guides';
import {TAROT_GUIDES} from '../lib/tarot-guides';
import {publishedList} from '../lib/editorial-public';
const paths=(locale:'en'|'uk',suffix:string)=>'/'+locale+(suffix?'/'+suffix:'');
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 if(!publicIndexingEnabled())return [];
 const base=publicSiteOrigin()!;
 const [yoga,academy]=await Promise.all([publishedList('YOGA'),publishedList('ACADEMY')]);
 const allPages=[...new Set([...SEO_PATHS,...MOON_SIGN_GUIDES.map(s=>'horoscope/'+s.slug),
  ...MOON_SIGN_GUIDES.map(s=>'horoscope/western/'+s.slug),
  ...YOGA_PRACTICES.map(p=>'yoga/'+p.slug),...ACADEMY_LESSONS.map(l=>'pedia/'+l.slug),...PEDIA_ARTICLES.map(a=>'pedia/'+a.slug),
  ...PEDIA_CATEGORIES.map(c=>'pedia/topic/'+c.id),
  ...TAROT_GUIDES.map(card=>'tarot/cards/'+card.slug),
  ...yoga.map(p=>'yoga/'+p.slug),...academy.map(p=>'pedia/'+p.slug)])];
 // /en and /uk are permanent redirects to localized Jyotish routes, not HTTP 200 canonicals.
 // Sitemap must list only final indexable URLs; never announce redirect aliases.
 const localized=allPages.filter(suffix=>suffix!=='').flatMap(suffix=>(['en','uk'] as const).map(locale=>({
  url:base+paths(locale,suffix),
  alternates:{languages:{en:base+paths('en',suffix),uk:base+paths('uk',suffix),'x-default':base+paths('en',suffix)}},
  // No invented lastmod: emit it only when a trustworthy content update timestamp exists.
 })));
 return [{url:base+'/',alternates:{languages:{en:base+'/en/astrology/jyotish',uk:base+'/uk/astrology/jyotish','x-default':base+'/'}}},...localized];
}
