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

// ---- GalaxiNews portal (2026-11): thumbnails, source kinds, own sky stories, slugs ----
import {readFileSync,existsSync} from 'node:fs';
import {publisherThumbUrl as portalThumb} from '../apps/api/src/news-domain.ts';
import {sourceKindFor} from '../apps/api/src/news-sources.ts';
import {skyHeadline,skyTags,skyEventFromTags} from '../apps/api/src/news-astronomy.ts';
import {storySlug,storyKey,newsTeaser,storyIndexable} from '../apps/web/lib/news-public.ts';
import {composeSkyArticle,nextEventFor} from '../apps/web/lib/news-sky.ts';
test('publisher previews are thumbnails only; large images still need a licence',()=>{
 assert.equal(portalThumb('https://www.hinduismtoday.com/wp-content/uploads/2026/11/temple.jpg'),'https://www.hinduismtoday.com/wp-content/uploads/2026/11/temple.jpg');
 for(const bad of ['http://a.org/x.jpg','https://a.org/logo.png','https://a.org/x.svg','https://secure.gravatar.com/a.jpg',null,''])
  assert.equal(portalThumb(bad),null,String(bad));
 const api=readFileSync(new URL('../apps/api/src/news.ts',import.meta.url),'utf8');
 assert.match(api,/imageUrl:licensed,thumbUrl:licensed\|\|preview/);
 const portal=readFileSync(new URL('../apps/web/app/components/news/NewsPortal.tsx',import.meta.url),'utf8');
 assert.match(portal,/Only openly licensed photos may be shown large/);
 const media=readFileSync(new URL('../apps/api/src/news-open-media.ts',import.meta.url),'utf8');
 assert.match(media,/\{imageUrl:null\},/,'stock photos never replace a publisher preview');
});
test('front page keeps reading-shop blogs out; own items are recognised',()=>{
 assert.equal(sourceKindFor({url:'https://www.hinduismtoday.com/hpi/2026/11/x',source:'Hindu Press International'}),'news');
 assert.equal(sourceKindFor({url:'https://astrotalk.com/astrology-blog/x',source:'AstroTalk Blog'}),'brand');
 assert.equal(sourceKindFor({url:'https://tricycle.org/x',source:'Tricycle'}),'magazine');
 assert.equal(sourceKindFor({url:'https://galaxiora.com/uk/panchanga',source:'Galaxiora Astronomical Calendar'}),'own');
 assert.equal(sourceKindFor({url:'https://www.reuters.com/x',source:'reuters.com'}),'news');
});
test('own sky stories: dated headline, event tags round-trip, honest tense',()=>{
 const e={kind:'direct_station',body:'Venus',atUtc:'2026-11-14T00:29:33Z',sign:6,longitude:178.629};
 assert.equal(skyHeadline(e).uk,'Венера розвертається в прямий рух 14 листопада 2026');
 assert.equal(skyHeadline({kind:'sidereal_ingress',body:'Sun',atUtc:'2026-11-16T14:12:56Z',toSign:8}).uk,'Сонце входить у знак Скорпіона 16 листопада 2026');
 assert.deepEqual(skyEventFromTags(['astronomy',...skyTags(e)]),{...e,longitude:178.629});
 assert.equal(skyEventFromTags(['astronomy','jyotish']),null);
 const next={kind:'sidereal_ingress',body:'Venus',atUtc:'2026-11-22T00:24:55Z',fromSign:6,toSign:7};
 assert.equal(nextEventFor(e,[next]),next);
 const after=composeSkyArticle(e,next,Date.parse('2026-11-15T00:00:00Z'));
 assert.match(after.lead.uk,/^Ретроградний відрізок Венери завершився на 28°38′ Діви/);
 assert.match(after.sections[1].paragraphs[0].uk,/відповідає за стосунки, красу, мистецтво/);
 assert.match(after.sections[1].paragraphs[1].uk,/ослабленні \(нічі\)/);
 assert.ok(after.facts.some(f=>/Терезів/.test(f.value.uk)));
 const before=composeSkyArticle(e,null,Date.parse('2026-11-10T00:00:00Z'));
 assert.match(before.lead.uk,/^14 листопада 2026 о 02:29 ретроградний відрізок Венери завершиться/);
 const retro=composeSkyArticle({kind:'retrograde_station',body:'Mercury',atUtc:'2026-11-30T14:00:00Z',sign:9,longitude:250.5},null,Date.parse('2026-12-01T00:00:00Z'));
 assert.match(retro.lead.uk,/Меркурій зупинився й почав/);
 assert.match(retro.lead.uk,/переглянути мову, навчання/);
 for(const kind of ['new_moon','first_quarter','full_moon','last_quarter'])assert.ok(composeSkyArticle({kind,atUtc:'2026-11-24T14:53:00Z'}));
 const ecl=composeSkyArticle({kind:'solar-eclipse',atUtc:'2027-02-06T16:00:00Z',eclipseKind:'annular',visibleHere:false},null,Date.parse('2026-11-14T00:00:00Z'));
 assert.equal(ecl.headline.uk,'Кільцеподібне сонячне затемнення 6 лютого 2027');
 assert.match(ecl.lead.uk,/З України його не видно/);
});
test('story URLs are readable, stable by key, and only own stories are indexable',()=>{
 const item={id:'98ad1bea-1234-4000-8000-000000000001',title:'Venus stations direct',titleUk:'Венера розвертається в прямий рух 14 листопада 2026',titleEn:'Venus stations direct on 14 November 2026'};
 assert.equal(storySlug(item,'uk'),'venera-rozvertaietsia-v-priamyi-rukh-14-lystopada-2026-98ad1bea');
 assert.equal(storySlug(item,'en'),'venus-stations-direct-on-14-november-2026-98ad1bea');
 assert.equal(storyKey('venera-98ad1bea'),'98ad1bea');
 assert.equal(storyKey('astrology'),null);
 assert.equal(storyIndexable({source:'Galaxiora Astronomical Calendar',sourceKind:'own'}),true);
 assert.equal(storyIndexable({source:'Hindu Press International',sourceKind:'news'}),false);
 assert.equal(newsTeaser({summaryUk:'Час події за Swiss Ephemeris: 2026-11-14T00:29Z.',language:'uk'},'uk'),null);
});

