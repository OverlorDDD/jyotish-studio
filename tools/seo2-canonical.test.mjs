import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Legacy astrology alias is permanent, source metadata is nonindex and no redirect URL enters sitemap',()=>{
 const section=read('apps/web/app/[locale]/[section]/page.tsx');
 assert.match(section,/if\(section==='astrology'\)permanentRedirect\(portalPath\(locale,'astrology\/jyotish'\)\)/);
 assert.match(section,/if\(section==='astrology'\)return \{robots:\{index:false/);
 const index=read('apps/web/lib/site-indexing.ts');
 const publicSitemapPaths=index.split('export const SEO_PATHS=')[1].split(' as const;')[0];
 assert.doesNotMatch(publicSitemapPaths,/['"]astrology['"]\s*,/);
 assert.match(index,/'astrology\/jyotish'/);
 const sitemap=read('apps/web/app/sitemap.ts');
 assert.match(sitemap,/SEO_PATHS/);
});

test('R4 read-only auditor follows current permanent GalaxiPedia URLs not obsolete learn routes',()=>{
 const audit=read('tools/r4-search-discovery-audit.mjs');
 assert.match(audit,/\/uk\/pedia\/nakshatras/);
 assert.match(audit,/tarot\|astrology\|pedia/);
 assert.doesNotMatch(audit,/\/uk\/learn\/nakshatras/);
});
