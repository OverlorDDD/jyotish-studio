import type {MetadataRoute} from 'next';
import {publicIndexingEnabled,publicSiteOrigin} from '../lib/site-indexing';
export default function robots():MetadataRoute.Robots{
 if(!publicIndexingEnabled())return {rules:{userAgent:'*',disallow:'/'}};
 const origin=publicSiteOrigin()!;
 const privatePaths=['/api/','/en/account','/uk/account','/en/admin','/uk/admin',
  '/en/personal','/uk/personal'];
 return {rules:[
  {userAgent:'*',allow:'/',disallow:privatePaths},
  // Search retrieval is separate from AI model training. Explicitly allow
  // OpenAI's search crawler only to the same PUBLIC routes as other bots.
  {userAgent:'OAI-SearchBot',allow:'/',disallow:privatePaths}
 ],sitemap:origin+'/sitemap.xml',host:origin};
}
