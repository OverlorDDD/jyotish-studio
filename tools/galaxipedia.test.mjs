import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ACADEMY_LESSONS} from '../apps/web/lib/academy-content.ts';
import {GLOSSARY} from '../apps/web/lib/glossary.ts';
import {PEDIA_ARTICLES,PEDIA_CATEGORIES,pediaArticleBySlug} from '../apps/web/lib/pedia-content.ts';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('GalaxiPedia retains all eight bilingual Academy lessons and their quizzes',()=>{
 assert.equal(ACADEMY_LESSONS.length,8);
 const entry=file('apps/web/app/[locale]/pedia/[slug]/page.tsx');
 for(const lesson of ACADEMY_LESSONS){
  assert.match(lesson.slug,/^[a-z0-9-]+$/);
  for(const locale of ['en','uk']){
   assert.ok(lesson.title[locale]?.length>8);
   assert.ok(lesson.quiz.prompt[locale]?.length>10);
   assert.equal(lesson.sections.length,3);
  }
 }
 assert.match(entry,/ACADEMY_LESSONS/);
 assert.match(entry,/AcademyQuiz/);
 assert.match(entry,/GalaxiComBridge/);
 assert.match(entry,/publishedDetail\('ACADEMY',slug\)/);
 assert.match(file('apps/web/app/components/EditorialArticle.tsx'),/PublishedAcademyQuiz/);
});

test('Only three original substantial guides, in both languages, with source attribution',()=>{
 assert.equal(PEDIA_ARTICLES.length,3);
 assert.equal(PEDIA_CATEGORIES.length,6);
 const distinct=new Set([...ACADEMY_LESSONS.map(x=>x.slug),...PEDIA_ARTICLES.map(x=>x.slug)]);
 assert.equal(distinct.size,11);
 for(const a of PEDIA_ARTICLES){
  assert.equal(pediaArticleBySlug(a.slug),a);
  assert.equal(a.sections.length,3);
  assert.ok(a.references.length>0);
  assert.match(a.references[0].url,/^https:\/\//);
  assert.ok(a.related.every(s=>distinct.has(s)),a.slug+' broken related entry');
  for(const lang of ['en','uk']){
   assert.ok(a.title[lang].length>20);
   assert.ok(a.summary[lang].length>90);
   for(const section of a.sections){
    assert.ok(section.title[lang].length>8);
    assert.equal(section.paragraphs.length,2);
    for(const p of section.paragraphs)assert.ok(p[lang].length>150,a.slug+':'+lang);
   }
  }
 }
});

test('One existing navigation slot and a single canonical GalaxiPedia landing',()=>{
 const shell=file('apps/web/app/components/PortalShell.tsx');
 const brand=file('apps/web/lib/brand.ts');
 const home=file('apps/web/app/components/PortalHome.tsx');
 assert.match(shell,/learn:'GalaxiPedia'/);
 assert.match(brand,/section==='learn'\?'pedia'/);
 assert.match(brand,/learn:'Pedia'/);
 assert.match(home,/slug:'learn'/);
 assert.match(file('apps/web/app/[locale]/pedia/page.tsx'),/alternates/);
 assert.match(file('apps/web/app/[locale]/pedia/glossary/page.tsx'),/indexRobots\(\)/);
 const config=file('apps/web/next.config.mjs');
 assert.match(config,/async redirects\(\)/);
 assert.match(config,/permanent:true/);
 assert.match(config,/\/learn\/:slug/);
 const legacy=file('apps/web/app/[locale]/[section]/page.tsx');
 assert.match(legacy,/permanentRedirect\('\/'\+locale\+'\/pedia'\)/);
});

test('Public crawlable, unique articles, glossary, old learn URLs removed from sitemap',()=>{
 const sitemap=file('apps/web/app/sitemap.ts');
 const indexing=file('apps/web/lib/site-indexing.ts');
 const details=file('apps/web/app/[locale]/pedia/[slug]/page.tsx');
 assert.match(sitemap,/PEDIA_ARTICLES/);
 assert.match(sitemap,/ACADEMY_LESSONS/);
 assert.match(sitemap,/academy\.map\(p=>'pedia\/'\+p\.slug\)/);
 assert.doesNotMatch(sitemap,/['"]learn\//);
 assert.match(indexing,/'pedia\/glossary'/);
 assert.match(indexing,/'pedia'/);
 assert.match(details,/articleStructuredData/);
 assert.match(details,/x-default/);
 assert.match(file('apps/web/app/components/PediaGuide.tsx'),/articleStructuredData/);
 assert.match(file('apps/web/app/components/PediaGuide.tsx'),/article\.references\.map/);
 assert.match(file('apps/web/app/components/PediaCatalog.tsx'),/published/);
});

test('Progress is pass-only and keyed by stable slug, not by language or personal data',()=>{
 const builtIn=file('apps/web/app/components/AcademyQuiz.tsx');
 const published=file('apps/web/app/components/PublishedAcademyQuiz.tsx');
 for(const source of [builtIn,published]){
  assert.match(source,/galaxiora\.pedia\.progress\.v1/);
  assert.match(source,/localStorage\.setItem/);
  assert.match(source,/localStorage\.getItem/);
  assert.match(source,/selected===quiz\.correct/);
  assert.doesNotMatch(source,/birthDate|userId|coordinates/);
 }
 assert.ok(GLOSSARY.length>=20);
 assert.match(file('apps/web/app/components/PediaGlossary.tsx'),/useMemo/);
});
