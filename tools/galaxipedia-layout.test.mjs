import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('GalaxiPedia landing places first real search above browse/results/topic cards',()=>{
 const hub=source('apps/web/app/components/AcademyHub.tsx');
 const catalog=source('apps/web/app/components/PediaCatalog.tsx');
 assert.ok(hub.indexOf('<header className="as-pedia-intro"')>=0);
 assert.equal((hub.match(/<h1>/g)||[]).length,1,'one unique page H1');
 assert.ok(hub.indexOf('<PediaCatalog')>hub.indexOf('<h1>'));
 assert.ok(hub.indexOf('<PediaCatalog')<hub.indexOf('id="pedia-topics"'));
 assert.ok(catalog.indexOf('className="as-pedia-search-panel"')<catalog.indexOf('className="as-pedia-library-head"'));
 assert.ok(catalog.indexOf('className="as-pedia-search-panel"')<catalog.indexOf('className="as-pedia-filters"'));
 assert.ok(catalog.indexOf('className="as-pedia-filters"')<catalog.indexOf('id="pedia-results"'));
 assert.match(catalog,/type="search"/);
 assert.match(catalog,/role="search"/);
 assert.match(catalog,/aria-controls="pedia-results"/);
 assert.match(catalog,/onSubmit=\{search\}/);
 assert.match(catalog,/aria-pressed=\{category===topic.id\}/);
});

test('SEO discovery: all 6 real topic links and published articles render server-side, no JS-only content fetch',()=>{
 const hub=source('apps/web/app/components/AcademyHub.tsx');
 const catalog=source('apps/web/app/components/PediaCatalog.tsx');
 assert.match(hub,/publishedList\('ACADEMY'\)/);
 assert.match(hub,/const items=\[\.\.\.CATALOG,\.\.\.extra\]/);
 assert.match(hub,/PEDIA_CATEGORIES\.map\(topic=><Link/);
 assert.match(hub,/href=\{'\/'\+locale\+'\/pedia\/topic\/'\+topic.id\}/);
 assert.match(catalog,/href=\{'\/'\+locale\+'\/pedia\/'\+item.slug\}/);
 assert.doesNotMatch(catalog,/fetch\(/,'initial catalog must not depend on a client-side fetch');
 assert.match(catalog,/item.title.uk,item.title.en,item.summary.uk,item.summary.en/);
 const routes=source('apps/web/app/[locale]/pedia/page.tsx');
 assert.match(routes,/indexRobots\(\)/);
 assert.match(routes,/alternates:\{canonical:/);
 const sitemap=source('apps/web/app/sitemap.ts');
 assert.match(sitemap,/PEDIA_CATEGORIES\.map/);
 assert.match(sitemap,/PEDIA_ARTICLES\.map/);
});

test('SEO topical breadcrumb links on original guides and preserved Academy lessons',()=>{
 for(const file of ['apps/web/app/components/PediaGuide.tsx','apps/web/app/[locale]/pedia/[slug]/page.tsx']){
  const code=source(file);
  assert.match(code,/className="as-pedia-breadcrumb"/);
  assert.match(code,/href=\{'\/'\+locale\+'\/pedia\/topic\/'/);
 }
 const styles=source('apps/web/app/pedia.css');
 assert.match(styles,/\.as-pedia-search-panel/);
 assert.match(styles,/\.as-pedia-result-grid/);
 assert.match(styles,/@media\(max-width:650px\)/);
 assert.match(styles,/\.as-pedia-breadcrumb/);
 assert.match(source('apps/web/app/layout.tsx'),/import '\.\/pedia\.css';/);
});
