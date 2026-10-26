import test from 'node:test';
import assert from 'node:assert/strict';
import {computePersonalScore,rankPersonalNews} from '../apps/api/src/news-relevance.ts';
const at=new Date('2026-10-26T11:00:00Z');
const now=new Date('2026-10-26T14:00:00Z').getTime();
const story=(id,topic,source,score=42,tags=[topic])=>({id,topic,source,score,tags,publishedAt:at});
test('explicit topic boosts relevance with human-readable explanation',()=>{
 const selected=computePersonalScore(story('astro','jyotish','A',30,['jyotish','nakshatras']),
  ['nakshatras'],[],now);
 const world=computePersonalScore(story('astro','jyotish','A',30,['jyotish','nakshatras']),[],[],now);
 assert.ok(selected.score>world.score);
 assert.equal(selected.reason,'selected_topic');
 assert.equal(selected.matchingTag,'nakshatras');
});
test('liked stories boost related items but do not create a categorical monopoly',()=>{
 const target=story('fresh','tarot','A',50,['tarot','self-development']);
 const unrelated=story('meditate','meditation','B',50,['meditation']);
 const history=[{articleId:'original',vote:'YES',article:{topic:'tarot',tags:['tarot','self-development']}}];
 assert.ok(computePersonalScore(target,[],history,now).score>computePersonalScore(unrelated,[],history,now).score);
 assert.equal(computePersonalScore(target,[],history,now).reason,'similar_to_liked');
});
test('negative feedback hides the disliked article only; related topics may remain',()=>{
 const set=[story('no','yoga','X'),story('related','yoga','Y'),story('tarot','tarot','Z')];
 const feedback=[{articleId:'no',vote:'NO',article:{topic:'yoga',tags:['yoga']}}];
 const result=rankPersonalNews(set,['yoga'],feedback,now);
 assert.deepEqual(result.map(x=>x.id).sort(),['related','tarot']);
});
test('cold-start personal list uses global diversity ordering and is deterministic',()=>{
 const list=Array.from({length:18},(_,i)=>story('n'+i,i<10?'tarot':'yoga',i<10?'Publisher A':'Publisher B',90-i));
 const a=rankPersonalNews(list,[],[],now);
 const b=rankPersonalNews(list,[],[],now);
 assert.deepEqual(a.map(x=>x.id),b.map(x=>x.id));
 assert.equal(a[3].source,'Publisher B');
 assert.equal(new Set(a.map(x=>x.id)).size,list.length);
});
test('at least one fresh off-topic item enters the first five when choices are narrow',()=>{
 const set=Array.from({length:12},(_,i)=>story('t'+i,'tarot','Source'+i,90-i));
 set.push(story('discover','meditation','Different',70));
 const ordered=rankPersonalNews(set,['tarot'],[],now);
 assert.equal(ordered.length,set.length);
 assert.equal(ordered[4].id,'discover');
 assert.equal(ordered[4].personalReason,'fresh_discovery');
});
test('no feedback only ever reads explicit vote data; selected topic has no birth or journal inputs',()=>{
 const list=[story('a','jyotish','A'),story('b','tarot','B')];
 assert.doesNotThrow(()=>rankPersonalNews(list,['tarot'],[],now));
 assert.equal(rankPersonalNews(list,['tarot'],[],now)[0].id,'b');
});
