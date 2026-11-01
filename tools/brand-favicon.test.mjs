import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const svg=readFileSync(new URL('../apps/web/app/icon.svg',import.meta.url),'utf8');
const layout=readFileSync(new URL('../apps/web/app/layout.tsx',import.meta.url),'utf8');

test('Galaxiora SVG is a legible cosmic G disc with transparent corners and no crescent',()=>{
 assert.match(svg,/<svg[^>]+viewBox="0 0 64 64"/);
 assert.match(svg,/<circle cx="32" cy="32" r="30" fill="url\(#space\)"/);
 assert.match(svg,/<path d="M44\.5 19\.5/);
 assert.match(svg,/stroke="url\(#orbit\)"/);
 assert.match(svg,/small star|The star/);
 assert.doesNotMatch(svg,/<rect\b|<image\b|<foreignObject\b/i);
 assert.doesNotMatch(svg,/moon|crescent|pівмісяц/i);
 assert.match(svg,/<title id="title">Galaxiora/);
});
test('All search/browser/mobile icons use a consistent version and public paths',()=>{
 for(const path of ['/favicon.ico','/galaxiora-favicon.png','/icon.svg?v=cosmic-g-20261101','/apple-touch-icon.png','/site.webmanifest'])
  assert.ok(layout.includes(path),'missing metadata: '+path);
 assert.ok(layout.includes("logo:{'@type':'ImageObject',url:siteUrl+'/galaxiora-logo-128.png'"));
 assert.doesNotMatch(layout,/galaxiora-round-gold-v3-20261027/);
});
