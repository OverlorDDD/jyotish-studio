import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalUrl,classify,classifyWithReason,parseXml,rank,TOPICS,articlePreview,cleanDescription,diversify} from '../apps/api/src/news-domain.ts';
const now=new Date();
const candidate=(title,url='https://example.org/articles/planet?utm_source=news')=>({title,url,publishedAt:now,source:'Publisher',language:'en'});
test('URL canonicalization blocks unsafe locations and tracking query parameters',()=>{
 assert.equal(canonicalUrl('https://example.org/articles/planet?utm_source=news'),'https://example.org/articles/planet');
 for(const link of ['javascript:alert(1)','http://example.org/a','https://localhost/a','https://127.0.0.1/a','https://user:pass@example.org/a'])
  assert.equal(canonicalUrl(link),null);
});
test('GalaxiNews ranking separates astrology from astronomy and filters unrelated/sensational titles',()=>{
 assert.equal(classify(candidate('New tarot cards explained by traditional readers'))?.topic,'tarot');
 assert.equal(classify(candidate('Vedic astrology and Jyotish natal chart learning'))?.topic,'jyotish');
 assert.equal(classify(candidate('Scientists discover new telescope astronomy features'))?.topic,'astronomy');
 assert.equal(classify(candidate('Astrology is a pseudoscience, horoscope debunked')),null);
 assert.equal(classify(candidate('Football championships announced for next week')),null);
 assert.equal(classify(candidate('Yoga philosophy and mindful practice in India'))?.topic,'yoga');
 assert.equal(classify({...candidate('New tarot cards explained by traditional readers'),publishedAt:new Date(0)}),null);
 assert.equal(TOPICS.length,8);
 assert.ok(rank(55,now)>rank(55,new Date(now.getTime()-86400000)));
});
test('RSS and Atom parse source-linked entries; reject entity injection and malformed content',()=>{
 const xml='<rss><channel><item><title><![CDATA[Traditional Tarot wisdom for new readers]]></title><link>https://example.org/tarot</link><pubDate>Sat, 24 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>';
 assert.equal(parseXml(xml,'Publisher')[0].title,'Traditional Tarot wisdom for new readers');
 assert.equal(parseXml(xml,'Publisher')[0].url,'https://example.org/tarot');
 const atom='<feed><entry><title>Vedic Astrology this week</title><link href="https://example.org/astro"/><updated>2026-10-24T10:00:00Z</updated></entry></feed>';
 assert.equal(parseXml(atom,'Publisher')[0].url,'https://example.org/astro');
 assert.deepEqual(parseXml('<!DOCTYPE root [<!ENTITY a SYSTEM "file:///etc/passwd">]>'+xml,'Publisher'),[]);
});

test('RSS description is sanitized; title-only preview never hallucinates article details',()=>{
 const a=candidate('Tarot reading and symbolism in daily practice');
 const titleOnly=classify(a);
 assert.equal(titleOnly.summaryKind,'title_context');
 assert.match(titleOnly.summary,/headline/);
 assert.ok(titleOnly.ukFallback.includes('першоджерелі'));
 const withExcerpt=classify({...a,allowSnippet:true,description:'<p>We review three Tarot spreads and explain the symbolic positions of each card in the reader’s journey.</p>'});
 assert.equal(withExcerpt.summaryKind,'source_excerpt');
 assert.ok(withExcerpt.summary.includes('We review'));
 assert.equal(withExcerpt.summary.includes('<p>'),false);
 assert.equal(cleanDescription('<script>bad()</script><b>Safe&nbsp;reading</b>'),'Safe reading');
 const xml='<rss><channel><item><title><![CDATA[Traditional Tarot spreads explained for beginners]]></title><link>https://example.org/tarot</link><pubDate>Sat, 24 Oct 2026 10:00:00 GMT</pubDate><description><![CDATA[<p>Three practical Tarot spreads are introduced and their placements are explained to newcomers.</p>]]></description></item></channel></rss>';
 assert.match(parseXml(xml,'Publisher')[0].description,/Three practical Tarot/);
 assert.doesNotMatch(parseXml(xml,'Publisher')[0].description,/<p>/);
});
test('quality classifier documents source rejection reasons',()=>{
 assert.equal(classifyWithReason(candidate('Football championships announced for next week')).reason,'off_topic');
 assert.equal(classifyWithReason(candidate('Tarot news for beginners','http://example.org/a')).reason,'invalid_url');
 assert.equal(classifyWithReason({...candidate('Tarot reading for new visitors'),publishedAt:new Date(0)}).reason,'date_out_of_range');
});
test('publisher diversity ensures the first few articles do not all come from one publisher',()=>{
 const ranked=[{source:'A',id:1},{source:'A',id:2},{source:'A',id:3},{source:'A',id:4},{source:'B',id:5},{source:'C',id:6}];
 assert.deepEqual(diversify(ranked,2).map(x=>x.id),[1,2,5,6,3,4]);
});
