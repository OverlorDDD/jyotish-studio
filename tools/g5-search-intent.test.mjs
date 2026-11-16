import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('G5: primary indexable tool matches actual Vedic chart calculator intent in EN/UK',()=>{
 const meta=read('apps/web/app/[locale]/astrology/jyotish/page.tsx');
 const hero=read('apps/web/app/astrology/jyotish/page.tsx');
 assert.match(meta,/Free Vedic Birth Chart Calculator \(16 Charts\)/);
 assert.match(meta,/Натальна карта Джйотіш онлайн/);
 assert.match(meta,/canonical:'\/'\+locale\+'\/astrology\/jyotish'/);
 assert.match(meta,/'x-default':'\/en\/astrology\/jyotish'/);
 assert.match(hero,/Free Vedic Birth Chart Calculator/);
 assert.match(hero,/Безкоштовний калькулятор натальної карти Джйотіш/);
 assert.match(hero,/Calculate my free birth chart/);
 assert.match(hero,/href="#birth-details"/);
 assert.match(hero,/D9 \(Navamsa\), D10 \(career\)/);
 assert.match(hero,/D60 has special birth-time sensitivity limits/);
});

test('G5: structured application data is public-only, factual, bilingual and private-data-free',()=>{
 const meta=read('apps/web/app/[locale]/astrology/jyotish/page.tsx');
 assert.match(meta,/publicIndexingEnabled\(\)\?publicSiteOrigin\(\):null/);
 assert.match(meta,/'@type':'WebApplication'/);
 assert.match(meta,/isAccessibleForFree:true/);
 assert.match(meta,/price:'0',priceCurrency:'USD'/);
 assert.match(meta,/inLanguage:locale/);
 assert.match(meta,/url:origin\+'\/'\+locale\+'\/astrology\/jyotish'/);
 assert.match(meta,/Provisional D60 with birth-time sensitivity limits/);
 assert.match(meta,/schema&&<script type="application\/ld\+json"/);
 assert.doesNotMatch(meta,/aggregateRating|reviewCount|ratingCount|birthDate|latitude|longitude|schema\.input/);
});

test('G5: guide retains authentic 16-chart contract and points to real calculation',()=>{
 const guide=read('apps/web/app/[locale]/astrology/divisional-charts/page.tsx');
 assert.match(guide,/D9 \(Navamsa\) for relationships/);
 assert.match(guide,/D10 \(Dashamsha\) for career/);
 assert.match(guide,/D60 is displayed as a separate provisional symbolic reference/);
 assert.match(guide,/independent JQA-3 reference checks are narrower/);
 assert.match(guide,/lang\+'\/astrology\/jyotish#birth-details'/);
 assert.match(guide,/canonical:p/);
});
