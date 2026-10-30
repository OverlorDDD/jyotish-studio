import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const uiFiles=[
 'apps/web/lib/brand.ts','apps/web/app/layout.tsx','apps/web/app/components/PortalShell.tsx',
 'apps/web/app/components/PortalHome.tsx','apps/web/app/components/PortalSection.tsx',
 'apps/web/app/astrology/jyotish/page.tsx','apps/web/public/demo.html',
 'apps/web/app/[locale]/page.tsx','apps/web/app/[locale]/[section]/page.tsx',
 'apps/web/app/[locale]/astrology/jyotish/page.tsx'
];

test('Galaxiora is the single public brand; no old public brand remains',()=>{
 const brand=read('apps/web/lib/brand.ts');
 assert.match(brand,/name: 'Galaxiora'/);
 assert.match(brand,/moduleSuffixes:/);
 assert.match(brand,/moduleTitle=/);
 for(const file of uiFiles){
  const contents=read(file);
  assert.doesNotMatch(contents,/AstraNira|ASTRANIRA|Jyotish Studio|JYOTISH STUDIO/);
 }
});

test('Public homepage and sections display module-branded names',()=>{
 const home=read('apps/web/app/components/PortalHome.tsx');
 const section=read('apps/web/app/components/PortalSection.tsx');
 const shell=read('apps/web/app/components/PortalShell.tsx');
 assert.ok(home.includes('moduleTitle(card.slug'));
 assert.ok(section.includes('moduleTitle(section)'));
 assert.ok(shell.includes('{BRAND.name}'));
 for(const suffix of ['Astro','Tarot','Experts','Yoga','Academy','Jyotish']){
  assert.ok(read('apps/web/lib/brand.ts').includes("'"+suffix+"'"),suffix);
 }
});

test('Localized search metadata includes Galaxiora without duplicating default suffix',()=>{
 const root=read('apps/web/app/layout.tsx');
 assert.ok(root.includes("template:'%s'"));
 assert.ok(root.includes('BRAND.name'));
 const home=read('apps/web/app/[locale]/page.tsx');
 assert.ok(home.includes('BRAND.name'));
 const sections=read('apps/web/app/[locale]/[section]/page.tsx');
 assert.ok(sections.includes('moduleTitle(section)'));
 const vedic=read('apps/web/app/[locale]/astrology/jyotish/page.tsx');
 assert.ok(vedic.includes("moduleTitle('jyotish')"));
});

test('Working Jyotish Engine and public API routes retain their technical identity',()=>{
 const page=read('apps/web/app/astrology/jyotish/page.tsx');
 const shell=read('apps/web/app/components/PortalShell.tsx');
 assert.ok(shell.includes('BRAND.name'));
 assert.ok(page.includes('jy-portal-workbench'));
 assert.ok(page.includes('GalaxiAstro'));
 assert.ok(!page.includes('Galaxiora home'));
 const api=read('apps/api/src/nest.ts');
 assert.ok(api.includes('JyotishController'));
 assert.ok(api.includes('TarotController'));
});
