import test from 'node:test';
import assert from 'node:assert/strict';
import {editorialDecision,publisherDomain,parseXml,classify} from '../apps/api/src/news-domain.ts';
import {parseArticleMeta} from '../apps/api/src/news-metadata.ts';
test('publisher discovery works for independent mainstream publishers and canonical domains',()=>{
 assert.equal(publisherDomain('https://www.guardian.example/culture/tarot?utm_source=x'),'guardian.example');
 assert.equal(publisherDomain('https://127.0.0.1/secret'),null);
 const item={url:'https://daily.example.com/culture/tarot',title:'Tarot symbolism in contemporary cultural practice',publishedAt:new Date(),source:'Daily',language:'en'};
 assert.equal(classify(item)?.topic,'tarot');
});
test('hostile commentary rejected; neutral astrology news accepted; uncertain opinion needs review',()=>{
 assert.equal(editorialDecision('Astrology is a pseudoscience: why horoscopes are nonsense'),'REJECT');
 assert.equal(editorialDecision('Debunking tarot myths and debunking astrology'),'REJECT');
 assert.equal(editorialDecision('The problem with horoscopes and how people read them'),'REVIEW');
 assert.equal(editorialDecision('A new exhibition explores the symbolism of Tarot cards'),'ACCEPT');
});
test('publisher metadata yields factual preview information without article body scraping',()=>{
 const html='<head><meta property="og:description" content="A museum opened an exhibition exploring the history of Tarot iconography and its role in contemporary culture.">'+
  '<meta property="og:image" content="/assets/tarot-card.jpg"><meta name="description" content="Other"></head><body>FULL ARTICLE TEXT NOT COLLECTED</body>';
 const result=parseArticleMeta(html,'https://culture.example.org/stories/tarot');
 assert.match(result.description,/museum opened/);
 assert.equal(result.imageUrl,'https://culture.example.org/assets/tarot-card.jpg');
 assert.doesNotMatch(result.description,/FULL ARTICLE/);
});
test('RSS preview thumbnail remains linked as external publisher media and falls back without an image',()=>{
 const xml='<rss><channel><item><title>Yoga practice connects mindful movement and breath</title><link>https://magazine.example.com/yoga</link><pubDate>Mon, 26 Oct 2026 10:00:00 GMT</pubDate><enclosure url="https://cdn.magazine.example.com/images/yoga.webp" type="image/webp"/></item></channel></rss>';
 const c=parseXml(xml,'Magazine')[0];
 assert.ok(c.imageFeedPreview);
 assert.equal(classify(c)?.imageUrl,'https://cdn.magazine.example.com/images/yoga.webp');
});
