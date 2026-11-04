import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sameNewsEvent,collapseNewsEvents,newsQualitySnapshot} from '../apps/api/src/news-quality.ts';
const clock=new Date('2026-10-26T10:00:00Z');
const item=(id,title,topic='tarot',source='Publisher A',hours=0)=>({
 id,title,topic,source,publishedAt:new Date(clock.getTime()+hours*3600000),
 titleUk:null,imageUrl:null,summaryUk:null,summaryEn:null,publishedAccuracy:'published'
});
test('overlapping publisher events collapse without erasing provenance or changing order',()=>{
 const a=item('a','Museum exhibition explores historic tarot symbolism and printed card artwork');
 const b=item('b','Historic tarot symbolism and printed card artwork explored in museum exhibition','tarot','Publisher B',1);
 const c=item('c','Tarot spreads for learners comparing different card positions');
 assert.equal(sameNewsEvent(a,b),true);
 assert.deepEqual(collapseNewsEvents([a,b,c]).map(x=>x.id),['a','c']);
 assert.deepEqual(collapseNewsEvents([b,a,c]).map(x=>x.id),['b','c']);
});
test('cross-language match needs a shared localized headline',()=>{
 const a={...item('a','A museum presents important historic Tarot illustrations'),
  titleUk:'Музей представляє історичні ілюстрації карт Таро та їхню символіку'};
 const b=item('b','Музей представляє історичні ілюстрації карт Таро та їхню символіку','tarot','Publisher B',1);
 assert.equal(sameNewsEvent(a,b),true);
 assert.equal(sameNewsEvent(a,item('c','New Rider Waite tarot reading guide')),false);
});
test('protect distinct events, topics, dates and future stale duplicate replay',()=>{
 const a=item('a','October Venus retrograde transit in Scorpio across natal houses','astrology');
 const b=item('b','November Venus retrograde transit in Scorpio across natal houses','astrology','B',1);
 assert.equal(sameNewsEvent(a,b),false);
 assert.equal(sameNewsEvent(a,item('c',a.title,'astrology','B',120)),false);
 assert.equal(sameNewsEvent(a,item('d',a.title,'jyotish','B')),false);
});
test('bounded quality counts are factual and work with empty feeds',()=>{
 const a=item('a','Museum exhibition explores historic tarot symbolism and printed card artwork');
 const b=item('b','Historic tarot symbolism and printed card artwork explored in museum exhibition','tarot','B',1);
 const q=newsQualitySnapshot([a,b],clock.getTime()+7200000);
 assert.equal(q.duplicatePresentationsAvoided,1);
 assert.equal(q.visibleAfterGrouping,1);
 assert.equal(q.within48Hours,2);
 assert.equal(q.noApprovedImage,2);
 assert.equal(q.sampledPublishers,2);
 assert.equal(newsQualitySnapshot([]).sampledArticles,0);
});

test('public feed rechecks legacy media rights and admin UI shows bounded quality',()=>{
 const source=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
 assert.ok(source('apps/api/src/news.ts').includes('imageUrl:rest.imageUrl?safeImageUrl'));
 assert.ok(source('apps/web/app/components/NewsDiagnostics.tsx').includes('data-testid="news-quality-summary"'));
});
