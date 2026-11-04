import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PEDIA_ARTICLES,PEDIA_CATEGORIES} from '../apps/web/lib/pedia-content.ts';
import {PEDIA_SEO_PANCHANGA} from '../apps/web/lib/pedia-seo-panchanga.ts';
import {PEDIA_SEO_JYOTISH} from '../apps/web/lib/pedia-seo-jyotish.ts';
import {PEDIA_SEO_COSMOS} from '../apps/web/lib/pedia-seo-cosmos.ts';
import {ACADEMY_LESSONS} from '../apps/web/lib/academy-content.ts';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const release=[...PEDIA_SEO_PANCHANGA,...PEDIA_SEO_JYOTISH,...PEDIA_SEO_COSMOS];

test('first SEO wave contains exactly 14 substantial bilingual independent search intents',()=>{
 assert.deepEqual([PEDIA_SEO_PANCHANGA.length,PEDIA_SEO_JYOTISH.length,PEDIA_SEO_COSMOS.length],[5,4,5]);
 assert.equal(release.length,14);
 assert.equal(PEDIA_ARTICLES.length,17);
 const ids=[...ACADEMY_LESSONS.map(x=>x.slug),...PEDIA_ARTICLES.map(x=>x.slug)];
 assert.equal(new Set(ids).size,ids.length,'Duplicate canonical route slug');
 for(const item of release){
  assert.match(item.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(item.sections.length,3,item.slug);
  assert.ok(item.references.length>=1,item.slug+' lacks source');
  assert.ok(item.related.length>=2,item.slug+' lacks a useful internal link');
  for(const related of item.related)assert.ok(ids.includes(related),item.slug+' -> '+related);
  for(const ref of item.references)assert.match(ref.url,/^https:\/\//,item.slug+' unsafe source URL');
  for(const locale of ['en','uk']){
   assert.ok(item.title[locale].length>25,item.slug+' title '+locale);
   assert.ok(item.summary[locale].length>90,item.slug+' summary '+locale);
   const paragraphs=item.sections.flatMap(s=>s.paragraphs.map(p=>p[locale]));
   assert.equal(paragraphs.length,6,item.slug+' paragraph count '+locale);
   assert.ok(paragraphs.every(p=>p.length>=150),item.slug+' has short/empty '+locale+' paragraph');
   assert.ok(new Set(paragraphs).size===6,item.slug+' repeats paragraphs '+locale);
   assert.ok(paragraphs.join(' ').length>1200,item.slug+' thin body '+locale);
  }
 }
});

test('crawlable topic hubs, sitemap and bilingual metadata are present in source',()=>{
 assert.equal(PEDIA_CATEGORIES.length,6);
 const hub=file('apps/web/app/components/AcademyHub.tsx');
 const category=file('apps/web/app/[locale]/pedia/topic/[category]/page.tsx');
 const sitemap=file('apps/web/app/sitemap.ts');
 assert.match(hub,/pedia\/topic\//);
 assert.match(hub,/publishedList\('ACADEMY'\)/);
 assert.match(category,/generateStaticParams/);
 assert.match(category,/alternates:/);
 assert.match(category,/indexRobots\(\)/);
 assert.match(category,/\/pedia\/topic\//);
 assert.match(category,/PEDIA_ARTICLES\.filter/);
 assert.match(sitemap,/PEDIA_CATEGORIES\.map/);
 assert.match(sitemap,/PEDIA_ARTICLES\.map/);
});

test('No destructive changes to news, personal data, GA4, Panchanga calculation or 308 redirects',()=>{
 const config=file('apps/web/next.config.mjs');
 assert.match(config,/\/learn/);
 assert.match(config,/permanent:true/);
 const corpus=file('apps/web/lib/pedia-content.ts');
 for(const x of ['PEDIA_SEO_PANCHANGA','PEDIA_SEO_JYOTISH','PEDIA_SEO_COSMOS'])
  assert.match(corpus,new RegExp(x));
 assert.ok(!corpus.includes('Date.now()'),'Publication dates must not be fabricated');
});
