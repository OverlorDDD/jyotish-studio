import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SEO_PATHS} from '../apps/web/lib/site-indexing.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('R3.2 sitemap uses only canonical public route paths',()=>{
 assert.ok(SEO_PATHS.includes('about'));
 assert.ok(SEO_PATHS.includes('astrology/jyotish'));
 assert.ok(!SEO_PATHS.includes('astrology'),'redirecting alias not a sitemap URL');
 assert.equal(SEO_PATHS.length,new Set(SEO_PATHS).size,'no duplicate core routes');
 const source=read('apps/web/app/sitemap.ts');
 assert.match(source,/publicIndexingEnabled\(\)/);
 assert.match(source,/MOON_SIGN_GUIDES/);
 assert.match(source,/publishedList/);
 assert.doesNotMatch(source,/changeFrequency:|'weekly' as const/);
 assert.doesNotMatch(source,/priority:suffix/);
});

test('R3.2 Galaxiora has a consistent official brand entity and an indexable About page',()=>{
 const root=read('apps/web/app/layout.tsx');
 assert.match(root,/'@type':'WebSite'/);
 assert.match(root,/'@type':'Organization'/);
 assert.match(root,/alternateName:\['galaxiora.com'\]/);
 assert.match(root,/\/#organization/);
 assert.match(root,/\/icon.svg/);
 const about=read('apps/web/app/[locale]/about/page.tsx');
 assert.match(about,/generateMetadata/);
 assert.match(about,/indexRobots\(\)/);
 assert.match(about,/\/'\+locale\+'\/about'/);
 assert.match(about,/'@type':'AboutPage'/);
 assert.match(about,/Swiss Ephemeris/);
 assert.match(about,/GalaxiNews/);
 const home=read('apps/web/app/components/PortalHome.tsx');
 assert.match(home,/What is Galaxiora\?/);
 assert.match(home,/Що таке Galaxiora\?/);
 assert.match(home,/\/about/);
 const footer=read('apps/web/app/components/PortalShell.tsx');
 assert.match(footer,/About Galaxiora/);
 assert.match(footer,/Про Galaxiora/);
});

test('R3.2 private member pages remain nonindexed and no fake external brand profiles are asserted',()=>{
 const root=read('apps/web/app/layout.tsx');
 assert.doesNotMatch(root,/sameAs:/,'never invent third-party profiles');
 for(const url of ['account','admin','personal','editorial']){
  assert.match(read('apps/web/app/[locale]/'+url+'/page.tsx'),/index:false/);
 }
 const topics=read('apps/web/app/[locale]/[section]/topic/[threadId]/page.tsx');
 assert.match(topics,/index:false/);
 const bots=read('apps/web/app/robots.ts');
 assert.match(bots,/OAI-SearchBot/);
 assert.match(bots,/\/uk\/personal/);
});

test('R3.2 live audit uses only read-only HTTP fetch, checks all sitemap locs and fails on blockers',()=>{
 const audit=read('tools/r32-seo-audit.mjs');
 assert.match(audit,/<loc>/);
 assert.match(audit,/CANONICAL/);
 assert.match(audit,/HREFLANG_/);
 assert.match(audit,/META_NOINDEX/);
 assert.match(audit,/PRIVATE_IN_SITEMAP/);
 assert.match(audit,/NOT_200/);
 assert.match(audit,/process.exitCode=errors.length\?2:0/);
 assert.doesNotMatch(audit,/method:\s*['"](POST|PUT|PATCH|DELETE)/);
});
