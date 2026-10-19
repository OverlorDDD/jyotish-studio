import type {MetadataRoute} from 'next';
import {publicIndexingEnabled,publicSiteOrigin} from '../lib/site-indexing';
export default function robots():MetadataRoute.Robots{
 if(!publicIndexingEnabled())return {rules:{userAgent:'*',disallow:'/'}};
 const origin=publicSiteOrigin()!;
 return {rules:{userAgent:'*',allow:'/',disallow:[
  '/api/','/en/account','/uk/account','/en/admin','/uk/admin'
 ]},sitemap:origin+'/sitemap.xml',host:origin};
}
