/** Accurate, visible-content-only article metadata. No made-up author, date,
 * image or FAQ rich-result claims. This is ordinary structured data, not an
 * algorithm for forcing AI recommendations.
 */
import {publicIndexingEnabled,publicSiteOrigin} from './site-indexing';
export function articleStructuredData(input:{
 locale:'uk'|'en';path:string;title:string;description:string;publishedAt?:string
}):string|null{
 const origin=publicSiteOrigin();
 if(!publicIndexingEnabled()||!origin||!input.path.startsWith('/'+input.locale+'/'))return null;
 const json:Record<string,unknown>={
  '@context':'https://schema.org','@type':'Article',
  headline:input.title,description:input.description,
  url:origin+input.path,inLanguage:input.locale,
  author:{'@type':'Organization',name:'Galaxiora',url:origin},
  publisher:{'@type':'Organization',name:'Galaxiora',url:origin}
 };
 if(input.publishedAt&&!Number.isNaN(Date.parse(input.publishedAt)))
  json.datePublished=new Date(input.publishedAt).toISOString();
 return JSON.stringify(json).replace(/</g,'\\u003c');
}
