import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Intent-specific Tarot and natal pages have distinct UK/EN metadata and canonical deep links',()=>{
 const section=source('apps/web/app/[locale]/[section]/page.tsx');
 const natal=source('apps/web/app/[locale]/astrology/jyotish/page.tsx');
 assert.match(section,/section==='tarot'\?\{/);
 assert.match(section,/Таро онлайн — безкоштовні розклади/);
 assert.match(section,/Free Online Tarot Readings/);
 assert.match(section,/Sign in to draw and save your reading/);
 assert.match(section,/alternates:\{canonical:'\/'\+locale\+'\/'\+section/);
 assert.match(section,/'x-default':'\/en\/'\+section/);
 assert.ok(natal.includes('Натальна карта Джйотіш — 16 карт | Galaxiora'));
 assert.ok(natal.includes('Free Vedic Birth Chart (16 Charts) | Galaxiora'));
 assert.match(natal,/canonical:'\/'\+locale\+'\/astrology\/jyotish'/);
 assert.match(natal,/'x-default':'\/en\/astrology\/jyotish'/);
});

test('Canonical Tarot and birth chart are directly listed in SEO sitemap and real page uses tool',()=>{
 const index=source('apps/web/lib/site-indexing.ts');
 const sitemap=source('apps/web/app/sitemap.ts');
 const portal=source('apps/web/app/components/PortalSection.tsx');
 assert.match(index,/INDEXED_SECTIONS=\[[^\]]*'tarot'/);
 assert.match(index,/SEO_PATHS=\[[^\]]*'tarot'/);
 assert.match(index,/'astrology\/jyotish'/);
 assert.match(sitemap,/\.\.\.SEO_PATHS/);
 assert.match(sitemap,/alternates:\{languages:\{en:base\+paths\('en',suffix\),uk:base\+paths\('uk',suffix\)/);
 assert.match(portal,/if\(section==='tarot'\)/);
 assert.match(portal,/TarotStudio/);
});

test('No behavioral search-engine-referrer keyword redirect or private data enrichment is required',()=>{
 const section=source('apps/web/app/[locale]/[section]/page.tsx');
 const natal=source('apps/web/app/[locale]/astrology/jyotish/page.tsx');
 assert.doesNotMatch(section,/document\.referrer|google\.com\/search|utm_term|search_query/);
 assert.doesNotMatch(natal,/document\.referrer|google\.com\/search|utm_term|search_query/);
});
