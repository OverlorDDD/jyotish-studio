import type {MetadataRoute} from 'next';
import {publicIndexingEnabled,publicSiteOrigin} from '../lib/site-indexing';

// Explicit crawl/retrieval policies make AI-search intent easy to audit.
// The '*' policy remains the future-proof fallback for new and unnamed bots.
// Search indexing is distinct from using a page for foundation-model training:
// Google-Extended, Applebot-Extended, GPTBot and ClaudeBot have separate purposes.
// We do not change any existing training opt-in/opt-out policy here.
const PUBLIC_SEARCH_USER_AGENTS=[
 'Googlebot',           // Google Search / Search AI Overviews and AI Mode
 'bingbot',             // Bing Search / Microsoft Copilot grounding
 'DuckDuckBot',         // DuckDuckGo
 'Applebot',            // Apple Search / Siri / Spotlight
 'OAI-SearchBot',       // ChatGPT Search
 'ChatGPT-User',        // User-triggered ChatGPT retrieval
 'Claude-SearchBot',    // Claude search discovery
 'Claude-User',         // User-triggered Claude retrieval
 'PerplexityBot',       // Perplexity Search
 'Perplexity-User',     // User-triggered Perplexity retrieval
 'Meta-WebIndexer',     // Meta AI search discovery
 'Meta-ExternalFetcher',// User-triggered Meta retrieval
 'YandexBot',           // Yandex Search
 'Baiduspider'          // Baidu Search
] as const;

const PRIVATE_CRAWL_PATHS=[
 '/api/','/en/account','/uk/account','/en/admin','/uk/admin',
 '/en/personal','/uk/personal'
] as const;

export default function robots():MetadataRoute.Robots{
 if(!publicIndexingEnabled())return {rules:{userAgent:'*',disallow:'/'}};
 const origin=publicSiteOrigin()!;
 const privatePaths=[...PRIVATE_CRAWL_PATHS];
 return {rules:[
  {userAgent:'*',allow:'/',disallow:privatePaths},
  ...PUBLIC_SEARCH_USER_AGENTS.map(userAgent=>({
   userAgent,allow:'/',disallow:privatePaths
  }))
 ],sitemap:origin+'/sitemap.xml',host:origin};
}
