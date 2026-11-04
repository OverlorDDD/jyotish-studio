import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ORGANIC_INTENTS} from '../apps/web/lib/organic-intents.ts';
import {PEDIA_ARTICLES} from '../apps/web/lib/pedia-content.ts';
import {organicContentPlan} from './g32-content-engine.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('three distinct bilingual topic bridges, no city/date programmatic factory',()=>{
 assert.deepEqual(ORGANIC_INTENTS.map(x=>x.id).sort(),['jyotish','panchanga','tarot']);
 const slugs=new Set(PEDIA_ARTICLES.map(x=>x.slug));
 for(const topic of ORGANIC_INTENTS){
  assert.ok(topic.keywords.length>=4);
  assert.equal(topic.guides.length,2);
  assert.equal(topic.steps.length,3);
  for(const lang of ['en','uk']){
   assert.ok(topic.heading[lang].length>20);
   assert.ok(topic.intro[lang].length>120);
   assert.ok(topic.steps.every(x=>x[lang].length>45));
  }
  for(const guide of topic.guides){
   assert.match(guide.path,/^(pedia\/[a-z0-9-]+|tarot\/cards(?:\/moon)?)$/);
   if(guide.path.startsWith('pedia/'))assert.ok(slugs.has(guide.path.slice(6)),guide.path);
  }
 }
});
test('tool landing pages use visible crawlable links to existing guides',()=>{
 const a=read('apps/web/app/[locale]/astrology/jyotish/page.tsx');
 const p=read('apps/web/app/[locale]/panchanga/page.tsx');
 const t=read('apps/web/app/components/PortalSection.tsx');
 const c=read('apps/web/app/components/OrganicIntentBridge.tsx');
 assert.match(a,/OrganicIntentBridge kind="jyotish"/);
 assert.match(p,/OrganicIntentBridge kind="panchanga"/);
 assert.match(t,/OrganicIntentBridge kind="tarot"/);
 assert.match(c,/<Link key={guide.path}/);
 assert.match(c,/topic\.intro\[locale\]/);
 assert.doesNotMatch(c,/dangerouslySetInnerHTML|fetch\(|localStorage|analytics|Date\.now/);
});
test('content engine cannot publish or invent a new indexable page',()=>{
 const plan=organicContentPlan();
 assert.equal(plan.newIndexablePages,0);
 assert.equal(plan.publishAutomatically,false);
 assert.equal(plan.assets.length,3);
 assert.ok(plan.assets.every(x=>x.validatedGuides.every(g=>g.alreadyExists)));
 assert.equal(plan.requiresEditorialApprovalForNewPages,true);
});
