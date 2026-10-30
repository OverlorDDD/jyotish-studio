import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalUrl,classify,classifyWithReason,parseXml,rank,TOPICS,INTEREST_TAGS,articlePreview,cleanDescription,diversify,safeImageUrl} from '../apps/api/src/news-domain.ts';
import {generateNewsMicrocopy} from '../apps/api/src/news-editorial.ts';
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
 assert.equal(titleOnly.summaryKind,'needs_editorial');
 assert.equal(titleOnly.summary,'');
 assert.equal(titleOnly.ukFallback,undefined);
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

test('RSS image metadata respects article-level license and safe URL constraints',()=>{
 const when='Sat, 24 Oct 2026 10:00:00 GMT';
 const xml='<rss xmlns:media="http://search.yahoo.com/mrss/"><channel><item><title>Tarot reading inspiration for beginners</title><link>https://example.org/tarot</link><pubDate>'+when+'</pubDate><media:thumbnail url="https://assets.example.org/cover.jpg"/><media:license>https://creativecommons.org/licenses/by/4.0/</media:license></item></channel></rss>';
 const item=parseXml(xml,'Publisher')[0];
 assert.equal(item.imageUrl,'https://assets.example.org/cover.jpg');
 const checked=classify(item);
 assert.equal(checked?.imageUrl,'https://assets.example.org/cover.jpg');
 assert.equal(safeImageUrl('https://assets.example.org/photo.svg','https://creativecommons.org/licenses/by/4.0/'),null);
 assert.equal(safeImageUrl('http://localhost/pic.jpg','https://creativecommons.org/licenses/by/4.0/'),null);
 assert.equal(safeImageUrl('https://assets.example.org/cover.jpg',''),null);
});
test('machine translation never fabricates article details when publisher supplies only a title',async()=>{
 const prev=process.env.NEWS_TRANSLATION_ENABLED,scope=process.env.NEWS_TRANSLATION_CONTENT_SCOPE;
 delete process.env.NEWS_TRANSLATION_ENABLED;
 process.env.NEWS_TRANSLATION_CONTENT_SCOPE='full';
 const inputs=[
  {id:'a',title:'Tarot Symbolism',feedDescription:'',summary:null,summaryKind:'needs_editorial',language:'en'},
  {id:'b',title:'Venus Retrograde in Birth Charts',feedDescription:'The discussion compares natal Venus retrograde configurations and reviews recurring patterns in western astrology.',summary:null,summaryKind:'needs_editorial',language:'en'}
 ];
 const calls=[];
 const fake=async(url,opts)=>{
  assert.equal(url,'http://127.0.0.1:5100/translate');
  const req=JSON.parse(opts.body);calls.push(req.q);
  const text=req.q.includes('Tarot')?'Символіка Таро':
   req.q.includes('Venus Retrograde')?'Ретроградна Венера у натальних картах':
   'Обговорення порівнює положення ретроградної Венери у натальних картах і повторювані астрологічні цикли.';
  return new Response(JSON.stringify({translatedText:text}),{status:200});
 };
 try{
  const translated=await generateNewsMicrocopy(inputs,fake);
  assert.equal(translated.length,2);
  assert.equal(translated[0].titleUk,'Символіка Таро');
  assert.equal(translated[0].summaryUk,'');
  assert.match(translated[1].summaryUk,/Венери/);
  assert.equal(calls.length,3,'two titles plus only the factual description');
  assert.ok(calls.every(x=>!x.includes('birth data')));
 }finally{
  if(prev===undefined)delete process.env.NEWS_TRANSLATION_ENABLED;else process.env.NEWS_TRANSLATION_ENABLED=prev;
  if(scope===undefined)delete process.env.NEWS_TRANSLATION_CONTENT_SCOPE;else process.env.NEWS_TRANSLATION_CONTENT_SCOPE=scope;
 }
});

test('extra interest tags are additive and do not break existing news categories',()=>{
 assert.equal(TOPICS.length,8);
 assert.equal(INTEREST_TAGS.length,12);
 const natal=classify(candidate('Vedic astrology and the natal birth chart traditions'));
 assert.equal(natal?.topic,'jyotish');
 assert.ok(natal.tags.includes('natal-charts'));
 const mantra=classify(candidate('Yoga mantras in daily pranayama breathwork practice'));
 assert.equal(mantra?.topic,'yoga');
 assert.ok(mantra.tags.includes('mantras'));
 assert.ok(mantra.tags.includes('pranayama'));
});
