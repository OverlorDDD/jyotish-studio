import type {Metadata} from 'next';
import {notFound,permanentRedirect} from 'next/navigation';
import NewsPortal from '../../../components/news/NewsPortal';
import NewsStory from '../../../components/news/NewsStory';
import NewsWorld from '../../../components/NewsWorld';
import {isPortalLocale} from '../../../../lib/brand';
import {indexRobots,publicIndexingEnabled,publicSiteOrigin} from '../../../../lib/site-indexing';
import {TOPIC_COPY,fetchNewsFeed,fetchNewsStory,fetchSkyEvents,isNewsTopic,isOwn,kyivDate,newsTeaser,newsTitle,
 storyIndexable,storyKey,storySlug,type NewsItem,type NewsLocale} from '../../../../lib/news-public';
import {composeSkyArticle} from '../../../../lib/news-sky';

export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;slug:string}>};

function headline(item:NewsItem,locale:NewsLocale){
 const a=isOwn(item)&&item.event?composeSkyArticle(item.event):null;
 return {title:a?a.headline[locale]:newsTitle(item,locale),lead:a?a.lead[locale]:newsTeaser(item,locale)};
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale,slug}=await params;if(!isPortalLocale(locale))return {};
 const uk=locale==='uk';
 if(slug==='for-you')return {title:uk?'GalaxiNews — моя стрічка':'GalaxiNews — my feed',robots:{index:false,follow:true},
  alternates:{canonical:'/'+locale+'/news/for-you'}};
 if(isNewsTopic(slug)){
  const c=TOPIC_COPY[slug],name=uk?c.uk:c.en;
  const title=uk?name+' — новини | GalaxiNews':name+' News | GalaxiNews';
  const description=uk?c.leadUk:c.leadEn;
  return {title,description,robots:{...indexRobots(),'max-image-preview':'large'},
   alternates:{canonical:'/'+locale+'/news/'+slug,languages:{uk:'/uk/news/'+slug,en:'/en/news/'+slug,'x-default':'/en/news/'+slug}},
   openGraph:{type:'website',siteName:'Galaxiora',title,description,url:'/'+locale+'/news/'+slug,locale:uk?'uk_UA':'en_US'}};
 }
 const key=storyKey(slug);const data=key?await fetchNewsStory(key):null;
 if(!data)return {title:'GalaxiNews',robots:{index:false,follow:true}};
 const item=data.item,h=headline(item,locale);
 const other:NewsLocale=uk?'en':'uk',otherTitle=headline(item,other).title;
 const path='/'+locale+'/news/'+storySlug(item,locale);
 const languages:Record<string,string>={[locale]:path};
 if(otherTitle)languages[other]='/'+other+'/news/'+storySlug(item,other);
 if(languages.en)languages['x-default']=languages.en;
 const own=storyIndexable(item);
 return {title:(h.title||'GalaxiNews')+' | GalaxiNews',description:h.lead?.slice(0,300)||undefined,
  robots:own?{...indexRobots(),'max-image-preview':'large'}:{index:false,follow:true},
  alternates:{canonical:path,languages},
  openGraph:{type:'article',siteName:'Galaxiora',title:h.title||'GalaxiNews',description:h.lead||undefined,url:path,
   locale:uk?'uk_UA':'en_US',publishedTime:item.publishedAt,section:uk?TOPIC_COPY[item.topic]?.uk:TOPIC_COPY[item.topic]?.en}};
}
export default async function NewsSlugPage({params}:Props){
 const {locale:raw,slug}=await params;if(!isPortalLocale(raw))notFound();
 const locale=raw as NewsLocale;
 if(slug==='for-you')return <NewsWorld locale={locale}/>;
 if(isNewsTopic(slug))return <NewsPortal locale={locale} topic={slug}/>;
 const key=storyKey(slug);if(!key)notFound();
 const data=await fetchNewsStory(key);if(!data)notFound();
 const item=data.item,h=headline(item,locale);
 if(!h.title)notFound();
 const canonical=storySlug(item,locale);
 if(slug!==canonical)permanentRedirect('/'+locale+'/news/'+canonical);
 const own=isOwn(item);
 const [events,ownFeed]=own?await Promise.all([fetchSkyEvents(kyivDate(new Date(Date.now()-86400000)),21),
  fetchNewsFeed({locale,scope:'own',limit:24,sort:'latest'})]):[[],{items:[]}];
 const base=publicSiteOrigin(),url=(base||'https://galaxiora.com')+'/'+locale+'/news/'+canonical;
 const jsonLd=own&&base&&publicIndexingEnabled()?JSON.stringify({
  '@context':'https://schema.org','@type':'NewsArticle',headline:h.title,description:h.lead||undefined,
  datePublished:item.publishedAt,dateModified:item.publishedAt,inLanguage:locale==='uk'?'uk-UA':'en',
  mainEntityOfPage:url,image:[url+'/opengraph-image'],
  author:{'@type':'Organization',name:'Galaxiora',url:base},
  publisher:{'@type':'Organization',name:'Galaxiora',logo:{'@type':'ImageObject',url:base+'/galaxiora-favicon.png'}},
  isAccessibleForFree:true,articleSection:locale==='uk'?TOPIC_COPY[item.topic]?.uk:TOPIC_COPY[item.topic]?.en
 }).replace(/</g,'\\u003c'):null;
 return <NewsStory item={item} related={data.related} events={events} ownItems={ownFeed.items} locale={locale} jsonLd={jsonLd} shareUrl={url}/>;
}
