import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const svg=readFileSync(new URL('../apps/web/app/icon.svg',import.meta.url),'utf8');
const layout=readFileSync(new URL('../apps/web/app/layout.tsx',import.meta.url),'utf8');
test('Galaxiora browser logo has a transparent square canvas with a circular badge, not an opaque tile',()=>{
 assert.match(svg,/<svg[^>]+viewBox="0 0 64 64"/);
 assert.match(svg,/<circle cx="32" cy="32" r="30" fill="url\(#cosmos\)"\s*\/>/);
 assert.match(svg,/<circle cx="32" cy="32" r="29\.15" fill="none"/);
 assert.doesNotMatch(svg,/<rect\b/i);
 assert.doesNotMatch(svg,/<image\b/i);
 assert.doesNotMatch(svg,/<foreignObject\b/i);
 assert.match(svg,/<title id="title">Galaxiora/);
 assert.match(svg,/<radialGradient id="cosmos"/);
 assert.match(svg,/<linearGradient id="gold"/);
});
test('Next.js icon/shortcut both use an updated, non-opaque cache key',()=>{
 const links=layout.match(/\/icon\.svg\?v=galaxiora-round-gold-v3-20261027/g)||[];
 assert.equal(links.length,2);
 assert.doesNotMatch(layout,/galaxiora-opaque-solid/);
});
