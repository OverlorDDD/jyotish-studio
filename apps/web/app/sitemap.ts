import type {MetadataRoute} from 'next';
import {publicIndexingEnabled,publicSiteOrigin,SEO_PATHS} from '../lib/site-indexing';
import {YOGA_PRACTICES} from '../lib/yoga-content';
import {ACADEMY_LESSONS} from '../lib/academy-content';
import {PEDIA_ARTICLES,PEDIA_CATEGORIES} from '../lib/pedia-content';
import {MOON_SIGN_GUIDES} from '../lib/moon-sign-guides';
import {TAROT_LIBRARY} from '../lib/tarot-meanings';
import {PANCHANGA_CITIES} from '../lib/panchanga-cities';
import {NAKSHATRA_GUIDES} from '../lib/nakshatra-guides';
import {publishedList} from '../lib/editorial-public';
import {NEWS_TOPICS,fetchNewsFeed,storySlug,newsTitle} from '../lib/news-public';
import {composeSkyArticle} from '../lib/news-sky';
const paths=(locale:'en'|'uk',suffix:string)=>'/'+locale+(suffix?'/'+suffix:'');
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 if(!publicIndexingEnabled())return [];
 const base=publicSiteOrigin()!;
 const [yoga,academy,ownUk,ownEn]=await Promise.all([publishedList('YOGA'),publishedList('ACADEMY'),
  fetchNewsFeed({locale:'uk',scope:'own',limit:48,sort:'latest'}),fetchNewsFeed({locale:'en',scope:'own',limit:48,sort:'latest'})]);
 const allPages=[...new Set([...SEO_PATHS,...MOON_SIGN_GUIDES.map(s=>'horoscope/'+s.slug),
  ...MOON_SIGN_GUIDES.map(s=>'horoscope/western/'+s.slug),
  ...YOGA_PRACTICES.map(p=>'yoga/'+p.slug),...ACADEMY_LESSONS.map(l=>'pedia/'+l.slug),...PEDIA_ARTICLES.map(a=>'pedia/'+a.slug),
  ...PEDIA_CATEGORIES.map(c=>'pedia/topic/'+c.id),
  ...TAROT_LIBRARY.map(card=>'tarot/cards/'+card.slug),
  ...PANCHANGA_CITIES.map(city=>'panchanga/'+city.slug),
  'nakshatra',...NAKSHATRA_GUIDES.map(item=>'nakshatra/'+item.slug),
  ...yoga.map(p=>'yoga/'+p.slug),...academy.map(p=>'pedia/'+p.slug),
  ...NEWS_TOPICS.map(t=>'news/'+t)])];
 // /en and /uk redirect, and / is a 200 alias with canonical /en/astrology/jyotish.
 // Sitemap must list only final indexable URLs; never announce redirect aliases.
 const localized=allPages.filter(suffix=>suffix!=='').flatMap(suffix=>(['en','uk'] as const).map(locale=>({
  url:base+paths(locale,suffix),
  alternates:{languages:{en:base+paths('en',suffix),uk:base+paths('uk',suffix),'x-default':base+paths('en',suffix)}},
  // No invented lastmod: emit it only when a trustworthy content update timestamp exists.
 })));
 // Own GalaxiNews stories only (world stories are noindex): one entry per
 // locale with the slug of that locale, and the date we published them.
 const stories=[...ownUk.items.map(i=>({i,l:'uk' as const})),...ownEn.items.map(i=>({i,l:'en' as const}))]
  .filter(({i,l})=>i.event&&composeSkyArticle(i.event)||newsTitle(i,l))
  .map(({i,l})=>({url:[base,l,'news',storySlug(i,l)].join('/'),lastModified:i.publishedAt}));
 (localized as MetadataRoute.Sitemap).push(...stories);
 return localized;
}
