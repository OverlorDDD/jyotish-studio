import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalUrl,classify,parseXml,rank,TOPICS} from '../apps/api/src/news-domain.ts';
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
