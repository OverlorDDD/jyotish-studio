import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceCooldownMs,gdeltCircuitFailure} from '../apps/api/src/news-source-health.ts';
import {RSS_SOURCES} from '../apps/api/src/news-sources.ts';
test('broken RSS URLs are replaced with publisher-indexed candidate feeds',()=>{
 const astrology=RSS_SOURCES.find(s=>s.key==='astrosage');
 const vedic=RSS_SOURCES.find(s=>s.key==='astroved');
 assert.equal(astrology?.url,'https://horoscope.astrosage.com/feed');
 assert.equal(vedic?.url,'https://astroved.com/blogs/feed');
 assert.equal(RSS_SOURCES.some(s=>s.key==='astrology-weekly'),false);
 assert.equal(RSS_SOURCES.some(s=>s.key==='indastro'),false);
});
test('persistent HTTP 404 and transient network failures receive independent backoff',()=>{
 assert.equal(sourceCooldownMs('Error: HTTP 404'),24*60*60*1000);
 assert.equal(sourceCooldownMs('Error: HTTP 500'),45*60*1000);
 assert.equal(sourceCooldownMs('TypeError: fetch failed'),30*60*1000);
 assert.equal(sourceCooldownMs('TimeoutError: aborted',2),60*60*1000);
 assert.ok(sourceCooldownMs('HTTP 429')>=60*60*1000);
});
test('GDELT circuit opens for provider outages but not off-topic article rejection',()=>{
 assert.equal(gdeltCircuitFailure('TimeoutError: aborted'),true);
 assert.equal(gdeltCircuitFailure('Error: HTTP 429'),true);
 assert.equal(gdeltCircuitFailure('article rejected off_topic'),false);
});
