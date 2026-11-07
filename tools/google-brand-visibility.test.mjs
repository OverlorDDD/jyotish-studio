import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Google can identify Galaxiora on the hostname homepage without a root noindex',()=>{
 const root=read('apps/web/app/page.tsx');
 assert.match(root,/robots:indexRobots\(\)/);
 // GP1: the canonical hostname root is an indexable EN natal page.
 assert.ok(root.includes("canonical:'/'"));
 assert.ok(root.includes("uk:'/uk/astrology/jyotish'"));
 assert.ok(root.includes("Free Vedic Birth Chart Calculator"));
 assert.ok(root.includes("robots:indexRobots()"));
 const layout=read('apps/web/app/layout.tsx');
 assert.match(layout,/'@type':'WebSite'/);
 assert.match(layout,/'@type':'Organization'/);
 assert.match(layout,/alternateName:\['galaxiora.com','Галаксіора'\]/);
});
test('Google sees a stable PNG icon at root and a legitimate brand logo',()=>{
 const layout=read('apps/web/app/layout.tsx');
 assert.ok(layout.includes("icon:[{url:'/galaxiora-favicon.png',type:'image/png',sizes:'64x64'}]"));
 assert.doesNotMatch(layout,/shortcut:\s*['"]/);
 assert.doesNotMatch(layout,/url:'\/favicon\.ico'/);
 assert.doesNotMatch(layout,/galaxiora-favicon\.png\?v=|cosmic-g-20261101/);
 assert.match(layout,/galaxiora-logo-128\.png/);
 const png=readFileSync(new URL('../apps/web/public/galaxiora-favicon.png',import.meta.url));
 assert.equal(png.readUInt32BE(16),64);
 assert.equal(png.readUInt32BE(20),64);
 assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
});
