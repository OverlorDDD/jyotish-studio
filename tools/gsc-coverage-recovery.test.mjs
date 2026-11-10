import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('GSC: horoscope sign entry links use fragments, not duplicate query resources',()=>{
 const moon=read('apps/web/app/[locale]/horoscope/[sign]/page.tsx');
 const western=read('apps/web/app/[locale]/horoscope/western/[sign]/page.tsx');
 assert.ok(moon.includes("'/horoscope#vedic-'+sign"));
 assert.ok(western.includes("'/horoscope#western-'+sign"));
 assert.ok(western.includes("'/horoscope#vedic-'+sign"));
 for(const source of [moon,western]){
  assert.doesNotMatch(source,/\/horoscope\?system=/,'public links must not create additional query URL crawl targets');
 }
});

test('GSC: legacy bookmarks still select a valid horoscope system and sign',()=>{
 const hub=read('apps/web/app/components/HoroscopeHub.tsx');
 assert.ok(hub.includes('window.location.hash.slice(1).toLowerCase()'));
 assert.ok(hub.includes("const fragment=/^(vedic|western)-([a-z]+)$/"));
 assert.ok(hub.includes("params.get('system')"));
 assert.ok(hub.includes("params.get('sign')"));
 assert.ok(hub.includes("SIGN_SLUGS.indexOf("),'do not accept arbitrary sign input');
 assert.ok(hub.includes("if(index>=0){signManuallyChosen.current=true;setSelected(index+1);}"));
});

test('GSC: internal evergreen education links go directly to /pedia canonicals',()=>{
 const files=[
  'apps/web/app/components/SearchGuides.tsx',
  'apps/web/app/[locale]/horoscope/[sign]/page.tsx',
  'apps/web/app/[locale]/tarot/cards/page.tsx',
  'apps/web/app/[locale]/tarot/cards/[slug]/page.tsx',
  'apps/web/app/[locale]/yoga/[slug]/page.tsx',
  'apps/web/app/[locale]/astrology/moon-sign-vs-sun-sign/page.tsx'
 ];
 for(const file of files){
  const content=read(file);
  assert.doesNotMatch(content,/\/learn\//,'redirecting lesson alias appears in crawlable link: '+file);
 }
 const nextConfig=read('apps/web/next.config.mjs');
 assert.ok(nextConfig.includes("source:'/'+locale+'/learn/:slug'"));
 assert.ok(nextConfig.includes("destination:'/'+locale+'/pedia/:slug'"),'old incoming lesson links remain supported');
});

test('GSC: root duplicate consolidation does not accidentally noindex the localized natal tools',()=>{
 const root=read('apps/web/app/page.tsx');
 const natal=read('apps/web/app/[locale]/astrology/jyotish/page.tsx');
 const sitemap=read('apps/web/app/sitemap.ts');
 assert.ok(root.includes("canonical:'/en/astrology/jyotish'"));
 assert.ok(root.includes('robots:indexRobots()'));
 assert.ok(natal.includes("canonical:'/'+locale+'/astrology/jyotish'"));
 assert.ok(natal.includes('robots:indexRobots()'));
 assert.ok(!sitemap.includes("url:base+'/'"),'duplicate root must not compete in sitemap');
 assert.ok(sitemap.includes('return localized;'));
});

test('GSC: legal noindex and absent binary assets in sitemap are intentional',()=>{
 for(const section of ['privacy','terms']){
  const source=read('apps/web/app/[locale]/'+section+'/page.tsx');
  assert.ok(source.includes('index:false'),'legal pages should not be forced into Search: '+section);
 }
 const indexing=read('apps/web/lib/site-indexing.ts');
 assert.doesNotMatch(indexing,/['"]privacy['"]|['"]terms['"]/,'legal policy pages are not public SEO landings');
});
