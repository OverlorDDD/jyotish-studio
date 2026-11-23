import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('the initial render uses local DM Sans and Playfair Display with font swapping',()=>{
 const root=read('apps/web/app/layout.tsx');
 const css=read('apps/web/app/globals.css');
 assert.doesNotMatch(root+css,/fonts\.(googleapis|gstatic)\.com/);
 assert.match(root,/@fontsource\/playfair-display\/600\.css/);
 const fonts=read('apps/web/app/fonts.css');
 assert.match(root,/import ['"]\.\/fonts\.css['"]/);
 assert.match(fonts,/font-family:\s*['"]DM Sans['"]/);
 assert.match(fonts,/font-display:\s*swap/);
 assert.match(fonts,/dm-sans-latin-wght-normal\.woff2/);
 assert.match(fonts,/dm-sans-latin-ext-wght-normal\.woff2/);
});

test('PSI: route-only CSS is not bundled into all pages',()=>{
 const root=read('apps/web/app/layout.tsx');
 const pedia=read('apps/web/app/[locale]/pedia/layout.tsx');
 const portfolio=read('apps/web/app/[locale]/about-me/layout.tsx');
 assert.doesNotMatch(root,/import\s+['"]\.\/pedia\.css['"]/);
 assert.doesNotMatch(root,/import\s+['"]\.\/portfolio\.css['"]/);
 assert.match(pedia,/import\s+['"]\.\.\/\.\.\/pedia\.css['"]/);
 assert.match(portfolio,/import\s+['"]\.\.\/\.\.\/portfolio\.css['"]/);
 assert.match(read('apps/web/app/pedia.css'),/\.as-pedia\{/);
 assert.match(read('apps/web/app/portfolio.css'),/\.dp-page\{/);
});

test('PSI: globally reused city input exposes supported ARIA combobox semantics',()=>{
 const city=read('apps/web/app/components/CitySearch.tsx');
 assert.match(city,/role="combobox"/);
 assert.match(city,/aria-autocomplete="list"/);
 assert.match(city,/aria-expanded=\{expanded\}/);
 assert.match(city,/aria-controls=\{expanded\?listId:undefined\}/);
 assert.match(city,/aria-activedescendant=/);
 assert.match(city,/role="listbox"/);
 assert.match(city,/role="option"/);
 assert.match(city,/e\.key==='ArrowDown'/);
 assert.match(city,/e\.key==='ArrowUp'/);
 assert.match(city,/e\.key==='Enter'/);
 assert.match(city,/e\.key==='Escape'/);
 assert.match(city,/onChoose\(city\)/);
});
