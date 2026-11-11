import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const names=[
 'Googlebot','bingbot','DuckDuckBot','Applebot',
 'OAI-SearchBot','ChatGPT-User','Claude-SearchBot','Claude-User',
 'PerplexityBot','Perplexity-User','Meta-WebIndexer',
 'Meta-ExternalFetcher','YandexBot','Baiduspider'
];

test('All public search crawlers inherit the same private-path protection',()=>{
 const robots=read('apps/web/app/robots.ts');
 assert.match(robots,/userAgent:'\*',allow:'\/',disallow:privatePaths/);
 assert.match(robots,/PUBLIC_SEARCH_USER_AGENTS\.map\(userAgent=>\(\{/);
 assert.match(robots,/userAgent,allow:'\/',disallow:privatePaths/);
 for(const name of names){
  assert.ok(robots.includes("'"+name+"'"),'missing explicitly documented crawler '+name);
 }
 for(const privatePath of ['/api/','/en/account','/uk/account','/en/admin','/uk/admin','/en/personal','/uk/personal']){
  assert.ok(robots.includes("'"+privatePath+"'"),'unprotected private path '+privatePath);
 }
 assert.match(robots,/if\(!publicIndexingEnabled\(\)\)return \{rules:\{userAgent:'\*',disallow:'\/'\}\}/);
 assert.ok(robots.includes("sitemap:origin+'/sitemap.xml'"));
});

test('AI discovery document links to genuine public canonical routes only',()=>{
 const doc=read('apps/web/public/llms.txt');
 assert.match(doc,/^# Galaxiora\n/);
 assert.match(doc,/https:\/\/galaxiora\.com\/sitemap\.xml/);
 assert.match(doc,/https:\/\/galaxiora\.com\/robots\.txt/);
 for(const path of ['en/astrology/jyotish','uk/astrology/jyotish','en/panchanga','uk/panchanga',
  'en/pedia','uk/pedia','en/horoscope','en/tarot','en/yoga','en/methodology']){
  assert.ok(doc.includes('https://galaxiora.com/'+path),'AI index missing public page '+path);
 }
 assert.doesNotMatch(doc,/https:\/\/galaxiora\.com\/(?:en|uk)\/(?:account|admin|personal)(?:\/|\b)/);
 assert.doesNotMatch(doc,/[\s(]https?:\/\/[^)\s]+\?/, 'no query-parameter duplicates in index');
});
