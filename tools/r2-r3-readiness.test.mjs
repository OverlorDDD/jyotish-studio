import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {editorialPreviewState,hasEditorialEvidence} from '../apps/api/src/news-editorial-coverage.ts';
import {selectedNewsSources} from '../apps/api/src/news-sources.ts';
import {publicIndexingEnabled,publicSiteOrigin,SEO_PATHS} from '../apps/web/lib/site-indexing.ts';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('a missing summary without publisher facts must not become invented AI news',()=>{
 const noEvidence={titleUk:'Перекладений заголовок',summaryUk:null,summaryKind:'no_context',feedDescription:null};
 assert.equal(editorialPreviewState(noEvidence),'missing_source_facts');
 assert.equal(hasEditorialEvidence(noEvidence),false);
 const boiler={...noEvidence,feedDescription:'Read the original article for all the facts and background of this story'};
 assert.equal(editorialPreviewState(boiler),'missing_source_facts');
});

test('previously no_context articles with new publisher facts rejoin translation gate',()=>{
 const facts='The article explains how a particular yoga school plans a public event and describes the date and exact programme.';
 const article={titleUk:'Український заголовок',summaryUk:null,summaryKind:'no_context',feedDescription:facts};
 assert.equal(editorialPreviewState(article),'translation_pending');
 assert.equal(editorialPreviewState({...article,summaryKind:'source_excerpt',feedDescription:null,summary:facts}),'translation_pending');
 assert.equal(editorialPreviewState({...article,summaryUk:'Точний анонс за матеріалом джерела.'}),'ready');
 assert.match(source('apps/api/src/news-editorial.ts'),/hasEditorialEvidence\(x\)/);
 assert.match(source('tools/news-release-gate.mjs'),/counts\.translation_pending/);
 assert.match(source('tools/news-release-gate.mjs'),/CONTENT_READY/);
});

test('an unhealthy publisher can be quarantined reversibly without dropping healthy feeds',()=>{
 const normal=selectedNewsSources({NEWS_SOURCE_DISABLED_KEYS:''});
 const disabled=selectedNewsSources({NEWS_SOURCE_DISABLED_KEYS:'elephant-journal,gdelt-vedic-jyotish'});
 assert.equal(normal.rss.length,22);
 assert.equal(normal.gdelt.length,13);
 assert.equal(disabled.rss.length,normal.rss.length-1);
 assert.equal(disabled.gdelt.length,normal.gdelt.length-1);
 assert.ok(disabled.disabled.includes('elephant-journal'));
 assert.match(source('apps/api/src/news-ingestion.ts'),/selectedNewsSources\(\)/);
 assert.match(source('tools/news-release-gate.mjs'),/disabledSourceKeys/);
});

test('SEO readiness keeps all private and temporary origins nonindexable',()=>{
 const u=process.env.NEXT_PUBLIC_SITE_URL,n=process.env.SITE_NOINDEX;
 try{
  process.env.SITE_NOINDEX='0';
  for(const hostname of ['https://temp.ngrok-free.dev','https://one.trycloudflare.com','http://localhost:3000']){
   process.env.NEXT_PUBLIC_SITE_URL=hostname;
   assert.equal(publicSiteOrigin(),null);
   assert.equal(publicIndexingEnabled(),false);
  }
  process.env.NEXT_PUBLIC_SITE_URL='https://galaxiora.example';
  assert.equal(publicIndexingEnabled(),true);
  process.env.SITE_NOINDEX='1';
  assert.equal(publicIndexingEnabled(),false);
 }finally{
  if(u===undefined)delete process.env.NEXT_PUBLIC_SITE_URL;else process.env.NEXT_PUBLIC_SITE_URL=u;
  if(n===undefined)delete process.env.SITE_NOINDEX;else process.env.SITE_NOINDEX=n;
 }
 assert.ok(SEO_PATHS.includes('methodology'));
 const robot=source('apps/web/app/robots.ts');
 assert.match(robot,/OAI-SearchBot/);
 assert.match(robot,/\/uk\/personal/);
});

test('R3 serves bilingual canonical methodology and only factual structured articles',()=>{
 const method=source('apps/web/app/[locale]/methodology/page.tsx');
 assert.match(method,/methodology/);
 assert.match(method,/generateMetadata/);
 assert.match(method,/JQA-3/);
 assert.match(method,/alternates/);
 assert.match(source('apps/web/app/components/PortalShell.tsx'),/methods and accuracy|Methods and accuracy/);
 assert.match(source('apps/web/app/sitemap.ts'),/SEO_PATHS/);
 const schema=source('apps/web/lib/seo-structured.ts');
 assert.match(schema,/publicIndexingEnabled\(\)/);
 assert.match(schema,/Article/);
 assert.doesNotMatch(schema,/'@type':'FAQPage'/);
 assert.match(source('apps/web/app/[locale]/learn/[slug]/page.tsx'),/articleStructuredData/);
 assert.match(source('apps/web/app/components/EditorialArticle.tsx'),/articleStructuredData/);
});

test('R2 safe audit does not reset a database or disclose secrets',()=>{
 const audit=source('tools/r2-production-audit.mjs');
 assert.match(audit,/PREVIEW_CONFIG_READY/);
 assert.match(audit,/SESSION_COOKIE_SECURE/);
 assert.match(audit,/tools\/backup-db.ps1/);
 assert.doesNotMatch(audit,/migrate reset|compose down -v|force-reset/);
 const index=source('tools/r3-indexnow.mjs');
 assert.match(index,/--submit/);
 assert.match(index,/publicIndexingEnabled\(\)/);
 assert.match(index,/keyLocation/);
});