// ---- GalaxiNews rubrics, most read, forum link, metadata fetch (2026-11-14) ----
import {weekStart,duePeriods,rubricTitle,rubricRange,validRubricKey,rubricTags,rubricFromTags} from '../apps/api/src/news-rubrics.ts';
import {composeRubric} from '../apps/web/lib/news-rubric.ts';
test('rubrics publish themselves on a fixed calendar with dated titles',()=>{
 assert.equal(weekStart('2026-11-14'),'2026-11-09');
 assert.deepEqual(duePeriods('2026-11-12'),[{kind:'week',key:'2026-11-09'},{kind:'month',key:'2026-11'}]);
 assert.deepEqual(duePeriods('2026-11-14').map(p=>p.key),['2026-11-09','2026-11','2026-11-16'],'Saturday adds next week');
 assert.deepEqual(duePeriods('2026-12-24').map(p=>p.key),['2026-12-21','2026-12','2027-01'],'24th adds next month');
 assert.equal(rubricTitle('week','2026-11-16').uk,'Тиждень у небі: 16–22 листопада 2026');
 assert.equal(rubricTitle('week','2026-12-28').uk,'Тиждень у небі: 28 грудня 2026 – 3 січня 2027');
 assert.match(rubricTitle('month','2026-12').uk,/^Небо грудня 2026:/);
 assert.deepEqual(rubricRange('month','2027-02'),{start:'2027-02-01',days:28,end:'2027-03-01'});
 assert.equal(validRubricKey('week','2026-11-17'),false,'weeks start on Monday');
 assert.deepEqual(rubricFromTags(rubricTags('week','2026-11-16')),{kind:'week',key:'2026-11-16'});
 const ingestion=readFileSync(new URL('../apps/api/src/news-ingestion.ts',import.meta.url),'utf8');
 assert.match(ingestion,/publishRubrics\(this\.prisma\)/);
 assert.match(ingestion,/nextAstronomyAt=Date\.now\(\)\+6\*60\*60\*1000/);
});
test('weekly rubric page is composed only from calculated data',()=>{
 const data={kind:'week',key:'2026-11-16',start:'2026-11-16',end:'2026-11-23',days:7,
  events:[{kind:'sidereal_ingress',body:'Sun',atUtc:'2026-11-16T14:12:56Z',fromSign:7,toSign:8},
   {kind:'sidereal_ingress',body:'Moon',atUtc:'2026-11-17T10:00:27Z',fromSign:10,toSign:11},
   {kind:'first_quarter',atUtc:'2026-11-17T11:47:37Z'},
   {kind:'sidereal_ingress',body:'Venus',atUtc:'2026-11-22T11:50:00Z',fromSign:6,toSign:7}],
  keyDays:[{date:'2026-11-20',kind:'ekadashi',paksha:'Shukla'}],eclipses:[],retrogradeAtStart:['Saturn']};
 const r=composeRubric(data,e=>e.body==='Sun'?'/uk/news/sun-abcdef12':undefined,Date.parse('2026-11-15T00:00:00Z'));
 assert.equal(r.lead.uk,'Головне цього тижня: 16 листопада — Сонце входить у знак Скорпіона; 20 листопада — Екадаші (Шукла); 22 листопада — Венера входить у знак Терезів.');
 assert.deepEqual(r.days.map(d=>d.label.uk),['Понеділок, 16 листопада','Вівторок, 17 листопада','Пʼятниця, 20 листопада','Неділя, 22 листопада']);
 assert.equal(r.days[0].entries[0].href,'/uk/news/sun-abcdef12');
 assert.match(r.retro.uk,/ретроградні: Сатурн/);
 assert.ok(r.facts.some(f=>f.value.uk==='20 листопада'));
});
test('most read counts server-side document requests only, no client beacon',()=>{
 const mw=readFileSync(new URL('../apps/web/middleware.ts',import.meta.url),'utf8');
 assert.match(mw,/story:\/\^\\\/\(\?:uk\|en\)\\\/news\\\/\[a-z0-9-\]\*-\(\[0-9a-f\]\{8\}\)\$\//);
 const hit=readFileSync(new URL('../apps/api/src/visitor-analytics.ts',import.meta.url),'utf8');
 assert.match(hit,/countStoryRead\(this\.prisma,story\)/);
 const api=readFileSync(new URL('../apps/api/src/news.ts',import.meta.url),'utf8');
 assert.match(api,/if\(ranked\.length<3\)return \{items:\[\]\}/);
 assert.equal(existsSync(new URL('../apps/web/app/components/news/NewsViewBeacon.tsx',import.meta.url)),false);
});
test('forum discussion is a prefilled draft, never an automatic post',()=>{
 const com=readFileSync(new URL('../apps/web/app/components/GalaxiCom.tsx',import.meta.url),'utf8');
 assert.match(com,/\/\^\\\/\(\?:uk\|en\)\\\/news\\\/\[a-z0-9-\]\+\$\/\.test\(path\)/);
 assert.match(com,/setComposer\(true\)/);
 assert.doesNotMatch(com.slice(com.indexOf('discussPrefill')),/api<\{id:string\}>\('threads'[^]*?discussPrefill/);
});
test('article metadata: large pages are read, same-site redirects followed',()=>{
 // Network/DNS is not available in unit tests; guard the fetcher contract by source.
 const src=readFileSync(new URL('../apps/api/src/news-metadata.ts',import.meta.url),'utf8');
 assert.doesNotMatch(src,/content-length'\)\|\|0\);\s*if\(length>160000\)return \{\}/,'large pages are no longer skipped');
 assert.match(src,/redirect:'manual'/);
 assert.match(src,/to\.hostname\.replace\(\/\^www\\\.\/,''\)!==u\.hostname\.replace/);
 assert.match(src,/while\(total<140000\)/,'still reads at most 140 KB');
});
